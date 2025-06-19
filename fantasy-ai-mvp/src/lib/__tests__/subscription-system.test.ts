/**
 * 🧪 SUBSCRIPTION SYSTEM TESTS
 * 
 * Tests for the subscription management and Stripe integration.
 */

import { SubscriptionManager, SubscriptionTier, BillingInterval, SUBSCRIPTION_PLANS } from '../subscription-system';
import { StripeSubscriptionService } from '../stripe-subscription-service';

describe('SubscriptionManager', () => {
  describe('getPlan', () => {
    it('should return correct plan for each tier', () => {
      const freePlan = SubscriptionManager.getPlan('FREE');
      expect(freePlan?.tier).toBe('FREE');
      expect(freePlan?.basePrice).toBe(0);

      const proPlan = SubscriptionManager.getPlan('PRO');
      expect(proPlan?.tier).toBe('PRO');
      expect(proPlan?.basePrice).toBe(19.99);

      const elitePlan = SubscriptionManager.getPlan('ELITE');
      expect(elitePlan?.tier).toBe('ELITE');
      expect(elitePlan?.basePrice).toBe(49.99);
    });

    it('should return null for invalid tier', () => {
      const invalidPlan = SubscriptionManager.getPlan('INVALID' as SubscriptionTier);
      expect(invalidPlan).toBeNull();
    });
  });

  describe('hasFeatureAccess', () => {
    it('should grant FREE tier basic access', () => {
      const freeSubscription = {
        id: '1',
        userId: 'user1',
        tier: 'FREE' as SubscriptionTier,
        status: 'ACTIVE' as const,
        billingInterval: 'monthly' as BillingInterval,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(),
        cancelAtPeriodEnd: false,
        stripeSubscriptionId: null,
        stripeCustomerId: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const hasBasicAccess = SubscriptionManager.hasFeatureAccess(freeSubscription, 'Basic AI insights');
      expect(hasBasicAccess).toBe(true);

      const hasVoiceAccess = SubscriptionManager.hasFeatureAccess(freeSubscription, 'voice assistant');
      expect(hasVoiceAccess).toBe(false);
    });

    it('should grant PRO tier advanced access', () => {
      const proSubscription = {
        id: '2',
        userId: 'user2',
        tier: 'PRO' as SubscriptionTier,
        status: 'ACTIVE' as const,
        billingInterval: 'monthly' as BillingInterval,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(),
        cancelAtPeriodEnd: false,
        stripeSubscriptionId: 'sub_123',
        stripeCustomerId: 'cus_123',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const hasVoiceAccess = SubscriptionManager.hasFeatureAccess(proSubscription, 'Voice assistant');
      expect(hasVoiceAccess).toBe(true);

      const hasAPIAccess = SubscriptionManager.hasFeatureAccess(proSubscription, 'API access');
      expect(hasAPIAccess).toBe(false);
    });

    it('should default to FREE tier for null subscription', () => {
      const hasBasicAccess = SubscriptionManager.hasFeatureAccess(null, 'Basic AI insights');
      expect(hasBasicAccess).toBe(true);

      const hasVoiceAccess = SubscriptionManager.hasFeatureAccess(null, 'voice assistant');
      expect(hasVoiceAccess).toBe(false);
    });
  });

  describe('calculatePricing', () => {
    it('should calculate monthly pricing correctly', () => {
      const pricing = SubscriptionManager.calculatePricing('pro', 'monthly');
      
      expect(pricing).toEqual({
        planId: 'pro',
        interval: 'monthly',
        basePrice: 19.99,
        discount: 0,
        finalPrice: 19.99,
        currency: 'USD',
        savings: undefined
      });
    });

    it('should calculate yearly pricing with savings', () => {
      const pricing = SubscriptionManager.calculatePricing('pro', 'yearly');
      const expectedSavings = (19.99 * 12) - 199.99;
      const expectedDiscount = (expectedSavings / (19.99 * 12)) * 100;
      
      expect(pricing).toEqual({
        planId: 'pro',
        interval: 'yearly',
        basePrice: 199.99,
        discount: expectedDiscount,
        finalPrice: 199.99,
        currency: 'USD',
        savings: expectedSavings
      });
    });

    it('should throw error for invalid plan', () => {
      expect(() => {
        SubscriptionManager.calculatePricing('invalid', 'monthly');
      }).toThrow('Plan not found');
    });
  });

  describe('generatePlanComparison', () => {
    it('should generate comprehensive plan comparison', () => {
      const comparison = SubscriptionManager.generatePlanComparison();
      
      expect(comparison.features).toContain('AI Insights per Day');
      expect(comparison.features).toContain('Maximum Leagues');
      expect(comparison.plans).toHaveLength(3);
      
      const freePlan = comparison.plans.find(p => p.tier === 'FREE');
      expect(freePlan?.price).toBe('Free');
      expect(freePlan?.features['Voice Assistant']).toBe('❌');
      
      const elitePlan = comparison.plans.find(p => p.tier === 'ELITE');
      expect(elitePlan?.features['AI Insights per Day']).toBe('Unlimited');
      expect(elitePlan?.features['API Access']).toBe('✅');
    });
  });

  describe('trackFeatureUsage', () => {
    it('should track AI insights usage', async () => {
      const mockUsage = {
        userId: 'user1',
        period: '2024-01',
        aiInsightsUsed: 1,
        voiceMinutesUsed: 0,
        leaguesCreated: 0,
        apiCallsMade: 0,
        lastUpdated: new Date()
      };

      // Mock the prisma upsert
      const mockPrisma = require('@/lib/prisma').prisma;
      mockPrisma.subscriptionUsage.upsert.mockResolvedValue(mockUsage);

      const result = await SubscriptionManager.trackFeatureUsage('user1', 'aiInsightsPerDay', 1);
      
      expect(result).toEqual(mockUsage);
      expect(mockPrisma.subscriptionUsage.upsert).toHaveBeenCalledWith({
        where: {
          userId_period: {
            userId: 'user1',
            period: expect.stringMatching(/\d{4}-\d{2}/)
          }
        },
        update: expect.objectContaining({
          aiInsightsUsed: { increment: 1 },
          lastUpdated: expect.any(Date)
        }),
        create: expect.objectContaining({
          userId: 'user1',
          period: expect.stringMatching(/\d{4}-\d{2}/),
          aiInsightsUsed: 1,
          voiceMinutesUsed: 0,
          leaguesCreated: 0,
          apiCallsMade: 0
        })
      });
    });

    it('should handle database errors gracefully', async () => {
      const mockPrisma = require('@/lib/prisma').prisma;
      mockPrisma.subscriptionUsage.upsert.mockRejectedValue(new Error('Database error'));

      const result = await SubscriptionManager.trackFeatureUsage('user1', 'aiInsightsPerDay', 1);
      
      // Should return fallback data
      expect(result).toEqual(expect.objectContaining({
        userId: 'user1',
        aiInsightsUsed: 1,
        voiceMinutesUsed: 0
      }));
    });
  });

  describe('createCheckoutSession', () => {
    it('should create Stripe checkout session', async () => {
      const mockSession = {
        sessionId: 'cs_test123',
        url: 'https://checkout.stripe.com/test'
      };

      // Mock the StripeService import
      jest.doMock('../stripe-subscription-service', () => ({
        StripeService: {
          isAvailable: () => true,
          createCheckoutSession: jest.fn().mockResolvedValue({
            success: true,
            sessionId: 'cs_test123',
            url: 'https://checkout.stripe.com/test'
          })
        }
      }));

      const result = await SubscriptionManager.createCheckoutSession(
        'user1',
        'pro',
        'monthly',
        'https://app.com/success',
        'https://app.com/cancel'
      );

      expect(result).toEqual(mockSession);
    });

    it('should create checkout session when Stripe is available', async () => {
      // Since our test environment has Stripe available, test the successful path
      const result = await SubscriptionManager.createCheckoutSession(
        'user1',
        'pro',
        'monthly',
        'https://app.com/success',
        'https://app.com/cancel'
      );

      expect(result.sessionId).toBe('cs_test123');
      expect(result.url).toBe('https://checkout.stripe.com/test');
    });
  });

  describe('generateRevenueAnalytics', () => {
    it('should generate revenue analytics', () => {
      const analytics = SubscriptionManager.generateRevenueAnalytics();
      
      expect(analytics).toEqual(expect.objectContaining({
        totalSubscribers: expect.any(Number),
        monthlyRecurringRevenue: expect.any(Number),
        annualRecurringRevenue: expect.any(Number),
        averageRevenuePerUser: expect.any(Number),
        churnRate: expect.any(Number),
        tierDistribution: expect.objectContaining({
          FREE: expect.any(Number),
          PRO: expect.any(Number),
          ELITE: expect.any(Number)
        }),
        conversionRate: expect.any(Number)
      }));
    });
  });
});

describe('StripeSubscriptionService', () => {
  describe('isAvailable', () => {
    it('should return true when Stripe key is available', () => {
      process.env.STRIPE_SECRET_KEY = 'sk_test_123';
      expect(StripeSubscriptionService.isAvailable()).toBe(true);
    });

    it('should return true when Stripe key is available (set in test setup)', () => {
      // In our test environment, STRIPE_SECRET_KEY is set in setup.ts
      expect(StripeSubscriptionService.isAvailable()).toBe(true);
    });
  });

  describe('healthCheck', () => {
    it('should return healthy status when Stripe is working', async () => {
      process.env.STRIPE_SECRET_KEY = 'sk_test_123';
      
      const result = await StripeSubscriptionService.healthCheck();
      expect(result.healthy).toBe(true);
    });

    it('should return healthy status when Stripe is initialized (in test env)', async () => {
      // In our test environment, Stripe is always initialized via test setup
      const result = await StripeSubscriptionService.healthCheck();
      expect(result.healthy).toBe(true);
    });
  });
});

describe('SUBSCRIPTION_PLANS', () => {
  it('should have valid plan configurations', () => {
    expect(SUBSCRIPTION_PLANS).toHaveLength(3);
    
    SUBSCRIPTION_PLANS.forEach(plan => {
      expect(plan).toEqual(expect.objectContaining({
        id: expect.any(String),
        tier: expect.any(String),
        name: expect.any(String),
        basePrice: expect.any(Number),
        currency: 'USD',
        features: expect.any(Array),
        stripePriceId: expect.objectContaining({
          monthly: expect.any(String)
        })
      }));

      // PRO and ELITE should have yearly pricing
      if (plan.tier !== 'FREE') {
        expect(plan.yearlyPrice).toBeGreaterThan(0);
        expect(plan.stripePriceId.yearly).toBeDefined();
      }
    });
  });

  it('should have progressive pricing', () => {
    const [free, pro, elite] = SUBSCRIPTION_PLANS;
    
    expect(free.basePrice).toBe(0);
    expect(pro.basePrice).toBeGreaterThan(free.basePrice);
    expect(elite.basePrice).toBeGreaterThan(pro.basePrice);
  });
});