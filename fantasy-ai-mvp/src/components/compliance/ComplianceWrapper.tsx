"use client";

/**
 * 🛡️ COMPLIANCE WRAPPER COMPONENT
 * 
 * Automatically hides gambling features based on feature flags and compliance settings.
 * Ensures zero gambling functionality is exposed in production without proper licensing.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { FEATURE_FLAGS, COMPLIANCE, isFeatureEnabled, trackFeatureUsage } from '@/lib/feature-flags';
import { Lock, AlertTriangle, Calendar, Sparkles } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';

interface ComplianceWrapperProps {
  children: React.ReactNode;
  feature: keyof typeof FEATURE_FLAGS;
  fallbackType?: 'hidden' | 'coming-soon' | 'upgrade-required';
  requiresSubscription?: boolean;
  customFallback?: React.ReactNode;
  userId?: string;
}

/**
 * 🎯 FEATURE GATE COMPONENT
 * Conditionally renders content based on feature flags and compliance
 */
export const ComplianceWrapper: React.FC<ComplianceWrapperProps> = ({
  children,
  feature,
  fallbackType = 'hidden',
  requiresSubscription = false,
  customFallback,
  userId
}) => {
  const isEnabled = isFeatureEnabled(feature);
  
  // Track feature access attempts (for analytics and compliance)
  React.useEffect(() => {
    if (isEnabled) {
      trackFeatureUsage(feature, userId);
    }
  }, [feature, isEnabled, userId]);

  // If feature is enabled, render children
  if (isEnabled) {
    return <>{children}</>;
  }

  // If custom fallback provided, use it
  if (customFallback) {
    return <>{customFallback}</>;
  }

  // Handle different fallback types
  switch (fallbackType) {
    case 'hidden':
      return null;
      
    case 'coming-soon':
      return <ComingSoonCard feature={feature} />;
      
    case 'upgrade-required':
      return <UpgradeRequiredCard feature={feature} />;
      
    default:
      return null;
  }
};

/**
 * 🔮 COMING SOON CARD
 * Shows when gambling features are disabled
 */
const ComingSoonCard: React.FC<{ feature: string }> = ({ feature }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="w-full"
  >
    <GlassCard className="p-6 border-2 border-dashed border-purple-500/30">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="relative">
            <Calendar className="w-12 h-12 text-purple-400" />
            <Sparkles className="w-6 h-6 text-yellow-400 absolute -top-1 -right-1" />
          </div>
        </div>
        
        <div>
          <h3 className="text-xl font-bold text-white mb-2">
            Coming Soon
          </h3>
          <p className="text-gray-300 text-sm">
            We're working hard to bring you this feature! Stay tuned for updates.
          </p>
        </div>
        
        <div className="text-xs text-gray-400 bg-gray-800/50 rounded px-3 py-2">
          Feature: {feature.replace(/_/g, ' ').toLowerCase()}
        </div>
      </div>
    </GlassCard>
  </motion.div>
);

/**
 * 💎 UPGRADE REQUIRED CARD
 * Shows when feature requires subscription
 */
const UpgradeRequiredCard: React.FC<{ feature: string }> = ({ feature }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="w-full"
  >
    <GlassCard className="p-6 border-2 border-dashed border-amber-500/30">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="relative">
            <Lock className="w-12 h-12 text-amber-400" />
            <Sparkles className="w-6 h-6 text-yellow-400 absolute -top-1 -right-1" />
          </div>
        </div>
        
        <div>
          <h3 className="text-xl font-bold text-white mb-2">
            Premium Feature
          </h3>
          <p className="text-gray-300 text-sm">
            Upgrade to Pro or Elite to unlock this powerful feature!
          </p>
        </div>
        
        <button className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-2 rounded-lg font-semibold hover:scale-105 transition-transform">
          Upgrade Now
        </button>
        
        <div className="text-xs text-gray-400 bg-gray-800/50 rounded px-3 py-2">
          Feature: {feature.replace(/_/g, ' ').toLowerCase()}
        </div>
      </div>
    </GlassCard>
  </motion.div>
);

