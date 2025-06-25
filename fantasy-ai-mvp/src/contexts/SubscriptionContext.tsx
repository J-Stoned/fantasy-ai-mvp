'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { SubscriptionTier, canAccessFeature, FEATURES } from '@/lib/subscription/feature-gates';

interface Subscription {
  id: string;
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid';
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: Date;
  trialEnd: Date | null;
}

interface SubscriptionContextType {
  tier: SubscriptionTier;
  subscription: Subscription | null;
  loading: boolean;
  error: string | null;
  canAccess: (featureId: string) => boolean;
  refreshSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [tier, setTier] = useState<SubscriptionTier>('FREE');
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscription = async () => {
    if (!session?.user) {
      setTier('FREE');
      setSubscription(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/stripe/checkout');
      
      if (!response.ok) {
        throw new Error('Failed to fetch subscription');
      }
      
      const data = await response.json();
      
      setTier(data.tier || 'FREE');
      setSubscription(data.subscription || null);
    } catch (err) {
      console.error('Subscription fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load subscription');
      setTier('FREE');
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
      fetchSubscription();
    } else if (status === 'unauthenticated') {
      setTier('FREE');
      setSubscription(null);
      setLoading(false);
    }
  }, [status]);

  const canAccess = (featureId: string) => {
    return canAccessFeature(tier, featureId);
  };

  const value = {
    tier,
    subscription,
    loading,
    error,
    canAccess,
    refreshSubscription: fetchSubscription
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}

// Feature-specific hooks
export function useFeature(featureId: string) {
  const { tier, canAccess } = useSubscription();
  const feature = FEATURES[featureId];
  
  return {
    canAccess: canAccess(featureId),
    feature,
    tier,
    isLocked: !canAccess(featureId),
    upgradeRequired: feature ? feature.requiredTier : null
  };
}