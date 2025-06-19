"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { bettingService, PlayerProp, BettingSlip } from "@/lib/betting-service";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  DollarSign,
  Target,
  Activity,
  Zap,
  Brain,
  Clock,
  Users,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Filter,
  RefreshCw,
  BarChart3,
  Flame,
  Star
} from "lucide-react";

interface LiveBettingDashboardProps {
  userId: string;
  gameId?: string;
}

interface BettingInsight {
  recommendation: 'OVER' | 'UNDER' | 'AVOID';
  confidence: number;
  reasoning: string;
  keyFactors: string[];
}

export function LiveBettingDashboard({ userId, gameId }: LiveBettingDashboardProps) {
  const [playerProps, setPlayerProps] = useState<PlayerProp[]>([]);
  const [selectedProps, setSelectedProps] = useState<PlayerProp[]>([]);
  const [bettingSlip, setBettingSlip] = useState<any[]>([]);
  const [stake, setStake] = useState(10);
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<Map<string, BettingInsight>>(new Map());
  const [filter, setFilter] = useState('all');
  const [showInsights, setShowInsights] = useState<string | null>(null);
  const [recentBets, setRecentBets] = useState<BettingSlip[]>([]);

  useEffect(() => {
    loadPlayerProps();
    loadRecentBets();

    // Listen for live odds updates
    const handleOddsUpdate = (updatedProps: PlayerProp[]) => {
      setPlayerProps(updatedProps);
    };

    bettingService.on('oddsUpdated', handleOddsUpdate);

    return () => {
      bettingService.off('oddsUpdated', handleOddsUpdate);
    };
  }, [gameId]);

  const loadPlayerProps = async () => {
    setLoading(true);
    try {
      const props = await bettingService.getPlayerProps(gameId);
      setPlayerProps(props);
    } catch (error) {
      console.error('Error loading player props:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRecentBets = async () => {
    try {
      const history = await bettingService.getBettingHistory(userId);
      setRecentBets(history.slice(0, 5));
    } catch (error) {
      console.error('Error loading betting history:', error);
    }
  };

  const loadInsights = async (propId: string) => {
    if (insights.has(propId)) return;
    
    try {
      const insight = await bettingService.getBettingInsights(propId);
      setInsights(new Map(insights.set(propId, insight)));
    } catch (error) {
      console.error('Error loading insights:', error);
    }
  };

  const addToBettingSlip = (prop: PlayerProp, selection: 'OVER' | 'UNDER') => {
    const odds = selection === 'OVER' ? prop.overOdds : prop.underOdds;
    const newSelection = {
      propId: prop.id,
      playerId: prop.playerId,
      playerName: prop.playerName,
      prop: prop.description,
      selection,
      line: prop.line,
      odds,
      stake: stake
    };

    setBettingSlip(prev => {
      // Remove any existing selection for this prop
      const filtered = prev.filter(s => s.propId !== prop.id);
      return [...filtered, newSelection];
    });
  };

  const removeFromBettingSlip = (propId: string) => {
    setBettingSlip(prev => prev.filter(s => s.propId !== propId));
  };

  const placeBet = async () => {
    if (bettingSlip.length === 0) return;

    try {
      const selections = bettingSlip.map(({ propId, ...rest }) => rest);
      const slip = await bettingService.placeBet(selections, stake, userId);
      
      // Clear betting slip and reload recent bets
      setBettingSlip([]);
      loadRecentBets();
      
      alert(`Bet placed successfully! Slip ID: ${slip.id}`);
    } catch (error) {
      console.error('Error placing bet:', error);
      alert('Failed to place bet');
    }
  };

  const formatOdds = (odds: number) => {
    return odds > 0 ? `+${odds}` : `${odds}`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getFilteredProps = () => {
    if (filter === 'all') return playerProps;
    return playerProps.filter(prop => prop.propType === filter);
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'UP': return <TrendingUp className="w-4 h-4 text-neon-green" />;
      case 'DOWN': return <TrendingDown className="w-4 h-4 text-neon-red" />;
      default: return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'OVER': return 'text-neon-green';
      case 'UNDER': return 'text-neon-red';
      default: return 'text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <GlassCard className="p-6">
              <div className="h-20 bg-white/10 rounded" />
            </GlassCard>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background cyber-grid">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-48 -left-48 w-96 h-96 bg-neon-green/10 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-48 -right-48 w-96 h-96 bg-neon-red/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                <div className="w-12 h-12 bg-neon-green/20 rounded-xl flex items-center justify-center">
                  <Target className="w-6 h-6 text-neon-green" />
                </div>
                Live Betting Hub
              </h1>
              <p className="text-gray-400">
                Real-time player props with AI-powered insights
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="px-4 py-2 bg-neon-green/20 rounded-full border border-neon-green/30">
                <span className="text-sm text-neon-green font-medium flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Live Updates
                </span>
              </div>
              
              <NeonButton
                variant="blue"
                onClick={loadPlayerProps}
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </NeonButton>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-2 mb-6">
            {[
              { key: 'all', label: 'All Props' },
              { key: 'PASSING_YARDS', label: 'Passing' },
              { key: 'RUSHING_YARDS', label: 'Rushing' },
              { key: 'RECEIVING_YARDS', label: 'Receiving' },
              { key: 'TOUCHDOWNS', label: 'TDs' },
              { key: 'RECEPTIONS', label: 'Receptions' }
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-4 py-2 rounded-lg transition-all ${
                  filter === key
                    ? 'bg-neon-blue/20 text-neon-blue border border-neon-blue/30'
                    : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Player Props */}
          <div className="lg:col-span-2 space-y-4">
            <AnimatePresence>
              {getFilteredProps().map((prop, index) => {
                const propInsight = insights.get(prop.id);
                const isInSlip = bettingSlip.some(s => s.propId === prop.id);
                
                return (
                  <motion.div
                    key={prop.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <GlassCard className={`p-6 transition-all duration-300 ${
                      isInSlip ? 'border-neon-green/50 bg-neon-green/5' : 'hover:border-neon-blue/30'
                    }`}>
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-neon-blue/20 rounded-xl flex items-center justify-center">
                            <span className="text-sm font-bold text-white">
                              {prop.playerName.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-white">
                              {prop.playerName}
                            </h3>
                            <p className="text-sm text-gray-400">
                              {prop.team} {prop.position} vs {prop.opponent}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {getTrendIcon(prop.trend)}
                          <div className="text-right">
                            <div className="text-sm text-gray-400">Volume</div>
                            <div className="text-white font-medium">{prop.volume.toLocaleString()}</div>
                          </div>
                        </div>
                      </div>

                      {/* Prop Line */}
                      <div className="mb-4">
                        <div className="text-center mb-2">
                          <h4 className="text-xl font-bold text-white">{prop.description}</h4>
                          <div className="text-3xl font-bold text-neon-blue">{prop.line}</div>
                        </div>
                        
                        {/* Betting Buttons */}
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            onClick={() => addToBettingSlip(prop, 'OVER')}
                            className="p-4 bg-neon-green/10 border border-neon-green/30 rounded-lg hover:bg-neon-green/20 transition-all group"
                          >
                            <div className="text-center">
                              <div className="text-sm text-gray-400 mb-1">OVER {prop.line}</div>
                              <div className="text-xl font-bold text-neon-green">
                                {formatOdds(prop.overOdds)}
                              </div>
                            </div>
                          </button>
                          
                          <button
                            onClick={() => addToBettingSlip(prop, 'UNDER')}
                            className="p-4 bg-neon-red/10 border border-neon-red/30 rounded-lg hover:bg-neon-red/20 transition-all group"
                          >
                            <div className="text-center">
                              <div className="text-sm text-gray-400 mb-1">UNDER {prop.line}</div>
                              <div className="text-xl font-bold text-neon-red">
                                {formatOdds(prop.underOdds)}
                              </div>
                            </div>
                          </button>
                        </div>
                      </div>

                      {/* Recent Performance */}
                      <div className="mb-4">
                        <div className="text-sm text-gray-400 mb-2">Last 5 Games</div>
                        <div className="flex gap-2">
                          {prop.lastGames.map((game, i) => (
                            <div
                              key={i}
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                game.hit
                                  ? 'bg-neon-green/20 text-neon-green border border-neon-green/30'
                                  : 'bg-neon-red/20 text-neon-red border border-neon-red/30'
                              }`}
                            >
                              {game.result}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* AI Insights */}
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => {
                            loadInsights(prop.id);
                            setShowInsights(showInsights === prop.id ? null : prop.id);
                          }}
                          className="flex items-center gap-2 px-3 py-2 bg-neon-purple/20 border border-neon-purple/30 rounded-lg hover:bg-neon-purple/30 transition-all"
                        >
                          <Brain className="w-4 h-4 text-neon-purple" />
                          <span className="text-sm text-neon-purple font-medium">AI Insights</span>
                        </button>
                        
                        {propInsight && (
                          <div className={`text-right ${getRecommendationColor(propInsight.recommendation)}`}>
                            <div className="text-sm font-medium">{propInsight.recommendation}</div>
                            <div className="text-xs">{propInsight.confidence}% confidence</div>
                          </div>
                        )}
                      </div>

                      {/* AI Insights Panel */}
                      {showInsights === prop.id && propInsight && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-4 p-4 bg-neon-purple/10 border border-neon-purple/30 rounded-lg"
                        >
                          <div className="mb-3">
                            <div className={`text-lg font-bold ${getRecommendationColor(propInsight.recommendation)}`}>
                              {propInsight.recommendation} ({propInsight.confidence}% confidence)
                            </div>
                            <p className="text-gray-300 text-sm mt-1">{propInsight.reasoning}</p>
                          </div>
                          
                          <div>
                            <div className="text-sm text-gray-400 mb-2">Key Factors:</div>
                            <ul className="space-y-1">
                              {propInsight.keyFactors.map((factor, i) => (
                                <li key={i} className="text-sm text-gray-300 flex items-center gap-2">
                                  <div className="w-1 h-1 bg-neon-purple rounded-full" />
                                  {factor}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </motion.div>
                      )}
                    </GlassCard>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Betting Slip & Recent Bets */}
          <div className="space-y-6">
            {/* Betting Slip */}
            <GlassCard className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-neon-gold/20 rounded-lg flex items-center justify-center">
                  <Target className="w-4 h-4 text-neon-gold" />
                </div>
                <h3 className="text-lg font-bold text-white">Betting Slip</h3>
                {bettingSlip.length > 0 && (
                  <div className="ml-auto px-2 py-1 bg-neon-blue/20 rounded-full">
                    <span className="text-xs text-neon-blue font-medium">{bettingSlip.length}</span>
                  </div>
                )}
              </div>

              {bettingSlip.length === 0 ? (
                <div className="text-center py-8">
                  <Target className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-400">Add props to start building your slip</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {bettingSlip.map((selection) => (
                    <div key={selection.propId} className="p-3 bg-white/5 rounded-lg border border-white/10">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-medium text-white">
                          {selection.playerName}
                        </div>
                        <button
                          onClick={() => removeFromBettingSlip(selection.propId)}
                          className="text-gray-400 hover:text-neon-red transition-colors"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="text-xs text-gray-400 mb-1">{selection.prop}</div>
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-white">
                          {selection.selection} {selection.line}
                        </div>
                        <div className="text-sm font-bold text-neon-blue">
                          {formatOdds(selection.odds)}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Stake Input */}
                  <div className="pt-3 border-t border-white/10">
                    <div className="mb-3">
                      <label className="block text-sm text-gray-400 mb-2">Stake</label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="number"
                          value={stake}
                          onChange={(e) => setStake(Number(e.target.value))}
                          className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-neon-blue/50"
                          min="1"
                          max="1000"
                        />
                      </div>
                    </div>

                    {/* Potential Payout */}
                    <div className="mb-4 p-3 bg-neon-green/10 border border-neon-green/30 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-400">Potential Payout</span>
                        <span className="text-lg font-bold text-neon-green">
                          {formatCurrency(stake * 2.5)} {/* Simplified calculation */}
                        </span>
                      </div>
                    </div>

                    <NeonButton
                      variant="green"
                      onClick={placeBet}
                      className="w-full"
                    >
                      Place Bet
                    </NeonButton>
                  </div>
                </div>
              )}
            </GlassCard>

            {/* Recent Bets */}
            <GlassCard className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-neon-purple/20 rounded-lg flex items-center justify-center">
                  <Clock className="w-4 h-4 text-neon-purple" />
                </div>
                <h3 className="text-lg font-bold text-white">Recent Bets</h3>
              </div>

              {recentBets.length === 0 ? (
                <div className="text-center py-6">
                  <BarChart3 className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">No recent bets</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentBets.map((bet) => (
                    <div key={bet.id} className="p-3 bg-white/5 rounded-lg border border-white/10">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-medium text-white">
                          {bet.selections.length} Selection{bet.selections.length > 1 ? 's' : ''}
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          bet.status === 'WON' ? 'bg-neon-green/20 text-neon-green' :
                          bet.status === 'LOST' ? 'bg-neon-red/20 text-neon-red' :
                          'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {bet.status}
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">
                          {formatCurrency(bet.stake)} → {formatCurrency(bet.potentialPayout)}
                        </span>
                        <span className="text-gray-400">
                          {new Date(bet.placedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LiveBettingDashboard;