/**
 * 💳 STRIPE SUBSCRIPTION SERVICE
 * 
 * Real Stripe integration for subscription management.
 * This enables legal revenue generation through tiered plans.
 */

import Stripe from "stripe";
import { prisma } from "./prisma";
import { 
  SubscriptionTier, 
  BillingInterval, 
  UserSubscription,
  SUBSCRIPTION_PLANS 
} from "./subscription-system";

// Initialize Stripe with error handling
let stripe: Stripe | null = null;

try {
  if (process.env.STRIPE_SECRET_KEY) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2023-10-16",
    });
  } else {
    console.warn("⚠️ STRIPE_SECRET_KEY not found - subscription features will be limited");
  }
} catch (error) {
  console.error("❌ Failed to initialize Stripe:", error);
}

export interface SubscriptionCheckoutSession {
  sessionId: string;
  url: string;
  success: boolean;
  error?: string;
}

export interface StripeCustomerInfo {
  stripeCustomerId: string;
  email: string;
  name?: string;
}

export class StripeSubscriptionService {
  
  /**
   * Check if Stripe is available
   */
  static isAvailable(): boolean {
    return stripe !== null;
  }

  /**
   * Get or create Stripe customer for user
   */
  static async ensureStripeCustomer(
    userId: string, 
    email: string, 
    name?: string
  ): Promise<StripeCustomerInfo> {
    if (!stripe) {
      throw new Error("Stripe not initialized - check STRIPE_SECRET_KEY");
    }

    try {
      // Check if user already has a Stripe customer via subscription
      const existingSubscription = await prisma.subscription.findUnique({
        where: { userId },
        select: { stripeCustomerId: true }
      });

      if (existingSubscription?.stripeCustomerId) {
        return {
          stripeCustomerId: existingSubscription.stripeCustomerId,
          email,
          name
        };
      }

      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email,
        name: name || undefined,
        metadata: {
          userId,
          createdFrom: "fantasy-ai-mvp"
        },
      });

      // Create or update subscription with Stripe customer ID
      await prisma.subscription.upsert({
        where: { userId },
        update: { stripeCustomerId: customer.id },
        create: {
          userId,
          stripeCustomerId: customer.id,
          tier: 'FREE'
        }
      });

