'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Brain, Zap, Crown, Shield, TrendingUp, Users, 
  BarChart3, MessageSquare, Mic, Bell, Download, 
  Sparkles, Lock, ChevronRight, Star
} from 'lucide-react';
import { AICoachPro } from '@/components/premium/AICoachPro';
import { DFSOptimizer } from '@/components/premium/DFSOptimizer';
import { FeatureGate, FeatureBadge } from '@/components/subscription/FeatureGate';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { SubscriptionProvider } from '@/contexts/SubscriptionContext';
import { FEATURES, getFeaturesByCategory } from '@/lib/subscription/feature-gates';

function PremiumFeaturesContent() {
  const { tier, loading } = useSubscription();
  const [activeTab, setActiveTab] = useState('ai-coach');

  const featureCategories = [
    { id: 'AI', name: 'AI & Machine Learning', icon: Brain },
    { id: 'DATA', name: 'Real-Time Data', icon: Zap },
    { id: 'ANALYTICS', name: 'Advanced Analytics', icon: BarChart3 },
    { id: 'TOOLS', name: 'Pro Tools', icon: Shield },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold flex items-center gap-3">
              <Crown className="h-8 w-8 text-primary" />
              Premium Features
            </h1>
            <p className="text-xl text-muted-foreground mt-2">
              Unlock the full power of Fantasy.AI with advanced tools
            </p>
          </div>
          <Badge variant="outline" className="text-lg px-4 py-2">
            Your Tier: {tier}
          </Badge>
        </div>

        {tier === 'FREE' && (
          <Alert className="border-primary/50 bg-primary/5">
            <Sparkles className="h-4 w-4" />
            <AlertDescription>
              You're currently on the Free plan. Upgrade to access premium features and dominate your leagues!
            </AlertDescription>
            <Button className="mt-2" onClick={() => window.location.href = '/pricing'}>
              View Pricing Plans
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </Alert>
        )}
      </div>

      {/* Feature Categories */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {featureCategories.map((category) => {
          const features = getFeaturesByCategory(category.id as any);
          const unlockedCount = features.filter(f => 
            tier === 'ELITE' || (tier === 'PRO' && f.requiredTier !== 'ELITE') || (tier === 'FREE' && f.requiredTier === 'FREE')
          ).length;
          
          return (
            <Card key={category.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <category.icon className="h-8 w-8 text-primary" />
                  <Badge variant="secondary">
                    {unlockedCount}/{features.length}
                  </Badge>
                </div>
                <CardTitle className="text-lg mt-2">{category.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {features.slice(0, 3).map((feature) => (
                    <div key={feature.id} className="flex items-center justify-between text-sm">
                      <span className="truncate">{feature.name}</span>
                      <FeatureBadge featureId={feature.id} />
                    </div>
                  ))}
                  {features.length > 3 && (
                    <p className="text-xs text-muted-foreground">
                      +{features.length - 3} more features
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Premium Features Showcase */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="ai-coach">AI Coach Pro</TabsTrigger>
          <TabsTrigger value="dfs">DFS Optimizer</TabsTrigger>
          <TabsTrigger value="analytics">Analytics Hub</TabsTrigger>
          <TabsTrigger value="tools">Pro Tools</TabsTrigger>
        </TabsList>

        <TabsContent value="ai-coach">
          <AICoachPro />
        </TabsContent>

        <TabsContent value="dfs">
          <DFSOptimizer />
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-6 w-6" />
                Advanced Analytics Hub
              </CardTitle>
              <CardDescription>
                Deep dive into player performance, trends, and projections
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FeatureGate featureId="ADVANCED_ANALYTICS">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Player Trends</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-48 bg-muted/50 rounded flex items-center justify-center">
                        <p className="text-muted-foreground">Interactive trend charts</p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Matchup Analysis</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-48 bg-muted/50 rounded flex items-center justify-center">
                        <p className="text-muted-foreground">Advanced matchup data</p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">
                        <FeatureGate featureId="OWNERSHIP_PROJECTIONS" showUpgradePrompt={false}>
                          <span className="flex items-center gap-2">
                            Ownership Projections
                            <Badge variant="outline" className="text-xs">Elite</Badge>
                          </span>
                        </FeatureGate>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <FeatureGate featureId="OWNERSHIP_PROJECTIONS">
                        <div className="h-48 bg-muted/50 rounded flex items-center justify-center">
                          <p className="text-muted-foreground">Tournament ownership data</p>
                        </div>
                      </FeatureGate>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Performance Metrics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-48 bg-muted/50 rounded flex items-center justify-center">
                        <p className="text-muted-foreground">Advanced metrics</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </FeatureGate>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tools">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Voice Assistant */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mic className="h-5 w-5" />
                  Voice Assistant
                </CardTitle>
                <CardDescription>
                  "Hey Fantasy" - Your AI-powered voice companion
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FeatureGate featureId="VOICE_ASSISTANT">
                  <div className="space-y-4">
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm font-medium mb-2">Try saying:</p>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        <li>• "Hey Fantasy, who should I start at QB?"</li>
                        <li>• "What's the weather for tonight's game?"</li>
                        <li>• "Any injury updates for my team?"</li>
                      </ul>
                    </div>
                    <Button className="w-full">
                      <Mic className="h-4 w-4 mr-2" />
                      Activate Voice Assistant
                    </Button>
                  </div>
                </FeatureGate>
              </CardContent>
            </Card>

            {/* Custom Alerts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Custom Alerts
                </CardTitle>
                <CardDescription>
                  Real-time notifications for your players
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FeatureGate featureId="CUSTOM_ALERTS">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 border rounded">
                        <span className="text-sm">Injury Updates</span>
                        <Badge variant="default">SMS + Email</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded">
                        <span className="text-sm">Trade Alerts</span>
                        <Badge variant="default">Push</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded">
                        <span className="text-sm">Lineup Locks</span>
                        <Badge variant="default">All Channels</Badge>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full">
                      Configure Alerts
                    </Button>
                  </div>
                </FeatureGate>
              </CardContent>
            </Card>

            {/* Export Tools */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Export Tools
                </CardTitle>
                <CardDescription>
                  Export data and integrate with your workflow
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FeatureGate featureId="EXPORT_TOOLS">
                  <div className="space-y-3">
                    <Button variant="outline" className="w-full justify-start">
                      <Download className="h-4 w-4 mr-2" />
                      Export to CSV
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Download className="h-4 w-4 mr-2" />
                      Export to Google Sheets
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Download className="h-4 w-4 mr-2" />
                      API Integration
                    </Button>
                  </div>
                </FeatureGate>
              </CardContent>
            </Card>

            {/* API Access */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  API Access
                </CardTitle>
                <CardDescription>
                  Programmatic access to Fantasy.AI
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FeatureGate featureId="API_ACCESS">
                  <div className="space-y-4">
                    <div className="p-4 bg-muted/50 rounded-lg font-mono text-xs">
                      GET /api/v1/players/projections<br />
                      POST /api/v1/lineups/optimize<br />
                      GET /api/v1/ml/predictions
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        API Calls Remaining
                      </span>
                      <Badge>9,847 / 10,000</Badge>
                    </div>
                    <Button variant="outline" className="w-full">
                      View API Documentation
                    </Button>
                  </div>
                </FeatureGate>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Upgrade CTA */}
      {tier !== 'ELITE' && (
        <Card className="mt-8 bg-gradient-to-r from-primary/10 to-primary/5">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <Star className="h-12 w-12 text-primary mx-auto" />
              <h3 className="text-2xl font-bold">
                {tier === 'FREE' ? 'Unlock Premium Features' : 'Upgrade to Elite'}
              </h3>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                {tier === 'FREE' 
                  ? 'Join thousands of winners using Fantasy.AI Pro to dominate their leagues'
                  : 'Get access to all features including API access, unlimited lineups, and more'
                }
              </p>
              <Button size="lg" onClick={() => window.location.href = '/pricing'}>
                View Upgrade Options
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function PremiumPage() {
  return (
    <SubscriptionProvider>
      <PremiumFeaturesContent />
    </SubscriptionProvider>
  );
}