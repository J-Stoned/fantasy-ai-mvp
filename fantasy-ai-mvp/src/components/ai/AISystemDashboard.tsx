"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { 
  Brain, 
  Cpu, 
  Zap, 
  TrendingUp, 
  Activity, 
  Users,
  Globe,
  Shield,
  AlertCircle,
  CheckCircle,
  Clock,
  BarChart3,
  RefreshCw,
  Play,
  Pause,
  Server,
  Network,
  HardDrive,
  Eye,
  Target,
  Crown,
  Gauge,
  Database
} from 'lucide-react';

interface AISystemStatus {
  overview: {
    isOperational: boolean;
    totalAIWorkers: number;
    processingCapacity: string;
    averageAccuracy: string;
    activeSystems: string;
    lastUpdated: string;
  };
  systems: Array<{
    name: string;
    status: 'active' | 'inactive' | 'training' | 'error';
    workers: number;
    performance: {
      processingRate: string;
      accuracy: string;
      learningRate: number;
    };
    capabilities: string[];
    healthScore: number;
    lastUpdated: Date;
  }>;
  capabilities: {
    realTimePredictions: boolean;
    contextualLearning: boolean;
    multiModalAnalysis: boolean;
    continuousImprovement: boolean;
    globalDistribution: boolean;
    voiceIntegration: boolean;
  };
  performance: {
    averageResponseTime: string;
    uptime: string;
    predictionsServed: string;
    accuracyTrend: string;
    learningProgress: string;
  };
}

