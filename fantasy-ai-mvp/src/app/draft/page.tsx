"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import MockDraftSimulator from "@/components/draft/MockDraftSimulator";
import LiveDraftRoom from "@/components/draft/LiveDraftRoom";
import { 
  Trophy, 
  Users, 
  Clock, 
  Play,
  Plus,
  Search,
  Filter,
  Target,
  Zap,
  Crown,
  Calendar,
  Settings
} from "lucide-react";

type DraftView = 'lobby' | 'mock' | 'live' | 'create';

interface Draft {
  id: string;
  name: string;
  description?: string;
  sport: string;
  draftType: string;
  totalRounds: number;
  timePerPick: number;
  isAuction: boolean;
  isSnakeDraft: boolean;
  isMockDraft: boolean;
  isPublic: boolean;
  maxParticipants: number;
  currentParticipants: number;
  scheduledStart?: Date;
  status: string;
  creatorName: string;
}

export default function DraftPage() {
  const [currentView, setCurrentView] = useState<DraftView>('lobby');
  const [activeDrafts, setActiveDrafts] = useState<Draft[]>([]);
  const [selectedDraftId, setSelectedDraftId] = useState<string | null>(null);
  const [userId] = useState('user_123'); // Mock user ID
  const [searchTerm, setSearchTerm] = useState("");
  const [draftFilter, setDraftFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock draft data
    const mockDrafts: Draft[] = [
      {
        id: 'draft_1',
        name: 'Championship League Draft',
        description: 'Competitive 12-team PPR league',
        sport: 'FOOTBALL',
        draftType: 'PPR',
        totalRounds: 15,
        timePerPick: 90,
        isAuction: false,
        isSnakeDraft: true,
        isMockDraft: false,
        isPublic: true,
        maxParticipants: 12,
        currentParticipants: 8,
        scheduledStart: new Date(Date.now() + 1800000), // 30 minutes from now
        status: 'WAITING_FOR_PLAYERS',
        creatorName: 'FantasyPro'
      },
      {
        id: 'draft_2',
        name: 'Auction Dynasty Startup',
        description: 'Dynasty league with $200 auction budget',
        sport: 'FOOTBALL',
        draftType: 'DYNASTY',
        totalRounds: 20,
        timePerPick: 120,
        isAuction: true,
        isSnakeDraft: false,
        isMockDraft: false,
        isPublic: true,
        maxParticipants: 10,
        currentParticipants: 7,
        scheduledStart: new Date(Date.now() + 3600000), // 1 hour from now
        status: 'SCHEDULED',
        creatorName: 'DynastyKing'
      },
      {
        id: 'draft_3',
        name: 'Quick Mock Draft',
        description: 'Practice draft - 12 team standard',
        sport: 'FOOTBALL',
        draftType: 'STANDARD',
        totalRounds: 15,
        timePerPick: 60,
        isAuction: false,
        isSnakeDraft: true,
        isMockDraft: true,
        isPublic: true,
        maxParticipants: 12,
        currentParticipants: 12,
        status: 'IN_PROGRESS',
        creatorName: 'MockMaster'
      }
    ];

    setTimeout(() => {
      setActiveDrafts(mockDrafts);
      setLoading(false);
    }, 1000);
  }, []);

  const handleJoinDraft = (draftId: string) => {
    setSelectedDraftId(draftId);
    setCurrentView('live');
  };

  const handleCreateDraft = () => {
    setCurrentView('create');
  };

  const handleStartLiveDraft = () => {
    // In a real app, this would create a new live draft
    const newDraftId = `draft_${Date.now()}`;
    setSelectedDraftId(newDraftId);
    setCurrentView('live');
  };

  const handleMakePick = (playerId: string, auctionPrice?: number) => {
    console.log('Making pick:', playerId, auctionPrice);
    // Handle pick logic
  };

  const handleLeaveDraft = () => {
    setCurrentView('lobby');
    setSelectedDraftId(null);
  };

  const filteredDrafts = activeDrafts.filter(draft => {
    const matchesSearch = draft.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         draft.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = draftFilter === "all" || 
                         (draftFilter === "mock" && draft.isMockDraft) ||
                         (draftFilter === "live" && !draft.isMockDraft) ||
                         (draftFilter === "auction" && draft.isAuction) ||
                         (draftFilter === "snake" && draft.isSnakeDraft);
    
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'WAITING_FOR_PLAYERS':
        return 'text-neon-yellow';
      case 'IN_PROGRESS':
        return 'text-neon-green';
      case 'SCHEDULED':
        return 'text-neon-blue';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'WAITING_FOR_PLAYERS':
        return 'Waiting for Players';
      case 'IN_PROGRESS':
        return 'In Progress';
      case 'SCHEDULED':
        return 'Scheduled';
      default:
        return status;
    }
  };

  const formatTimeUntilStart = (scheduledStart?: Date) => {
    if (!scheduledStart) return 'Not scheduled';
    
    const now = new Date();
    const diff = scheduledStart.getTime() - now.getTime();
    
    if (diff <= 0) return 'Starting now';
    
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background cyber-grid">
        <div className="max-w-7xl mx-auto p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-12 bg-white/10 rounded-lg" />
            <div className="grid gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-white/5 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background cyber-grid">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-48 -left-48 w-96 h-96 bg-neon-blue/10 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-48 -right-48 w-96 h-96 bg-neon-purple/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-neon-green/5 rounded-full blur-3xl animate-float" style={{ animationDelay: "4s" }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              {currentView !== 'lobby' && (
                <NeonButton
                  variant="blue"
                  onClick={() => setCurrentView('lobby')}
                  className="flex items-center gap-2"
                >
                  ← Back to Lobby
                </NeonButton>
              )}
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">
                  Draft Central
                </h1>
                <p className="text-gray-400">
                  Live drafts, mock simulations, and draft tools
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="px-4 py-2 bg-neon-green/20 rounded-full border border-neon-green/30">
                <span className="text-sm text-neon-green font-medium">
                  🏈 {activeDrafts.length} Live Drafts
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <AnimatePresence mode="wait">
            {currentView === 'lobby' && (
              <motion.div
                key="lobby"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                {/* Quick Actions */}
                <div className="grid md:grid-cols-2 gap-6">
                  <GlassCard className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-neon-purple/20 rounded-xl flex items-center justify-center">
                        <Target className="w-6 h-6 text-neon-purple" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">
                          Mock Draft Simulator
                        </h3>
                        <p className="text-gray-400">
                          Practice your strategy with AI opponents
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-neon-blue" />
                        <span className="text-sm text-gray-400">~2 minutes</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-neon-green" />
                        <span className="text-sm text-gray-400">AI opponents</span>
                      </div>
                    </div>
                    
                    <NeonButton
                      variant="purple"
                      onClick={() => setCurrentView('mock')}
                      className="w-full flex items-center justify-center gap-2"
                    >
                      <Play className="w-4 h-4" />
                      Start Mock Draft
                    </NeonButton>
                  </GlassCard>

                  <GlassCard className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-neon-green/20 rounded-xl flex items-center justify-center">
                        <Plus className="w-6 h-6 text-neon-green" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">
                          Create Live Draft
                        </h3>
                        <p className="text-gray-400">
                          Set up a draft for your league
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <Settings className="w-4 h-4 text-neon-blue" />
                        <span className="text-sm text-gray-400">Customizable</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-neon-yellow" />
                        <span className="text-sm text-gray-400">Real drafts</span>
                      </div>
                    </div>
                    
                    <NeonButton
                      variant="green"
                      onClick={handleCreateDraft}
                      className="w-full flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Create Draft
                    </NeonButton>
                  </GlassCard>
                </div>

                {/* Active Drafts */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-white">
                      Available Drafts
                    </h2>
                    
                    <div className="flex items-center gap-4">
                      {/* Search */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search drafts..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-neon-blue/50"
                        />
                      </div>

                      {/* Filter */}
                      <select
                        value={draftFilter}
                        onChange={(e) => setDraftFilter(e.target.value)}
                        className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-neon-blue/50"
                      >
                        <option value="all">All Drafts</option>
                        <option value="live">Live Drafts</option>
                        <option value="mock">Mock Drafts</option>
                        <option value="auction">Auction</option>
                        <option value="snake">Snake</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid gap-4">
                    {filteredDrafts.map((draft, index) => (
                      <motion.div
                        key={draft.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <GlassCard className="p-6 hover:border-neon-blue/50 transition-all duration-300">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-xl font-bold text-white">
                                  {draft.name}
                                </h3>
                                {draft.isMockDraft && (
                                  <div className="px-2 py-1 bg-neon-purple/20 rounded-full border border-neon-purple/30">
                                    <span className="text-xs text-neon-purple font-medium">
                                      MOCK
                                    </span>
                                  </div>
                                )}
                                {draft.isAuction && (
                                  <div className="px-2 py-1 bg-neon-yellow/20 rounded-full border border-neon-yellow/30">
                                    <span className="text-xs text-neon-yellow font-medium">
                                      AUCTION
                                    </span>
                                  </div>
                                )}
                              </div>
                              
                              <p className="text-gray-400 mb-4">
                                {draft.description}
                              </p>

                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                  <div className="text-white font-semibold">
                                    {draft.currentParticipants}/{draft.maxParticipants}
                                  </div>
                                  <div className="text-xs text-gray-400">Players</div>
                                </div>
                                
                                <div>
                                  <div className="text-white font-semibold">
                                    {draft.totalRounds}
                                  </div>
                                  <div className="text-xs text-gray-400">Rounds</div>
                                </div>
                                
                                <div>
                                  <div className="text-white font-semibold">
                                    {draft.timePerPick}s
                                  </div>
                                  <div className="text-xs text-gray-400">Per Pick</div>
                                </div>
                                
                                <div>
                                  <div className={`font-semibold ${getStatusColor(draft.status)}`}>
                                    {getStatusText(draft.status)}
                                  </div>
                                  <div className="text-xs text-gray-400">
                                    {formatTimeUntilStart(draft.scheduledStart)}
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 ml-6">
                              <div className="text-right">
                                <div className="text-sm text-gray-400 mb-1">
                                  Created by
                                </div>
                                <div className="flex items-center gap-2">
                                  <Crown className="w-4 h-4 text-neon-yellow" />
                                  <span className="text-white font-medium">
                                    {draft.creatorName}
                                  </span>
                                </div>
                              </div>
                              
                              <NeonButton
                                variant="blue"
                                onClick={() => handleJoinDraft(draft.id)}
                                className="flex items-center gap-2"
                                disabled={draft.currentParticipants >= draft.maxParticipants}
                              >
                                <Zap className="w-4 h-4" />
                                {draft.isMockDraft ? 'Join Mock' : 'Join Draft'}
                              </NeonButton>
                            </div>
                          </div>
                        </GlassCard>
                      </motion.div>
                    ))}
                  </div>

                  {filteredDrafts.length === 0 && (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Trophy className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">
                        No drafts found
                      </h3>
                      <p className="text-gray-400">
                        Try adjusting your search or create a new draft
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {currentView === 'mock' && (
              <motion.div
                key="mock"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <MockDraftSimulator onStartLiveDraft={handleStartLiveDraft} />
              </motion.div>
            )}

            {currentView === 'live' && selectedDraftId && (
              <motion.div
                key="live"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <LiveDraftRoom
                  draftId={selectedDraftId}
                  userId={userId}
                  onMakePick={handleMakePick}
                  onLeaveDraft={handleLeaveDraft}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}