'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Activity, AlertTriangle, Target, Zap } from 'lucide-react';
import { toast } from 'sonner';

interface PlayerAnalyticsProps {
  playerId: string;
  playerName: string;
  position: string;
  team: string;
  onUpdate?: () => void;
}

interface AnalyticsData {
  performance: {
    averagePoints: number;
    projectedPoints: number;
    consistency: number;
    trend: number;
    floor: number;
    ceiling: number;
  };
  injury: {
    riskScore: number;
    riskLevel: 'low' | 'medium' | 'high';
    factors: string[];
  };
  matchup: {
    difficulty: number;
    favorability: string;
    keyFactors: string[];
  };
  ml: {
    confidence: number;
    recommendation: string;
    insights: string[];
  };
}

export function PlayerAnalyticsCard({ 
  playerId, 
  playerName, 
  position, 
  team,
  onUpdate 
}: PlayerAnalyticsProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAnalytics();
  }, [playerId]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/analytics/player/${playerId}`);
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      } else {
        toast.error('Failed to load player analytics');
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error('Error loading analytics');
    } finally {
      setLoading(false);
    }
  };

  const refreshAnalytics = async () => {
    setRefreshing(true);
    try {
      const response = await fetch(`/api/analytics/player/${playerId}/refresh`, {
        method: 'POST'
      });
      if (response.ok) {
        await loadAnalytics();
        toast.success('Analytics refreshed');
        onUpdate?.();
      } else {
        toast.error('Failed to refresh analytics');
      }
    } catch (error) {
      console.error('Error refreshing analytics:', error);
      toast.error('Error refreshing analytics');
    } finally {
      setRefreshing(false);
    }
  };

  const getPerformanceBadge = (trend: number) => {
    if (trend > 2) return <Badge className="bg-green-500"><TrendingUp className="w-3 h-3 mr-1" />Hot</Badge>;
    if (trend < -2) return <Badge className="bg-red-500"><TrendingDown className="w-3 h-3 mr-1" />Cold</Badge>;
    return <Badge className="bg-blue-500"><Activity className="w-3 h-3 mr-1" />Stable</Badge>;
  };

  const getInjuryBadge = (riskLevel: string) => {
    const colors = {
      low: 'bg-green-500',
      medium: 'bg-yellow-500',
      high: 'bg-red-500'
    };
    return (
      <Badge className={colors[riskLevel as keyof typeof colors]}>
        <AlertTriangle className="w-3 h-3 mr-1" />
        {riskLevel.toUpperCase()} RISK
      </Badge>
    );
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading && !analytics) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-gray-300 rounded w-3/4"></div>
          <div className="h-4 bg-gray-300 rounded w-1/2"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-4 bg-gray-300 rounded"></div>
            <div className="h-4 bg-gray-300 rounded w-5/6"></div>
            <div className="h-4 bg-gray-300 rounded w-4/6"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analytics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-red-500">Analytics Unavailable</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">Unable to load player analytics</p>
          <Button onClick={loadAnalytics} className="mt-2">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold text-blue-900">
              {playerName}
            </CardTitle>
            <p className="text-sm text-blue-600">
              {position} • {team}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {getPerformanceBadge(analytics.performance.trend)}
            {getInjuryBadge(analytics.injury.riskLevel)}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Performance Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-900">
              {analytics.performance.averagePoints.toFixed(1)}
            </div>
            <div className="text-xs text-gray-600">AVG Points</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-900">
              {analytics.performance.projectedPoints.toFixed(1)}
            </div>
            <div className="text-xs text-gray-600">Projected</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">
              {analytics.performance.floor.toFixed(1)}
            </div>
            <div className="text-xs text-gray-600">Floor</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-red-600">
              {analytics.performance.ceiling.toFixed(1)}
            </div>
            <div className="text-xs text-gray-600">Ceiling</div>
          </div>
        </div>

        {/* Consistency Score */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Consistency</span>
            <span className="text-sm text-gray-600">
              {(analytics.performance.consistency * 100).toFixed(0)}%
            </span>
          </div>
          <Progress 
            value={analytics.performance.consistency * 100} 
            className="h-2"
          />
        </div>

        {/* Injury Risk */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Injury Risk</span>
            <span className="text-sm text-gray-600">
              {(analytics.injury.riskScore * 100).toFixed(0)}%
            </span>
          </div>
          <Progress 
            value={analytics.injury.riskScore * 100} 
            className="h-2"
          />
          {analytics.injury.factors.length > 0 && (
            <div className="mt-2">
              <p className="text-xs text-gray-600 mb-1">Risk Factors:</p>
              <div className="flex flex-wrap gap-1">
                {analytics.injury.factors.map((factor, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {factor}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Matchup Analysis */}
        <div className="bg-white rounded-lg p-4 border">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-gray-900 flex items-center">
              <Target className="w-4 h-4 mr-2 text-orange-500" />
              Matchup Analysis
            </h4>
            <Badge variant={analytics.matchup.favorability === 'favorable' ? 'default' : 'secondary'}>
              {analytics.matchup.favorability}
            </Badge>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Difficulty</span>
              <Progress value={analytics.matchup.difficulty} className="w-20 h-2" />
            </div>
            {analytics.matchup.keyFactors.length > 0 && (
              <div>
                <p className="text-xs text-gray-600 mb-1">Key Factors:</p>
                <ul className="text-xs text-gray-700 space-y-1">
                  {analytics.matchup.keyFactors.map((factor, index) => (
                    <li key={index} className="flex items-center">
                      <div className="w-1 h-1 bg-orange-400 rounded-full mr-2"></div>
                      {factor}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* ML Insights */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-purple-900 flex items-center">
              <Zap className="w-4 h-4 mr-2 text-purple-500" />
              AI Insights
            </h4>
            <div className={`text-sm font-medium ${getConfidenceColor(analytics.ml.confidence)}`}>
              {(analytics.ml.confidence * 100).toFixed(0)}% confidence
            </div>
          </div>
          <div className="space-y-2">
            <div className="bg-white rounded p-2 border">
              <p className="text-sm font-medium text-purple-800">
                {analytics.ml.recommendation}
              </p>
            </div>
            {analytics.ml.insights.length > 0 && (
              <div className="space-y-1">
                {analytics.ml.insights.map((insight, index) => (
                  <div key={index} className="text-xs text-purple-700 flex items-start">
                    <div className="w-1 h-1 bg-purple-400 rounded-full mr-2 mt-1.5"></div>
                    {insight}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button 
            onClick={refreshAnalytics}
            disabled={refreshing}
            size="sm"
            className="flex-1"
          >
            {refreshing ? 'Refreshing...' : 'Refresh Analytics'}
          </Button>
          <Button 
            variant="outline"
            size="sm"
            onClick={() => window.open(`/player/${playerId}`, '_blank')}
          >
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}