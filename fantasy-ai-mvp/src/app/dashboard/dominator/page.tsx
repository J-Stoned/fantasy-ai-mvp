'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Zap,
  Brain,
  Target,
  Users,
  TrendingUp,
  Trophy,
  MessageSquare,
  Activity,
  Settings,
  PlayCircle,
  PauseCircle,
  AlertCircle,
  CheckCircle,
  Clock,
  BarChart3,
  Shield
} from 'lucide-react';

interface DominatorModule {
  id: string;
  name: string;
  description: string;
  icon: any;
  enabled: boolean;
  status: 'active' | 'idle' | 'error';
  stats?: {
    label: string;
    value: string | number;
    trend?: 'up' | 'down' | 'stable';
  }[];
  lastAction?: string;
  nextAction?: string;
}

const dominatorModules: DominatorModule[] = [
  {
    id: 'auto-pilot',
    name: 'Auto-Pilot Mode',
    description: 'Automated lineup optimization with AI',
    icon: Brain,
    enabled: true,
    status: 'active',
    stats: [
      { label: 'Optimizations', value: 24, trend: 'up' },
      { label: 'Win Rate', value: '78%', trend: 'up' },
      { label: 'Avg Score', value: 168.5 }
    ],
    lastAction: 'Optimized lineup 2 hours ago',
    nextAction: 'Next check in 58 minutes'
  },
  {
    id: 'trade-sniper',
    name: 'Trade Sniper',
    description: 'Find win-win trades automatically',
    icon: Target,
    enabled: true,
    status: 'active',
    stats: [
      { label: 'Trades Found', value: 8 },
      { label: 'Accepted', value: 3, trend: 'up' },
      { label: 'Value Gained', value: '+24' }
    ],
    lastAction: 'Proposed trade to Team Alpha',
    nextAction: 'Analyzing Team Beta roster'
  },
  {
    id: 'waiver-bot',
    name: 'Waiver Wire Bot',
    description: '24/7 waiver wire monitoring',
    icon: Users,
    enabled: true,
    status: 'active',
    stats: [
      { label: 'Players Added', value: 12 },
      { label: 'FAAB Spent', value: '$43' },
      { label: 'Success Rate', value: '92%' }
    ],
    lastAction: 'Claimed Jaylen Warren',
    nextAction: 'Monitoring 5 breakout candidates'
  },
  {
    id: 'trash-talk',
    name: 'Trash Talk Generator',
    description: 'AI-powered psychological warfare',
    icon: MessageSquare,
    enabled: false,
    status: 'idle',
    stats: [
      { label: 'Messages Sent', value: 47 },
      { label: 'Wins After', value: '85%' },
      { label: 'Savage Level', value: '9.2' }
    ]
  },
  {
    id: 'trophy-room',
    name: 'Trophy Room',
    description: '3D visualization of achievements',
    icon: Trophy,
    enabled: true,
    status: 'active',
    stats: [
      { label: 'Trophies', value: 23 },
      { label: 'This Season', value: 8, trend: 'up' },
      { label: 'Legendary', value: 3 }
    ]
  }
];

