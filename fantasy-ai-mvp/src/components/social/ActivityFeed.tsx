"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { 
  Activity,
  TrendingUp,
  Users,
  Trophy,
  Target,
  Zap,
  RefreshCw,
  Filter,
  Heart,
  ThumbsUp,
  Laugh,
  Angry,
  Flame,
  Star,
  ArrowUpDown,
  UserMinus,
  UserPlus,
  Calendar,
  Award,
  Crown
} from "lucide-react";

interface ActivityItem {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  leagueId?: string;
  leagueName?: string;
  activityType: string;
  title: string;
  description: string;
  metadata?: any;
  isPublic: boolean;
  reactions: Array<{
    id: string;
    userId: string;
    userName: string;
    reactionType: string;
    createdAt: Date;
  }>;
  createdAt: Date;
}

interface ActivityFeedProps {
  leagueId?: string;
  userId: string;
  showGlobalFeed?: boolean;
}

const ACTIVITY_ICONS = {
  TRADE_COMPLETED: ArrowUpDown,
  WAIVER_CLAIM: UserPlus,
  LINEUP_SET: Calendar,
  PLAYER_DROPPED: UserMinus,
  PLAYER_ADDED: UserPlus,
  DRAFT_PICK_MADE: Target,
  CONTEST_WON: Trophy,
  WAGER_WON: Flame,
  ACHIEVEMENT_UNLOCKED: Award,
  MILESTONE_REACHED: Crown
};

const ACTIVITY_COLORS = {
  TRADE_COMPLETED: 'neon-blue',
  WAIVER_CLAIM: 'neon-green',
  LINEUP_SET: 'neon-purple',
  PLAYER_DROPPED: 'neon-red',
  PLAYER_ADDED: 'neon-green',
  DRAFT_PICK_MADE: 'neon-yellow',
  CONTEST_WON: 'neon-gold',
  WAGER_WON: 'neon-red',
  ACHIEVEMENT_UNLOCKED: 'neon-purple',
  MILESTONE_REACHED: 'neon-gold'
};

const REACTION_EMOJIS = {
  LIKE: '👍',
  LOVE: '❤️',
  LAUGH: '😂',
  ANGRY: '😠',
  SURPRISED: '😮',
  FIRE: '🔥',
  TROPHY: '🏆'
};

