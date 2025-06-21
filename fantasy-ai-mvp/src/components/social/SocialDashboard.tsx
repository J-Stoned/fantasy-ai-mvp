"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import ActivityFeed from "./ActivityFeed";
import LeagueChat from "./LeagueChat";
import { 
  MessageCircle, 
  Activity, 
  Users, 
  Bell,
  UserPlus,
  Trophy,
  Star,
  Heart,
  Zap,
  Search,
  Filter,
  Settings
} from "lucide-react";

interface SocialDashboardProps {
  leagueId?: string;
  userId: string;
  userName: string;
}

type SocialView = 'activity' | 'chat' | 'friends' | 'notifications';

interface Notification {
  id: string;
  notificationType: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
}

interface Friend {
  id: string;
  initiatorId: string;
  recipientId: string;
  initiatorName: string;
  recipientName: string;
  status: string;
  createdAt: Date;
}

export function SocialDashboard({ leagueId, userId, userName }: SocialDashboardProps) {
  const [currentView, setCurrentView] = useState<SocialView>('activity');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<Friend[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [onlineUsers, setOnlineUsers] = useState<Array<{ id: string; name: string; isOnline: boolean }>>([]);

  useEffect(() => {
    loadSocialData();
  }, [userId]);

  const loadSocialData = async () => {
    // Mock notifications
    const mockNotifications: Notification[] = [
      {
        id: 'notif_1',
        notificationType: 'TRADE_PROPOSAL',
        title: 'New Trade Proposal',
        message: 'ChampMaker wants to trade Saquon Barkley for your Derrick Henry',
        isRead: false,
        createdAt: new Date(Date.now() - 600000)
      },
      {
        id: 'notif_2',
        notificationType: 'FRIEND_REQUEST',
        title: 'Friend Request',
        message: 'GridironGuru sent you a friend request',
        isRead: false,
        createdAt: new Date(Date.now() - 900000)
      },
      {
        id: 'notif_3',
        notificationType: 'LINEUP_REMINDER',
        title: 'Lineup Reminder',
        message: 'Set your lineup for Week 8 - games start in 2 hours!',
        isRead: true,
        createdAt: new Date(Date.now() - 1200000)
      },
      {
        id: 'notif_4',
        notificationType: 'ACHIEVEMENT',
        title: 'Achievement Unlocked!',
        message: 'You unlocked "Trade Master" - completed 5 trades this season',
        isRead: false,
        createdAt: new Date(Date.now() - 1800000)
      }
    ];

    // Mock friends
    const mockFriends: Friend[] = [
      {
        id: 'friend_1',
        initiatorId: userId,
        recipientId: 'user_2',
        initiatorName: userName,
        recipientName: 'ChampMaker',
        status: 'ACCEPTED',
        createdAt: new Date(Date.now() - 86400000)
      },
      {
        id: 'friend_2',
        initiatorId: 'user_3',
        recipientId: userId,
        initiatorName: 'FantasyKing',
        recipientName: userName,
        status: 'ACCEPTED',
        createdAt: new Date(Date.now() - 172800000)
      }
    ];

    // Mock friend requests
    const mockFriendRequests: Friend[] = [
      {
        id: 'req_1',
        initiatorId: 'user_4',
        recipientId: userId,
        initiatorName: 'GridironGuru',
        recipientName: userName,
        status: 'PENDING',
        createdAt: new Date(Date.now() - 900000)
      }
    ];

    // Mock online users
    const mockOnlineUsers = [
      { id: 'user_2', name: 'ChampMaker', isOnline: true },
      { id: 'user_3', name: 'FantasyKing', isOnline: true },
      { id: 'user_4', name: 'GridironGuru', isOnline: false },
      { id: 'user_5', name: 'DynastyMaster', isOnline: true }
    ];

    setNotifications(mockNotifications);
    setFriends(mockFriends);
    setFriendRequests(mockFriendRequests);
    setOnlineUsers(mockOnlineUsers);
    setUnreadCount(mockNotifications.filter(n => !n.isRead).length);
  };

  const handleRespondToFriendRequest = (requestId: string, accept: boolean) => {
    if (accept) {
      const request = friendRequests.find(r => r.id === requestId);
      if (request) {
        setFriends(prev => [...prev, { ...request, status: 'ACCEPTED' }]);
      }
    }
    setFriendRequests(prev => prev.filter(r => r.id !== requestId));
  };

  const handleMarkNotificationRead = (notificationId: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === notificationId ? { ...n, isRead: true } : n
    ));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
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
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                Social Hub
              </h1>
              <p className="text-gray-400">
                Stay connected with your league and the fantasy community
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="px-4 py-2 bg-neon-green/20 rounded-full border border-neon-green/30">
                <span className="text-sm text-neon-green font-medium">
                  🟢 {onlineUsers.filter(u => u.isOnline).length} Online
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-2 mb-6">
            {[
              { key: 'activity', label: 'Activity', icon: Activity },
              { key: 'chat', label: 'League Chat', icon: MessageCircle },
              { key: 'friends', label: 'Friends', icon: Users },
              { key: 'notifications', label: 'Notifications', icon: Bell, badge: unreadCount }
            ].map(({ key, label, icon: Icon, badge }) => (
              <button
                key={key}
                onClick={() => setCurrentView(key as SocialView)}
                className={`relative flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  currentView === key
                    ? 'bg-neon-blue/20 text-neon-blue border border-neon-blue/30'
                    : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium">{label}</span>
                {badge && badge > 0 && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-neon-red rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-bold">
                      {badge > 9 ? '9+' : badge}
                    </span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <AnimatePresence mode="wait">
            {currentView === 'activity' && (
              <motion.div
                key="activity"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <ActivityFeed
                  leagueId={leagueId}
                  userId={userId}
                  showGlobalFeed={!leagueId}
                />
              </motion.div>
            )}

            {currentView === 'chat' && (
              <motion.div
                key="chat"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="h-[600px]"
              >
                <GlassCard className="h-full">
                  {leagueId ? (
                    <LeagueChat
                      leagueId={leagueId}
                      userId={userId}
                      userName={userName}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">
                          No League Selected
                        </h3>
                        <p className="text-gray-400">
                          Select a league to start chatting with league members
                        </p>
                      </div>
                    </div>
                  )}
                </GlassCard>
              </motion.div>
            )}

            {currentView === 'friends' && (
              <motion.div
                key="friends"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                {/* Friend Requests */}
                {friendRequests.length > 0 && (
                  <div>
                    <h2 className="text-xl font-bold text-white mb-4">
                      Friend Requests ({friendRequests.length})
                    </h2>
                    <div className="space-y-3">
                      {friendRequests.map((request) => (
                        <GlassCard key={request.id} className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-neon-purple/20 rounded-full flex items-center justify-center">
                                <span className="text-sm font-bold text-white">
                                  {request.initiatorName.substring(0, 2).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <div className="font-semibold text-white">
                                  {request.initiatorName}
                                </div>
                                <div className="text-sm text-gray-400">
                                  Sent {formatTimeAgo(request.createdAt)}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex gap-2">
                              <NeonButton
                                variant="green"
                                onClick={() => handleRespondToFriendRequest(request.id, true)}
                                className="text-sm px-3 py-1"
                              >
                                Accept
                              </NeonButton>
                              <NeonButton
                                variant="pink"
                                onClick={() => handleRespondToFriendRequest(request.id, false)}
                                className="text-sm px-3 py-1"
                              >
                                Decline
                              </NeonButton>
                            </div>
                          </div>
                        </GlassCard>
                      ))}
                    </div>
                  </div>
                )}

                {/* Friends List */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-white">
                      Friends ({friends.length})
                    </h2>
                    <NeonButton
                      variant="blue"
                      className="flex items-center gap-2"
                    >
                      <UserPlus className="w-4 h-4" />
                      Add Friend
                    </NeonButton>
                  </div>
                  
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {friends.map((friend) => {
                      const friendName = friend.initiatorId === userId ? friend.recipientName : friend.initiatorName;
                      const friendId = friend.initiatorId === userId ? friend.recipientId : friend.initiatorId;
                      const isOnline = onlineUsers.find(u => u.id === friendId)?.isOnline || false;
                      
                      return (
                        <GlassCard key={friend.id} className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="w-12 h-12 bg-neon-blue/20 rounded-full flex items-center justify-center">
                                <span className="font-bold text-white">
                                  {friendName.substring(0, 2).toUpperCase()}
                                </span>
                              </div>
                              {isOnline && (
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-neon-green rounded-full border-2 border-background" />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="font-semibold text-white">
                                {friendName}
                              </div>
                              <div className="text-sm text-gray-400">
                                {isOnline ? 'Online' : 'Offline'}
                              </div>
                            </div>
                          </div>
                        </GlassCard>
                      );
                    })}
                  </div>

                  {friends.length === 0 && (
                    <div className="text-center py-12">
                      <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-white mb-2">
                        No friends yet
                      </h3>
                      <p className="text-gray-400 mb-4">
                        Connect with other fantasy players to stay updated on their moves
                      </p>
                      <NeonButton
                        variant="blue"
                        className="flex items-center gap-2 mx-auto"
                      >
                        <UserPlus className="w-4 h-4" />
                        Find Friends
                      </NeonButton>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {currentView === 'notifications' && (
              <motion.div
                key="notifications"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-white">
                    Notifications
                  </h2>
                  <NeonButton
                    variant="blue"
                    onClick={() => {
                      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                      setUnreadCount(0);
                    }}
                    className="text-sm"
                  >
                    Mark All Read
                  </NeonButton>
                </div>

                <div className="space-y-3">
                  {notifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <GlassCard 
                        className={`p-4 cursor-pointer transition-all ${
                          !notification.isRead 
                            ? 'border-neon-blue/50 bg-neon-blue/5' 
                            : 'hover:border-white/20'
                        }`}
                        onClick={() => handleMarkNotificationRead(notification.id)}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            notification.notificationType === 'TRADE_PROPOSAL' ? 'bg-neon-blue/20' :
                            notification.notificationType === 'FRIEND_REQUEST' ? 'bg-neon-purple/20' :
                            notification.notificationType === 'ACHIEVEMENT' ? 'bg-neon-gold/20' :
                            'bg-neon-green/20'
                          }`}>
                            {notification.notificationType === 'TRADE_PROPOSAL' && <Activity className="w-5 h-5 text-neon-blue" />}
                            {notification.notificationType === 'FRIEND_REQUEST' && <UserPlus className="w-5 h-5 text-neon-purple" />}
                            {notification.notificationType === 'ACHIEVEMENT' && <Trophy className="w-5 h-5 text-neon-gold" />}
                            {!['TRADE_PROPOSAL', 'FRIEND_REQUEST', 'ACHIEVEMENT'].includes(notification.notificationType) && 
                              <Bell className="w-5 h-5 text-neon-green" />}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="font-semibold text-white">
                                {notification.title}
                              </h4>
                              <span className="text-sm text-gray-400">
                                {formatTimeAgo(notification.createdAt)}
                              </span>
                            </div>
                            <p className="text-gray-300 text-sm">
                              {notification.message}
                            </p>
                            {!notification.isRead && (
                              <div className="w-2 h-2 bg-neon-blue rounded-full mt-2" />
                            )}
                          </div>
                        </div>
                      </GlassCard>
                    </motion.div>
                  ))}
                </div>

                {notifications.length === 0 && (
                  <div className="text-center py-12">
                    <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">
                      No notifications
                    </h3>
                    <p className="text-gray-400">
                      You're all caught up! Notifications will appear here
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}

export default SocialDashboard;