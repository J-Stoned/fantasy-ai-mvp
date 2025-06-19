"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
// import { mcpService, MCPServer, MCPMetrics, MCPAlert } from "@/lib/mcp-service";
import {
  Network,
  Activity,
  Cpu,
  Database,
  Globe,
  Zap,
  Shield,
  BarChart3,
  CheckCircle,
  AlertTriangle,
  Clock,
  Users,
  Server,
  Monitor,
  Signal,
  TrendingUp,
  RefreshCw,
  Settings,
  Eye,
  Target,
  Layers,
  Box,
  HardDrive,
  Wifi
} from "lucide-react";

interface MCPSystemDashboardProps {
  userId?: string;
}

export function MCPSystemDashboard({ userId = "demo-user" }: MCPSystemDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, [autoRefresh]);

  const getServerStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'neon-green';
      case 'warning': return 'neon-yellow';
      case 'critical': return 'neon-red';
      case 'maintenance': return 'neon-blue';
      default: return 'neon-gray';
    }
  };

  const getUsageBarColor = (usage: number) => {
    if (usage >= 90) return 'bg-red-400';
    if (usage >= 70) return 'bg-yellow-400';
    return 'bg-neon-green';
  };

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
            className="w-16 h-16 bg-gradient-to-r from-neon-green to-neon-blue rounded-full mx-auto mb-4 flex items-center justify-center"
          >
            <Network className="w-8 h-8 text-white" />
          </motion.div>
          <h2 className="text-2xl font-bold text-white mb-2">Initializing MCP Infrastructure</h2>
          <p className="text-gray-300">Connecting to 22 Model Context Protocol servers...</p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <span className="text-2xl animate-bounce">🌐</span>
            <span className="text-2xl animate-bounce" style={{ animationDelay: "0.1s" }}>⚡</span>
            <span className="text-2xl animate-bounce" style={{ animationDelay: "0.2s" }}>🔧</span>
            <span className="text-2xl animate-bounce" style={{ animationDelay: "0.3s" }}>📊</span>
            <span className="text-2xl animate-bounce" style={{ animationDelay: "0.4s" }}>🚀</span>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-900 to-slate-950 p-6 relative overflow-hidden">
      {/* Enhanced Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-48 -left-48 w-96 h-96 bg-neon-green/10 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-48 -right-48 w-96 h-96 bg-neon-blue/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />
        <div className="absolute top-1/3 left-1/3 w-64 h-64 bg-neon-purple/8 rounded-full blur-2xl animate-pulse" />
        <div className="absolute bottom-1/3 right-1/3 w-72 h-72 bg-neon-cyan/8 rounded-full blur-2xl animate-bounce" style={{ animationDelay: "3s" }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-8">
        {/* Enhanced Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-5xl font-bold bg-gradient-to-r from-neon-green via-neon-blue to-neon-purple bg-clip-text text-transparent mb-2 animate-pulse">
            MCP Infrastructure Dashboard
          </h1>
          <p className="text-gray-300 text-lg mb-4">
            🌐 22 MCP Servers • ⚡ Real-time Monitoring • 🔧 Global Distribution • 📊 Enterprise Performance
          </p>
          <div className="flex items-center justify-center gap-6">
            <div className="flex items-center gap-2 px-4 py-2 bg-neon-green/20 rounded-full border border-neon-green/30">
              <div className="w-2 h-2 bg-neon-green rounded-full animate-pulse" />
              <span className="text-sm text-neon-green font-medium">99.97% Uptime</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-neon-blue/20 rounded-full border border-neon-blue/30">
              <Activity className="w-4 h-4 text-neon-blue" />
              <span className="text-sm text-neon-blue font-medium">15.2K Requests/sec</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-neon-purple/20 rounded-full border border-neon-purple/30">
              <Globe className="w-4 h-4 text-neon-purple" />
              <span className="text-sm text-neon-purple font-medium">Global Distribution</span>
            </div>
          </div>
        </motion.div>

        {/* System Overview Cards */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {[
            {
              title: "Active Servers",
              value: "22/22",
              change: "+0",
              icon: Server,
              color: "neon-green",
              description: "All MCP servers operational"
            },
            {
              title: "Total Requests",
              value: "1.2M",
              change: "+12.3%",
              icon: BarChart3,
              color: "neon-blue",
              description: "Last 24 hours"
            },
            {
              title: "Response Time",
              value: "47ms",
              change: "-8.2%",
              icon: Zap,
              color: "neon-purple",
              description: "Average global latency"
            },
            {
              title: "Success Rate",
              value: "99.97%",
              change: "+0.02%",
              icon: Target,
              color: "neon-cyan",
              description: "Request success rate"
            }
          ].map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + (index * 0.1) }}
                whileHover={{ scale: 1.02 }}
              >
                <GlassCard className="p-6 bg-gradient-to-br from-white/10 to-white/5 border border-white/20 hover:bg-white/15 transition-all duration-300">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 bg-${stat.color}/20 rounded-xl flex items-center justify-center`}>
                      <IconComponent className={`w-6 h-6 text-${stat.color}`} />
                    </div>
                    <div className={`text-xs px-2 py-1 rounded-full bg-${stat.color}/20 text-${stat.color}`}>
                      {stat.change}
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-1">{stat.value}</h3>
                  <p className="text-sm font-medium text-gray-300 mb-1">{stat.title}</p>
                  <p className="text-xs text-gray-400">{stat.description}</p>
                </GlassCard>
              </motion.div>
            );
          })}
        </motion.div>

        {/* MCP Servers Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <GlassCard className="p-8 bg-gradient-to-br from-white/10 to-white/5 border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">MCP Server Infrastructure</h2>
              <div className="flex items-center gap-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all duration-200 ${
                    autoRefresh
                      ? 'bg-neon-green/20 border-neon-green/50 text-neon-green'
                      : 'bg-white/5 border-white/20 text-gray-400 hover:text-white'
                  }`}
                >
                  <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
                  Auto Refresh
                </motion.button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[
                { name: "Filesystem", type: "Core", status: "healthy", usage: 23, requests: "1.2K/s" },
                { name: "GitHub", type: "Integration", status: "healthy", usage: 45, requests: "892/s" },
                { name: "Memory", type: "Core", status: "healthy", usage: 67, requests: "2.1K/s" },
                { name: "PostgreSQL", type: "Database", status: "healthy", usage: 34, requests: "756/s" },
                { name: "MagicUI Design", type: "UI/UX", status: "healthy", usage: 12, requests: "234/s" },
                { name: "Playwright", type: "Testing", status: "healthy", usage: 56, requests: "123/s" },
                { name: "Puppeteer", type: "Automation", status: "healthy", usage: 78, requests: "345/s" },
                { name: "SQLite", type: "Database", status: "healthy", usage: 29, requests: "567/s" },
                { name: "Vercel", type: "Deployment", status: "healthy", usage: 41, requests: "789/s" },
                { name: "Chart Visualization", type: "Analytics", status: "healthy", usage: 33, requests: "456/s" },
                { name: "Firecrawl", type: "Data", status: "healthy", usage: 52, requests: "678/s" },
                { name: "Knowledge Graph", type: "AI", status: "healthy", usage: 61, requests: "890/s" },
                { name: "Sequential Thinking", type: "AI", status: "healthy", usage: 44, requests: "123/s" },
                { name: "Figma Dev", type: "Design", status: "healthy", usage: 18, requests: "234/s" },
                { name: "Azure", type: "Cloud", status: "healthy", usage: 27, requests: "345/s" },
                { name: "Desktop Commander", type: "System", status: "healthy", usage: 15, requests: "456/s" },
                { name: "Kubernetes", type: "Container", status: "healthy", usage: 39, requests: "567/s" },
                { name: "Nx Monorepo", type: "Build", status: "healthy", usage: 22, requests: "678/s" },
                { name: "MCP Installer", type: "Management", status: "healthy", usage: 8, requests: "89/s" },
                { name: "Context7", type: "Context", status: "healthy", usage: 46, requests: "234/s" },
                { name: "MagicUI Components", type: "UI/UX", status: "healthy", usage: 31, requests: "345/s" },
                { name: "Playwright Automation", type: "Testing", status: "healthy", usage: 48, requests: "456/s" }
              ].map((server, index) => (
                <motion.div
                  key={server.name}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + (index * 0.05) }}
                  whileHover={{ scale: 1.02 }}
                  className="p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-all duration-300"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 bg-${getServerStatusColor(server.status)} rounded-full animate-pulse`} />
                      <h3 className="font-semibold text-white text-sm">{server.name}</h3>
                    </div>
                    <span className="text-xs text-gray-400 px-2 py-1 bg-gray-800 rounded">
                      {server.type}
                    </span>
                  </div>
                  
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Usage</span>
                      <span>{server.usage}%</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${getUsageBarColor(server.usage)} transition-all duration-300`}
                        style={{ width: `${server.usage}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Requests</span>
                    <span className="text-neon-blue font-medium">{server.requests}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}

export default MCPSystemDashboard;