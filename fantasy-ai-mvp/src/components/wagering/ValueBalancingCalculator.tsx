"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { GamblingFeatureGuard } from "@/components/compliance/ComplianceWrapper";
import { 
  Calculator,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  Plus,
  Minus,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Info
} from "lucide-react";

interface Player {
  id: string;
  name: string;
  position: string;
  team: string;
  stockPrice: number;
  priceChange24h: number;
  imageUrl?: string;
}

interface WagerSide {
  players: Player[];
  cashContribution: number;
  totalValue: number;
}

interface BalanceResult {
  isBalanced: boolean;
  cashAdjustment: {
    requiredBy: "creator" | "opponent" | "balanced";
    amount: number;
  };
  suggestions: string[];
  volatilityBuffer: number;
}

export function ValueBalancingCalculator() {
  const [creatorSide, setCreatorSide] = useState<WagerSide>({
    players: [],
    cashContribution: 0,
    totalValue: 0
  });

  const [opponentSide, setOpponentSide] = useState<WagerSide>({
    players: [],
    cashContribution: 0,
    totalValue: 0
  });

  const [balanceResult, setBalanceResult] = useState<BalanceResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([]);
  const [showPlayerSelector, setShowPlayerSelector] = useState<{ side: "creator" | "opponent" } | null>(null);

  // Mock data for available players
  useEffect(() => {
    setAvailablePlayers([
      {
        id: "1",
        name: "Christian McCaffrey",
        position: "RB",
        team: "SF",
        stockPrice: 920.50,
        priceChange24h: 15.25,
        imageUrl: "/api/placeholder/40/40"
      },
      {
        id: "2",
        name: "Justin Jefferson",
        position: "WR",
        team: "MIN",
        stockPrice: 715.75,
        priceChange24h: -8.30,
        imageUrl: "/api/placeholder/40/40"
      },
      {
        id: "3",
        name: "Josh Allen",
        position: "QB",
        team: "BUF",
        stockPrice: 1150.00,
        priceChange24h: 22.10,
        imageUrl: "/api/placeholder/40/40"
      },
      {
        id: "4",
        name: "Travis Kelce",
        position: "TE",
        team: "KC",
        stockPrice: 485.25,
        priceChange24h: -5.75,
        imageUrl: "/api/placeholder/40/40"
      },
      {
        id: "5",
        name: "Tyreek Hill",
        position: "WR",
        team: "MIA",
        stockPrice: 698.90,
        priceChange24h: 12.45,
        imageUrl: "/api/placeholder/40/40"
      }
    ]);
  }, []);

  const calculateBalance = async () => {
    setIsCalculating(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const creatorTotal = creatorSide.players.reduce((sum, p) => sum + p.stockPrice, 0) + creatorSide.cashContribution;
    const opponentTotal = opponentSide.players.reduce((sum, p) => sum + p.stockPrice, 0) + opponentSide.cashContribution;
    
    const difference = Math.abs(creatorTotal - opponentTotal);
    const volatilityBuffer = Math.max(creatorTotal, opponentTotal) * 0.02; // 2% buffer
    
    const isBalanced = difference <= volatilityBuffer;
    
    let cashAdjustment: BalanceResult["cashAdjustment"];
    let suggestions: string[] = [];

    if (isBalanced) {
      cashAdjustment = { requiredBy: "balanced", amount: 0 };
      suggestions = ["Wager is perfectly balanced! Ready to proceed."];
    } else {
      const needsAdjustment = creatorTotal < opponentTotal ? "creator" : "opponent";
      cashAdjustment = { requiredBy: needsAdjustment, amount: difference };
      
      suggestions = [
        `${needsAdjustment === "creator" ? "Creator" : "Opponent"} needs to add $${difference.toFixed(2)} to balance the wager`,
        difference > 100 ? "Consider swapping players with similar values to reduce cash requirement" : "Consider adding a bench player instead of cash",
        "Tip: Player values are locked when the wager is created to prevent manipulation"
      ];
    }

    setBalanceResult({
      isBalanced,
      cashAdjustment,
      suggestions,
      volatilityBuffer
    });

    setIsCalculating(false);
  };

  const addPlayerToSide = (player: Player, side: "creator" | "opponent") => {
    if (side === "creator") {
      setCreatorSide(prev => ({
        ...prev,
        players: [...prev.players, player],
        totalValue: prev.totalValue + player.stockPrice
      }));
    } else {
      setOpponentSide(prev => ({
        ...prev,
        players: [...prev.players, player],
        totalValue: prev.totalValue + player.stockPrice
      }));
    }
    setShowPlayerSelector(null);
    setBalanceResult(null); // Reset balance when players change
  };

  const removePlayerFromSide = (playerId: string, side: "creator" | "opponent") => {
    if (side === "creator") {
      const player = creatorSide.players.find(p => p.id === playerId);
      if (player) {
        setCreatorSide(prev => ({
          ...prev,
          players: prev.players.filter(p => p.id !== playerId),
          totalValue: prev.totalValue - player.stockPrice
        }));
      }
    } else {
      const player = opponentSide.players.find(p => p.id === playerId);
      if (player) {
        setOpponentSide(prev => ({
          ...prev,
          players: prev.players.filter(p => p.id !== playerId),
          totalValue: prev.totalValue - player.stockPrice
        }));
      }
    }
    setBalanceResult(null);
  };

  const updateCashContribution = (amount: number, side: "creator" | "opponent") => {
    if (side === "creator") {
      setCreatorSide(prev => ({
        ...prev,
        cashContribution: Math.max(0, amount),
        totalValue: prev.players.reduce((sum, p) => sum + p.stockPrice, 0) + Math.max(0, amount)
      }));
    } else {
      setOpponentSide(prev => ({
        ...prev,
        cashContribution: Math.max(0, amount),
        totalValue: prev.players.reduce((sum, p) => sum + p.stockPrice, 0) + Math.max(0, amount)
      }));
    }
    setBalanceResult(null);
  };

  const PlayerCard = ({ player, onRemove }: { player: Player; onRemove: () => void }) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="p-3 bg-white/5 rounded-lg border border-white/10 flex items-center justify-between"
    >
      <div className="flex items-center space-x-3">
        <img 
          src={player.imageUrl} 
          alt={player.name}
          className="w-10 h-10 rounded-full bg-gray-700"
        />
        <div>
          <p className="font-medium text-sm">{player.name}</p>
          <p className="text-xs text-gray-400">{player.position} • {player.team}</p>
        </div>
      </div>
      <div className="text-right flex items-center space-x-3">
        <div>
          <p className="font-semibold text-neon-green">${player.stockPrice.toFixed(2)}</p>
          <p className={`text-xs flex items-center ${player.priceChange24h >= 0 ? 'text-neon-green' : 'text-neon-red'}`}>
            {player.priceChange24h >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
            {player.priceChange24h >= 0 ? '+' : ''}${player.priceChange24h.toFixed(2)}
          </p>
        </div>
        <button
          onClick={onRemove}
          className="text-red-400 hover:text-red-300 transition-colors"
        >
          <Minus className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );

  const PlayerSelector = ({ side }: { side: "creator" | "opponent" }) => {
    const usedPlayerIds = [...creatorSide.players, ...opponentSide.players].map(p => p.id);
    const availableToSelect = availablePlayers.filter(p => !usedPlayerIds.includes(p.id));

    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="absolute top-full left-0 right-0 mt-2 z-50"
      >
        <GlassCard className="max-h-60 overflow-y-auto">
          <div className="space-y-2">
            {availableToSelect.map(player => (
              <button
                key={player.id}
                onClick={() => addPlayerToSide(player, side)}
                className="w-full p-3 text-left hover:bg-white/5 rounded-lg transition-colors border border-transparent hover:border-white/10"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <img 
                      src={player.imageUrl} 
                      alt={player.name}
                      className="w-8 h-8 rounded-full bg-gray-700"
                    />
                    <div>
                      <p className="font-medium text-sm">{player.name}</p>
                      <p className="text-xs text-gray-400">{player.position} • {player.team}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-neon-green">${player.stockPrice.toFixed(2)}</p>
                    <p className={`text-xs ${player.priceChange24h >= 0 ? 'text-neon-green' : 'text-neon-red'}`}>
                      {player.priceChange24h >= 0 ? '+' : ''}${player.priceChange24h.toFixed(2)}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </GlassCard>
      </motion.div>
    );
  };

  return (
    <GamblingFeatureGuard feature="WAGERING_ENABLED">
      <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold neon-text mb-2">Value Balancing Calculator</h2>
        <p className="text-gray-400">Ensure fair wagering with automatic value balancing</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Creator Side */}
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-neon-blue">Creator Side</h3>
            <div className="text-right">
              <p className="text-2xl font-bold text-neon-blue">${creatorSide.totalValue.toFixed(2)}</p>
              <p className="text-sm text-gray-400">Total Value</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Players */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium">Players</label>
                <div className="relative">
                  <button
                    onClick={() => setShowPlayerSelector(showPlayerSelector?.side === "creator" ? null : { side: "creator" })}
                    className="flex items-center gap-2 px-3 py-1 bg-neon-blue/20 text-neon-blue rounded-lg hover:bg-neon-blue/30 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Player
                  </button>
                  <AnimatePresence>
                    {showPlayerSelector?.side === "creator" && (
                      <PlayerSelector side="creator" />
                    )}
                  </AnimatePresence>
                </div>
              </div>
              
              <div className="space-y-2 min-h-[100px]">
                <AnimatePresence>
                  {creatorSide.players.map(player => (
                    <PlayerCard
                      key={player.id}
                      player={player}
                      onRemove={() => removePlayerFromSide(player.id, "creator")}
                    />
                  ))}
                </AnimatePresence>
                {creatorSide.players.length === 0 && (
                  <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-600 rounded-lg">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Add players to get started</p>
                  </div>
                )}
              </div>
            </div>

            {/* Cash Contribution */}
            <div>
              <label className="text-sm font-medium mb-2 block">Cash Contribution</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  value={creatorSide.cashContribution}
                  onChange={(e) => updateCashContribution(parseFloat(e.target.value) || 0, "creator")}
                  className="w-full pl-10 pr-4 py-2 bg-gray-900/50 border border-white/10 rounded-lg focus:border-neon-blue focus:outline-none"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Opponent Side */}
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-neon-purple">Opponent Side</h3>
            <div className="text-right">
              <p className="text-2xl font-bold text-neon-purple">${opponentSide.totalValue.toFixed(2)}</p>
              <p className="text-sm text-gray-400">Total Value</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Players */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium">Players</label>
                <div className="relative">
                  <button
                    onClick={() => setShowPlayerSelector(showPlayerSelector?.side === "opponent" ? null : { side: "opponent" })}
                    className="flex items-center gap-2 px-3 py-1 bg-neon-purple/20 text-neon-purple rounded-lg hover:bg-neon-purple/30 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Player
                  </button>
                  <AnimatePresence>
                    {showPlayerSelector?.side === "opponent" && (
                      <PlayerSelector side="opponent" />
                    )}
                  </AnimatePresence>
                </div>
              </div>
              
              <div className="space-y-2 min-h-[100px]">
                <AnimatePresence>
                  {opponentSide.players.map(player => (
                    <PlayerCard
                      key={player.id}
                      player={player}
                      onRemove={() => removePlayerFromSide(player.id, "opponent")}
                    />
                  ))}
                </AnimatePresence>
                {opponentSide.players.length === 0 && (
                  <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-600 rounded-lg">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Add players to get started</p>
                  </div>
                )}
              </div>
            </div>

            {/* Cash Contribution */}
            <div>
              <label className="text-sm font-medium mb-2 block">Cash Contribution</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  value={opponentSide.cashContribution}
                  onChange={(e) => updateCashContribution(parseFloat(e.target.value) || 0, "opponent")}
                  className="w-full pl-10 pr-4 py-2 bg-gray-900/50 border border-white/10 rounded-lg focus:border-neon-purple focus:outline-none"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Calculate Button */}
      <div className="text-center">
        <NeonButton
          onClick={calculateBalance}
          disabled={isCalculating || (creatorSide.players.length === 0 && opponentSide.players.length === 0)}
          className="px-8 py-3 text-lg"
          variant="green"
        >
          {isCalculating ? (
            <>
              <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
              Calculating Balance...
            </>
          ) : (
            <>
              <Calculator className="w-5 h-5 mr-2" />
              Calculate Fair Value Balance
            </>
          )}
        </NeonButton>
      </div>

      {/* Balance Result */}
      <AnimatePresence>
        {balanceResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <GlassCard className={`border-l-4 ${balanceResult.isBalanced ? 'border-l-neon-green' : 'border-l-neon-yellow'}`}>
              <div className="flex items-start space-x-4">
                <div className={`p-2 rounded-full ${balanceResult.isBalanced ? 'bg-neon-green/20' : 'bg-neon-yellow/20'}`}>
                  {balanceResult.isBalanced ? (
                    <CheckCircle className="w-6 h-6 text-neon-green" />
                  ) : (
                    <AlertTriangle className="w-6 h-6 text-neon-yellow" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2">
                    {balanceResult.isBalanced ? "Wager is Balanced!" : "Balance Adjustment Required"}
                  </h3>
                  
                  {!balanceResult.isBalanced && (
                    <div className="mb-4 p-3 bg-neon-yellow/10 rounded-lg border border-neon-yellow/20">
                      <p className="font-medium text-neon-yellow">
                        {balanceResult.cashAdjustment.requiredBy === "creator" ? "Creator" : "Opponent"} needs to add:
                      </p>
                      <p className="text-2xl font-bold text-neon-yellow">
                        ${balanceResult.cashAdjustment.amount.toFixed(2)}
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <Info className="w-4 h-4" />
                      Suggestions:
                    </h4>
                    {balanceResult.suggestions.map((suggestion, index) => (
                      <p key={index} className="text-sm text-gray-300 bg-white/5 p-2 rounded">
                        • {suggestion}
                      </p>
                    ))}
                  </div>

                  <div className="mt-4 text-xs text-gray-400">
                    <p>Volatility buffer: ±${balanceResult.volatilityBuffer.toFixed(2)} (2% of total value)</p>
                    <p>Player prices will be locked when wager is created to prevent manipulation</p>
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </GamblingFeatureGuard>
  );
}