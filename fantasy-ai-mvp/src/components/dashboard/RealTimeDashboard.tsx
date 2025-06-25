'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  TrendingUp, 
  Users, 
  Trophy, 
  Zap, 
  AlertCircle,
  Wifi,
  WifiOff,
  Refresh
} from 'lucide-react';
import { toast } from 'sonner';

interface LiveData {
  scores: {
    leagueId: string;
    leagueName: string;
    currentScore: number;
    rank: number;
    totalTeams: number;
    projectedScore: number;
    lastUpdate: string;
  }[];
  activities: {
    id: string;
    type: 'trade' | 'waiver' | 'score_update' | 'achievement' | 'battle';
    message: string;
    timestamp: string;
    important: boolean;
  }[];
  battles: {
    id: string;
    opponent: string;
    status: 'active' | 'completed' | 'pending';
    myScore: number;
    opponentScore: number;
    timeRemaining: string;
  }[];
  achievements: {
    id: string;
    title: string;
    description: string;
    xpReward: number;
    gemsReward: number;
    unlockedAt: string;
  }[];
  stats: {
    totalXP: number;
    currentLevel: number;
    gemsBalance: number;
    weeklyRank: number;
    activeBattles: number;
    winStreak: number;
  };
}

interface RealTimeDashboardProps {
  userId: string;
}

