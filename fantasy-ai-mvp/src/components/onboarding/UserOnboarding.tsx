"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { 
  ChevronRight, 
  ChevronLeft,
  CheckCircle, 
  Star, 
  Globe, 
  Zap,
  Crown,
  Users,
  Trophy,
  Brain,
  Smartphone,
  Shield,
  ArrowRight,
  ExternalLink,
  Database,
  Activity,
  Target,
  Rocket
} from "lucide-react";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  component: React.ReactNode;
}

interface LeagueImportProps {
  platform: string;
  logo: string;
  color: string;
  features: string[];
  connectionStatus: 'available' | 'connected' | 'premium';
  onConnect: () => void;
  connecting?: string | null;
}

function LeagueImportCard({ platform, logo, color, features, connectionStatus, onConnect, connecting }: LeagueImportProps) {
  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-400 bg-green-900/20 border-green-500/30';
      case 'premium': return 'text-yellow-400 bg-yellow-900/20 border-yellow-500/30';
      default: return 'text-blue-400 bg-blue-900/20 border-blue-500/30';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Connected ✓';
      case 'premium': return 'Pro Feature';
      default: return 'Connect Now';
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -5 }}
      whileTap={{ scale: 0.98 }}
      className="group cursor-pointer"
    >
      <GlassCard className="p-6 h-full hover:glow-md transition-all duration-300">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl bg-gradient-to-br ${color}`}>
              {logo}
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">{platform}</h3>
              <p className="text-sm text-gray-400">Fantasy Platform</p>
            </div>
          </div>
          
          {connectionStatus === 'connected' && (
            <CheckCircle className="w-6 h-6 text-green-400" />
          )}
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-400 mb-3">Import Features:</p>
          <div className="space-y-2">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-gray-300">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={onConnect}
          disabled={connectionStatus === 'connected' || connecting === platform.toLowerCase().split(' ')[0]}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
            connectionStatus === 'connected'
              ? 'bg-green-900/20 border border-green-500/30 text-green-400 cursor-default'
              : connecting === platform.toLowerCase().split(' ')[0]
              ? 'bg-gray-700/50 border border-gray-500/30 text-gray-400 cursor-wait'
              : connectionStatus === 'premium'
              ? 'bg-gradient-to-r from-yellow-600 to-yellow-500 text-white hover:shadow-lg'
              : 'bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:shadow-lg hover:scale-105'
          }`}
        >
          {connectionStatus === 'connected' ? (
            <div className="flex items-center justify-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Connected Successfully
            </div>
          ) : connecting === platform.toLowerCase().split(' ')[0] ? (
            <div className="flex items-center justify-center gap-2">
              <Activity className="w-5 h-5 animate-spin" />
              Connecting...
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <ExternalLink className="w-5 h-5" />
              {getStatusText()}
            </div>
          )}
        </button>

        {connectionStatus === 'premium' && (
          <p className="text-xs text-yellow-400 mt-2 text-center">
            ⭐ Premium subscription required
          </p>
        )}
      </GlassCard>
    </motion.div>
  );
}

function WelcomeStep() {
  return (
    <div className="text-center space-y-6">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", duration: 0.6 }}
        className="w-24 h-24 bg-gradient-to-br from-neon-blue to-neon-purple rounded-full flex items-center justify-center mx-auto"
      >
        <Rocket className="w-12 h-12 text-white" />
      </motion.div>
      
      <div>
        <h2 className="text-4xl font-bold bg-gradient-to-r from-neon-blue to-neon-purple bg-clip-text text-transparent mb-4">
          Welcome to Fantasy.AI
        </h2>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          The world's most advanced fantasy sports platform powered by AI, real-time data, and 24 MCP servers
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="text-center p-4">
          <div className="w-12 h-12 bg-gradient-to-br from-neon-green/20 to-neon-cyan/20 rounded-lg flex items-center justify-center mx-auto mb-3">
            <Database className="w-6 h-6 text-neon-green" />
          </div>
          <h3 className="font-semibold text-white mb-2">537+ Data Sources</h3>
          <p className="text-sm text-gray-400">Real-time data from ESPN, Yahoo, CBS, BBC, and more</p>
        </div>
        
        <div className="text-center p-4">
          <div className="w-12 h-12 bg-gradient-to-br from-neon-purple/20 to-neon-pink/20 rounded-lg flex items-center justify-center mx-auto mb-3">
            <Brain className="w-6 h-6 text-neon-purple" />
          </div>
          <h3 className="font-semibold text-white mb-2">AI-Powered Insights</h3>
          <p className="text-sm text-gray-400">7 AI models analyzing every play, injury, and trend</p>
        </div>
        
        <div className="text-center p-4">
          <div className="w-12 h-12 bg-gradient-to-br from-neon-yellow/20 to-neon-orange/20 rounded-lg flex items-center justify-center mx-auto mb-3">
            <Crown className="w-6 h-6 text-neon-yellow" />
          </div>
          <h3 className="font-semibold text-white mb-2">Competitive Edge</h3>
          <p className="text-sm text-gray-400">10x more data than DraftKings, 340% faster processing</p>
        </div>
      </div>
    </div>
  );
}

