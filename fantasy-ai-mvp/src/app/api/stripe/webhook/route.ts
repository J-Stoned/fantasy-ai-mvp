import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16'
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature') || '';

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutComplete(session);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCancelled(subscription);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentSuccess(invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  console.log('✅ Checkout completed:', session.id);

  if (!session.customer || !session.subscription) {
    console.error('Missing customer or subscription in session');
    return;
  }

  const customerId = typeof session.customer === 'string' 
    ? session.customer 
    : session.customer.id;

  const subscriptionId = typeof session.subscription === 'string'
    ? session.subscription
    : session.subscription.id;

  // Get subscription details
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  
  // Get user ID from metadata or customer
  const customer = await stripe.customers.retrieve(customerId);
  const userId = (customer as any).metadata?.userId || session.metadata?.userId;

  if (!userId) {
    console.error('No userId found in session or customer metadata');
    return;
  }

  // Update user subscription in database
  await updateUserSubscription(userId, subscription);
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  console.log('📝 Subscription updated:', subscription.id);

  const customer = await stripe.customers.retrieve(subscription.customer as string);
  const userId = (customer as any).metadata?.userId;

  if (!userId) {
    console.error('No userId found in customer metadata');
    return;
  }

  await updateUserSubscription(userId, subscription);
}

async function handleSubscriptionCancelled(subscription: Stripe.Subscription) {
  console.log('❌ Subscription cancelled:', subscription.id);

  const customer = await stripe.customers.retrieve(subscription.customer as string);
  const userId = (customer as any).metadata?.userId;

  if (!userId) {
    console.error('No userId found in customer metadata');
    return;
  }

  // Update to free tier
  await prisma.subscription.update({
    where: { userId },
    data: {
      tier: 'FREE',
      status: 'CANCELLED',
      stripeSubscriptionId: null,
      currentPeriodEnd: new Date(),
      updatedAt: new Date()
    }
  });

  console.log(`User ${userId} downgraded to FREE tier`);
}

async function handlePaymentSuccess(invoice: Stripe.Invoice) {
  console.log('💰 Payment succeeded:', invoice.id);
  
  // Log successful payment
  if (invoice.subscription) {
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
    const customer = await stripe.customers.retrieve(subscription.customer as string);
    const userId = (customer as any).metadata?.userId;

    if (userId) {
      console.log(`Payment successful for user ${userId}: $${invoice.amount_paid / 100}`);
    }
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  console.log('❌ Payment failed:', invoice.id);

  if (invoice.subscription) {
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
    const customer = await stripe.customers.retrieve(subscription.customer as string);
    const userId = (customer as any).metadata?.userId;

    if (userId) {
      // Update subscription status
      await prisma.subscription.update({
        where: { userId },
        data: {
          status: 'PAYMENT_FAILED',
          updatedAt: new Date()
        }
      });

      console.log(`Payment failed for user ${userId}`);
      // TODO: Send payment failed email
    }
  }
}

async function updateUserSubscription(userId: string, subscription: Stripe.Subscription) {
  // Get the price details
  const priceId = subscription.items.data[0]?.price.id;
  const price = await stripe.prices.retrieve(priceId);
  
  // Determine tier from price metadata
  const planId = price.metadata.plan_id;
  const tier = planId === 'pro' ? 'PRO' : planId === 'elite' ? 'ELITE' : 'FREE';
  
  // Map Stripe status to our status
  let status: 'ACTIVE' | 'CANCELLED' | 'PAYMENT_FAILED' | 'TRIAL';
  switch (subscription.status) {
    case 'active':
      status = 'ACTIVE';
      break;
    case 'trialing':
      status = 'TRIAL';
      break;
    case 'canceled':
    case 'cancelled':
      status = 'CANCELLED';
      break;
    case 'past_due':
    case 'unpaid':
      status = 'PAYMENT_FAILED';
      break;
    default:
      status = 'ACTIVE';
  }

  // Update subscription in database
  await prisma.subscription.upsert({
    where: { userId },
    update: {
      tier: tier as any,
      status,
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: subscription.customer as string,
      stripePriceId: priceId,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      updatedAt: new Date()
    },
    create: {
      userId,
      tier: tier as any,
      status,
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: subscription.customer as string,
      stripePriceId: priceId,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end
    }
  });

  console.log(`Updated subscription for user ${userId}: ${tier} (${status})`);
}