      return {
        stripeCustomerId: customer.id,
        email,
        name
      };

    } catch (error) {
      console.error("Error ensuring Stripe customer:", error);
      throw new Error(`Failed to create/retrieve Stripe customer: ${error}`);
    }
  }

  /**
   * Create subscription checkout session
   */
  static async createCheckoutSession(
    userId: string,
    planId: string,
    interval: BillingInterval,
    successUrl: string,
    cancelUrl: string
  ): Promise<SubscriptionCheckoutSession> {
    if (!stripe) {
      return {
        sessionId: "",
        url: "",
        success: false,
        error: "Stripe not available - check configuration"
      };
    }

    try {
      // Find the plan
      const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
      if (!plan) {
        return {
          sessionId: "",
          url: "",
          success: false,
          error: "Plan not found"
        };
      }

      // Get user info
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true }
      });

      if (!user) {
        return {
          sessionId: "",
          url: "",
          success: false,
          error: "User not found"
        };
      }

      // Ensure Stripe customer exists
      const customerInfo = await this.ensureStripeCustomer(
        userId, 
        user.email, 
        user.name || undefined
      );

      // Get the correct price ID
      const priceId = interval === 'yearly' && plan.stripePriceId.yearly
        ? plan.stripePriceId.yearly
        : plan.stripePriceId.monthly;

      // Create checkout session
      const session = await stripe.checkout.sessions.create({
        customer: customerInfo.stripeCustomerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: cancelUrl,
        metadata: {
          userId,
          planId,
          interval,
        },
        subscription_data: {
          metadata: {
            userId,
            planId,
            tier: plan.tier,
          },
        },
      });

      return {
        sessionId: session.id,
        url: session.url || "",
        success: true,
      };

    } catch (error) {
      console.error("Error creating checkout session:", error);
      return {
        sessionId: "",
        url: "",
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }

  /**
   * Handle successful subscription webhook
   */
  static async handleSubscriptionCreated(
    stripeSubscription: Stripe.Subscription
  ): Promise<UserSubscription | null> {
    try {
      const { userId, planId, tier } = stripeSubscription.metadata;
      
      if (!userId || !tier) {
        console.error("Missing required metadata in subscription:", stripeSubscription.metadata);
        return null;
      }

      // Find the plan
      const plan = SUBSCRIPTION_PLANS.find(p => p.tier === tier as SubscriptionTier);
      if (!plan) {
        console.error("Plan not found for tier:", tier);
        return null;
      }

      // Determine billing interval from price
      const priceId = stripeSubscription.items.data[0]?.price.id;
      const interval: BillingInterval = plan.stripePriceId.yearly === priceId ? 'yearly' : 'monthly';

      // Create subscription record
      const subscription: UserSubscription = {
        id: `sub_${Date.now()}`,
        userId,
        tier: tier as SubscriptionTier,
        status: 'ACTIVE',
        billingInterval: interval,
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
        stripeSubscriptionId: stripeSubscription.id,
        stripeCustomerId: stripeSubscription.customer as string,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Save to database
      await prisma.userSubscription.create({
        data: {
          id: subscription.id,
          userId: subscription.userId,
          tier: subscription.tier,
          status: subscription.status,
          billingInterval: subscription.billingInterval,
          currentPeriodStart: subscription.currentPeriodStart,
          currentPeriodEnd: subscription.currentPeriodEnd,
          cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
          stripeSubscriptionId: subscription.stripeSubscriptionId,
          stripeCustomerId: subscription.stripeCustomerId,
          createdAt: subscription.createdAt,
          updatedAt: subscription.updatedAt
        }
      });

      console.log(`🎉 Subscription created: ${userId} upgraded to ${tier}`);
      return subscription;

    } catch (error) {
      console.error("Error handling subscription created:", error);
      return null;
    }
  }

  /**
   * Handle subscription updated webhook
   */
  static async handleSubscriptionUpdated(
    stripeSubscription: Stripe.Subscription
  ): Promise<void> {
    try {
      const { userId } = stripeSubscription.metadata;
      
      if (!userId) {
        console.error("No userId in subscription metadata");
        return;
      }

      // Update subscription in database
      await prisma.userSubscription.updateMany({
        where: { 
          userId,
          stripeSubscriptionId: stripeSubscription.id 
        },
        data: {
          status: this.mapStripeStatus(stripeSubscription.status),
          currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
          currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
          cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
          updatedAt: new Date()
        }
      });

      console.log(`📄 Subscription updated: ${userId}`);

    } catch (error) {
      console.error("Error handling subscription updated:", error);
    }
  }

  /**
   * Handle subscription deleted webhook
   */
  static async handleSubscriptionDeleted(
    stripeSubscription: Stripe.Subscription
  ): Promise<void> {
    try {
      const { userId } = stripeSubscription.metadata;
      
      if (!userId) {
        console.error("No userId in subscription metadata");
        return;
      }

      // Update subscription status to cancelled
      await prisma.userSubscription.updateMany({
        where: { 
          userId,
          stripeSubscriptionId: stripeSubscription.id 
        },
        data: {
          status: 'CANCELLED',
          updatedAt: new Date()
        }
      });

      console.log(`❌ Subscription cancelled: ${userId}`);

    } catch (error) {
      console.error("Error handling subscription deleted:", error);
    }
  }

  /**
   * Cancel subscription
   */
  static async cancelSubscription(
    userId: string,
    immediately: boolean = false
  ): Promise<{ success: boolean; effectiveDate?: Date; error?: string }> {
    if (!stripe) {
      return { 
        success: false, 
        error: "Stripe not available" 
      };
    }

    try {
      // Get user's subscription
      const subscription = await prisma.userSubscription.findFirst({
        where: { 
          userId,
          status: 'ACTIVE'
        }
      });

      if (!subscription?.stripeSubscriptionId) {
        return { 
          success: false, 
          error: "No active subscription found" 
        };
      }

      // Cancel in Stripe
      if (immediately) {
        await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
      } else {
        await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
          cancel_at_period_end: true
        });
      }

      // Update local record
      await prisma.userSubscription.update({
        where: { id: subscription.id },
        data: {
          cancelAtPeriodEnd: !immediately,
          status: immediately ? 'CANCELLED' : 'ACTIVE',
          updatedAt: new Date()
        }
      });

      const effectiveDate = immediately 
        ? new Date() 
        : subscription.currentPeriodEnd;

      return { 
        success: true, 
        effectiveDate 
      };

    } catch (error) {
      console.error("Error cancelling subscription:", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      };
    }
  }

  /**
   * Create billing portal session
   */
  static async createBillingPortalSession(
    userId: string,
    returnUrl: string
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    if (!stripe) {
      return { 
        success: false, 
        error: "Stripe not available" 
      };
    }

    try {
      // Get user's Stripe customer ID from subscription
      const subscription = await prisma.subscription.findUnique({
        where: { userId },
        select: { stripeCustomerId: true }
      });

      if (!subscription?.stripeCustomerId) {
        return { 
          success: false, 
          error: "No Stripe customer found" 
        };
      }

      // Create billing portal session
      const session = await stripe.billingPortal.sessions.create({
        customer: subscription.stripeCustomerId,
        return_url: returnUrl,
      });

      return { 
        success: true, 
        url: session.url 
      };

    } catch (error) {
      console.error("Error creating billing portal session:", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      };
    }
  }

  /**
   * Get subscription usage stats for billing
   */
  static async getSubscriptionUsageStats(userId: string): Promise<{
    currentUsage: Record<string, number>;
    limits: Record<string, number>;
    percentUsed: Record<string, number>;
  }> {
    try {
      // Get current subscription
      const subscription = await prisma.userSubscription.findFirst({
        where: { userId, status: 'ACTIVE' }
      });

      const tier = subscription?.tier || 'FREE';
      const plan = SUBSCRIPTION_PLANS.find(p => p.tier === tier);
      
      if (!plan) {
        return { currentUsage: {}, limits: {}, percentUsed: {} };
      }

      // Get current month usage
      const currentMonth = new Date().toISOString().slice(0, 7);
      const usage = await prisma.subscriptionUsage.findUnique({
        where: { 
          userId_period: {
            userId,
            period: currentMonth
          }
        }
      });

      const currentUsage = {
        aiInsights: usage?.aiInsightsUsed || 0,
        voiceMinutes: usage?.voiceMinutesUsed || 0,
        leagues: usage?.leaguesCreated || 0,
      };

      const limits = {
        aiInsights: plan.limits.aiInsightsPerDay,
        voiceMinutes: plan.limits.voiceMinutesPerMonth,
        leagues: plan.limits.maxLeagues,
      };

      const percentUsed = Object.keys(currentUsage).reduce((acc, key) => {
        const used = currentUsage[key as keyof typeof currentUsage];
        const limit = limits[key as keyof typeof limits];
        acc[key] = limit === -1 ? 0 : (used / limit) * 100;
        return acc;
      }, {} as Record<string, number>);

      return { currentUsage, limits, percentUsed };

    } catch (error) {
      console.error("Error getting usage stats:", error);
      return { currentUsage: {}, limits: {}, percentUsed: {} };
    }
  }

  /**
   * Handle Stripe webhook events
   */
  static async handleWebhook(event: Stripe.Event): Promise<void> {
    try {
      switch (event.type) {
        case 'customer.subscription.created':
          await this.handleSubscriptionCreated(event.data.object as Stripe.Subscription);
          break;
        
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
          break;
        
        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
          break;
        
        case 'invoice.payment_succeeded':
          console.log('💰 Payment succeeded:', event.data.object.id);
          break;
        
        case 'invoice.payment_failed':
          console.log('❌ Payment failed:', event.data.object.id);
          break;
        
        default:
          console.log(`Unhandled Stripe event: ${event.type}`);
      }
    } catch (error) {
      console.error(`Error handling Stripe webhook ${event.type}:`, error);
    }
  }

  /**
   * Map Stripe subscription status to our status
   */
  private static mapStripeStatus(stripeStatus: string): UserSubscription['status'] {
    switch (stripeStatus) {
      case 'active':
        return 'ACTIVE';
      case 'canceled':
        return 'CANCELLED';
      case 'trialing':
        return 'TRIAL';
      case 'past_due':
      case 'incomplete':
      case 'incomplete_expired':
        return 'EXPIRED';
      default:
        return 'CANCELLED';
    }
  }

  /**
   * Health check - verify Stripe connection
   */
  static async healthCheck(): Promise<{ healthy: boolean; error?: string }> {
    if (!stripe) {
      return { 
        healthy: false, 
        error: "Stripe not initialized" 
      };
    }

    try {
      // Try to retrieve account info
      await stripe.accounts.retrieve();
      return { healthy: true };
    } catch (error) {
      return { 
        healthy: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      };
    }
  }
}

export { StripeSubscriptionService as StripeService };
export default StripeSubscriptionService;