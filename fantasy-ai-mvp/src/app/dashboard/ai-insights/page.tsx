'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Brain,
  TrendingUp,
  AlertTriangle,
  Target,
  Lightbulb,
  Trophy,
  Users,
  Calendar,
  Cloud,
  Activity,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Insight {
  id: string;
  category: 'performance' | 'strategy' | 'opportunity' | 'warning';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  actionable: boolean;
  impact?: string;
  confidence: number;
}

const insights: Insight[] = [
  {
    id: '1',
    category: 'opportunity',
    priority: 'high',
    title: 'Trade Opportunity: Buy Low on Injured Star',
    description: 'Christian McCaffrey\'s owner is 2-8 and out of playoffs. His value is at season-low due to injury. Expected return Week 12 with easy schedule.',
    actionable: true,
    impact: '+15% championship odds',
    confidence: 0.89
  },
  {
    id: '2',
    category: 'warning',
    priority: 'high',
    title: 'Weather Alert: Snow Game Impact',
    description: 'Heavy snow expected for BUF @ KC. Consider benching pass-heavy players. Historical data shows 32% reduction in passing yards.',
    actionable: true,
    impact: '-8 projected points',
    confidence: 0.92
  },
  {
    id: '3',
    category: 'performance',
    priority: 'medium',
    title: 'Breakout Pattern Detected',
    description: 'Jaylen Warren showing elite efficiency metrics. Usage trending up with Najee Harris nursing ankle. 3-week breakout window predicted.',
    actionable: true,
    impact: '+12 points/week',
    confidence: 0.78
  },
  {
    id: '4',
    category: 'strategy',
    priority: 'medium',
    title: 'Playoff Schedule Optimization',
    description: 'Your RB depth has tough Week 15-16 matchups. Consider trading for RBs with favorable playoff schedules now.',
    actionable: true,
    impact: 'Playoff advantage',
    confidence: 0.85
  }
];

const performancePredictions = [
  { week: 'W11', actual: 156, predicted: 152, league: 142 },
  { week: 'W12', actual: null, predicted: 168, league: 145 },
  { week: 'W13', actual: null, predicted: 162, league: 143 },
  { week: 'W14', actual: null, predicted: 171, league: 148 },
  { week: 'W15', actual: null, predicted: 165, league: 144 },
  { week: 'W16', actual: null, predicted: 178, league: 150 },
];

const playerTrends = [
  { name: 'P. Mahomes', trend: 'stable', next3Weeks: 28.5, restOfSeason: 27.8, confidence: 0.91 },
  { name: 'C. McCaffrey', trend: 'recovering', next3Weeks: 18.2, restOfSeason: 22.5, confidence: 0.75 },
  { name: 'T. Hill', trend: 'hot', next3Weeks: 21.8, restOfSeason: 19.2, confidence: 0.88 },
  { name: 'T. Kelce', trend: 'declining', next3Weeks: 14.2, restOfSeason: 13.5, confidence: 0.82 },
];

