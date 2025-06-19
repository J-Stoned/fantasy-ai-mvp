"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import {
  Crown,
  Activity,
  Users,
  TrendingUp,
  Zap,
  Shield,
  BarChart3,
  Settings,
  AlertTriangle,
  CheckCircle,
  Target,
  Globe,
  Cpu,
  Database,
  Network,
  Star,
  Rocket,
  Trophy,
  Brain,
  Eye,
  Heart
} from "lucide-react";

interface AdminDashboardProps {
  userId?: string;
}

export function UltimateAdminDashboard({ userId = "admin-user" }: AdminDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<'overview' | 'systems' | 'analytics' | 'controls'>('overview');

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

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
            className="w-16 h-16 bg-gradient-to-r from-neon-gold to-neon-purple rounded-full mx-auto mb-4 flex items-center justify-center"
          >
            <Crown className="w-8 h-8 text-white" />
          </motion.div>
          <h2 className="text-2xl font-bold text-white mb-2">Initializing Supreme Command</h2>
          <p className="text-gray-300">Loading god-mode administrative controls...</p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <span className="text-2xl animate-bounce">👑</span>
            <span className="text-2xl animate-bounce" style={{ animationDelay: "0.1s" }}>⚡</span>
            <span className="text-2xl animate-bounce" style={{ animationDelay: "0.2s" }}>🌍</span>
            <span className="text-2xl animate-bounce" style={{ animationDelay: "0.3s" }}>🎯</span>
            <span className="text-2xl animate-bounce" style={{ animationDelay: "0.4s" }}>🚀</span>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-950 to-slate-950 text-white p-6">
      {/* Enhanced Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-48 -left-48 w-96 h-96 bg-neon-gold/5 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-48 -right-48 w-96 h-96 bg-neon-purple/5 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-neon-red/5 rounded-full blur-3xl animate-float" style={{ animationDelay: "4s" }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-8">
        {/* Enhanced Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-6xl font-bold bg-gradient-to-r from-neon-gold via-neon-blue to-neon-purple bg-clip-text text-transparent mb-2 animate-pulse">
            Supreme Command Center
          </h1>
          <p className="text-gray-300 text-lg mb-4">
            👑 Ultimate Administrative Control • 🌍 Fantasy.AI Empire Management • ⚡ God Mode Activated
          </p>
          <div className="flex items-center justify-center gap-6">
            <div className="flex items-center gap-2 px-4 py-2 bg-neon-gold/20 rounded-full border border-neon-gold/30">
              <div className="w-2 h-2 bg-neon-gold rounded-full animate-pulse" />
              <span className="text-sm text-neon-gold font-medium">God Mode</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-neon-purple/20 rounded-full border border-neon-purple/30">
              <Globe className="w-4 h-4 text-neon-purple" />
              <span className="text-sm text-neon-purple font-medium">Empire Control</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-neon-red/20 rounded-full border border-neon-red/30">
              <Target className="w-4 h-4 text-neon-red" />
              <span className="text-sm text-neon-red font-medium">Competitive Strike</span>
            </div>
          </div>
        </motion.div>

        {/* Section Navigation */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap justify-center gap-4 mb-8"
        >
          {[
            { id: 'overview', label: 'Supreme Overview', icon: Crown, color: 'neon-gold' },
            { id: 'systems', label: 'System Control', icon: Settings, color: 'neon-blue' },
            { id: 'analytics', label: 'Empire Analytics', icon: BarChart3, color: 'neon-purple' },
            { id: 'controls', label: 'God Mode Controls', icon: Zap, color: 'neon-red' }
          ].map((section) => {
            const IconComponent = section.icon;
            const isActive = activeSection === section.id;
            return (
              <motion.button
                key={section.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveSection(section.id as any)}
                className={`flex items-center gap-3 px-6 py-3 rounded-xl border transition-all duration-300 ${
                  isActive
                    ? `bg-${section.color}/20 border-${section.color}/50 text-${section.color} shadow-lg`
                    : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:border-white/20 hover:text-white'
                }`}
              >
                <IconComponent className="w-5 h-5" />
                <span className="font-medium">{section.label}</span>
              </motion.button>
            );
          })}
        </motion.div>

        {/* Dashboard Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <GlassCard className="p-8 bg-gradient-to-br from-white/10 to-white/5 border border-white/20">
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gradient-to-r from-neon-gold to-neon-purple rounded-2xl mx-auto mb-6 flex items-center justify-center">
                  <Crown className="w-10 h-10 text-white" />
                </div>
                
                <h2 className="text-3xl font-bold text-white mb-4">
                  Supreme Administrative Dashboard
                </h2>
                
                <p className="text-gray-300 text-lg mb-8 max-w-3xl mx-auto">
                  Welcome to the ultimate command center for Fantasy.AI empire management. 
                  Exercise unlimited power over the platform with god-mode administrative controls, 
                  real-time system monitoring, and competitive intelligence operations.
                </p>

                {/* System Status Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto mb-8">
                  {[
                    {
                      title: "System Control",
                      description: "Total platform administration and system management",
                      icon: "⚡",
                      value: "God Mode",
                      color: "gold",
                      status: "active"
                    },
                    {
                      title: "Empire Analytics", 
                      description: "Complete business intelligence and performance metrics",
                      icon: "📊",
                      value: "All Access",
                      color: "blue",
                      status: "monitoring"
                    },
                    {
                      title: "Competitive Strike",
                      description: "Real-time competitor monitoring and strategic analysis",
                      icon: "🎯",
                      value: "Active Ops",
                      color: "red",
                      status: "executing"
                    },
                    {
                      title: "AI Command",
                      description: "Master control over all AI systems and neural networks", 
                      icon: "🧠",
                      value: "Supreme AI",
                      color: "purple",
                      status: "learning"
                    }
                  ].map((feature, index) => (
                    <motion.div
                      key={feature.title}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 + (index * 0.1) }}
                      className="p-6 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-300"
                    >
                      <div className="text-3xl mb-4">{feature.icon}</div>
                      <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                      <p className="text-gray-400 text-sm mb-3">{feature.description}</p>
                      <div className={`inline-block px-3 py-1 rounded-full bg-${feature.color}-500/20 text-${feature.color}-400 text-xs font-medium mb-2`}>
                        {feature.value}
                      </div>
                      <div className={`flex items-center gap-1 text-xs ${
                        feature.status === 'active' ? 'text-green-400' :
                        feature.status === 'monitoring' ? 'text-blue-400' :
                        feature.status === 'executing' ? 'text-red-400' :
                        'text-purple-400'
                      }`}>
                        <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                        <span className="capitalize">{feature.status}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Administrative Controls */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                  {[
                    {
                      title: "Platform Oversight",
                      description: "Monitor all Fantasy.AI platform operations",
                      icon: Eye,
                      color: "blue",
                      actions: ["User Management", "System Health", "Performance Metrics"]
                    },
                    {
                      title: "AI Command Center",
                      description: "Control all AI systems and neural networks",
                      icon: Brain,
                      color: "purple", 
                      actions: ["Model Training", "AI Optimization", "Neural Networks"]
                    },
                    {
                      title: "Competitive Intelligence",
                      description: "Strategic analysis and market positioning",
                      icon: Target,
                      color: "red",
                      actions: ["Market Analysis", "Competitor Tracking", "Strategic Planning"]
                    }
                  ].map((control, index) => {
                    const IconComponent = control.icon;
                    return (
                      <motion.div
                        key={control.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 + (index * 0.1) }}
                        className="p-6 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-300"
                      >
                        <div className={`w-12 h-12 bg-${control.color}-500/20 rounded-xl flex items-center justify-center mb-4`}>
                          <IconComponent className={`w-6 h-6 text-${control.color}-400`} />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">{control.title}</h3>
                        <p className="text-gray-400 text-sm mb-4">{control.description}</p>
                        <div className="space-y-2">
                          {control.actions.map((action, actionIndex) => (
                            <div key={actionIndex} className="flex items-center gap-2 text-xs text-gray-300">
                              <div className={`w-1.5 h-1.5 bg-${control.color}-400 rounded-full`} />
                              <span>{action}</span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                <div className="mt-12">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1.0 }}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-neon-gold/20 to-neon-purple/20 rounded-full border border-neon-gold/30"
                  >
                    <Crown className="w-5 h-5 text-neon-gold" />
                    <span className="text-neon-gold font-medium">
                      Supreme Administrative Authority - Fantasy.AI Empire
                    </span>
                  </motion.div>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default UltimateAdminDashboard;