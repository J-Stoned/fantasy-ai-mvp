/**
 * 💳 FANTASY AI MVP - SUBSCRIPTION SYSTEM FOUNDATION
 * 
 * Legal revenue generation through tiered subscription plans.
 * This system provides immediate monetization while gambling features are disabled.
 */

import { SUBSCRIPTION_FEATURES } from './feature-flags';
import { prisma } from './prisma';

// =============================================================================
// 📋 SUBSCRIPTION TYPES & INTERFACES
// =============================================================================

export type SubscriptionTier = 'FREE' | 'PRO' | 'ELITE';
export type BillingInterval = 'monthly' | 'yearly';
export type SubscriptionStatus = 'ACTIVE' | 'CANCELLED' | 'EXPIRED' | 'TRIAL';

export interface SubscriptionPlan {
  id: string;
  tier: SubscriptionTier;
  name: string;
  description: string;
  basePrice: number;
  yearlyPrice?: number;
  currency: string;
  features: string[];
  limits: typeof SUBSCRIPTION_FEATURES[keyof typeof SUBSCRIPTION_FEATURES];
  popular?: boolean;
  stripePriceId: {
    monthly: string;
    yearly?: string;
  };
}

export interface UserSubscription {
  id: string;
  userId: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  billingInterval: BillingInterval;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  stripeSubscriptionId: string | null;
  stripeCustomerId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubscriptionUsage {
  userId: string;
  period: string; // YYYY-MM
  aiInsightsUsed: number;
  voiceMinutesUsed: number;
  leaguesCreated: number;
  apiCallsMade: number;
  lastUpdated: Date;
}

export interface FeatureQuota {
  feature: string;
  used: number;
  limit: number;
  resetDate: Date;
  unlimited: boolean;
}

// =============================================================================
// 💰 SUBSCRIPTION PLANS CONFIGURATION
// =============================================================================

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    tier: 'FREE',
    name: 'Fantasy Starter',
    description: 'Perfect for casual fantasy managers',
    basePrice: 0,
    currency: 'USD',
    features: [
      '✅ Basic AI insights (10/day)',
      '✅ Up to 2 leagues',
      '✅ Standard player projections',
      '✅ Community access',
      '✅ Basic lineup optimizer',
      '❌ No voice assistant',
      '❌ No premium analytics',
      '❌ No API access'
    ],
    limits: SUBSCRIPTION_FEATURES.FREE,
    stripePriceId: {
      monthly: 'free_tier'
    }
  },
  {
    id: 'pro',
    tier: 'PRO',
    name: 'Fantasy Pro',
    description: 'Advanced features for serious managers',
    basePrice: 19.99,
    yearlyPrice: 199.99,
    currency: 'USD',
    popular: true,
    features: [
      '🚀 Advanced AI insights (100/day)',
      '🚀 Up to 10 leagues',
      '🚀 Premium player projections',
      '🚀 Voice assistant (100 min/month)',
      '🚀 Advanced lineup optimizer',
      '🚀 Biometric integration',
      '🚀 Priority support',
      '🚀 Social premium features',
      '❌ No API access'
    ],
    limits: SUBSCRIPTION_FEATURES.PRO,
    stripePriceId: {
      monthly: 'price_pro_monthly',
      yearly: 'price_pro_yearly'
    }
  },
  {
    id: 'elite',
    tier: 'ELITE',
    name: 'Fantasy Elite',
    description: 'Ultimate fantasy AI experience',
    basePrice: 49.99,
    yearlyPrice: 499.99,
    currency: 'USD',
    features: [
      '⭐ Unlimited AI insights',
      '⭐ Unlimited leagues',
      '⭐ Elite AI projections',
      '⭐ Unlimited voice assistant',
      '⭐ Advanced biometric features',
      '⭐ AR/VR beta access',
      '⭐ Full API access',
      '⭐ White-glove support',
      '⭐ Early feature access',
      '⭐ Custom AI training'
    ],
    limits: SUBSCRIPTION_FEATURES.ELITE,
    stripePriceId: {
      monthly: 'price_elite_monthly',
      yearly: 'price_elite_yearly'
    }
  }
];

// =============================================================================
// 🎯 SUBSCRIPTION MANAGEMENT CLASS
// =============================================================================

export class SubscriptionManager {
  
  /**
   * Get subscription plan by tier
   */
  static getPlan(tier: SubscriptionTier): SubscriptionPlan | null {
    return SUBSCRIPTION_PLANS.find(plan => plan.tier === tier) || null;
  }

