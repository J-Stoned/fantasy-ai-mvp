"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { GlassCard } from "./GlassCard";
import { NeonButton } from "./NeonButton";
import { EnhancedPlayerCard } from "./EnhancedPlayerCard";
import { 
  Users,
  Zap,
  Target,
  RotateCcw,
  Save,
  Brain,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  Plus,
  X,
  Shuffle,
  Eye
} from "lucide-react";

interface LineupPlayer {
  id: string;
  name: string;
  position: string;
  team: string;
  opponent: string;
  projectedPoints: number;
  lastWeekPoints: number;
  seasonAverage: number;
  injuryStatus?: string;
  confidence: number;
  trend: "up" | "down" | "stable";
  matchupRating: "excellent" | "good" | "average" | "difficult";
  isStarter: boolean;
  ownership?: number;
}

interface LineupSlot {
  position: string;
  player: LineupPlayer | null;
  isRequired: boolean;
  isFlexible?: boolean;
}

interface InteractiveLineupBuilderProps {
  initialLineup?: LineupSlot[];
  availablePlayers: LineupPlayer[];
  onLineupChange?: (lineup: LineupSlot[]) => void;
  className?: string;
}

export function InteractiveLineupBuilder({
  initialLineup,
  availablePlayers,
  onLineupChange,
  className
}: InteractiveLineupBuilderProps) {
  const [lineup, setLineup] = useState<LineupSlot[]>(
    initialLineup || [
      { position: "QB", player: null, isRequired: true },
      { position: "RB", player: null, isRequired: true },
      { position: "RB", player: null, isRequired: true },
      { position: "WR", player: null, isRequired: true },
      { position: "WR", player: null, isRequired: true },
      { position: "TE", player: null, isRequired: true },
      { position: "FLEX", player: null, isRequired: true, isFlexible: true },
      { position: "K", player: null, isRequired: true },
      { position: "DST", player: null, isRequired: true }
    ]
  );

  const [showBench, setShowBench] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [optimizing, setOptimizing] = useState(false);
  const [lineupStats, setLineupStats] = useState({
    totalProjected: 0,
    confidence: 0,
    matchupScore: 0,
    salary: 0,
    remainingSalary: 50000
  });

  // Calculate lineup statistics
  useEffect(() => {
    const playersInLineup = lineup.filter(slot => slot.player).map(slot => slot.player!);
    const totalProjected = playersInLineup.reduce((sum, player) => sum + player.projectedPoints, 0);
    const avgConfidence = playersInLineup.length > 0 
      ? playersInLineup.reduce((sum, player) => sum + player.confidence, 0) / playersInLineup.length 
      : 0;
    
    const matchupScores = {
      excellent: 4,
      good: 3,
      average: 2,
      difficult: 1
    };
    const matchupScore = playersInLineup.length > 0
      ? playersInLineup.reduce((sum, player) => sum + matchupScores[player.matchupRating], 0) / playersInLineup.length
      : 0;

    setLineupStats({
      totalProjected,
      confidence: avgConfidence,
      matchupScore,
      salary: Math.floor(Math.random() * 35000) + 15000, // Mock salary
      remainingSalary: 50000 - (Math.floor(Math.random() * 35000) + 15000)
    });

    onLineupChange?.(lineup);
  }, [lineup, onLineupChange]);

  const canAcceptPlayer = (slotIndex: number, player: LineupPlayer): boolean => {
    const slot = lineup[slotIndex];
    if (slot.isFlexible) {
      return ["RB", "WR", "TE"].includes(player.position);
    }
    return slot.position === player.position;
  };

  const addPlayerToSlot = (slotIndex: number, player: LineupPlayer) => {
    if (!canAcceptPlayer(slotIndex, player)) return;

    // Remove player from current slot if already in lineup
    const newLineup = lineup.map(slot => 
      slot.player?.id === player.id ? { ...slot, player: null } : slot
    );

    // Add player to new slot
    newLineup[slotIndex] = { ...newLineup[slotIndex], player };
    setLineup(newLineup);
  };

  const removePlayerFromSlot = (slotIndex: number) => {
    const newLineup = [...lineup];
    newLineup[slotIndex] = { ...newLineup[slotIndex], player: null };
    setLineup(newLineup);
  };

  const optimizeLineup = async () => {
    setOptimizing(true);
    
    // Simulate AI optimization
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock optimization - fill empty slots with best available players
    const newLineup = [...lineup];
    const usedPlayerIds = new Set(lineup.filter(slot => slot.player).map(slot => slot.player!.id));
    
    for (let i = 0; i < newLineup.length; i++) {
      if (!newLineup[i].player) {
        const availableForSlot = availablePlayers.filter(player => 
          !usedPlayerIds.has(player.id) && canAcceptPlayer(i, player)
        );
        
        if (availableForSlot.length > 0) {
          const bestPlayer = availableForSlot.sort((a, b) => b.projectedPoints - a.projectedPoints)[0];
          newLineup[i].player = bestPlayer;
          usedPlayerIds.add(bestPlayer.id);
        }
      }
    }
    
    setLineup(newLineup);
    setOptimizing(false);
  };

  const getSlotColor = (slot: LineupSlot): string => {
    if (!slot.player) return "gray-600";
    
    const colors: Record<string, string> = {
      QB: "neon-blue",
      RB: "neon-green",
      WR: "neon-purple", 
      TE: "neon-pink",
      FLEX: "neon-yellow",
      K: "neon-orange",
      DST: "neon-cyan"
    };
    return colors[slot.position] || "gray-600";
  };

  const getLineupValidation = () => {
    const filledSlots = lineup.filter(slot => slot.player && slot.isRequired).length;
    const requiredSlots = lineup.filter(slot => slot.isRequired).length;
    
    if (filledSlots === requiredSlots) {
      return { isValid: true, message: "Lineup is complete and valid", color: "neon-green" };
    } else {
      return { 
        isValid: false, 
        message: `${requiredSlots - filledSlots} slots remaining`, 
        color: "neon-yellow" 
      };
    }
  };

  const validation = getLineupValidation();

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-neon-blue" />
            Interactive Lineup Builder
          </h3>
          <p className="text-sm text-gray-400">Drag & drop or click to build your optimal lineup</p>
        </div>
        
        <div className="flex gap-2">
          <NeonButton
            size="sm"
            variant="purple"
            onClick={optimizeLineup}
            disabled={optimizing}
            className="flex items-center gap-1"
          >
            {optimizing ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Brain className="w-4 h-4" />
              </motion.div>
            ) : (
              <Brain className="w-4 h-4" />
            )}
            {optimizing ? "Optimizing..." : "AI Optimize"}
          </NeonButton>
          
          <NeonButton
            size="sm"
            variant="green"
            disabled={!validation.isValid}
            className="flex items-center gap-1"
          >
            <Save className="w-4 h-4" />
            Save Lineup
          </NeonButton>
        </div>
      </div>

      {/* Lineup Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard className="p-3">
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-4 h-4 text-neon-blue" />
            <span className="text-xs text-gray-400">PROJECTED</span>
          </div>
          <p className="text-lg font-bold text-neon-blue">
            {lineupStats.totalProjected.toFixed(1)}
          </p>
        </GlassCard>

        <GlassCard className="p-3">
          <div className="flex items-center gap-2 mb-1">
            <Eye className="w-4 h-4 text-neon-green" />
            <span className="text-xs text-gray-400">CONFIDENCE</span>
          </div>
          <p className="text-lg font-bold text-neon-green">
            {(lineupStats.confidence * 100).toFixed(0)}%
          </p>
        </GlassCard>

        <GlassCard className="p-3">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-neon-purple" />
            <span className="text-xs text-gray-400">MATCHUPS</span>
          </div>
          <p className="text-lg font-bold text-neon-purple">
            {lineupStats.matchupScore.toFixed(1)}/4
          </p>
        </GlassCard>

        <GlassCard className="p-3">
          <div className="flex items-center gap-2 mb-1">
            {validation.isValid ? (
              <CheckCircle className="w-4 h-4 text-neon-green" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-neon-yellow" />
            )}
            <span className="text-xs text-gray-400">STATUS</span>
          </div>
          <p className={`text-sm font-bold text-${validation.color}`}>
            {validation.message}
          </p>
        </GlassCard>
      </div>

      {/* Lineup Slots */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <h4 className="font-semibold mb-3 text-neon-blue">Starting Lineup</h4>
          <Reorder.Group
            values={lineup}
            onReorder={setLineup}
            className="space-y-2"
          >
            {lineup.map((slot, index) => (
              <Reorder.Item
                key={`${slot.position}-${index}`}
                value={slot}
                className="cursor-move"
              >
                <motion.div
                  layout
                  className={`relative`}
                  whileHover={{ scale: 1.02 }}
                  onTap={() => setSelectedSlot(selectedSlot === index ? null : index)}
                >
                  <GlassCard className={`p-4 transition-all duration-200 ${
                    selectedSlot === index ? `border-${getSlotColor(slot)} glow-sm` : ''
                  }`}>
                    <div className="flex items-center justify-between">
                      {/* Position Label */}
                      <div className={`px-3 py-1 rounded-full bg-${getSlotColor(slot)}/20 text-${getSlotColor(slot)} font-bold text-sm min-w-[60px] text-center`}>
                        {slot.position}
                      </div>

                      {/* Player Info or Empty Slot */}
                      {slot.player ? (
                        <div className="flex-1 mx-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold text-white">{slot.player.name}</h4>
                              <p className="text-sm text-gray-400">{slot.player.team} vs {slot.player.opponent}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-neon-blue">
                                {slot.player.projectedPoints.toFixed(1)}
                              </p>
                              <p className="text-xs text-gray-400">projected</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex-1 mx-4 flex items-center justify-center py-4">
                          <div className="text-center text-gray-500">
                            <Plus className="w-6 h-6 mx-auto mb-1" />
                            <p className="text-sm">Add {slot.position}</p>
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {slot.player && (
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              removePlayerFromSlot(index);
                            }}
                            className="text-neon-red hover:bg-neon-red/20 p-1 rounded"
                          >
                            <X className="w-4 h-4" />
                          </motion.button>
                        )}
                        
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="text-gray-400 hover:text-white p-1"
                        >
                          <Shuffle className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </div>

                    {/* Slot Selection Indicator */}
                    {selectedSlot === index && (
                      <motion.div
                        layoutId="selected-slot"
                        className={`absolute bottom-0 left-0 right-0 h-1 bg-${getSlotColor(slot)}`}
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                      />
                    )}
                  </GlassCard>
                </motion.div>
              </Reorder.Item>
            ))}
          </Reorder.Group>
        </div>

        {/* Available Players Panel */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-neon-purple">Available Players</h4>
            <NeonButton
              size="sm"
              variant={showBench ? "blue" : "purple"}
              onClick={() => setShowBench(!showBench)}
            >
              {showBench ? "Starters" : "All"}
            </NeonButton>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            <AnimatePresence>
              {availablePlayers
                .filter(player => {
                  const inLineup = lineup.some(slot => slot.player?.id === player.id);
                  return !inLineup && (showBench || player.isStarter);
                })
                .slice(0, 10)
                .map((player, index) => (
                  <motion.div
                    key={player.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <EnhancedPlayerCard
                      player={player}
                      onClick={() => {
                        // Auto-assign to appropriate slot
                        const emptySlotIndex = lineup.findIndex(slot => 
                          !slot.player && canAcceptPlayer(lineup.indexOf(slot), player)
                        );
                        if (emptySlotIndex >= 0) {
                          addPlayerToSlot(emptySlotIndex, player);
                        }
                      }}
                      className="scale-90 origin-top"
                    />
                  </motion.div>
                ))}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Optimization Loading Overlay */}
      <AnimatePresence>
        {optimizing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
          >
            <GlassCard className="p-8 text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="mx-auto mb-4"
              >
                <Brain className="w-12 h-12 text-neon-blue" />
              </motion.div>
              <h3 className="text-xl font-bold text-white mb-2">AI Optimizing Lineup</h3>
              <p className="text-gray-400">Analyzing matchups and projections...</p>
              <div className="w-48 h-2 bg-gray-700 rounded-full mt-4 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-neon-blue to-neon-purple"
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 2 }}
                />
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}