import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
  stripePriceId: string;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Basic fantasy analytics',
    price: 0,
    interval: 'month',
    features: [
      'Basic player stats',
      '1 league support',
      'Weekly insights',
      'Standard AI predictions'
    ],
    stripePriceId: ''
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Advanced analytics and insights',
    price: 999, // $9.99 in cents
    interval: 'month',
    features: [
      'Advanced player analytics',
      'Unlimited leagues',
      'Real-time notifications',
      'AI lineup optimization',
      'Injury predictions',
      'Trade analysis',
      'Priority support'
    ],
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID || 'price_pro_monthly'
  },
  {
    id: 'elite',
    name: 'Elite',
    description: 'Professional-grade tools',
    price: 1999, // $19.99 in cents
    interval: 'month',
    features: [
      'Everything in Pro',
      'Custom AI models',
      'Advanced ML insights',
      'API access',
      'White-label options',
      'Dedicated support',
      'Custom integrations'
    ],
    stripePriceId: process.env.STRIPE_ELITE_PRICE_ID || 'price_elite_monthly'
  }
];

export class StripeService {
  /**
   * Create a checkout session for subscription
   */
  async createCheckoutSession(
    userId: string,
    planId: string,
    successUrl: string,
    cancelUrl: string
  ): Promise<Stripe.Checkout.Session> {
    const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
    if (!plan || plan.id === 'free') {
      throw new Error('Invalid subscription plan');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const session = await stripe.checkout.sessions.create({
      customer_email: user.email,
      line_items: [
        {
          price: plan.stripePriceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId,
        planId
      },
      subscription_data: {
        metadata: {
          userId,
          planId
        }
      }
    });

    return session;
  }

  /**
   * Create a one-time payment session (for gems, battle entries, etc.)
   */
  async createPaymentSession(
    userId: string,
    amount: number,
    currency: string,
    description: string,
    metadata: Record<string, string>,
    successUrl: string,
    cancelUrl: string
  ): Promise<Stripe.Checkout.Session> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const session = await stripe.checkout.sessions.create({
      customer_email: user.email,
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: description,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId,
        ...metadata
      }
    });

    return session;
  }

