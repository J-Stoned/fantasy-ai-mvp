/**
 * Feature Gating System
 * Controls access to premium features based on subscription tier
 */

export type SubscriptionTier = 'FREE' | 'PRO' | 'ELITE';

export interface Feature {
  id: string;
  name: string;
  description: string;
  requiredTier: SubscriptionTier;
  category: 'AI' | 'DATA' | 'ANALYTICS' | 'TOOLS' | 'SOCIAL' | 'API';
}

// Feature definitions
export const FEATURES: Record<string, Feature> = {
  // AI Features
  BASIC_PROJECTIONS: {
    id: 'basic_projections',
    name: 'Basic Player Projections',
    description: 'Simple ML-based player projections',
    requiredTier: 'FREE',
    category: 'AI'
  },
  ADVANCED_PROJECTIONS: {
    id: 'advanced_projections',
    name: 'Advanced AI Projections',
    description: '92%+ accuracy projections with confidence intervals',
    requiredTier: 'PRO',
    category: 'AI'
  },
  LINEUP_OPTIMIZER: {
    id: 'lineup_optimizer',
    name: 'AI Lineup Optimizer',
    description: 'Real-time lineup optimization with ML',
    requiredTier: 'PRO',
    category: 'AI'
  },
  TRADE_ANALYZER_PRO: {
    id: 'trade_analyzer_pro',
    name: 'Pro Trade Analyzer',
    description: 'Advanced trade analysis with ML predictions',
    requiredTier: 'PRO',
    category: 'AI'
  },
  MULTI_TEAM_TRADES: {
    id: 'multi_team_trades',
    name: 'Multi-Team Trade Scenarios',
    description: 'Complex 3+ team trade analysis',
    requiredTier: 'ELITE',
    category: 'AI'
  },
  CUSTOM_ML_MODELS: {
    id: 'custom_ml_models',
    name: 'Custom ML Model Training',
    description: 'Train ML models on your league data',
    requiredTier: 'ELITE',
    category: 'AI'
  },
  
  // Data Features
  REAL_TIME_DATA: {
    id: 'real_time_data',
    name: 'Real-Time Data Updates',
    description: '30-second data refresh intervals',
    requiredTier: 'PRO',
    category: 'DATA'
  },
  INJURY_ALERTS_INSTANT: {
    id: 'injury_alerts_instant',
    name: 'Instant Injury Alerts',
    description: 'Real-time injury notifications',
    requiredTier: 'PRO',
    category: 'DATA'
  },
  WEATHER_DATA: {
    id: 'weather_data',
    name: 'Game Weather Data',
    description: 'Live weather conditions for games',
    requiredTier: 'PRO',
    category: 'DATA'
  },
  BETTING_INSIGHTS: {
    id: 'betting_insights',
    name: 'Betting Lines & Props',
    description: 'Market data and prop bet analysis',
    requiredTier: 'ELITE',
    category: 'DATA'
  },
  
  // Analytics Features
  BASIC_ANALYTICS: {
    id: 'basic_analytics',
    name: 'Basic Analytics',
    description: 'Simple player and team stats',
    requiredTier: 'FREE',
    category: 'ANALYTICS'
  },
  ADVANCED_ANALYTICS: {
    id: 'advanced_analytics',
    name: 'Advanced Analytics',
    description: 'Deep dive analytics with trends',
    requiredTier: 'PRO',
    category: 'ANALYTICS'
  },
  OWNERSHIP_PROJECTIONS: {
    id: 'ownership_projections',
    name: 'DFS Ownership Projections',
    description: 'Predict tournament ownership percentages',
    requiredTier: 'ELITE',
    category: 'ANALYTICS'
  },
  
  // Tools
  DFS_LINEUP_BUILDER: {
    id: 'dfs_lineup_builder',
    name: 'DFS Lineup Builder',
    description: 'Build optimized DFS lineups',
    requiredTier: 'PRO',
    category: 'TOOLS'
  },
  DFS_MULTI_PLATFORM: {
    id: 'dfs_multi_platform',
    name: 'Multi-Platform DFS Optimizer',
    description: 'Optimize for DraftKings, FanDuel, Yahoo',
    requiredTier: 'ELITE',
    category: 'TOOLS'
  },
  VOICE_ASSISTANT: {
    id: 'voice_assistant',
    name: 'Voice Assistant',
    description: '"Hey Fantasy" voice commands',
    requiredTier: 'PRO',
    category: 'TOOLS'
  },
  CUSTOM_ALERTS: {
    id: 'custom_alerts',
    name: 'Custom Alerts',
    description: 'SMS/Email notifications',
    requiredTier: 'PRO',
    category: 'TOOLS'
  },
  EXPORT_TOOLS: {
    id: 'export_tools',
    name: 'Export Tools',
    description: 'Export data and lineups',
    requiredTier: 'ELITE',
    category: 'TOOLS'
  },
  
  // Social Features
  COMMUNITY_ACCESS: {
    id: 'community_access',
    name: 'Community Forums',
    description: 'Access to community discussions',
    requiredTier: 'FREE',
    category: 'SOCIAL'
  },
  PRIVATE_DISCORD: {
    id: 'private_discord',
    name: 'Private Discord Channel',
    description: 'Elite member Discord access',
    requiredTier: 'ELITE',
    category: 'SOCIAL'
  },
  
  // API Features
  API_ACCESS: {
    id: 'api_access',
    name: 'API Access',
    description: 'Programmatic access to Fantasy.AI',
    requiredTier: 'ELITE',
    category: 'API'
  }
};

