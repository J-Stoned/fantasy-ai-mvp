// Fantasy Platform OAuth Integration
// Secure authentication with Yahoo, ESPN, CBS, Sleeper

export interface FantasyPlatform {
  id: string;
  name: string;
  authUrl: string;
  clientId: string;
  scopes: string[];
  redirectUri: string;
}

export interface LeagueConnection {
  platformId: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
  userId: string;
  leagues: FantasyLeague[];
  connectedAt: Date;
}

export interface FantasyLeague {
  id: string;
  name: string;
  platform: string;
  sport: string;
  season: string;
  totalTeams: number;
  currentWeek?: number;
  userTeam?: {
    id: string;
    name: string;
    wins: number;
    losses: number;
    rank: number;
  };
}

// Fantasy Platform Configurations
export const FANTASY_PLATFORMS: Record<string, FantasyPlatform> = {
  yahoo: {
    id: 'yahoo',
    name: 'Yahoo Fantasy',
    authUrl: 'https://api.login.yahoo.com/oauth2/request_auth',
    clientId: process.env.YAHOO_CLIENT_ID || '',
    scopes: ['fspt-r', 'fspt-w'], // Fantasy Sports read/write
    redirectUri: `${process.env.NEXTAUTH_URL}/api/auth/callback/yahoo`
  },
  espn: {
    id: 'espn',
    name: 'ESPN Fantasy',
    authUrl: 'https://ha.espn.com/oauth/authorize',
    clientId: process.env.ESPN_CLIENT_ID || '',
    scopes: ['fantasy'],
    redirectUri: `${process.env.NEXTAUTH_URL}/api/auth/callback/espn`
  },
  cbs: {
    id: 'cbs',
    name: 'CBS Sports',
    authUrl: 'https://api.cbssports.com/oauth/authorize',
    clientId: process.env.CBS_CLIENT_ID || '',
    scopes: ['fantasy-read', 'fantasy-write'],
    redirectUri: `${process.env.NEXTAUTH_URL}/api/auth/callback/cbs`
  },
  sleeper: {
    id: 'sleeper',
    name: 'Sleeper',
    authUrl: 'https://sleeper.app/oauth/authorize',
    clientId: process.env.SLEEPER_CLIENT_ID || '',
    scopes: ['read'],
    redirectUri: `${process.env.NEXTAUTH_URL}/api/auth/callback/sleeper`
  },
  draftkings: {
    id: 'draftkings',
    name: 'DraftKings',
    authUrl: 'https://api.draftkings.com/oauth/authorize',
    clientId: process.env.DRAFTKINGS_CLIENT_ID || '',
    scopes: ['dfs-read'],
    redirectUri: `${process.env.NEXTAUTH_URL}/api/auth/callback/draftkings`
  },
  fanduel: {
    id: 'fanduel',
    name: 'FanDuel',
    authUrl: 'https://api.fanduel.com/oauth/authorize',
    clientId: process.env.FANDUEL_CLIENT_ID || '',
    scopes: ['contests'],
    redirectUri: `${process.env.NEXTAUTH_URL}/api/auth/callback/fanduel`
  }
};

/**
 * Generate OAuth authorization URL for a fantasy platform
 */
export function generateAuthUrl(platformId: string, state?: string): string {
  const platform = FANTASY_PLATFORMS[platformId];
  if (!platform) {
    throw new Error(`Unsupported platform: ${platformId}`);
  }

  const params = new URLSearchParams({
    client_id: platform.clientId,
    redirect_uri: platform.redirectUri,
    scope: platform.scopes.join(' '),
    response_type: 'code',
    state: state || generateState()
  });

  return `${platform.authUrl}?${params.toString()}`;
}

/**
 * Generate secure state parameter for OAuth
 */
export function generateState(): string {
  return btoa(crypto.getRandomValues(new Uint8Array(32)).toString());
}

/**
 * Validate OAuth state parameter
 */
