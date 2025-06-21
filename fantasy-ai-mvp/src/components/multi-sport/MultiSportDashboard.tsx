"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
// import { multiSportService, SportConfig, MultiSportPlayer, GameSchedule, SportType } from "@/lib/multi-sport-service";
import {
  Trophy,
  Activity,
  Calendar,
  Users,
  TrendingUp,
  Star,
  Target,
  Zap,
  Clock,
  MapPin,
  Search,
  Filter,
  BarChart3,
  Medal,
  Flame,
  ArrowUp,
  ArrowDown,
  Minus,
  Play,
  AlertCircle,
  CheckCircle
} from "lucide-react";

interface MultiSportDashboardProps {
  userId: string;
}

export function MultiSportDashboard({ userId }: MultiSportDashboardProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-900 to-slate-950 relative overflow-hidden">
      {/* Enhanced Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-48 -left-48 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-48 -right-48 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />
        <div className="absolute top-1/3 left-1/3 w-64 h-64 bg-violet-500/8 rounded-full blur-2xl animate-pulse" />
        <div className="absolute bottom-1/3 right-1/3 w-72 h-72 bg-amber-500/8 rounded-full blur-2xl animate-bounce" style={{ animationDelay: "3s" }} />
      </div>
      
      <div className="relative z-10">
        <MultiSportDashboardContent userId={userId} />
      </div>
    </div>
  );
}

function MultiSportDashboardContent({ userId }: MultiSportDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [selectedSport, setSelectedSport] = useState<string>('cricket');

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  const mockSportConfigs = [
    { id: 'cricket', shortName: 'Cricket', icon: '🏏', region: 'Global', isActive: true },
    { id: 'soccer', shortName: 'Soccer', icon: '⚽', region: 'Global', isActive: true },
    { id: 'f1', shortName: 'Formula 1', icon: '🏎️', region: 'Global', isActive: true },
    { id: 'esports', shortName: 'Esports', icon: '🎮', region: 'Global', isActive: true },
    { id: 'afl', shortName: 'AFL', icon: '🏉', region: 'Australia', isActive: true },
    { id: 'rugby', shortName: 'Rugby', icon: '🏈', region: 'Global', isActive: true }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 bg-gradient-to-r from-orange-500 to-emerald-500 rounded-full mx-auto mb-4 flex items-center justify-center"
          >
            <Trophy className="w-8 h-8 text-white" />
          </motion.div>
          <h2 className="text-2xl font-bold text-white mb-2">Loading Multi-Sport Universe</h2>
          <p className="text-gray-300">Connecting to global sports data...</p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <span className="text-2xl animate-bounce">🏈</span>
            <span className="text-2xl animate-bounce" style={{ animationDelay: "0.1s" }}>🏀</span>
            <span className="text-2xl animate-bounce" style={{ animationDelay: "0.2s" }}>⚽</span>
            <span className="text-2xl animate-bounce" style={{ animationDelay: "0.3s" }}>🏏</span>
            <span className="text-2xl animate-bounce" style={{ animationDelay: "0.4s" }}>🏎️</span>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Enhanced Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-5xl font-bold bg-gradient-to-r from-orange-500 via-emerald-500 to-violet-500 bg-clip-text text-transparent mb-2 animate-pulse">
          Multi-Sport Fantasy Universe
        </h1>
        <p className="text-gray-300 text-lg">
          🌍 Global Sports Expansion • Cricket/Soccer/F1/Esports/AFL/Rugby
        </p>
        <div className="flex items-center justify-center gap-6 mt-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 rounded-full border border-emerald-500/30">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-sm text-emerald-500 font-medium">6 Sports Active</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-orange-500/20 rounded-full border border-orange-500/30">
            <MapPin className="w-4 h-4 text-orange-500" />
            <span className="text-sm text-orange-500 font-medium">47 Countries</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-violet-500/20 rounded-full border border-violet-500/30">
            <Trophy className="w-4 h-4 text-violet-500" />
            <span className="text-sm text-violet-500 font-medium">Global Championships</span>
          </div>
        </div>
      </motion.div>

      {/* Sport Selection Grid */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8"
      >
        {mockSportConfigs.filter(sport => sport.isActive).map((sport, index) => (
          <motion.div
            key={sport.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 * index }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedSport(sport.id)}
            className={`cursor-pointer p-4 rounded-xl border transition-all duration-300 ${
              selectedSport === sport.id
                ? 'bg-neon-blue/20 border-neon-blue/50 shadow-lg shadow-neon-blue/25'
                : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
            }`}
          >
            <div className="text-center">
              <div className="text-3xl mb-2">{sport.icon}</div>
              <h3 className="text-sm font-medium text-white">{sport.shortName}</h3>
              <p className="text-xs text-gray-400 mt-1">{sport.region}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Enhanced Content Area */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <GlassCard className="p-8 bg-gradient-to-br from-white/10 to-white/5 border border-white/20">
          <div className="text-center py-12">
            <Trophy className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-white mb-4">
              Multi-Sport Universe Dashboard
            </h2>
            <p className="text-gray-300 text-lg mb-6">
              Advanced multi-sport analytics coming soon! Currently expanding our global sports coverage to include:
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {[
                { sport: "Cricket", icon: "🏏", status: "Active", color: "emerald" },
                { sport: "Soccer", icon: "⚽", status: "Active", color: "blue" },
                { sport: "Formula 1", icon: "🏎️", status: "Active", color: "red" },
                { sport: "Esports", icon: "🎮", status: "Beta", color: "purple" },
                { sport: "AFL", icon: "🏉", status: "Coming Soon", color: "amber" },
                { sport: "Rugby", icon: "🏈", status: "Coming Soon", color: "green" }
              ].map((item, index) => (
                <motion.div
                  key={item.sport}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + (index * 0.1) }}
                  className="p-4 bg-white/5 rounded-lg border border-white/10"
                >
                  <div className="text-2xl mb-2">{item.icon}</div>
                  <h4 className="font-semibold text-white">{item.sport}</h4>
                  <span className={`text-xs px-2 py-1 rounded-full bg-${item.color}-500/20 text-${item.color}-400`}>
                    {item.status}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}

export default MultiSportDashboard;