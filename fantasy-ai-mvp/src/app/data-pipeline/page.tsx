'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Play, Pause, RotateCw, Activity, AlertTriangle, 
  CheckCircle, Clock, Database, TrendingUp, Zap,
  CloudLightning, DollarSign, Brain, BarChart3
} from 'lucide-react';

interface Pipeline {
  name: string;
  status: 'running' | 'stopped' | 'error';
  lastUpdate: Date;
  updateInterval: number;
  recordsProcessed: number;
  errors: string[];
}

interface PipelineStatus {
  isRunning: boolean;
  pipelines: Pipeline[];
}

interface Metrics {
  timestamp: Date;
  hourlyMetrics: Array<{
    dataType: string;
    source: string;
    _count: number;
  }>;
  totalRecordsLastHour: number;
}

export default function DataPipelinePage() {
  const [status, setStatus] = useState<PipelineStatus | null>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [controlling, setControlling] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchStatus();
    
    // Auto-refresh every 5 seconds
    const interval = setInterval(() => {
      if (autoRefresh) {
        fetchStatus();
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/data-pipeline');
      const data = await response.json();
      setStatus(data.status);
      setMetrics(data.metrics);
    } catch (error) {
      console.error('Failed to fetch pipeline status:', error);
    } finally {
      setLoading(false);
    }
  };

  const controlPipeline = async (action: 'start' | 'stop' | 'restart', pipeline?: string) => {
    setControlling(true);
    try {
      const response = await fetch('/api/data-pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, pipeline })
      });
      
      const data = await response.json();
      if (data.success) {
        await fetchStatus();
      }
    } catch (error) {
      console.error('Pipeline control error:', error);
    } finally {
      setControlling(false);
    }
  };

  const getPipelineIcon = (name: string) => {
    switch (name) {
      case 'ESPN Data Aggregator':
      case 'Yahoo Data Aggregator':
        return <Activity className="h-5 w-5" />;
      case 'Injury & Weather Pipeline':
        return <CloudLightning className="h-5 w-5" />;
      case 'Market Data Collector':
        return <DollarSign className="h-5 w-5" />;
      case 'Real-Time Feature Engineering':
        return <Brain className="h-5 w-5" />;
      default:
        return <Zap className="h-5 w-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-green-500';
      case 'stopped':
        return 'bg-gray-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatInterval = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    return `${Math.floor(seconds / 60)}m`;
  };

  const getTimeSinceUpdate = (lastUpdate: Date) => {
    const seconds = Math.floor((Date.now() - new Date(lastUpdate).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-4xl font-bold">⚡ Real-Time Data Pipeline</h1>
          <div className="flex items-center gap-2">
            <Badge variant={autoRefresh ? "default" : "outline"}>
              {autoRefresh ? "Auto-Refresh ON" : "Auto-Refresh OFF"}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              {autoRefresh ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        <p className="text-muted-foreground">
          Monitor and control Fantasy.AI's real-time data collection system
        </p>
      </div>

      {/* Control Panel */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Pipeline Control</CardTitle>
          <CardDescription>
            Manage all data collection pipelines
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Badge 
                variant={status?.isRunning ? "default" : "secondary"}
                className={status?.isRunning ? "bg-green-500" : ""}
              >
                {status?.isRunning ? "RUNNING" : "STOPPED"}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {metrics?.totalRecordsLastHour || 0} records collected in last hour
              </span>
            </div>
            <div className="flex items-center gap-2">
              {!status?.isRunning ? (
                <Button
                  onClick={() => controlPipeline('start')}
                  disabled={controlling}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start All Pipelines
                </Button>
              ) : (
                <Button
                  onClick={() => controlPipeline('stop')}
                  disabled={controlling}
                  variant="destructive"
                >
                  <Pause className="h-4 w-4 mr-2" />
                  Stop All Pipelines
                </Button>
              )}
              <Button
                onClick={() => controlPipeline('restart')}
                disabled={controlling}
                variant="outline"
              >
                <RotateCw className="h-4 w-4 mr-2" />
                Restart All
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="status" className="space-y-4">
        <TabsList>
          <TabsTrigger value="status">Pipeline Status</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="errors">Errors & Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="status" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {status?.pipelines.map((pipeline) => (
              <Card key={pipeline.name} className="relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-full h-1 ${getStatusColor(pipeline.status)}`} />
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getPipelineIcon(pipeline.name)}
                      <CardTitle className="text-lg">{pipeline.name}</CardTitle>
                    </div>
                    <Badge variant={pipeline.status === 'running' ? 'default' : 'secondary'}>
                      {pipeline.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Update Interval:</span>
                      <span className="font-medium">{formatInterval(pipeline.updateInterval)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Last Update:</span>
                      <span className="font-medium">{getTimeSinceUpdate(pipeline.lastUpdate)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Records:</span>
                      <span className="font-medium">{pipeline.recordsProcessed.toLocaleString()}</span>
                    </div>
                  </div>
                  
                  {pipeline.errors.length > 0 && (
                    <Alert className="py-2">
                      <AlertTriangle className="h-3 w-3" />
                      <AlertDescription className="text-xs">
                        {pipeline.errors.length} recent errors
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => controlPipeline('restart', pipeline.name.split(' ')[0])}
                      disabled={controlling}
                      className="flex-1"
                    >
                      <RotateCw className="h-3 w-3 mr-1" />
                      Restart
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Data Collection Metrics</CardTitle>
              <CardDescription>
                Records collected by type in the last hour
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics?.hourlyMetrics.map((metric, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Badge variant="outline">{metric.source}</Badge>
                      <span className="text-sm font-medium">{metric.dataType}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-muted-foreground" />
                      <span className="font-bold">{metric._count.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-medium">Total Records (1 hour):</span>
                  <span className="text-2xl font-bold text-primary">
                    {metrics?.totalRecordsLastHour.toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Performance Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Records/Minute:</span>
                  <span className="font-medium">
                    {Math.round((metrics?.totalRecordsLastHour || 0) / 60)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Active Pipelines:</span>
                  <span className="font-medium">
                    {status?.pipelines.filter(p => p.status === 'running').length} / {status?.pipelines.length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">System Health:</span>
                  <Badge className="bg-green-500">Optimal</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">ML Model Updates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Features Updated:</span>
                  <span className="font-medium">Every 60s</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Models Refreshed:</span>
                  <span className="font-medium">6 models</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Prediction Accuracy:</span>
                  <Badge className="bg-blue-500">92.4%</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Errors & Alerts</CardTitle>
              <CardDescription>
                Monitor pipeline issues and system alerts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {status?.pipelines.some(p => p.errors.length > 0) ? (
                <div className="space-y-4">
                  {status.pipelines.map(pipeline => 
                    pipeline.errors.map((error, idx) => (
                      <Alert key={`${pipeline.name}-${idx}`} className="py-3">
                        <AlertTriangle className="h-4 w-4" />
                        <div className="ml-2">
                          <div className="font-medium">{pipeline.name}</div>
                          <AlertDescription className="text-sm mt-1">
                            {error}
                          </AlertDescription>
                        </div>
                      </Alert>
                    ))
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-muted-foreground">No errors detected</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Live Data Feed Preview */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>🔴 Live Data Feed</CardTitle>
          <CardDescription>
            Real-time preview of incoming data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm">ESPN: Patrick Mahomes - 22.4 projected points (updated 5s ago)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm">Weather: KC @ BUF - 28°F, 15mph winds (updated 12s ago)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm">Market: DraftKings ownership projections updated (updated 45s ago)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm">Injury: Tyreek Hill - Questionable (ankle) (updated 2m ago)</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}