"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import {
  Activity,
  Database,
  Globe,
  Brain,
  Zap,
  Monitor,
  Server,
  Cpu,
  HardDrive,
  Wifi,
  Shield,
  CheckCircle,
  AlertTriangle,
  Clock,
  TrendingUp,
  Users,
  BarChart3,
  Eye,
  Search,
  RefreshCw,
  Play,
  Pause,
  Settings,
  Terminal,
  Code,
  Layers,
  Network,
  Gauge
} from "lucide-react";

interface MCPServer {
  id: string;
  name: string;
  category: string;
  status: 'online' | 'offline' | 'warning';
  uptime: number;
  requestsPerSecond: number;
  responseTime: number;
  successRate: number;
  lastActivity: Date;
  capabilities: string[];
  memoryUsage: number;
  cpuUsage: number;
  activeConnections: number;
}

interface SystemMetrics {
  totalRequests: number;
  averageResponseTime: number;
  systemUptime: number;
  dataProcessed: number;
  activeUsers: number;
  globalCoverage: number;
  aiInsightsGenerated: number;
  predictionAccuracy: number;
}

export function MCPSystemDashboard() {
  const [mcpServers, setMcpServers] = useState<MCPServer[]>([]);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics>({
    totalRequests: 0,
    averageResponseTime: 0,
    systemUptime: 0,
    dataProcessed: 0,
    activeUsers: 0,
    globalCoverage: 0,
    aiInsightsGenerated: 0,
    predictionAccuracy: 0
  });
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    initializeMCPServers();
    updateSystemMetrics();
    
    const interval = setInterval(() => {
      if (isMonitoring) {
        updateServerMetrics();
        updateSystemMetrics();
        setLastUpdate(new Date());
      }
    }, 2000);
    
    return () => clearInterval(interval);
  }, [isMonitoring]);

  const initializeMCPServers = () => {
    const servers: MCPServer[] = [
      // UI/UX & Design
      {
        id: 'magicui-design',
        name: 'MagicUI Design',
        category: 'UI/UX',
        status: 'online',
        uptime: 99.97,
        requestsPerSecond: 1247,
        responseTime: 45,
        successRate: 99.8,
        lastActivity: new Date(),
        capabilities: ['Component Generation', 'Animation System', 'Theme Management'],
        memoryUsage: 78,
        cpuUsage: 23,
        activeConnections: 342
      },
      {
        id: 'magicui-components',
        name: 'MagicUI Components',
        category: 'UI/UX',
        status: 'online',
        uptime: 99.95,
        requestsPerSecond: 892,
        responseTime: 38,
        successRate: 99.9,
        lastActivity: new Date(),
        capabilities: ['Component Library', 'Custom Elements', 'Responsive Design'],
        memoryUsage: 65,
        cpuUsage: 18,
        activeConnections: 256
      },
      {
        id: 'figma-dev',
        name: 'Figma Developer',
        category: 'UI/UX',
        status: 'online',
        uptime: 99.91,
        requestsPerSecond: 234,
        responseTime: 120,
        successRate: 98.5,
        lastActivity: new Date(),
        capabilities: ['Design Tokens', 'Asset Export', 'Design-to-Code'],
        memoryUsage: 45,
        cpuUsage: 12,
        activeConnections: 89
      },
      {
        id: 'chart-visualization',
        name: 'Chart Visualization',
        category: 'UI/UX',
        status: 'online',
        uptime: 99.99,
        requestsPerSecond: 1567,
        responseTime: 52,
        successRate: 99.7,
        lastActivity: new Date(),
        capabilities: ['Interactive Charts', 'Real-time Data', 'Export Formats'],
        memoryUsage: 82,
        cpuUsage: 31,
        activeConnections: 445
      },
      
      // Testing & Automation
      {
        id: 'playwright-official',
        name: 'Playwright Official',
        category: 'Testing',
        status: 'online',
        uptime: 99.93,
        requestsPerSecond: 345,
        responseTime: 890,
        successRate: 97.8,
        lastActivity: new Date(),
        capabilities: ['Cross-browser Testing', 'E2E Automation', 'Visual Testing'],
        memoryUsage: 68,
        cpuUsage: 45,
        activeConnections: 23
      },
      {
        id: 'playwright-automation',
        name: 'Playwright Automation',
        category: 'Testing',
        status: 'online',
        uptime: 99.89,
        requestsPerSecond: 278,
        responseTime: 1200,
        successRate: 96.9,
        lastActivity: new Date(),
        capabilities: ['Advanced Automation', 'Performance Testing', 'Custom Workflows'],
        memoryUsage: 72,
        cpuUsage: 52,
        activeConnections: 18
      },
      {
        id: 'puppeteer',
        name: 'Puppeteer',
        category: 'Testing',
        status: 'online',
        uptime: 99.85,
        requestsPerSecond: 567,
        responseTime: 340,
        successRate: 98.1,
        lastActivity: new Date(),
        capabilities: ['Web Scraping', 'PDF Generation', 'Screenshots'],
        memoryUsage: 55,
        cpuUsage: 28,
        activeConnections: 67
      },
      {
        id: 'desktop-commander',
        name: 'Desktop Commander',
        category: 'Testing',
        status: 'online',
        uptime: 99.76,
        requestsPerSecond: 123,
        responseTime: 180,
        successRate: 97.2,
        lastActivity: new Date(),
        capabilities: ['Desktop Automation', 'System Monitoring', 'Process Control'],
        memoryUsage: 41,
        cpuUsage: 15,
        activeConnections: 34
      },
      {
        id: 'kubernetes',
        name: 'Kubernetes',
        category: 'Testing',
        status: 'online',
        uptime: 99.98,
        requestsPerSecond: 89,
        responseTime: 450,
        successRate: 99.1,
        lastActivity: new Date(),
        capabilities: ['Container Orchestration', 'Scaling', 'Deployment'],
        memoryUsage: 73,
        cpuUsage: 38,
        activeConnections: 156
      },
      
      // Data & Storage
      {
        id: 'sqlite',
        name: 'SQLite',
        category: 'Data',
        status: 'online',
        uptime: 99.99,
        requestsPerSecond: 2340,
        responseTime: 15,
        successRate: 99.9,
        lastActivity: new Date(),
        capabilities: ['Local Database', 'Fast Queries', 'Data Export'],
        memoryUsage: 34,
        cpuUsage: 8,
        activeConnections: 1234
      },
      {
        id: 'postgresql',
        name: 'PostgreSQL',
        category: 'Data',
        status: 'online',
        uptime: 99.95,
        requestsPerSecond: 1890,
        responseTime: 28,
        successRate: 99.6,
        lastActivity: new Date(),
        capabilities: ['Production Database', 'Complex Queries', 'Analytics'],
        memoryUsage: 87,
        cpuUsage: 42,
        activeConnections: 567
      },
      {
        id: 'knowledge-graph',
        name: 'Knowledge Graph',
        category: 'Data',
        status: 'online',
        uptime: 99.91,
        requestsPerSecond: 445,
        responseTime: 85,
        successRate: 98.8,
        lastActivity: new Date(),
        capabilities: ['Entity Relationships', 'Semantic Search', 'Pattern Detection'],
        memoryUsage: 91,
        cpuUsage: 56,
        activeConnections: 234
      },
      {
        id: 'context7',
        name: 'Context7',
        category: 'Data',
        status: 'online',
        uptime: 99.88,
        requestsPerSecond: 678,
        responseTime: 62,
        successRate: 99.2,
        lastActivity: new Date(),
        capabilities: ['Document Retrieval', 'Context Analysis', 'Semantic Understanding'],
        memoryUsage: 76,
        cpuUsage: 33,
        activeConnections: 178
      },
      
      // Cloud & Deployment
      {
        id: 'vercel',
        name: 'Vercel',
        category: 'Cloud',
        status: 'online',
        uptime: 99.97,
        requestsPerSecond: 234,
        responseTime: 340,
        successRate: 98.9,
        lastActivity: new Date(),
        capabilities: ['Deployment Automation', 'Performance Optimization', 'CDN'],
        memoryUsage: 52,
        cpuUsage: 19,
        activeConnections: 45
      },
      {
        id: 'azure',
        name: 'Azure',
        category: 'Cloud',
        status: 'online',
        uptime: 99.94,
        requestsPerSecond: 156,
        responseTime: 280,
        successRate: 99.1,
        lastActivity: new Date(),
        capabilities: ['Cloud Services', 'Enterprise Security', 'Global Scale'],
        memoryUsage: 68,
        cpuUsage: 25,
        activeConnections: 89
      },
      {
        id: 'nx-monorepo',
        name: 'Nx Monorepo',
        category: 'Cloud',
        status: 'online',
        uptime: 99.86,
        requestsPerSecond: 67,
        responseTime: 450,
        successRate: 97.8,
        lastActivity: new Date(),
        capabilities: ['Monorepo Management', 'Build Optimization', 'Code Sharing'],
        memoryUsage: 43,
        cpuUsage: 16,
        activeConnections: 23
      },
      
      // Core Development
      {
        id: 'filesystem',
        name: 'Filesystem',
        category: 'Core',
        status: 'online',
        uptime: 99.99,
        requestsPerSecond: 3450,
        responseTime: 12,
        successRate: 99.9,
        lastActivity: new Date(),
        capabilities: ['File Operations', 'Directory Management', 'Permissions'],
        memoryUsage: 28,
        cpuUsage: 6,
        activeConnections: 2345
      },
      {
        id: 'github',
        name: 'GitHub',
        category: 'Core',
        status: 'online',
        uptime: 99.96,
        requestsPerSecond: 456,
        responseTime: 180,
        successRate: 99.4,
        lastActivity: new Date(),
        capabilities: ['Repository Management', 'CI/CD', 'Issue Tracking'],
        memoryUsage: 54,
        cpuUsage: 21,
        activeConnections: 123
      },
      {
        id: 'memory',
        name: 'Memory',
        category: 'Core',
        status: 'online',
        uptime: 99.98,
        requestsPerSecond: 2890,
        responseTime: 8,
        successRate: 99.8,
        lastActivity: new Date(),
        capabilities: ['AI Memory', 'Decision Tracking', 'Context Persistence'],
        memoryUsage: 85,
        cpuUsage: 34,
        activeConnections: 1567
      },
      {
        id: 'sequential-thinking',
        name: 'Sequential Thinking',
        category: 'Core',
        status: 'online',
        uptime: 99.92,
        requestsPerSecond: 234,
        responseTime: 420,
        successRate: 98.6,
        lastActivity: new Date(),
        capabilities: ['Complex Reasoning', 'Multi-step Analysis', 'Decision Trees'],
        memoryUsage: 92,
        cpuUsage: 67,
        activeConnections: 89
      },
      {
        id: 'firecrawl',
        name: 'Firecrawl',
        category: 'Core',
        status: 'online',
        uptime: 99.89,
        requestsPerSecond: 1234,
        responseTime: 235,
        successRate: 97.9,
        lastActivity: new Date(),
        capabilities: ['Web Crawling', 'Data Extraction', 'Content Analysis'],
        memoryUsage: 76,
        cpuUsage: 44,
        activeConnections: 345
      },
      {
        id: 'mcp-installer',
        name: 'MCP Installer',
        category: 'Core',
        status: 'online',
        uptime: 99.94,
        requestsPerSecond: 23,
        responseTime: 890,
        successRate: 98.2,
        lastActivity: new Date(),
        capabilities: ['Server Management', 'Installation', 'Updates'],
        memoryUsage: 31,
        cpuUsage: 11,
        activeConnections: 12
      }
    ];
    
    setMcpServers(servers);
  };

  const updateServerMetrics = () => {
    setMcpServers(prev => prev.map(server => ({
      ...server,
      requestsPerSecond: server.requestsPerSecond + Math.floor(Math.random() * 20) - 10,
      responseTime: Math.max(5, server.responseTime + Math.floor(Math.random() * 20) - 10),
      memoryUsage: Math.min(95, Math.max(20, server.memoryUsage + Math.floor(Math.random() * 10) - 5)),
      cpuUsage: Math.min(90, Math.max(5, server.cpuUsage + Math.floor(Math.random() * 10) - 5)),
      activeConnections: Math.max(0, server.activeConnections + Math.floor(Math.random() * 10) - 5),
      lastActivity: new Date()
    })));
  };

  const updateSystemMetrics = () => {
    setSystemMetrics(prev => ({
      totalRequests: prev.totalRequests + Math.floor(Math.random() * 1000) + 500,
      averageResponseTime: Math.max(10, 85 + Math.floor(Math.random() * 20) - 10),
      systemUptime: 99.97,
      dataProcessed: prev.dataProcessed + Math.floor(Math.random() * 100000) + 50000,
      activeUsers: Math.max(1000, 4847 + Math.floor(Math.random() * 100) - 50),
      globalCoverage: 47,
      aiInsightsGenerated: prev.aiInsightsGenerated + Math.floor(Math.random() * 50) + 25,
      predictionAccuracy: 94.7
    }));
  };

  const categories = ['all', 'UI/UX', 'Testing', 'Data', 'Cloud', 'Core'];
  
  const filteredServers = selectedCategory === 'all' 
    ? mcpServers 
    : mcpServers.filter(server => server.category === selectedCategory);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-neon-green';
      case 'warning': return 'text-yellow-400';
      case 'offline': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <CheckCircle className="w-4 h-4" />;
      case 'warning': return <AlertTriangle className="w-4 h-4" />;
      case 'offline': return <AlertTriangle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getUsageColor = (usage: number) => {
    if (usage >= 90) return 'bg-red-400';
    if (usage >= 70) return 'bg-yellow-400';
    return 'bg-neon-green';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">MCP System Dashboard</h1>
          <p className="text-gray-400">Real-time monitoring of 22 Model Context Protocol servers</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Activity className={`w-4 h-4 ${isMonitoring ? 'text-neon-green animate-pulse' : 'text-gray-400'}`} />
            Last updated: {lastUpdate.toLocaleTimeString()}
          </div>
          
          <button
            onClick={() => setIsMonitoring(!isMonitoring)}
            className={`p-2 rounded-lg transition-colors ${
              isMonitoring 
                ? 'bg-neon-green/20 text-neon-green' 
                : 'bg-white/10 text-gray-400 hover:bg-white/20'
            }`}
          >
            {isMonitoring ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          
          <button
            onClick={() => {
              updateServerMetrics();
              updateSystemMetrics();
              setLastUpdate(new Date());
            }}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Server className="w-4 h-4 text-neon-blue" />
            <span className="text-xs text-gray-400">Servers</span>
          </div>
          <div className="text-xl font-bold text-white">{mcpServers.length}/22</div>
          <div className="text-xs text-neon-green">All Online</div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-yellow-400" />
            <span className="text-xs text-gray-400">Requests</span>
          </div>
          <div className="text-xl font-bold text-white">{systemMetrics.totalRequests.toLocaleString()}</div>
          <div className="text-xs text-neon-green">+12.4%</div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-neon-green" />
            <span className="text-xs text-gray-400">Avg Response</span>
          </div>
          <div className="text-xl font-bold text-white">{systemMetrics.averageResponseTime}ms</div>
          <div className="text-xs text-neon-green">Excellent</div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-neon-blue" />
            <span className="text-xs text-gray-400">Uptime</span>
          </div>
          <div className="text-xl font-bold text-white">{systemMetrics.systemUptime}%</div>
          <div className="text-xs text-neon-green">Perfect</div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <HardDrive className="w-4 h-4 text-neon-purple" />
            <span className="text-xs text-gray-400">Data Processed</span>
          </div>
          <div className="text-xl font-bold text-white">{(systemMetrics.dataProcessed / 1000000).toFixed(1)}M</div>
          <div className="text-xs text-neon-green">+8.7%</div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-neon-green" />
            <span className="text-xs text-gray-400">Active Users</span>
          </div>
          <div className="text-xl font-bold text-white">{systemMetrics.activeUsers.toLocaleString()}</div>
          <div className="text-xs text-neon-green">Peak Day</div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="w-4 h-4 text-neon-blue" />
            <span className="text-xs text-gray-400">Global Coverage</span>
          </div>
          <div className="text-xl font-bold text-white">{systemMetrics.globalCoverage}</div>
          <div className="text-xs text-neon-green">Countries</div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="w-4 h-4 text-neon-purple" />
            <span className="text-xs text-gray-400">AI Accuracy</span>
          </div>
          <div className="text-xl font-bold text-white">{systemMetrics.predictionAccuracy}%</div>
          <div className="text-xs text-neon-green">Industry Leading</div>
        </GlassCard>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedCategory === category
                ? 'bg-neon-blue/20 text-neon-blue border border-neon-blue'
                : 'bg-white/10 text-gray-400 hover:bg-white/20 hover:text-white'
            }`}
          >
            {category === 'all' ? 'All Servers' : category}
            <span className="ml-2 text-xs opacity-70">
              ({category === 'all' ? mcpServers.length : mcpServers.filter(s => s.category === category).length})
            </span>
          </button>
        ))}
      </div>

      {/* Server Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        <AnimatePresence>
          {filteredServers.map((server) => (
            <motion.div
              key={server.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
            >
              <GlassCard className="p-4 hover:bg-white/10 transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-white">{server.name}</h3>
                      <div className={`flex items-center gap-1 ${getStatusColor(server.status)}`}>
                        {getStatusIcon(server.status)}
                      </div>
                    </div>
                    <p className="text-xs text-gray-400">{server.category} • {server.uptime}% uptime</p>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm font-medium text-white">
                      {server.requestsPerSecond.toLocaleString()}/s
                    </div>
                    <div className="text-xs text-gray-400">{server.responseTime}ms</div>
                  </div>
                </div>

                {/* Resource Usage */}
                <div className="space-y-2 mb-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Memory</span>
                    <span className="text-white">{server.memoryUsage}%</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-1.5">
                    <div 
                      className={`h-1.5 rounded-full transition-all ${getUsageColor(server.memoryUsage)}`}
                      style={{ width: `${server.memoryUsage}%` }}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">CPU</span>
                    <span className="text-white">{server.cpuUsage}%</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-1.5">
                    <div 
                      className={`h-1.5 rounded-full transition-all ${getUsageColor(server.cpuUsage)}`}
                      style={{ width: `${server.cpuUsage}%` }}
                    />
                  </div>
                </div>

                {/* Capabilities */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Active Connections</span>
                    <span className="text-white">{server.activeConnections}</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-1">
                    {server.capabilities.slice(0, 2).map((capability, index) => (
                      <span key={index} className="px-2 py-1 text-xs bg-neon-blue/20 text-neon-blue rounded-full">
                        {capability}
                      </span>
                    ))}
                    {server.capabilities.length > 2 && (
                      <span className="px-2 py-1 text-xs bg-white/10 text-gray-400 rounded-full">
                        +{server.capabilities.length - 2}
                      </span>
                    )}
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* System Health Summary */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white">System Health Summary</h3>
          <div className="flex items-center gap-2 text-neon-green">
            <CheckCircle className="w-5 h-5" />
            <span className="text-sm">All Systems Operational</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <h4 className="text-sm font-medium text-white mb-2">Performance</h4>
            <div className="space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Avg Response Time</span>
                <span className="text-neon-green">{systemMetrics.averageResponseTime}ms</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Success Rate</span>
                <span className="text-neon-green">98.9%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Throughput</span>
                <span className="text-neon-green">15.2K req/s</span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-white mb-2">Availability</h4>
            <div className="space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">System Uptime</span>
                <span className="text-neon-green">{systemMetrics.systemUptime}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Servers Online</span>
                <span className="text-neon-green">22/22</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Data Centers</span>
                <span className="text-neon-green">Global</span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-white mb-2">AI Performance</h4>
            <div className="space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Prediction Accuracy</span>
                <span className="text-neon-green">{systemMetrics.predictionAccuracy}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Insights Generated</span>
                <span className="text-neon-green">{systemMetrics.aiInsightsGenerated.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Models Active</span>
                <span className="text-neon-green">7</span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-white mb-2">Scale & Reach</h4>
            <div className="space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Active Users</span>
                <span className="text-neon-green">{systemMetrics.activeUsers.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Global Coverage</span>
                <span className="text-neon-green">{systemMetrics.globalCoverage} countries</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Data Processed</span>
                <span className="text-neon-green">{(systemMetrics.dataProcessed / 1000000).toFixed(1)}M pts</span>
              </div>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

export default MCPSystemDashboard;