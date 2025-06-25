'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  Target, 
  Zap,
  Activity,
  BarChart3,
  Cpu,
  Database,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

interface MLModelStatus {
  name: string;
  type: string;
  status: 'idle' | 'training' | 'inferring' | 'error';
  accuracy: number;
  version: string;
  lastUsed: string;
  inferenceCount: number;
  averageLatency: number;
}

interface MLInsight {
  id: string;
  type: 'performance' | 'injury' | 'lineup' | 'trade' | 'prediction';
  title: string;
  description: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  actionable: boolean;
  data: any;
  createdAt: string;
}

interface MLMetrics {
  totalInferences: number;
  averageLatency: number;
  throughput: number;
  errorRate: number;
  accuracyTrend: number[];
  modelPerformance: Record<string, number>;
}

export function MLInsightsDashboard({ userId }: { userId: string }) {
  const [models, setModels] = useState<MLModelStatus[]>([]);
  const [insights, setInsights] = useState<MLInsight[]>([]);
  const [metrics, setMetrics] = useState<MLMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
    
    // Set up periodic refresh
    const interval = setInterval(loadDashboardData, 60000); // Every minute
    
    return () => clearInterval(interval);
  }, [userId]);

  const loadDashboardData = async () => {
    try {
      const [modelsRes, insightsRes, metricsRes] = await Promise.all([
        fetch('/api/ml/models/status'),
        fetch(`/api/ml/insights?userId=${userId}`),
        fetch('/api/ml/metrics')
      ]);

      if (modelsRes.ok) {
        const modelsData = await modelsRes.json();
        setModels(modelsData.models);
      }

      if (insightsRes.ok) {
        const insightsData = await insightsRes.json();
        setInsights(insightsData.insights);
      }

      if (metricsRes.ok) {
        const metricsData = await metricsRes.json();
        setMetrics(metricsData);
      }
    } catch (error) {
      console.error('Error loading ML dashboard data:', error);
      toast.error('Error loading ML insights');
    } finally {
      setLoading(false);
    }
  };

  const refreshInsights = async () => {
    setRefreshing(true);
    try {
      const response = await fetch(`/api/ml/insights/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });

      if (response.ok) {
        await loadDashboardData();
        toast.success('ML insights refreshed');
      } else {
        toast.error('Failed to refresh insights');
      }
    } catch (error) {
      console.error('Error refreshing insights:', error);
      toast.error('Error refreshing insights');
    } finally {
      setRefreshing(false);
    }
  };

  const getModelStatusColor = (status: string) => {
    switch (status) {
      case 'idle': return 'bg-green-500';
      case 'training': return 'bg-blue-500';
      case 'inferring': return 'bg-orange-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'performance': return <TrendingUp className="w-5 h-5 text-green-500" />;
      case 'injury': return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'lineup': return <Target className="w-5 h-5 text-blue-500" />;
      case 'trade': return <Activity className="w-5 h-5 text-purple-500" />;
      case 'prediction': return <Brain className="w-5 h-5 text-orange-500" />;
      default: return <Zap className="w-5 h-5 text-gray-500" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-gray-300 rounded w-1/3"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-4 bg-gray-300 rounded"></div>
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Brain className="w-8 h-8 text-purple-600" />
            ML Insights
          </h1>
          <p className="text-gray-600">AI-powered analytics and predictions</p>
        </div>
        <Button 
          onClick={refreshInsights}
          disabled={refreshing}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh Insights'}
        </Button>
      </div>

      {/* System Overview */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {metrics.totalInferences.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Total Predictions</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {metrics.averageLatency.toFixed(0)}ms
              </div>
              <div className="text-sm text-gray-600">Avg Latency</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">
                {metrics.throughput.toFixed(1)}/s
              </div>
              <div className="text-sm text-gray-600">Throughput</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {((1 - metrics.errorRate) * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Success Rate</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs defaultValue="insights" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="insights">
            <Brain className="w-4 h-4 mr-2" />
            Insights
          </TabsTrigger>
          <TabsTrigger value="models">
            <Cpu className="w-4 h-4 mr-2" />
            Models
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="insights" className="space-y-4">
          {insights.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                  No insights available
                </h3>
                <p className="text-gray-500">
                  Our AI models are analyzing your data. Check back soon for personalized insights!
                </p>
              </CardContent>
            </Card>
          ) : (
            insights.map((insight) => (
              <Card key={insight.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {getInsightIcon(insight.type)}
                      <div>
                        <CardTitle className="text-lg">{insight.title}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={getImpactColor(insight.impact)}>
                            {insight.impact.toUpperCase()} IMPACT
                          </Badge>
                          <Badge variant="outline">
                            {(insight.confidence * 100).toFixed(0)}% confidence
                          </Badge>
                          {insight.actionable && (
                            <Badge className="bg-green-500">
                              Actionable
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500">
                      {formatTimeAgo(insight.createdAt)}
                    </p>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 mb-4">{insight.description}</p>
                  
                  {/* Confidence Meter */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">AI Confidence</span>
                      <span className="text-sm text-gray-600">
                        {(insight.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                    <Progress value={insight.confidence * 100} className="h-2" />
                  </div>

                  {/* Insight Data */}
                  {insight.data && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <h4 className="font-medium text-gray-900 mb-2">Key Metrics</h4>
                      <div className="grid grid-cols-2 gap-4">
                        {Object.entries(insight.data).map(([key, value]) => (
                          <div key={key} className="text-center">
                            <div className="text-lg font-semibold text-gray-800">
                              {typeof value === 'number' ? value.toFixed(1) : String(value)}
                            </div>
                            <div className="text-xs text-gray-600 capitalize">
                              {key.replace(/_/g, ' ')}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {insight.actionable && (
                    <div className="mt-4 flex gap-2">
                      <Button size="sm" className="bg-green-600 hover:bg-green-700">
                        Take Action
                      </Button>
                      <Button variant="outline" size="sm">
                        Learn More
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="models" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {models.map((model) => (
              <Card key={model.name}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{model.name}</CardTitle>
                    <Badge className={getModelStatusColor(model.status)}>
                      {model.status.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{model.type}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-xl font-bold text-blue-600">
                          {model.accuracy.toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-600">Accuracy</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-green-600">
                          v{model.version}
                        </div>
                        <div className="text-xs text-gray-600">Version</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-lg font-semibold text-purple-600">
                          {model.inferenceCount.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-600">Predictions</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-orange-600">
                          {model.averageLatency.toFixed(0)}ms
                        </div>
                        <div className="text-xs text-gray-600">Avg Latency</div>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500">
                        Last used: {formatTimeAgo(model.lastUsed)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {metrics && (
            <>
              {/* Model Performance Comparison */}
              <Card>
                <CardHeader>
                  <CardTitle>Model Performance Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(metrics.modelPerformance).map(([model, accuracy]) => (
                      <div key={model} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">{model}</span>
                          <span className="text-sm text-gray-600">
                            {(accuracy * 100).toFixed(1)}%
                          </span>
                        </div>
                        <Progress value={accuracy * 100} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Accuracy Trend */}
              <Card>
                <CardHeader>
                  <CardTitle>Accuracy Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-32 flex items-end justify-between gap-1">
                    {metrics.accuracyTrend.map((accuracy, index) => (
                      <div
                        key={index}
                        className="bg-blue-500 rounded-t"
                        style={{
                          height: `${accuracy * 100}%`,
                          width: '100%'
                        }}
                        title={`Day ${index + 1}: ${(accuracy * 100).toFixed(1)}%`}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>7 days ago</span>
                    <span>Today</span>
                  </div>
                </CardContent>
              </Card>

              {/* System Health */}
              <Card>
                <CardHeader>
                  <CardTitle>System Health</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">CPU Usage</span>
                        <span className="text-sm">32%</span>
                      </div>
                      <Progress value={32} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Memory Usage</span>
                        <span className="text-sm">67%</span>
                      </div>
                      <Progress value={67} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">GPU Utilization</span>
                        <span className="text-sm">89%</span>
                      </div>
                      <Progress value={89} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Cache Hit Rate</span>
                        <span className="text-sm">94%</span>
                      </div>
                      <Progress value={94} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}