export default function DominatorSuitePage() {
  const [modules, setModules] = useState(dominatorModules);
  const [isRunning, setIsRunning] = useState(true);
  const [aggressiveness, setAggressiveness] = useState<'conservative' | 'balanced' | 'aggressive' | 'maximum'>('balanced');
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    // Simulate activity updates
    const interval = setInterval(() => {
      const activities = [
        { icon: Brain, text: 'Lineup optimized for Week 11', time: 'Just now', type: 'success' },
        { icon: Target, text: 'New trade opportunity found', time: '5 min ago', type: 'info' },
        { icon: Users, text: 'Waiver claim successful: D. Pierce', time: '12 min ago', type: 'success' },
        { icon: TrendingUp, text: 'Win probability increased to 82%', time: '30 min ago', type: 'success' },
        { icon: AlertCircle, text: 'Injury alert: Monitor McCaffrey', time: '1 hour ago', type: 'warning' }
      ];
      
      setRecentActivity(prev => [
        activities[Math.floor(Math.random() * activities.length)],
        ...prev
      ].slice(0, 10));
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const toggleModule = (moduleId: string) => {
    setModules(prev => prev.map(mod => 
      mod.id === moduleId ? { ...mod, enabled: !mod.enabled } : mod
    ));
  };

  const getAggressivenessColor = () => {
    switch (aggressiveness) {
      case 'conservative': return 'text-blue-500';
      case 'balanced': return 'text-green-500';
      case 'aggressive': return 'text-orange-500';
      case 'maximum': return 'text-red-500';
    }
  };

  const activeModulesCount = modules.filter(m => m.enabled).length;
  const totalActions = modules.reduce((sum, m) => sum + (m.stats?.[0]?.value as number || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">League Dominator Suite</h1>
          <p className="text-gray-400 mt-1">AI-powered fantasy domination system</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant={isRunning ? 'default' : 'secondary'} className="text-sm py-1 px-3">
            {isRunning ? (
              <>
                <Activity className="h-3 w-3 mr-1 animate-pulse" />
                Active
              </>
            ) : (
              <>
                <Clock className="h-3 w-3 mr-1" />
                Paused
              </>
            )}
          </Badge>
          <Button
            onClick={() => setIsRunning(!isRunning)}
            variant={isRunning ? 'destructive' : 'default'}
            className={isRunning ? '' : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'}
          >
            {isRunning ? (
              <>
                <PauseCircle className="h-4 w-4 mr-2" />
                Pause Suite
              </>
            ) : (
              <>
                <PlayCircle className="h-4 w-4 mr-2" />
                Start Suite
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-900/20 to-blue-800/20 border-blue-800/50">
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Zap className="h-8 w-8 text-blue-500" />
              <span className="text-2xl font-bold text-white">{activeModulesCount}/5</span>
            </div>
            <p className="text-sm text-gray-400">Active Modules</p>
          </div>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-900/20 to-purple-800/20 border-purple-800/50">
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <BarChart3 className="h-8 w-8 text-purple-500" />
              <span className="text-2xl font-bold text-white">{totalActions}</span>
            </div>
            <p className="text-sm text-gray-400">Total Actions</p>
          </div>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-900/20 to-green-800/20 border-green-800/50">
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="h-8 w-8 text-green-500" />
              <span className="text-2xl font-bold text-white">+18.5%</span>
            </div>
            <p className="text-sm text-gray-400">Win Rate Boost</p>
          </div>
        </Card>
        
        <Card className="bg-gradient-to-br from-orange-900/20 to-orange-800/20 border-orange-800/50">
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Trophy className="h-8 w-8 text-orange-500" />
              <span className="text-2xl font-bold text-white">87%</span>
            </div>
            <p className="text-sm text-gray-400">Championship Odds</p>
          </div>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="modules" className="space-y-6">
        <TabsList className="bg-gray-900/50 border border-gray-800">
          <TabsTrigger value="modules">Modules</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="modules" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {modules.map(module => (
              <Card key={module.id} className="bg-gray-900/50 border-gray-800">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg ${module.enabled ? 'bg-gray-800' : 'bg-gray-900'}`}>
                        <module.icon className={`h-6 w-6 ${module.enabled ? 'text-blue-500' : 'text-gray-600'}`} />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">{module.name}</h3>
                        <p className="text-sm text-gray-400 mt-1">{module.description}</p>
                      </div>
                    </div>
                    <Switch
                      checked={module.enabled}
                      onCheckedChange={() => toggleModule(module.id)}
                    />
                  </div>

                  {module.enabled && (
                    <>
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        {module.stats?.map((stat, index) => (
                          <div key={index} className="text-center">
                            <p className="text-xs text-gray-400">{stat.label}</p>
                            <p className="text-lg font-bold text-white flex items-center justify-center gap-1">
                              {stat.value}
                              {stat.trend === 'up' && <TrendingUp className="h-3 w-3 text-green-500" />}
                              {stat.trend === 'down' && <TrendingUp className="h-3 w-3 text-red-500 rotate-180" />}
                            </p>
                          </div>
                        ))}
                      </div>

                      <div className="space-y-2 pt-4 border-t border-gray-800">
                        {module.lastAction && (
                          <div className="flex items-center gap-2 text-xs">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            <span className="text-gray-400">{module.lastAction}</span>
                          </div>
                        )}
                        {module.nextAction && (
                          <div className="flex items-center gap-2 text-xs">
                            <Clock className="h-3 w-3 text-blue-500" />
                            <span className="text-gray-400">{module.nextAction}</span>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card className="bg-gray-900/50 border-gray-800">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {recentActivity.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No recent activity</p>
                ) : (
                  recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg">
                      <activity.icon className={`h-5 w-5 ${
                        activity.type === 'success' ? 'text-green-500' :
                        activity.type === 'warning' ? 'text-yellow-500' :
                        'text-blue-500'
                      }`} />
                      <div className="flex-1">
                        <p className="text-sm text-white">{activity.text}</p>
                        <p className="text-xs text-gray-400">{activity.time}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card className="bg-gray-900/50 border-gray-800">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-white mb-6">Suite Configuration</h3>
              
              <div className="space-y-6">
                {/* Aggressiveness Setting */}
                <div>
                  <label className="text-sm font-medium text-white mb-2 block">
                    Aggressiveness Level
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {['conservative', 'balanced', 'aggressive', 'maximum'].map((level) => (
                      <Button
                        key={level}
                        variant={aggressiveness === level ? 'default' : 'outline'}
                        onClick={() => setAggressiveness(level as any)}
                        className={`capitalize ${aggressiveness === level ? 'bg-gradient-to-r from-blue-600 to-purple-600' : ''}`}
                      >
                        {level}
                      </Button>
                    ))}
                  </div>
                  <p className={`text-sm mt-2 ${getAggressivenessColor()}`}>
                    {aggressiveness === 'conservative' && 'Safe plays, minimal risk'}
                    {aggressiveness === 'balanced' && 'Optimal risk/reward balance'}
                    {aggressiveness === 'aggressive' && 'High risk, high reward'}
                    {aggressiveness === 'maximum' && 'DOMINATION MODE ACTIVATED'}
                  </p>
                </div>

                {/* Update Intervals */}
                <div>
                  <label className="text-sm font-medium text-white mb-2 block">
                    Update Intervals
                  </label>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Lineup Optimization</span>
                      <select className="bg-gray-800 border-gray-700 rounded px-3 py-1 text-sm">
                        <option>Every 30 minutes</option>
                        <option>Every hour</option>
                        <option>Every 2 hours</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Trade Analysis</span>
                      <select className="bg-gray-800 border-gray-700 rounded px-3 py-1 text-sm">
                        <option>Every hour</option>
                        <option>Every 2 hours</option>
                        <option>Every 4 hours</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Waiver Monitoring</span>
                      <select className="bg-gray-800 border-gray-700 rounded px-3 py-1 text-sm">
                        <option>Real-time</option>
                        <option>Every 5 minutes</option>
                        <option>Every 15 minutes</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Notifications */}
                <div>
                  <label className="text-sm font-medium text-white mb-2 block">
                    Notifications
                  </label>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Email alerts</span>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Push notifications</span>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Voice announcements</span>
                      <Switch />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}