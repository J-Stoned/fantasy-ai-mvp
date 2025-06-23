'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeftRight,
  TrendingUp,
  TrendingDown,
  Brain,
  Trophy,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Zap,
  Users,
  Target,
  BarChart3
} from 'lucide-react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface Player {
  id: string;
  name: string;
  position: string;
  team: string;
  value: number;
  trending: 'up' | 'down' | 'stable';
  seasonProjection: number;
  recentAvg: number;
  consistency: number;
  scheduleStrength: number;
}

interface TradePackage {
  give: Player[];
  receive: Player[];
}

interface TradeAnalysis {
  valueBalance: number;
  winProbabilityChange: number;
  positionImpact: {
    position: string;
    before: number;
    after: number;
  }[];
  championshipOddsChange: number;
  recommendation: 'accept' | 'reject' | 'negotiate';
  confidence: number;
}

// Sample players
const myRoster: Player[] = [
  { id: '1', name: 'Patrick Mahomes', position: 'QB', team: 'KC', value: 95, trending: 'stable', seasonProjection: 380, recentAvg: 28.5, consistency: 92, scheduleStrength: 6.5 },
  { id: '2', name: 'Christian McCaffrey', position: 'RB', team: 'SF', value: 98, trending: 'up', seasonProjection: 320, recentAvg: 22.3, consistency: 88, scheduleStrength: 5.8 },
  { id: '3', name: 'Austin Ekeler', position: 'RB', team: 'LAC', value: 82, trending: 'up', seasonProjection: 280, recentAvg: 18.7, consistency: 85, scheduleStrength: 6.2 },
  { id: '4', name: 'Tyreek Hill', position: 'WR', team: 'MIA', value: 94, trending: 'up', seasonProjection: 295, recentAvg: 19.8, consistency: 82, scheduleStrength: 5.5 },
  { id: '5', name: 'Stefon Diggs', position: 'WR', team: 'BUF', value: 90, trending: 'stable', seasonProjection: 275, recentAvg: 17.2, consistency: 86, scheduleStrength: 6.8 },
];

const availablePlayers: Player[] = [
  { id: '10', name: 'Justin Jefferson', position: 'WR', team: 'MIN', value: 96, trending: 'up', seasonProjection: 310, recentAvg: 21.5, consistency: 90, scheduleStrength: 5.2 },
  { id: '11', name: 'Nick Chubb', position: 'RB', team: 'CLE', value: 88, trending: 'stable', seasonProjection: 290, recentAvg: 19.2, consistency: 87, scheduleStrength: 6.0 },
  { id: '12', name: 'Davante Adams', position: 'WR', team: 'LV', value: 92, trending: 'down', seasonProjection: 285, recentAvg: 18.5, consistency: 84, scheduleStrength: 7.2 },
  { id: '13', name: 'Travis Etienne', position: 'RB', team: 'JAX', value: 78, trending: 'up', seasonProjection: 250, recentAvg: 16.8, consistency: 78, scheduleStrength: 5.5 },
];