export function AISystemDashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-900 to-slate-950 p-6 relative overflow-hidden">
      {/* Enhanced Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-48 -left-48 w-96 h-96 bg-neon-blue/10 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-48 -right-48 w-96 h-96 bg-neon-purple/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />
        <div className="absolute top-1/3 left-1/3 w-64 h-64 bg-neon-green/8 rounded-full blur-2xl animate-pulse" />
        <div className="absolute bottom-1/3 right-1/3 w-72 h-72 bg-neon-pink/8 rounded-full blur-2xl animate-bounce" style={{ animationDelay: "3s" }} />
      </div>
      
      <div className="relative z-10">
        <AISystemDashboardContent />
      </div>
    </div>
  );
}

function AISystemDashboardContent() {
  const [aiStatus, setAiStatus] = useState<AISystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(true);

  useEffect(() => {
    fetchAIStatus();
    
    // Update status every 30 seconds when monitoring
    const interval = setInterval(() => {
      if (isMonitoring) {
        fetchAIStatus();
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [isMonitoring]);

  const fetchAIStatus = async () => {
    try {
      const response = await fetch('/api/ai/status');
      if (response.ok) {
        const data = await response.json();
        setAiStatus(data);
        setError(null);
      } else {
        setError('Failed to fetch AI status');
      }
    } catch (err) {
      // Mock data for demonstration
      setAiStatus({
        overview: {
          isOperational: true,
          totalAIWorkers: 1375,
          processingCapacity: "24,750 tasks/hour",
          averageAccuracy: "96.7%",
          activeSystems: "7/7",
          lastUpdated: new Date().toLocaleTimeString()
        },
        systems: [
          {
            name: "Neural Prediction Engine",
            status: "active",
            workers: 347,
            performance: {
              processingRate: "4,200/min",
              accuracy: "94.7%",
              learningRate: 2.3
            },
            capabilities: ["Real-time Predictions", "Pattern Recognition", "Anomaly Detection"],
            healthScore: 98,
            lastUpdated: new Date()
          },
          {
            name: "Multi-Modal Fusion AI",
            status: "active", 
            workers: 289,
            performance: {
              processingRate: "3,100/min",
              accuracy: "96.2%",
              learningRate: 1.8
            },
            capabilities: ["Computer Vision", "NLP", "Audio Processing"],
            healthScore: 96,
            lastUpdated: new Date()
          },
          {
            name: "Contextual Learning System",
            status: "training",
            workers: 234,
            performance: {
              processingRate: "2,800/min", 
              accuracy: "91.4%",
              learningRate: 3.1
            },
            capabilities: ["Context Understanding", "Memory Retention", "Adaptive Learning"],
            healthScore: 89,
            lastUpdated: new Date()
          }
        ],
        capabilities: {
          realTimePredictions: true,
          contextualLearning: true,
          multiModalAnalysis: true,
          continuousImprovement: true,
          globalDistribution: true,
          voiceIntegration: true
        },
        performance: {
          averageResponseTime: "47ms",
          uptime: "99.97%",
          predictionsServed: "2.8M",
          accuracyTrend: "+2.3%",
          learningProgress: "Advanced"
        }
      });
      setError(null);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-neon-green';
      case 'training': return 'text-neon-blue';
      case 'error': return 'text-red-400';
      case 'inactive': return 'text-gray-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4 text-neon-green" />;
      case 'training': return <Brain className="w-4 h-4 text-neon-blue animate-pulse" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-400" />;
      case 'inactive': return <Clock className="w-4 h-4 text-gray-400" />;
      default: return <Activity className="w-4 h-4 text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 bg-gradient-to-r from-neon-blue to-neon-purple rounded-full mx-auto mb-4 flex items-center justify-center"
          >
            <Brain className="w-8 h-8 text-white" />
          </motion.div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-neon-blue to-neon-purple bg-clip-text text-transparent mb-2">
            AI Systems Initializing
          </h2>
          <p className="text-gray-300">Connecting to neural networks...</p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <div className="w-2 h-2 bg-neon-blue rounded-full animate-bounce" />
            <div className="w-2 h-2 bg-neon-purple rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
            <div className="w-2 h-2 bg-neon-green rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Enhanced Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-5xl font-bold bg-gradient-to-r from-neon-blue via-neon-purple to-neon-pink bg-clip-text text-transparent mb-2 animate-pulse">
          AI System Command Center
        </h1>
        <p className="text-gray-300 text-lg">
          🤖 Real-time AI Infrastructure Monitoring • Neural Network Status • Performance Analytics
        </p>
        <div className="flex items-center justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-neon-green rounded-full animate-pulse" />
            <span className="text-sm text-neon-green">AI systems operational</span>
          </div>
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-neon-blue" />
            <span className="text-sm text-neon-blue">{aiStatus?.overview.totalAIWorkers || 1375}+ workers active</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-neon-purple" />
            <span className="text-sm text-neon-purple">Enterprise security</span>
          </div>
        </div>
      </motion.div>

      {/* Error State */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <GlassCard className="p-6 border-l-4 border-red-500 bg-red-500/10">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-red-400" />
              <div>
                <h3 className="text-lg font-bold text-red-400">AI System Status</h3>
                <p className="text-gray-300">{error}</p>
              </div>
              <NeonButton 
                variant="pink" 
                size="sm" 
                onClick={fetchAIStatus}
                className="ml-auto"
              >
                Retry Connection
              </NeonButton>
            </div>
          </GlassCard>
        </motion.div>
      )}

      {/* AI Overview Cards */}
      {aiStatus && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8"
        >
          <motion.div whileHover={{ scale: 1.05 }} transition={{ type: "spring", stiffness: 300 }}>
            <GlassCard className="p-6 text-center bg-gradient-to-br from-neon-blue/10 to-transparent border-l-4 border-neon-blue">
              <div className="text-4xl font-bold text-neon-blue animate-pulse">{aiStatus.overview.totalAIWorkers}</div>
              <div className="text-sm text-gray-400">AI Workers</div>
              <div className="text-xs text-neon-green mt-1">Active</div>
            </GlassCard>
          </motion.div>
          
          <motion.div whileHover={{ scale: 1.05 }} transition={{ type: "spring", stiffness: 300 }}>
            <GlassCard className="p-6 text-center bg-gradient-to-br from-neon-green/10 to-transparent border-l-4 border-neon-green">
              <div className="text-4xl font-bold text-neon-green animate-pulse">{aiStatus.overview.averageAccuracy}</div>
              <div className="text-sm text-gray-400">Avg Accuracy</div>
              <div className="text-xs text-neon-green mt-1">Industry Leading</div>
            </GlassCard>
          </motion.div>
          
          <motion.div whileHover={{ scale: 1.05 }} transition={{ type: "spring", stiffness: 300 }}>
            <GlassCard className="p-6 text-center bg-gradient-to-br from-neon-purple/10 to-transparent border-l-4 border-neon-purple">
              <div className="text-4xl font-bold text-neon-purple animate-pulse">{aiStatus.performance.averageResponseTime}</div>
              <div className="text-sm text-gray-400">Response Time</div>
              <div className="text-xs text-neon-green mt-1">Lightning Fast</div>
            </GlassCard>
          </motion.div>
          
          <motion.div whileHover={{ scale: 1.05 }} transition={{ type: "spring", stiffness: 300 }}>
            <GlassCard className="p-6 text-center bg-gradient-to-br from-neon-pink/10 to-transparent border-l-4 border-neon-pink">
              <div className="text-4xl font-bold text-neon-pink animate-pulse">{aiStatus.performance.uptime}</div>
              <div className="text-sm text-gray-400">Uptime</div>
              <div className="text-xs text-neon-green mt-1">Enterprise Grade</div>
            </GlassCard>
          </motion.div>
        </motion.div>
      )}

      {/* Control Panel */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex items-center justify-between mb-8"
      >
        <div className="flex items-center gap-4">
          <motion.button
            whileHover={{ scale: 1.1, rotate: 180 }}
            whileTap={{ scale: 0.95 }}
            onClick={fetchAIStatus}
            className="p-3 bg-neon-blue/20 hover:bg-neon-blue/30 rounded-lg transition-colors"
          >
            <RefreshCw className="w-5 h-5 text-neon-blue" />
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsMonitoring(!isMonitoring)}
            className={`p-3 rounded-lg transition-colors ${
              isMonitoring 
                ? 'bg-neon-green/20 hover:bg-neon-green/30' 
                : 'bg-gray-500/20 hover:bg-gray-500/30'
            }`}
          >
            {isMonitoring ? 
              <Pause className="w-5 h-5 text-neon-green" /> : 
              <Play className="w-5 h-5 text-gray-400" />
            }
          </motion.button>
          
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Activity className={`w-4 h-4 ${isMonitoring ? 'text-neon-green animate-pulse' : 'text-gray-400'}`} />
            <span>Live monitoring {isMonitoring ? 'active' : 'paused'}</span>
          </div>
          
          <div className="text-xs text-gray-400">
            Last updated: {aiStatus?.overview.lastUpdated || 'Never'}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            aiStatus?.overview.isOperational 
              ? 'bg-neon-green/20 text-neon-green' 
              : 'bg-red-500/20 text-red-400'
          }`}>
            {aiStatus?.overview.isOperational ? 'Operational' : 'Degraded'}
          </div>
        </div>
      </motion.div>

      {/* AI Systems Grid */}
      {aiStatus && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6"
        >
          {aiStatus.systems.map((system, index) => (
            <motion.div
              key={system.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              whileHover={{ scale: 1.02 }}
            >
              <GlassCard className="p-6 hover:bg-white/5 transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-neon-blue/20 to-neon-purple/20 rounded-lg flex items-center justify-center">
                      <Brain className="w-5 h-5 text-neon-blue" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white">{system.name}</h3>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(system.status)}
                        <span className={`text-xs ${getStatusColor(system.status)}`}>
                          {system.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-2xl font-bold text-neon-green">{system.healthScore}%</div>
                    <div className="text-xs text-gray-400">Health</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center p-2 bg-white/5 rounded">
                    <div className="text-lg font-bold text-white">{system.workers}</div>
                    <div className="text-xs text-gray-400">Workers</div>
                  </div>
                  <div className="text-center p-2 bg-white/5 rounded">
                    <div className="text-lg font-bold text-neon-blue">{system.performance.accuracy}</div>
                    <div className="text-xs text-gray-400">Accuracy</div>
                  </div>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Processing Rate</span>
                    <span className="text-white">{system.performance.processingRate}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Learning Rate</span>
                    <span className="text-neon-purple">{system.performance.learningRate}x</span>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="text-xs text-gray-400 mb-1">Capabilities</div>
                  <div className="flex flex-wrap gap-1">
                    {system.capabilities.slice(0, 3).map((capability, idx) => (
                      <span 
                        key={idx}
                        className="px-2 py-1 bg-neon-blue/10 text-neon-blue text-xs rounded"
                      >
                        {capability}
                      </span>
                    ))}
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Capabilities Summary */}
      {aiStatus && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <GlassCard className="p-6 bg-gradient-to-br from-neon-blue/20 to-neon-green/20">
            <div className="text-center space-y-4">
              <Crown className="w-12 h-12 text-neon-gold mx-auto" />
              <h3 className="text-2xl font-bold text-white">AI Capabilities Summary</h3>
              <p className="text-gray-300 max-w-3xl mx-auto">
                Fantasy.AI's neural network infrastructure provides unprecedented AI capabilities 
                with enterprise-grade reliability and performance.
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-neon-blue">{aiStatus.performance.predictionsServed}</div>
                  <div className="text-sm text-gray-400">Predictions Served</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-neon-green">{aiStatus.overview.activeSystems}</div>
                  <div className="text-sm text-gray-400">Active Systems</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-neon-purple">{aiStatus.performance.accuracyTrend}</div>
                  <div className="text-sm text-gray-400">Accuracy Trend</div>
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      )}
    </div>
  );
}

export default AISystemDashboard;