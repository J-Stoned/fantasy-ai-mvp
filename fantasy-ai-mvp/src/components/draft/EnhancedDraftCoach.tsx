"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { voiceAssistantService } from "@/lib/voice-assistant-service";
import { playerAnalyticsService } from "@/lib/player-analytics-service";
import {
  Brain,
  Target,
  TrendingUp,
  Zap,
  Users,
  Clock,
  Star,
  Trophy,
  AlertTriangle,
  Mic,
  Volume2,
  Search,
  Filter,
  BarChart3,
  Eye,
  Flame,
  Crown,
  Shield,
  ChevronRight,
  RefreshCw,
  MessageCircle,
  Headphones
} from "lucide-react";

interface EnhancedDraftCoachProps {
  draftId: string;
  userId: string;
  leagueSettings: any;
  currentPick?: number;
  timeRemaining?: number;
}

interface DraftRecommendation {
  playerId: string;
  playerName: string;
  position: string;
  team: string;
  adp: number;
  value: number;
  reasoning: string[];
  confidence: number;
  tier: number;
  upside: 'HIGH' | 'MEDIUM' | 'LOW';
  floor: 'HIGH' | 'MEDIUM' | 'LOW';
  riskFactors: string[];
  analytics: {
    projectedPoints: number;
    ceiling: number;
    floor: number;
    consistency: number;
    strengthOfSchedule: number;
  };
}

interface DraftStrategy {
  strategy: string;
  priorities: string[];
  positionTargets: { position: string; rounds: number[]; }[];
  sleepers: DraftRecommendation[];
  handcuffs: { player: string; handcuff: string; }[];
}