  /**
   * Handle successful subscription payment
   */
  async handleSubscriptionSuccess(session: Stripe.Checkout.Session): Promise<void> {
    const { userId, planId } = session.metadata!;
    
    if (!userId || !planId) {
      throw new Error('Missing metadata in session');
    }

    const subscription = await stripe.subscriptions.retrieve(
      session.subscription as string
    );

    // Update user subscription in database
    await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionTier: planId,
        subscriptionStatus: 'active',
        stripeCustomerId: subscription.customer as string,
        stripeSubscriptionId: subscription.id,
        subscriptionStartDate: new Date(subscription.current_period_start * 1000),
        subscriptionEndDate: new Date(subscription.current_period_end * 1000)
      }
    });

    // Create subscription record
    await prisma.subscription.create({
      data: {
        userId,
        plan: planId,
        status: 'active',
        stripeSubscriptionId: subscription.id,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: false
      }
    });

    console.log(`✅ Subscription activated for user ${userId}: ${planId}`);
  }

  /**
   * Handle successful one-time payment
   */
  async handlePaymentSuccess(session: Stripe.Checkout.Session): Promise<void> {
    const { userId, type, amount } = session.metadata!;
    
    if (!userId || !type) {
      throw new Error('Missing metadata in session');
    }

    switch (type) {
      case 'gems':
        const gemsAmount = parseInt(amount || '0');
        await this.addGems(userId, gemsAmount);
        break;
        
      case 'battle_entry':
        const battleId = session.metadata!.battleId;
        if (battleId) {
          await this.processBattleEntry(userId, battleId);
        }
        break;
        
      default:
        console.log(`Unknown payment type: ${type}`);
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(userId: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { stripeSubscriptionId: true }
    });

    if (!user?.stripeSubscriptionId) {
      throw new Error('No active subscription found');
    }

    // Cancel at period end (don't immediately cancel)
    await stripe.subscriptions.update(user.stripeSubscriptionId, {
      cancel_at_period_end: true
    });

    // Update subscription record
    await prisma.subscription.updateMany({
      where: {
        userId,
        status: 'active'
      },
      data: {
        cancelAtPeriodEnd: true
      }
    });

    console.log(`✅ Subscription cancelled for user ${userId}`);
  }

  /**
   * Reactivate subscription
   */
  async reactivateSubscription(userId: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { stripeSubscriptionId: true }
    });

    if (!user?.stripeSubscriptionId) {
      throw new Error('No subscription found');
    }

    // Remove cancel at period end
    await stripe.subscriptions.update(user.stripeSubscriptionId, {
      cancel_at_period_end: false
    });

    // Update subscription record
    await prisma.subscription.updateMany({
      where: {
        userId,
        status: 'active'
      },
      data: {
        cancelAtPeriodEnd: false
      }
    });

    console.log(`✅ Subscription reactivated for user ${userId}`);
  }

  /**
   * Get subscription status
   */
  async getSubscriptionStatus(userId: string): Promise<{
    plan: string;
    status: string;
    currentPeriodEnd: Date | null;
    cancelAtPeriodEnd: boolean;
  }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        subscriptionTier: true,
        subscriptionStatus: true,
        subscriptionEndDate: true,
        stripeSubscriptionId: true
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    let cancelAtPeriodEnd = false;

    // Get latest info from Stripe if subscription exists
    if (user.stripeSubscriptionId) {
      try {
        const subscription = await stripe.subscriptions.retrieve(
          user.stripeSubscriptionId
        );
        cancelAtPeriodEnd = subscription.cancel_at_period_end;
      } catch (error) {
        console.error('Error retrieving Stripe subscription:', error);
      }
    }

    return {
      plan: user.subscriptionTier || 'free',
      status: user.subscriptionStatus || 'inactive',
      currentPeriodEnd: user.subscriptionEndDate,
      cancelAtPeriodEnd
    };
  }

  /**
   * Process webhook events
   */
  async processWebhook(event: Stripe.Event): Promise<void> {
    console.log(`Processing Stripe webhook: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        
        if (session.mode === 'subscription') {
          await this.handleSubscriptionSuccess(session);
        } else if (session.mode === 'payment') {
          await this.handlePaymentSuccess(session);
        }
        break;

      case 'customer.subscription.updated':
        const subscription = event.data.object as Stripe.Subscription;
        await this.updateSubscriptionStatus(subscription);
        break;

      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object as Stripe.Subscription;
        await this.handleSubscriptionCancellation(deletedSubscription);
        break;

      case 'invoice.payment_failed':
        const failedInvoice = event.data.object as Stripe.Invoice;
        await this.handlePaymentFailure(failedInvoice);
        break;

      default:
        console.log(`Unhandled webhook event: ${event.type}`);
    }
  }

  /**
   * Add gems to user account
   */
  private async addGems(userId: string, amount: number): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        gemsBalance: {
          increment: amount
        }
      }
    });

    // Create transaction record
    await prisma.gemTransaction.create({
      data: {
        userId,
        amount,
        type: 'purchase',
        description: `Purchased ${amount} gems`
      }
    });

    console.log(`✅ Added ${amount} gems to user ${userId}`);
  }

  /**
   * Process battle entry payment
   */
  private async processBattleEntry(userId: string, battleId: string): Promise<void> {
    // Join the battle
    await prisma.battleParticipant.create({
      data: {
        battleId,
        userId,
        status: 'active'
      }
    });

    console.log(`✅ User ${userId} joined battle ${battleId}`);
  }

  /**
   * Update subscription status from webhook
   */
  private async updateSubscriptionStatus(subscription: Stripe.Subscription): Promise<void> {
    const userId = subscription.metadata.userId;
    if (!userId) return;

    await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionStatus: subscription.status,
        subscriptionEndDate: new Date(subscription.current_period_end * 1000)
      }
    });

    await prisma.subscription.updateMany({
      where: {
        stripeSubscriptionId: subscription.id
      },
      data: {
        status: subscription.status,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end
      }
    });
  }

  /**
   * Handle subscription cancellation
   */
  private async handleSubscriptionCancellation(subscription: Stripe.Subscription): Promise<void> {
    const userId = subscription.metadata.userId;
    if (!userId) return;

    await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionTier: 'free',
        subscriptionStatus: 'cancelled'
      }
    });

    await prisma.subscription.updateMany({
      where: {
        stripeSubscriptionId: subscription.id
      },
      data: {
        status: 'cancelled'
      }
    });

    console.log(`✅ Subscription cancelled for user ${userId}`);
  }

  /**
   * Handle payment failure
   */
  private async handlePaymentFailure(invoice: Stripe.Invoice): Promise<void> {
    const subscriptionId = invoice.subscription as string;
    if (!subscriptionId) return;

    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const userId = subscription.metadata.userId;
    
    if (!userId) return;

    // Update subscription status
    await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionStatus: 'past_due'
      }
    });

    console.log(`⚠️ Payment failed for user ${userId}`);
  }
}

// Export singleton
export const stripeService = new StripeService();