export default function TradeSimulatorPage() {
  const [tradePackage, setTradePackage] = useState<TradePackage>({
    give: [],
    receive: []
  });
  const [selectedTeam, setSelectedTeam] = useState('team-1');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<TradeAnalysis | null>(null);

  const addToTrade = (player: Player, side: 'give' | 'receive') => {
    setTradePackage(prev => ({
      ...prev,
      [side]: [...prev[side], player]
    }));
  };

  const removeFromTrade = (playerId: string, side: 'give' | 'receive') => {
    setTradePackage(prev => ({
      ...prev,
      [side]: prev[side].filter(p => p.id !== playerId)
    }));
  };

  const analyzeTrade = async () => {
    setAnalyzing(true);
    // Simulate AI analysis
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const giveValue = tradePackage.give.reduce((sum, p) => sum + p.value, 0);
    const receiveValue = tradePackage.receive.reduce((sum, p) => sum + p.value, 0);
    const valueBalance = receiveValue - giveValue;
    
    setAnalysis({
      valueBalance,
      winProbabilityChange: valueBalance > 0 ? Math.random() * 5 + 2 : Math.random() * 3 - 5,
      positionImpact: [
        { position: 'QB', before: 92, after: 92 },
        { position: 'RB', before: 88, after: valueBalance > 0 ? 91 : 85 },
        { position: 'WR', before: 86, after: valueBalance > 0 ? 89 : 84 },
      ],
      championshipOddsChange: valueBalance > 0 ? Math.random() * 8 + 3 : Math.random() * 5 - 8,
      recommendation: valueBalance > 10 ? 'accept' : valueBalance < -10 ? 'reject' : 'negotiate',
      confidence: Math.abs(valueBalance) > 20 ? 0.9 : 0.7
    });
    
    setAnalyzing(false);
  };

  const projectionData = [
    { week: 'W9', before: 156, after: analysis ? 156 + (analysis.valueBalance * 0.5) : 156 },
    { week: 'W10', before: 162, after: analysis ? 162 + (analysis.valueBalance * 0.5) : 162 },
    { week: 'W11', before: 158, after: analysis ? 158 + (analysis.valueBalance * 0.5) : 158 },
    { week: 'W12', before: 165, after: analysis ? 165 + (analysis.valueBalance * 0.5) : 165 },
    { week: 'W13', before: 160, after: analysis ? 160 + (analysis.valueBalance * 0.5) : 160 },
    { week: 'W14', before: 168, after: analysis ? 168 + (analysis.valueBalance * 0.5) : 168 },
  ];

  const PlayerCard = ({ player, side }: { player: Player; side: 'give' | 'receive' }) => (
    <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-semibold text-white">{player.name}</p>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="secondary" className="text-xs">{player.position}</Badge>
            <span className="text-xs text-gray-400">{player.team}</span>
            {player.trending === 'up' && <TrendingUp className="h-3 w-3 text-green-500" />}
            {player.trending === 'down' && <TrendingDown className="h-3 w-3 text-red-500" />}
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => removeFromTrade(player.id, side)}
          className="text-red-500 hover:text-red-400"
        >
          ×
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
        <div>
          <p className="text-gray-400">Value</p>
          <p className="font-semibold text-white">{player.value}</p>
        </div>
        <div>
          <p className="text-gray-400">Avg Points</p>
          <p className="font-semibold text-white">{player.recentAvg}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Trade Impact Simulator</h1>
        <p className="text-gray-400 mt-1">AI-powered trade analysis with championship impact</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trade Builder */}
        <div className="lg:col-span-2 space-y-6">
          {/* Trade Package */}
          <Card className="bg-gray-900/50 border-gray-800">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <ArrowLeftRight className="h-5 w-5 text-blue-500" />
                  Trade Package
                </h3>
                <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                  <SelectTrigger className="w-[180px] bg-gray-800 border-gray-700">
                    <SelectValue placeholder="Select team" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="team-1">Manual Managers</SelectItem>
                    <SelectItem value="team-2">Lucky Strikes</SelectItem>
                    <SelectItem value="team-3">Underdog Heroes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Give Side */}
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-3">You Give</h4>
                  <div className="space-y-3">
                    {tradePackage.give.length === 0 ? (
                      <div className="p-8 border-2 border-dashed border-gray-700 rounded-lg text-center">
                        <p className="text-gray-500">Add players to trade</p>
                      </div>
                    ) : (
                      tradePackage.give.map(player => (
                        <PlayerCard key={player.id} player={player} side="give" />
                      ))
                    )}
                  </div>
                </div>

                {/* Receive Side */}
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-3">You Receive</h4>
                  <div className="space-y-3">
                    {tradePackage.receive.length === 0 ? (
                      <div className="p-8 border-2 border-dashed border-gray-700 rounded-lg text-center">
                        <p className="text-gray-500">Add players to receive</p>
                      </div>
                    ) : (
                      tradePackage.receive.map(player => (
                        <PlayerCard key={player.id} player={player} side="receive" />
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Analyze Button */}
              <div className="mt-6 flex justify-center">
                <Button
                  onClick={analyzeTrade}
                  disabled={analyzing || tradePackage.give.length === 0 || tradePackage.receive.length === 0}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  {analyzing ? (
                    <>
                      <Brain className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing Trade...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Analyze Trade Impact
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>

          {/* Player Selection */}
          <Tabs defaultValue="my-team" className="space-y-4">
            <TabsList className="bg-gray-900/50 border border-gray-800">
              <TabsTrigger value="my-team">My Team</TabsTrigger>
              <TabsTrigger value="their-team">Their Team</TabsTrigger>
            </TabsList>

            <TabsContent value="my-team">
              <Card className="bg-gray-900/50 border-gray-800">
                <div className="p-6">
                  <h4 className="text-sm font-medium text-gray-400 mb-4">Select players to trade away</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {myRoster.map(player => (
                      <div
                        key={player.id}
                        className="p-3 bg-gray-800/50 rounded-lg border border-gray-700 cursor-pointer hover:border-blue-600 transition-colors"
                        onClick={() => addToTrade(player, 'give')}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-white">{player.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary" className="text-xs">{player.position}</Badge>
                              <span className="text-xs text-gray-400">{player.team}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-white">{player.recentAvg}</p>
                            <p className="text-xs text-gray-400">avg pts</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="their-team">
              <Card className="bg-gray-900/50 border-gray-800">
                <div className="p-6">
                  <h4 className="text-sm font-medium text-gray-400 mb-4">Select players to receive</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {availablePlayers.map(player => (
                      <div
                        key={player.id}
                        className="p-3 bg-gray-800/50 rounded-lg border border-gray-700 cursor-pointer hover:border-green-600 transition-colors"
                        onClick={() => addToTrade(player, 'receive')}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-white">{player.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary" className="text-xs">{player.position}</Badge>
                              <span className="text-xs text-gray-400">{player.team}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-white">{player.recentAvg}</p>
                            <p className="text-xs text-gray-400">avg pts</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Analysis Panel */}
        <div className="space-y-6">
          {/* Trade Analysis Results */}
          {analysis && (
            <>
              <Card className={`border ${
                analysis.recommendation === 'accept' ? 'bg-green-900/20 border-green-800' :
                analysis.recommendation === 'reject' ? 'bg-red-900/20 border-red-800' :
                'bg-yellow-900/20 border-yellow-800'
              }`}>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">AI Recommendation</h3>
                    {analysis.recommendation === 'accept' && <CheckCircle className="h-6 w-6 text-green-500" />}
                    {analysis.recommendation === 'reject' && <XCircle className="h-6 w-6 text-red-500" />}
                    {analysis.recommendation === 'negotiate' && <AlertTriangle className="h-6 w-6 text-yellow-500" />}
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-2xl font-bold capitalize text-white">{analysis.recommendation}</p>
                      <p className="text-sm text-gray-400">Confidence: {(analysis.confidence * 100).toFixed(0)}%</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-gray-800/50 rounded-lg">
                        <p className="text-xs text-gray-400">Value Balance</p>
                        <p className={`text-lg font-bold ${analysis.valueBalance > 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {analysis.valueBalance > 0 ? '+' : ''}{analysis.valueBalance}
                        </p>
                      </div>
                      <div className="p-3 bg-gray-800/50 rounded-lg">
                        <p className="text-xs text-gray-400">Win % Change</p>
                        <p className={`text-lg font-bold ${analysis.winProbabilityChange > 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {analysis.winProbabilityChange > 0 ? '+' : ''}{analysis.winProbabilityChange.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                    
                    <div className="p-3 bg-gray-800/50 rounded-lg">
                      <p className="text-xs text-gray-400 mb-1">Championship Odds</p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-white">Current: 24%</span>
                        <span className={`text-sm font-bold ${analysis.championshipOddsChange > 0 ? 'text-green-500' : 'text-red-500'}`}>
                          → {(24 + analysis.championshipOddsChange).toFixed(1)}%
                        </span>
                      </div>
                      <Progress 
                        value={24 + analysis.championshipOddsChange} 
                        className="mt-2 h-2"
                      />
                    </div>
                  </div>
                </div>
              </Card>

              {/* Position Impact */}
              <Card className="bg-gray-900/50 border-gray-800">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-purple-500" />
                    Position Impact
                  </h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <RadarChart data={analysis.positionImpact}>
                      <PolarGrid stroke="#374151" />
                      <PolarAngleAxis dataKey="position" stroke="#9ca3af" />
                      <PolarRadiusAxis angle={90} domain={[80, 95]} stroke="#9ca3af" />
                      <Radar name="Before" dataKey="before" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} />
                      <Radar name="After" dataKey="after" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Projection Impact */}
              <Card className="bg-gray-900/50 border-gray-800">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Projected Points Impact</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={projectionData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="week" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                      />
                      <Line type="monotone" dataKey="before" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" />
                      <Line type="monotone" dataKey="after" stroke="#10b981" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </>
          )}

          {/* Quick Stats */}
          {!analysis && (
            <Card className="bg-gray-900/50 border-gray-800">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Trade Tips</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-2">
                    <Target className="h-4 w-4 text-blue-500 mt-0.5" />
                    <p className="text-gray-400">Target players with favorable upcoming schedules</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Trophy className="h-4 w-4 text-purple-500 mt-0.5" />
                    <p className="text-gray-400">Focus on consistency for playoff push</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Users className="h-4 w-4 text-green-500 mt-0.5" />
                    <p className="text-gray-400">Consider team needs, not just player value</p>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}