export function RealTimeDashboard({ userId }: RealTimeDashboardProps) {
  const [liveData, setLiveData] = useState<LiveData | null>(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // WebSocket connection
  useEffect(() => {
    let ws: WebSocket | null = null;

    const connectWebSocket = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('WebSocket connected');
        setConnected(true);
        
        // Authenticate and join user channel
        ws?.send(JSON.stringify({
          type: 'authenticate',
          data: { userId }
        }));
        
        // Subscribe to real-time updates
        ws?.send(JSON.stringify({
          type: 'subscribe',
          channels: ['dashboard', 'scores', 'activities', 'battles']
        }));
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          handleWebSocketMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setConnected(false);
        
        // Reconnect after 3 seconds
        setTimeout(connectWebSocket, 3000);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnected(false);
      };
    };

    connectWebSocket();

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [userId]);

  const handleWebSocketMessage = useCallback((message: any) => {
    setLastUpdate(new Date());
    
    switch (message.type) {
      case 'dashboard_update':
        setLiveData(message.data);
        break;
        
      case 'score_update':
        setLiveData(prev => prev ? {
          ...prev,
          scores: prev.scores.map(score => 
            score.leagueId === message.data.leagueId 
              ? { ...score, ...message.data }
              : score
          )
        } : null);
        toast.success(`Score updated: ${message.data.currentScore} points`);
        break;
        
      case 'new_activity':
        setLiveData(prev => prev ? {
          ...prev,
          activities: [message.data, ...prev.activities.slice(0, 19)] // Keep last 20
        } : null);
        
        if (message.data.important) {
          toast.info(message.data.message);
        }
        break;
        
      case 'battle_update':
        setLiveData(prev => prev ? {
          ...prev,
          battles: prev.battles.map(battle =>
            battle.id === message.data.battleId
              ? { ...battle, ...message.data }
              : battle
          )
        } : null);
        break;
        
      case 'achievement_unlocked':
        setLiveData(prev => prev ? {
          ...prev,
          achievements: [message.data, ...prev.achievements],
          stats: {
            ...prev.stats,
            totalXP: prev.stats.totalXP + message.data.xpReward,
            gemsBalance: prev.stats.gemsBalance + message.data.gemsReward
          }
        } : null);
        toast.success(`Achievement unlocked: ${message.data.title}!`);
        break;
    }
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/dashboard/live?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setLiveData(data);
      } else {
        toast.error('Failed to load dashboard data');
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Error loading dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [userId]);

  const refreshData = () => {
    loadDashboardData();
    toast.success('Dashboard refreshed');
  };

  const getConnectionStatus = () => {
    return connected ? (
      <Badge className="bg-green-500">
        <Wifi className="w-3 h-3 mr-1" />
        Live
      </Badge>
    ) : (
      <Badge className="bg-red-500">
        <WifiOff className="w-3 h-3 mr-1" />
        Offline
      </Badge>
    );
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'trade': return <Users className="w-4 h-4 text-blue-500" />;
      case 'waiver': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'score_update': return <Activity className="w-4 h-4 text-orange-500" />;
      case 'achievement': return <Trophy className="w-4 h-4 text-yellow-500" />;
      case 'battle': return <Zap className="w-4 h-4 text-purple-500" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  if (loading && !liveData) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-gray-300 rounded w-1/3"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-4 bg-gray-300 rounded"></div>
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!liveData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-red-500">Dashboard Unavailable</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">Unable to load dashboard data</p>
          <Button onClick={loadDashboardData}>
            <Refresh className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Live Dashboard</h1>
          {lastUpdate && (
            <p className="text-sm text-gray-600">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {getConnectionStatus()}
          <Button variant="outline" size="sm" onClick={refreshData}>
            <Refresh className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {liveData.stats.totalXP.toLocaleString()}
            </div>
            <div className="text-xs text-gray-600">Total XP</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {liveData.stats.currentLevel}
            </div>
            <div className="text-xs text-gray-600">Level</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {liveData.stats.gemsBalance}
            </div>
            <div className="text-xs text-gray-600">Gems</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">
              #{liveData.stats.weeklyRank}
            </div>
            <div className="text-xs text-gray-600">Weekly Rank</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">
              {liveData.stats.activeBattles}
            </div>
            <div className="text-xs text-gray-600">Active Battles</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {liveData.stats.winStreak}
            </div>
            <div className="text-xs text-gray-600">Win Streak</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="scores" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="scores">Live Scores</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
          <TabsTrigger value="battles">Battles</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
        </TabsList>

        <TabsContent value="scores" className="space-y-4">
          {liveData.scores.map((score) => (
            <Card key={score.leagueId}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{score.leagueName}</h3>
                    <p className="text-sm text-gray-600">
                      Rank {score.rank} of {score.totalTeams}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">
                      {score.currentScore.toFixed(1)}
                    </div>
                    <div className="text-sm text-gray-600">
                      Proj: {score.projectedScore.toFixed(1)}
                    </div>
                  </div>
                </div>
                <div className="mt-2">
                  <Progress 
                    value={(score.currentScore / score.projectedScore) * 100} 
                    className="h-2"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Last updated: {formatTimeAgo(score.lastUpdate)}
                </p>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="activities" className="space-y-2">
          {liveData.activities.map((activity) => (
            <Card key={activity.id} className={activity.important ? 'border-orange-200 bg-orange-50' : ''}>
              <CardContent className="p-3">
                <div className="flex items-start gap-3">
                  {getActivityIcon(activity.type)}
                  <div className="flex-1">
                    <p className="text-sm">{activity.message}</p>
                    <p className="text-xs text-gray-500">
                      {formatTimeAgo(activity.timestamp)}
                    </p>
                  </div>
                  {activity.important && (
                    <Badge variant="outline" className="text-orange-600 border-orange-600">
                      Important
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="battles" className="space-y-4">
          {liveData.battles.map((battle) => (
            <Card key={battle.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">vs {battle.opponent}</h3>
                  <Badge variant={
                    battle.status === 'active' ? 'default' :
                    battle.status === 'completed' ? 'secondary' : 'outline'
                  }>
                    {battle.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {battle.myScore.toFixed(1)}
                    </div>
                    <div className="text-xs text-gray-600">You</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-400">VS</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {battle.opponentScore.toFixed(1)}
                    </div>
                    <div className="text-xs text-gray-600">Opponent</div>
                  </div>
                </div>
                {battle.timeRemaining && (
                  <p className="text-sm text-gray-600 text-center mt-2">
                    {battle.timeRemaining} remaining
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="achievements" className="space-y-4">
          {liveData.achievements.map((achievement) => (
            <Card key={achievement.id} className="border-yellow-200 bg-yellow-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Trophy className="w-6 h-6 text-yellow-500 mt-1" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-yellow-800">
                      {achievement.title}
                    </h3>
                    <p className="text-sm text-yellow-700 mb-2">
                      {achievement.description}
                    </p>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Zap className="w-4 h-4 text-purple-500" />
                        <span className="text-sm text-purple-600">
                          +{achievement.xpReward} XP
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-green-600">
                          +{achievement.gemsReward} Gems
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    {formatTimeAgo(achievement.unlockedAt)}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}