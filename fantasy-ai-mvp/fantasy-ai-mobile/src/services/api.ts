import { 
  League, 
  Player, 
  AIInsight, 
  User,
  PlayerFilter,
  PaginatedResponse,
  APIResponse 
} from '../types';
import { Storage, StorageKeys, CacheManager, CacheDuration } from '../lib/storage';
import Constants from 'expo-constants';

// Use the deployed API URL from app.json
const API_BASE_URL = Constants.expoConfig?.extra?.apiUrl || 'https://fantasy-ai-mvp.vercel.app/api';
const WS_URL = Constants.expoConfig?.extra?.websocketUrl || 'wss://fantasy-ai-mvp.vercel.app';

// Helper function for API calls with authentication
async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  try {
    // Get auth token from secure storage
    const authToken = Storage.get<string>(StorageKeys.AUTH_TOKEN);
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
        ...options?.headers,
      },
    });

    if (response.status === 401) {
      // Token expired or invalid
      Storage.delete(StorageKeys.AUTH_TOKEN);
      Storage.delete(StorageKeys.USER);
      throw new Error('Authentication required');
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// API Service with real endpoints
export const api = {
  // Authentication
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const response = await fetchAPI<any>('/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    // Store auth token
    if (response.token) {
      Storage.set(StorageKeys.AUTH_TOKEN, response.token);
      Storage.set(StorageKeys.USER, response.user);
    }
    
    return response;
  },

  async signup(email: string, password: string, name: string): Promise<{ user: User; token: string }> {
    const response = await fetchAPI<any>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
    
    // Store auth token
    if (response.token) {
      Storage.set(StorageKeys.AUTH_TOKEN, response.token);
      Storage.set(StorageKeys.USER, response.user);
    }
    
    return response;
  },

  async logout(): Promise<void> {
    Storage.delete(StorageKeys.AUTH_TOKEN);
    Storage.delete(StorageKeys.USER);
    CacheManager.invalidateCache();
  },

  // Leagues
  async getLeagues(): Promise<League[]> {
    return CacheManager.getCachedData(
      'leagues',
      () => fetchAPI<League[]>('/leagues'),
      CacheDuration.SHORT
    );
  },

  async getLeague(id: string): Promise<League> {
    return CacheManager.getCachedData(
      `league-${id}`,
      () => fetchAPI<League>(`/leagues/${id}`),
      CacheDuration.MEDIUM
    );
  },

  async connectLeague(platform: string, credentials: any): Promise<League> {
    return fetchAPI<League>('/leagues/connect', {
      method: 'POST',
      body: JSON.stringify({ platform, credentials }),
    });
  },

  // Players
  async getPlayers(filter?: PlayerFilter): Promise<PaginatedResponse<Player>> {
    const params = new URLSearchParams();
    
    if (filter?.position?.length) {
      params.append('positions', filter.position.join(','));
    }
    if (filter?.team?.length) {
      params.append('teams', filter.team.join(','));
    }
    if (filter?.searchQuery) {
      params.append('search', filter.searchQuery);
    }
    if (filter?.available !== undefined) {
      params.append('available', String(filter.available));
    }
    
    const endpoint = `/sports/live-players${params.toString() ? `?${params}` : ''}`;
    
    return CacheManager.getCachedData(
      `players-${params.toString()}`,
      () => fetchAPI<PaginatedResponse<Player>>(endpoint),
      CacheDuration.SHORT
    );
  },

  async getPlayer(id: string): Promise<Player> {
    return CacheManager.getCachedData(
      `player-${id}`,
      () => fetchAPI<Player>(`/sports/players/${id}`),
      CacheDuration.MEDIUM
    );
  },

  async getTrendingPlayers(): Promise<Player[]> {
    return CacheManager.getCachedData(
      'trending-players',
      () => fetchAPI<Player[]>('/sports/nfl/top-performers'),
      CacheDuration.SHORT
    );
  },

  // AI Insights & Predictions
  async getAIInsights(): Promise<AIInsight[]> {
    return CacheManager.getCachedData(
      'ai-insights',
      () => fetchAPI<AIInsight[]>('/ai/predictions'),
      CacheDuration.SHORT
    );
  },

  async getPlayerPerformance(playerId: string): Promise<any> {
    return fetchAPI<any>('/ml/player-performance', {
      method: 'POST',
      body: JSON.stringify({ playerId }),
    });
  },

  async getInjuryRisk(playerId: string): Promise<any> {
    return fetchAPI<any>('/ml/injury-risk', {
      method: 'POST',
      body: JSON.stringify({ playerId }),
    });
  },

  async optimizeLineup(lineup: any, constraints: any): Promise<any> {
    return fetchAPI<any>('/ml/lineup-optimizer', {
      method: 'POST',
      body: JSON.stringify({ lineup, constraints }),
    });
  },

  async analyzeTrade(trade: any): Promise<any> {
    return fetchAPI<any>('/ml/trade-analyzer', {
      method: 'POST',
      body: JSON.stringify(trade),
    });
  },

  async getDraftAssistance(draftContext: any): Promise<any> {
    return fetchAPI<any>('/ml/draft-assistant', {
      method: 'POST',
      body: JSON.stringify(draftContext),
    });
  },

  // Voice Commands
  async processVoiceCommand(command: string, voiceProfile?: string): Promise<any> {
    return fetchAPI<any>('/voice/process', {
      method: 'POST',
      body: JSON.stringify({ 
        command, 
        userId: Storage.get<User>(StorageKeys.USER)?.id,
        voiceProfile,
        generateSpeech: true,
      }),
    });
  },

  // Live Data
  async getLiveScores(): Promise<any> {
    return CacheManager.getCachedData(
      'live-scores',
      () => fetchAPI<any>('/live-sports-data'),
      30000 // 30 seconds
    );
  },

  // User & Subscription
  async getCurrentUser(): Promise<User> {
    const cachedUser = Storage.get<User>(StorageKeys.USER);
    if (cachedUser) return cachedUser;
    
    const user = await fetchAPI<User>('/auth/me');
    Storage.set(StorageKeys.USER, user);
    return user;
  },

  async getSubscriptionStatus(): Promise<any> {
    return fetchAPI<any>('/subscription/status');
  },

  async createCheckoutSession(priceId: string): Promise<{ url: string }> {
    return fetchAPI<any>('/subscription/checkout', {
      method: 'POST',
      body: JSON.stringify({ priceId }),
    });
  },

  // Social Features
  async getFriends(): Promise<any[]> {
    return CacheManager.getCachedData(
      'friends',
      () => fetchAPI<any[]>('/friends'),
      CacheDuration.MEDIUM
    );
  },

  async getActivities(): Promise<any[]> {
    return CacheManager.getCachedData(
      'activities',
      () => fetchAPI<any[]>('/social/activities'),
      CacheDuration.SHORT
    );
  },

  // Notifications
  async getNotificationSettings(): Promise<any> {
    return fetchAPI<any>('/notifications/settings');
  },

  async updateNotificationSettings(settings: any): Promise<any> {
    return fetchAPI<any>('/notifications/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  },

  async subscribeToNotifications(token: string): Promise<void> {
    return fetchAPI<any>('/notifications/subscribe', {
      method: 'POST',
      body: JSON.stringify({ token, platform: Constants.platform?.os }),
    });
  },

  // Achievements & Gamification
  async getAchievements(): Promise<any[]> {
    return CacheManager.getCachedData(
      'achievements',
      () => fetchAPI<any[]>('/achievements'),
      CacheDuration.LONG
    );
  },

  async getChallenges(): Promise<any[]> {
    return CacheManager.getCachedData(
      'challenges',
      () => fetchAPI<any[]>('/challenges'),
      CacheDuration.MEDIUM
    );
  },

  // WebSocket URL getter
  getWebSocketUrl(): string {
    const token = Storage.get<string>(StorageKeys.AUTH_TOKEN);
    return token ? `${WS_URL}?token=${token}` : WS_URL;
  },
};