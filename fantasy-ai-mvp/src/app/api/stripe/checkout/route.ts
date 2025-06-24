import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16'
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { priceId, planId, interval } = body;

    if (!priceId || !planId) {
      return NextResponse.json(
        { error: 'Price ID and Plan ID are required' },
        { status: 400 }
      );
    }

    // Get or create Stripe customer
    let customer: Stripe.Customer;
    
    // Check if customer exists
    const customers = await stripe.customers.search({
      query: `email:'${session.user.email}'`
    });

    if (customers.data.length > 0) {
      customer = customers.data[0];
    } else {
      // Create new customer
      customer = await stripe.customers.create({
        email: session.user.email,
        name: session.user.name || undefined,
        metadata: {
          userId: session.user.id || session.user.email,
          createdFrom: 'fantasy-ai-checkout'
        }
      });
    }

    // Create checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard?subscription=success&plan=${planId}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/pricing?cancelled=true`,
      subscription_data: {
        trial_period_days: planId === 'pro' ? 14 : 7, // 14 days for Pro, 7 for Elite
        metadata: {
          userId: session.user.id || session.user.email,
          planId,
          interval
        }
      },
      metadata: {
        userId: session.user.id || session.user.email,
        planId,
        interval
      },
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      customer_update: {
        address: 'auto'
      }
    });

    return NextResponse.json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url
    });
  } catch (error) {
    console.error('Checkout session error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create checkout session',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Get subscription status
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Find customer by email
    const customers = await stripe.customers.search({
      query: `email:'${session.user.email}'`
    });

    if (customers.data.length === 0) {
      return NextResponse.json({
        subscription: null,
        tier: 'FREE'
      });
    }

    const customer = customers.data[0];
    
    // Get active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'all',
      limit: 1
    });

    if (subscriptions.data.length === 0) {
      return NextResponse.json({
        subscription: null,
        tier: 'FREE'
      });
    }

    const subscription = subscriptions.data[0];
    const price = await stripe.prices.retrieve(subscription.items.data[0].price.id);
    const product = await stripe.products.retrieve(price.product as string);

    return NextResponse.json({
      subscription: {
        id: subscription.id,
        status: subscription.status,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null
      },
      tier: product.metadata.plan_id?.toUpperCase() || 'FREE',
      product: {
        name: product.name,
        description: product.description,
        features: product.metadata.features ? JSON.parse(product.metadata.features) : []
      },
      price: {
        amount: price.unit_amount,
        currency: price.currency,
        interval: price.recurring?.interval
      }
    });
  } catch (error) {
    console.error('Get subscription error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get subscription status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}