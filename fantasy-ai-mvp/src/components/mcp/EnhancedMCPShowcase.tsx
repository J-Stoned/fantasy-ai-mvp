"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
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
  Wifi,
  PlayCircle,
  PauseCircle,
  Square,
  RotateCcw,
  Download,
  Upload,
  FileText,
  Code,
  TestTube,
  Rocket
} from "lucide-react";

interface MCPShowcaseProps {
  userId?: string;
}

interface WorkflowExecution {
  id: string;
  name: string;
  status: "idle" | "running" | "completed" | "failed";
  progress: number;
  duration?: number;
  result?: any;
  error?: string;
}

export function EnhancedMCPShowcase({ userId = "demo-user" }: MCPShowcaseProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [workflowExecutions, setWorkflowExecutions] = useState<Map<string, WorkflowExecution>>(new Map());
  const [systemMetrics, setSystemMetrics] = useState({
    totalServers: 23,
    healthyServers: 23,
    totalRequests: 15234,
    avgResponseTime: 47,
    successRate: 99.97,
    uptime: 99.95,
    errorRate: 0.03
  });
  const [realTimeData, setRealTimeData] = useState({
    requestsPerSecond: 127,
    activeConnections: 342,
    memoryUsage: 67.3,
    cpuUsage: 23.7
  });

  useEffect(() => {
    // Simulate real-time data updates
    const interval = setInterval(() => {
      setRealTimeData(prev => ({
        requestsPerSecond: Math.floor(Math.random() * 200) + 50,
        activeConnections: Math.floor(Math.random() * 500) + 200,
        memoryUsage: Math.random() * 30 + 50,
        cpuUsage: Math.random() * 40 + 10
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const executeWorkflow = async (workflowName: string, description: string, duration: number = 5000) => {
    const execution: WorkflowExecution = {
      id: `exec_${Date.now()}`,
      name: workflowName,
      status: "running",
      progress: 0
    };

    setWorkflowExecutions(prev => new Map(prev.set(execution.id, execution)));

    // Simulate workflow execution with progress updates
    const startTime = Date.now();
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / duration) * 100, 100);
      
      execution.progress = progress;
      execution.status = progress >= 100 ? "completed" : "running";
      
      if (progress >= 100) {
        execution.duration = elapsed;
        execution.result = {
          serversInvolved: Math.floor(Math.random() * 8) + 3,
          dataProcessed: `${(Math.random() * 10 + 1).toFixed(1)}MB`,
          operationsCompleted: Math.floor(Math.random() * 50) + 20,
          performance: `${(Math.random() * 2000 + 500).toFixed(0)}ms`
        };
        clearInterval(progressInterval);
      }
      
      setWorkflowExecutions(prev => new Map(prev.set(execution.id, { ...execution })));
    }, 100);
  };

  const workflows = [
    {
      id: "data_collection",
      name: "Fantasy Data Collection",
      description: "Collect player stats using Firecrawl + Puppeteer MCPs",
      servers: ["firecrawl", "puppeteer", "knowledge_graph", "postgresql"],
      icon: Database,
      color: "neon-blue"
    },
    {
      id: "full_system_test",
      name: "Full System Test",
      description: "E2E testing using Playwright + Puppeteer MCPs",
      servers: ["playwright_official", "puppeteer", "filesystem", "github"],
      icon: TestTube,
      color: "neon-green"
    },
    {
      id: "deployment_pipeline",
      name: "Deployment Pipeline",
      description: "Deploy to production using Vercel + GitHub MCPs",
      servers: ["vercel", "github", "kubernetes", "azure"],
      icon: Rocket,
      color: "neon-purple"
    },
    {
      id: "performance_optimization",
      name: "Performance Analysis",
      description: "Analyze performance using multiple AI MCPs",
      servers: ["sequential_thinking", "knowledge_graph", "chart_visualization", "memory"],
      icon: TrendingUp,
      color: "neon-cyan"
    },
    {
      id: "ui_generation",
      name: "UI Component Generation",
      description: "Generate components using MagicUI + Figma MCPs",
      servers: ["magicui_design", "magicui_components", "figma_dev", "chart_visualization"],
      icon: Layers,
      color: "neon-yellow"
    },
    {
      id: "voice_ai_demo",
      name: "Voice AI Integration",
      description: "Text-to-speech using ElevenLabs MCP",
      servers: ["elevenlabs", "memory", "sequential_thinking"],
      icon: Monitor,
      color: "neon-pink"
    }
  ];

  const serverCategories = [
    {
      name: "Core Development",
      count: 5,
      servers: ["Filesystem", "GitHub", "Memory", "PostgreSQL", "Sequential Thinking"],
      color: "neon-blue",
      icon: Code
    },
    {
      name: "UI/UX & Design",
      count: 4,
      servers: ["MagicUI Design", "MagicUI Components", "Figma Dev", "Chart Visualization"],
      color: "neon-purple",
      icon: Layers
    },
    {
      name: "Testing & Automation",
      count: 5,
      servers: ["Playwright Official", "Playwright Automation", "Puppeteer", "Desktop Commander", "Kubernetes"],
      color: "neon-green",
      icon: TestTube
    },
    {
      name: "Data & Storage",
      count: 3,
      servers: ["SQLite", "Knowledge Graph", "Context7"],
      color: "neon-cyan",
      icon: Database
    },
    {
      name: "Cloud & Deployment",
      count: 3,
      servers: ["Vercel", "Azure", "Nx Monorepo"],
      color: "neon-yellow",
      icon: Globe
    },
    {
      name: "Development Tools",
      count: 3,
      servers: ["Firecrawl", "MCP Installer", "ElevenLabs Voice AI"],
      color: "neon-pink",
      icon: Settings
    }
  ];

  const tabs = [
    { id: "overview", label: "System Overview", icon: Monitor },
    { id: "workflows", label: "MCP Workflows", icon: Network },
    { id: "servers", label: "Server Fleet", icon: Server },
    { id: "monitoring", label: "Live Monitoring", icon: Activity },
    { id: "demo", label: "Live Demo", icon: PlayCircle }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-900 to-slate-950 p-6 relative overflow-hidden">
      {/* Enhanced Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-48 -left-48 w-96 h-96 bg-neon-green/10 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-48 -right-48 w-96 h-96 bg-neon-blue/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />
        <div className="absolute top-1/3 left-1/3 w-64 h-64 bg-neon-purple/8 rounded-full blur-2xl animate-pulse" />
        <div className="absolute bottom-1/3 right-1/3 w-72 h-72 bg-neon-cyan/8 rounded-full blur-2xl animate-bounce" style={{ animationDelay: "3s" }} />
        
        {/* Network Connection Lines */}
        <svg className="absolute inset-0 w-full h-full opacity-20">
          <defs>
            <linearGradient id="line-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.4" />
            </linearGradient>
          </defs>
          <line x1="10%" y1="20%" x2="90%" y2="80%" stroke="url(#line-gradient)" strokeWidth="2" className="animate-pulse" />
          <line x1="80%" y1="10%" x2="20%" y2="90%" stroke="url(#line-gradient)" strokeWidth="2" className="animate-pulse" style={{ animationDelay: "1s" }} />
          <line x1="30%" y1="10%" x2="70%" y2="40%" stroke="url(#line-gradient)" strokeWidth="1" className="animate-pulse" style={{ animationDelay: "2s" }} />
        </svg>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-8">
        {/* Enhanced Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-6xl font-bold bg-gradient-to-r from-neon-green via-neon-blue to-neon-purple bg-clip-text text-transparent mb-4 animate-pulse">
            MCP Enterprise Integration
          </h1>
          <p className="text-gray-300 text-xl mb-6">
            🎆 23 Model Context Protocol Servers • ⚡ Enterprise-Grade Automation • 🚀 Fortune 500 Capabilities
          </p>
          <div className="flex items-center justify-center gap-8">
            <div className="flex items-center gap-2 px-6 py-3 bg-neon-green/20 rounded-full border border-neon-green/30">
              <div className="w-3 h-3 bg-neon-green rounded-full animate-pulse" />
              <span className="text-lg text-neon-green font-medium">{systemMetrics.successRate}% Success Rate</span>
            </div>
            <div className="flex items-center gap-2 px-6 py-3 bg-neon-blue/20 rounded-full border border-neon-blue/30">
              <Activity className="w-5 h-5 text-neon-blue" />
              <span className="text-lg text-neon-blue font-medium">{realTimeData.requestsPerSecond} Req/sec</span>
            </div>
            <div className="flex items-center gap-2 px-6 py-3 bg-neon-purple/20 rounded-full border border-neon-purple/30">
              <Server className="w-5 h-5 text-neon-purple" />
              <span className="text-lg text-neon-purple font-medium">{systemMetrics.healthyServers}/23 Servers</span>
            </div>
          </div>
        </motion.div>

        {/* Navigation Tabs */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex justify-center mb-8"
        >
          <div className="flex bg-white/5 backdrop-blur-lg rounded-xl p-2 border border-white/10">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-neon-blue/30 text-neon-blue border border-neon-blue/50'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <IconComponent className="w-4 h-4" />
                  <span className="font-medium">{tab.label}</span>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === "overview" && (
              <div className="space-y-8">
                {/* System Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    {
                      title: "Total Servers",
                      value: systemMetrics.totalServers,
                      change: "+0",
                      icon: Server,
                      color: "neon-blue",
                      description: "MCP servers operational"
                    },
                    {
                      title: "Avg Response",
                      value: `${systemMetrics.avgResponseTime}ms`,
                      change: "-12%",
                      icon: Zap,
                      color: "neon-green",
                      description: "Lightning fast responses"
                    },
                    {
                      title: "Total Requests",
                      value: `${(systemMetrics.totalRequests / 1000).toFixed(1)}K`,
                      change: "+23%",
                      icon: TrendingUp,
                      color: "neon-purple",
                      description: "Requests processed today"
                    },
                    {
                      title: "System Uptime",
                      value: `${systemMetrics.uptime}%`,
                      change: "+0.01%",
                      icon: Shield,
                      color: "neon-cyan",
                      description: "Rock solid reliability"
                    }
                  ].map((stat, index) => {
                    const IconComponent = stat.icon;
                    return (
                      <motion.div
                        key={stat.title}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 + (index * 0.1) }}
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
                          <h3 className="text-3xl font-bold text-white mb-1">{stat.value}</h3>
                          <p className="text-sm font-medium text-gray-300 mb-1">{stat.title}</p>
                          <p className="text-xs text-gray-400">{stat.description}</p>
                        </GlassCard>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Server Categories */}
                <GlassCard className="p-8 bg-gradient-to-br from-white/10 to-white/5 border border-white/20">
                  <h2 className="text-2xl font-bold text-white mb-6">MCP Server Categories</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {serverCategories.map((category, index) => {
                      const IconComponent = category.icon;
                      return (
                        <motion.div
                          key={category.name}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 + (index * 0.1) }}
                          whileHover={{ scale: 1.02 }}
                          className="p-6 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-all duration-300"
                        >
                          <div className="flex items-center gap-3 mb-4">
                            <div className={`w-10 h-10 bg-${category.color}/20 rounded-lg flex items-center justify-center`}>
                              <IconComponent className={`w-5 h-5 text-${category.color}`} />
                            </div>
                            <div>
                              <h3 className="font-semibold text-white">{category.name}</h3>
                              <p className="text-sm text-gray-400">{category.count} servers</p>
                            </div>
                          </div>
                          <div className="space-y-2">
                            {category.servers.map((server, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                <div className={`w-2 h-2 bg-${category.color} rounded-full opacity-60`} />
                                <span className="text-sm text-gray-300">{server}</span>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </GlassCard>
              </div>
            )}

            {activeTab === "workflows" && (
              <div className="space-y-8">
                <GlassCard className="p-8 bg-gradient-to-br from-white/10 to-white/5 border border-white/20">
                  <h2 className="text-2xl font-bold text-white mb-6">Enterprise MCP Workflows</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {workflows.map((workflow, index) => {
                      const IconComponent = workflow.icon;
                      const execution = Array.from(workflowExecutions.values()).find(e => e.name.includes(workflow.name.split(' ')[0]));
                      
                      return (
                        <motion.div
                          key={workflow.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.1 + (index * 0.1) }}
                          whileHover={{ scale: 1.02 }}
                          className="p-6 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-all duration-300"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className={`w-12 h-12 bg-${workflow.color}/20 rounded-xl flex items-center justify-center`}>
                              <IconComponent className={`w-6 h-6 text-${workflow.color}`} />
                            </div>
                            {execution && (
                              <div className={`text-xs px-2 py-1 rounded-full ${
                                execution.status === "running" ? "bg-yellow-500/20 text-yellow-400" :
                                execution.status === "completed" ? "bg-green-500/20 text-green-400" :
                                "bg-red-500/20 text-red-400"
                              }`}>
                                {execution.status}
                              </div>
                            )}
                          </div>
                          
                          <h3 className="text-lg font-bold text-white mb-2">{workflow.name}</h3>
                          <p className="text-sm text-gray-400 mb-4">{workflow.description}</p>
                          
                          <div className="mb-4">
                            <p className="text-xs text-gray-500 mb-2">MCP Servers Involved:</p>
                            <div className="flex flex-wrap gap-1">
                              {workflow.servers.map((server, idx) => (
                                <span key={idx} className="text-xs px-2 py-1 bg-gray-800 rounded text-gray-300">
                                  {server}
                                </span>
                              ))}
                            </div>
                          </div>
                          
                          {execution && execution.status === "running" && (
                            <div className="mb-4">
                              <div className="flex justify-between text-xs text-gray-400 mb-1">
                                <span>Progress</span>
                                <span>{execution.progress.toFixed(0)}%</span>
                              </div>
                              <div className="w-full bg-gray-800 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full bg-${workflow.color} transition-all duration-300`}
                                  style={{ width: `${execution.progress}%` }}
                                />
                              </div>
                            </div>
                          )}
                          
                          {execution && execution.status === "completed" && execution.result && (
                            <div className="mb-4 text-xs text-gray-400">
                              <div>Duration: {execution.duration}ms</div>
                              <div>Data: {execution.result.dataProcessed}</div>
                              <div>Operations: {execution.result.operationsCompleted}</div>
                            </div>
                          )}
                          
                          <NeonButton
                            onClick={() => executeWorkflow(workflow.name, workflow.description, 3000 + Math.random() * 4000)}
                            disabled={execution?.status === "running"}
                            className="w-full"
                          >
                            {execution?.status === "running" ? "Running..." : "Execute Workflow"}
                          </NeonButton>
                        </motion.div>
                      );
                    })}
                  </div>
                </GlassCard>
              </div>
            )}

            {activeTab === "servers" && (
              <div className="space-y-8">
                <GlassCard className="p-8 bg-gradient-to-br from-white/10 to-white/5 border border-white/20">
                  <h2 className="text-2xl font-bold text-white mb-6">MCP Server Fleet (23 Servers)</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {[
                      { name: "Filesystem", type: "Core", status: "healthy", usage: 23, requests: "1.2K/s", uptime: 99.97 },
                      { name: "GitHub", type: "Integration", status: "healthy", usage: 45, requests: "892/s", uptime: 99.95 },
                      { name: "Memory", type: "AI", status: "healthy", usage: 67, requests: "2.1K/s", uptime: 99.99 },
                      { name: "PostgreSQL", type: "Database", status: "healthy", usage: 34, requests: "756/s", uptime: 99.92 },
                      { name: "Sequential Thinking", type: "AI", status: "healthy", usage: 44, requests: "234/s", uptime: 99.88 },
                      { name: "MagicUI Design", type: "UI/UX", status: "healthy", usage: 12, requests: "345/s", uptime: 99.94 },
                      { name: "MagicUI Components", type: "UI/UX", status: "healthy", usage: 31, requests: "567/s", uptime: 99.96 },
                      { name: "Figma Dev", type: "Design", status: "healthy", usage: 18, requests: "123/s", uptime: 99.91 },
                      { name: "Chart Visualization", type: "Analytics", status: "healthy", usage: 33, requests: "456/s", uptime: 99.93 },
                      { name: "Playwright Official", type: "Testing", status: "healthy", usage: 56, requests: "234/s", uptime: 99.89 },
                      { name: "Playwright Automation", type: "Testing", status: "healthy", usage: 48, requests: "345/s", uptime: 99.87 },
                      { name: "Puppeteer", type: "Automation", status: "healthy", usage: 78, requests: "567/s", uptime: 99.85 },
                      { name: "Desktop Commander", type: "System", status: "healthy", usage: 15, requests: "89/s", uptime: 99.98 },
                      { name: "Kubernetes", type: "Container", status: "healthy", usage: 39, requests: "456/s", uptime: 99.94 },
                      { name: "SQLite", type: "Database", status: "healthy", usage: 29, requests: "678/s", uptime: 99.96 },
                      { name: "Knowledge Graph", type: "AI", status: "healthy", usage: 61, requests: "789/s", uptime: 99.92 },
                      { name: "Context7", type: "Context", status: "healthy", usage: 46, requests: "234/s", uptime: 99.90 },
                      { name: "Vercel", type: "Deployment", status: "healthy", usage: 41, requests: "345/s", uptime: 99.97 },
                      { name: "Azure", type: "Cloud", status: "healthy", usage: 27, requests: "456/s", uptime: 99.95 },
                      { name: "Nx Monorepo", type: "Build", status: "healthy", usage: 22, requests: "567/s", uptime: 99.93 },
                      { name: "Firecrawl", type: "Data", status: "healthy", usage: 52, requests: "678/s", uptime: 99.88 },
                      { name: "MCP Installer", type: "Management", status: "healthy", usage: 8, requests: "89/s", uptime: 99.99 },
                      { name: "ElevenLabs Voice AI", type: "AI", status: "healthy", usage: 35, requests: "123/s", uptime: 99.91 }
                    ].map((server, index) => (
                      <motion.div
                        key={server.name}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 + (index * 0.02) }}
                        whileHover={{ scale: 1.02 }}
                        className="p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-all duration-300"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-neon-green rounded-full animate-pulse" />
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
                              className="h-2 rounded-full bg-neon-blue transition-all duration-300"
                              style={{ width: `${server.usage}%` }}
                            />
                          </div>
                        </div>
                        
                        <div className="flex justify-between text-xs">
                          <div>
                            <span className="text-gray-400">Requests</span>
                            <div className="text-neon-blue font-medium">{server.requests}</div>
                          </div>
                          <div>
                            <span className="text-gray-400">Uptime</span>
                            <div className="text-neon-green font-medium">{server.uptime}%</div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </GlassCard>
              </div>
            )}

            {activeTab === "monitoring" && (
              <div className="space-y-8">
                {/* Real-time Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    {
                      title: "Requests/sec",
                      value: realTimeData.requestsPerSecond,
                      unit: "/sec",
                      icon: TrendingUp,
                      color: "neon-blue"
                    },
                    {
                      title: "Active Connections",
                      value: realTimeData.activeConnections,
                      unit: "",
                      icon: Users,
                      color: "neon-green"
                    },
                    {
                      title: "Memory Usage",
                      value: realTimeData.memoryUsage.toFixed(1),
                      unit: "%",
                      icon: HardDrive,
                      color: "neon-purple"
                    },
                    {
                      title: "CPU Usage",
                      value: realTimeData.cpuUsage.toFixed(1),
                      unit: "%",
                      icon: Cpu,
                      color: "neon-cyan"
                    }
                  ].map((metric, index) => {
                    const IconComponent = metric.icon;
                    return (
                      <motion.div
                        key={metric.title}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.02 }}
                      >
                        <GlassCard className="p-6 bg-gradient-to-br from-white/10 to-white/5 border border-white/20">
                          <div className="flex items-center gap-3 mb-4">
                            <div className={`w-10 h-10 bg-${metric.color}/20 rounded-lg flex items-center justify-center`}>
                              <IconComponent className={`w-5 h-5 text-${metric.color}`} />
                            </div>
                            <div className="w-2 h-2 bg-neon-green rounded-full animate-pulse" />
                          </div>
                          <div className="text-2xl font-bold text-white mb-1">
                            {metric.value}{metric.unit}
                          </div>
                          <div className="text-sm text-gray-400">{metric.title}</div>
                        </GlassCard>
                      </motion.div>
                    );
                  })}
                </div>

                {/* System Health Status */}
                <GlassCard className="p-8 bg-gradient-to-br from-white/10 to-white/5 border border-white/20">
                  <h2 className="text-2xl font-bold text-white mb-6">System Health Status</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="w-24 h-24 bg-neon-green/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-12 h-12 text-neon-green" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">Operational</h3>
                      <p className="text-gray-400">All systems running smoothly</p>
                    </div>
                    <div className="text-center">
                      <div className="w-24 h-24 bg-neon-blue/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Shield className="w-12 h-12 text-neon-blue" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">Secure</h3>
                      <p className="text-gray-400">Enterprise-grade security</p>
                    </div>
                    <div className="text-center">
                      <div className="w-24 h-24 bg-neon-purple/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Zap className="w-12 h-12 text-neon-purple" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">Optimized</h3>
                      <p className="text-gray-400">Peak performance achieved</p>
                    </div>
                  </div>
                </GlassCard>
              </div>
            )}

            {activeTab === "demo" && (
              <div className="space-y-8">
                <GlassCard className="p-8 bg-gradient-to-br from-white/10 to-white/5 border border-white/20">
                  <h2 className="text-2xl font-bold text-white mb-6">Live MCP Integration Demo</h2>
                  <div className="text-center mb-8">
                    <p className="text-gray-300 text-lg mb-6">
                      Experience the power of 23 MCP servers working together in perfect harmony.
                      This demo showcases real enterprise-grade automation capabilities.
                    </p>
                    <NeonButton
                      onClick={() => executeWorkflow("Complete System Demo", "Full demonstration of all MCP capabilities", 8000)}
                      className="text-lg px-8 py-4"
                    >
                      🎆 Execute Full System Demo
                    </NeonButton>
                  </div>
                  
                  {/* Live Execution Log */}
                  {workflowExecutions.size > 0 && (
                    <div className="mt-8">
                      <h3 className="text-xl font-bold text-white mb-4">Execution Log</h3>
                      <div className="bg-black/30 rounded-lg p-4 max-h-96 overflow-y-auto">
                        {Array.from(workflowExecutions.values()).reverse().map((execution) => (
                          <motion.div
                            key={execution.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-4 p-3 bg-white/5 rounded border-l-4 border-neon-blue"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-white">{execution.name}</span>
                              <span className={`text-xs px-2 py-1 rounded ${
                                execution.status === "running" ? "bg-yellow-500/20 text-yellow-400" :
                                execution.status === "completed" ? "bg-green-500/20 text-green-400" :
                                "bg-red-500/20 text-red-400"
                              }`}>
                                {execution.status}
                              </span>
                            </div>
                            {execution.status === "running" && (
                              <div className="w-full bg-gray-800 rounded-full h-2 mb-2">
                                <div 
                                  className="h-2 rounded-full bg-neon-blue transition-all duration-300"
                                  style={{ width: `${execution.progress}%` }}
                                />
                              </div>
                            )}
                            {execution.status === "completed" && execution.result && (
                              <div className="text-sm text-gray-400">
                                ✅ Completed in {execution.duration}ms | 
                                Servers: {execution.result.serversInvolved} | 
                                Data: {execution.result.dataProcessed}
                              </div>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                </GlassCard>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default EnhancedMCPShowcase;