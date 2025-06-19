"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { SafeModeIndicator, ComplianceDashboard } from "@/components/compliance/ComplianceWrapper";
import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard";
import { InteractiveLineupBuilder } from "@/components/ui/InteractiveLineupBuilder";
import { COMPLIANCE } from "@/lib/feature-flags";
import { 
  Trophy, 
  TrendingUp, 
  Users, 
  Brain, 
  Zap, 
  Activity,
  Star,
  AlertCircle,
  Shield,
  CheckCircle,
  Target,
  BarChart3,
  Bot,
  Crown,
  LineChart,
  UserPlus
} from "lucide-react";

export function Dashboard() {
  const isSafeMode = COMPLIANCE.isSafeMode();
  const [activeView, setActiveView] = useState<"overview" | "analytics" | "lineup">("overview");
  
  // Mock data for interactive components
  const mockPlayers = [
    {
      id: "1",
      name: "Josh Allen",
      position: "QB",
      team: "BUF",
      opponent: "MIA",
      projectedPoints: 24.7,
      lastWeekPoints: 28.3,
      seasonAverage: 22.1,
      confidence: 0.91,
      trend: "up" as const,
      matchupRating: "excellent" as const,
      isStarter: true,
      ownership: 99.8
    },
    {
      id: "2", 
      name: "Christian McCaffrey",
      position: "RB",
      team: "SF",
      opponent: "SEA", 
      projectedPoints: 18.9,
      lastWeekPoints: 22.4,
      seasonAverage: 20.2,
      confidence: 0.78,
      trend: "stable" as const,
      matchupRating: "good" as const,
      isStarter: true,
      ownership: 100
    },
    {
      id: "3",
      name: "Tyreek Hill",
      position: "WR",
      team: "MIA", 
      opponent: "BUF",
      projectedPoints: 16.8,
      lastWeekPoints: 19.2,
      seasonAverage: 17.4,
      confidence: 0.85,
      trend: "up" as const,
      matchupRating: "average" as const,
      isStarter: true,
      ownership: 98.7
    }
  ];
  
  return (
    <div className="min-h-screen bg-background cyber-grid p-6">
      {/* Compliance Indicators */}
      <SafeModeIndicator />
      <ComplianceDashboard />
      
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-48 -left-48 w-96 h-96 bg-neon-blue/10 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-48 -right-48 w-96 h-96 bg-neon-purple/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Safe Mode Header */}
        {isSafeMode && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <GlassCard className="p-4 border-2 border-green-500/30 bg-green-900/10">
              <div className="flex items-center gap-3">
                <Shield className="w-6 h-6 text-green-400" />
                <div>
                  <h3 className="text-lg font-bold text-green-400">🛡️ Legal Compliance Mode Active</h3>
                  <p className="text-gray-300 text-sm">All gambling features are safely disabled. Only legal fantasy sports features are available.</p>
                </div>
                <CheckCircle className="w-6 h-6 text-green-400 ml-auto" />
              </div>
            </GlassCard>
          </motion.div>
        )}
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold neon-text mb-2">
                Fantasy.AI Command Center
              </h1>
              <p className="text-gray-400">
                Your AI-powered fantasy sports assistant {isSafeMode ? '• Legal Fantasy Mode' : ''}
              </p>
            </div>
            
            {/* View Toggle */}
            <div className="flex space-x-1 bg-gray-900/50 p-1 rounded-lg border border-white/5">
              {[
                { id: "overview", label: "Overview", icon: <Activity className="w-4 h-4" /> },
                { id: "analytics", label: "Analytics", icon: <LineChart className="w-4 h-4" /> },
                { id: "lineup", label: "Lineup Builder", icon: <UserPlus className="w-4 h-4" /> }
              ].map((view) => (
                <button
                  key={view.id}
                  onClick={() => setActiveView(view.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all duration-200 ${
                    activeView === view.id
                      ? "bg-neon-blue/20 text-neon-blue glow-sm"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {view.icon}
                  {view.label}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <motion.div
          key={activeView}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeView === "overview" && (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <GlassCard delay={0.1}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">League Rank</p>
                <p className="text-2xl font-bold text-neon-green">#2</p>
              </div>
              <Trophy className="w-8 h-8 text-neon-green glow-md" />
            </div>
          </GlassCard>

          <GlassCard delay={0.2}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Win Rate</p>
                <p className="text-2xl font-bold text-neon-blue">78%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-neon-blue glow-md" />
            </div>
          </GlassCard>

          <GlassCard delay={0.3}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">AI Score</p>
                <p className="text-2xl font-bold text-neon-purple">94.2</p>
              </div>
              <Brain className="w-8 h-8 text-neon-purple glow-md" />
            </div>
          </GlassCard>

          <GlassCard delay={0.4}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Active Alerts</p>
                <p className="text-2xl font-bold text-neon-pink">3</p>
              </div>
              <AlertCircle className="w-8 h-8 text-neon-pink glow-md" />
            </div>
          </GlassCard>
        </div>

        {/* Safe Mode Features Showcase */}
        {isSafeMode && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-8"
          >
            <GlassCard className="p-6">
              <h2 className="text-2xl font-bold neon-text mb-6 flex items-center gap-3">
                <Crown className="w-6 h-6 text-neon-yellow" />
                Available Legal Fantasy Features
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* AI Analytics */}
                <div className="flex items-center space-x-3 p-4 bg-neon-green/10 rounded-lg border border-neon-green/30 hover:bg-neon-green/20 transition-colors">
                  <Brain className="w-6 h-6 text-neon-green" />
                  <div>
                    <p className="font-semibold text-neon-green">AI Analytics</p>
                    <p className="text-sm text-gray-400">Advanced player insights & projections</p>
                  </div>
                </div>
                
                {/* Lineup Optimizer */}
                <div className="flex items-center space-x-3 p-4 bg-neon-blue/10 rounded-lg border border-neon-blue/30 hover:bg-neon-blue/20 transition-colors">
                  <Target className="w-6 h-6 text-neon-blue" />
                  <div>
                    <p className="font-semibold text-neon-blue">Lineup Optimizer</p>
                    <p className="text-sm text-gray-400">AI-powered lineup recommendations</p>
                  </div>
                </div>
                
                {/* Premium Analytics */}
                <div className="flex items-center space-x-3 p-4 bg-neon-purple/10 rounded-lg border border-neon-purple/30 hover:bg-neon-purple/20 transition-colors">
                  <BarChart3 className="w-6 h-6 text-neon-purple" />
                  <div>
                    <p className="font-semibold text-neon-purple">Premium Analytics</p>
                    <p className="text-sm text-gray-400">Deep statistical analysis</p>
                  </div>
                </div>
                
                {/* Social Features */}
                <div className="flex items-center space-x-3 p-4 bg-neon-pink/10 rounded-lg border border-neon-pink/30 hover:bg-neon-pink/20 transition-colors">
                  <Users className="w-6 h-6 text-neon-pink" />
                  <div>
                    <p className="font-semibold text-neon-pink">Social Features</p>
                    <p className="text-sm text-gray-400">Connect with fantasy managers</p>
                  </div>
                </div>
                
                {/* AI Voice Assistant */}
                <div className="flex items-center space-x-3 p-4 bg-neon-yellow/10 rounded-lg border border-neon-yellow/30 hover:bg-neon-yellow/20 transition-colors">
                  <Bot className="w-6 h-6 text-neon-yellow" />
                  <div>
                    <p className="font-semibold text-neon-yellow">AI Voice Assistant</p>
                    <p className="text-sm text-gray-400">Voice-powered fantasy coaching</p>
                  </div>
                </div>
                
                {/* Real-time Alerts */}
                <div className="flex items-center space-x-3 p-4 bg-neon-cyan/10 rounded-lg border border-neon-cyan/30 hover:bg-neon-cyan/20 transition-colors">
                  <Zap className="w-6 h-6 text-neon-cyan" />
                  <div>
                    <p className="font-semibold text-neon-cyan">Real-time Alerts</p>
                    <p className="text-sm text-gray-400">Instant injury & news updates</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-5 h-5 text-blue-400" />
                  <h3 className="font-semibold text-blue-400">Why Safe Mode?</h3>
                </div>
                <p className="text-sm text-gray-300">
                  We're ensuring 100% legal compliance while we prepare our gambling licenses. 
                  All features above are completely legal and ready for immediate revenue generation through subscriptions.
                </p>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* AI Insights Panel */}
          <GlassCard className="lg:col-span-2" delay={0.5} glow>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Zap className="w-5 h-5 text-neon-yellow" />
                AI Insights
              </h2>
              <NeonButton size="sm" variant="purple">
                View All
              </NeonButton>
            </div>

            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                className="p-4 bg-neon-blue/5 border border-neon-blue/20 rounded-lg"
              >
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-neon-blue rounded-full mt-1.5 animate-pulse" />
                  <div>
                    <h3 className="font-medium text-neon-blue">Trade Opportunity</h3>
                    <p className="text-sm text-gray-400 mt-1">
                      AI detected undervalued RB with 87% breakout probability in next 3 weeks
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 }}
                className="p-4 bg-neon-purple/5 border border-neon-purple/20 rounded-lg"
              >
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-neon-purple rounded-full mt-1.5 animate-pulse" />
                  <div>
                    <h3 className="font-medium text-neon-purple">Lineup Optimization</h3>
                    <p className="text-sm text-gray-400 mt-1">
                      Swap WR2 for 15% higher expected points based on matchup analysis
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 }}
                className="p-4 bg-neon-green/5 border border-neon-green/20 rounded-lg"
              >
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-neon-green rounded-full mt-1.5 animate-pulse" />
                  <div>
                    <h3 className="font-medium text-neon-green">Injury Alert</h3>
                    <p className="text-sm text-gray-400 mt-1">
                      Your QB showing 28% injury risk - consider backup options
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </GlassCard>

          {/* Quick Actions */}
          <GlassCard delay={0.9}>
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Activity className="w-5 h-5 text-neon-pink" />
              Quick Actions
            </h2>

            <div className="space-y-3">
              <NeonButton variant="blue" className="w-full justify-center">
                Optimize Lineup
              </NeonButton>
              <NeonButton variant="purple" className="w-full justify-center">
                Find Trades
              </NeonButton>
              <NeonButton variant="green" className="w-full justify-center">
                Waiver Wire
              </NeonButton>
              <NeonButton variant="pink" className="w-full justify-center">
                AI Assistant
              </NeonButton>
            </div>

            <div className="mt-6 p-4 bg-gradient-to-br from-neon-blue/10 to-neon-purple/10 rounded-lg border border-white/5">
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-4 h-4 text-neon-yellow" />
                <span className="text-sm font-medium">Pro Tip</span>
              </div>
              <p className="text-xs text-gray-400">
                Enable voice commands to manage your team hands-free with "Hey Fantasy"
              </p>
            </div>
          </GlassCard>
        </div>

              {/* Bottom Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
                className="mt-8"
              >
                <GlassCard>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Users className="w-6 h-6 text-neon-blue" />
                      <div>
                        <h3 className="font-medium">League Activity</h3>
                        <p className="text-sm text-gray-400">3 new trades proposed</p>
                      </div>
                    </div>
                    <NeonButton size="sm">View League</NeonButton>
                  </div>
                </GlassCard>
              </motion.div>
            </>
          )}

          {activeView === "analytics" && (
            <AnalyticsDashboard
              userId="user-123"
              currentWeek={12}
            />
          )}

          {activeView === "lineup" && (
            <InteractiveLineupBuilder
              availablePlayers={mockPlayers}
              onLineupChange={(lineup) => {
                console.log("Lineup updated:", lineup);
              }}
            />
          )}
        </motion.div>
      </div>
    </div>
  );
}