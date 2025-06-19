"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { 
  Trophy, 
  Users, 
  Clock, 
  DollarSign, 
  Zap, 
  Filter,
  Search,
  TrendingUp,
  Star,
  Crown,
  Target
} from "lucide-react";

interface Contest {
  id: string;
  name: string;
  description: string;
  sport: string;
  contestType: string;
  entryFee: number;
  totalPrizePool: number;
  maxEntries: number;
  currentEntries: number;
  salaryCap: number;
  startTime: Date;
  endTime: Date;
  status: string;
  isGuaranteed: boolean;
  firstPlace: number;
}

interface ContestLobbyProps {
  onEnterContest: (contestId: string) => void;
  onCreateLineup: (contestId: string) => void;
}

export function ContestLobby({ onEnterContest, onCreateLineup }: ContestLobbyProps) {
  const [contests, setContests] = useState<Contest[]>([]);
  const [filteredContests, setFilteredContests] = useState<Contest[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  // Mock contest data - replace with actual API call
  useEffect(() => {
    const mockContests: Contest[] = [
      {
        id: "1",
        name: "Sunday Million",
        description: "Massive tournament with guaranteed prize pool",
        sport: "FOOTBALL",
        contestType: "TOURNAMENT",
        entryFee: 20,
        totalPrizePool: 1000000,
        maxEntries: 100000,
        currentEntries: 87543,
        salaryCap: 50000,
        startTime: new Date(Date.now() + 3600000),
        endTime: new Date(Date.now() + 14400000),
        status: "UPCOMING",
        isGuaranteed: true,
        firstPlace: 150000
      },
      {
        id: "2", 
        name: "Beginner Friendly",
        description: "Perfect for new DFS players",
        sport: "FOOTBALL",
        contestType: "CASH_GAME",
        entryFee: 1,
        totalPrizePool: 100,
        maxEntries: 100,
        currentEntries: 76,
        salaryCap: 50000,
        startTime: new Date(Date.now() + 1800000),
        endTime: new Date(Date.now() + 5400000),
        status: "UPCOMING",
        isGuaranteed: false,
        firstPlace: 180
      },
      {
        id: "3",
        name: "High Roller",
        description: "Elite players only - $500 entry",
        sport: "FOOTBALL", 
        contestType: "TOURNAMENT",
        entryFee: 500,
        totalPrizePool: 50000,
        maxEntries: 200,
        currentEntries: 156,
        salaryCap: 50000,
        startTime: new Date(Date.now() + 2700000),
        endTime: new Date(Date.now() + 10800000),
        status: "UPCOMING",
        isGuaranteed: true,
        firstPlace: 15000
      }
    ];

    setTimeout(() => {
      setContests(mockContests);
      setFilteredContests(mockContests);
      setLoading(false);
    }, 1000);
  }, []);

  useEffect(() => {
    let filtered = contests;

    if (searchTerm) {
      filtered = filtered.filter(contest => 
        contest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contest.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedFilter !== "all") {
      filtered = filtered.filter(contest => {
        switch (selectedFilter) {
          case "tournaments":
            return contest.contestType === "TOURNAMENT";
          case "cash":
            return contest.contestType === "CASH_GAME";
          case "beginner":
            return contest.entryFee <= 5;
          case "guaranteed":
            return contest.isGuaranteed;
          default:
            return true;
        }
      });
    }

    setFilteredContests(filtered);
  }, [contests, searchTerm, selectedFilter]);

  const formatPrizePool = (amount: number) => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount}`;
  };

  const formatTimeUntilStart = (startTime: Date) => {
    const now = new Date();
    const diff = startTime.getTime() - now.getTime();
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getContestTypeColor = (type: string) => {
    switch (type) {
      case "TOURNAMENT":
        return "neon-purple";
      case "CASH_GAME":
        return "neon-green";
      case "HEAD_TO_HEAD":
        return "neon-blue";
      default:
        return "neon-yellow";
    }
  };

  const getContestTypeIcon = (type: string) => {
    switch (type) {
      case "TOURNAMENT":
        return Crown;
      case "CASH_GAME":
        return DollarSign;
      case "HEAD_TO_HEAD":
        return Target;
      default:
        return Trophy;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-white/10 rounded-lg mb-4" />
          <div className="grid gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-white/5 rounded-xl" />
            ))}
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
            Contest Lobby
          </h1>
          <p className="text-gray-400">
            Choose your contest and compete for massive prizes
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="px-3 py-1 bg-neon-green/20 rounded-full border border-neon-green/30">
            <span className="text-sm text-neon-green font-medium">
              {contests.length} Live Contests
            </span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <GlassCard className="p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search contests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-neon-blue/50"
            />
          </div>

          {/* Filter Buttons */}
          <div className="flex gap-2 flex-wrap">
            {[
              { key: "all", label: "All" },
              { key: "tournaments", label: "Tournaments" },
              { key: "cash", label: "Cash Games" },
              { key: "beginner", label: "Beginner" },
              { key: "guaranteed", label: "Guaranteed" }
            ].map((filter) => (
              <button
                key={filter.key}
                onClick={() => setSelectedFilter(filter.key)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  selectedFilter === filter.key
                    ? "bg-neon-blue/20 text-neon-blue border border-neon-blue/30"
                    : "bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* Contest Grid */}
      <div className="grid gap-4">
        <AnimatePresence>
          {filteredContests.map((contest, index) => {
            const TypeIcon = getContestTypeIcon(contest.contestType);
            const typeColor = getContestTypeColor(contest.contestType);
            const fillPercentage = (contest.currentEntries / contest.maxEntries) * 100;
            
            return (
              <motion.div
                key={contest.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
              >
                <GlassCard className="p-6 hover:border-neon-blue/50 transition-all duration-300 group">
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Contest Info */}
                    <div className="flex-1 space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 bg-${typeColor}/20 rounded-xl flex items-center justify-center`}>
                            <TypeIcon className={`w-6 h-6 text-${typeColor}`} />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-white">
                              {contest.name}
                            </h3>
                            <p className="text-gray-400 text-sm">
                              {contest.description}
                            </p>
                          </div>
                        </div>
                        
                        {contest.isGuaranteed && (
                          <div className="px-2 py-1 bg-neon-yellow/20 rounded-full border border-neon-yellow/30">
                            <span className="text-xs text-neon-yellow font-medium">
                              GUARANTEED
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Contest Stats */}
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-neon-green">
                            {formatPrizePool(contest.totalPrizePool)}
                          </div>
                          <div className="text-xs text-gray-400">Prize Pool</div>
                        </div>
                        
                        <div className="text-center">
                          <div className="text-2xl font-bold text-white">
                            ${contest.entryFee}
                          </div>
                          <div className="text-xs text-gray-400">Entry Fee</div>
                        </div>
                        
                        <div className="text-center">
                          <div className="text-2xl font-bold text-neon-blue">
                            {contest.currentEntries.toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-400">
                            of {contest.maxEntries.toLocaleString()} entries
                          </div>
                        </div>
                        
                        <div className="text-center">
                          <div className="text-2xl font-bold text-neon-purple">
                            {formatTimeUntilStart(contest.startTime)}
                          </div>
                          <div className="text-xs text-gray-400">Starts in</div>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Contest Fill</span>
                          <span className="text-white">{fillPercentage.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-2">
                          <div 
                            className={`bg-${typeColor} h-2 rounded-full transition-all duration-300`}
                            style={{ width: `${fillPercentage}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col justify-center gap-3 lg:w-48">
                      <div className="text-center mb-2">
                        <div className="text-lg font-bold text-neon-green">
                          {formatPrizePool(contest.firstPlace)}
                        </div>
                        <div className="text-xs text-gray-400">1st Place</div>
                      </div>
                      
                      <NeonButton
                        variant="blue"
                        onClick={() => onCreateLineup(contest.id)}
                        className="w-full flex items-center justify-center gap-2"
                      >
                        <Zap className="w-4 h-4" />
                        Create Lineup
                      </NeonButton>
                      
                      <NeonButton
                        variant="purple"
                        onClick={() => onEnterContest(contest.id)}
                        className="w-full flex items-center justify-center gap-2"
                      >
                        <Trophy className="w-4 h-4" />
                        Enter Contest
                      </NeonButton>
                      
                      <div className="text-center">
                        <span className="text-xs text-gray-400">
                          Salary Cap: ${contest.salaryCap.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {filteredContests.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">
            No contests found
          </h3>
          <p className="text-gray-400">
            Try adjusting your search or filter criteria
          </p>
        </div>
      )}
    </div>
  );
}

export default ContestLobby;