// League limits by tier
export const LEAGUE_LIMITS: Record<SubscriptionTier, number> = {
  FREE: 1,
  PRO: -1, // Unlimited
  ELITE: -1 // Unlimited
};

// API rate limits by tier (requests per hour)
export const API_RATE_LIMITS: Record<SubscriptionTier, number> = {
  FREE: 0,
  PRO: 0,
  ELITE: 10000
};

// Feature checking functions
export function canAccessFeature(
  userTier: SubscriptionTier,
  featureId: string
): boolean {
  const feature = FEATURES[featureId];
  if (!feature) return false;
  
  const tierRanking: Record<SubscriptionTier, number> = {
    FREE: 0,
    PRO: 1,
    ELITE: 2
  };
  
  return tierRanking[userTier] >= tierRanking[feature.requiredTier];
}

export function getFeaturesByTier(tier: SubscriptionTier): Feature[] {
  return Object.values(FEATURES).filter(feature => 
    canAccessFeature(tier, feature.id)
  );
}

export function getLockedFeatures(userTier: SubscriptionTier): Feature[] {
  return Object.values(FEATURES).filter(feature => 
    !canAccessFeature(userTier, feature.id)
  );
}

export function getFeaturesByCategory(category: Feature['category']): Feature[] {
  return Object.values(FEATURES).filter(feature => 
    feature.category === category
  );
}

export function getUpgradeReasons(
  currentTier: SubscriptionTier,
  targetTier: SubscriptionTier
): Feature[] {
  const currentFeatures = getFeaturesByTier(currentTier);
  const targetFeatures = getFeaturesByTier(targetTier);
  
  return targetFeatures.filter(feature => 
    !currentFeatures.find(f => f.id === feature.id)
  );
}

// Hook for React components
export function useFeatureGate(featureId: string, userTier: SubscriptionTier) {
  const hasAccess = canAccessFeature(userTier, featureId);
  const feature = FEATURES[featureId];
  
  return {
    hasAccess,
    feature,
    requiredTier: feature?.requiredTier,
    upgradeMessage: hasAccess 
      ? null 
      : `Upgrade to ${feature?.requiredTier} to access ${feature?.name}`
  };
}

// Server-side middleware for API routes
export async function requireFeature(
  featureId: string,
  userTier: SubscriptionTier
): Promise<{ allowed: boolean; error?: string }> {
  if (!canAccessFeature(userTier, featureId)) {
    const feature = FEATURES[featureId];
    return {
      allowed: false,
      error: `This feature requires ${feature.requiredTier} subscription`
    };
  }
  
  return { allowed: true };
}

// Usage tracking
export interface FeatureUsage {
  featureId: string;
  userId: string;
  timestamp: Date;
  tier: SubscriptionTier;
}

export async function trackFeatureUsage(usage: FeatureUsage) {
  // In production, this would log to analytics
  console.log(`📊 Feature usage: ${usage.userId} used ${usage.featureId} (${usage.tier})`);
}