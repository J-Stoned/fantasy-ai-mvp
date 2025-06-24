#!/usr/bin/env tsx

/**
 * STRIPE PAYMENT SETUP SCRIPT
 * Sets up Stripe products, prices, and webhooks for Fantasy.AI
 * Run this to configure your Stripe account for production
 */

import Stripe from 'stripe';
import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables
config({ path: join(process.cwd(), '.env') });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16'
});

const SUBSCRIPTION_PLANS = [
  {
    id: 'free',
    name: 'Fantasy.AI Free',
    description: 'Essential fantasy sports features',
    features: [
      'Basic lineup optimization',
      'Injury updates',
      'Player search',
      'Limited voice commands'
    ],
    prices: {
      monthly: 0,
      yearly: 0
    }
  },
  {
    id: 'pro',
    name: 'Fantasy.AI Pro',
    description: 'Advanced AI-powered features',
    features: [
      'Everything in Free',
      'Advanced AI analytics',
      'Unlimited voice commands',
      'Trade analyzer',
      'Custom expert voices',
      'Real-time notifications',
      'Priority support'
    ],
    prices: {
      monthly: 999, // $9.99 in cents
      yearly: 9999 // $99.99 in cents (2 months free)
    }
  },
  {
    id: 'elite',
    name: 'Fantasy.AI Elite',
    description: 'Professional fantasy sports management',
    features: [
      'Everything in Pro',
      'DFS optimizer',
      'Betting props analysis',
      'Multi-league management',
      'API access',
      'White-glove support',
      'Early access features',
      'Custom ML models'
    ],
    prices: {
      monthly: 1999, // $19.99 in cents
      yearly: 19999 // $199.99 in cents (2 months free)
    }
  }
];