export function EnhancedDraftCoach({ draftId, userId, leagueSettings, currentPick, timeRemaining }: EnhancedDraftCoachProps) {
  const [recommendations, setRecommendations] = useState<DraftRecommendation[]>([]);
  const [draftStrategy, setDraftStrategy] = useState<DraftStrategy | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<string>('ALL');
  const [selectedTier, setSelectedTier] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [aiInsight, setAiInsight] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [viewMode, setViewMode] = useState<'recommendations' | 'strategy' | 'analytics'>('recommendations');
  const [mcpAnalysis, setMcpAnalysis] = useState<any>(null);

  useEffect(() => {
    initializeDraftCoach();
  }, [draftId, currentPick]);

  const initializeDraftCoach = async () => {
    setIsAnalyzing(true);
    try {
      // Generate draft recommendations using MCP-powered analytics
      await Promise.all([
        generateRecommendations(),
        generateDraftStrategy(),
        generateMCPAnalysis()
      ]);
    } catch (error) {
      console.error('Failed to initialize draft coach:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateMCPAnalysis = async () => {
    // Simulate MCP-powered analysis using multiple servers
    const analysis = {
      sequentialThinking: {
        draftPhase: currentPick && currentPick <= 24 ? 'early' : currentPick && currentPick <= 96 ? 'middle' : 'late',
        optimalStrategy: "Focus on high-ceiling RBs in early rounds, target QB value in middle rounds",
        riskAssessment: "Medium risk tolerance recommended based on league competitiveness"
      },
      knowledgeGraph: {
        playerConnections: [
          { primary: "Josh Allen", handcuff: "Matt Barkley", strength: 0.9 },
          { primary: "Christian McCaffrey", handcuff: "Jordan Mason", strength: 0.85 }
        ],
        teamSynergies: [
          { team: "BUF", players: ["Josh Allen", "Stefon Diggs"], synergy: 0.92 }
        ]
      },
      chartVisualization: {
        positionScarcity: { QB: 0.3, RB: 0.8, WR: 0.6, TE: 0.9 },
        valueDropoffs: { RB: [1, 8, 16, 24], WR: [1, 12, 24, 36] }
      },
      firecrawl: {
        recentNews: [
          "CMC injury concern - monitor practice reports",
          "Tua cleared for contact - QB2 value rising"
        ],
        expertConsensus: "RB-heavy early strategy gaining popularity"
      }
    };
    
    setMcpAnalysis(analysis);
  };

  const generateRecommendations = async () => {
    // Mock advanced draft recommendations with MCP insights
    const mockRecommendations: DraftRecommendation[] = [
      {
        playerId: 'player_cmc',
        playerName: 'Christian McCaffrey',
        position: 'RB',
        team: 'SF',
        adp: 1.2,
        value: 98,
        reasoning: [
          'Elite dual-threat production with 400+ touch upside',
          'Proven workhorse in Kyle Shanahan system',
          'Clear RB1 overall ceiling in healthy season'
        ],
        confidence: 95,
        tier: 1,
        upside: 'HIGH',
        floor: 'HIGH',
        riskFactors: ['Injury history', 'Age 27 season'],
        analytics: {
          projectedPoints: 285,
          ceiling: 350,
          floor: 220,
          consistency: 0.78,
          strengthOfSchedule: 14
        }
      },
      {
        playerId: 'player_waddle',
        playerName: 'Jaylen Waddle',
        position: 'WR',
        team: 'MIA',
        adp: 28.5,
        value: 85,
        reasoning: [
          'Target monster with Tua healthy (140+ targets)',
          'Explosive speed creates big-play upside',
          'Improved efficiency in year 3 of system'
        ],
        confidence: 82,
        tier: 2,
        upside: 'HIGH',
        floor: 'MEDIUM',
        riskFactors: ['Tua health dependency', 'Hill target competition'],
        analytics: {
          projectedPoints: 245,
          ceiling: 290,
          floor: 195,
          consistency: 0.72,
          strengthOfSchedule: 8
        }
      }
    ];

    setRecommendations(mockRecommendations);
  };

  const generateDraftStrategy = async () => {
    // Mock strategy generation with MCP sequential thinking
    const strategy: DraftStrategy = {
      strategy: "Modified Hero RB with Late QB",
      priorities: [
        "Secure elite RB in first 2 rounds",
        "Target WR depth in rounds 3-6", 
        "Find QB value in rounds 7-10",
        "Handcuff key players in late rounds"
      ],
      positionTargets: [
        { position: "RB", rounds: [1, 2, 8, 12] },
        { position: "WR", rounds: [3, 4, 5, 6] },
        { position: "QB", rounds: [7, 8, 9] },
        { position: "TE", rounds: [6, 11] }
      ],
      sleepers: recommendations.filter(r => r.adp > 50),
      handcuffs: [
        { player: "Christian McCaffrey", handcuff: "Jordan Mason" },
        { player: "Josh Allen", handcuff: "Matt Barkley" }
      ]
    };

    setDraftStrategy(strategy);
  };

  const handleVoiceCommand = async () => {
    setIsVoiceActive(true);
    try {
      // Integrate with voice assistant for draft guidance
      const response = await voiceAssistantService.processVoiceCommand(
        "Who should I draft next?",
        userId
      );
      
      setAiInsight(response.text);
    } catch (error) {
      console.error('Voice command failed:', error);
    } finally {
      setIsVoiceActive(false);
    }
  };

  const handlePlayerSelect = (playerId: string) => {
    // Logic for selecting a player in draft
    console.log('Selected player:', playerId);
  };

  const filteredRecommendations = recommendations.filter(rec => {
    const matchesPosition = selectedPosition === 'ALL' || rec.position === selectedPosition;
    const matchesTier = !selectedTier || rec.tier === selectedTier;
    const matchesSearch = rec.playerName.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesPosition && matchesTier && matchesSearch;
  });

  const getValueColor = (value: number) => {
    if (value >= 90) return 'text-neon-green';
    if (value >= 75) return 'text-neon-blue';
    if (value >= 60) return 'text-yellow-400';
    return 'text-gray-400';
  };

  const getTierColor = (tier: number) => {
    const colors = ['bg-neon-green', 'bg-neon-blue', 'bg-yellow-400', 'bg-orange-400', 'bg-red-400'];
    return colors[tier - 1] || 'bg-gray-400';
  };

  return (
    <div className="space-y-6">
      {/* Header with Voice Integration */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">AI Draft Coach</h2>
          <p className="text-gray-400">
            {currentPick ? `Pick ${currentPick}` : 'Draft Analysis'} • 
            {timeRemaining ? ` ${Math.floor(timeRemaining / 60)}:${(timeRemaining % 60).toString().padStart(2, '0')} remaining` : ' Preparing...'}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <NeonButton
            variant={isVoiceActive ? "pink" : "blue"}
            onClick={handleVoiceCommand}
            disabled={isVoiceActive}
            className="flex items-center gap-2"
          >
            {isVoiceActive ? (
              <>
                <Mic className="w-4 h-4 animate-pulse" />
                Listening...
              </>
            ) : (
              <>
                <Headphones className="w-4 h-4" />
                Ask AI Coach
              </>
            )}
          </NeonButton>
          
          <button
            onClick={initializeDraftCoach}
            disabled={isAnalyzing}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-5 h-5 text-gray-400 ${isAnalyzing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* AI Insight Banner */}
      {aiInsight && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative"
        >
          <GlassCard className="p-4 border-l-4 border-neon-blue bg-neon-blue/10">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-neon-blue/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Brain className="w-4 h-4 text-neon-blue" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-white mb-1">AI Coach Insight</h4>
                <p className="text-sm text-gray-300">{aiInsight}</p>
              </div>
              <button
                onClick={() => setAiInsight('')}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ×
              </button>
            </div>
          </GlassCard>
        </motion.div>
      )}

      {/* MCP Analysis Summary */}
      {mcpAnalysis && (
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-neon-blue" />
            <h3 className="font-semibold text-white">MCP Enhanced Analysis</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="p-3 bg-white/5 rounded-lg">
              <div className="text-gray-400 mb-1">Phase Strategy</div>
              <div className="text-white">{mcpAnalysis.sequentialThinking.optimalStrategy}</div>
            </div>
            
            <div className="p-3 bg-white/5 rounded-lg">
              <div className="text-gray-400 mb-1">Latest News</div>
              <div className="text-white">{mcpAnalysis.firecrawl.recentNews[0]}</div>
            </div>
            
            <div className="p-3 bg-white/5 rounded-lg">
              <div className="text-gray-400 mb-1">Position Scarcity</div>
              <div className="text-white">TE: High • RB: High • WR: Medium</div>
            </div>
            
            <div className="p-3 bg-white/5 rounded-lg">
              <div className="text-gray-400 mb-1">Expert Consensus</div>
              <div className="text-white">{mcpAnalysis.firecrawl.expertConsensus}</div>
            </div>
          </div>
        </GlassCard>
      )}

      {/* View Mode Tabs */}
      <div className="border-b border-white/10">
        <nav className="flex gap-6">
          {[
            { id: 'recommendations', label: 'Player Recommendations', icon: Target },
            { id: 'strategy', label: 'Draft Strategy', icon: Brain },
            { id: 'analytics', label: 'Advanced Analytics', icon: BarChart3 }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setViewMode(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
                viewMode === tab.id
                  ? 'border-neon-blue text-neon-blue'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content Based on View Mode */}
      <AnimatePresence mode="wait">
        {viewMode === 'recommendations' && (
          <motion.div
            key="recommendations"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search players..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="px-3 py-1 bg-white/10 border border-white/20 rounded-lg text-white text-sm placeholder-gray-400 focus:outline-none focus:border-neon-blue"
                />
              </div>
              
              <select
                value={selectedPosition}
                onChange={(e) => setSelectedPosition(e.target.value)}
                className="px-3 py-1 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-neon-blue"
              >
                <option value="ALL">All Positions</option>
                <option value="QB">Quarterback</option>
                <option value="RB">Running Back</option>
                <option value="WR">Wide Receiver</option>
                <option value="TE">Tight End</option>
                <option value="K">Kicker</option>
                <option value="DEF">Defense</option>
              </select>
              
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((tier) => (
                  <button
                    key={tier}
                    onClick={() => setSelectedTier(selectedTier === tier ? null : tier)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                      selectedTier === tier 
                        ? `${getTierColor(tier)} text-white` 
                        : 'bg-white/10 text-gray-400 hover:bg-white/20'
                    }`}
                  >
                    {tier}
                  </button>
                ))}
              </div>
            </div>

            {/* Player Recommendations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredRecommendations.map((rec, index) => (
                <motion.div
                  key={rec.playerId}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <GlassCard className="p-4 hover:bg-white/10 transition-all cursor-pointer group">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3">
                        <div className="relative">
                          <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                            <span className="text-lg font-bold text-white">{rec.position}</span>
                          </div>
                          <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full ${getTierColor(rec.tier)}`} />
                        </div>
                        
                        <div>
                          <h3 className="font-semibold text-white group-hover:text-neon-blue transition-colors">
                            {rec.playerName}
                          </h3>
                          <p className="text-sm text-gray-400">{rec.team} • ADP: {rec.adp}</p>
                          
                          <div className="flex items-center gap-3 mt-1">
                            <div className={`text-sm font-medium ${getValueColor(rec.value)}`}>
                              Value: {rec.value}
                            </div>
                            <div className="text-xs text-gray-400">
                              {rec.confidence}% confidence
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="flex items-center gap-1 mb-1">
                          {rec.upside === 'HIGH' && <TrendingUp className="w-3 h-3 text-neon-green" />}
                          {rec.floor === 'HIGH' && <Shield className="w-3 h-3 text-neon-blue" />}
                          {rec.value >= 90 && <Crown className="w-3 h-3 text-yellow-400" />}
                        </div>
                        <div className="text-xs text-gray-400">
                          Proj: {rec.analytics.projectedPoints}pts
                        </div>
                      </div>
                    </div>
                    
                    {/* Reasoning */}
                    <div className="space-y-2 mb-3">
                      {rec.reasoning.slice(0, 2).map((reason, idx) => (
                        <div key={idx} className="text-xs text-gray-300 flex items-start gap-2">
                          <ChevronRight className="w-3 h-3 text-neon-blue mt-0.5 flex-shrink-0" />
                          {reason}
                        </div>
                      ))}
                    </div>
                    
                    {/* Analytics Preview */}
                    <div className="grid grid-cols-4 gap-2 mb-3">
                      <div className="text-center p-2 bg-white/5 rounded text-xs">
                        <div className="text-white font-medium">{rec.analytics.ceiling}</div>
                        <div className="text-gray-400">Ceiling</div>
                      </div>
                      <div className="text-center p-2 bg-white/5 rounded text-xs">
                        <div className="text-white font-medium">{rec.analytics.floor}</div>
                        <div className="text-gray-400">Floor</div>
                      </div>
                      <div className="text-center p-2 bg-white/5 rounded text-xs">
                        <div className="text-white font-medium">{Math.round(rec.analytics.consistency * 100)}%</div>
                        <div className="text-gray-400">Consistent</div>
                      </div>
                      <div className="text-center p-2 bg-white/5 rounded text-xs">
                        <div className="text-white font-medium">{rec.analytics.strengthOfSchedule}</div>
                        <div className="text-gray-400">SOS Rank</div>
                      </div>
                    </div>
                    
                    {/* Action Button */}
                    <NeonButton
                      variant="blue"
                      onClick={() => handlePlayerSelect(rec.playerId)}
                      className="w-full text-sm"
                    >
                      Draft {rec.playerName}
                    </NeonButton>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {viewMode === 'strategy' && draftStrategy && (
          <motion.div
            key="strategy"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">{draftStrategy.strategy}</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-white mb-3">Draft Priorities</h4>
                  <div className="space-y-2">
                    {draftStrategy.priorities.map((priority, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <div className="w-5 h-5 bg-neon-blue/20 rounded text-xs text-neon-blue flex items-center justify-center mt-0.5">
                          {index + 1}
                        </div>
                        <span className="text-sm text-gray-300">{priority}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-white mb-3">Position Targets</h4>
                  <div className="space-y-2">
                    {draftStrategy.positionTargets.map((target, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-white/5 rounded">
                        <span className="text-sm text-white">{target.position}</span>
                        <span className="text-xs text-gray-400">
                          Rounds: {target.rounds.join(', ')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default EnhancedDraftCoach;