export function validateState(receivedState: string, expectedState: string): boolean {
  return receivedState === expectedState;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(
  platformId: string, 
  code: string, 
  state: string
): Promise<LeagueConnection> {
  const platform = FANTASY_PLATFORMS[platformId];
  if (!platform) {
    throw new Error(`Unsupported platform: ${platformId}`);
  }

  // This would make actual API calls to each platform
  // For now, return mock data for development
  const mockConnection: LeagueConnection = {
    platformId,
    accessToken: `mock_token_${Date.now()}`,
    refreshToken: `mock_refresh_${Date.now()}`,
    expiresAt: new Date(Date.now() + 3600000), // 1 hour
    userId: 'user_123',
    connectedAt: new Date(),
    leagues: await fetchUserLeagues(platformId, `mock_token_${Date.now()}`)
  };

  return mockConnection;
}

/**
 * Fetch user's leagues from a platform
 */
export async function fetchUserLeagues(
  platformId: string, 
  accessToken: string
): Promise<FantasyLeague[]> {
  // Mock league data for development
  const mockLeagues: Record<string, FantasyLeague[]> = {
    yahoo: [
      {
        id: 'yahoo_league_1',
        name: 'Championship League',
        platform: 'yahoo',
        sport: 'NFL',
        season: '2024',
        totalTeams: 12,
        currentWeek: 14,
        userTeam: {
          id: 'team_1',
          name: 'AI Dominators',
          wins: 9,
          losses: 4,
          rank: 2
        }
      },
      {
        id: 'yahoo_league_2',
        name: 'Dynasty League',
        platform: 'yahoo',
        sport: 'NBA',
        season: '2024-25',
        totalTeams: 10,
        userTeam: {
          id: 'team_2',
          name: 'Data Wizards',
          wins: 12,
          losses: 8,
          rank: 4
        }
      }
    ],
    espn: [
      {
        id: 'espn_league_1',
        name: 'Work League',
        platform: 'espn',
        sport: 'NFL',
        season: '2024',
        totalTeams: 10,
        currentWeek: 14,
        userTeam: {
          id: 'espn_team_1',
          name: 'The Algorithmic Advantage',
          wins: 11,
          losses: 2,
          rank: 1
        }
      }
    ],
    cbs: [
      {
        id: 'cbs_league_1',
        name: 'Premium League',
        platform: 'cbs',
        sport: 'NFL',
        season: '2024',
        totalTeams: 14,
        currentWeek: 14,
        userTeam: {
          id: 'cbs_team_1',
          name: 'MCP Powered Squad',
          wins: 8,
          losses: 5,
          rank: 5
        }
      }
    ]
  };

  return mockLeagues[platformId] || [];
}

/**
 * Refresh access token
 */
export async function refreshAccessToken(
  platformId: string, 
  refreshToken: string
): Promise<{ accessToken: string; expiresAt: Date }> {
  const platform = FANTASY_PLATFORMS[platformId];
  if (!platform) {
    throw new Error(`Unsupported platform: ${platformId}`);
  }

  // Mock refresh for development
  return {
    accessToken: `refreshed_token_${Date.now()}`,
    expiresAt: new Date(Date.now() + 3600000)
  };
}

/**
 * Revoke access token and disconnect platform
 */
export async function disconnectPlatform(
  platformId: string, 
  accessToken: string
): Promise<void> {
  const platform = FANTASY_PLATFORMS[platformId];
  if (!platform) {
    throw new Error(`Unsupported platform: ${platformId}`);
  }

  // Make API call to revoke token
  console.log(`Disconnecting ${platform.name}...`);
}

/**
 * Get available platforms for connection
 */
export function getAvailablePlatforms(): FantasyPlatform[] {
  return Object.values(FANTASY_PLATFORMS).filter(platform => platform.clientId);
}

/**
 * Check if platform requires premium subscription
 */
export function isPremiumPlatform(platformId: string): boolean {
  const premiumPlatforms = ['draftkings', 'fanduel', 'nfl'];
  return premiumPlatforms.includes(platformId);
}

/**
 * Store connection in database/localStorage
 */
export async function storeConnection(connection: LeagueConnection): Promise<void> {
  // In development, store in localStorage
  const existingConnections = getStoredConnections();
  const updatedConnections = existingConnections.filter(c => c.platformId !== connection.platformId);
  updatedConnections.push(connection);
  
  localStorage.setItem('fantasy-ai-connections', JSON.stringify(updatedConnections));
  
  console.log(`✅ Connected to ${connection.platformId}:`, {
    leagues: connection.leagues.length,
    connectedAt: connection.connectedAt
  });
}

/**
 * Get stored connections from database/localStorage
 */
export function getStoredConnections(): LeagueConnection[] {
  if (typeof window === 'undefined') return [];
  
  const stored = localStorage.getItem('fantasy-ai-connections');
  return stored ? JSON.parse(stored) : [];
}

/**
 * Remove stored connection
 */
export async function removeConnection(platformId: string): Promise<void> {
  const existingConnections = getStoredConnections();
  const updatedConnections = existingConnections.filter(c => c.platformId !== platformId);
  localStorage.setItem('fantasy-ai-connections', JSON.stringify(updatedConnections));
}

/**
 * Get connection status for a platform
 */
export function getConnectionStatus(platformId: string): 'connected' | 'available' | 'premium' {
  const connections = getStoredConnections();
  const isConnected = connections.some(c => c.platformId === platformId);
  
  if (isConnected) return 'connected';
  if (isPremiumPlatform(platformId)) return 'premium';
  return 'available';
}

/**
 * Get all user leagues across all connected platforms
 */
export function getAllUserLeagues(): FantasyLeague[] {
  const connections = getStoredConnections();
  return connections.flatMap(connection => connection.leagues);
}

/**
 * Fantasy.AI OAuth Integration Status
 */
export function getIntegrationStats() {
  const connections = getStoredConnections();
  const totalLeagues = getAllUserLeagues().length;
  const platforms = connections.length;
  
  return {
    connectedPlatforms: platforms,
    totalLeagues,
    availablePlatforms: Object.keys(FANTASY_PLATFORMS).length,
    lastSync: connections.length > 0 ? Math.max(...connections.map(c => c.connectedAt.getTime())) : null
  };
}