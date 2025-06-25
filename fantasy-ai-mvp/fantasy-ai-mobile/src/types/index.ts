// League Types
export interface League {
  id: string;
  name: string;
  platform: 'yahoo' | 'espn' | 'sleeper' | 'cbs' | 'nfl' | 'draftkings' | 'fanduel';
  type: 'redraft' | 'dynasty' | 'keeper' | 'bestball' | 'dfs';
  sport: 'nfl' | 'nba' | 'mlb' | 'nhl';
  scoringType: 'standard' | 'ppr' | 'half-ppr' | 'custom';
  userRank: number;
  totalTeams: number;
  userPoints: number;
  color?: string;
  isActive: boolean;
  currentWeek: number;
  playoffs: boolean;
  roster?: Roster;
  matchup?: Matchup;
}

// Player Types
export interface Player {
  id: string;
  name: string;
  position: string;
  team: string;
  number: string;
  imageUrl?: string;
  status: 'active' | 'injured' | 'questionable' | 'out' | 'ir';
  injuryDescription?: string;
  stats: PlayerStats;
  projections: PlayerProjections;
  trends: PlayerTrends;
  aiScore: number;
  ownership: number;
  adp: number;
  salary?: number;
}

export interface PlayerStats {
  season: {
    points: number;
    gamesPlayed: number;
    touchdowns: number;
    yards: number;
    receptions?: number;
    targets?: number;
    carries?: number;
  };
  lastGame: {
    points: number;
    opponent: string;
    performance: string;
  };
  averagePoints: number;
}

export interface PlayerProjections {
  week: number;
  points: number;
  floor: number;
  ceiling: number;
  confidence: number;
}

export interface PlayerTrends {
  direction: 'up' | 'down' | 'stable';
  percentageChange: number;
  description: string;
  sentiment: 'positive' | 'negative' | 'neutral';
}

// Roster & Lineup Types
export interface Roster {
  starters: Player[];
  bench: Player[];
  ir?: Player[];
}

export interface Matchup {
  week: number;
  opponent: Team;
  userScore: number;
  opponentScore: number;
  projectedUserScore: number;
  projectedOpponentScore: number;
  winProbability: number;
}

export interface Team {
  id: string;
  name: string;
  owner: string;
  rank: number;
  points: number;
  wins: number;
  losses: number;
  ties: number;
}

// AI Insights Types
export interface AIInsight {
  id: string;
  type: 'trade' | 'lineup' | 'waiver' | 'injury' | 'trend' | 'matchup';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  players?: Player[];
  confidence: number;
  impact: string;
  actionable: boolean;
  action?: {
    type: 'add' | 'drop' | 'trade' | 'start' | 'bench';
    players: Player[];
  };
  createdAt: string;
  expiresAt?: string;
}

// User Profile Types
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  subscription: 'free' | 'pro' | 'elite';
  preferences: UserPreferences;
  stats: UserStats;
  achievements: Achievement[];
}

export interface UserPreferences {
  favoriteTeams: string[];
  favoritePlayers: string[];
  notifications: {
    trades: boolean;
    injuries: boolean;
    scoring: boolean;
    insights: boolean;
  };
  voicePersona: 'expert' | 'coach' | 'analyst' | 'friend';
  theme: 'dark' | 'light' | 'auto';
}

export interface UserStats {
  totalWins: number;
  totalLosses: number;
  championships: number;
  bestFinish: number;
  totalTrades: number;
  successfulPredictions: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: string;
  progress?: number;
  maxProgress?: number;
}

// API Response Types
export interface APIResponse<T> {
  data: T;
  status: 'success' | 'error';
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    hasMore: boolean;
  };
}

// Filter Types
export interface PlayerFilter {
  position?: string[];
  team?: string[];
  status?: string[];
  minPoints?: number;
  maxPoints?: number;
  available?: boolean;
  searchQuery?: string;
}