/**
 * 🚨 COMPLIANCE ALERT CARD
 * Shows when gambling features are blocked for compliance
 */
const ComplianceAlertCard: React.FC<{ feature: string }> = ({ feature }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="w-full"
  >
    <GlassCard className="p-6 border-2 border-red-500/30 bg-red-900/10">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <AlertTriangle className="w-12 h-12 text-red-400" />
        </div>
        
        <div>
          <h3 className="text-xl font-bold text-white mb-2">
            Feature Unavailable
          </h3>
          <p className="text-gray-300 text-sm">
            This feature is not available in your region or requires additional licensing.
          </p>
        </div>
        
        <div className="text-xs text-gray-400 bg-gray-800/50 rounded px-3 py-2">
          Compliance: {feature.replace(/_/g, ' ').toLowerCase()}
        </div>
      </div>
    </GlassCard>
  </motion.div>
);

/**
 * 🔐 GAMBLING FEATURE GUARD
 * Specifically for gambling features - shows compliance message
 */
export const GamblingFeatureGuard: React.FC<{
  children: React.ReactNode;
  feature: keyof typeof FEATURE_FLAGS;
  userId?: string;
}> = ({ children, feature, userId }) => {
  const isGamblingFeature = feature.includes('WAGERING') || 
                           feature.includes('BETTING') || 
                           feature.includes('CRYPTO') ||
                           feature.includes('NFT');
  
  if (isGamblingFeature && !isFeatureEnabled(feature)) {
    return <ComplianceAlertCard feature={feature} />;
  }
  
  return (
    <ComplianceWrapper 
      feature={feature} 
      fallbackType="coming-soon"
      userId={userId}
    >
      {children}
    </ComplianceWrapper>
  );
};

/**
 * 💳 SUBSCRIPTION FEATURE GUARD
 * For features that require paid subscription
 */
export const SubscriptionFeatureGuard: React.FC<{
  children: React.ReactNode;
  feature: keyof typeof FEATURE_FLAGS;
  requiredTier?: 'PRO' | 'ELITE';
  userId?: string;
}> = ({ children, feature, requiredTier = 'PRO', userId }) => {
  // TODO: Implement actual subscription checking
  const hasSubscription = false; // Placeholder
  
  if (!hasSubscription) {
    return (
      <ComplianceWrapper 
        feature={feature}
        fallbackType="upgrade-required"
        requiresSubscription={true}
        userId={userId}
      >
        {children}
      </ComplianceWrapper>
    );
  }
  
  return <>{children}</>;
};

/**
 * 🎯 SAFE MODE INDICATOR
 * Shows current compliance status
 */
export const SafeModeIndicator: React.FC = () => {
  const isSafe = COMPLIANCE.isSafeMode();
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`fixed top-4 right-4 z-50 px-3 py-2 rounded-full text-xs font-semibold ${
        isSafe 
          ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
          : 'bg-red-500/20 text-red-400 border border-red-500/30'
      }`}
    >
      {isSafe ? '🛡️ Safe Mode' : '⚠️ Gambling Features Active'}
    </motion.div>
  );
};

/**
 * 📊 COMPLIANCE DASHBOARD
 * Admin view of current feature flags (dev only)
 */
export const ComplianceDashboard: React.FC = () => {
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }
  
  const auditLog = COMPLIANCE.generateAuditLog();
  
  return (
    <div className="fixed bottom-4 left-4 z-50 max-w-sm">
      <GlassCard className="p-4">
        <h4 className="text-white font-bold mb-3">🔍 Compliance Status</h4>
        
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-300">Safe Mode:</span>
            <span className={auditLog.safeMode ? 'text-green-400' : 'text-red-400'}>
              {auditLog.safeMode ? 'Active' : 'Disabled'}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-300">Environment:</span>
            <span className="text-blue-400">{auditLog.environment}</span>
          </div>
          
          {auditLog.enabledGamblingFeatures.length > 0 && (
            <div>
              <span className="text-gray-300">Gambling Features:</span>
              <div className="text-red-400 text-xs">
                {auditLog.enabledGamblingFeatures.join(', ')}
              </div>
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
};

export default ComplianceWrapper;