'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Activity, AlertCircle, CheckCircle, Clock, Database, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PipelineMetrics {
  uptime: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageLatency: number;
  dataProcessed: number;
  errorsPerMinute: number;
  lastError?: {
    source: string;
    error: string;
    timestamp: Date;
  };
}

interface SourceStatus {
  id: string;
  name: string;
  enabled: boolean;
  active: boolean;
  successRate: number;
  lastUpdate?: Date;
  recordsCollected: number;
}

interface LiveDataUpdate {
  type: 'player' | 'injury' | 'game' | 'odds' | 'weather' | 'news';
  data: any;
  timestamp: Date;
}

export function LiveDataDashboard() {
  const [metrics, setMetrics] = useState<PipelineMetrics | null>(null);
  const [sources, setSources] = useState<SourceStatus[]>([]);
  const [liveUpdates, setLiveUpdates] = useState<LiveDataUpdate[]>([]);
  const [healthStatus, setHealthStatus] = useState<'healthy' | 'degraded' | 'unhealthy'>('healthy');
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Connect to pipeline monitor WebSocket
    const connectToPipeline = async () => {
      try {
        // In production, this would be a WebSocket connection
        // For now, we'll simulate with polling
        const fetchMetrics = async () => {
          const response = await fetch('/api/pipeline/metrics');
          if (response.ok) {
            const data = await response.json();
            setMetrics(data.metrics);
            setSources(data.sources);
            setHealthStatus(data.health);
            setIsConnected(true);
          }
        };

        // Fetch initial data
        await fetchMetrics();

        // Poll for updates
        const interval = setInterval(fetchMetrics, 5000);
        return () => clearInterval(interval);
      } catch (error) {
        console.error('Failed to connect to pipeline:', error);
        setIsConnected(false);
      }
    };

    connectToPipeline();
  }, []);

  // Simulate live updates
  useEffect(() => {
    const interval = setInterval(() => {
      const updates: LiveDataUpdate[] = [
        {
          type: 'player',
          data: { name: 'Patrick Mahomes', stats: { passingYards: 325, touchdowns: 3 } },
          timestamp: new Date()
        },
        {
          type: 'injury',
          data: { player: 'Christian McCaffrey', status: 'Questionable', injury: 'Ankle' },
          timestamp: new Date()
        },
        {
          type: 'game',
          data: { teams: 'KC vs BUF', score: '21-17', quarter: 3 },
          timestamp: new Date()
        }
      ];

      setLiveUpdates(prev => [...updates.slice(0, 1), ...prev].slice(0, 20));
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  const getHealthIcon = () => {
    switch (healthStatus) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'degraded':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'unhealthy':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const getUpdateIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      player: '🏈',
      injury: '🆘',
      game: '🎮',
      odds: '💰',
      weather: '☁️',
      news: '📰'
    };
    return icons[type] || '📡';
  };

  const formatUptime = (ms: number) => {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Live Data Pipeline</h2>
          <p className="text-muted-foreground">
            Real-time sports data collection powered by MCP servers
          </p>
        </div>
        <div className="flex items-center gap-2">
          {getHealthIcon()}
          <Badge variant={isConnected ? 'default' : 'secondary'}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </Badge>
        </div>
      </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uptime</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics ? formatUptime(metrics.uptime) : '--'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Pipeline running time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics && metrics.totalRequests > 0
                ? `${((metrics.successfulRequests / metrics.totalRequests) * 100).toFixed(1)}%`
                : '--'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics ? `${metrics.successfulRequests} of ${metrics.totalRequests}` : 'No data'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Processed</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics ? metrics.dataProcessed.toLocaleString() : '--'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total records processed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics ? metrics.errorsPerMinute : '--'}
              <span className="text-sm font-normal text-muted-foreground">/min</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics?.lastError ? `Last: ${metrics.lastError.source}` : 'No recent errors'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Data Sources */}
      <Card>
        <CardHeader>
          <CardTitle>Data Sources</CardTitle>
          <CardDescription>
            Live status of all configured data collection sources
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sources.map((source) => (
              <div key={source.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'h-2 w-2 rounded-full',
                      source.active ? 'bg-green-500' : source.enabled ? 'bg-yellow-500' : 'bg-gray-300'
                    )}
                  />
                  <div>
                    <p className="font-medium">{source.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {source.recordsCollected.toLocaleString()} records collected
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className="text-sm font-medium">{source.successRate.toFixed(1)}%</p>
                    <p className="text-xs text-muted-foreground">success rate</p>
                  </div>
                  <Progress value={source.successRate} className="w-20" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Live Updates Feed */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Live Updates
          </CardTitle>
          <CardDescription>
            Real-time data updates from all sources
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {liveUpdates.map((update, index) => (
              <div
                key={`${update.type}-${index}`}
                className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 animate-in fade-in slide-in-from-top-1"
              >
                <span className="text-2xl">{getUpdateIcon(update.type)}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {update.type}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(update.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm mt-1">
                    {JSON.stringify(update.data, null, 2).substring(0, 100)}...
                  </p>
                </div>
              </div>
            ))}
            {liveUpdates.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                Waiting for live updates...
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}