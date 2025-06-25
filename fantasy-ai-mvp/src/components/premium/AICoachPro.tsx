'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, TrendingUp, AlertTriangle, Target, Trophy, 
  Zap, Users, Calendar, BarChart3, Sparkles, MessageSquare
} from 'lucide-react';
import { FeatureGate } from '@/components/subscription/FeatureGate';
import { useSubscription } from '@/contexts/SubscriptionContext';

interface LineupRecommendation {
  position: string;
  currentPlayer: {
    name: string;
    projectedPoints: number;
  };
  recommendedPlayer: {
    name: string;
    projectedPoints: number;
    reasoning: string;
  };
  confidence: number;
  impact: number;
}

interface StrategyInsight {
  type: 'opportunity' | 'risk' | 'trend';
  title: string;
  description: string;
  action: string;
  priority: 'high' | 'medium' | 'low';
  confidence: number;
}

export function AICoachPro() {
  const { tier } = useSubscription();
  const [activeTab, setActiveTab] = useState('lineup');
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<LineupRecommendation[]>([]);
  const [insights, setInsights] = useState<StrategyInsight[]>([]);
  const [coachMessage, setCoachMessage] = useState('');

  useEffect(() => {
    if (tier !== 'FREE') {
      generateRecommendations();
    }
  }, [tier]);

  const generateRecommendations = async () => {
    setLoading(true);
    
    // Simulate AI analysis
    setTimeout(() => {
      // Mock lineup recommendations
      setRecommendations([
        {
          position: 'QB',
          currentPlayer: { name: 'Dak Prescott', projectedPoints: 18.5 },
          recommendedPlayer: {
            name: 'Josh Allen',
            projectedPoints: 24.2,
            reasoning: 'Favorable matchup vs 28th ranked pass defense, 73% chance of shootout'
          },
          confidence: 0.87,
          impact: 5.7
        },
        {
          position: 'RB1',
          currentPlayer: { name: 'Austin Ekeler', projectedPoints: 14.2 },
          recommendedPlayer: {
            name: 'Christian McCaffrey',
            projectedPoints: 19.8,
            reasoning: 'Volume play with 25+ touches expected, red zone favorite'
          },
          confidence: 0.92,
          impact: 5.6
        },
        {
          position: 'WR2',
          currentPlayer: { name: 'Chris Olave', projectedPoints: 13.1 },
          recommendedPlayer: {
            name: 'Amon-Ra St. Brown',
            projectedPoints: 16.4,
            reasoning: 'Target share leader facing weak slot coverage'
          },
          confidence: 0.79,
          impact: 3.3
        }
      ]);

      // Mock strategy insights
      setInsights([
        {
          type: 'opportunity',
          title: 'Stack Opportunity Detected',
          description: 'Bills QB-WR stack projected for 48.7 combined points',
          action: 'Consider stacking Josh Allen with Stefon Diggs',
          priority: 'high',
          confidence: 0.88
        },
        {
          type: 'risk',
          title: 'Weather Alert',
          description: '20mph winds expected for Chiefs game',
          action: 'Reduce exposure to KC passing game',
          priority: 'medium',
          confidence: 0.75
        },
        {
          type: 'trend',
          title: 'Positive Regression Candidate',
          description: 'CeeDee Lamb averaging 9 targets but only 12.1 PPG',
          action: 'Buy low opportunity before breakout',
          priority: 'high',
          confidence: 0.83
        }
      ]);

      setCoachMessage(
        "🎯 Your lineup has strong potential but I've identified 3 key upgrades that could increase your win probability by 24%. Focus on the QB and RB1 positions for maximum impact this week."
      );

      setLoading(false);
    }, 2000);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      default: return 'outline';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return <TrendingUp className="h-4 w-4" />;
      case 'risk': return <AlertTriangle className="h-4 w-4" />;
      case 'trend': return <BarChart3 className="h-4 w-4" />;
      default: return <Zap className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            AI Coach Pro
          </h2>
          <p className="text-muted-foreground">
            Personalized recommendations powered by advanced ML
          </p>
        </div>
        <Badge variant="default" className="bg-gradient-to-r from-blue-500 to-purple-600">
          <Sparkles className="h-3 w-3 mr-1" />
          PRO Feature
        </Badge>
      </div>

      <FeatureGate featureId="ADVANCED_PROJECTIONS">
        {/* Coach Message */}
        {coachMessage && (
          <Alert className="border-primary/50 bg-primary/5">
            <MessageSquare className="h-4 w-4" />
            <AlertDescription className="font-medium">
              {coachMessage}
            </AlertDescription>
          </Alert>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="lineup">Lineup Optimizer</TabsTrigger>
            <TabsTrigger value="strategy">Strategy Insights</TabsTrigger>
            <TabsTrigger value="matchups">Matchup Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="lineup" className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
                <p className="text-muted-foreground">Analyzing your lineup...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recommendations.map((rec, idx) => (
                  <Card key={idx} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge>{rec.position}</Badge>
                          <span className="text-sm text-muted-foreground">
                            +{rec.impact.toFixed(1)} points
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Confidence</span>
                          <Progress value={rec.confidence * 100} className="w-20" />
                          <span className="text-sm font-medium">
                            {(rec.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Current</p>
                          <p className="font-medium">{rec.currentPlayer.name}</p>
                          <p className="text-sm">{rec.currentPlayer.projectedPoints} proj pts</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Recommended</p>
                          <p className="font-medium text-primary">{rec.recommendedPlayer.name}</p>
                          <p className="text-sm">{rec.recommendedPlayer.projectedPoints} proj pts</p>
                        </div>
                      </div>
                      <Alert className="mt-3 py-2">
                        <AlertDescription className="text-sm">
                          {rec.recommendedPlayer.reasoning}
                        </AlertDescription>
                      </Alert>
                      <Button className="w-full mt-3" size="sm">
                        Apply Recommendation
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="strategy" className="space-y-4">
            {insights.map((insight, idx) => (
              <Card key={idx}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(insight.type)}
                      <CardTitle className="text-lg">{insight.title}</CardTitle>
                    </div>
                    <Badge variant={getPriorityColor(insight.priority)}>
                      {insight.priority} priority
                    </Badge>
                  </div>
                  <CardDescription>{insight.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Recommended Action:</p>
                      <p className="text-sm text-muted-foreground">{insight.action}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Confidence</p>
                      <p className="text-lg font-bold">{(insight.confidence * 100).toFixed(0)}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="matchups">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Advanced matchup analysis coming soon...
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Stats Summary */}
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="pt-6">
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">87%</p>
                <p className="text-sm text-muted-foreground">Win Probability</p>
              </div>
              <div>
                <p className="text-2xl font-bold">142.3</p>
                <p className="text-sm text-muted-foreground">Projected Points</p>
              </div>
              <div>
                <p className="text-2xl font-bold">+12.4</p>
                <p className="text-sm text-muted-foreground">vs Average</p>
              </div>
              <div>
                <p className="text-2xl font-bold">3</p>
                <p className="text-sm text-muted-foreground">Key Upgrades</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </FeatureGate>
    </div>
  );
}