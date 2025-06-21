"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import ContestLobby from "@/components/dfs/ContestLobby";
import LineupBuilder from "@/components/dfs/LineupBuilder";
import { 
  Trophy, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Zap,
  Target,
  BarChart3,
  Star,
  ArrowLeft
} from "lucide-react";

type DFSView = 'lobby' | 'builder' | 'contests' | 'leaderboard';

interface DFSStats {
  totalContests: number;
  totalPrizePool: number;
  activeEntries: number;
  winRate: number;
  totalWinnings: number;
  averageScore: number;
}

export default function DFSPage() {
  const [currentView, setCurrentView] = useState<DFSView>('lobby');
  const [selectedContestId, setSelectedContestId] = useState<string | null>(null);
  const [stats, setStats] = useState<DFSStats>({
    totalContests: 247,
    totalPrizePool: 2500000,
    activeEntries: 18,
    winRate: 23.5,
    totalWinnings: 15750,
    averageScore: 142.8
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading stats
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  const handleEnterContest = (contestId: string) => {
    setSelectedContestId(contestId);
    setCurrentView('builder');
  };

  const handleCreateLineup = (contestId: string) => {
    setSelectedContestId(contestId);
    setCurrentView('builder');
  };

  const handleSaveLineup = (lineup: any) => {
    console.log('Saving lineup:', lineup);
    // Implement lineup saving logic
  };

  const handleEnterContestWithLineup = () => {
    console.log('Entering contest with lineup');
    // Implement contest entry logic
    setCurrentView('lobby');
  };

  const handleBackToLobby = () => {
    setCurrentView('lobby');
    setSelectedContestId(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background cyber-grid">
        <div className="max-w-7xl mx-auto p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-12 bg-white/10 rounded-lg" />
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-24 bg-white/5 rounded-lg" />
              ))}
            </div>
            <div className="h-96 bg-white/5 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background cyber-grid">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-48 -left-48 w-96 h-96 bg-neon-purple/10 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-48 -right-48 w-96 h-96 bg-neon-blue/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-neon-green/5 rounded-full blur-3xl animate-float" style={{ animationDelay: "4s" }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              {currentView !== 'lobby' && (
                <NeonButton
                  variant="blue"
                  onClick={handleBackToLobby}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Lobby
                </NeonButton>
              )}
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">
                  Daily Fantasy Sports
                </h1>
                <p className="text-gray-400">
                  Compete in contests for massive cash prizes
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="px-4 py-2 bg-neon-green/20 rounded-full border border-neon-green/30">
                <span className="text-sm text-neon-green font-medium">
                  🏆 Live Contests
                </span>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
            >
              <GlassCard className="p-4 text-center">
                <div className="w-8 h-8 bg-neon-purple/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Trophy className="w-4 h-4 text-neon-purple" />
                </div>
                <div className="text-xl font-bold text-white">
                  {stats.totalContests}
                </div>
                <div className="text-xs text-gray-400">Total Contests</div>
              </GlassCard>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <GlassCard className="p-4 text-center">
                <div className="w-8 h-8 bg-neon-green/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <DollarSign className="w-4 h-4 text-neon-green" />
                </div>
                <div className="text-xl font-bold text-white">
                  ${(stats.totalPrizePool / 1000000).toFixed(1)}M
                </div>
                <div className="text-xs text-gray-400">Prize Pools</div>
              </GlassCard>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              <GlassCard className="p-4 text-center">
                <div className="w-8 h-8 bg-neon-blue/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Users className="w-4 h-4 text-neon-blue" />
                </div>
                <div className="text-xl font-bold text-white">
                  {stats.activeEntries}
                </div>
                <div className="text-xs text-gray-400">Active Entries</div>
              </GlassCard>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
            >
              <GlassCard className="p-4 text-center">
                <div className="w-8 h-8 bg-neon-yellow/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <TrendingUp className="w-4 h-4 text-neon-yellow" />
                </div>
                <div className="text-xl font-bold text-white">
                  {stats.winRate}%
                </div>
                <div className="text-xs text-gray-400">Win Rate</div>
              </GlassCard>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
            >
              <GlassCard className="p-4 text-center">
                <div className="w-8 h-8 bg-neon-green/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Star className="w-4 h-4 text-neon-green" />
                </div>
                <div className="text-xl font-bold text-white">
                  ${stats.totalWinnings.toLocaleString()}
                </div>
                <div className="text-xs text-gray-400">Total Winnings</div>
              </GlassCard>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 }}
            >
              <GlassCard className="p-4 text-center">
                <div className="w-8 h-8 bg-neon-purple/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <BarChart3 className="w-4 h-4 text-neon-purple" />
                </div>
                <div className="text-xl font-bold text-white">
                  {stats.averageScore}
                </div>
                <div className="text-xs text-gray-400">Avg Score</div>
              </GlassCard>
            </motion.div>
          </div>
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <AnimatePresence mode="wait">
            {currentView === 'lobby' && (
              <motion.div
                key="lobby"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <ContestLobby
                  onEnterContest={handleEnterContest}
                  onCreateLineup={handleCreateLineup}
                />
              </motion.div>
            )}

            {currentView === 'builder' && selectedContestId && (
              <motion.div
                key="builder"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <LineupBuilder
                  contestId={selectedContestId}
                  salaryCap={50000}
                  onSaveLineup={handleSaveLineup}
                  onEnterContest={handleEnterContestWithLineup}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="fixed bottom-6 right-6 space-y-3"
        >
          <NeonButton
            variant="purple"
            onClick={() => setCurrentView('lobby')}
            className="flex items-center gap-2 shadow-lg"
          >
            <Trophy className="w-4 h-4" />
            Contests
          </NeonButton>
          
          <NeonButton
            variant="blue"
            onClick={() => handleCreateLineup('contest_1')}
            className="flex items-center gap-2 shadow-lg"
          >
            <Zap className="w-4 h-4" />
            Quick Build
          </NeonButton>
        </motion.div>
      </div>
    </div>
  );
}