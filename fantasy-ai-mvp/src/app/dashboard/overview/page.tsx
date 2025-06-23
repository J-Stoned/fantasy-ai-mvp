'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  TrendingUp,
  TrendingDown,
  Trophy,
  Users,
  Activity,
  DollarSign,
  Target,
  Zap
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Real-time data simulation
const generateRealtimeData = () => ({
  wins: Math.floor(Math.random() * 3) + 8,
  losses: Math.floor(Math.random() * 2) + 2,
  pointsFor: (Math.random() * 200 + 1300).toFixed(1),
  pointsAgainst: (Math.random() * 150 + 1200).toFixed(1),
  rank: Math.floor(Math.random() * 3) + 1,
  projectedFinish: Math.floor(Math.random() * 2) + 1,
  playoffOdds: (Math.random() * 20 + 75).toFixed(1),
  championshipOdds: (Math.random() * 15 + 20).toFixed(1)
});

const performanceData = [
  { week: 'W1', points: 142, projected: 135 },
  { week: 'W2', points: 156, projected: 145 },
  { week: 'W3', points: 128, projected: 140 },
  { week: 'W4', points: 167, projected: 155 },
  { week: 'W5', points: 174, projected: 160 },
  { week: 'W6', points: 145, projected: 150 },
  { week: 'W7', points: 189, projected: 165 },
  { week: 'W8', points: 192, projected: 170 },
];

const positionStrength = [
  { position: 'QB', value: 85, average: 70 },
  { position: 'RB', value: 92, average: 75 },
  { position: 'WR', value: 88, average: 72 },
  { position: 'TE', value: 78, average: 68 },
  { position: 'K', value: 95, average: 80 },
  { position: 'DEF', value: 82, average: 74 },
];

export default function DashboardOverview() {
  const [realtimeStats, setRealtimeStats] = useState(generateRealtimeData());
  const [liveScore, setLiveScore] = useState({ me: 89, opponent: 76 });

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setRealtimeStats(generateRealtimeData());
      setLiveScore(prev => ({
        me: prev.me + Math.floor(Math.random() * 3),
        opponent: prev.opponent + Math.floor(Math.random() * 2)
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const statCards = [
    {
      title: 'Season Record',
      value: `${realtimeStats.wins}-${realtimeStats.losses}`,
      icon: Trophy,
      trend: 'up',
      change: '+3W streak',
      color: 'text-green-500'
    },
    {
      title: 'League Rank',
      value: `#${realtimeStats.rank}`,
      icon: Users,
      trend: 'up',
      change: 'Top 3',
      color: 'text-blue-500'
    },
    {
      title: 'Points For',
      value: realtimeStats.pointsFor,
      icon: TrendingUp,
      trend: 'up',
      change: '+12.5%',
      color: 'text-purple-500'
    },
    {
      title: 'Playoff Odds',
      value: `${realtimeStats.playoffOdds}%`,
      icon: Target,
      trend: 'up',
      change: '+5.2%',
      color: 'text-orange-500'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Dashboard Overview</h1>
        <p className="text-gray-400 mt-1">Real-time performance metrics and insights</p>
      </div>

      {/* Live Game Score (if active) */}
      <Card className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border-blue-800/50">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Activity className="h-5 w-5 text-red-500 animate-pulse" />
              Live Game - Week 10
            </h3>
            <span className="text-sm text-gray-400">Q3 - 8:42</span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-400">Your Team</p>
              <p className="text-3xl font-bold text-white">{liveScore.me}</p>
              <p className="text-xs text-green-500">+13 projected</p>
            </div>
            <div className="flex items-center justify-center">
              <span className="text-gray-500">vs</span>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-400">Opponent</p>
              <p className="text-3xl font-bold text-white">{liveScore.opponent}</p>
              <p className="text-xs text-red-500">-5 projected</p>
            </div>
          </div>
          <Progress value={65} className="mt-4 h-2" />
          <p className="text-xs text-gray-400 mt-2 text-center">Win Probability: 78%</p>
        </div>
      </Card>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <Card key={index} className="bg-gray-900/50 border-gray-800">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-gray-800 ${stat.color}`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">{stat.title}</p>
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`flex items-center gap-1 ${stat.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                    {stat.trend === 'up' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  </div>
                  <p className="text-xs text-gray-400">{stat.change}</p>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Performance Chart */}
        <Card className="bg-gray-900/50 border-gray-800">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Weekly Performance</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={performanceData}>
                <defs>
                  <linearGradient id="colorPoints" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorProjected" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="week" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                  labelStyle={{ color: '#e5e7eb' }}
                />
                <Area type="monotone" dataKey="points" stroke="#3b82f6" fillOpacity={1} fill="url(#colorPoints)" />
                <Area type="monotone" dataKey="projected" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorProjected)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Position Strength Chart */}
        <Card className="bg-gray-900/50 border-gray-800">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Position Strength Analysis</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={positionStrength}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="position" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                  labelStyle={{ color: '#e5e7eb' }}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                <Bar dataKey="average" fill="#6b7280" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Championship Path */}
      <Card className="bg-gray-900/50 border-gray-800">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Path to Championship</h3>
            <Zap className="h-5 w-5 text-yellow-500" />
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-400">Regular Season Progress</span>
                <span className="text-sm text-white">{realtimeStats.wins}/14 wins</span>
              </div>
              <Progress value={(realtimeStats.wins / 14) * 100} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-400">Playoff Probability</span>
                <span className="text-sm text-white">{realtimeStats.playoffOdds}%</span>
              </div>
              <Progress value={parseFloat(realtimeStats.playoffOdds)} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-400">Championship Odds</span>
                <span className="text-sm text-white">{realtimeStats.championshipOdds}%</span>
              </div>
              <Progress value={parseFloat(realtimeStats.championshipOdds)} className="h-2" />
            </div>
          </div>
        </div>
      </Card>

      {/* Recent Activity Feed */}
      <Card className="bg-gray-900/50 border-gray-800">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {[
              { icon: Trophy, text: 'Won Week 8 matchup (192-156)', time: '2 hours ago', color: 'text-green-500' },
              { icon: Users, text: 'Trade accepted: Acquired Tyreek Hill', time: '5 hours ago', color: 'text-blue-500' },
              { icon: Zap, text: 'Auto-Pilot optimized lineup', time: '1 day ago', color: 'text-purple-500' },
              { icon: DollarSign, text: 'Waiver claim: Added Jaylen Warren ($12)', time: '2 days ago', color: 'text-orange-500' },
            ].map((activity, index) => (
              <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50">
                <activity.icon className={`h-5 w-5 ${activity.color}`} />
                <div className="flex-1">
                  <p className="text-sm text-white">{activity.text}</p>
                  <p className="text-xs text-gray-400">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}