export function ActivityFeed({ leagueId, userId, showGlobalFeed = false }: ActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showReactions, setShowReactions] = useState<string | null>(null);

  useEffect(() => {
    loadActivities();
  }, [leagueId, showGlobalFeed, filter]);

  const loadActivities = async () => {
    setLoading(true);
    
    // Mock activity data
    const mockActivities: ActivityItem[] = [
      {
        id: 'activity_1',
        userId: 'user_1',
        userName: 'FantasyKing',
        leagueId: 'league_1',
        leagueName: 'Championship League',
        activityType: 'TRADE_COMPLETED',
        title: 'Trade Completed',
        description: 'Traded Stefon Diggs for Joe Mixon + 2024 2nd round pick with ChampMaker',
        metadata: {
          tradeId: 'trade_123',
          playersGiven: ['Stefon Diggs'],
          playersReceived: ['Joe Mixon'],
          picksReceived: ['2024 2nd'],
          tradePartner: 'ChampMaker'
        },
        isPublic: true,
        reactions: [
          {
            id: 'react_1',
            userId: 'user_2',
            userName: 'ChampMaker',
            reactionType: 'LIKE',
            createdAt: new Date(Date.now() - 120000)
          },
          {
            id: 'react_2',
            userId: 'user_3',
            userName: 'GridironGuru',
            reactionType: 'FIRE',
            createdAt: new Date(Date.now() - 60000)
          }
        ],
        createdAt: new Date(Date.now() - 300000)
      },
      {
        id: 'activity_2',
        userId: 'user_2',
        userName: 'ChampMaker',
        leagueId: 'league_1',
        leagueName: 'Championship League',
        activityType: 'WAIVER_CLAIM',
        title: 'Waiver Claim Success',
        description: 'Successfully claimed Kyren Williams from waivers (dropped Tony Pollard)',
        metadata: {
          playerAdded: 'Kyren Williams',
          playerDropped: 'Tony Pollard',
          waiverPriority: 3,
          claimAmount: '$15'
        },
        isPublic: true,
        reactions: [
          {
            id: 'react_3',
            userId: 'user_1',
            userName: 'FantasyKing',
            reactionType: 'TROPHY',
            createdAt: new Date(Date.now() - 90000)
          }
        ],
        createdAt: new Date(Date.now() - 1800000)
      },
      {
        id: 'activity_3',
        userId: 'user_3',
        userName: 'GridironGuru',
        leagueId: 'league_1',
        leagueName: 'Championship League',
        activityType: 'CONTEST_WON',
        title: 'DFS Contest Victory!',
        description: 'Won 1st place in the Sunday Million tournament, earning $25,000!',
        metadata: {
          contestName: 'Sunday Million',
          prize: 25000,
          rank: 1,
          totalEntries: 50000,
          lineupScore: 198.2
        },
        isPublic: true,
        reactions: [
          {
            id: 'react_4',
            userId: 'user_1',
            userName: 'FantasyKing',
            reactionType: 'TROPHY',
            createdAt: new Date(Date.now() - 45000)
          },
          {
            id: 'react_5',
            userId: 'user_2',
            userName: 'ChampMaker',
            reactionType: 'FIRE',
            createdAt: new Date(Date.now() - 30000)
          },
          {
            id: 'react_6',
            userId: 'user_4',
            userName: 'DynastyMaster',
            reactionType: 'LOVE',
            createdAt: new Date(Date.now() - 15000)
          }
        ],
        createdAt: new Date(Date.now() - 3600000)
      },
      {
        id: 'activity_4',
        userId: 'user_4',
        userName: 'DynastyMaster',
        leagueId: 'league_1',
        leagueName: 'Championship League',
        activityType: 'ACHIEVEMENT_UNLOCKED',
        title: 'Achievement Unlocked: Trade Master',
        description: 'Completed 10 successful trades this season!',
        metadata: {
          achievementName: 'Trade Master',
          achievementLevel: 'Gold',
          tradeCount: 10,
          successRate: 85
        },
        isPublic: true,
        reactions: [],
        createdAt: new Date(Date.now() - 7200000)
      },
      {
        id: 'activity_5',
        userId: 'user_5',
        userName: 'RookieSlayer',
        leagueId: 'league_2',
        leagueName: 'Dynasty Empire',
        activityType: 'DRAFT_PICK_MADE',
        title: 'Draft Pick Made',
        description: 'Selected Bijan Robinson with the 1.03 pick in the rookie draft',
        metadata: {
          player: 'Bijan Robinson',
          position: 'RB',
          team: 'ATL',
          round: 1,
          pick: 3,
          draftType: 'Rookie Draft'
        },
        isPublic: true,
        reactions: [
          {
            id: 'react_7',
            userId: 'user_6',
            userName: 'ContenderBuilder',
            reactionType: 'LIKE',
            createdAt: new Date(Date.now() - 10800000)
          }
        ],
        createdAt: new Date(Date.now() - 10800000)
      }
    ];

    // Filter activities based on current filter
    let filteredActivities = mockActivities;
    if (filter !== 'all') {
      filteredActivities = mockActivities.filter(activity => activity.activityType === filter);
    }

    if (leagueId && !showGlobalFeed) {
      filteredActivities = filteredActivities.filter(activity => activity.leagueId === leagueId);
    }

    setTimeout(() => {
      setActivities(filteredActivities);
      setLoading(false);
    }, 500);
  };

  const handleAddReaction = (activityId: string, reactionType: string) => {
    setActivities(prev => prev.map(activity => {
      if (activity.id !== activityId) return activity;
      
      // Remove existing reaction of same type from this user
      const filteredReactions = activity.reactions.filter(r => 
        !(r.userId === userId && r.reactionType === reactionType)
      );
      
      // Add new reaction
      filteredReactions.push({
        id: `react_${Date.now()}`,
        userId,
        userName: 'You',
        reactionType,
        createdAt: new Date()
      });
      
      return { ...activity, reactions: filteredReactions };
    }));
    
    setShowReactions(null);
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
    return date.toLocaleDateString();
  };

  const getReactionCounts = (reactions: any[]) => {
    const counts: Record<string, number> = {};
    reactions.forEach(reaction => {
      counts[reaction.reactionType] = (counts[reaction.reactionType] || 0) + 1;
    });
    return counts;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <GlassCard className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-white/10 rounded-lg" />
                <div className="flex-1">
                  <div className="h-4 bg-white/10 rounded mb-2" />
                  <div className="h-3 bg-white/10 rounded w-1/2" />
                </div>
              </div>
              <div className="h-16 bg-white/10 rounded" />
            </GlassCard>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-neon-green/20 rounded-lg flex items-center justify-center">
            <Activity className="w-5 h-5 text-neon-green" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">
              {showGlobalFeed ? 'Global Activity' : 'League Activity'}
            </h2>
            <p className="text-gray-400 text-sm">
              Latest updates and achievements
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-neon-blue/50"
          >
            <option value="all">All Activity</option>
            <option value="TRADE_COMPLETED">Trades</option>
            <option value="WAIVER_CLAIM">Waivers</option>
            <option value="DRAFT_PICK_MADE">Draft Picks</option>
            <option value="CONTEST_WON">Contest Wins</option>
            <option value="ACHIEVEMENT_UNLOCKED">Achievements</option>
          </select>
          
          <NeonButton
            variant="blue"
            onClick={loadActivities}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </NeonButton>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="space-y-4">
        <AnimatePresence>
          {activities.map((activity, index) => {
            const IconComponent = ACTIVITY_ICONS[activity.activityType as keyof typeof ACTIVITY_ICONS] || Activity;
            const iconColor = ACTIVITY_COLORS[activity.activityType as keyof typeof ACTIVITY_COLORS] || 'neon-blue';
            const reactionCounts = getReactionCounts(activity.reactions);
            
            return (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
              >
                <GlassCard className="p-4 hover:border-neon-blue/30 transition-all duration-300">
                  <div className="flex items-start gap-4">
                    {/* Activity Icon */}
                    <div className={`w-12 h-12 bg-${iconColor}/20 rounded-xl flex items-center justify-center flex-shrink-0`}>
                      <IconComponent className={`w-6 h-6 text-${iconColor}`} />
                    </div>

                    {/* Activity Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">
                            {activity.userName}
                          </span>
                          {activity.leagueName && !showGlobalFeed && (
                            <span className="text-sm text-gray-400">
                              • {activity.leagueName}
                            </span>
                          )}
                          {showGlobalFeed && activity.leagueName && (
                            <div className="px-2 py-1 bg-neon-purple/20 rounded-full border border-neon-purple/30">
                              <span className="text-xs text-neon-purple font-medium">
                                {activity.leagueName}
                              </span>
                            </div>
                          )}
                        </div>
                        <span className="text-sm text-gray-400 flex-shrink-0">
                          {formatTimeAgo(activity.createdAt)}
                        </span>
                      </div>

                      <h3 className="font-bold text-white mb-1">
                        {activity.title}
                      </h3>
                      
                      <p className="text-gray-300 mb-3">
                        {activity.description}
                      </p>

                      {/* Activity Metadata */}
                      {activity.metadata && (
                        <div className="mb-3">
                          {activity.activityType === 'TRADE_COMPLETED' && (
                            <div className="grid grid-cols-2 gap-4 p-3 bg-white/5 rounded-lg border border-white/10">
                              <div>
                                <div className="text-sm text-gray-400 mb-1">Gave</div>
                                <div className="text-white">
                                  {activity.metadata.playersGiven.join(', ')}
                                </div>
                              </div>
                              <div>
                                <div className="text-sm text-gray-400 mb-1">Received</div>
                                <div className="text-white">
                                  {activity.metadata.playersReceived.join(', ')}
                                  {activity.metadata.picksReceived && 
                                    ` + ${activity.metadata.picksReceived.join(', ')}`
                                  }
                                </div>
                              </div>
                            </div>
                          )}

                          {activity.activityType === 'CONTEST_WON' && (
                            <div className="p-3 bg-neon-gold/10 border border-neon-gold/30 rounded-lg">
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="font-semibold text-neon-gold">
                                    ${activity.metadata.prize.toLocaleString()}
                                  </div>
                                  <div className="text-sm text-gray-300">
                                    {activity.metadata.rank}/{activity.metadata.totalEntries.toLocaleString()} • {activity.metadata.lineupScore} pts
                                  </div>
                                </div>
                                <Trophy className="w-6 h-6 text-neon-gold" />
                              </div>
                            </div>
                          )}

                          {activity.activityType === 'ACHIEVEMENT_UNLOCKED' && (
                            <div className="p-3 bg-neon-purple/10 border border-neon-purple/30 rounded-lg">
                              <div className="flex items-center gap-3">
                                <Award className="w-6 h-6 text-neon-purple" />
                                <div>
                                  <div className="font-semibold text-neon-purple">
                                    {activity.metadata.achievementName}
                                  </div>
                                  <div className="text-sm text-gray-300">
                                    {activity.metadata.achievementLevel} Level
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Reactions */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {Object.keys(reactionCounts).length > 0 && (
                            <div className="flex gap-1">
                              {Object.entries(reactionCounts).map(([type, count]) => (
                                <button
                                  key={type}
                                  onClick={() => handleAddReaction(activity.id, type)}
                                  className="flex items-center gap-1 px-2 py-1 bg-white/10 rounded-full text-xs hover:bg-white/20 transition-colors"
                                >
                                  <span>{REACTION_EMOJIS[type as keyof typeof REACTION_EMOJIS]}</span>
                                  <span className="text-white">{count}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="relative">
                          <button
                            onClick={() => setShowReactions(showReactions === activity.id ? null : activity.id)}
                            className="flex items-center gap-1 px-3 py-1 text-gray-400 hover:text-white transition-colors text-sm"
                          >
                            <Heart className="w-4 h-4" />
                            React
                          </button>

                          {/* Reaction Picker */}
                          {showReactions === activity.id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="absolute bottom-full right-0 mb-2 z-20 bg-background border border-white/10 rounded-lg p-2 shadow-lg"
                            >
                              <div className="flex gap-1">
                                {Object.entries(REACTION_EMOJIS).map(([type, emoji]) => (
                                  <button
                                    key={type}
                                    onClick={() => handleAddReaction(activity.id, type)}
                                    className="p-2 hover:bg-white/10 rounded text-lg"
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {activities.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Activity className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">
            No activity yet
          </h3>
          <p className="text-gray-400">
            Activity will appear here as league members make moves
          </p>
        </div>
      )}
    </div>
  );
}

export default ActivityFeed;