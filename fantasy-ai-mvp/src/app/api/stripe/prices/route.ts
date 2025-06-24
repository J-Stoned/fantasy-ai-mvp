import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16'
});

// Price mapping - in production these would be from your Stripe dashboard
const PRICE_MAP = {
  pro: {
    monthly: process.env.STRIPE_PRICE_PRO_MONTHLY,
    yearly: process.env.STRIPE_PRICE_PRO_YEARLY
  },
  elite: {
    monthly: process.env.STRIPE_PRICE_ELITE_MONTHLY,
    yearly: process.env.STRIPE_PRICE_ELITE_YEARLY
  }
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { planId, interval } = body;

    if (!planId || !interval) {
      return NextResponse.json(
        { error: 'Plan ID and interval are required' },
        { status: 400 }
      );
    }

    // Get price ID from environment or search in Stripe
    let priceId = PRICE_MAP[planId as keyof typeof PRICE_MAP]?.[interval as 'monthly' | 'yearly'];

    if (!priceId) {
      // Search for price in Stripe
      const prices = await stripe.prices.search({
        query: `metadata['plan_id']:'${planId}' AND metadata['interval']:'${interval}'`
      });

      if (prices.data.length > 0) {
        priceId = prices.data[0].id;
      }
    }

    if (!priceId) {
      return NextResponse.json(
        { error: 'Price not found for this plan and interval' },
        { status: 404 }
      );
    }

    return NextResponse.json({ priceId });
  } catch (error) {
    console.error('Price lookup error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get price',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Get all available prices
export async function GET() {
  try {
    const prices = await stripe.prices.list({
      active: true,
      expand: ['data.product']
    });

    const formattedPrices = prices.data
      .filter(price => price.type === 'recurring')
      .map(price => ({
        id: price.id,
        planId: price.metadata.plan_id,
        interval: price.metadata.interval || price.recurring?.interval,
        amount: price.unit_amount,
        currency: price.currency,
        product: {
          name: (price.product as Stripe.Product).name,
          description: (price.product as Stripe.Product).description,
          metadata: (price.product as Stripe.Product).metadata
        }
      }));

    return NextResponse.json({ prices: formattedPrices });
  } catch (error) {
    console.error('Price list error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get prices',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}