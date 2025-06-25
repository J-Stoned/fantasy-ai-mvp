'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Zap, TrendingUp, Users, DollarSign, Trophy, 
  RefreshCw, Download, Lock, Target, Layers
} from 'lucide-react';
import { FeatureGate, InlineFeatureGate } from '@/components/subscription/FeatureGate';
import { useSubscription } from '@/contexts/SubscriptionContext';

interface DFSPlayer {
  id: string;
  name: string;
  position: string;
  team: string;
  salary: number;
  projectedPoints: number;
  ownership: number;
  value: number; // points per $1000
  leverage: number;
  boom: number; // ceiling projection
  bust: number; // floor projection
}

interface DFSLineup {
  players: DFSPlayer[];
  totalSalary: number;
  projectedPoints: number;
  ownership: number;
  leverage: number;
  confidence: number;
}

interface OptimizerSettings {
  platform: 'draftkings' | 'fanduel' | 'yahoo';
  contestType: 'cash' | 'gpp';
  maxOwnership: number;
  minProjection: number;
  stackingEnabled: boolean;
  correlationEnabled: boolean;
  uniqueLineups: number;
}

export function DFSOptimizer() {
  const { tier } = useSubscription();
  const [settings, setSettings] = useState<OptimizerSettings>({
    platform: 'draftkings',
    contestType: 'gpp',
    maxOwnership: 30,
    minProjection: 0,
    stackingEnabled: true,
    correlationEnabled: true,
    uniqueLineups: 20
  });
  
  const [optimizing, setOptimizing] = useState(false);
  const [lineups, setLineups] = useState<DFSLineup[]>([]);
  const [selectedLineup, setSelectedLineup] = useState<number>(0);

  const optimizeLineups = async () => {
    setOptimizing(true);
    
    // Simulate optimization
    setTimeout(() => {
      const mockLineups: DFSLineup[] = [];
      
      for (let i = 0; i < settings.uniqueLineups; i++) {
        const lineup: DFSLineup = {
          players: [
            {
              id: '1',
              name: 'Josh Allen',
              position: 'QB',
              team: 'BUF',
              salary: 8200,
              projectedPoints: 24.5,
              ownership: 18,
              value: 2.99,
              leverage: 0.8,
              boom: 32.1,
              bust: 16.2
            },
            {
              id: '2',
              name: 'Christian McCaffrey',
              position: 'RB',
              team: 'SF',
              salary: 9500,
              projectedPoints: 22.3,
              ownership: 35,
              value: 2.35,
              leverage: -0.5,
              boom: 28.7,
              bust: 14.1
            },
            {
              id: '3',
              name: 'Breece Hall',
              position: 'RB',
              team: 'NYJ',
              salary: 7200,
              projectedPoints: 16.8,
              ownership: 12,
              value: 2.33,
              leverage: 1.2,
              boom: 22.4,
              bust: 10.2
            },
            {
              id: '4',
              name: 'Tyreek Hill',
              position: 'WR',
              team: 'MIA',
              salary: 9000,
              projectedPoints: 21.2,
              ownership: 28,
              value: 2.36,
              leverage: -0.2,
              boom: 29.5,
              bust: 12.8
            },
            {
              id: '5',
              name: 'Amon-Ra St. Brown',
              position: 'WR',
              team: 'DET',
              salary: 7800,
              projectedPoints: 18.4,
              ownership: 15,
              value: 2.36,
              leverage: 0.6,
              boom: 24.1,
              bust: 11.7
            },
            {
              id: '6',
              name: 'DeVonta Smith',
              position: 'WR',
              team: 'PHI',
              salary: 6200,
              projectedPoints: 14.7,
              ownership: 8,
              value: 2.37,
              leverage: 1.5,
              boom: 19.8,
              bust: 8.9
            },
            {
              id: '7',
              name: 'Travis Kelce',
              position: 'TE',
              team: 'KC',
              salary: 7500,
              projectedPoints: 17.3,
              ownership: 22,
              value: 2.31,
              leverage: 0.1,
              boom: 22.6,
              bust: 11.4
            },
            {
              id: '8',
              name: 'Stefon Diggs',
              position: 'FLEX',
              team: 'BUF',
              salary: 7700,
              projectedPoints: 17.9,
              ownership: 20,
              value: 2.32,
              leverage: 0.3,
              boom: 23.7,
              bust: 11.2
            },
            {
              id: '9',
              name: 'Cowboys',
              position: 'DST',
              team: 'DAL',
              salary: 3400,
              projectedPoints: 9.2,
              ownership: 14,
              value: 2.71,
              leverage: 0.4,
              boom: 15.0,
              bust: 3.5
            }
          ],
          totalSalary: 59700,
          projectedPoints: 158.3 + (Math.random() * 10 - 5),
          ownership: 19.2 + (Math.random() * 5),
          leverage: 0.4 + (Math.random() * 0.6 - 0.3),
          confidence: 0.75 + (Math.random() * 0.15)
        };
        
        mockLineups.push(lineup);
      }
      
      // Sort by projected points
      mockLineups.sort((a, b) => b.projectedPoints - a.projectedPoints);
      
      setLineups(mockLineups);
      setOptimizing(false);
    }, 3000);
  };

  const exportLineups = () => {
    // In production, this would generate CSV
    console.log('Exporting lineups...');
    alert('Lineups exported! (This would download a CSV file)');
  };

  const getSalaryColor = (used: number, cap: number) => {
    const percentage = (used / cap) * 100;
    if (percentage > 99) return 'text-red-500';
    if (percentage > 95) return 'text-yellow-500';
    return 'text-green-500';
  };

  const isEliteFeature = (feature: string) => {
    return ['correlationEnabled', 'multiPlatform'].includes(feature);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Layers className="h-6 w-6 text-primary" />
            DFS Lineup Optimizer
          </h2>
          <p className="text-muted-foreground">
            Build winning DFS lineups with advanced algorithms
          </p>
        </div>
        <FeatureGate featureId="DFS_MULTI_PLATFORM" showUpgradePrompt={false}>
          <Badge variant="default" className="bg-gradient-to-r from-yellow-500 to-orange-600">
            <Zap className="h-3 w-3 mr-1" />
            All Platforms
          </Badge>
        </FeatureGate>
      </div>

      <FeatureGate featureId="DFS_LINEUP_BUILDER">
        <div className="grid gap-6 md:grid-cols-3">
          {/* Settings Panel */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Optimizer Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Platform Selection */}
              <div className="space-y-2">
                <Label>Platform</Label>
                <Select 
                  value={settings.platform} 
                  onValueChange={(value) => setSettings({...settings, platform: value as any})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draftkings">DraftKings</SelectItem>
                    <SelectItem value="fanduel">
                      <InlineFeatureGate featureId="DFS_MULTI_PLATFORM">
                        FanDuel
                      </InlineFeatureGate>
                    </SelectItem>
                    <SelectItem value="yahoo">
                      <InlineFeatureGate featureId="DFS_MULTI_PLATFORM">
                        Yahoo
                      </InlineFeatureGate>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Contest Type */}
              <div className="space-y-2">
                <Label>Contest Type</Label>
                <Select 
                  value={settings.contestType} 
                  onValueChange={(value) => setSettings({...settings, contestType: value as any})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash Games</SelectItem>
                    <SelectItem value="gpp">GPP/Tournaments</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Max Ownership */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Max Ownership</Label>
                  <span className="text-sm text-muted-foreground">{settings.maxOwnership}%</span>
                </div>
                <Slider
                  value={[settings.maxOwnership]}
                  onValueChange={([value]) => setSettings({...settings, maxOwnership: value})}
                  min={0}
                  max={50}
                  step={5}
                />
              </div>

              {/* Number of Lineups */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Unique Lineups</Label>
                  <span className="text-sm text-muted-foreground">{settings.uniqueLineups}</span>
                </div>
                <Slider
                  value={[settings.uniqueLineups]}
                  onValueChange={([value]) => setSettings({...settings, uniqueLineups: value})}
                  min={1}
                  max={150}
                  step={1}
                  disabled={tier === 'PRO' && settings.uniqueLineups > 20}
                />
                {tier === 'PRO' && settings.uniqueLineups >= 20 && (
                  <p className="text-xs text-muted-foreground">
                    Upgrade to Elite for up to 150 lineups
                  </p>
                )}
              </div>

              {/* Advanced Options */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="stacking">Enable Stacking</Label>
                  <Switch
                    id="stacking"
                    checked={settings.stackingEnabled}
                    onCheckedChange={(checked) => setSettings({...settings, stackingEnabled: checked})}
                  />
                </div>

                <FeatureGate featureId="DFS_MULTI_PLATFORM" showUpgradePrompt={false}>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="correlation">
                      <InlineFeatureGate featureId="DFS_MULTI_PLATFORM">
                        Player Correlation
                      </InlineFeatureGate>
                    </Label>
                    <Switch
                      id="correlation"
                      checked={settings.correlationEnabled}
                      onCheckedChange={(checked) => setSettings({...settings, correlationEnabled: checked})}
                      disabled={tier !== 'ELITE'}
                    />
                  </div>
                </FeatureGate>
              </div>

              {/* Optimize Button */}
              <Button 
                className="w-full" 
                onClick={optimizeLineups}
                disabled={optimizing}
              >
                {optimizing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Optimizing...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Optimize Lineups
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Lineups Display */}
          <Card className="md:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Generated Lineups</CardTitle>
                {lineups.length > 0 && (
                  <Button variant="outline" size="sm" onClick={exportLineups}>
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {lineups.length === 0 ? (
                <div className="text-center py-12">
                  <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Configure settings and click "Optimize Lineups" to generate lineups
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Lineup Selector */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-2">
                    {lineups.map((_, idx) => (
                      <Button
                        key={idx}
                        variant={selectedLineup === idx ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedLineup(idx)}
                      >
                        #{idx + 1}
                      </Button>
                    ))}
                  </div>

                  {/* Selected Lineup */}
                  <div className="space-y-4">
                    {/* Lineup Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold">
                          {lineups[selectedLineup].projectedPoints.toFixed(1)}
                        </p>
                        <p className="text-sm text-muted-foreground">Projected Points</p>
                      </div>
                      <div className="text-center">
                        <p className={`text-2xl font-bold ${getSalaryColor(lineups[selectedLineup].totalSalary, 60000)}`}>
                          ${lineups[selectedLineup].totalSalary.toLocaleString()}
                        </p>
                        <p className="text-sm text-muted-foreground">Salary Used</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold">
                          {lineups[selectedLineup].ownership.toFixed(1)}%
                        </p>
                        <p className="text-sm text-muted-foreground">Avg Ownership</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold">
                          {(lineups[selectedLineup].confidence * 100).toFixed(0)}%
                        </p>
                        <p className="text-sm text-muted-foreground">Confidence</p>
                      </div>
                    </div>

                    {/* Players Table */}
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="text-left p-2 text-sm">Position</th>
                            <th className="text-left p-2 text-sm">Player</th>
                            <th className="text-right p-2 text-sm">Salary</th>
                            <th className="text-right p-2 text-sm">Proj</th>
                            <th className="text-right p-2 text-sm">Own%</th>
                            <th className="text-right p-2 text-sm">Value</th>
                          </tr>
                        </thead>
                        <tbody>
                          {lineups[selectedLineup].players.map((player, idx) => (
                            <tr key={idx} className="border-t">
                              <td className="p-2">
                                <Badge variant="outline" className="font-mono">
                                  {player.position}
                                </Badge>
                              </td>
                              <td className="p-2">
                                <div>
                                  <p className="font-medium">{player.name}</p>
                                  <p className="text-xs text-muted-foreground">{player.team}</p>
                                </div>
                              </td>
                              <td className="p-2 text-right font-mono">
                                ${player.salary.toLocaleString()}
                              </td>
                              <td className="p-2 text-right font-medium">
                                {player.projectedPoints.toFixed(1)}
                              </td>
                              <td className="p-2 text-right">
                                {player.ownership}%
                              </td>
                              <td className="p-2 text-right">
                                <Badge 
                                  variant={player.value > 2.5 ? 'default' : 'secondary'}
                                  className="font-mono"
                                >
                                  {player.value.toFixed(2)}x
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Leverage Alert */}
                    {lineups[selectedLineup].leverage > 0.5 && (
                      <Alert className="border-green-500/50 bg-green-500/10">
                        <TrendingUp className="h-4 w-4" />
                        <AlertDescription>
                          High leverage lineup! This lineup has lower ownership than projected performance suggests.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </FeatureGate>
    </div>
  );
}