/**
 * 🧪 AI SERVICE TESTS
 * 
 * Tests for the OpenAI integration service that powers fantasy insights.
 */

import { AIService } from '../ai-service';

describe('AIService', () => {
  let aiService: AIService;

  beforeEach(() => {
    aiService = new AIService();
    jest.clearAllMocks();
  });

  describe('analyzePlayer', () => {
    it('should analyze a player and return insights', async () => {
      // Test with the global mock that returns structured data
      const result = await aiService.analyzePlayer(
        'Christian McCaffrey',
        'RB',
        'SF',
        'SEA',
        {
          week: 12,
          weather: 'Clear',
          injuryStatus: 'Healthy'
        }
      );

      expect(result).toBeDefined();
      expect(result.playerName).toBe('Christian McCaffrey');
      expect(result.projectedPoints).toBeGreaterThan(0);
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
      expect(Array.isArray(result.narrativeInsights)).toBe(true);
      expect(Array.isArray(result.riskFactors)).toBe(true);
      expect(Array.isArray(result.opportunities)).toBe(true);
    });

    it('should return valid analysis with mock data', async () => {
      // Test that the service works correctly with mock OpenAI responses
      const result = await aiService.analyzePlayer(
        'Test Player',
        'QB',
        'TB',
        'NO',
        { week: 1 }
      );

      // Should return a valid result with mock data
      expect(result).toBeDefined();
      expect(result.playerName).toBe('Test Player');
      expect(result.projectedPoints).toBeGreaterThan(0);
      expect(result.confidence).toBe(0.85); // Mock confidence from setup
      expect(result.narrativeInsights).toContain('Mock insight 1');
    });
  });

  describe('generateLineupNarrative', () => {
    it('should generate compelling lineup narrative', async () => {
      const lineup = [
        { name: 'Josh Allen', position: 'QB', team: 'BUF', opponent: 'MIA', projectedPoints: 22 },
        { name: 'Christian McCaffrey', position: 'RB', team: 'SF', opponent: 'SEA', projectedPoints: 18 },
        { name: 'Davante Adams', position: 'WR', team: 'LV', opponent: 'KC', projectedPoints: 16 }
      ];

      const result = await aiService.generateLineupNarrative(
        lineup,
        12,
        'Regular season finale'
      );

      expect(result).toBeDefined();
      expect(typeof result.overallStory).toBe('string');
      expect(Array.isArray(result.keyPlayers)).toBe(true);
      expect(typeof result.riskAssessment).toBe('string');
      expect(result.confidenceLevel).toBeGreaterThanOrEqual(0);
      expect(result.confidenceLevel).toBeLessThanOrEqual(1);
    });
  });

  describe('analyzeTrade', () => {
    it('should provide detailed trade analysis', async () => {
      const result = await aiService.analyzeTrade(
        ['Austin Ekeler', 'Tyler Lockett'],
        ['Saquon Barkley'],
        {
          teamRecord: '8-4',
          playoffPush: true
        }
      );

      expect(result).toBeDefined();
      expect(['accept', 'decline', 'negotiate']).toContain(result.recommendation);
      expect(Array.isArray(result.reasoning)).toBe(true);
      expect(typeof result.valueAssessment).toBe('string');
      expect(Array.isArray(result.riskFactors)).toBe(true);
      expect(Array.isArray(result.alternativeOptions)).toBe(true);
      expect(result.confidenceScore).toBeGreaterThanOrEqual(0);
      expect(result.confidenceScore).toBeLessThanOrEqual(1);
    });
  });

  describe('generateVoiceResponse', () => {
    it('should generate voice assistant response', async () => {
      const result = await aiService.generateVoiceResponse(
        'Should I start Josh Allen this week?',
        {
          userTeam: [
            { name: 'Josh Allen', position: 'QB', status: 'active' }
          ]
        }
      );

      expect(result).toBeDefined();
      expect(typeof result.response).toBe('string');
      expect(result.response.length).toBeGreaterThan(0);
      // Actions and followUp are optional
      if (result.actions) {
        expect(Array.isArray(result.actions)).toBe(true);
      }
      if (result.followUp) {
        expect(Array.isArray(result.followUp)).toBe(true);
      }
    });
  });

  describe('static methods', () => {
    it('should return true when OpenAI API key is set (in test setup)', () => {
      // The API key is set in test setup, so this should be true
      expect(AIService.isAvailable()).toBe(true);
    });
  });

  describe('healthCheck', () => {
    it('should perform health check', async () => {
      const result = await aiService.healthCheck();
      
      // Should return boolean
      expect(typeof result).toBe('boolean');
    });
  });
});