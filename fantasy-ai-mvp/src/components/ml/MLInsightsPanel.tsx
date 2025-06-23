/**
 * ML Insights Panel Component
 * Displays comprehensive ML predictions and analytics in the dashboard
 */

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  Cloud,
  Activity,
  BarChart3,
  Target,
  Shield,
  Zap,
  Info
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { LineChart, Line, BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface MLInsightsPanelProps {
  playerId: string;
  playerName: string;
  position: string;
  week?: number;
}

interface PlayerAnalysis {
  playerId: string;
  playerName: string;
  position: string;
  projectedPoints: number;
  confidence: number;
  floor: number;
  ceiling: number;
  injuryRisk: {
    score: number;
    level: string;
    factors: string[];
  };
  matchup: {
    advantage: number;
    rating: string;
    keyFactors: string[];
  };
  weather: {
    impact: number;
    multiplier: number;
    concerns: string[];
  };
  patterns: {
    type: string;
    confidence: number;
    description: string;
  }[];
  tradeValue: {
    score: number;
    rank: number;
    recommendation: string;
  };
  startConfidence: number;
  dfsValue: number;
  seasonLongValue: number;
  recommendation: string;
  alternativeOptions: string[];
}

export function MLInsightsPanel({ playerId, playerName, position, week = 1 }: MLInsightsPanelProps) {
  const [analysis, setAnalysis] = useState<PlayerAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchPlayerAnalysis();
  }, [playerId, week]);

  const fetchPlayerAnalysis = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/ml/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'analyzePlayer',
          data: {
            playerId,
            week,
            // Add any additional context data here
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch ML analysis');
      }

      const data = await response.json();
      setAnalysis(data.analysis);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <MLInsightsSkeleton />;
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center text-red-500">
          <AlertTriangle className="w-12 h-12 mx-auto mb-2" />
          <p>Error loading ML insights: {error}</p>
          <Button onClick={fetchPlayerAnalysis} className="mt-4">
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  if (!analysis) {
    return null;
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Brain className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold">ML Insights</h2>
          <Badge variant="secondary">{position}</Badge>
        </div>
        <Badge 
          variant={analysis.startConfidence > 75 ? 'default' : analysis.startConfidence > 50 ? 'secondary' : 'destructive'}
          className="text-lg px-3 py-1"
        >
          {analysis.startConfidence}% Start Confidence
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="projections">Projections</TabsTrigger>
          <TabsTrigger value="risks">Risks</TabsTrigger>
          <TabsTrigger value="patterns">Patterns</TabsTrigger>
          <TabsTrigger value="trade">Trade</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <ProjectionOverview analysis={analysis} />
          <RecommendationCard analysis={analysis} />
          <QuickInsights analysis={analysis} />
        </TabsContent>

        <TabsContent value="projections" className="space-y-6">
          <ProjectionChart analysis={analysis} />
          <MatchupAnalysis analysis={analysis} />
          <WeatherImpact analysis={analysis} />
        </TabsContent>

        <TabsContent value="risks" className="space-y-6">
          <InjuryRiskAssessment analysis={analysis} />
          <RiskFactors analysis={analysis} />
        </TabsContent>

        <TabsContent value="patterns" className="space-y-6">
          <PatternRecognition analysis={analysis} />
          <HistoricalPerformance playerId={playerId} />
        </TabsContent>

        <TabsContent value="trade" className="space-y-6">
          <TradeValueAnalysis analysis={analysis} />
          <MarketTrends analysis={analysis} />
        </TabsContent>
      </Tabs>
    </Card>
  );
}

