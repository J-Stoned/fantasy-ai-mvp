/**
 * Feature Gate Middleware for API Routes
 * Ensures users have appropriate subscription tier for API access
 */

import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { requireFeature, API_RATE_LIMITS, SubscriptionTier } from '@/lib/subscription/feature-gates';

// Rate limiting cache (in production, use Redis)
const rateLimitCache = new Map<string, { count: number; resetAt: number }>();

// Feature requirements for API endpoints
const API_FEATURE_REQUIREMENTS: Record<string, string> = {
  '/api/ml/lineup-optimizer': 'LINEUP_OPTIMIZER',
  '/api/ml/trade-analyzer': 'TRADE_ANALYZER_PRO',
  '/api/ml/draft-assistant': 'ADVANCED_PROJECTIONS',
  '/api/ml/game-outcome': 'ADVANCED_ANALYTICS',
  '/api/data-pipeline': 'REAL_TIME_DATA',
  '/api/dfs/optimize': 'DFS_LINEUP_BUILDER',
  '/api/dfs/multi-platform': 'DFS_MULTI_PLATFORM',
  '/api/voice/assistant': 'VOICE_ASSISTANT',
  '/api/alerts/custom': 'CUSTOM_ALERTS',
  '/api/export': 'EXPORT_TOOLS',
  '/api/v1': 'API_ACCESS'
};

export async function featureGateMiddleware(req: NextRequest) {
  // Get the pathname
  const pathname = req.nextUrl.pathname;
  
  // Check if this API route requires feature gating
  const requiredFeature = Object.entries(API_FEATURE_REQUIREMENTS).find(
    ([path]) => pathname.startsWith(path)
  )?.[1];
  
  if (!requiredFeature) {
    // No feature requirement for this route
    return NextResponse.next();
  }
  
  try {
    // Get user session
    const token = await getToken({ req });
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Get user's subscription tier (would fetch from database in production)
    const userTier = (token.subscriptionTier as SubscriptionTier) || 'FREE';
    
    // Check feature access
    const { allowed, error } = await requireFeature(requiredFeature, userTier);
    
    if (!allowed) {
      return NextResponse.json(
        { 
          error,
          requiredTier: requiredFeature,
          upgradeUrl: '/pricing'
        },
        { status: 403 }
      );
    }
    
    // Check rate limits for API access
    if (pathname.startsWith('/api/v1')) {
      const rateLimit = API_RATE_LIMITS[userTier];
      
      if (rateLimit > 0) {
        const userId = token.sub || token.email;
        const key = `rate_limit:${userId}`;
        const now = Date.now();
        
        let rateLimitData = rateLimitCache.get(key);
        
        // Reset if expired
        if (!rateLimitData || now > rateLimitData.resetAt) {
          rateLimitData = {
            count: 0,
            resetAt: now + 60 * 60 * 1000 // 1 hour window
          };
        }
        
        // Check if limit exceeded
        if (rateLimitData.count >= rateLimit) {
          const resetIn = Math.ceil((rateLimitData.resetAt - now) / 1000);
          
          return NextResponse.json(
            {
              error: 'Rate limit exceeded',
              limit: rateLimit,
              reset: resetIn,
              upgradeUrl: '/pricing'
            },
            { 
              status: 429,
              headers: {
                'X-RateLimit-Limit': rateLimit.toString(),
                'X-RateLimit-Remaining': '0',
                'X-RateLimit-Reset': rateLimitData.resetAt.toString()
              }
            }
          );
        }
        
        // Increment counter
        rateLimitData.count++;
        rateLimitCache.set(key, rateLimitData);
        
        // Add rate limit headers
        const response = NextResponse.next();
        response.headers.set('X-RateLimit-Limit', rateLimit.toString());
        response.headers.set('X-RateLimit-Remaining', (rateLimit - rateLimitData.count).toString());
        response.headers.set('X-RateLimit-Reset', rateLimitData.resetAt.toString());
        
        return response;
      }
    }
    
    // Allow the request
    return NextResponse.next();
    
  } catch (error) {
    console.error('Feature gate middleware error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper to check if a route should be protected
export function shouldProtectRoute(pathname: string): boolean {
  return Object.keys(API_FEATURE_REQUIREMENTS).some(path => 
    pathname.startsWith(path)
  );
}