  /**
   * Check if user has access to a specific feature
   */
  static hasFeatureAccess(
    userSubscription: UserSubscription | null,
    feature: string
  ): boolean {
    const tier = userSubscription?.tier || 'FREE';
    const plan = this.getPlan(tier);
    
    if (!plan) return false;
    
    // Define feature mappings for each tier
    const featureMap: Record<SubscriptionTier, string[]> = {
      FREE: [
        'Basic AI insights',
        'Standard player projections',
        'Community access',
        'Basic lineup optimizer'
      ],
      PRO: [
        'Basic AI insights',
        'Standard player projections', 
        'Community access',
        'Basic lineup optimizer',
        'Advanced AI insights',
        'Premium player projections',
        'Voice assistant',
        'Advanced lineup optimizer',
        'Priority support',
        'Trade analyzer'
      ],
      ELITE: [
        'Basic AI insights',
        'Standard player projections',
        'Community access', 
        'Basic lineup optimizer',
        'Advanced AI insights',
        'Premium player projections',
        'Voice assistant',
        'Advanced lineup optimizer',
        'Priority support',
        'Trade analyzer',
        'Unlimited AI insights',
        'API access',
        'White-glove service',
        'Custom integrations',
        'Priority phone support'
      ]
    };
    
    // Check if feature is available for this tier
    return featureMap[tier].some(f => 
      f.toLowerCase().includes(feature.toLowerCase()) ||
      feature.toLowerCase().includes(f.toLowerCase())
    );
  }

  /**
   * Check feature usage quota
   */
  static checkFeatureQuota(
    userSubscription: UserSubscription | null,
    usage: SubscriptionUsage,
    feature: keyof typeof SUBSCRIPTION_FEATURES.FREE
  ): FeatureQuota {
    const tier = userSubscription?.tier || 'FREE';
    const limits = SUBSCRIPTION_FEATURES[tier];
    
    const limit = limits[feature] as number;
    const unlimited = limit === -1;
    
    let used = 0;
    switch (feature) {
      case 'aiInsightsPerDay':
        used = usage.aiInsightsUsed;
        break;
      case 'voiceMinutesPerMonth':
        used = usage.voiceMinutesUsed;
        break;
      case 'maxLeagues':
        used = usage.leaguesCreated;
        break;
      default:
        used = 0;
    }

    return {
      feature,
      used,
      limit: unlimited ? Infinity : limit,
      unlimited,
      resetDate: this.getNextResetDate(feature)
    };
  }

  /**
   * Get next quota reset date
   */
  private static getNextResetDate(feature: string): Date {
    const now = new Date();
    
    if (feature.includes('Day')) {
      // Daily reset
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      return tomorrow;
    } else if (feature.includes('Month')) {
      // Monthly reset
      const nextMonth = new Date(now);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      nextMonth.setDate(1);
      nextMonth.setHours(0, 0, 0, 0);
      return nextMonth;
    }
    
    // Default to daily
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow;
  }

  /**
   * Calculate subscription pricing with discounts
   */
  static calculatePricing(
    planId: string,
    interval: BillingInterval,
    discountCode?: string
  ): {
    planId: string;
    interval: BillingInterval;
    basePrice: number;
    discount: number;
    finalPrice: number;
    currency: string;
    savings?: number;
  } {
    const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
    if (!plan) throw new Error('Plan not found');

    const basePrice = interval === 'yearly' && plan.yearlyPrice 
      ? plan.yearlyPrice 
      : plan.basePrice;
    
    let discount = 0;
    let savings = 0;

    // Yearly discount
    if (interval === 'yearly' && plan.yearlyPrice) {
      const monthlyTotal = plan.basePrice * 12;
      savings = monthlyTotal - plan.yearlyPrice;
      discount = (savings / monthlyTotal) * 100;
    }

    // Apply discount codes (future feature)
    if (discountCode) {
      // TODO: Implement discount code logic
    }

    return {
      planId,
      interval,
      basePrice,
      discount,
      finalPrice: basePrice,
      currency: plan.currency,
      savings: interval === 'yearly' ? savings : undefined
    };
  }