async function setupStripeProducts() {
  console.log('🚀 Setting up Stripe products and prices for Fantasy.AI\n');

  try {
    // Check if we have a valid API key
    const account = await stripe.accounts.retrieve();
    console.log(`✅ Connected to Stripe account: ${account.email}\n`);

    // Create or update products
    for (const plan of SUBSCRIPTION_PLANS) {
      if (plan.id === 'free') continue; // Skip free tier

      console.log(`📦 Setting up ${plan.name}...`);

      // Check if product exists
      let product: Stripe.Product;
      const existingProducts = await stripe.products.search({
        query: `metadata['plan_id']:'${plan.id}'`
      });

      if (existingProducts.data.length > 0) {
        product = existingProducts.data[0];
        console.log(`  ✓ Found existing product: ${product.id}`);
        
        // Update product details
        product = await stripe.products.update(product.id, {
          name: plan.name,
          description: plan.description,
          metadata: {
            plan_id: plan.id,
            features: JSON.stringify(plan.features)
          }
        });
      } else {
        // Create new product
        product = await stripe.products.create({
          name: plan.name,
          description: plan.description,
          metadata: {
            plan_id: plan.id,
            features: JSON.stringify(plan.features)
          }
        });
        console.log(`  ✓ Created new product: ${product.id}`);
      }

      // Create or update prices
      // Monthly price
      if (plan.prices.monthly > 0) {
        const existingMonthlyPrices = await stripe.prices.search({
          query: `product:'${product.id}' AND metadata['interval']:'monthly'`
        });

        if (existingMonthlyPrices.data.length === 0) {
          const monthlyPrice = await stripe.prices.create({
            product: product.id,
            unit_amount: plan.prices.monthly,
            currency: 'usd',
            recurring: {
              interval: 'month'
            },
            metadata: {
              plan_id: plan.id,
              interval: 'monthly'
            }
          });
          console.log(`  ✓ Created monthly price: $${plan.prices.monthly / 100}/month`);
        } else {
          console.log(`  ✓ Monthly price already exists: $${plan.prices.monthly / 100}/month`);
        }
      }

      // Yearly price
      if (plan.prices.yearly > 0) {
        const existingYearlyPrices = await stripe.prices.search({
          query: `product:'${product.id}' AND metadata['interval']:'yearly'`
        });

        if (existingYearlyPrices.data.length === 0) {
          const yearlyPrice = await stripe.prices.create({
            product: product.id,
            unit_amount: plan.prices.yearly,
            currency: 'usd',
            recurring: {
              interval: 'year'
            },
            metadata: {
              plan_id: plan.id,
              interval: 'yearly'
            }
          });
          console.log(`  ✓ Created yearly price: $${plan.prices.yearly / 100}/year`);
        } else {
          console.log(`  ✓ Yearly price already exists: $${plan.prices.yearly / 100}/year`);
        }
      }

      console.log('');
    }

    // Set up webhook endpoint
    console.log('🔗 Setting up webhook endpoint...');
    
    const webhookUrl = process.env.NEXT_PUBLIC_APP_URL 
      ? `${process.env.NEXT_PUBLIC_APP_URL}/api/stripe/webhook`
      : 'https://fantasy-ai-mvp.vercel.app/api/stripe/webhook';

    // Check existing webhooks
    const existingWebhooks = await stripe.webhookEndpoints.list({ limit: 100 });
    const hasWebhook = existingWebhooks.data.some(wh => wh.url === webhookUrl);

    if (!hasWebhook) {
      const webhook = await stripe.webhookEndpoints.create({
        url: webhookUrl,
        enabled_events: [
          'checkout.session.completed',
          'customer.subscription.created',
          'customer.subscription.updated',
          'customer.subscription.deleted',
          'invoice.payment_succeeded',
          'invoice.payment_failed'
        ],
        description: 'Fantasy.AI subscription webhook'
      });

      console.log(`✅ Created webhook endpoint: ${webhook.url}`);
      console.log(`🔑 Webhook signing secret: ${webhook.secret}`);
      console.log('\n⚠️  IMPORTANT: Add this to your .env file:');
      console.log(`STRIPE_WEBHOOK_SECRET=${webhook.secret}\n`);
    } else {
      console.log(`✓ Webhook already exists: ${webhookUrl}\n`);
    }

    // Create test customer and subscription
    if (process.env.NODE_ENV === 'development') {
      console.log('🧪 Creating test customer and subscription...');
      
      const testCustomer = await stripe.customers.create({
        email: 'test@fantasy.ai',
        name: 'Test User',
        metadata: {
          userId: 'test_user_123',
          environment: 'development'
        }
      });

      console.log(`✓ Created test customer: ${testCustomer.id}`);

      // Get Pro monthly price
      const proPrices = await stripe.prices.search({
        query: `metadata['plan_id']:'pro' AND metadata['interval']:'monthly'`
      });

      if (proPrices.data.length > 0) {
        const subscription = await stripe.subscriptions.create({
          customer: testCustomer.id,
          items: [{ price: proPrices.data[0].id }],
          trial_period_days: 14,
          metadata: {
            userId: 'test_user_123'
          }
        });

        console.log(`✓ Created test subscription: ${subscription.id}`);
        console.log(`  Status: ${subscription.status}`);
        console.log(`  Trial ends: ${new Date(subscription.trial_end! * 1000).toLocaleDateString()}`);
      }
    }

    console.log('\n✅ Stripe setup complete!');
    console.log('\n📋 Next steps:');
    console.log('1. Add STRIPE_WEBHOOK_SECRET to your .env file');
    console.log('2. Update environment variables in Vercel');
    console.log('3. Test the payment flow at /pricing');
    console.log('4. Monitor webhooks in Stripe dashboard');

    // Display summary
    console.log('\n📊 Products Summary:');
    const products = await stripe.products.list({ limit: 100 });
    for (const product of products.data) {
      if (product.metadata.plan_id) {
        console.log(`\n${product.name}:`);
        const prices = await stripe.prices.list({ product: product.id });
        for (const price of prices.data) {
          if (price.recurring) {
            console.log(`  - $${price.unit_amount! / 100}/${price.recurring.interval}`);
          }
        }
      }
    }

  } catch (error) {
    console.error('❌ Error setting up Stripe:', error);
    
    if (error instanceof Error && error.message.includes('API key')) {
      console.error('\n⚠️  Please set STRIPE_SECRET_KEY in your .env file');
      console.error('Get your API keys from: https://dashboard.stripe.com/apikeys');
    }
    
    process.exit(1);
  }
}

// Run the setup
setupStripeProducts()
  .then(() => {
    console.log('\n🎉 Stripe payment setup successful!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Setup failed:', error);
    process.exit(1);
  });