// Sub-components
function ProjectionOverview({ analysis }: { analysis: PlayerAnalysis }) {
  const projectionData = [
    { name: 'Floor', value: analysis.floor, color: '#ef4444' },
    { name: 'Projection', value: analysis.projectedPoints, color: '#3b82f6' },
    { name: 'Ceiling', value: analysis.ceiling, color: '#10b981' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">Projected Points</span>
          <Target className="w-4 h-4 text-primary" />
        </div>
        <div className="text-3xl font-bold">{analysis.projectedPoints.toFixed(1)}</div>
        <Progress value={analysis.confidence * 100} className="mt-2" />
        <span className="text-xs text-muted-foreground">
          {(analysis.confidence * 100).toFixed(0)}% confidence
        </span>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">Range</span>
          <BarChart3 className="w-4 h-4 text-primary" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm">{analysis.floor.toFixed(1)}</span>
          <div className="flex-1">
            <div className="h-2 bg-gradient-to-r from-red-500 via-blue-500 to-green-500 rounded" />
          </div>
          <span className="text-sm">{analysis.ceiling.toFixed(1)}</span>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">Matchup</span>
          <Shield className="w-4 h-4 text-primary" />
        </div>
        <div className="text-lg font-semibold">{analysis.matchup.rating}</div>
        <Badge 
          variant={analysis.matchup.advantage > 0 ? 'default' : 'destructive'}
          className="mt-1"
        >
          {analysis.matchup.advantage > 0 ? '+' : ''}{(analysis.matchup.advantage * 100).toFixed(0)}%
        </Badge>
      </Card>
    </div>
  );
}

function RecommendationCard({ analysis }: { analysis: PlayerAnalysis }) {
  const getRecommendationIcon = () => {
    if (analysis.startConfidence > 75) return <TrendingUp className="w-5 h-5 text-green-500" />;
    if (analysis.startConfidence > 50) return <Activity className="w-5 h-5 text-yellow-500" />;
    return <TrendingDown className="w-5 h-5 text-red-500" />;
  };

  return (
    <Card className="p-4 bg-gradient-to-r from-primary/10 to-primary/5">
      <div className="flex items-start gap-3">
        {getRecommendationIcon()}
        <div className="flex-1">
          <h3 className="font-semibold mb-1">AI Recommendation</h3>
          <p className="text-sm text-muted-foreground">{analysis.recommendation}</p>
          {analysis.alternativeOptions.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-semibold mb-1">Alternatives:</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                {analysis.alternativeOptions.map((option, i) => (
                  <li key={i}>• {option}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

function QuickInsights({ analysis }: { analysis: PlayerAnalysis }) {
  const insights = [
    {
      label: 'DFS Value',
      value: analysis.dfsValue,
      icon: <Zap className="w-4 h-4" />,
      color: analysis.dfsValue > 70 ? 'text-green-500' : analysis.dfsValue > 50 ? 'text-yellow-500' : 'text-red-500',
    },
    {
      label: 'Season Long',
      value: analysis.seasonLongValue,
      icon: <TrendingUp className="w-4 h-4" />,
      color: analysis.seasonLongValue > 70 ? 'text-green-500' : analysis.seasonLongValue > 50 ? 'text-yellow-500' : 'text-red-500',
    },
    {
      label: 'Trade Value',
      value: analysis.tradeValue.score,
      icon: <Activity className="w-4 h-4" />,
      color: analysis.tradeValue.score > 70 ? 'text-green-500' : analysis.tradeValue.score > 50 ? 'text-yellow-500' : 'text-red-500',
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {insights.map((insight, i) => (
        <div key={i} className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
          <div className={insight.color}>{insight.icon}</div>
          <div>
            <p className="text-xs text-muted-foreground">{insight.label}</p>
            <p className="text-lg font-semibold">{insight.value}%</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function ProjectionChart({ analysis }: { analysis: PlayerAnalysis }) {
  // Mock historical data - in production, fetch from API
  const historicalData = [
    { week: 'W1', actual: 15.2, projected: 14.8 },
    { week: 'W2', actual: 18.5, projected: 17.2 },
    { week: 'W3', actual: 12.1, projected: 13.5 },
    { week: 'W4', actual: 22.3, projected: 19.8 },
    { week: 'W5', actual: 16.7, projected: 16.2 },
    { week: 'Current', projected: analysis.projectedPoints },
  ];

  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-4">Projection Accuracy</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={historicalData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="week" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="projected" 
            stroke="#3b82f6" 
            strokeWidth={2}
            dot={{ fill: '#3b82f6' }}
          />
          <Line 
            type="monotone" 
            dataKey="actual" 
            stroke="#10b981" 
            strokeWidth={2}
            dot={{ fill: '#10b981' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}

function MatchupAnalysis({ analysis }: { analysis: PlayerAnalysis }) {
  const radarData = analysis.matchup.keyFactors.map((factor, i) => ({
    factor: factor,
    value: 50 + (analysis.matchup.advantage * 100 * (1 - i * 0.2)),
    fullMark: 100,
  }));

  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-4">Matchup Breakdown</h3>
      <ResponsiveContainer width="100%" height={300}>
        <RadarChart data={radarData}>
          <PolarGrid />
          <PolarAngleAxis dataKey="factor" />
          <PolarRadiusAxis angle={90} domain={[0, 100]} />
          <Radar 
            name="Matchup Score" 
            dataKey="value" 
            stroke="#3b82f6" 
            fill="#3b82f6" 
            fillOpacity={0.6} 
          />
          <Tooltip />
        </RadarChart>
      </ResponsiveContainer>
      <div className="mt-4 space-y-2">
        {analysis.matchup.keyFactors.map((factor, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{factor}</span>
            <Badge variant="outline">{analysis.matchup.advantage > 0 ? '✓' : '✗'}</Badge>
          </div>
        ))}
      </div>
    </Card>
  );
}

function WeatherImpact({ analysis }: { analysis: PlayerAnalysis }) {
  const hasWeatherConcerns = analysis.weather.concerns.length > 0;
  
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Weather Impact</h3>
        <Cloud className={`w-5 h-5 ${hasWeatherConcerns ? 'text-yellow-500' : 'text-blue-500'}`} />
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Impact Score</span>
          <span className="font-semibold">
            {analysis.weather.impact > 0 ? '+' : ''}{(analysis.weather.impact * 100).toFixed(0)}%
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Projection Multiplier</span>
          <span className="font-semibold">{analysis.weather.multiplier.toFixed(2)}x</span>
        </div>
        
        {hasWeatherConcerns && (
          <div className="mt-4 p-3 bg-yellow-500/10 rounded-lg">
            <p className="text-sm font-semibold text-yellow-700 mb-2">Weather Concerns:</p>
            <ul className="space-y-1">
              {analysis.weather.concerns.map((concern, i) => (
                <li key={i} className="text-xs text-muted-foreground">• {concern}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Card>
  );
}

function InjuryRiskAssessment({ analysis }: { analysis: PlayerAnalysis }) {
  const getRiskColor = (score: number) => {
    if (score < 0.3) return 'text-green-500';
    if (score < 0.6) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getRiskBgColor = (score: number) => {
    if (score < 0.3) return 'bg-green-500/10';
    if (score < 0.6) return 'bg-yellow-500/10';
    return 'bg-red-500/10';
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Injury Risk Assessment</h3>
        <AlertTriangle className={`w-5 h-5 ${getRiskColor(analysis.injuryRisk.score)}`} />
      </div>
      
      <div className={`p-4 rounded-lg ${getRiskBgColor(analysis.injuryRisk.score)}`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-2xl font-bold">{analysis.injuryRisk.level}</span>
          <span className="text-3xl font-bold">{(analysis.injuryRisk.score * 100).toFixed(0)}%</span>
        </div>
        <Progress 
          value={analysis.injuryRisk.score * 100} 
          className="h-3"
        />
      </div>
      
      <div className="mt-4 space-y-2">
        <p className="text-sm font-semibold">Risk Factors:</p>
        {analysis.injuryRisk.factors.map((factor, i) => (
          <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-2 h-2 bg-red-500 rounded-full" />
            {factor}
          </div>
        ))}
      </div>
    </Card>
  );
}

function RiskFactors({ analysis }: { analysis: PlayerAnalysis }) {
  const riskCategories = [
    {
      name: 'Injury Risk',
      value: analysis.injuryRisk.score * 100,
      description: 'Physical injury probability',
    },
    {
      name: 'Matchup Risk',
      value: Math.max(0, -analysis.matchup.advantage * 100),
      description: 'Difficult defensive matchup',
    },
    {
      name: 'Weather Risk',
      value: Math.max(0, -analysis.weather.impact * 100),
      description: 'Adverse weather conditions',
    },
    {
      name: 'Volatility Risk',
      value: ((analysis.ceiling - analysis.floor) / analysis.projectedPoints) * 50,
      description: 'Performance variance',
    },
  ];

  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-4">Risk Analysis</h3>
      <div className="space-y-4">
        {riskCategories.map((risk, i) => (
          <div key={i}>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium">{risk.name}</span>
              <span className="text-sm font-semibold">{risk.value.toFixed(0)}%</span>
            </div>
            <Progress value={risk.value} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">{risk.description}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function PatternRecognition({ analysis }: { analysis: PlayerAnalysis }) {
  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-4">Pattern Recognition</h3>
      <div className="space-y-3">
        {analysis.patterns.map((pattern, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-3 bg-muted/50 rounded-lg"
          >
            <div className="flex items-center justify-between mb-2">
              <Badge>{pattern.type}</Badge>
              <span className="text-sm font-semibold">
                {(pattern.confidence * 100).toFixed(0)}% confidence
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{pattern.description}</p>
          </motion.div>
        ))}
      </div>
    </Card>
  );
}

function HistoricalPerformance({ playerId }: { playerId: string }) {
  // Mock data - in production, fetch from API
  const performanceData = [
    { week: 1, points: 12.5, avg: 15 },
    { week: 2, points: 18.3, avg: 15 },
    { week: 3, points: 8.7, avg: 15 },
    { week: 4, points: 22.1, avg: 15 },
    { week: 5, points: 16.9, avg: 15 },
    { week: 6, points: 14.2, avg: 15 },
  ];

  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-4">Historical Performance</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={performanceData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="week" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="points" fill="#3b82f6" />
          <Line type="monotone" dataKey="avg" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}

function TradeValueAnalysis({ analysis }: { analysis: PlayerAnalysis }) {
  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-4">Trade Value Analysis</h3>
      <div className="space-y-4">
        <div className="text-center">
          <div className="text-4xl font-bold mb-2">{analysis.tradeValue.score}</div>
          <p className="text-sm text-muted-foreground">Overall Trade Value</p>
        </div>
        
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <span className="text-sm">Positional Rank</span>
          <Badge>#{analysis.tradeValue.rank}</Badge>
        </div>
        
        <div className="p-3 bg-primary/10 rounded-lg">
          <p className="text-sm font-semibold mb-1">Trade Recommendation:</p>
          <p className="text-sm text-muted-foreground">{analysis.tradeValue.recommendation}</p>
        </div>
      </div>
    </Card>
  );
}

function MarketTrends({ analysis }: { analysis: PlayerAnalysis }) {
  // Mock trend data
  const trendData = [
    { week: 'W1', value: 65 },
    { week: 'W2', value: 68 },
    { week: 'W3', value: 62 },
    { week: 'W4', value: 75 },
    { week: 'W5', value: analysis.tradeValue.score },
  ];

  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-4">Value Trend</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={trendData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="week" />
          <YAxis domain={[0, 100]} />
          <Tooltip />
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke="#3b82f6" 
            strokeWidth={3}
            dot={{ fill: '#3b82f6', r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}

function MLInsightsSkeleton() {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Skeleton className="w-6 h-6" />
        <Skeleton className="w-32 h-6" />
      </div>
      <div className="space-y-4">
        <Skeleton className="w-full h-32" />
        <Skeleton className="w-full h-32" />
        <Skeleton className="w-full h-32" />
      </div>
    </Card>
  );
}