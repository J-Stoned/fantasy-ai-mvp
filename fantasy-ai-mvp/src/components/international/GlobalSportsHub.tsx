"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import {
  Globe,
  TrendingUp,
  Users,
  Target,
  Zap,
  Brain,
  Star,
  Trophy,
  Clock,
  Activity,
  BarChart3,
  Map,
  Languages,
  Wifi,
  Database,
  Search,
  Eye,
  Flame,
  Crown,
  Shield,
  ChevronRight
} from "lucide-react";

interface GlobalSport {
  id: string;
  name: string;
  region: string;
  playerCount: number;
  marketSize: string;
  flag: string;
  primaryLanguage: string;
  currency: string;
  features: string[];
  launchStatus: 'live' | 'beta' | 'planned';
  mcpTools: string[];
}

interface MCPInsight {
  service: string;
  insight: string;
  confidence: number;
  dataPoints: number;
  lastUpdated: Date;
}

interface MarketAnalysis {
  region: string;
  penetration: number;
  growth: number;
  competition: string;
  opportunity: string;
  revenue: string;
}

export function GlobalSportsHub() {
  const [selectedSport, setSelectedSport] = useState<string>('soccer');
  const [mcpInsights, setMcpInsights] = useState<MCPInsight[]>([]);
  const [marketData, setMarketData] = useState<MarketAnalysis[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [liveMetrics, setLiveMetrics] = useState<any>({});

  const globalSports: GlobalSport[] = [
    {
      id: 'soccer',
      name: 'Soccer/Football',
      region: 'Global',
      playerCount: 4200000,
      marketSize: '$2.8B',
      flag: '🌍',
      primaryLanguage: 'Multi-language',
      currency: 'Multi-currency',
      features: ['Premier League', 'Champions League', 'World Cup', 'MLS', 'La Liga'],
      launchStatus: 'planned',
      mcpTools: ['Firecrawl', 'Chart Visualization', 'Knowledge Graph', 'Memory']
    },
    {
      id: 'cricket',
      name: 'Cricket',
      region: 'India/Australia/UK',
      playerCount: 2800000,
      marketSize: '$1.9B',
      flag: '🏏',
      primaryLanguage: 'English/Hindi',
      currency: 'INR/USD/GBP',
      features: ['IPL', 'The Hundred', 'Big Bash', 'World Cup', 'Test Cricket'],
      launchStatus: 'planned',
      mcpTools: ['Firecrawl', 'Sequential Thinking', 'PostgreSQL', 'Playwright']
    },
    {
      id: 'rugby',
      name: 'Rugby',
      region: 'Australia/UK/France',
      playerCount: 850000,
      marketSize: '$650M',
      flag: '🏉',
      primaryLanguage: 'English/French',
      currency: 'AUD/GBP/EUR',
      features: ['NRL', 'Super Rugby', 'Six Nations', 'Rugby World Cup'],
      launchStatus: 'beta',
      mcpTools: ['Knowledge Graph', 'Chart Visualization', 'Memory']
    },
    {
      id: 'afl',
      name: 'Australian Football',
      region: 'Australia',
      playerCount: 650000,
      marketSize: '$485M',
      flag: '🇦🇺',
      primaryLanguage: 'English',
      currency: 'AUD',
      features: ['AFL Premier', 'AFLW', 'Finals Series', 'Brownlow Medal'],
      launchStatus: 'beta',
      mcpTools: ['Firecrawl', 'Chart Visualization', 'SQLite']
    },
    {
      id: 'f1',
      name: 'Formula 1',
      region: 'Global',
      playerCount: 450000,
      marketSize: '$380M',
      flag: '🏎️',
      primaryLanguage: 'Multi-language',
      currency: 'Multi-currency',
      features: ['Grand Prix', 'Sprint Races', 'Constructor Championship', 'Driver Championship'],
      launchStatus: 'live',
      mcpTools: ['Firecrawl', 'Sequential Thinking', 'Chart Visualization']
    },
    {
      id: 'tennis',
      name: 'Tennis',
      region: 'Global',
      playerCount: 1200000,
      marketSize: '$920M',
      flag: '🎾',
      primaryLanguage: 'Multi-language',
      currency: 'Multi-currency',
      features: ['Grand Slams', 'ATP Tour', 'WTA Tour', 'Masters 1000'],
      launchStatus: 'planned',
      mcpTools: ['Knowledge Graph', 'Memory', 'PostgreSQL']
    },
    {
      id: 'esports',
      name: 'Esports',
      region: 'Global',
      playerCount: 3800000,
      marketSize: '$3.2B',
      flag: '🎮',
      primaryLanguage: 'Multi-language',
      currency: 'Multi-currency',
      features: ['League of Legends', 'CS2', 'Valorant', 'Dota 2', 'Fortnite'],
      launchStatus: 'beta',
      mcpTools: ['Firecrawl', 'Playwright', 'Knowledge Graph', 'Sequential Thinking']
    }
  ];

  useEffect(() => {
    generateMCPInsights();
    generateMarketAnalysis();
    updateLiveMetrics();
    
    const interval = setInterval(updateLiveMetrics, 5000);
    return () => clearInterval(interval);
  }, [selectedSport]);

  const generateMCPInsights = async () => {
    setIsAnalyzing(true);
    
    // Simulate MCP-powered insights using our 22 servers
    const insights: MCPInsight[] = [
      {
        service: 'Firecrawl MCP',
        insight: 'Scraped 847 fantasy cricket sites - IPL player ownership patterns show 340% YoY growth in international markets',
        confidence: 94,
        dataPoints: 2847392,
        lastUpdated: new Date()
      },
      {
        service: 'Knowledge Graph MCP',
        insight: 'Identified 2,847 player relationships across global leagues - key injury correlations detected for soccer players',
        confidence: 89,
        dataPoints: 184729,
        lastUpdated: new Date()
      },
      {
        service: 'Sequential Thinking MCP',
        insight: 'Multi-step analysis suggests prioritizing APAC markets first - 67% higher conversion rates than EMEA',
        confidence: 92,
        dataPoints: 94738,
        lastUpdated: new Date()
      },
      {
        service: 'Chart Visualization MCP',
        insight: 'Generated 40+ market visualization models - F1 fantasy shows strongest weekend engagement patterns',
        confidence: 88,
        dataPoints: 847392,
        lastUpdated: new Date()
      },
      {
        service: 'Memory MCP',
        insight: 'Stored 400K+ user preference patterns - Cricket users 3x more likely to engage with multiple sports',
        confidence: 96,
        dataPoints: 400127,
        lastUpdated: new Date()
      }
    ];
    
    setMcpInsights(insights);
    setIsAnalyzing(false);
  };

  const generateMarketAnalysis = async () => {
    const analysis: MarketAnalysis[] = [
      {
        region: 'India/South Asia',
        penetration: 23,
        growth: 89,
        competition: 'Dream11, MPL, FanCode',
        opportunity: 'Cricket-first expansion with IPL focus',
        revenue: '$1.2B TAM'
      },
      {
        region: 'Australia/New Zealand',
        penetration: 45,
        growth: 34,
        competition: 'Draftstars, PlayON, Moneyball',
        opportunity: 'AFL/NRL dominance with cricket crossover',
        revenue: '$485M TAM'
      },
      {
        region: 'Europe/UK',
        penetration: 38,
        growth: 67,
        competition: 'FanTeam, Sorare, Fantasy Premier League',
        opportunity: 'Soccer-centric with F1 and tennis expansion',
        revenue: '$1.8B TAM'
      },
      {
        region: 'Global Esports',
        penetration: 12,
        growth: 156,
        competition: 'DraftKings, FanDuel (limited), Challengermode',
        opportunity: 'First-mover advantage in fantasy esports',
        revenue: '$3.2B TAM'
      }
    ];
    
    setMarketData(analysis);
  };

  const updateLiveMetrics = () => {
    setLiveMetrics({
      totalUsers: Math.floor(Math.random() * 10000) + 4870000,
      activeMarkets: 47,
      dataPointsProcessed: Math.floor(Math.random() * 100000) + 2847392,
      mcpServersActive: 22,
      uptime: 99.97,
      revenueToday: Math.floor(Math.random() * 10000) + 84700
    });
  };

  const selectedSportData = globalSports.find(sport => sport.id === selectedSport);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-neon-blue to-neon-green rounded-3xl flex items-center justify-center mx-auto">
            <Globe className="w-10 h-10 text-white" />
          </div>
          
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Global Sports Expansion</h1>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Powered by 22 MCP servers, Fantasy.AI is expanding beyond American sports to capture 
              the global fantasy market with AI-first international experiences.
            </p>
          </div>
        </motion.div>
      </div>

      {/* Live Metrics Dashboard */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Live Global Metrics</h2>
          <div className="flex items-center gap-2 text-neon-green">
            <Activity className="w-4 h-4 animate-pulse" />
            <span className="text-sm">Real-time MCP Data</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="text-center p-4 bg-white/5 rounded-lg">
            <div className="text-2xl font-bold text-white">{liveMetrics.totalUsers?.toLocaleString()}</div>
            <div className="text-xs text-gray-400">Global Users</div>
          </div>
          
          <div className="text-center p-4 bg-white/5 rounded-lg">
            <div className="text-2xl font-bold text-neon-blue">{liveMetrics.activeMarkets}</div>
            <div className="text-xs text-gray-400">Active Markets</div>
          </div>
          
          <div className="text-center p-4 bg-white/5 rounded-lg">
            <div className="text-2xl font-bold text-neon-green">{liveMetrics.dataPointsProcessed?.toLocaleString()}</div>
            <div className="text-xs text-gray-400">Data Points/Hr</div>
          </div>
          
          <div className="text-center p-4 bg-white/5 rounded-lg">
            <div className="text-2xl font-bold text-yellow-400">{liveMetrics.mcpServersActive}/22</div>
            <div className="text-xs text-gray-400">MCP Servers</div>
          </div>
          
          <div className="text-center p-4 bg-white/5 rounded-lg">
            <div className="text-2xl font-bold text-white">{liveMetrics.uptime}%</div>
            <div className="text-xs text-gray-400">Uptime</div>
          </div>
          
          <div className="text-center p-4 bg-white/5 rounded-lg">
            <div className="text-2xl font-bold text-neon-green">${liveMetrics.revenueToday?.toLocaleString()}</div>
            <div className="text-xs text-gray-400">Revenue Today</div>
          </div>
        </div>
      </GlassCard>

      {/* Sports Selection */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white">International Sports Portfolio</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {globalSports.map((sport) => (
            <motion.div
              key={sport.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <GlassCard 
                className={`p-4 cursor-pointer transition-all border-2 ${
                  selectedSport === sport.id 
                    ? 'border-neon-blue bg-neon-blue/10' 
                    : 'border-white/10 hover:border-neon-blue/50'
                }`}
                onClick={() => setSelectedSport(sport.id)}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-2xl">{sport.flag}</div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      sport.launchStatus === 'live' ? 'bg-neon-green/20 text-neon-green' :
                      sport.launchStatus === 'beta' ? 'bg-yellow-400/20 text-yellow-400' :
                      'bg-gray-400/20 text-gray-400'
                    }`}>
                      {sport.launchStatus.toUpperCase()}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-white">{sport.name}</h3>
                    <p className="text-xs text-gray-400">{sport.region}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <div className="text-white font-medium">{sport.playerCount.toLocaleString()}</div>
                      <div className="text-gray-400">Players</div>
                    </div>
                    <div>
                      <div className="text-white font-medium">{sport.marketSize}</div>
                      <div className="text-gray-400">Market</div>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-1">
                    {sport.mcpTools.slice(0, 2).map((tool, index) => (
                      <span key={index} className="px-2 py-1 text-xs bg-neon-blue/20 text-neon-blue rounded-full">
                        {tool}
                      </span>
                    ))}
                    {sport.mcpTools.length > 2 && (
                      <span className="px-2 py-1 text-xs bg-white/10 text-gray-400 rounded-full">
                        +{sport.mcpTools.length - 2}
                      </span>
                    )}
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Selected Sport Details */}
      {selectedSportData && (
        <motion.div
          key={selectedSport}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {/* Sport Overview */}
          <GlassCard className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-3xl">{selectedSportData.flag}</div>
              <div>
                <h3 className="text-xl font-bold text-white">{selectedSportData.name}</h3>
                <p className="text-gray-400">{selectedSportData.region}</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-white/5 rounded-lg">
                  <div className="text-lg font-bold text-white">{selectedSportData.playerCount.toLocaleString()}</div>
                  <div className="text-xs text-gray-400">Active Players</div>
                </div>
                <div className="p-3 bg-white/5 rounded-lg">
                  <div className="text-lg font-bold text-neon-green">{selectedSportData.marketSize}</div>
                  <div className="text-xs text-gray-400">Market Size</div>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-white mb-2">Key Features</h4>
                <div className="space-y-1">
                  {selectedSportData.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-gray-300">
                      <Star className="w-3 h-3 text-neon-blue" />
                      {feature}
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-white mb-2">MCP Tools Powering This Sport</h4>
                <div className="grid grid-cols-2 gap-2">
                  {selectedSportData.mcpTools.map((tool, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-neon-blue/10 rounded text-xs text-neon-blue">
                      <Zap className="w-3 h-3" />
                      {tool} MCP
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </GlassCard>

          {/* MCP Insights */}
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">MCP AI Insights</h3>
              {isAnalyzing && (
                <div className="flex items-center gap-2 text-neon-blue">
                  <Brain className="w-4 h-4 animate-pulse" />
                  <span className="text-xs">Analyzing...</span>
                </div>
              )}
            </div>
            
            <div className="space-y-4">
              {mcpInsights.map((insight, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 bg-white/5 rounded-lg border-l-2 border-neon-blue"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-neon-blue">{insight.service}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">{insight.confidence}% confidence</span>
                      <div className="text-xs text-gray-400">{insight.dataPoints.toLocaleString()} data points</div>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-300">{insight.insight}</p>
                  
                  <div className="text-xs text-gray-400 mt-2">
                    Updated: {insight.lastUpdated.toLocaleTimeString()}
                  </div>
                </motion.div>
              ))}
            </div>
          </GlassCard>
        </motion.div>
      )}

      {/* Market Analysis */}
      <GlassCard className="p-6">
        <h3 className="text-xl font-bold text-white mb-6">Global Market Analysis</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {marketData.map((market, index) => (
            <div key={index} className="p-4 bg-white/5 rounded-lg">
              <h4 className="font-medium text-white mb-3">{market.region}</h4>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Market Penetration</span>
                  <span className="text-sm text-white">{market.penetration}%</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Growth Rate</span>
                  <span className="text-sm text-neon-green">+{market.growth}%</span>
                </div>
                
                <div>
                  <span className="text-sm text-gray-400">Key Competition</span>
                  <p className="text-sm text-white mt-1">{market.competition}</p>
                </div>
                
                <div>
                  <span className="text-sm text-gray-400">Opportunity</span>
                  <p className="text-sm text-neon-blue mt-1">{market.opportunity}</p>
                </div>
                
                <div className="pt-2 border-t border-white/10">
                  <span className="text-sm text-gray-400">Revenue Potential</span>
                  <p className="text-lg font-bold text-neon-green">{market.revenue}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Action CTA */}
      <div className="text-center">
        <GlassCard className="p-8 bg-gradient-to-br from-neon-blue/20 to-neon-green/20">
          <div className="space-y-4">
            <Trophy className="w-12 h-12 text-neon-green mx-auto" />
            <h3 className="text-2xl font-bold text-white">Ready to Dominate Global Fantasy Sports?</h3>
            <p className="text-gray-300 max-w-2xl mx-auto">
              With 22 MCP servers powering real-time analysis, AI insights, and global data collection, 
              Fantasy.AI is positioned to capture the $12B+ global fantasy sports market.
            </p>
            
            <div className="flex flex-wrap items-center justify-center gap-4 mt-6">
              <NeonButton variant="green" className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Launch Global Beta
              </NeonButton>
              
              <NeonButton variant="blue" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                View Full Analytics
              </NeonButton>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

export default GlobalSportsHub;