export default function AIInsightsPage() {
  const [selectedInsight, setSelectedInsight] = useState<Insight | null>(null);
  const [processingAction, setProcessingAction] = useState<string | null>(null);

  const getCategoryIcon = (category: Insight['category']) => {
    switch (category) {
      case 'performance': return <TrendingUp className="h-4 w-4" />;
      case 'strategy': return <Target className="h-4 w-4" />;
      case 'opportunity': return <Lightbulb className="h-4 w-4" />;
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: Insight['category']) => {
    switch (category) {
      case 'performance': return 'text-blue-500';
      case 'strategy': return 'text-purple-500';
      case 'opportunity': return 'text-green-500';
      case 'warning': return 'text-yellow-500';
    }
  };

  const getPriorityColor = (priority: Insight['priority']) => {
    switch (priority) {
      case 'high': return 'bg-red-900/50 text-red-400 border-red-800';
      case 'medium': return 'bg-yellow-900/50 text-yellow-400 border-yellow-800';
      case 'low': return 'bg-gray-900/50 text-gray-400 border-gray-800';
    }
  };

  const handleAction = async (insightId: string) => {
    setProcessingAction(insightId);
    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    setProcessingAction(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">AI Insights</h1>
        <p className="text-gray-400 mt-1">Intelligent analysis and recommendations</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gray-900/50 border-gray-800">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <Brain className="h-6 w-6 text-blue-500" />
              <Badge variant="secondary" className="bg-blue-900/50 text-blue-400">
                Active
              </Badge>
            </div>
            <p className="text-2xl font-bold text-white mt-2">94%</p>
            <p className="text-xs text-gray-400">AI Confidence</p>
          </div>
        </Card>
        
        <Card className="bg-gray-900/50 border-gray-800">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <Target className="h-6 w-6 text-purple-500" />
              <span className="text-sm text-green-500">+12%</span>
            </div>
            <p className="text-2xl font-bold text-white mt-2">87%</p>
            <p className="text-xs text-gray-400">Prediction Accuracy</p>
          </div>
        </Card>
        
        <Card className="bg-gray-900/50 border-gray-800">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <Sparkles className="h-6 w-6 text-yellow-500" />
              <span className="text-sm text-gray-500">Today</span>
            </div>
            <p className="text-2xl font-bold text-white mt-2">12</p>
            <p className="text-xs text-gray-400">New Insights</p>
          </div>
        </Card>
        
        <Card className="bg-gray-900/50 border-gray-800">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <Trophy className="h-6 w-6 text-green-500" />
              <span className="text-sm text-green-500">+5.2%</span>
            </div>
            <p className="text-2xl font-bold text-white mt-2">92%</p>
            <p className="text-xs text-gray-400">Championship Odds</p>
          </div>
        </Card>
      </div>

      <Tabs defaultValue="insights" className="space-y-6">
        <TabsList className="bg-gray-900/50 border border-gray-800">
          <TabsTrigger value="insights">Key Insights</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
          <TabsTrigger value="trends">Player Trends</TabsTrigger>
          <TabsTrigger value="strategy">Strategy</TabsTrigger>
        </TabsList>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {insights.map(insight => (
              <Card
                key={insight.id}
                className="bg-gray-900/50 border-gray-800 cursor-pointer hover:border-gray-700 transition-colors"
                onClick={() => setSelectedInsight(insight)}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-gray-800 ${getCategoryColor(insight.category)}`}>
                        {getCategoryIcon(insight.category)}
                      </div>
                      <Badge className={getPriorityColor(insight.priority)} variant="secondary">
                        {insight.priority} priority
                      </Badge>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-white">{(insight.confidence * 100).toFixed(0)}%</p>
                      <p className="text-xs text-gray-400">confidence</p>
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-white mb-2">{insight.title}</h3>
                  <p className="text-sm text-gray-400 mb-4">{insight.description}</p>
                  
                  {insight.impact && (
                    <div className="flex items-center justify-between pt-4 border-t border-gray-800">
                      <span className="text-xs text-gray-500">Potential Impact</span>
                      <span className="text-sm font-semibold text-green-500">{insight.impact}</span>
                    </div>
                  )}
                  
                  {insight.actionable && (
                    <Button
                      size="sm"
                      className="w-full mt-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAction(insight.id);
                      }}
                      disabled={processingAction === insight.id}
                    >
                      {processingAction === insight.id ? (
                        <>
                          <Activity className="h-3 w-3 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          Take Action
                          <ChevronRight className="h-3 w-3 ml-2" />
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="predictions" className="space-y-6">
          <Card className="bg-gray-900/50 border-gray-800">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Weekly Score Predictions</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={performancePredictions}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="week" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                    labelStyle={{ color: '#e5e7eb' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="predicted" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="league" 
                    stroke="#6b7280" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="actual" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    dot={{ fill: '#10b981', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
              
              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="text-center">
                  <p className="text-sm text-gray-400">Next Week Projection</p>
                  <p className="text-2xl font-bold text-white">168</p>
                  <p className="text-xs text-green-500">+12 vs league avg</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-400">Win Probability</p>
                  <p className="text-2xl font-bold text-white">78%</p>
                  <p className="text-xs text-blue-500">Very Likely</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-400">Confidence Level</p>
                  <p className="text-2xl font-bold text-white">91%</p>
                  <p className="text-xs text-purple-500">High Confidence</p>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card className="bg-gray-900/50 border-gray-800">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-white mb-6">Player Performance Trends</h3>
              <div className="space-y-4">
                {playerTrends.map((player, index) => (
                  <div key={index} className="p-4 bg-gray-800/50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-semibold text-white">{player.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge 
                            variant="secondary" 
                            className={`text-xs ${
                              player.trend === 'hot' ? 'bg-red-900/50 text-red-400' :
                              player.trend === 'stable' ? 'bg-blue-900/50 text-blue-400' :
                              player.trend === 'declining' ? 'bg-yellow-900/50 text-yellow-400' :
                              'bg-green-900/50 text-green-400'
                            }`}
                          >
                            {player.trend}
                          </Badge>
                          <span className="text-xs text-gray-400">
                            {(player.confidence * 100).toFixed(0)}% confidence
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-400">Next 3 weeks</p>
                        <p className="text-xl font-bold text-white">{player.next3Weeks}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-gray-900/50 rounded">
                        <p className="text-xs text-gray-400">Rest of Season</p>
                        <p className="text-lg font-semibold text-white">{player.restOfSeason} avg</p>
                      </div>
                      <div className="p-3 bg-gray-900/50 rounded">
                        <p className="text-xs text-gray-400">Trend Direction</p>
                        <p className="text-lg font-semibold text-white flex items-center gap-1">
                          {player.trend === 'hot' && <TrendingUp className="h-4 w-4 text-red-500" />}
                          {player.trend === 'declining' && <TrendingUp className="h-4 w-4 text-yellow-500 rotate-180" />}
                          {player.trend === 'stable' && <Activity className="h-4 w-4 text-blue-500" />}
                          {player.trend === 'recovering' && <TrendingUp className="h-4 w-4 text-green-500" />}
                          <span className="text-sm">
                            {player.trend === 'hot' ? '+18%' :
                             player.trend === 'declining' ? '-12%' :
                             player.trend === 'stable' ? '±2%' :
                             '+8%'}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="strategy" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-gray-900/50 border-gray-800">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-purple-500" />
                  Playoff Strategy
                </h3>
                <div className="space-y-3">
                  <div className="p-3 bg-purple-900/20 border border-purple-800/50 rounded-lg">
                    <p className="text-sm font-medium text-purple-400">Week 15-17 Optimization</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Your team has 73% favorable matchups during playoffs. Consider holding current roster.
                    </p>
                  </div>
                  <div className="p-3 bg-gray-800/50 rounded-lg">
                    <p className="text-sm font-medium text-white">Recommended Targets</p>
                    <ul className="text-xs text-gray-400 mt-2 space-y-1">
                      <li>• RBs facing bottom-10 rush defenses</li>
                      <li>• WRs with 25%+ target share</li>
                      <li>• QBs with dome games Week 16-17</li>
                    </ul>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="bg-gray-900/50 border-gray-800">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Cloud className="h-5 w-5 text-blue-500" />
                  Weather Impact Analysis
                </h3>
                <div className="space-y-3">
                  <div className="p-3 bg-blue-900/20 border border-blue-800/50 rounded-lg">
                    <p className="text-sm font-medium text-blue-400">Next 3 Weeks</p>
                    <p className="text-xs text-gray-400 mt-1">
                      4 of your players have outdoor cold-weather games. Historical -15% production.
                    </p>
                  </div>
                  <div className="p-3 bg-gray-800/50 rounded-lg">
                    <p className="text-sm font-medium text-white">Weather-Proof Options</p>
                    <ul className="text-xs text-gray-400 mt-2 space-y-1">
                      <li>• Dome team players (NO, LV, DAL)</li>
                      <li>• Run-heavy offenses in cold</li>
                      <li>• Avoid deep-threat WRs in wind</li>
                    </ul>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Insight Detail Modal */}
      {selectedInsight && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedInsight(null)}
        >
          <Card
            className="bg-gray-900 border-gray-800 max-w-2xl w-full"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-lg bg-gray-800 ${getCategoryColor(selectedInsight.category)}`}>
                    {getCategoryIcon(selectedInsight.category)}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">{selectedInsight.title}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={getPriorityColor(selectedInsight.priority)} variant="secondary">
                        {selectedInsight.priority} priority
                      </Badge>
                      <span className="text-sm text-gray-400">
                        {(selectedInsight.confidence * 100).toFixed(0)}% confidence
                      </span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedInsight(null)}
                  className="text-gray-400 hover:text-white"
                >
                  ×
                </Button>
              </div>
              
              <p className="text-gray-300 mb-6">{selectedInsight.description}</p>
              
              {selectedInsight.impact && (
                <div className="p-4 bg-gray-800/50 rounded-lg mb-6">
                  <p className="text-sm text-gray-400 mb-1">Expected Impact</p>
                  <p className="text-lg font-semibold text-green-500">{selectedInsight.impact}</p>
                </div>
              )}
              
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-white">AI Analysis Details</h3>
                <div className="space-y-2 text-sm text-gray-400">
                  <p>• Analyzed 10,000+ similar historical scenarios</p>
                  <p>• Cross-referenced with current season trends</p>
                  <p>• Factored in team needs and league dynamics</p>
                  <p>• Weighted by recent performance patterns</p>
                </div>
              </div>
              
              {selectedInsight.actionable && (
                <Button
                  className="w-full mt-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  onClick={() => handleAction(selectedInsight.id)}
                  disabled={processingAction === selectedInsight.id}
                >
                  {processingAction === selectedInsight.id ? (
                    <>
                      <Activity className="h-4 w-4 mr-2 animate-spin" />
                      Processing Action...
                    </>
                  ) : (
                    <>
                      Execute Recommendation
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}