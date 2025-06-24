'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, AlertTriangle, TrendingUp, Users, Zap } from 'lucide-react';
import { realtimeService, PlayerUpdate, ScoreUpdate, InjuryUpdate } from '@/lib/websocket/realtime-service';

interface RealtimeStats {
  activeGames: number;
  liveUpdates: number;
  injuryAlerts: number;
  topPerformers: PlayerUpdate[];
}

export function RealtimeDashboard() {
  const [isConnected, setIsConnected] = useState(false);
  const [stats, setStats] = useState<RealtimeStats>({
    activeGames: 0,
    liveUpdates: 0,
    injuryAlerts: 0,
    topPerformers: []
  });
  const [recentUpdates, setRecentUpdates] = useState<any[]>([]);
  const [liveScores, setLiveScores] = useState<ScoreUpdate[]>([]);
  const [injuries, setInjuries] = useState<InjuryUpdate[]>([]);

  useEffect(() => {
    // Connect to WebSocket
    realtimeService.connect();
    
    // Set up event listeners
    realtimeService.on('connected', () => {
      setIsConnected(true);
      console.log('Connected to real-time service');
      
      // Subscribe to channels
      realtimeService.subscribe('global:updates');
      realtimeService.subscribeToUserNotifications('current-user');
      
      // Start mock updates for demo
      realtimeService.startMockUpdates();
    });

    realtimeService.on('disconnected', () => {
      setIsConnected(false);
    });

    realtimeService.on('playerUpdate', (update: PlayerUpdate) => {
      setStats(prev => ({
        ...prev,
        liveUpdates: prev.liveUpdates + 1,
        topPerformers: [...prev.topPerformers.slice(-4), update]
          .sort((a, b) => b.fantasyPoints - a.fantasyPoints)
          .slice(0, 5)
      }));
      
      addRecentUpdate({
        type: 'player',
        data: update,
        timestamp: new Date()
      });
    });

    realtimeService.on('scoreUpdate', (update: ScoreUpdate) => {
      setLiveScores(prev => {
        const existing = prev.findIndex(s => s.gameId === update.gameId);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = update;
          return updated;
        }
        return [...prev, update].slice(-6); // Keep last 6 games
      });
      
      setStats(prev => ({
        ...prev,
        activeGames: new Set([...liveScores.map(s => s.gameId), update.gameId]).size
      }));
    });

    realtimeService.on('injuryUpdate', (update: InjuryUpdate) => {
      setInjuries(prev => [update, ...prev].slice(0, 5));
      setStats(prev => ({
        ...prev,
        injuryAlerts: prev.injuryAlerts + 1
      }));
      
      addRecentUpdate({
        type: 'injury',
        data: update,
        timestamp: new Date()
      });
    });

    return () => {
      realtimeService.disconnect();
      realtimeService.removeAllListeners();
    };
  }, []);

  const addRecentUpdate = (update: any) => {
    setRecentUpdates(prev => [update, ...prev].slice(0, 10));
  };

  return (
    <div className="bg-gray-900 rounded-xl p-6 space-y-6">
      {/* Connection Status */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Activity className="w-6 h-6" />
          Real-Time Updates
        </h2>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
          <span className="text-sm text-gray-400">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800 rounded-lg p-4"
        >
          <div className="flex items-center justify-between">
            <Zap className="w-5 h-5 text-yellow-400" />
            <span className="text-2xl font-bold text-white">{stats.activeGames}</span>
          </div>
          <p className="text-sm text-gray-400 mt-1">Active Games</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-800 rounded-lg p-4"
        >
          <div className="flex items-center justify-between">
            <Activity className="w-5 h-5 text-blue-400" />
            <span className="text-2xl font-bold text-white">{stats.liveUpdates}</span>
          </div>
          <p className="text-sm text-gray-400 mt-1">Live Updates</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-800 rounded-lg p-4"
        >
          <div className="flex items-center justify-between">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <span className="text-2xl font-bold text-white">{stats.injuryAlerts}</span>
          </div>
          <p className="text-sm text-gray-400 mt-1">Injury Alerts</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gray-800 rounded-lg p-4"
        >
          <div className="flex items-center justify-between">
            <TrendingUp className="w-5 h-5 text-green-400" />
            <span className="text-2xl font-bold text-white">{stats.topPerformers.length}</span>
          </div>
          <p className="text-sm text-gray-400 mt-1">Top Performers</p>
        </motion.div>
      </div>

      {/* Live Scores */}
      {liveScores.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">Live Scores</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <AnimatePresence>
              {liveScores.map((score) => (
                <motion.div
                  key={score.gameId}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-gray-800 rounded-lg p-3 flex justify-between items-center"
                >
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium text-white">{score.homeTeam.name}</span>
                      <span className="text-xl font-bold text-white">{score.homeTeam.score}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-400">{score.awayTeam.name}</span>
                      <span className="text-xl font-bold text-gray-400">{score.awayTeam.score}</span>
                    </div>
                  </div>
                  <div className="ml-4 text-right">
                    <p className="text-sm text-gray-400">Q{score.quarter}</p>
                    <p className="text-xs text-gray-500">{score.timeRemaining}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Recent Injuries */}
      {injuries.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            Recent Injuries
          </h3>
          <div className="space-y-2">
            <AnimatePresence>
              {injuries.map((injury, index) => (
                <motion.div
                  key={`${injury.playerId}-${index}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-gray-800 rounded-lg p-3 flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium text-white">Player #{injury.playerId.slice(-3)}</p>
                    <p className="text-sm text-gray-400">{injury.description}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    injury.status === 'out' ? 'bg-red-500/20 text-red-400' :
                    injury.status === 'doubtful' ? 'bg-orange-500/20 text-orange-400' :
                    'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {injury.status.toUpperCase()}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Top Performers */}
      {stats.topPerformers.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            Top Performers
          </h3>
          <div className="space-y-2">
            {stats.topPerformers.map((player, index) => (
              <div
                key={`${player.playerId}-${index}`}
                className="bg-gray-800 rounded-lg p-3 flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-white">Player #{player.playerId.slice(-3)}</p>
                  <p className="text-sm text-gray-400">
                    {player.stats.points || 0} pts, {player.stats.assists || 0} ast, {player.stats.rebounds || 0} reb
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-green-400">{player.fantasyPoints.toFixed(1)}</p>
                  <p className="text-xs text-gray-400">Fantasy Points</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Activity Feed */}
      <div className="border-t border-gray-700 pt-4">
        <h3 className="text-sm font-medium text-gray-400 mb-2">Recent Activity</h3>
        <div className="space-y-1">
          <AnimatePresence>
            {recentUpdates.slice(0, 5).map((update, index) => (
              <motion.div
                key={`update-${index}`}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="text-xs text-gray-500"
              >
                <span className="text-gray-400">
                  {new Date(update.timestamp).toLocaleTimeString()}
                </span>
                {' - '}
                <span className={update.type === 'injury' ? 'text-red-400' : 'text-blue-400'}>
                  {update.type === 'injury' ? 'Injury Alert' : 'Player Update'}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}