  /**
   * Generate subscription benefits comparison
   */
  static generatePlanComparison(): {
    features: string[];
    plans: {
      tier: SubscriptionTier;
      name: string;
      price: string;
      features: Record<string, boolean | string>;
    }[];
  } {
    const allFeatures = [
      'AI Insights per Day',
      'Maximum Leagues',
      'Voice Assistant',
      'Biometric Integration',
      'Priority Support',
      'API Access',
      'AR/VR Features',
      'Premium Analytics'
    ];

    const plans = SUBSCRIPTION_PLANS.map(plan => ({
      tier: plan.tier,
      name: plan.name,
      price: plan.basePrice === 0 ? 'Free' : `$${plan.basePrice}/mo`,
      features: {
        'AI Insights per Day': plan.limits.aiInsightsPerDay === -1 ? 'Unlimited' : plan.limits.aiInsightsPerDay.toString(),
        'Maximum Leagues': plan.limits.maxLeagues === -1 ? 'Unlimited' : plan.limits.maxLeagues.toString(),
        'Voice Assistant': plan.limits.voiceMinutesPerMonth > 0 ? '✅' : '❌',
        'Biometric Integration': plan.limits.biometricFeatures ? '✅' : '❌',
        'Priority Support': plan.limits.prioritySupport ? '✅' : '❌',
        'API Access': plan.limits.apiAccess ? '✅' : '❌',
        'AR/VR Features': plan.tier === 'ELITE' ? '✅' : '❌',
        'Premium Analytics': plan.tier !== 'FREE' ? '✅' : '❌'
      }
    }));

    return { features: allFeatures, plans };
  }

  /**
   * Track feature usage
   */
  static async trackFeatureUsage(
    userId: string,
    feature: keyof typeof SUBSCRIPTION_FEATURES.FREE,
    amount: number = 1
  ): Promise<SubscriptionUsage> {
    try {
      const currentPeriod = new Date().toISOString().slice(0, 7); // YYYY-MM
      
      // Get or create usage record for current period
      const usage = await prisma.subscriptionUsage.upsert({
        where: {
          userId_period: {
            userId,
            period: currentPeriod
          }
        },
        update: {
          // Increment the specific feature usage
          ...(feature === 'aiInsightsPerDay' && { 
            aiInsightsUsed: { increment: amount } 
          }),
          ...(feature === 'voiceMinutesPerMonth' && { 
            voiceMinutesUsed: { increment: amount } 
          }),
          ...(feature === 'maxLeagues' && { 
            leaguesCreated: { increment: amount } 
          }),
          lastUpdated: new Date()
        },
        create: {
          userId,
          period: currentPeriod,
          aiInsightsUsed: feature === 'aiInsightsPerDay' ? amount : 0,
          voiceMinutesUsed: feature === 'voiceMinutesPerMonth' ? amount : 0,
          leaguesCreated: feature === 'maxLeagues' ? amount : 0,
          apiCallsMade: 0,
          lastUpdated: new Date()
        }
      });

      console.log(`📊 Feature usage tracked: ${userId} used ${amount} ${feature}`);
      return usage;
      
    } catch (error) {
      console.error("Error tracking feature usage:", error);
      
      // Fallback to mock data if database fails
      const currentPeriod = new Date().toISOString().slice(0, 7);
      return {
        userId,
        period: currentPeriod,
        aiInsightsUsed: feature === 'aiInsightsPerDay' ? amount : 0,
        voiceMinutesUsed: feature === 'voiceMinutesPerMonth' ? amount : 0,
        leaguesCreated: feature === 'maxLeagues' ? amount : 0,
        apiCallsMade: 0,
        lastUpdated: new Date()
      };
    }
  }

