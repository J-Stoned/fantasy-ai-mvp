"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Search, 
  Filter,
  Star,
  AlertCircle,
  CheckCircle,
  Zap,
  BarChart3,
  Target,
  Info
} from "lucide-react";

interface DFSPlayer {
  id: string;
  name: string;
  team: string;
  position: string;
  salary: number;
  projectedPoints: number;
  value: number;
  ownership: number;
  gameTime: Date;
  opponent: string;
  injuryStatus?: string;
  isActive: boolean;
}

interface LineupSlot {
  position: string;
  slotName: string;
  player?: DFSPlayer;
  required: boolean;
}

interface LineupBuilderProps {
  contestId: string;
  salaryCap: number;
  onSaveLineup: (lineup: any) => void;
  onEnterContest: () => void;
}

export function LineupBuilder({ contestId, salaryCap, onSaveLineup, onEnterContest }: LineupBuilderProps) {
  const [players, setPlayers] = useState<DFSPlayer[]>([]);
  const [lineup, setLineup] = useState<LineupSlot[]>([
    { position: "QB", slotName: "Quarterback", required: true },
    { position: "RB", slotName: "Running Back 1", required: true },
    { position: "RB", slotName: "Running Back 2", required: true },
    { position: "WR", slotName: "Wide Receiver 1", required: true },
    { position: "WR", slotName: "Wide Receiver 2", required: true },
    { position: "WR", slotName: "Wide Receiver 3", required: true },
    { position: "TE", slotName: "Tight End", required: true },
    { position: "FLEX", slotName: "Flex (RB/WR/TE)", required: true },
    { position: "DST", slotName: "Defense", required: true }
  ]);
  const [selectedPlayer, setSelectedPlayer] = useState<DFSPlayer | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [positionFilter, setPositionFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("projectedPoints");
  const [loading, setLoading] = useState(true);

  // Mock player data - replace with actual API call
  useEffect(() => {
    const mockPlayers: DFSPlayer[] = [
      {
        id: "1",
        name: "Josh Allen",
        team: "BUF",
        position: "QB",
        salary: 8500,
        projectedPoints: 22.5,
        value: 2.65,
        ownership: 15.2,
        gameTime: new Date(Date.now() + 3600000),
        opponent: "MIA",
        isActive: true
      },
      {
        id: "2", 
        name: "Christian McCaffrey",
        team: "SF",
        position: "RB",
        salary: 9200,
        projectedPoints: 21.8,
        value: 2.37,
        ownership: 28.5,
        gameTime: new Date(Date.now() + 3600000),
        opponent: "LAR",
        isActive: true
      },
      {
        id: "3",
        name: "Cooper Kupp",
        team: "LAR", 
        position: "WR",
        salary: 7800,
        projectedPoints: 18.2,
        value: 2.33,
        ownership: 22.1,
        gameTime: new Date(Date.now() + 3600000),
        opponent: "SF",
        injuryStatus: "Questionable",
        isActive: true
      },
      {
        id: "4",
        name: "Travis Kelce",
        team: "KC",
        position: "TE", 
        salary: 6900,
        projectedPoints: 15.8,
        value: 2.29,
        ownership: 18.7,
        gameTime: new Date(Date.now() + 3600000),
        opponent: "DEN",
        isActive: true
      },
      {
        id: "5",
        name: "San Francisco",
        team: "SF",
        position: "DST",
        salary: 3200,
        projectedPoints: 8.5,
        value: 2.66,
        ownership: 12.3,
        gameTime: new Date(Date.now() + 3600000),
        opponent: "LAR",
        isActive: true
      }
    ];

    setTimeout(() => {
      setPlayers(mockPlayers);
      setLoading(false);
    }, 1000);
  }, [contestId]);

  const totalSalary = lineup.reduce((sum, slot) => sum + (slot.player?.salary || 0), 0);
  const totalProjected = lineup.reduce((sum, slot) => sum + (slot.player?.projectedPoints || 0), 0);
  const remainingSalary = salaryCap - totalSalary;
  const filledSlots = lineup.filter(slot => slot.player).length;
  const isLineupComplete = filledSlots === lineup.length;

  const filteredPlayers = players.filter(player => {
    const matchesSearch = player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         player.team.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPosition = positionFilter === "ALL" || 
                           player.position === positionFilter ||
                           (positionFilter === "FLEX" && ["RB", "WR", "TE"].includes(player.position));
    const canAfford = player.salary <= remainingSalary + (selectedSlot !== null && lineup[selectedSlot].player?.salary || 0);
    const notInLineup = !lineup.some(slot => slot.player?.id === player.id);
    
    return matchesSearch && matchesPosition && canAfford && notInLineup;
  });

  const sortedPlayers = [...filteredPlayers].sort((a, b) => {
    switch (sortBy) {
      case "salary":
        return b.salary - a.salary;
      case "value":
        return b.value - a.value;
      case "ownership":
        return a.ownership - b.ownership;
      default:
        return b.projectedPoints - a.projectedPoints;
    }
  });

  const addPlayerToLineup = (player: DFSPlayer, slotIndex: number) => {
    const newLineup = [...lineup];
    
    // Remove previous player if exists
    if (newLineup[slotIndex].player) {
      // Player is being replaced
    }
    
    // Check position compatibility
    const slot = newLineup[slotIndex];
    const canPlay = slot.position === player.position || 
                   (slot.position === "FLEX" && ["RB", "WR", "TE"].includes(player.position));
    
    if (!canPlay) return;
    
    newLineup[slotIndex] = { ...slot, player };
    setLineup(newLineup);
    setSelectedSlot(null);
    setSelectedPlayer(null);
  };

  const removePlayerFromLineup = (slotIndex: number) => {
    const newLineup = [...lineup];
    newLineup[slotIndex] = { ...newLineup[slotIndex], player: undefined };
    setLineup(newLineup);
  };

  const getPlayerRowColor = (player: DFSPlayer) => {
    if (player.injuryStatus) return "border-neon-yellow/30 bg-neon-yellow/5";
    if (player.value > 2.5) return "border-neon-green/30 bg-neon-green/5";
    if (player.ownership < 10) return "border-neon-blue/30 bg-neon-blue/5";
    return "border-white/10";
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-white/10 rounded-lg" />
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-white/5 rounded-lg" />
            ))}
          </div>
          <div className="space-y-4">
            <div className="h-64 bg-white/5 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Lineup Builder
          </h1>
          <p className="text-gray-400">
            Build your optimal lineup within the salary cap
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-2xl font-bold text-neon-green">
              ${remainingSalary.toLocaleString()}
            </div>
            <div className="text-sm text-gray-400">Remaining</div>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold text-neon-blue">
              {totalProjected.toFixed(1)}
            </div>
            <div className="text-sm text-gray-400">Projected</div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Player Pool */}
        <div className="lg:col-span-2 space-y-4">
          <GlassCard className="p-4">
            <div className="flex flex-col lg:flex-row gap-4 mb-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search players..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-neon-blue/50"
                />
              </div>

              {/* Position Filter */}
              <select
                value={positionFilter}
                onChange={(e) => setPositionFilter(e.target.value)}
                className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-neon-blue/50"
              >
                <option value="ALL">All Positions</option>
                <option value="QB">QB</option>
                <option value="RB">RB</option>
                <option value="WR">WR</option>
                <option value="TE">TE</option>
                <option value="FLEX">FLEX</option>
                <option value="DST">DST</option>
              </select>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-neon-blue/50"
              >
                <option value="projectedPoints">Projected Points</option>
                <option value="salary">Salary</option>
                <option value="value">Value</option>
                <option value="ownership">Low Ownership</option>
              </select>
            </div>

            {/* Player List */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {sortedPlayers.map((player) => (
                <motion.div
                  key={player.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-all hover:border-neon-blue/50 ${getPlayerRowColor(player)}`}
                  onClick={() => {
                    if (selectedSlot !== null) {
                      addPlayerToLineup(player, selectedSlot);
                    } else {
                      setSelectedPlayer(player);
                    }
                  }}
                  whileHover={{ scale: 1.01 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-neon-blue/20 rounded-lg flex items-center justify-center">
                        <span className="text-xs font-bold text-neon-blue">
                          {player.position}
                        </span>
                      </div>
                      <div>
                        <div className="font-semibold text-white flex items-center gap-2">
                          {player.name}
                          {player.injuryStatus && (
                            <AlertCircle className="w-4 h-4 text-neon-yellow" />
                          )}
                        </div>
                        <div className="text-sm text-gray-400">
                          {player.team} vs {player.opponent}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="font-bold text-white">
                        ${player.salary.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-400">
                        {player.projectedPoints.toFixed(1)} pts
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-sm font-medium text-neon-green">
                        {player.value.toFixed(2)}x
                      </div>
                      <div className="text-xs text-gray-400">
                        {player.ownership.toFixed(1)}% own
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Lineup Card */}
        <div className="space-y-4">
          <GlassCard className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">
                Your Lineup
              </h3>
              <div className="text-sm text-gray-400">
                {filledSlots}/9 filled
              </div>
            </div>

            {/* Salary Cap Progress */}
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">Salary Used</span>
                <span className="text-white">
                  ${totalSalary.toLocaleString()} / ${salaryCap.toLocaleString()}
                </span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div 
                  className="bg-neon-blue h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(totalSalary / salaryCap) * 100}%` }}
                />
              </div>
            </div>

            {/* Lineup Slots */}
            <div className="space-y-2 mb-6">
              {lineup.map((slot, index) => (
                <div
                  key={`${slot.position}-${index}`}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedSlot === index
                      ? "border-neon-blue bg-neon-blue/10"
                      : slot.player
                      ? "border-neon-green/30 bg-neon-green/5"
                      : "border-white/10 hover:border-white/20"
                  }`}
                  onClick={() => setSelectedSlot(selectedSlot === index ? null : index)}
                >
                  {slot.player ? (
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-white">
                          {slot.player.name}
                        </div>
                        <div className="text-sm text-gray-400">
                          {slot.slotName}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-white">
                          ${slot.player.salary.toLocaleString()}
                        </div>
                        <div className="text-sm text-neon-green">
                          {slot.player.projectedPoints.toFixed(1)} pts
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removePlayerFromLineup(index);
                        }}
                        className="text-neon-red hover:text-red-400 ml-2"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-2">
                      <div className="text-gray-400 text-sm">
                        {slot.slotName}
                      </div>
                      <div className="text-xs text-gray-500">
                        Click to select player
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <NeonButton
                variant="blue"
                onClick={() => onSaveLineup(lineup)}
                className="w-full"
                disabled={!isLineupComplete}
              >
                <Zap className="w-4 h-4 mr-2" />
                Save Lineup
              </NeonButton>
              
              <NeonButton
                variant="green"
                onClick={onEnterContest}
                className="w-full"
                disabled={!isLineupComplete}
              >
                <Target className="w-4 h-4 mr-2" />
                Enter Contest
              </NeonButton>
            </div>

            {/* Lineup Stats */}
            <div className="mt-4 pt-4 border-t border-white/10">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-lg font-bold text-white">
                    {totalProjected.toFixed(1)}
                  </div>
                  <div className="text-xs text-gray-400">Projected Points</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-neon-green">
                    {totalSalary > 0 ? (totalProjected / (totalSalary / 1000)).toFixed(2) : "0.00"}
                  </div>
                  <div className="text-xs text-gray-400">Points/$1K</div>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

export default LineupBuilder;