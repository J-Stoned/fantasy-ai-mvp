"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { 
  Clock, 
  Users, 
  Trophy, 
  Search,
  Filter,
  Play,
  Pause,
  User,
  Crown,
  Timer,
  Target,
  Zap,
  AlertCircle,
  CheckCircle,
  MessageCircle,
  TrendingUp,
  Star
} from "lucide-react";

interface DraftPlayer {
  id: string;
  name: string;
  position: string;
  team: string;
  adp: number;
  projectedPoints: number;
  positionRank: number;
  overallRank: number;
  tier: number;
  byeWeek: number;
  isInjured: boolean;
  injuryStatus?: string;
}

interface DraftParticipant {
  id: string;
  userId: string;
  userName: string;
  draftPosition: number;
  teamName?: string;
  isReady: boolean;
  isAutoPick: boolean;
  timeouts: number;
  totalSpent: number;
  avatar?: string;
  isOnline: boolean;
  currentPick?: string;
}

interface DraftPick {
  id: string;
  participantId: string;
  playerId: string;
  playerName: string;
  playerPosition: string;
  playerTeam: string;
  round: number;
  pick: number;
  pickInRound: number;
  auctionPrice?: number;
  isAutoPick: boolean;
  timeToMake?: number;
}

interface LiveDraftRoomProps {
  draftId: string;
  userId: string;
  onMakePick: (playerId: string, auctionPrice?: number) => void;
  onLeaveDraft: () => void;
}

