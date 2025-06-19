"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { 
  Activity, 
  Brain, 
  Crown, 
  Globe, 
  Network, 
  Zap,
  BarChart3,
  ArrowRight,
  Rocket,
  Star,
  Trophy
} from "lucide-react";

const dashboards = [
  {
    title: "Main Dashboard",
    description: "Your fantasy sports command center with AI insights and real-time analytics",
    href: "/dashboard",
    icon: Activity,
    color: "neon-blue",
    features: ["Real-time Scoring", "AI Insights", "Lineup Builder"]
  },
  {
    title: "Revolutionary Analytics",
    description: "Multi-modal AI with computer vision, social intelligence, and biometric data",
    href: "/dashboard/analytics",
    icon: Zap,
    color: "neon-purple",
    features: ["340% Faster Processing", "50x More Data Points", "23% Higher Accuracy"]
  },
  {
    title: "AI System Command Center",
    description: "Neural network monitoring with 1375+ AI workers and enterprise-grade performance",
    href: "/dashboard/ai-systems",
    icon: Brain,
    color: "neon-green",
    features: ["1375+ AI Workers", "96.7% Accuracy", "47ms Response Time"]
  },
  {
    title: "MCP Infrastructure",
    description: "Real-time monitoring of 22 Model Context Protocol servers with global distribution",
    href: "/dashboard/mcp", 
    icon: Network,
    color: "neon-cyan",
    features: ["22 MCP Servers", "99.97% Uptime", "15.2K Requests/sec"]
  },
  {
    title: "Multi-Sport Universe",
    description: "Global sports expansion covering Cricket, Soccer, F1, Esports, AFL, Rugby",
    href: "/dashboard/multi-sport",
    icon: Globe,
    color: "neon-orange",
    features: ["6 Sports Active", "47 Countries", "Global Championships"]
  },
  {
    title: "Supreme Admin Command",
    description: "Ultimate administrative control center with unlimited power over the Fantasy.AI empire",
    href: "/admin",
    icon: Crown,
    color: "neon-gold",
    features: ["God Mode", "Empire Control", "Competitive Strike"]
  }
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-900 to-slate-950 relative overflow-hidden">
      {/* Enhanced Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-48 -left-48 w-96 h-96 bg-neon-blue/10 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-48 -right-48 w-96 h-96 bg-neon-purple/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />
        <div className="absolute top-1/3 left-1/3 w-64 h-64 bg-neon-green/8 rounded-full blur-2xl animate-pulse" />
        <div className="absolute bottom-1/3 right-1/3 w-72 h-72 bg-neon-pink/8 rounded-full blur-2xl animate-bounce" style={{ animationDelay: "3s" }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-6">
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16 pt-12"
        >
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-neon-blue to-neon-purple rounded-2xl flex items-center justify-center">
              <Trophy className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-6xl font-bold bg-gradient-to-r from-neon-blue via-neon-purple to-neon-pink bg-clip-text text-transparent">
              Fantasy.AI
            </h1>
          </div>
          
          <p className="text-2xl text-gray-300 mb-4 max-w-4xl mx-auto">
            The World's Most Advanced Fantasy Sports Platform
          </p>
          
          <p className="text-lg text-gray-400 mb-8 max-w-3xl mx-auto">
            🚀 Powered by 22 MCP Servers • 🧠 1375+ AI Workers • 🌍 Global Multi-Sport Coverage • ⚡ 340% Faster Than Competitors
          </p>

          <div className="flex items-center justify-center gap-6 mb-12">
            <div className="flex items-center gap-2 px-4 py-2 bg-neon-green/20 rounded-full border border-neon-green/30">
              <div className="w-2 h-2 bg-neon-green rounded-full animate-pulse" />
              <span className="text-sm text-neon-green font-medium">All Systems Operational</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-neon-blue/20 rounded-full border border-neon-blue/30">
              <Star className="w-4 h-4 text-neon-blue" />
              <span className="text-sm text-neon-blue font-medium">Enterprise Grade</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-neon-purple/20 rounded-full border border-neon-purple/30">
              <Rocket className="w-4 h-4 text-neon-purple" />
              <span className="text-sm text-neon-purple font-medium">Revolutionary AI</span>
            </div>
          </div>
        </motion.div>

        {/* Dashboard Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16"
        >
          {dashboards.map((dashboard, index) => {
            const Icon = dashboard.icon;
            return (
              <motion.div
                key={dashboard.href}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                whileHover={{ scale: 1.02, rotateY: 5 }}
                className="group"
              >
                <Link href={dashboard.href}>
                  <GlassCard className="p-8 h-full hover:bg-white/5 transition-all duration-300 cursor-pointer border border-white/10 hover:border-white/20">
                    <div className={`w-16 h-16 bg-${dashboard.color}/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                      <Icon className={`w-8 h-8 text-${dashboard.color}`} />
                    </div>
                    
                    <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-neon-blue transition-colors">
                      {dashboard.title}
                    </h3>
                    
                    <p className="text-gray-300 mb-6 leading-relaxed">
                      {dashboard.description}
                    </p>
                    
                    <div className="space-y-2 mb-6">
                      {dashboard.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm text-gray-400">
                          <div className={`w-1.5 h-1.5 bg-${dashboard.color} rounded-full`} />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex items-center gap-2 text-neon-blue group-hover:text-neon-purple transition-colors">
                      <span className="font-medium">Explore Dashboard</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </GlassCard>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>

        {/* CTA Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-center"
        >
          <GlassCard className="p-12 bg-gradient-to-br from-neon-blue/20 to-neon-purple/20 border border-neon-blue/30">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Dominate Fantasy Sports?
            </h2>
            <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
              Join the revolution with AI-powered analytics, multi-sport coverage, and enterprise-grade infrastructure 
              that puts you ahead of the competition.
            </p>
            
            <div className="flex items-center justify-center gap-4">
              <Link href="/dashboard">
                <NeonButton variant="blue" size="lg" className="flex items-center gap-2">
                  <Rocket className="w-5 h-5" />
                  Launch Dashboard
                </NeonButton>
              </Link>
              <Link href="/admin">
                <NeonButton variant="purple" size="lg" className="flex items-center gap-2">
                  <Crown className="w-5 h-5" />
                  Admin Access
                </NeonButton>
              </Link>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}