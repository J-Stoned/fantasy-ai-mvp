'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useWebSocket, WebSocketMessage, LiveScore, PlayerUpdate } from '@/lib/websocket-service';
import {
  Activity,
  Bell,
  Wifi,
  WifiOff,
  TrendingUp,
  AlertTriangle,
  Trophy,
  ArrowRightLeft,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Notification {
  id: string;
  type: WebSocketMessage['type'];
  title: string;
  message: string;
  timestamp: string;
  priority: WebSocketMessage['priority'];
  read: boolean;
}

export function RealtimeUpdates() {
  const { isConnected, lastMessage, on, off, subscribe } = useWebSocket();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [liveScores, setLiveScores] = useState<Map<string, LiveScore>>(new Map());
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Subscribe to relevant channels
    subscribe('global');
    subscribe('user:demo-user');
    subscribe('league:demo-league');

    // Event handlers
    const handleScoreUpdate = (score: LiveScore) => {
      setLiveScores(prev => new Map(prev).set(score.gameId, score));
      
      addNotification({
        type: 'score_update',
        title: 'Live Score Update',
        message: `${score.homeTeam} ${score.homeScore} - ${score.awayScore} ${score.awayTeam} (${score.quarter})`,
        priority: 'normal'
      });
    };

    const handlePlayerUpdate = (update: PlayerUpdate) => {
      const priority = update.type === 'injury' ? 'urgent' : 'normal';
      
      addNotification({
        type: update.type === 'injury' ? 'injury_news' : 'score_update',
        title: update.type === 'injury' ? 'Injury Alert' : 'Player Update',
        message: `${update.playerName}: ${update.message}`,
        priority
      });
    };

    const handleTradeAlert = (trade: any) => {
      addNotification({
        type: 'trade_alert',
        title: 'Trade Alert',
        message: `${trade.team1} proposed a trade with ${trade.team2}`,
        priority: 'high'
      });
    };

    const handleAchievement = (achievement: any) => {
      addNotification({
        type: 'achievement',
        title: 'Achievement Unlocked!',
        message: achievement.achievement.name,
        priority: 'normal'
      });
    };

    // Register event listeners
    on('score_update', handleScoreUpdate);
    on('player_update', handlePlayerUpdate);
    on('trade_alert', handleTradeAlert);
    on('achievement_unlocked', handleAchievement);

    // Cleanup
    return () => {
      off('score_update', handleScoreUpdate);
      off('player_update', handlePlayerUpdate);
      off('trade_alert', handleTradeAlert);
      off('achievement_unlocked', handleAchievement);
    };
  }, [on, off, subscribe]);

  useEffect(() => {
    setUnreadCount(notifications.filter(n => !n.read).length);
  }, [notifications]);

  const addNotification = (data: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const notification: Notification = {
      ...data,
      id: `notif-${Date.now()}-${Math.random()}`,
      timestamp: new Date().toISOString(),
      read: false
    };

    setNotifications(prev => [notification, ...prev].slice(0, 50)); // Keep last 50
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const getIcon = (type: WebSocketMessage['type']) => {
    switch (type) {
      case 'score_update': return <Activity className="h-4 w-4" />;
      case 'injury_news': return <AlertTriangle className="h-4 w-4" />;
      case 'trade_alert': return <ArrowRightLeft className="h-4 w-4" />;
      case 'achievement': return <Trophy className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority?: WebSocketMessage['priority']) => {
    switch (priority) {
      case 'urgent': return 'text-red-500';
      case 'high': return 'text-orange-500';
      case 'normal': return 'text-blue-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <>
      {/* Connection Status Bar */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <AnimatePresence>
          {!isConnected && (
            <motion.div
              initial={{ y: -100 }}
              animate={{ y: 0 }}
              exit={{ y: -100 }}
              className="bg-red-900/90 backdrop-blur-sm border-b border-red-800"
            >
              <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <WifiOff className="h-4 w-4 text-red-400" />
                  <span className="text-sm text-red-100">Connection lost. Attempting to reconnect...</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Live Scores Ticker */}
      {liveScores.size > 0 && (
        <Card className="bg-gray-900/50 border-gray-800 mb-4">
          <div className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4 text-red-500 animate-pulse" />
              <span className="text-sm font-semibold text-white">Live Games</span>
            </div>
            <div className="flex gap-4 overflow-x-auto">
              {Array.from(liveScores.values()).map(score => (
                <div key={score.gameId} className="flex-shrink-0 p-2 bg-gray-800/50 rounded-lg">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="text-right">
                      <p className="text-white">{score.homeTeam}</p>
                      <p className="text-2xl font-bold text-white">{score.homeScore}</p>
                    </div>
                    <div className="text-gray-500">vs</div>
                    <div>
                      <p className="text-white">{score.awayTeam}</p>
                      <p className="text-2xl font-bold text-white">{score.awayScore}</p>
                    </div>
                    <div className="ml-2 text-xs text-gray-400">
                      <p>{score.quarter}</p>
                      <p>{score.timeRemaining}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Notification Bell */}
      <div className="fixed bottom-4 right-4 z-40">
        <Button
          onClick={() => setShowNotifications(!showNotifications)}
          className="relative rounded-full h-12 w-12 bg-gray-900 border border-gray-800 hover:bg-gray-800"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold">
              {unreadCount}
            </span>
          )}
        </Button>
        
        {isConnected && (
          <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-gray-900" />
        )}
      </div>

      {/* Notifications Panel */}
      <AnimatePresence>
        {showNotifications && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed bottom-20 right-4 w-96 max-h-[600px] z-40"
          >
            <Card className="bg-gray-900 border-gray-800 shadow-2xl">
              <div className="p-4 border-b border-gray-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-blue-500" />
                    <h3 className="font-semibold text-white">Real-time Updates</h3>
                    {isConnected ? (
                      <Badge variant="secondary" className="bg-green-900/50 text-green-400 text-xs">
                        <Wifi className="h-3 w-3 mr-1" />
                        Live
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-red-900/50 text-red-400 text-xs">
                        <WifiOff className="h-3 w-3 mr-1" />
                        Offline
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowNotifications(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                {notifications.length > 0 && (
                  <div className="flex gap-2 mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={markAllAsRead}
                      className="text-xs"
                    >
                      Mark all read
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearNotifications}
                      className="text-xs"
                    >
                      Clear all
                    </Button>
                  </div>
                )}
              </div>
              
              <ScrollArea className="h-[400px]">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No notifications yet</p>
                  </div>
                ) : (
                  <div className="p-2">
                    {notifications.map(notification => (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        onClick={() => markAsRead(notification.id)}
                        className={`p-3 rounded-lg mb-2 cursor-pointer transition-colors ${
                          notification.read ? 'bg-gray-800/30' : 'bg-gray-800/70 hover:bg-gray-800'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`mt-0.5 ${getPriorityColor(notification.priority)}`}>
                            {getIcon(notification.type)}
                          </div>
                          <div className="flex-1">
                            <p className={`text-sm font-medium ${notification.read ? 'text-gray-400' : 'text-white'}`}>
                              {notification.title}
                            </p>
                            <p className={`text-xs mt-1 ${notification.read ? 'text-gray-500' : 'text-gray-400'}`}>
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-600 mt-1">
                              {new Date(notification.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                          {!notification.read && (
                            <div className="h-2 w-2 bg-blue-500 rounded-full" />
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}