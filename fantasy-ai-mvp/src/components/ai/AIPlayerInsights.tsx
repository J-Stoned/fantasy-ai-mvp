"use client";

import React, { useState, useEffect } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { NeonButton } from '@/components/ui/NeonButton';
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  CheckCircle,
  Zap,
  Target,
  Activity,
  Lightbulb,
  RefreshCw
} from 'lucide-react';

interface AIInsight {
  source: string;
  fantasyPoints: number;
  confidence: number;
  reasoning: string;
  breakdown: {
    passing?: number;
    rushing?: number;
    receiving?: number;
    defense?: number;
  };
  insights: string[];
}

interface AIPrediction {
  success: boolean;
  playerId: string;
  predictions: AIInsight[];
  overall: {
    confidence: number;
    recommendation: 'START' | 'CONSIDER' | 'BENCH';
    lastUpdated: string;
  };
  aiSystems: {
    hyperscaledOrchestrator: boolean;
    contextualLearning: boolean;
    multiModalFusion: boolean;
    totalWorkers: number;
  };
}

interface AIPlayerInsightsProps {
  playerId: string;
  playerName: string;
  position: string;
  gameId?: string;
  week?: number;
}

export function AIPlayerInsights({ 
  playerId, 
  playerName, 
  position, 
  gameId, 
  week 
}: AIPlayerInsightsProps) {
  const [prediction, setPrediction] = useState<AIPrediction | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (playerId) {
      fetchPrediction();
    }
  }, [playerId, gameId, week]);

  const fetchPrediction = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        playerId,
        ...(gameId && { gameId }),
        ...(week && { week: week.toString() })
      });
      
      const response = await fetch(`/api/ai/predictions?${params}`);
      
      if (response.ok) {
        const data = await response.json();
        setPrediction(data);
      } else {
        setError('Failed to get AI predictions');
      }
    } catch (err) {
      setError('AI systems are initializing...');
    } finally {
      setLoading(false);
    }
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'START': return 'bg-green-500';
      case 'CONSIDER': return 'bg-yellow-500';
      case 'BENCH': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getRecommendationIcon = (recommendation: string) => {
    switch (recommendation) {
      case 'START': return <CheckCircle className="w-4 h-4" />;
      case 'CONSIDER': return <AlertTriangle className="w-4 h-4" />;
      case 'BENCH': return <TrendingDown className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <GlassCard>
        <div>
          <h3 className="flex items-center space-x-2">
            <Brain className="w-5 h-5 animate-pulse" />
            <span>AI Analyzing {playerName}...</span>
          </h3>
        </div>
        <div>
          <div className="space-y-4">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 animate-pulse">
              <div className="bg-neon-blue h-2 rounded-full" style={{ width: '60%' }}></div>
            </div>
            <div className="text-sm text-gray-500">
              Processing with 1,375+ AI workers...
            </div>
          </div>
        </div>
      </GlassCard>
    );
  }

  if (error || !prediction) {
    return (
      <GlassCard>
        <div>
          <h3 className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            <span>AI Insights</span>
          </h3>
        </div>
        <div>
          <div className="text-center py-4">
            <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">{error}</p>
            <NeonButton onClick={fetchPrediction} variant="blue">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry Analysis
            </NeonButton>
          </div>
        </div>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Prediction GlassCard */}
      <GlassCard>
        <div>
          <h3 className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Brain className="w-5 h-5 text-blue-600" />
              <span>AI Insights: {playerName}</span>
              <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-sm">{position}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-yellow-500" />
              <span className="text-sm text-gray-500">
                {prediction.aiSystems.totalWorkers.toLocaleString()} AI workers
              </span>
            </div>
          </h3>
        </div>
        <div>
          {/* Overall Recommendation */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                {getRecommendationIcon(prediction.overall.recommendation)}
                <span className="font-semibold text-lg">
                  {prediction.overall.recommendation}
                </span>
              </div>
              <div 
                className={`${getRecommendationColor(prediction.overall.recommendation)} text-white`}
              >
                {prediction.overall.confidence}% Confidence
              </div>
            </div>
            
            <div className="mb-3">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-600">AI Confidence</span>
                <span className="text-sm font-medium">{prediction.overall.confidence}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-neon-green h-2 rounded-full" style={{ width: `${prediction.overall.confidence}%` }}></div>
              </div>
            </div>
            
            <div className="text-sm text-gray-600">
              Last updated: {new Date(prediction.overall.lastUpdated).toLocaleTimeString()}
            </div>
          </div>

          {/* AI System Status */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${
                prediction.aiSystems.hyperscaledOrchestrator ? 'bg-green-500' : 'bg-gray-300'
              }`}></div>
              <div className="text-xs text-gray-600">500 MCP Workers</div>
            </div>
            <div className="text-center">
              <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${
                prediction.aiSystems.contextualLearning ? 'bg-green-500' : 'bg-gray-300'
              }`}></div>
              <div className="text-xs text-gray-600">Contextual Learning</div>
            </div>
            <div className="text-center">
              <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${
                prediction.aiSystems.multiModalFusion ? 'bg-green-500' : 'bg-gray-300'
              }`}></div>
              <div className="text-xs text-gray-600">Multi-Modal Fusion</div>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Individual AI System Predictions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {prediction.predictions.map((insight, index) => (
          <GlassCard key={index}>
            <div>
              <h3 className="text-sm font-medium flex items-center justify-between">
                <span>{insight.source.replace(/([A-Z])/g, ' $1').trim()}</span>
                <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-sm">{insight.confidence}%</span>
              </h3>
            </div>
            <div className="space-y-4">
              {/* Fantasy Points Prediction */}
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {insight.fantasyPoints.toFixed(1)}
                </div>
                <div className="text-sm text-gray-500">Projected Points</div>
              </div>

              {/* Breakdown */}
              {insight.breakdown && Object.keys(insight.breakdown).length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">Breakdown:</div>
                  {Object.entries(insight.breakdown).map(([stat, points]) => (
                    <div key={stat} className="flex justify-between text-sm">
                      <span className="capitalize">{stat}:</span>
                      <span className="font-medium">{points}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Reasoning */}
              <div className="text-sm text-gray-600">
                <div className="font-medium mb-1">AI Reasoning:</div>
                <div>{insight.reasoning}</div>
              </div>

              {/* Key Insights */}
              {insight.insights && insight.insights.length > 0 && (
                <div className="space-y-1">
                  <div className="text-sm font-medium flex items-center">
                    <Lightbulb className="w-3 h-3 mr-1" />
                    Key Insights:
                  </div>
                  {insight.insights.slice(0, 2).map((insightText, idx) => (
                    <div key={idx} className="text-xs text-gray-600 ml-4">
                      • {insightText}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Refresh NeonButton */}
      <div className="text-center">
        <NeonButton onClick={fetchPrediction} variant="blue" disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Analyzing...' : 'Refresh AI Analysis'}
        </NeonButton>
        <div className="text-xs text-gray-500 mt-2">
          Powered by 1,375+ AI workers with contextual learning
        </div>
      </div>
    </div>
  );
}