function LeagueImportStep() {
  const [connections, setConnections] = useState({
    yahoo: 'available',
    espn: 'available',
    cbs: 'available',
    sleeper: 'available',
    nfl: 'premium',
    draftkings: 'premium'
  });
  const [connecting, setConnecting] = useState<string | null>(null);
  const [leagues, setLeagues] = useState<any[]>([]);

  const handleConnect = async (platform: string) => {
    setConnecting(platform);
    
    try {
      // For premium platforms, show upgrade message
      if (connections[platform as keyof typeof connections] === 'premium') {
        alert(`${platform} integration requires Fantasy.AI Pro subscription. Upgrade to connect!`);
        setConnecting(null);
        return;
      }

      // Check if we're in development mode - simulate connection
      if (process.env.NODE_ENV === 'development') {
        // Simulate OAuth flow delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Mock successful connection
        setConnections(prev => ({ ...prev, [platform]: 'connected' }));
        
        // Mock league data
        const mockLeagues = [
          {
            id: `${platform}_league_1`,
            name: `${platform.charAt(0).toUpperCase() + platform.slice(1)} Championship`,
            platform,
            sport: 'NFL',
            totalTeams: 12,
            userTeam: { name: 'AI Powered Squad', wins: 9, losses: 4, rank: 2 }
          }
        ];
        setLeagues(prev => [...prev, ...mockLeagues]);
        
        console.log(`✅ Connected to ${platform} (Development Mode)`);
      } else {
        // Production OAuth flow
        const response = await fetch('/api/leagues/connect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ platform, userId: 'user_123' })
        });

        const data = await response.json();
        if (data.success && data.authUrl) {
          // Redirect to OAuth provider
          window.location.href = data.authUrl;
        } else {
          throw new Error(data.error || 'Failed to initiate connection');
        }
      }
    } catch (error) {
      console.error(`Failed to connect to ${platform}:`, error);
      alert(`Failed to connect to ${platform}. Please try again.`);
    } finally {
      setConnecting(null);
    }
  };

  const platformConfigs = [
    {
      platform: "Yahoo Fantasy",
      logo: "🏈",
      color: "from-purple-600 to-purple-400",
      features: ["League Import", "Roster Sync", "Trade Alerts", "Waiver Wire"],
      connectionStatus: connections.yahoo as any,
      onConnect: () => handleConnect('yahoo')
    },
    {
      platform: "ESPN Fantasy",
      logo: "⚽",
      color: "from-red-600 to-red-400",
      features: ["League Data", "Player News", "Projections", "Lineup Optimizer"],
      connectionStatus: connections.espn as any,
      onConnect: () => handleConnect('espn')
    },
    {
      platform: "CBS Sports",
      logo: "🏀",
      color: "from-blue-600 to-blue-400",
      features: ["Expert Analysis", "Player Rankings", "Trade Assistant", "Injury Reports"],
      connectionStatus: connections.cbs as any,
      onConnect: () => handleConnect('cbs')
    },
    {
      platform: "Sleeper",
      logo: "⚾",
      color: "from-green-600 to-green-400",
      features: ["Dynasty Leagues", "Draft Tools", "Social Features", "Custom Scoring"],
      connectionStatus: connections.sleeper as any,
      onConnect: () => handleConnect('sleeper')
    },
    {
      platform: "NFL.com",
      logo: "🏆",
      color: "from-blue-800 to-blue-600",
      features: ["Official NFL Data", "Real-time Updates", "Video Highlights", "Advanced Stats"],
      connectionStatus: connections.nfl as any,
      onConnect: () => handleConnect('nfl')
    },
    {
      platform: "DraftKings",
      logo: "💎",
      color: "from-orange-600 to-orange-400",
      features: ["DFS Integration", "Contest Data", "Salary Info", "Ownership %"],
      connectionStatus: connections.draftkings as any,
      onConnect: () => handleConnect('draftkings')
    }
  ];

  const connectedCount = Object.values(connections).filter(status => status === 'connected').length;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-4">Connect Your Fantasy Leagues</h2>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Import your existing leagues and let Fantasy.AI supercharge your strategy with real-time insights
        </p>
        
        <div className="mt-4 p-4 bg-gradient-to-r from-neon-blue/10 to-neon-purple/10 rounded-lg border border-white/5 inline-block">
          <div className="flex items-center gap-2 text-sm">
            <Activity className="w-4 h-4 text-green-400" />
            <span className="text-white font-medium">{connectedCount}/6 Platforms Connected</span>
            <span className="text-gray-400">• Secure OAuth Integration</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {platformConfigs.map((league, index) => (
          <motion.div
            key={league.platform}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <LeagueImportCard {...league} connecting={connecting} />
          </motion.div>
        ))}
      </div>

      {connectedCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center p-6 bg-gradient-to-r from-green-900/20 to-blue-900/20 rounded-lg border border-green-500/30"
        >
          <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-3" />
          <h3 className="text-xl font-bold text-green-400 mb-2">
            🎉 Connected Successfully!
          </h3>
          <p className="text-gray-300">
            Your leagues are now being analyzed by our AI systems. Get ready for next-level insights!
          </p>
        </motion.div>
      )}
    </div>
  );
}

