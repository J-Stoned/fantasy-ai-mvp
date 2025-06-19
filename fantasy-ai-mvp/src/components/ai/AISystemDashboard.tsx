"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
  BarChart3
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
  const [aiStatus, setAiStatus] = useState<AISystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAIStatus();
    
    // Update status every 30 seconds
    const interval = setInterval(fetchAIStatus, 30000);
    return () => clearInterval(interval);
  }, []);

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
      setError('AI systems are initializing...');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <Brain className="w-6 h-6 animate-pulse" />
          <h2 className="text-2xl font-bold">AI Systems Initializing...</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !aiStatus) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <AlertCircle className="w-6 h-6 text-yellow-500" />
          <h2 className="text-2xl font-bold">AI Systems Status</h2>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">AI Systems Initializing</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <button 
                onClick={fetchAIStatus}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Retry Connection
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'training': return <Clock className="w-4 h-4 text-blue-500" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'training': return 'bg-blue-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Brain className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold">Fantasy.AI System Status</h2>
          <Badge 
            variant={aiStatus.overview.isOperational ? "default" : "destructive"}
            className="ml-2"
          >
            {aiStatus.overview.isOperational ? 'OPERATIONAL' : 'OFFLINE'}
          </Badge>
        </div>
        <div className="text-sm text-gray-500">
          Last updated: {new Date(aiStatus.overview.lastUpdated).toLocaleTimeString()}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Workers</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aiStatus.overview.totalAIWorkers?.toLocaleString() || '0'}</div>
            <p className="text-xs text-muted-foreground">Active processing units</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing Rate</CardTitle>
            <Cpu className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aiStatus.overview.processingCapacity}</div>
            <p className="text-xs text-muted-foreground">Tasks per hour</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accuracy</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aiStatus.overview.averageAccuracy}</div>
            <p className="text-xs text-muted-foreground">{aiStatus.performance?.accuracyTrend}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Time</CardTitle>
            <Zap className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aiStatus.performance?.averageResponseTime}</div>
            <p className="text-xs text-muted-foreground">Average latency</p>
          </CardContent>
        </Card>
      </div>

      {/* AI Systems Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="w-5 h-5" />
            <span>AI Systems Overview</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {aiStatus.systems.map((system, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">{system.name}</h4>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(system.status)}
                    <Badge variant="outline">{system.workers} workers</Badge>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Processing Rate:</span>
                    <div className="font-medium">{system.performance.processingRate}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Accuracy:</span>
                    <div className="font-medium">{system.performance.accuracy}</div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-500">Health Score</span>
                    <span className="text-sm font-medium">{system.healthScore}%</span>
                  </div>
                  <Progress value={system.healthScore} className="h-2" />
                </div>
                
                <div className="text-xs text-gray-600">
                  <strong>Capabilities:</strong> {system.capabilities.slice(0, 2).join(', ')}
                  {system.capabilities.length > 2 && ` +${system.capabilities.length - 2} more`}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5" />
              <span>Performance Metrics</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span>Uptime</span>
              <span className="font-semibold text-green-600">{aiStatus.performance?.uptime}</span>
            </div>
            <div className="flex justify-between">
              <span>Predictions Served</span>
              <span className="font-semibold">{aiStatus.performance?.predictionsServed}</span>
            </div>
            <div className="flex justify-between">
              <span>Learning Progress</span>
              <span className="font-semibold text-blue-600">{aiStatus.performance?.learningProgress}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="w-5 h-5" />
              <span>AI Capabilities</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(aiStatus.capabilities).map(([key, enabled]) => (
              <div key={key} className="flex items-center justify-between">
                <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                <div className={`w-3 h-3 rounded-full ${enabled ? 'bg-green-500' : 'bg-gray-300'}`} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Infrastructure Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Globe className="w-5 h-5" />
            <span>Global Infrastructure</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Active Regions:</span>
              <div className="font-medium">5 global regions</div>
            </div>
            <div>
              <span className="text-gray-500">Scalability:</span>
              <div className="font-medium">Auto-scaling enabled</div>
            </div>
            <div>
              <span className="text-gray-500">Security:</span>
              <div className="font-medium">Enterprise-grade</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}