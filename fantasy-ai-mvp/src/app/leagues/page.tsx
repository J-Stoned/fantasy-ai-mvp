'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Trophy, Users, TrendingUp, AlertTriangle, Link, 
  ChevronRight, Loader2, CheckCircle, XCircle,
  Brain, Activity, Shield
} from 'lucide-react';

interface League {
  id: string;
  platform: string;
  name: string;
  sport: string;
  season: number;
  currentWeek: number;
  team?: {
    id: string;
    name: string;
    rosterSize: number;
  };
  standings: any[];
  insights?: {
    topPerformers: Array<{
      player: string;
      projectedPoints: number;
      confidence: number;
      injuryRisk: boolean;
      weeklyRisks: number[];
    }>;
    teamProjection: number;
    injuryAlerts: string[];
  };
}

interface PlatformConnection {
  platform: string;
  isActive: boolean;
  connectedAt: string;
}

export default function LeaguesPage() {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [connections, setConnections] = useState<PlatformConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [espnCookies, setEspnCookies] = useState({ espn_s2: '', SWID: '' });
  const [sleeperUsername, setSleeperUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchLeagues();
  }, []);

  const fetchLeagues = async () => {
    try {
      const response = await fetch('/api/leagues');
      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
      } else {
        setLeagues(data.leagues);
        setConnections(data.connections);
      }
    } catch (error) {
      setError('Failed to fetch leagues');
    } finally {
      setLoading(false);
    }
  };

  const connectYahoo = () => {
    window.location.href = '/api/auth/yahoo';
  };

  const connectESPN = async () => {
    if (!espnCookies.espn_s2 || !espnCookies.SWID) {
      setError('Please enter both ESPN cookies');
      return;
    }

    setConnecting('ESPN');
    setError(null);

    try {
      const response = await fetch('/api/leagues/espn/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(espnCookies)
      });

      const data = await response.json();

      if (data.error) {
        setError(data.error);
      } else {
        setSuccess(data.message);
        await fetchLeagues();
        setEspnCookies({ espn_s2: '', SWID: '' });
      }
    } catch (error) {
      setError('Failed to connect to ESPN');
    } finally {
      setConnecting(null);
    }
  };

  const connectSleeper = async () => {
    if (!sleeperUsername) {
      setError('Please enter your Sleeper username');
      return;
    }

    setConnecting('Sleeper');
    setError(null);

    try {
      const response = await fetch('/api/leagues/sleeper/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: sleeperUsername })
      });

      const data = await response.json();

      if (data.error) {
        setError(data.error);
      } else {
        setSuccess(data.message);
        await fetchLeagues();
        setSleeperUsername('');
      }
    } catch (error) {
      setError('Failed to connect to Sleeper');
    } finally {
      setConnecting(null);
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'YAHOO': return 'bg-purple-500';
      case 'ESPN': return 'bg-red-500';
      case 'SLEEPER': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const getSportIcon = (sport: string) => {
    switch (sport) {
      case 'FOOTBALL': return '🏈';
      case 'BASKETBALL': return '🏀';
      case 'BASEBALL': return '⚾';
      case 'HOCKEY': return '🏒';
      default: return '🏆';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">🏆 League Central</h1>
        <p className="text-muted-foreground">
          Connect your fantasy leagues and get AI-powered insights
        </p>
      </div>

      {error && (
        <Alert className="mb-6 border-red-500">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6 border-green-500">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="leagues" className="space-y-6">
        <TabsList>
          <TabsTrigger value="leagues">My Leagues ({leagues.length})</TabsTrigger>
          <TabsTrigger value="connect">Connect Platforms</TabsTrigger>
        </TabsList>

        <TabsContent value="leagues" className="space-y-6">
          {leagues.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No leagues connected yet</h3>
                <p className="text-muted-foreground mb-4">
                  Connect your fantasy leagues to get started
                </p>
                <Button onClick={() => document.querySelector('[value="connect"]')?.click()}>
                  Connect a League
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {leagues.map((league) => (
                <Card key={league.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Badge className={getPlatformColor(league.platform)}>
                        {league.platform}
                      </Badge>
                      <span className="text-2xl">{getSportIcon(league.sport)}</span>
                    </div>
                    <CardTitle className="mt-2">{league.name}</CardTitle>
                    <CardDescription>
                      {league.season} Season • Week {league.currentWeek}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {league.team && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Your Team:</span>
                          <span className="font-medium">{league.team.name}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm mt-1">
                          <span className="text-muted-foreground">Roster Size:</span>
                          <span className="font-medium">{league.team.rosterSize} players</span>
                        </div>
                      </div>
                    )}

                    {league.insights && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Brain className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium">ML Insights</span>
                        </div>

                        {league.insights.topPerformers.length > 0 && (
                          <div className="space-y-2">
                            <div className="text-sm text-muted-foreground">Top Performers:</div>
                            {league.insights.topPerformers.slice(0, 3).map((player, idx) => (
                              <div key={idx} className="flex items-center justify-between text-sm">
                                <span>{player.player}</span>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">
                                    {player.projectedPoints.toFixed(1)} pts
                                  </span>
                                  {player.injuryRisk && (
                                    <AlertTriangle className="h-3 w-3 text-red-500" />
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Team Projection:</span>
                          <span className="font-medium">
                            {league.insights.teamProjection.toFixed(1)} pts
                          </span>
                        </div>

                        {league.insights.injuryAlerts.length > 0 && (
                          <Alert className="py-2">
                            <Activity className="h-3 w-3" />
                            <AlertDescription className="text-xs">
                              Injury risk: {league.insights.injuryAlerts.join(', ')}
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    )}

                    <Button className="w-full mt-4" variant="outline">
                      View Details
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="connect" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            {/* Yahoo */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Yahoo Fantasy</CardTitle>
                  <Badge className="bg-purple-500">OAuth</Badge>
                </div>
                <CardDescription>
                  Connect via Yahoo account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {connections.find(c => c.platform === 'YAHOO') ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm">Connected</span>
                    </div>
                  ) : (
                    <Button 
                      onClick={connectYahoo}
                      className="w-full bg-purple-500 hover:bg-purple-600"
                    >
                      <Link className="h-4 w-4 mr-2" />
                      Connect Yahoo
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* ESPN */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>ESPN Fantasy</CardTitle>
                  <Badge className="bg-red-500">Cookie</Badge>
                </div>
                <CardDescription>
                  Connect using ESPN cookies
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      className="w-full bg-red-500 hover:bg-red-600"
                      disabled={connections.find(c => c.platform === 'ESPN') !== undefined}
                    >
                      {connections.find(c => c.platform === 'ESPN') ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Connected
                        </>
                      ) : (
                        <>
                          <Link className="h-4 w-4 mr-2" />
                          Connect ESPN
                        </>
                      )}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Connect ESPN Fantasy</DialogTitle>
                      <DialogDescription>
                        Follow these steps to get your ESPN cookies
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <ol className="text-sm space-y-2">
                        <li>1. Log in to ESPN Fantasy in your browser</li>
                        <li>2. Open Developer Tools (F12)</li>
                        <li>3. Go to Application → Cookies</li>
                        <li>4. Find and copy espn_s2 and SWID values</li>
                      </ol>
                      <div className="space-y-2">
                        <div>
                          <Label htmlFor="espn_s2">espn_s2</Label>
                          <Input
                            id="espn_s2"
                            placeholder="AEB..."
                            value={espnCookies.espn_s2}
                            onChange={(e) => setEspnCookies({
                              ...espnCookies,
                              espn_s2: e.target.value
                            })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="SWID">SWID</Label>
                          <Input
                            id="SWID"
                            placeholder="{XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX}"
                            value={espnCookies.SWID}
                            onChange={(e) => setEspnCookies({
                              ...espnCookies,
                              SWID: e.target.value
                            })}
                          />
                        </div>
                      </div>
                      <Button 
                        onClick={connectESPN}
                        disabled={connecting === 'ESPN'}
                        className="w-full"
                      >
                        {connecting === 'ESPN' ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Shield className="h-4 w-4 mr-2" />
                        )}
                        Connect ESPN
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>

            {/* Sleeper */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Sleeper</CardTitle>
                  <Badge className="bg-orange-500">Username</Badge>
                </div>
                <CardDescription>
                  Connect using username
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      className="w-full bg-orange-500 hover:bg-orange-600"
                      disabled={connections.find(c => c.platform === 'SLEEPER') !== undefined}
                    >
                      {connections.find(c => c.platform === 'SLEEPER') ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Connected
                        </>
                      ) : (
                        <>
                          <Link className="h-4 w-4 mr-2" />
                          Connect Sleeper
                        </>
                      )}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Connect Sleeper</DialogTitle>
                      <DialogDescription>
                        Enter your Sleeper username
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="username">Sleeper Username</Label>
                        <Input
                          id="username"
                          placeholder="your_username"
                          value={sleeperUsername}
                          onChange={(e) => setSleeperUsername(e.target.value)}
                        />
                      </div>
                      <Button 
                        onClick={connectSleeper}
                        disabled={connecting === 'Sleeper'}
                        className="w-full"
                      >
                        {connecting === 'Sleeper' ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Users className="h-4 w-4 mr-2" />
                        )}
                        Connect Sleeper
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>🚀 Why Connect Your Leagues?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Brain className="h-5 w-5 text-primary mt-1" />
                <div>
                  <h4 className="font-medium">AI-Powered Predictions</h4>
                  <p className="text-sm text-muted-foreground">
                    Get personalized player projections based on your actual roster
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <Activity className="h-5 w-5 text-primary mt-1" />
                <div>
                  <h4 className="font-medium">Injury Risk Monitoring</h4>
                  <p className="text-sm text-muted-foreground">
                    Real-time alerts for your players with 98.8% accuracy
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <TrendingUp className="h-5 w-5 text-primary mt-1" />
                <div>
                  <h4 className="font-medium">Trade & Lineup Optimization</h4>
                  <p className="text-sm text-muted-foreground">
                    ML-powered recommendations specific to your league settings
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}