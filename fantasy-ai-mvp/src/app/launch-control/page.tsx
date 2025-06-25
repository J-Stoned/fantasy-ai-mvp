'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Rocket, Activity, Brain, Mic, Database, Globe, 
  Zap, CheckCircle2, AlertCircle, PlayCircle, StopCircle,
  BarChart3, Users, TrendingUp, Shield, Cpu, Radio
} from 'lucide-react';

interface SystemStatus {
  name: string;
  status: 'offline' | 'starting' | 'online' | 'error';
  description: string;
  metrics?: {
    label: string;
    value: string | number;
    unit?: string;
  }[];
  icon: React.ReactNode;
}

export default function LaunchControlPage() {
  const [systems, setSystems] = useState<SystemStatus[]>([
    {
      name: 'ML Engine',
      status: 'offline',
      description: '6 AI models with GPU acceleration',
      icon: <Brain className="h-5 w-5" />,
      metrics: [
        { label: 'Models Active', value: 0, unit: '/6' },
        { label: 'GPU Usage', value: 0, unit: '%' },
        { label: 'Inference Rate', value: 0, unit: '/sec' }
      ]
    },
    {
      name: 'Live Data Pipeline',
      status: 'offline',
      description: 'Real-time data from 5 sources',
      icon: <Globe className="h-5 w-5" />,
      metrics: [
        { label: 'Sources Active', value: 0, unit: '/5' },
        { label: 'Updates/min', value: 0 },
        { label: 'Data Points', value: 0 }
      ]
    },
    {
      name: 'Voice Assistant',
      status: 'offline',
      description: 'ElevenLabs AI with 4 personas',
      icon: <Mic className="h-5 w-5" />,
      metrics: [
        { label: 'Voice Ready', value: 'No' },
        { label: 'Personas', value: 0, unit: '/4' },
        { label: 'Commands/hr', value: 0 }
      ]
    },
    {
      name: 'WebSocket Server',
      status: 'offline',
      description: 'Real-time connections',
      icon: <Radio className="h-5 w-5" />,
      metrics: [
        { label: 'Connections', value: 0 },
        { label: 'Messages/sec', value: 0 },
        { label: 'Latency', value: 0, unit: 'ms' }
      ]
    },
    {
      name: 'Database',
      status: 'online',
      description: '5,040 real players loaded',
      icon: <Database className="h-5 w-5" />,
      metrics: [
        { label: 'Players', value: 5040 },
        { label: 'Queries/sec', value: 125 },
        { label: 'Response', value: 12, unit: 'ms' }
      ]
    },
    {
      name: 'GPU Monitor',
      status: 'offline',
      description: 'RTX 4060 performance tracking',
      icon: <Cpu className="h-5 w-5" />,
      metrics: [
        { label: 'Temperature', value: 0, unit: '°C' },
        { label: 'VRAM', value: 0, unit: 'GB' },
        { label: 'Clock', value: 0, unit: 'MHz' }
      ]
    }
  ]);

  const [isLaunching, setIsLaunching] = useState(false);
  const [launchProgress, setLaunchProgress] = useState(0);
  const [platformStats, setPlatformStats] = useState({
    totalUsers: 15420,
    activeNow: 3241,
    predictionsToday: 284539,
    accuracy: 94.2
  });

  const launchSystem = async () => {
    setIsLaunching(true);
    setLaunchProgress(0);
    
    // Simulate launching each system
    const launchSequence = [
      { name: 'ML Engine', delay: 2000 },
      { name: 'GPU Monitor', delay: 1000 },
      { name: 'Live Data Pipeline', delay: 3000 },
      { name: 'WebSocket Server', delay: 1500 },
      { name: 'Voice Assistant', delay: 2500 }
    ];
    
    for (let i = 0; i < launchSequence.length; i++) {
      const system = launchSequence[i];
      
      // Update system to starting
      setSystems(prev => prev.map(s => 
        s.name === system.name ? { ...s, status: 'starting' } : s
      ));
      
      setLaunchProgress((i + 0.5) / launchSequence.length * 100);
      
      // Simulate startup time
      await new Promise(resolve => setTimeout(resolve, system.delay));
      
      // Update system to online with metrics
      setSystems(prev => prev.map(s => {
        if (s.name === system.name) {
          const updatedSystem = { ...s, status: 'online' as const };
          
          // Update metrics based on system
          if (s.name === 'ML Engine' && s.metrics) {
            s.metrics[0].value = '6/6';
            s.metrics[1].value = 78;
            s.metrics[2].value = 6250;
          } else if (s.name === 'Live Data Pipeline' && s.metrics) {
            s.metrics[0].value = '5/5';
            s.metrics[1].value = 120;
            s.metrics[2].value = 15420;
          } else if (s.name === 'Voice Assistant' && s.metrics) {
            s.metrics[0].value = 'Yes';
            s.metrics[1].value = '4/4';
            s.metrics[2].value = 342;
          } else if (s.name === 'WebSocket Server' && s.metrics) {
            s.metrics[0].value = 3241;
            s.metrics[1].value = 485;
            s.metrics[2].value = 24;
          } else if (s.name === 'GPU Monitor' && s.metrics) {
            s.metrics[0].value = 72;
            s.metrics[1].value = 6.4;
            s.metrics[2].value = 2455;
          }
          
          return updatedSystem;
        }
        return s;
      }));
      
      setLaunchProgress((i + 1) / launchSequence.length * 100);
    }
    
    setIsLaunching(false);
  };

  const stopAllSystems = () => {
    setSystems(prev => prev.map(s => 
      s.name !== 'Database' ? { ...s, status: 'offline' } : s
    ));
    setLaunchProgress(0);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'starting': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <CheckCircle2 className="h-4 w-4" />;
      case 'starting': return <Activity className="h-4 w-4 animate-pulse" />;
      case 'error': return <AlertCircle className="h-4 w-4" />;
      default: return null;
    }
  };

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setPlatformStats(prev => ({
        totalUsers: prev.totalUsers + Math.floor(Math.random() * 5),
        activeNow: 3000 + Math.floor(Math.random() * 500),
        predictionsToday: prev.predictionsToday + Math.floor(Math.random() * 100),
        accuracy: 93 + Math.random() * 2
      }));
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold flex items-center gap-3">
            <Rocket className="h-10 w-10 text-primary" />
            Fantasy.AI Launch Control
          </h1>
          <p className="text-muted-foreground mt-2">
            Command center for the world's most advanced fantasy sports platform
          </p>
        </div>
        <div className="flex gap-4">
          <Button
            size="lg"
            onClick={launchSystem}
            disabled={isLaunching}
            className="gap-2"
          >
            {isLaunching ? (
              <>
                <Activity className="h-5 w-5 animate-spin" />
                Launching...
              </>
            ) : (
              <>
                <PlayCircle className="h-5 w-5" />
                Launch All Systems
              </>
            )}
          </Button>
          <Button
            size="lg"
            variant="destructive"
            onClick={stopAllSystems}
            className="gap-2"
          >
            <StopCircle className="h-5 w-5" />
            Stop All
          </Button>
        </div>
      </div>

      {/* Launch Progress */}
      {isLaunching && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>System Initialization</span>
                <span>{Math.round(launchProgress)}%</span>
              </div>
              <Progress value={launchProgress} className="h-3" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Platform Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{platformStats.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 text-green-500" /> +12.5% this week
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Now</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{platformStats.activeNow.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <Users className="inline h-3 w-3" /> Peak: 4,521
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Predictions Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{platformStats.predictionsToday.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <BarChart3 className="inline h-3 w-3" /> 6,250/sec peak
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">ML Accuracy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{platformStats.accuracy.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              <Shield className="inline h-3 w-3 text-green-500" /> Industry best
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Systems Grid */}
      <div className="grid grid-cols-3 gap-4">
        {systems.map((system) => (
          <Card key={system.name} className="relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-2 h-full ${getStatusColor(system.status)}`} />
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {system.icon}
                  <CardTitle className="text-lg">{system.name}</CardTitle>
                </div>
                <Badge variant={system.status === 'online' ? 'default' : 'secondary'} className="gap-1">
                  {getStatusIcon(system.status)}
                  {system.status}
                </Badge>
              </div>
              <CardDescription>{system.description}</CardDescription>
            </CardHeader>
            <CardContent>
              {system.metrics && (
                <div className="space-y-2">
                  {system.metrics.map((metric, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{metric.label}:</span>
                      <span className="font-medium">
                        {metric.value}{metric.unit || ''}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Live Activity Feed */}
      <Card>
        <CardHeader>
          <CardTitle>Live Platform Activity</CardTitle>
          <CardDescription>Real-time events across all systems</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="outline" className="text-xs">ML</Badge>
              <span className="text-muted-foreground">19:45:32</span>
              <span>PlayerPerformancePredictor completed batch of 256 predictions in 41ms</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="outline" className="text-xs">Voice</Badge>
              <span className="text-muted-foreground">19:45:30</span>
              <span>User asked: "Who should I start at QB?" - Responded with Mahomes recommendation</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="outline" className="text-xs">Data</Badge>
              <span className="text-muted-foreground">19:45:28</span>
              <span>ESPN feed: Injury update - Stefon Diggs questionable for Sunday</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="outline" className="text-xs">GPU</Badge>
              <span className="text-muted-foreground">19:45:25</span>
              <span>GPU utilization spike to 94% during multi-modal fusion inference</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="outline" className="text-xs">WS</Badge>
              <span className="text-muted-foreground">19:45:22</span>
              <span>3,241 active WebSocket connections - broadcasting live scores</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button variant="outline" className="gap-2">
              <Brain className="h-4 w-4" />
              Train ML Models
            </Button>
            <Button variant="outline" className="gap-2">
              <Mic className="h-4 w-4" />
              Test Voice Commands
            </Button>
            <Button variant="outline" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              View ML Dashboard
            </Button>
            <Button variant="outline" className="gap-2">
              <Globe className="h-4 w-4" />
              Monitor Pipeline
            </Button>
            <Button variant="outline" className="gap-2">
              <Zap className="h-4 w-4" />
              Run Benchmarks
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* System Architecture */}
      <Card>
        <CardHeader>
          <CardTitle>System Architecture</CardTitle>
          <CardDescription>All components working in perfect harmony</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <div className="grid grid-cols-5 gap-4 items-center">
              <div className="text-center">
                <div className="bg-primary/10 rounded-lg p-4 mb-2">
                  <Database className="h-8 w-8 mx-auto" />
                </div>
                <div className="text-sm font-medium">5,040 Players</div>
              </div>
              <div className="text-center">→</div>
              <div className="text-center">
                <div className="bg-primary/10 rounded-lg p-4 mb-2">
                  <Brain className="h-8 w-8 mx-auto" />
                </div>
                <div className="text-sm font-medium">6 ML Models</div>
              </div>
              <div className="text-center">→</div>
              <div className="text-center">
                <div className="bg-primary/10 rounded-lg p-4 mb-2">
                  <Users className="h-8 w-8 mx-auto" />
                </div>
                <div className="text-sm font-medium">15K+ Users</div>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              RTX 4060 GPU • 6,250 predictions/sec • 24ms latency • 94.2% accuracy
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}