  /**
   * Get user's current subscription status
   */
  static async getUserSubscription(userId: string): Promise<UserSubscription | null> {
    try {
      const subscription = await prisma.userSubscription.findFirst({
        where: { 
          userId,
          status: { in: ['ACTIVE', 'TRIAL'] }
        },
        orderBy: { createdAt: 'desc' }
      });

      return subscription;
    } catch (error) {
      console.error("Error getting user subscription:", error);
      return null;
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
  ): Promise<{ sessionId: string; url: string }> {
    // Import Stripe service dynamically to avoid circular dependencies
    const { StripeService } = await import('./stripe-subscription-service');
    
    // Check if Stripe is available
    if (!StripeService.isAvailable()) {
      console.warn("⚠️ Stripe not available - using mock checkout");
      return {
        sessionId: `cs_mock_${Date.now()}`,
        url: `/pricing?plan=${planId}&interval=${interval}&mock=true`
      };
    }

    const result = await StripeService.createCheckoutSession(
      userId,
      planId,
      interval,
      successUrl,
      cancelUrl
    );

    if (!result.success) {
      throw new Error(result.error || 'Failed to create checkout session');
    }

    return {
      sessionId: result.sessionId,
      url: result.url
    };
  }

  /**
   * Handle successful subscription
   */
  static async handleSubscriptionSuccess(
    userId: string,
    stripeSubscriptionId: string,
    stripePriceId: string
  ): Promise<UserSubscription> {
    // TODO: Implement database update
    // Find plan by stripe price ID
    const plan = SUBSCRIPTION_PLANS.find(p => 
      p.stripePriceId.monthly === stripePriceId || 
      p.stripePriceId.yearly === stripePriceId
    );

    if (!plan) throw new Error('Plan not found for price ID');

    const interval: BillingInterval = plan.stripePriceId.yearly === stripePriceId ? 'yearly' : 'monthly';
    
    const subscription: UserSubscription = {
      id: `sub_${Date.now()}`,
      userId,
      tier: plan.tier,
      status: 'ACTIVE',
      billingInterval: interval,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + (interval === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000),
      cancelAtPeriodEnd: false,
      stripeSubscriptionId,
      stripeCustomerId: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log(`🎉 Subscription created: ${userId} upgraded to ${plan.tier}`);
    return subscription;
  }

  /**
   * Cancel subscription
   */
  static async cancelSubscription(
    userId: string,
    immediately: boolean = false
  ): Promise<{ success: boolean; effectiveDate: Date }> {
    const { StripeService } = await import('./stripe-subscription-service');
    
    // Check if Stripe is available
    if (!StripeService.isAvailable()) {
      console.warn("⚠️ Stripe not available - using mock cancellation");
      const effectiveDate = immediately ? new Date() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      
      // Update local subscription record in mock mode
      try {
        await prisma.userSubscription.updateMany({
          where: { userId, status: 'ACTIVE' },
          data: { 
            status: immediately ? 'CANCELLED' : 'ACTIVE',
            cancelAtPeriodEnd: !immediately,
            updatedAt: new Date()
          }
        });
      } catch (error) {
        console.error("Error updating subscription in mock mode:", error);
      }
      
      return { success: true, effectiveDate };
    }

    const result = await StripeService.cancelSubscription(userId, immediately);
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to cancel subscription');
    }

    return {
      success: true,
      effectiveDate: result.effectiveDate || new Date()
    };
  }

  /**
   * Generate revenue analytics
   */
  static generateRevenueAnalytics(): {
    totalSubscribers: number;
    monthlyRecurringRevenue: number;
    annualRecurringRevenue: number;
    averageRevenuePerUser: number;
    churnRate: number;
    tierDistribution: Record<SubscriptionTier, number>;
    conversionRate: number;
  } {
    // TODO: Implement actual analytics from database
    // Mock data for demonstration
    return {
      totalSubscribers: 2500,
      monthlyRecurringRevenue: 47500,
      annualRecurringRevenue: 570000,
      averageRevenuePerUser: 19.0,
      churnRate: 0.05, // 5%
      tierDistribution: {
        FREE: 1800,
        PRO: 550,
        ELITE: 150
      },
      conversionRate: 0.28 // 28% free to paid conversion
    };
  }
}

// =============================================================================
// 🔒 SUBSCRIPTION MIDDLEWARE & GUARDS
// =============================================================================

export function createSubscriptionMiddleware() {
  return async (req: any, res: any, next: any) => {
    // Add subscription context to requests
    const userId = req.user?.id;
    
    if (userId) {
      const subscription = await SubscriptionManager.getUserSubscription(userId);
      req.subscription = subscription;
      req.subscriptionTier = subscription?.tier || 'FREE';
    }
    
    next();
  };
}

/**
 * Check if user can access premium feature
 */
export function requiresSubscription(minimumTier: SubscriptionTier) {
  return (req: any, res: any, next: any) => {
    const userTier = req.subscriptionTier || 'FREE';
    const tierLevels = { FREE: 0, PRO: 1, ELITE: 2 };
    
    if (tierLevels[userTier as keyof typeof tierLevels] >= tierLevels[minimumTier]) {
      return next();
    }
    
    return res.status(402).json({
      error: 'Subscription required',
      requiredTier: minimumTier,
      currentTier: userTier,
      upgradeUrl: '/pricing'
    });
  };
}

// =============================================================================
// 💡 USAGE TRACKING UTILITIES
// =============================================================================

export class UsageTracker {
  
  /**
   * Track AI insight usage
   */
  static async trackAIInsight(userId: string, insightType: string) {
    await SubscriptionManager.trackFeatureUsage(userId, 'aiInsightsPerDay', 1);
    console.log(`🤖 AI Insight used: ${userId} - ${insightType}`);
  }

  /**
   * Track voice assistant usage
   */
  static async trackVoiceUsage(userId: string, minutes: number) {
    await SubscriptionManager.trackFeatureUsage(userId, 'voiceMinutesPerMonth', minutes);
    console.log(`🎤 Voice usage: ${userId} - ${minutes} minutes`);
  }

  /**
   * Track league creation
   */
  static async trackLeagueCreation(userId: string) {
    await SubscriptionManager.trackFeatureUsage(userId, 'maxLeagues', 1);
    console.log(`🏆 League created: ${userId}`);
  }
}

export default SubscriptionManager;