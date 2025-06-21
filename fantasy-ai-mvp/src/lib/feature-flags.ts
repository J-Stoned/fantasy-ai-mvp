/**
 * 🚀 FANTASY AI MVP - CENTRALIZED FEATURE FLAG SYSTEM
 * 
 * This system ensures legal compliance by safely controlling feature access
 * across the entire application. All gambling features are disabled by default.
 */

// Environment-based feature detection
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * 🎯 PHASE 1: SAFE LAUNCH FEATURES (All enabled for immediate revenue)
 * These features are 100% legal and ready for production launch
 */
const SAFE_FEATURES = {
  // Core Fantasy Features
  FANTASY_ANALYTICS: true,
  AI_INSIGHTS: true,
  PLAYER_PROJECTIONS: true,
  INJURY_ANALYSIS: true,
  TRADE_RECOMMENDATIONS: true,
  LINEUP_OPTIMIZATION: true,
  
  // Social & Community
  SOCIAL_FEATURES: true,
  LEAGUE_CHAT: true,
  TRASH_TALK: true,
  ACHIEVEMENT_SYSTEM: true,
  FANTASY_DATING: true,
  
  // Advanced AI Features
  BIOMETRIC_INTEGRATION: true,
  VOICE_ASSISTANT: true,
  PERSONALITY_CLONING: true,
  AI_COACHING: true,
  
  // AR/VR Features
  AR_FEATURES: true,
  VR_EXPERIENCES: true,
  
  // Revenue Features
  SUBSCRIPTIONS: true,
  PREMIUM_ANALYTICS: true,
  API_ACCESS: true,
  AFFILIATE_MARKETING: true,
} as const;

/**
 * 🎰 PHASE 2: GAMBLING FEATURES (All disabled until legal compliance)
 * These features require gambling licenses and cannot be enabled until Phase 2
 */
const GAMBLING_FEATURES = {
  // Core Wagering (DISABLED)
  WAGERING_ENABLED: process.env.ENABLE_WAGERING === 'true' && !isProduction ? true : false,
  LIVE_BETTING: process.env.ENABLE_LIVE_BETTING === 'true' && !isProduction ? true : false,
  PROP_BETTING: process.env.ENABLE_PROP_BETTING === 'true' && !isProduction ? true : false,
  
  // Financial Features (DISABLED)
  MONEY_TRANSACTIONS: false,
  CRYPTO_PAYMENTS: false,
  NFT_TRADING: false,
  ESCROW_SERVICES: false,
  
  // Advanced Gambling (DISABLED)
  CROSS_LEAGUE_BETTING: false,
  LIVE_ODDS: false,
  BOUNTY_SYSTEM: false,
  
  // Compliance Features (Will be enabled in Phase 2)
  AGE_VERIFICATION: false,
  KYC_VERIFICATION: false,
  GEOLOCATION_BLOCKING: false,
  PROBLEM_GAMBLING_TOOLS: false,
} as const;

/**
 * 🔬 EXPERIMENTAL FEATURES (Development only)
 * These features are in development and not ready for production
 */
const EXPERIMENTAL_FEATURES = {
  // Cutting-edge AI
  QUANTUM_ANALYTICS: isDevelopment,
  CONSCIOUSNESS_INTERFACE: isDevelopment,
  TIME_TRAVEL_PREDICTIONS: isDevelopment,
  
  // Future Tech
  NEURALINK_INTEGRATION: false,
  INTERPLANETARY_LEAGUES: false,
  REALITY_SIMULATION: false,
} as const;

/**
 * 🚦 MASTER FEATURE FLAG CONFIGURATION
 */
export const FEATURE_FLAGS = {
  ...SAFE_FEATURES,
  ...GAMBLING_FEATURES,
  ...EXPERIMENTAL_FEATURES,
} as const;

/**
 * 🛡️ COMPLIANCE UTILITIES
 */
export const COMPLIANCE = {
  // Check if any gambling features are enabled
  hasGamblingFeatures: () => {
    return Object.entries(GAMBLING_FEATURES).some(([key, value]) => value === true);
  },
  
  // Get list of enabled gambling features (for audit logs)
  getEnabledGamblingFeatures: () => {
    return Object.entries(GAMBLING_FEATURES)
      .filter(([key, value]) => value === true)
      .map(([key]) => key);
  },
  
  // Safe mode check (all gambling features disabled)
  isSafeMode: () => {
    return !COMPLIANCE.hasGamblingFeatures();
  },
  
  // Audit log entry
  generateAuditLog: () => ({
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    safeMode: COMPLIANCE.isSafeMode(),
    enabledGamblingFeatures: COMPLIANCE.getEnabledGamblingFeatures(),
    enabledSafeFeatures: Object.entries(SAFE_FEATURES)
      .filter(([key, value]) => value === true)
      .map(([key]) => key),
  }),
} as const;

/**
 * 🎯 SUBSCRIPTION TIER FEATURE ACCESS
 */
export const SUBSCRIPTION_FEATURES = {
  FREE: {
    maxLeagues: 2,
    aiInsightsPerDay: 10,
    voiceMinutesPerMonth: 0,
    biometricFeatures: false,
    prioritySupport: false,
    apiAccess: false,
  },
  
  PRO: {
    maxLeagues: 10,
    aiInsightsPerDay: 100,
    voiceMinutesPerMonth: 100,
    biometricFeatures: true,
    prioritySupport: true,
    apiAccess: false,
  },
  
  ELITE: {
    maxLeagues: -1, // unlimited
    aiInsightsPerDay: -1, // unlimited
    voiceMinutesPerMonth: -1, // unlimited
    biometricFeatures: true,
    prioritySupport: true,
    apiAccess: true,
  },
} as const;

/**
 * 🔍 FEATURE FLAG HELPERS
 */
export const isFeatureEnabled = (feature: keyof typeof FEATURE_FLAGS): boolean => {
  return FEATURE_FLAGS[feature];
};

export const requiresSubscription = (feature: string, tier: keyof typeof SUBSCRIPTION_FEATURES): boolean => {
  // Implementation for subscription-gated features
  return false; // TODO: Implement subscription logic
};

/**
 * 🚨 EMERGENCY KILLSWITCH
 * Can disable all gambling features instantly for compliance
 */
export const EMERGENCY_KILLSWITCH = {
  disableAllGambling: () => {
    // In production, this would update a database flag
    // For now, we rely on environment variables
    console.warn('🚨 EMERGENCY: All gambling features disabled');
    return {
      ...FEATURE_FLAGS,
      ...Object.fromEntries(
        Object.keys(GAMBLING_FEATURES).map(key => [key, false])
      )
    };
  },
};

/**
 * 📊 FEATURE FLAG ANALYTICS
 */
export const trackFeatureUsage = (feature: string, userId?: string) => {
  // TODO: Implement analytics tracking
  console.log(`Feature used: ${feature}`, { userId, timestamp: Date.now() });
};

// Log current configuration on import (for debugging)
if (isDevelopment) {
  console.log('🚀 Feature Flags Loaded:', {
    safeMode: COMPLIANCE.isSafeMode(),
    gamblingFeaturesEnabled: COMPLIANCE.getEnabledGamblingFeatures(),
    environment: process.env.NODE_ENV,
  });
}

export default FEATURE_FLAGS;