function FeaturesStep() {
  const features = [
    {
      icon: <Brain className="w-8 h-8 text-neon-purple" />,
      title: "AI-Powered Analytics",
      description: "7 AI models analyzing every player, matchup, and trend in real-time",
      stats: "340% faster than competitors"
    },
    {
      icon: <Globe className="w-8 h-8 text-neon-blue" />,
      title: "Global Data Network",
      description: "537+ data sources from ESPN, Yahoo, BBC, TSN, and international sports",
      stats: "13+ countries covered"
    },
    {
      icon: <Zap className="w-8 h-8 text-neon-yellow" />,
      title: "Real-Time Updates",
      description: "30-second data refresh with instant injury alerts and news updates",
      stats: "Live data pipeline"
    },
    {
      icon: <Target className="w-8 h-8 text-neon-green" />,
      title: "Lineup Optimization",
      description: "AI-driven lineup recommendations with matchup analysis and projections",
      stats: "23% higher accuracy"
    },
    {
      icon: <Smartphone className="w-8 h-8 text-neon-pink" />,
      title: "Mobile Experience",
      description: "Native iOS/Android apps with voice assistant and AR features",
      stats: "Coming to app stores"
    },
    {
      icon: <Shield className="w-8 h-8 text-neon-cyan" />,
      title: "Legal & Secure",
      description: "100% legal fantasy sports with enterprise-grade security",
      stats: "Fully compliant"
    }
  ];

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-4">Unlock Premium Features</h2>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Experience the most advanced fantasy sports platform with features that give you a competitive edge
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {features.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <GlassCard className="p-6 h-full hover:glow-sm transition-all duration-300">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  {feature.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-gray-400 mb-3">{feature.description}</p>
                  <div className="inline-block px-3 py-1 bg-gradient-to-r from-neon-blue/20 to-neon-purple/20 rounded-full border border-white/10">
                    <span className="text-sm font-medium text-neon-blue">{feature.stats}</span>
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      <div className="text-center">
        <GlassCard className="p-6 bg-gradient-to-r from-neon-blue/5 to-neon-purple/5">
          <Crown className="w-12 h-12 text-neon-yellow mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-white mb-2">Ready to Dominate?</h3>
          <p className="text-gray-400 mb-4">
            Join thousands of users who've increased their win rate by 78% with Fantasy.AI
          </p>
          <div className="flex items-center justify-center gap-4 text-sm text-gray-300">
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>10,000+ Active Users</span>
            </div>
            <div className="flex items-center gap-1">
              <Trophy className="w-4 h-4" />
              <span>78% Win Rate Improvement</span>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

export function UserOnboarding({ onComplete }: { onComplete: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);
  
  const steps: OnboardingStep[] = [
    {
      id: "welcome",
      title: "Welcome",
      description: "Welcome to the future of fantasy sports",
      icon: <Rocket className="w-6 h-6" />,
      component: <WelcomeStep />
    },
    {
      id: "leagues",
      title: "Connect Leagues",
      description: "Import your existing fantasy leagues",
      icon: <Globe className="w-6 h-6" />,
      component: <LeagueImportStep />
    },
    {
      id: "features",
      title: "Features",
      description: "Discover powerful AI features",
      icon: <Brain className="w-6 h-6" />,
      component: <FeaturesStep />
    }
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="min-h-screen bg-background cyber-grid flex items-center justify-center p-6">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-48 -left-48 w-96 h-96 bg-neon-blue/10 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-48 -right-48 w-96 h-96 bg-neon-purple/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />
      </div>

      <div className="relative z-10 w-full max-w-6xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                    index <= currentStep
                      ? "bg-gradient-to-r from-neon-blue to-neon-purple border-neon-blue text-white"
                      : "border-gray-600 text-gray-400"
                  }`}
                >
                  {index < currentStep ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    step.icon
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`h-1 w-20 mx-2 rounded transition-all ${
                      index < currentStep ? "bg-gradient-to-r from-neon-blue to-neon-purple" : "bg-gray-600"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          
          <div className="text-center">
            <h1 className="text-xl font-semibold text-white">
              {steps[currentStep].title}
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              {steps[currentStep].description}
            </p>
          </div>
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="mb-8"
          >
            {steps[currentStep].component}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
              currentStep === 0
                ? "text-gray-500 cursor-not-allowed"
                : "text-gray-300 hover:text-white hover:bg-gray-800/50"
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
            Previous
          </button>

          <div className="text-sm text-gray-400">
            Step {currentStep + 1} of {steps.length}
          </div>

          <NeonButton
            onClick={nextStep}
            className="flex items-center gap-2"
          >
            {currentStep === steps.length - 1 ? (
              <>
                <Rocket className="w-5 h-5" />
                Get Started
              </>
            ) : (
              <>
                Next
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </NeonButton>
        </div>
      </div>
    </div>
  );
}