"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { EnhancedPlayerCard } from "@/components/ui/EnhancedPlayerCard";
import { GamblingFeatureGuard } from "@/components/compliance/ComplianceWrapper";
import { 
  DollarSign, 
  TrendingUp, 
  Trophy, 
  Target,
  Plus,
  Users,
  Clock,
  Zap,
  AlertCircle,
  Lock,
  Star,
  Activity,
  BarChart3,
  Eye,
  Flame,
  Shield,
  Brain
} from "lucide-react";

interface WageringStat {
  label: string;
  value: string;
  change?: string;
  trend?: "up" | "down" | "neutral";
  icon: React.ReactNode;
  color: string;
}

interface ActiveWager {
  id: string;
  title: string;
  opponent: {
    name: string;
    image?: string;
  };
  totalValue: number;
  timeRemaining: string;
  status: "active" | "pending" | "settling";
  currentPosition: "winning" | "losing" | "tied";
  valueChange: number;
}

interface Bounty {
  id: string;
  title: string;
  bountyAmount: number;
  participants: number;
  maxParticipants: number;
  timeRemaining: string;
  targetMetric: {
    type: string;
    target: number;
    description: string;
  };
  currentLeader?: {
    name: string;
    score: number;
  };
}

export function WageringDashboard() {
  const [activeTab, setActiveTab] = useState<"overview" | "wagers" | "bounties">("overview");
  const [userStats, setUserStats] = useState<WageringStat[]>([]);
  const [activeWagers, setActiveWagers] = useState<ActiveWager[]>([]);
  const [activeBounties, setActiveBounties] = useState<Bounty[]>([]);

  useEffect(() => {
    // Mock data - replace with actual API calls
    setUserStats([
      {
        label: "Total Winnings",
        value: "$2,450",
        change: "+12.5%",
        trend: "up",
        icon: <DollarSign className="w-5 h-5" />,
        color: "neon-green"
      },
      {
        label: "Win Rate",
        value: "73%",
        change: "+5%",
        trend: "up",
        icon: <TrendingUp className="w-5 h-5" />,
        color: "neon-blue"
      },
      {
        label: "Active Wagers",
        value: "8",
        icon: <Trophy className="w-5 h-5" />,
        color: "neon-purple"
      },
      {
        label: "Bounties Won",
        value: "23",
        change: "+3",
        trend: "up",
        icon: <Target className="w-5 h-5" />,
        color: "neon-pink"
      }
    ]);

    setActiveWagers([
      {
        id: "1",
        title: "McCaffrey vs Jefferson Performance",
        opponent: { name: "Jake_Fantasy23", image: "/api/placeholder/32/32" },
        totalValue: 500,
        timeRemaining: "2h 15m",
        status: "active",
        currentPosition: "winning",
        valueChange: 45.50
      },
      {
        id: "2", 
        title: "Weekly QB Showdown",
        opponent: { name: "FantasyGuru", image: "/api/placeholder/32/32" },
        totalValue: 200,
        timeRemaining: "1d 8h",
        status: "active",
        currentPosition: "losing",
        valueChange: -12.25
      }
    ]);

    setActiveBounties([
      {
        id: "1",
        title: "Sunday Night 300+ Yard Challenge",
        bountyAmount: 100,
        participants: 8,
        maxParticipants: 10,
        timeRemaining: "3h 45m",
        targetMetric: {
          type: "passing_yards",
          target: 300,
          description: "Any QB to throw for 300+ yards"
        },
        currentLeader: {
          name: "ProBetter_2024",
          score: 287
        }
      }
    ]);
  }, []);

  const getTrendColor = (trend?: string) => {
    switch (trend) {
      case "up": return "text-neon-green";
      case "down": return "text-neon-red";
      default: return "text-gray-400";
    }
  };

  const getPositionColor = (position: string) => {
    switch (position) {
      case "winning": return "text-neon-green";
      case "losing": return "text-neon-red";
      default: return "text-neon-yellow";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-neon-green/20 text-neon-green";
      case "pending": return "bg-neon-yellow/20 text-neon-yellow";
      case "settling": return "bg-neon-purple/20 text-neon-purple";
      default: return "bg-gray-500/20 text-gray-400";
    }
  };

  return (
    <GamblingFeatureGuard feature="WAGERING_ENABLED">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold neon-text">Wagering Hub</h1>
            <p className="text-gray-400 mt-1">Your peer-to-peer fantasy sports marketplace</p>
          </div>
          <div className="flex gap-3">
            <NeonButton 
              variant="blue" 
              onClick={() => {/* Open create wager modal */}}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Wager
            </NeonButton>
            <NeonButton 
              variant="purple"
              onClick={() => {/* Open create bounty modal */}}
              className="flex items-center gap-2"
            >
              <Target className="w-4 h-4" />
              Create Bounty
            </NeonButton>
          </div>
        </div>

      {/* Enhanced Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {userStats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
          >
            <GlassCard className="hover:glow-md transition-all duration-300 relative overflow-hidden">
              {/* Animated Background Gradient */}
              <motion.div
                className={`absolute inset-0 opacity-5 bg-gradient-to-br from-${stat.color} to-transparent`}
                animate={{ 
                  backgroundPosition: ["0% 0%", "100% 100%"],
                }}
                transition={{ duration: 3, repeat: Infinity, repeatType: "reverse" }}
              />
              
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">{stat.label}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className={`text-2xl font-bold text-${stat.color}`}>
                      {stat.value}
                    </p>
                    {stat.change && (
                      <span className={`text-sm ${getTrendColor(stat.trend)}`}>
                        {stat.change}
                      </span>
                    )}
                  </div>
                </div>
                <div className={`text-${stat.color} glow-sm`}>
                  {stat.icon}
                </div>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-900/50 p-1 rounded-lg border border-white/5">
        {[
          { id: "overview", label: "Overview", icon: <Zap className="w-4 h-4" /> },
          { id: "wagers", label: "Active Wagers", icon: <Trophy className="w-4 h-4" /> },
          { id: "bounties", label: "Bounties", icon: <Target className="w-4 h-4" /> }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all duration-200 ${
              activeTab === tab.id
                ? "bg-neon-blue/20 text-neon-blue glow-sm"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <GlassCard>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Clock className="w-5 h-5 text-neon-blue" />
                  Recent Activity
                </h2>
                <NeonButton size="sm">View All</NeonButton>
              </div>
              <div className="space-y-4">
                {[
                  { action: "Won wager", details: "QB Performance Battle", amount: "+$150", time: "2h ago", color: "neon-green" },
                  { action: "Joined bounty", details: "Sunday Night Challenge", amount: "-$50", time: "4h ago", color: "neon-purple" },
                  { action: "Created wager", details: "RB Showdown", amount: "-$200", time: "1d ago", color: "neon-blue" }
                ].map((activity, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
                  >
                    <div>
                      <p className="font-medium">{activity.action}</p>
                      <p className="text-sm text-gray-400">{activity.details}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold text-${activity.color}`}>{activity.amount}</p>
                      <p className="text-xs text-gray-400">{activity.time}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </GlassCard>

            {/* Market Trends */}
            <GlassCard>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-neon-green" />
                  Market Trends
                </h2>
              </div>
              <div className="space-y-4">
                {[
                  { metric: "Average Wager Size", value: "$342", change: "+8%", trend: "up" },
                  { metric: "Most Popular Position", value: "QB", change: "42% of wagers", trend: "neutral" },
                  { metric: "Active Bounties", value: "127", change: "+15%", trend: "up" },
                  { metric: "Win Rate This Week", value: "73%", change: "+5%", trend: "up" }
                ].map((trend, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{trend.metric}</p>
                      <p className="text-sm text-gray-400">{trend.change}</p>
                    </div>
                    <p className={`text-lg font-semibold ${getTrendColor(trend.trend)}`}>
                      {trend.value}
                    </p>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        )}

        {activeTab === "wagers" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Active Wagers</h2>
              <div className="flex gap-2">
                <select className="bg-gray-900/50 border border-white/10 rounded-lg px-3 py-2 text-sm">
                  <option>All Statuses</option>
                  <option>Active</option>
                  <option>Pending</option>
                  <option>Settling</option>
                </select>
              </div>
            </div>

            {activeWagers.map((wager, index) => (
              <motion.div
                key={wager.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <GlassCard className="hover:glow-sm transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-neon-blue to-neon-purple rounded-full flex items-center justify-center">
                        <Trophy className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{wager.title}</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <Users className="w-4 h-4" />
                          vs {wager.opponent.name}
                          <span className="mx-1">•</span>
                          <Clock className="w-4 h-4" />
                          {wager.timeRemaining}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6">
                      <div className="text-right">
                        <p className="text-lg font-semibold">${wager.totalValue}</p>
                        <p className={`text-sm ${wager.valueChange >= 0 ? 'text-neon-green' : 'text-neon-red'}`}>
                          {wager.valueChange >= 0 ? '+' : ''}${wager.valueChange.toFixed(2)}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(wager.status)}`}>
                          {wager.status.charAt(0).toUpperCase() + wager.status.slice(1)}
                        </span>
                        <p className={`text-sm mt-1 ${getPositionColor(wager.currentPosition)}`}>
                          {wager.currentPosition.charAt(0).toUpperCase() + wager.currentPosition.slice(1)}
                        </p>
                      </div>

                      <NeonButton size="sm" variant="blue">
                        View Details
                      </NeonButton>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        )}

        {activeTab === "bounties" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Active Bounties</h2>
              <div className="flex gap-2">
                <select className="bg-gray-900/50 border border-white/10 rounded-lg px-3 py-2 text-sm">
                  <option>All Bounties</option>
                  <option>My Bounties</option>
                  <option>Joined</option>
                  <option>Available</option>
                </select>
              </div>
            </div>

            {activeBounties.map((bounty, index) => (
              <motion.div
                key={bounty.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <GlassCard className="hover:glow-sm transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-neon-purple to-neon-pink rounded-full flex items-center justify-center">
                        <Target className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{bounty.title}</h3>
                        <p className="text-sm text-gray-400">{bounty.targetMetric.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                          <span>{bounty.participants}/{bounty.maxParticipants} participants</span>
                          <span>•</span>
                          <span>Target: {bounty.targetMetric.target} {bounty.targetMetric.type.replace('_', ' ')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6">
                      <div className="text-right">
                        <p className="text-lg font-semibold text-neon-green">${bounty.bountyAmount}</p>
                        <p className="text-sm text-gray-400">Prize Pool</p>
                      </div>

                      {bounty.currentLeader && (
                        <div className="text-right">
                          <p className="font-medium">{bounty.currentLeader.name}</p>
                          <p className="text-sm text-neon-yellow">{bounty.currentLeader.score} pts</p>
                        </div>
                      )}

                      <div className="text-right">
                        <p className="font-medium">{bounty.timeRemaining}</p>
                        <p className="text-sm text-gray-400">remaining</p>
                      </div>

                      <NeonButton size="sm" variant="purple">
                        Join Bounty
                      </NeonButton>
                    </div>
                  </div>

                  {/* Progress bar for bounty */}
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="flex justify-between text-sm mb-2">
                      <span>Participants</span>
                      <span>{bounty.participants}/{bounty.maxParticipants}</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-neon-purple to-neon-pink h-2 rounded-full"
                        style={{ width: `${(bounty.participants / bounty.maxParticipants) * 100}%` }}
                      />
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        )}
      </div>
      </div>
    </GamblingFeatureGuard>
  );
}