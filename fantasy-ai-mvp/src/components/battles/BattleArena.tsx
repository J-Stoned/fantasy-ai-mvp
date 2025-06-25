'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Sword, 
  Shield, 
  Trophy, 
  Clock, 
  Fire, 
  Zap,
  Users,
  MessageSquare,
  Send,
  Crown,
  Target
} from 'lucide-react';
import { toast } from 'sonner';

interface Battle {
  id: string;
  type: 'head_to_head' | 'tournament' | 'daily_challenge';
  status: 'pending' | 'active' | 'completed';
  participants: {
    id: string;
    name: string;
    avatar?: string;
    level: number;
    currentScore: number;
    projectedScore: number;
    lineup: any[];
  }[];
  settings: {
    entryFee: number;
    prizePool: number;
    duration: number;
    maxParticipants: number;
  };
  startTime: string;
  endTime?: string;
  winner?: string;
  chat: {
    id: string;
    userId: string;
    userName: string;
    message: string;
    timestamp: string;
  }[];
}

interface BattleArenaProps {
  battleId: string;
  userId: string;
}

export function BattleArena({ battleId, userId }: BattleArenaProps) {
  const [battle, setBattle] = useState<Battle | null>(null);
  const [loading, setLoading] = useState(true);
  const [chatMessage, setChatMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadBattle();
    
    // Set up real-time updates
    const interval = setInterval(loadBattle, 30000); // Update every 30 seconds
    
    return () => clearInterval(interval);
  }, [battleId]);

  useEffect(() => {
    // Scroll to bottom of chat
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [battle?.chat]);

  const loadBattle = async () => {
    try {
      const response = await fetch(`/api/battles/${battleId}`);
      if (response.ok) {
        const data = await response.json();
        setBattle(data);
      } else {
        toast.error('Failed to load battle');
      }
    } catch (error) {
      console.error('Error loading battle:', error);
      toast.error('Error loading battle');
    } finally {
      setLoading(false);
    }
  };

  const joinBattle = async () => {
    try {
      const response = await fetch(`/api/battles/${battleId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });

      if (response.ok) {
        await loadBattle();
        toast.success('Joined battle!');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to join battle');
      }
    } catch (error) {
      console.error('Error joining battle:', error);
      toast.error('Error joining battle');
    }
  };

  const sendChatMessage = async () => {
    if (!chatMessage.trim()) return;

    setSendingMessage(true);
    try {
      const response = await fetch(`/api/battles/${battleId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          message: chatMessage
        })
      });

      if (response.ok) {
        setChatMessage('');
        await loadBattle();
      } else {
        toast.error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Error sending message');
    } finally {
      setSendingMessage(false);
    }
  };

  const getTimeRemaining = () => {
    if (!battle?.endTime) return null;
    
    const now = new Date();
    const end = new Date(battle.endTime);
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return 'Finished';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  const getBattleTypeIcon = (type: string) => {
    switch (type) {
      case 'head_to_head': return <Sword className="w-5 h-5" />;
      case 'tournament': return <Trophy className="w-5 h-5" />;
      case 'daily_challenge': return <Target className="w-5 h-5" />;
      default: return <Sword className="w-5 h-5" />;
    }
  };

  const getBattleTypeLabel = (type: string) => {
    switch (type) {
      case 'head_to_head': return 'Head-to-Head';
      case 'tournament': return 'Tournament';
      case 'daily_challenge': return 'Daily Challenge';
      default: return 'Battle';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'active': return 'bg-green-500';
      case 'completed': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const isParticipant = battle?.participants.some(p => p.id === userId);
  const currentUser = battle?.participants.find(p => p.id === userId);
  const leaderboard = battle?.participants.sort((a, b) => b.currentScore - a.currentScore);

  if (loading) {
    return (
      <div className="space-y-4">
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-6 bg-gray-300 rounded w-1/3"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="h-4 bg-gray-300 rounded"></div>
              <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!battle) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-red-500">Battle Not Found</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">This battle could not be loaded.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Battle Header */}
      <Card className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getBattleTypeIcon(battle.type)}
              <div>
                <CardTitle className="text-2xl">
                  {getBattleTypeLabel(battle.type)}
                </CardTitle>
                <p className="text-purple-100">
                  {battle.participants.length}/{battle.settings.maxParticipants} participants
                </p>
              </div>
            </div>
            <div className="text-right">
              <Badge className={getStatusColor(battle.status)}>
                {battle.status.toUpperCase()}
              </Badge>
              {battle.status === 'active' && (
                <p className="text-sm text-purple-100 mt-1">
                  <Clock className="w-4 h-4 inline mr-1" />
                  {getTimeRemaining()}
                </p>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">
                {battle.settings.entryFee} 💎
              </div>
              <div className="text-sm text-purple-200">Entry Fee</div>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {battle.settings.prizePool} 💎
              </div>
              <div className="text-sm text-purple-200">Prize Pool</div>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {Math.floor(battle.settings.duration / 60)}h
              </div>
              <div className="text-sm text-purple-200">Duration</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Join Battle Button */}
      {!isParticipant && battle.status === 'pending' && (
        <Card>
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-semibold mb-2">Ready to Battle?</h3>
            <p className="text-gray-600 mb-4">
              Join this battle and compete against other players!
            </p>
            <Button onClick={joinBattle} className="bg-green-600 hover:bg-green-700">
              <Sword className="w-4 h-4 mr-2" />
              Join Battle ({battle.settings.entryFee} 💎)
            </Button>
          </CardContent>
        </Card>
      )}

      {/* User Stats (if participant) */}
      {currentUser && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-900 flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              Your Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {currentUser.currentScore.toFixed(1)}
                </div>
                <div className="text-sm text-gray-600">Current Score</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {currentUser.projectedScore.toFixed(1)}
                </div>
                <div className="text-sm text-gray-600">Projected</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  #{leaderboard?.findIndex(p => p.id === userId) + 1}
                </div>
                <div className="text-sm text-gray-600">Rank</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {((currentUser.currentScore / currentUser.projectedScore) * 100).toFixed(0)}%
                </div>
                <div className="text-sm text-gray-600">Progress</div>
              </div>
            </div>
            <div className="mt-4">
              <Progress 
                value={(currentUser.currentScore / currentUser.projectedScore) * 100} 
                className="h-3"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Battle Tabs */}
      <Tabs defaultValue="leaderboard" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="leaderboard">
            <Trophy className="w-4 h-4 mr-2" />
            Leaderboard
          </TabsTrigger>
          <TabsTrigger value="lineups">
            <Users className="w-4 h-4 mr-2" />
            Lineups
          </TabsTrigger>
          <TabsTrigger value="chat">
            <MessageSquare className="w-4 h-4 mr-2" />
            Chat
          </TabsTrigger>
        </TabsList>

        <TabsContent value="leaderboard" className="space-y-3">
          {leaderboard?.map((participant, index) => (
            <Card key={participant.id} className={index === 0 ? 'border-yellow-300 bg-yellow-50' : ''}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar>
                        <AvatarImage src={participant.avatar} />
                        <AvatarFallback>
                          {participant.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      {index === 0 && (
                        <Crown className="w-4 h-4 text-yellow-500 absolute -top-1 -right-1" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold flex items-center gap-2">
                        #{index + 1} {participant.name}
                        {participant.id === userId && (
                          <Badge variant="outline">You</Badge>
                        )}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Level {participant.level}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold">
                      {participant.currentScore.toFixed(1)}
                    </div>
                    <div className="text-sm text-gray-600">
                      Proj: {participant.projectedScore.toFixed(1)}
                    </div>
                  </div>
                </div>
                <div className="mt-2">
                  <Progress 
                    value={(participant.currentScore / participant.projectedScore) * 100} 
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="lineups" className="space-y-4">
          {battle.participants.map((participant) => (
            <Card key={participant.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={participant.avatar} />
                    <AvatarFallback className="text-xs">
                      {participant.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  {participant.name}
                  {participant.id === userId && (
                    <Badge variant="outline">Your Lineup</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {participant.lineup.map((player, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div>
                        <span className="font-medium">{player.name}</span>
                        <span className="text-sm text-gray-600 ml-2">{player.position}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{player.currentPoints?.toFixed(1) || '0.0'}</div>
                        <div className="text-xs text-gray-600">
                          Proj: {player.projectedPoints?.toFixed(1) || '0.0'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="chat" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Battle Chat
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Chat Messages */}
              <div 
                ref={chatRef}
                className="h-64 overflow-y-auto space-y-2 mb-4 p-2 bg-gray-50 rounded"
              >
                {battle.chat.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    No messages yet. Start the conversation!
                  </p>
                ) : (
                  battle.chat.map((message) => (
                    <div 
                      key={message.id} 
                      className={`flex ${message.userId === userId ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-xs px-3 py-2 rounded-lg ${
                        message.userId === userId 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-white border'
                      }`}>
                        {message.userId !== userId && (
                          <p className="text-xs text-gray-600 mb-1">
                            {message.userName}
                          </p>
                        )}
                        <p className="text-sm">{message.message}</p>
                        <p className={`text-xs mt-1 ${
                          message.userId === userId ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Chat Input */}
              {isParticipant && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                    placeholder="Type a message..."
                    className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Button 
                    onClick={sendChatMessage}
                    disabled={!chatMessage.trim() || sendingMessage}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}