/**
 * 🧪 FANTASY PROVIDERS TESTS
 * 
 * Tests for the fantasy provider data pipeline and API integrations.
 */

import { FantasyProviderAPI, FantasyProviderManager, validateProviderAuth } from '../fantasy-providers';

// Mock fetch for API calls
global.fetch = jest.fn();
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

describe('FantasyProviderAPI', () => {
  let sleeperAPI: FantasyProviderAPI;
  let yahooAPI: FantasyProviderAPI;

  beforeEach(() => {
    sleeperAPI = new FantasyProviderAPI('sleeper');
    yahooAPI = new FantasyProviderAPI('yahoo', 'test-access-token');
    jest.clearAllMocks();
  });

  describe('Sleeper API', () => {
    it('should fetch user leagues successfully', async () => {
      const mockLeagueData = [
        {
          league_id: '123456789',
          name: 'Test League',
          total_rosters: 12,
          season: '2024',
          status: 'in_season',
          scoring_settings: { rec: 1 }
        }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockLeagueData),
      } as Response);

      const leagues = await sleeperAPI.getLeagues('test_user');

      expect(leagues).toHaveLength(1);
      expect(leagues[0]).toEqual(expect.objectContaining({
        id: '123456789',
        name: 'Test League',
        sport: 'nfl',
        season: '2024',
        settings: expect.objectContaining({
          teamCount: 12,
          scoringType: 'ppr'
        })
      }));

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.sleeper.app/v1/user/test_user/leagues/nfl/2024',
        expect.objectContaining({
          headers: expect.objectContaining({
            'User-Agent': 'Fantasy.AI/1.0'
          })
        })
      );
    });

    it('should handle API errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      } as Response);

      const leagues = await sleeperAPI.getLeagues('invalid_user');
      expect(leagues).toEqual([]);
    });

    it('should cache league data', async () => {
      const mockLeagueData = [{ league_id: '123', name: 'Test' }];
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockLeagueData),
      } as Response);

      // First call
      await sleeperAPI.getLeagues('test_user');
      
      // Second call (should use cache)
      await sleeperAPI.getLeagues('test_user');

      // Should only make one API call due to caching
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Yahoo API', () => {
    it('should return empty array when access token is missing', async () => {
      const unauthenticatedAPI = new FantasyProviderAPI('yahoo');
      
      const leagues = await unauthenticatedAPI.getLeagues('test_user');
      expect(leagues).toEqual([]);
    });

    it('should handle token expiration gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      } as Response);

      const leagues = await yahooAPI.getLeagues('test_user');
      expect(leagues).toEqual([]);
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits between requests', async () => {
      const startTime = Date.now();
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      } as Response);

      // Make two sequential calls
      await sleeperAPI.getLeagues('user1');
      await sleeperAPI.getLeagues('user2');

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should take at least 1 second (rate limit delay)
      expect(duration).toBeGreaterThanOrEqual(1000);
    });
  });

  describe('Data Transformation', () => {
    it('should transform Sleeper league data to standard format', async () => {
      const sleeperLeague = {
        league_id: 'sleeper123',
        name: 'Dynasty League',
        total_rosters: 10,
        season: '2024',
        status: 'in_season',
        scoring_settings: { rec: 0.5 }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([sleeperLeague]),
      } as Response);

      const leagues = await sleeperAPI.getLeagues('test_user');
      const league = leagues[0];

      expect(league).toEqual({
        id: 'sleeper123',
        name: 'Dynasty League',
        sport: 'nfl',
        season: '2024',
        settings: {
          teamCount: 10,
          rosterSize: 0,
          playoffWeeks: [14, 15, 16, 17],
          scoringType: 'ppr' // 0.5 PPR is treated as PPR since rec exists
        },
        isActive: true,
        metadata: sleeperLeague
      });
    });
  });

  describe('Database Sync', () => {
    it('should sync league data to database successfully', async () => {
      const mockLeague = {
        id: 'test123',
        name: 'Test League',
        sport: 'nfl',
        season: '2024',
        settings: { teamCount: 12, rosterSize: 16, playoffWeeks: [14, 15, 16, 17], scoringType: 'ppr' as const },
        isActive: true,
        metadata: {}
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([mockLeague]),
      } as Response);

      // Mock the getLeagueInfo and getTeams methods to return test data
      jest.spyOn(sleeperAPI, 'getLeagueInfo').mockResolvedValue(mockLeague);
      jest.spyOn(sleeperAPI, 'getTeams').mockResolvedValue([]);

      const result = await sleeperAPI.syncLeagueToDatabase('test123', 'user123');

      expect(result).toEqual(expect.objectContaining({
        success: true,
        provider: 'sleeper',
        leagueId: 'test123',
        syncedData: {
          teams: 0,
          players: 0,
          rosters: 0
        },
        errors: []
      }));
    });
  });
});

describe('FantasyProviderManager', () => {
  let manager: FantasyProviderManager;

  beforeEach(() => {
    manager = new FantasyProviderManager();
  });

  it('should initialize providers correctly', () => {
    const api = manager.initializeProvider('sleeper');
    expect(api).toBeInstanceOf(FantasyProviderAPI);
    
    const retrieved = manager.getProvider('sleeper');
    expect(retrieved).toBe(api);
  });

  it('should return null for uninitialized providers', () => {
    const api = manager.getProvider('yahoo');
    expect(api).toBeNull();
  });

  it('should sync all user leagues across providers', async () => {
    manager.initializeProvider('sleeper');
    
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    } as Response);

    const result = await manager.syncAllUserLeagues('test_user');

    expect(result).toEqual(expect.objectContaining({
      success: true,
      totalLeagues: 0,
      errors: []
    }));
  });

  it('should get sync statistics', () => {
    manager.initializeProvider('sleeper');
    manager.initializeProvider('yahoo', 'test-token');

    const stats = manager.getAllSyncStats();

    expect(stats).toHaveProperty('sleeper');
    expect(stats).toHaveProperty('yahoo');
    expect(stats.sleeper).toEqual(expect.objectContaining({
      provider: 'sleeper',
      requestCount: expect.any(Number),
      cacheSize: expect.any(Number)
    }));
  });

  it('should clear all caches', () => {
    const sleeperAPI = manager.initializeProvider('sleeper');
    const clearCacheSpy = jest.spyOn(sleeperAPI, 'clearCache');

    manager.clearAllCaches();

    expect(clearCacheSpy).toHaveBeenCalled();
  });
});

describe('Utility Functions', () => {
  describe('validateProviderAuth', () => {
    it('should validate Sleeper auth (no requirements)', () => {
      const result = validateProviderAuth('sleeper');
      expect(result.valid).toBe(true);
    });

    it('should require access token for Yahoo', () => {
      const resultInvalid = validateProviderAuth('yahoo');
      expect(resultInvalid.valid).toBe(false);
      expect(resultInvalid.error).toContain('requires OAuth access token');

      const resultValid = validateProviderAuth('yahoo', 'test-token');
      expect(resultValid.valid).toBe(true);
    });

    it('should require cookies for ESPN', () => {
      const resultInvalid = validateProviderAuth('espn');
      expect(resultInvalid.valid).toBe(false);
      expect(resultInvalid.error).toContain('requires authentication cookies');

      const resultValid = validateProviderAuth('espn', undefined, 'test-cookies');
      expect(resultValid.valid).toBe(true);
    });

    it('should reject unsupported providers', () => {
      const result = validateProviderAuth('invalid' as any);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Unsupported provider');
    });
  });
});