export function LiveDraftRoom({ draftId, userId, onMakePick, onLeaveDraft }: LiveDraftRoomProps) {
  const [participants, setParticipants] = useState<DraftParticipant[]>([]);
  const [availablePlayers, setAvailablePlayers] = useState<DraftPlayer[]>([]);
  const [picks, setPicks] = useState<DraftPick[]>([]);
  const [currentPickerId, setCurrentPickerId] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(90);
  const [currentRound, setCurrentRound] = useState(1);
  const [currentPick, setCurrentPick] = useState(1);
  const [selectedPlayer, setSelectedPlayer] = useState<DraftPlayer | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [positionFilter, setPositionFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("adp");
  const [showMyTeam, setShowMyTeam] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isAuction, setIsAuction] = useState(false);
  const [auctionPrice, setAuctionPrice] = useState(1);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Mock data initialization
  useEffect(() => {
    // Initialize mock draft data
    const mockParticipants: DraftParticipant[] = [
      {
        id: 'p1',
        userId: userId,
        userName: 'You',
        draftPosition: 1,
        teamName: 'Your Team',
        isReady: true,
        isAutoPick: false,
        timeouts: 3,
        totalSpent: 0,
        isOnline: true
      },
      {
        id: 'p2',
        userId: 'user2',
        userName: 'FantasyPro',
        draftPosition: 2,
        teamName: 'The Crushers',
        isReady: true,
        isAutoPick: false,
        timeouts: 3,
        totalSpent: 0,
        isOnline: true
      },
      {
        id: 'p3',
        userId: 'user3',
        userName: 'GridironGuru',
        draftPosition: 3,
        teamName: 'Dynasty Warriors',
        isReady: true,
        isAutoPick: false,
        timeouts: 2,
        totalSpent: 0,
        isOnline: true
      },
      {
        id: 'p4',
        userId: 'user4',
        userName: 'ChampionMaker',
        draftPosition: 4,
        teamName: 'Title Town',
        isReady: true,
        isAutoPick: true,
        timeouts: 3,
        totalSpent: 0,
        isOnline: false
      }
    ];

    const mockPlayers: DraftPlayer[] = [
      {
        id: '1',
        name: 'Christian McCaffrey',
        position: 'RB',
        team: 'SF',
        adp: 1.2,
        projectedPoints: 285.4,
        positionRank: 1,
        overallRank: 1,
        tier: 1,
        byeWeek: 9,
        isInjured: false
      },
      {
        id: '2',
        name: 'Austin Ekeler',
        position: 'RB',
        team: 'LAC',
        adp: 2.8,
        projectedPoints: 268.7,
        positionRank: 2,
        overallRank: 3,
        tier: 1,
        byeWeek: 5,
        isInjured: false
      },
      {
        id: '3',
        name: 'Cooper Kupp',
        position: 'WR',
        team: 'LAR',
        adp: 5.2,
        projectedPoints: 245.8,
        positionRank: 1,
        overallRank: 5,
        tier: 1,
        byeWeek: 6,
        isInjured: false
      },
      {
        id: '4',
        name: 'Josh Allen',
        position: 'QB',
        team: 'BUF',
        adp: 3.8,
        projectedPoints: 312.6,
        positionRank: 1,
        overallRank: 4,
        tier: 1,
        byeWeek: 12,
        isInjured: false
      },
      {
        id: '5',
        name: 'Travis Kelce',
        position: 'TE',
        team: 'KC',
        adp: 8.9,
        projectedPoints: 198.7,
        positionRank: 1,
        overallRank: 9,
        tier: 1,
        byeWeek: 10,
        isInjured: false
      }
    ];

    setParticipants(mockParticipants);
    setAvailablePlayers(mockPlayers);
    setCurrentPickerId(userId);
    
    // Start timer
    startPickTimer();

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [draftId, userId]);

  const startPickTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          // Time's up - make auto pick
          handleAutoPick();
          return 90;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleAutoPick = () => {
    const bestAvailable = filteredPlayers[0];
    if (bestAvailable && currentPickerId === userId) {
      handleMakePick(bestAvailable.id);
    }
  };

  const handleMakePick = (playerId: string, price?: number) => {
    const player = availablePlayers.find(p => p.id === playerId);
    if (!player) return;

    // Create new pick
    const newPick: DraftPick = {
      id: `pick_${picks.length + 1}`,
      participantId: participants.find(p => p.userId === currentPickerId)?.id || '',
      playerId,
      playerName: player.name,
      playerPosition: player.position,
      playerTeam: player.team,
      round: currentRound,
      pick: currentPick,
      pickInRound: ((currentPick - 1) % participants.length) + 1,
      auctionPrice: price,
      isAutoPick: currentPickerId !== userId
    };

    // Remove player from available pool
    setAvailablePlayers(prev => prev.filter(p => p.id !== playerId));
    setPicks(prev => [...prev, newPick]);
    setSelectedPlayer(null);
    
    // Advance to next pick
    const nextPick = currentPick + 1;
    const nextRound = Math.ceil(nextPick / participants.length);
    setCurrentPick(nextPick);
    setCurrentRound(nextRound);
    
    // Calculate next picker (snake draft logic)
    const nextPickInRound = ((nextPick - 1) % participants.length) + 1;
    let nextPosition: number;
    
    if (nextRound % 2 === 1) {
      nextPosition = nextPickInRound;
    } else {
      nextPosition = participants.length - nextPickInRound + 1;
    }
    
    const nextPicker = participants.find(p => p.draftPosition === nextPosition);
    setCurrentPickerId(nextPicker?.userId || null);
    
    // Reset timer
    setTimeRemaining(90);
    
    onMakePick(playerId, price);
  };

  const filteredPlayers = availablePlayers.filter(player => {
    const matchesSearch = player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         player.team.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPosition = positionFilter === "ALL" || player.position === positionFilter;
    return matchesSearch && matchesPosition;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'projectedPoints':
        return b.projectedPoints - a.projectedPoints;
      case 'positionRank':
        return a.positionRank - b.positionRank;
      case 'name':
        return a.name.localeCompare(b.name);
      default:
        return a.adp - b.adp;
    }
  });

  const isMyTurn = currentPickerId === userId;
  const myPicks = picks.filter(pick => {
    const participant = participants.find(p => p.id === pick.participantId);
    return participant?.userId === userId;
  });

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getPlayerRowColor = (player: DraftPlayer) => {
    if (player.isInjured) return "border-neon-red/30 bg-neon-red/5";
    if (player.tier === 1) return "border-neon-purple/30 bg-neon-purple/5";
    if (player.positionRank <= 5) return "border-neon-blue/30 bg-neon-blue/5";
    return "border-white/10";
  };

  return (
    <div className="min-h-screen bg-background cyber-grid">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-48 -left-48 w-96 h-96 bg-neon-green/10 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-48 -right-48 w-96 h-96 bg-neon-purple/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Live Draft Room
            </h1>
            <p className="text-gray-400">
              Round {currentRound} • Pick {currentPick}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Timer */}
            <GlassCard className="p-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-neon-blue" />
                <span className={`text-lg font-bold ${timeRemaining <= 10 ? 'text-neon-red' : 'text-white'}`}>
                  {formatTime(timeRemaining)}
                </span>
              </div>
            </GlassCard>
            
            <NeonButton
              variant="pink"
              onClick={onLeaveDraft}
              className="flex items-center gap-2"
            >
              Leave Draft
            </NeonButton>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Draft Board */}
          <div className="lg:col-span-2 space-y-4">
            {/* Current Pick */}
            <GlassCard className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">
                  {isMyTurn ? "Your Turn!" : "On The Clock"}
                </h3>
                <div className="flex items-center gap-2">
                  {isMyTurn ? (
                    <div className="w-2 h-2 bg-neon-green rounded-full animate-pulse" />
                  ) : (
                    <div className="w-2 h-2 bg-neon-blue rounded-full animate-pulse" />
                  )}
                  <span className="text-sm text-gray-400">
                    {participants.find(p => p.userId === currentPickerId)?.userName || 'Unknown'}
                  </span>
                </div>
              </div>
              
              {isMyTurn && (
                <div className="bg-neon-green/10 border border-neon-green/30 rounded-lg p-3 mb-4">
                  <div className="flex items-center gap-2 text-neon-green mb-2">
                    <Target className="w-4 h-4" />
                    <span className="font-medium">Make Your Pick</span>
                  </div>
                  <p className="text-sm text-gray-300">
                    Select a player from the available players list
                  </p>
                </div>
              )}
            </GlassCard>

            {/* Player Search and Filters */}
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
                  <option value="K">K</option>
                  <option value="DST">DST</option>
                </select>

                {/* Sort */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-neon-blue/50"
                >
                  <option value="adp">ADP</option>
                  <option value="projectedPoints">Projected Points</option>
                  <option value="positionRank">Position Rank</option>
                  <option value="name">Name</option>
                </select>
              </div>

              {/* Available Players */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredPlayers.slice(0, 20).map((player) => (
                  <motion.div
                    key={player.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-all hover:border-neon-blue/50 ${
                      selectedPlayer?.id === player.id ? 'border-neon-blue bg-neon-blue/10' : getPlayerRowColor(player)
                    }`}
                    onClick={() => setSelectedPlayer(selectedPlayer?.id === player.id ? null : player)}
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
                            {player.isInjured && (
                              <AlertCircle className="w-4 h-4 text-neon-red" />
                            )}
                            {player.tier === 1 && (
                              <Star className="w-4 h-4 text-neon-yellow" />
                            )}
                          </div>
                          <div className="text-sm text-gray-400">
                            {player.team} • Bye: {player.byeWeek}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="font-bold text-white">
                          {player.projectedPoints.toFixed(1)} pts
                        </div>
                        <div className="text-sm text-gray-400">
                          ADP: {player.adp.toFixed(1)}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-sm font-medium text-neon-green">
                          #{player.overallRank}
                        </div>
                        <div className="text-xs text-gray-400">
                          {player.position} {player.positionRank}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Make Pick Button */}
              {selectedPlayer && isMyTurn && (
                <div className="mt-4 p-4 bg-neon-green/10 border border-neon-green/30 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-white">
                        Draft {selectedPlayer.name}?
                      </div>
                      <div className="text-sm text-gray-400">
                        {selectedPlayer.position} • {selectedPlayer.team}
                      </div>
                    </div>
                    
                    <NeonButton
                      variant="green"
                      onClick={() => handleMakePick(selectedPlayer.id)}
                      className="flex items-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Draft Player
                    </NeonButton>
                  </div>
                </div>
              )}
            </GlassCard>
          </div>

          {/* Participants & Picks */}
          <div className="space-y-4">
            {/* Participants */}
            <GlassCard className="p-4">
              <h3 className="text-lg font-bold text-white mb-4">
                Draft Order
              </h3>
              
              <div className="space-y-2">
                {participants.map((participant) => (
                  <div
                    key={participant.id}
                    className={`p-3 rounded-lg border transition-all ${
                      participant.userId === currentPickerId 
                        ? 'border-neon-green bg-neon-green/10' 
                        : 'border-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-bold text-neon-blue">
                          {participant.draftPosition}
                        </div>
                        <div>
                          <div className="font-medium text-white flex items-center gap-2">
                            {participant.userName}
                            {participant.userId === userId && (
                              <Crown className="w-4 h-4 text-neon-yellow" />
                            )}
                          </div>
                          <div className="text-xs text-gray-400">
                            {participant.teamName}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full ${
                          participant.isOnline ? 'bg-neon-green' : 'bg-gray-500'
                        }`} />
                        {participant.isAutoPick && (
                          <span className="text-xs text-neon-yellow">AUTO</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Recent Picks */}
            <GlassCard className="p-4">
              <h3 className="text-lg font-bold text-white mb-4">
                Recent Picks
              </h3>
              
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {picks.slice(-10).reverse().map((pick) => {
                  const participant = participants.find(p => p.id === pick.participantId);
                  return (
                    <div key={pick.id} className="p-2 bg-white/5 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-white text-sm">
                            {pick.playerName}
                          </div>
                          <div className="text-xs text-gray-400">
                            {participant?.userName} • Round {pick.round}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-neon-blue">
                            #{pick.pick}
                          </div>
                          <div className="text-xs text-gray-400">
                            {pick.playerPosition}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </GlassCard>

            {/* My Team */}
            <GlassCard className="p-4">
              <h3 className="text-lg font-bold text-white mb-4">
                My Team ({myPicks.length})
              </h3>
              
              <div className="space-y-2">
                {myPicks.map((pick) => (
                  <div key={pick.id} className="p-2 bg-neon-blue/10 border border-neon-blue/30 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-white text-sm">
                          {pick.playerName}
                        </div>
                        <div className="text-xs text-gray-400">
                          {pick.playerTeam} {pick.playerPosition}
                        </div>
                      </div>
                      <div className="text-xs text-neon-blue font-medium">
                        R{pick.round}.{pick.pickInRound}
                      </div>
                    </div>
                  </div>
                ))}
                
                {myPicks.length === 0 && (
                  <div className="text-center py-4">
                    <div className="text-gray-400 text-sm">
                      No picks yet
                    </div>
                  </div>
                )}
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LiveDraftRoom;