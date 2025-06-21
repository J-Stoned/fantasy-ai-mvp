"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { keeperDynastyService, KeeperLeague, KeeperPlayer, KeeperAnalysis } from "@/lib/keeper-dynasty-service";
import {
  Trophy,
  Users,
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  Star,
  AlertTriangle,
  Brain,
  Target,
  Zap,
  Crown,
  Shield,
  Flame,
  Clock,
  CheckCircle,
  XCircle,
  HelpCircle
} from "lucide-react";

interface KeeperDashboardProps {
  leagueId: string;
  teamId: string;
  userId: string;
}

interface KeeperDecisionCardProps {
  player: KeeperPlayer;
  onDecisionChange: (playerId: string, decision: 'keeping' | 'releasing' | 'undecided') => void;
}

function KeeperDecisionCard({ player, onDecisionChange }: KeeperDecisionCardProps) {
  const getValueRatingColor = (rating: string) => {
    switch (rating) {
      case 'excellent': return 'text-neon-green';
      case 'good': return 'text-neon-blue';
      case 'fair': return 'text-yellow-400';
      case 'poor': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getValueRatingIcon = (rating: string) => {
    switch (rating) {
      case 'excellent': return <Crown className="w-4 h-4" />;
      case 'good': return <Star className="w-4 h-4" />;
      case 'fair': return <Shield className="w-4 h-4" />;
      case 'poor': return <AlertTriangle className="w-4 h-4" />;
      default: return <HelpCircle className="w-4 h-4" />;
    }
  };

  const getDecisionStyle = (status: string) => {
    switch (status) {
      case 'keeping': return 'border-neon-green bg-neon-green/10';
      case 'releasing': return 'border-red-400 bg-red-400/10';
      default: return 'border-white/20 bg-white/5';
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <GlassCard className={`p-4 transition-all ${getDecisionStyle(player.keeperStatus)}`}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
              <span className="text-lg font-bold text-white">
                {player.position}
              </span>
            </div>
            
            <div>
              <h3 className="font-semibold text-white">{player.playerName}</h3>
              <p className="text-sm text-gray-400">{player.team} • {player.position}</p>
              
              <div className="flex items-center gap-2 mt-1">
                <div className={`flex items-center gap-1 ${getValueRatingColor(player.keeperValueRating)}`}>
                  {getValueRatingIcon(player.keeperValueRating)}
                  <span className="text-xs capitalize">{player.keeperValueRating}</span>
                </div>
                
                <div className="text-xs text-gray-400">
                  Value: {player.currentValue}
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-lg font-bold text-white">
              ${player.keeperCost}
            </div>
            <div className="text-xs text-gray-400">
              {player.yearsKept} years kept
            </div>
          </div>
        </div>
        
        {/* Decision Buttons */}
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => onDecisionChange(player.id, 'keeping')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
              player.keeperStatus === 'keeping'
                ? 'bg-neon-green/20 text-neon-green border border-neon-green'
                : 'bg-white/10 text-gray-300 hover:bg-neon-green/10 hover:text-neon-green'
            }`}
          >
            <CheckCircle className="w-3 h-3 inline mr-1" />
            Keep
          </button>
          
          <button
            onClick={() => onDecisionChange(player.id, 'releasing')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
              player.keeperStatus === 'releasing'
                ? 'bg-red-400/20 text-red-400 border border-red-400'
                : 'bg-white/10 text-gray-300 hover:bg-red-400/10 hover:text-red-400'
            }`}
          >
            <XCircle className="w-3 h-3 inline mr-1" />
            Release
          </button>
          
          <button
            onClick={() => onDecisionChange(player.id, 'undecided')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
              player.keeperStatus === 'undecided'
                ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400'
                : 'bg-white/10 text-gray-300 hover:bg-yellow-400/10 hover:text-yellow-400'
            }`}
          >
            <HelpCircle className="w-3 h-3 inline mr-1" />
            Undecided
          </button>
        </div>
        
        {/* Player Stats */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="text-center p-2 bg-white/5 rounded">
            <div className="text-white font-medium">{player.currentValue}</div>
            <div className="text-gray-400">Current</div>
          </div>
          <div className="text-center p-2 bg-white/5 rounded">
            <div className="text-white font-medium">{player.futureValue}</div>
            <div className="text-gray-400">Future</div>
          </div>
          <div className="text-center p-2 bg-white/5 rounded">
            <div className="text-white font-medium">{player.contractLength}y</div>
            <div className="text-gray-400">Contract</div>
          </div>
        </div>
        
        {player.releaseReason && player.keeperStatus === 'releasing' && (
          <div className="mt-3 p-2 bg-red-400/10 border border-red-400/20 rounded text-xs text-red-300">
            <strong>Reason:</strong> {player.releaseReason}
          </div>
        )}
      </GlassCard>
    </motion.div>
  );
}

export function KeeperDashboard({ leagueId, teamId, userId }: KeeperDashboardProps) {
  const [league, setLeague] = useState<KeeperLeague | null>(null);
  const [players, setPlayers] = useState<KeeperPlayer[]>([]);
  const [analysis, setAnalysis] = useState<KeeperAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'decisions' | 'analysis' | 'trends'>('decisions');
  const [filterStatus, setFilterStatus] = useState<'all' | 'keeping' | 'releasing' | 'undecided'>('all');

  useEffect(() => {
    loadKeeperData();
  }, [leagueId, teamId]);

  const loadKeeperData = async () => {
    setIsLoading(true);
    try {
      const [leagueData, playersData, analysisData] = await Promise.all([
        keeperDynastyService.getKeeperLeague(leagueId),
        keeperDynastyService.getKeeperPlayers(leagueId, teamId),
        keeperDynastyService.generateKeeperAnalysis(leagueId, teamId)
      ]);

      setLeague(leagueData);
      setPlayers(playersData);
      setAnalysis(analysisData);
    } catch (error) {
      console.error('Failed to load keeper data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDecisionChange = async (playerId: string, decision: 'keeping' | 'releasing' | 'undecided') => {
    try {
      await keeperDynastyService.updateKeeperDecision(playerId, decision);
      
      // Update local state
      setPlayers(prev => prev.map(player => 
        player.id === playerId 
          ? { ...player, keeperStatus: decision, keeperDeadlineMet: decision !== 'undecided' }
          : player
      ));
      
      // Regenerate analysis
      const newAnalysis = await keeperDynastyService.generateKeeperAnalysis(leagueId, teamId);
      setAnalysis(newAnalysis);
    } catch (error) {
      console.error('Failed to update keeper decision:', error);
    }
  };

  const filteredPlayers = players.filter(player => {
    if (filterStatus === 'all') return true;
    return player.keeperStatus === filterStatus;
  });

  const keepingCount = players.filter(p => p.keeperStatus === 'keeping').length;
  const undecidedCount = players.filter(p => p.keeperStatus === 'undecided').length;
  const totalKeeperCost = players
    .filter(p => p.keeperStatus === 'keeping')
    .reduce((sum, p) => sum + p.keeperCost, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="w-12 h-12 bg-neon-blue/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Brain className="w-6 h-6 text-neon-blue animate-pulse" />
          </div>
          <p className="text-gray-400">Loading keeper analysis...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{league?.name}</h1>
          <p className="text-gray-400">{league?.type === 'dynasty' ? 'Dynasty' : 'Keeper'} League Management</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-lg font-bold text-white">{keepingCount}/{league?.settings.maxKeepers}</div>
            <div className="text-xs text-gray-400">Keepers Selected</div>
          </div>
          
          {league?.settings.salaryCap && (
            <div className="text-right">
              <div className="text-lg font-bold text-white">${totalKeeperCost}</div>
              <div className="text-xs text-gray-400">of ${league.settings.salaryCap} cap</div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-neon-green/20 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-neon-green" />
            </div>
            <div>
              <div className="text-xl font-bold text-white">{keepingCount}</div>
              <div className="text-xs text-gray-400">Keeping</div>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-400/20 rounded-xl flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <div className="text-xl font-bold text-white">{undecidedCount}</div>
              <div className="text-xs text-gray-400">Undecided</div>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-neon-blue/20 rounded-xl flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-neon-blue" />
            </div>
            <div>
              <div className="text-xl font-bold text-white">${analysis?.remainingBudget || 0}</div>
              <div className="text-xs text-gray-400">Budget Left</div>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-400/20 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <div className="text-xl font-bold text-white">
                {league && Math.ceil((league.settings.keeperDeadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24))}
              </div>
              <div className="text-xs text-gray-400">Days Left</div>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Tabs */}
      <div className="border-b border-white/10">
        <nav className="flex gap-6">
          {[
            { id: 'decisions', label: 'Keeper Decisions', icon: Target },
            { id: 'analysis', label: 'AI Analysis', icon: Brain },
            { id: 'trends', label: 'Trends & Values', icon: TrendingUp }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
                activeTab === tab.id
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

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'decisions' && (
          <motion.div
            key="decisions"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Filters */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Filter:</span>
              {[
                { id: 'all', label: 'All Players' },
                { id: 'keeping', label: 'Keeping' },
                { id: 'releasing', label: 'Releasing' },
                { id: 'undecided', label: 'Undecided' }
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setFilterStatus(filter.id as any)}
                  className={`px-3 py-1 rounded-full text-xs transition-colors ${
                    filterStatus === filter.id
                      ? 'bg-neon-blue/20 text-neon-blue'
                      : 'bg-white/10 text-gray-400 hover:bg-white/20'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {/* Player Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence>
                {filteredPlayers.map((player) => (
                  <KeeperDecisionCard
                    key={player.id}
                    player={player}
                    onDecisionChange={handleDecisionChange}
                  />
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {activeTab === 'analysis' && analysis && (
          <motion.div
            key="analysis"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* AI Recommendations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Must Keep */}
              {analysis.recommendations.mustKeep.length > 0 && (
                <GlassCard className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Crown className="w-5 h-5 text-neon-green" />
                    <h3 className="font-semibold text-white">Must Keep</h3>
                  </div>
                  <div className="space-y-3">
                    {analysis.recommendations.mustKeep.map((rec, index) => (
                      <div key={index} className="p-3 bg-neon-green/10 border border-neon-green/20 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-white">{rec.playerName}</span>
                          <div className="text-xs text-neon-green">{rec.confidence}% confident</div>
                        </div>
                        <div className="text-xs text-gray-400 mb-2">
                          {rec.reasoning.join(' • ')}
                        </div>
                        <div className="text-xs text-neon-green">
                          Value Rating: {rec.valueRating}/100
                        </div>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              )}

              {/* Consider Releasing */}
              {analysis.recommendations.release.length > 0 && (
                <GlassCard className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                    <h3 className="font-semibold text-white">Consider Releasing</h3>
                  </div>
                  <div className="space-y-3">
                    {analysis.recommendations.release.map((rec, index) => (
                      <div key={index} className="p-3 bg-red-400/10 border border-red-400/20 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-white">{rec.playerName}</span>
                          <div className="text-xs text-red-400">{rec.confidence}% confident</div>
                        </div>
                        <div className="text-xs text-gray-400 mb-2">
                          {rec.reasoning.join(' • ')}
                        </div>
                        <div className="text-xs text-red-400">
                          Risk Factors: {rec.riskFactors.join(', ')}
                        </div>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              )}
            </div>

            {/* Team Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Strengths & Weaknesses */}
              <GlassCard className="p-6">
                <h3 className="font-semibold text-white mb-4">Team Analysis</h3>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-neon-green mb-2">Strengths</h4>
                    <ul className="space-y-1">
                      {analysis.teamStrengths.map((strength, index) => (
                        <li key={index} className="text-xs text-gray-300 flex items-center gap-2">
                          <Star className="w-3 h-3 text-neon-green flex-shrink-0" />
                          {strength}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-red-400 mb-2">Areas to Address</h4>
                    <ul className="space-y-1">
                      {analysis.teamWeaknesses.map((weakness, index) => (
                        <li key={index} className="text-xs text-gray-300 flex items-center gap-2">
                          <AlertTriangle className="w-3 h-3 text-red-400 flex-shrink-0" />
                          {weakness}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </GlassCard>

              {/* Strategy & Priorities */}
              <GlassCard className="p-6">
                <h3 className="font-semibold text-white mb-4">Offseason Strategy</h3>
                
                <div className="space-y-4">
                  <div className="p-3 bg-neon-blue/10 border border-neon-blue/20 rounded-lg">
                    <h4 className="text-sm font-medium text-neon-blue mb-2">Recommended Strategy</h4>
                    <p className="text-xs text-gray-300">{analysis.offseasonStrategy}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-white mb-2">Draft Priorities</h4>
                    <div className="space-y-1">
                      {analysis.draftPriorities.map((priority, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div className="w-5 h-5 bg-neon-blue/20 rounded text-xs text-neon-blue flex items-center justify-center">
                            {index + 1}
                          </div>
                          <span className="text-xs text-gray-300">{priority}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </GlassCard>
            </div>
          </motion.div>
        )}

        {activeTab === 'trends' && (
          <motion.div
            key="trends"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <GlassCard className="p-6">
              <h3 className="font-semibold text-white mb-4">League Trends</h3>
              <p className="text-gray-400 text-sm">Coming soon - Advanced keeper trends and value analysis</p>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default KeeperDashboard;