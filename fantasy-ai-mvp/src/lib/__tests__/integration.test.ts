/**
 * 🧪 INTEGRATION TESTS
 * 
 * End-to-end tests for critical user journeys and system integrations.
 */

import { AIService } from '../ai-service';
import { FantasyProviderAPI, FantasyProviderManager } from '../fantasy-providers';
import { SubscriptionManager } from '../subscription-system';
import { StripeSubscriptionService } from '../stripe-subscription-service';

describe('Integration Tests', () => {
  describe('User Registration → League Sync → AI Insights Flow', () => {
    it('should complete full user onboarding flow', async () => {
      // Step 1: User creates subscription
      const mockUser = {
        id: 'user_123',
        email: 'test@example.com',
        name: 'Test User'
      };

      // Step 2: User subscribes to PRO plan
      const mockSubscription = {
        id: 'sub_123',
        userId: mockUser.id,
        tier: 'PRO' as const,
        status: 'ACTIVE' as const,
        billingInterval: 'monthly' as const,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        cancelAtPeriodEnd: false,
        stripeSubscriptionId: 'stripe_sub_123',
        stripeCustomerId: 'stripe_cus_123',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Mock Prisma calls
      const mockPrisma = require('@/lib/prisma').prisma;
      mockPrisma.userSubscription.findFirst.mockResolvedValue(mockSubscription);

      // Step 3: User connects Sleeper league
      const providerManager = new FantasyProviderManager();
      providerManager.initializeProvider('sleeper');

      // Mock successful league fetch
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([{
          league_id: 'sleeper_123',
          name: 'Test Dynasty League',
          total_rosters: 12,
          season: '2024',
          status: 'in_season',
          scoring_settings: { rec: 1 }
        }])
      });

      const leagues = await providerManager.getProvider('sleeper')!.getLeagues(mockUser.id);
      expect(leagues).toHaveLength(1);
      expect(leagues[0].name).toBe('Test Dynasty League');

      // Step 4: System generates AI insights
      const aiService = new AIService();

      const playerAnalysis = await aiService.analyzePlayer(
        'Christian McCaffrey',
        'RB',
        'SF',
        'SEA',
        { week: 12 }
      );

      expect(playerAnalysis.narrativeInsights).toContain('Mock insight 1');
      expect(playerAnalysis.projectedPoints).toBeGreaterThan(15);

      // Step 5: Track feature usage
      mockPrisma.subscriptionUsage.upsert.mockResolvedValue({
        userId: mockUser.id,
        period: '2024-01',
        aiInsightsUsed: 1,
        voiceMinutesUsed: 0,
        leaguesCreated: 1,
        apiCallsMade: 0,
        lastUpdated: new Date()
      });

      await SubscriptionManager.trackFeatureUsage(mockUser.id, 'aiInsightsPerDay', 1);

      // Verify user has PRO access
      const hasVoiceAccess = SubscriptionManager.hasFeatureAccess(mockSubscription, 'Voice assistant');
      expect(hasVoiceAccess).toBe(true);

      // Verify all systems working together
      expect(leagues).toHaveLength(1);
      expect(playerAnalysis.confidence).toBeGreaterThan(0.5);
      expect(mockPrisma.subscriptionUsage.upsert).toHaveBeenCalled();
    });
  });

  describe('Multi-Platform Fantasy Data Aggregation', () => {
    it('should sync data from multiple providers', async () => {
      const manager = new FantasyProviderManager();
      
      // Initialize multiple providers
      manager.initializeProvider('sleeper');
      manager.initializeProvider('yahoo', 'test-yahoo-token');

      // Mock different responses for each provider
      global.fetch = jest.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([{
            league_id: 'sleeper_123',
            name: 'Sleeper Dynasty',
            total_rosters: 12,
            season: '2024'
          }])
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            fantasy_content: {
              users: [{
                user: [null, {
                  games: {
                    game: [null, {
                      leagues: {
                        league: [{
                          league_key: 'yahoo_456',
                          name: 'Yahoo Redraft',
                          num_teams: 10,
                          season: '2024'
                        }]
                      }
                    }]
                  }
                }]
              }]
            }
          })
        });

      const syncResults = await manager.syncAllUserLeagues('test_user');

      expect(syncResults.success).toBe(true);
      expect(syncResults.totalLeagues).toBeGreaterThan(0);
      expect(syncResults.results.sleeper).toBeDefined();
      expect(syncResults.results.yahoo).toBeDefined();
    });
  });

  describe('Subscription + AI + Provider Integration', () => {
    it('should enforce subscription limits on AI usage', async () => {
      // Mock FREE tier user
      const freeSubscription = {
        id: 'sub_free',
        userId: 'user_free',
        tier: 'FREE' as const,
        status: 'ACTIVE' as const,
        billingInterval: 'monthly' as const,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(),
        cancelAtPeriodEnd: false,
        stripeSubscriptionId: null,
        stripeCustomerId: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Mock usage at FREE tier limit (10 insights per day)
      const mockPrisma = require('@/lib/prisma').prisma;
      mockPrisma.subscriptionUsage.findUnique.mockResolvedValue({
        userId: 'user_free',
        period: '2024-01',
        aiInsightsUsed: 10, // At limit
        voiceMinutesUsed: 0,
        leaguesCreated: 1,
        apiCallsMade: 0,
        lastUpdated: new Date()
      });

      const usage = {
        userId: 'user_free',
        period: '2024-01',
        aiInsightsUsed: 10,
        voiceMinutesUsed: 0,
        leaguesCreated: 1,
        apiCallsMade: 0,
        lastUpdated: new Date()
      };

      const quota = SubscriptionManager.checkFeatureQuota(
        freeSubscription,
        usage,
        'aiInsightsPerDay'
      );

      expect(quota.used).toBe(10);
      expect(quota.limit).toBe(10);
      expect(quota.unlimited).toBe(false);

      // User should not be able to use more insights
      const hasAccess = quota.used < quota.limit;
      expect(hasAccess).toBe(false);
    });

    it('should allow unlimited usage for ELITE tier', async () => {
      const eliteSubscription = {
        id: 'sub_elite',
        userId: 'user_elite',
        tier: 'ELITE' as const,
        status: 'ACTIVE' as const,
        billingInterval: 'yearly' as const,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(),
        cancelAtPeriodEnd: false,
        stripeSubscriptionId: 'stripe_elite',
        stripeCustomerId: 'cus_elite',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const usage = {
        userId: 'user_elite',
        period: '2024-01',
        aiInsightsUsed: 500, // Way over FREE limit
        voiceMinutesUsed: 1000,
        leaguesCreated: 50,
        apiCallsMade: 10000,
        lastUpdated: new Date()
      };

      const quota = SubscriptionManager.checkFeatureQuota(
        eliteSubscription,
        usage,
        'aiInsightsPerDay'
      );

      expect(quota.unlimited).toBe(true);
      expect(quota.limit).toBe(Infinity);

      // ELITE user should always have access
      const hasAccess = quota.unlimited || quota.used < quota.limit;
      expect(hasAccess).toBe(true);
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should handle provider API failures gracefully', async () => {
      const manager = new FantasyProviderManager();
      manager.initializeProvider('sleeper');

      // Mock API failure
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      const leagues = await manager.getProvider('sleeper')!.getLeagues('test_user');
      
      // Should return empty array instead of throwing
      expect(leagues).toEqual([]);
    });

    it('should handle AI service with mock data', async () => {
      const aiService = new AIService();
      
      // Test that AI service works with global mock
      const result = await aiService.analyzePlayer('Test Player', 'QB', 'TB', 'NO', { week: 1 });
      
      expect(result).toBeDefined();
      expect(result.playerName).toBe('Test Player');
      expect(result.confidence).toBe(0.85);
    });

    it('should handle database failures in subscription tracking', async () => {
      const mockPrisma = require('@/lib/prisma').prisma;
      mockPrisma.subscriptionUsage.upsert.mockRejectedValue(
        new Error('Database connection failed')
      );

      // Should return fallback data instead of throwing
      const result = await SubscriptionManager.trackFeatureUsage('user1', 'aiInsightsPerDay', 1);
      
      expect(result).toEqual(expect.objectContaining({
        userId: 'user1',
        aiInsightsUsed: 1
      }));
    });
  });

  describe('Performance and Caching', () => {
    it('should cache provider responses effectively', async () => {
      const sleeperAPI = new FantasyProviderAPI('sleeper');
      
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([{ league_id: 'test', name: 'Test League' }])
      });

      // First call
      const leagues1 = await sleeperAPI.getLeagues('test_user');
      
      // Second call (should use cache)
      const leagues2 = await sleeperAPI.getLeagues('test_user');

      expect(leagues1).toEqual(leagues2);
      expect(global.fetch).toHaveBeenCalledTimes(1); // Only one actual API call
    });

    it('should respect rate limits', async () => {
      const sleeperAPI = new FantasyProviderAPI('sleeper');
      
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([])
      });

      const startTime = Date.now();
      
      // Make multiple calls
      await sleeperAPI.getLeagues('user1');
      await sleeperAPI.getLeagues('user2');
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should take at least 1 second due to rate limiting
      expect(duration).toBeGreaterThanOrEqual(1000);
    });
  });
});