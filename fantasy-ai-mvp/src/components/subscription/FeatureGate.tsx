'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, Crown, Sparkles, Zap } from 'lucide-react';
import { useFeature } from '@/contexts/SubscriptionContext';
import { SubscriptionTier } from '@/lib/subscription/feature-gates';

interface FeatureGateProps {
  featureId: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUpgradePrompt?: boolean;
  soft?: boolean; // If true, shows content but with upgrade overlay
}

export function FeatureGate({ 
  featureId, 
  children, 
  fallback,
  showUpgradePrompt = true,
  soft = false
}: FeatureGateProps) {
  const router = useRouter();
  const { canAccess, feature, tier, upgradeRequired } = useFeature(featureId);

  if (canAccess) {
    return <>{children}</>;
  }

  const handleUpgrade = () => {
    router.push('/pricing');
  };

  const getTierIcon = (tier: SubscriptionTier) => {
    switch (tier) {
      case 'PRO':
        return <Zap className="h-5 w-5 text-blue-500" />;
      case 'ELITE':
        return <Crown className="h-5 w-5 text-yellow-500" />;
      default:
        return <Sparkles className="h-5 w-5 text-purple-500" />;
    }
  };

  const getTierColor = (tier: SubscriptionTier) => {
    switch (tier) {
      case 'PRO':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'ELITE':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      default:
        return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
    }
  };

  if (fallback) {
    return <>{fallback}</>;
  }

  if (!showUpgradePrompt) {
    return null;
  }

  const upgradePrompt = (
    <Card className="border-dashed">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">{feature?.name || 'Premium Feature'}</CardTitle>
          </div>
          {upgradeRequired && (
            <Badge variant="outline" className={getTierColor(upgradeRequired)}>
              {getTierIcon(upgradeRequired)}
              {upgradeRequired} Required
            </Badge>
          )}
        </div>
        <CardDescription>
          {feature?.description || 'This feature requires a premium subscription'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={handleUpgrade} className="w-full">
          Upgrade to {upgradeRequired}
        </Button>
      </CardContent>
    </Card>
  );

  if (soft) {
    return (
      <div className="relative">
        <div className="opacity-50 pointer-events-none">
          {children}
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          {upgradePrompt}
        </div>
      </div>
    );
  }

  return upgradePrompt;
}

// Inline feature gate for smaller UI elements
interface InlineFeatureGateProps {
  featureId: string;
  children: React.ReactNode;
  showLock?: boolean;
}

export function InlineFeatureGate({ 
  featureId, 
  children,
  showLock = true 
}: InlineFeatureGateProps) {
  const { canAccess, upgradeRequired } = useFeature(featureId);
  const router = useRouter();

  if (canAccess) {
    return <>{children}</>;
  }

  return (
    <div className="inline-flex items-center gap-2">
      <span className="opacity-50">{children}</span>
      {showLock && (
        <Button
          variant="ghost"
          size="sm"
          className="h-auto p-1"
          onClick={() => router.push('/pricing')}
          title={`Requires ${upgradeRequired} subscription`}
        >
          <Lock className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}

// Feature badge to show tier requirements
interface FeatureBadgeProps {
  featureId: string;
  className?: string;
}

export function FeatureBadge({ featureId, className }: FeatureBadgeProps) {
  const { canAccess, feature, upgradeRequired } = useFeature(featureId);

  if (canAccess || !feature) {
    return null;
  }

  const getTierColor = (tier: SubscriptionTier) => {
    switch (tier) {
      case 'PRO':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'ELITE':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      default:
        return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
    }
  };

  return (
    <Badge 
      variant="outline" 
      className={`${getTierColor(upgradeRequired!)} ${className}`}
    >
      {upgradeRequired}
    </Badge>
  );
}