"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { 
  Send, 
  Smile, 
  Image, 
  Paperclip,
  Reply,
  MoreHorizontal,
  Edit3,
  Trash2,
  Heart,
  ThumbsUp,
  Laugh,
  Angry,
  Zap,
  Trophy,
  Users,
  MessageCircle
} from "lucide-react";

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  messageType: string;
  isEdited: boolean;
  editedAt?: Date;
  parentId?: string;
  reactions: Array<{
    id: string;
    userId: string;
    userName: string;
    reactionType: string;
    createdAt: Date;
  }>;
  createdAt: Date;
}

interface LeagueChatProps {
  leagueId: string;
  userId: string;
  userName: string;
}

const REACTION_EMOJIS = {
  LIKE: '👍',
  LOVE: '❤️',
  LAUGH: '😂',
  ANGRY: '😠',
  SURPRISED: '😮',
  FIRE: '🔥',
  TROPHY: '🏆'
};

export function LeagueChat({ leagueId, userId, userName }: LeagueChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [replyToMessage, setReplyToMessage] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Array<{ id: string; name: string; isOnline: boolean }>>([]);
  const [isTyping, setIsTyping] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Mock messages data
    const mockMessages: Message[] = [
      {
        id: 'msg_1',
        senderId: 'user_2',
        senderName: 'FantasyKing',
        content: 'Great pickup on CMC! That trade is going to pay off big time 🔥',
        messageType: 'TEXT',
        isEdited: false,
        reactions: [
          {
            id: 'react_1',
            userId: 'user_3',
            userName: 'ChampMaker',
            reactionType: 'FIRE',
            createdAt: new Date(Date.now() - 300000)
          }
        ],
        createdAt: new Date(Date.now() - 1800000)
      },
      {
        id: 'msg_2',
        senderId: 'user_3',
        senderName: 'ChampMaker',
        content: 'Anyone want to make a trade? I need RB depth badly',
        messageType: 'TEXT',
        isEdited: false,
        reactions: [],
        createdAt: new Date(Date.now() - 900000)
      },
      {
        id: 'msg_3',
        senderId: 'system',
        senderName: 'Fantasy.AI',
        content: 'Trade completed: ChampMaker traded Stefon Diggs to FantasyKing for Joe Mixon + 2024 2nd round pick',
        messageType: 'SYSTEM_MESSAGE',
        isEdited: false,
        reactions: [
          {
            id: 'react_2',
            userId: 'user_2',
            userName: 'FantasyKing',
            reactionType: 'TROPHY',
            createdAt: new Date(Date.now() - 60000)
          }
        ],
        createdAt: new Date(Date.now() - 300000)
      },
      {
        id: 'msg_4',
        senderId: 'user_4',
        senderName: 'GridironGuru',
        content: 'That was a solid trade for both sides. Win-win! 👏',
        messageType: 'TEXT',
        isEdited: false,
        reactions: [
          {
            id: 'react_3',
            userId: 'user_2',
            userName: 'FantasyKing',
            reactionType: 'LIKE',
            createdAt: new Date(Date.now() - 30000)
          },
          {
            id: 'react_4',
            userId: 'user_3',
            userName: 'ChampMaker',
            reactionType: 'LIKE',
            createdAt: new Date(Date.now() - 25000)
          }
        ],
        createdAt: new Date(Date.now() - 120000)
      }
    ];

    const mockOnlineUsers = [
      { id: 'user_2', name: 'FantasyKing', isOnline: true },
      { id: 'user_3', name: 'ChampMaker', isOnline: true },
      { id: 'user_4', name: 'GridironGuru', isOnline: false },
      { id: 'user_5', name: 'DynastyMaster', isOnline: true }
    ];

    setMessages(mockMessages);
    setOnlineUsers(mockOnlineUsers);
  }, [leagueId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const message: Message = {
      id: `msg_${Date.now()}`,
      senderId: userId,
      senderName: userName,
      content: newMessage,
      messageType: 'TEXT',
      isEdited: false,
      parentId: replyToMessage?.id,
      reactions: [],
      createdAt: new Date()
    };

    setMessages(prev => [...prev, message]);
    setNewMessage("");
    setReplyToMessage(null);
    
    // Simulate real-time message sending
    console.log('Sending message:', message);
  };

  const handleEditMessage = (messageId: string, newContent: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, content: newContent, isEdited: true, editedAt: new Date() }
        : msg
    ));
    setEditingMessage(null);
    setEditContent("");
  };

  const handleDeleteMessage = (messageId: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
  };

  const handleAddReaction = (messageId: string, reactionType: string) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id !== messageId) return msg;
      
      // Remove existing reaction of same type from this user
      const filteredReactions = msg.reactions.filter(r => 
        !(r.userId === userId && r.reactionType === reactionType)
      );
      
      // Add new reaction
      filteredReactions.push({
        id: `react_${Date.now()}`,
        userId,
        userName,
        reactionType,
        createdAt: new Date()
      });
      
      return { ...msg, reactions: filteredReactions };
    }));
    
    setShowEmojiPicker(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    return date.toLocaleDateString();
  };

  const getReactionCounts = (reactions: any[]) => {
    const counts: Record<string, number> = {};
    reactions.forEach(reaction => {
      counts[reaction.reactionType] = (counts[reaction.reactionType] || 0) + 1;
    });
    return counts;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-neon-blue/20 rounded-full flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-neon-blue" />
          </div>
          <div>
            <h3 className="font-bold text-white">League Chat</h3>
            <p className="text-sm text-gray-400">
              {onlineUsers.filter(u => u.isOnline).length} online
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            {onlineUsers.slice(0, 4).map((user) => (
              <div
                key={user.id}
                className="relative w-8 h-8 bg-neon-purple/20 rounded-full border-2 border-background flex items-center justify-center"
              >
                <span className="text-xs text-white">
                  {user.name.substring(0, 2).toUpperCase()}
                </span>
                {user.isOnline && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-neon-green rounded-full border-2 border-background" />
                )}
              </div>
            ))}
          </div>
          
          <div className="text-sm text-gray-400">
            {onlineUsers.length} members
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((message, index) => {
            const isOwnMessage = message.senderId === userId;
            const isSystemMessage = message.messageType === 'SYSTEM_MESSAGE';
            const reactionCounts = getReactionCounts(message.reactions);
            
            return (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : ''} ${isSystemMessage ? 'justify-center' : ''}`}
              >
                {!isSystemMessage && !isOwnMessage && (
                  <div className="w-8 h-8 bg-neon-purple/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xs text-white">
                      {message.senderName.substring(0, 2).toUpperCase()}
                    </span>
                  </div>
                )}

                <div className={`max-w-[70%] ${isSystemMessage ? 'max-w-[90%]' : ''}`}>
                  {/* Reply context */}
                  {message.parentId && (
                    <div className="mb-1 p-2 bg-white/5 rounded-lg border-l-2 border-neon-blue">
                      <div className="text-xs text-gray-400">
                        Replying to previous message
                      </div>
                    </div>
                  )}

                  <div className={`relative group ${isSystemMessage ? 'text-center' : ''}`}>
                    <div
                      className={`p-3 rounded-lg ${
                        isSystemMessage
                          ? 'bg-neon-blue/10 border border-neon-blue/30 text-neon-blue'
                          : isOwnMessage
                          ? 'bg-neon-blue/20 border border-neon-blue/30'
                          : 'bg-white/5 border border-white/10'
                      }`}
                    >
                      {!isSystemMessage && (
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-white">
                            {message.senderName}
                          </span>
                          <span className="text-xs text-gray-400">
                            {formatTime(message.createdAt)}
                            {message.isEdited && ' (edited)'}
                          </span>
                        </div>
                      )}

                      {editingMessage === message.id ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-neon-blue/50"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                handleEditMessage(message.id, editContent);
                              } else if (e.key === 'Escape') {
                                setEditingMessage(null);
                                setEditContent("");
                              }
                            }}
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <NeonButton
                              variant="blue"
                              onClick={() => handleEditMessage(message.id, editContent)}
                              className="text-xs px-2 py-1"
                            >
                              Save
                            </NeonButton>
                            <button
                              onClick={() => {
                                setEditingMessage(null);
                                setEditContent("");
                              }}
                              className="text-xs px-2 py-1 text-gray-400 hover:text-white"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-white">{message.content}</div>
                      )}
                    </div>

                    {/* Message Actions */}
                    {!isSystemMessage && (
                      <div className="absolute top-0 right-0 -mt-2 -mr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex items-center gap-1 bg-background/90 rounded-lg border border-white/10 p-1">
                          <button
                            onClick={() => setShowEmojiPicker(showEmojiPicker === message.id ? null : message.id)}
                            className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white"
                          >
                            <Smile className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setReplyToMessage(message)}
                            className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white"
                          >
                            <Reply className="w-4 h-4" />
                          </button>
                          {isOwnMessage && (
                            <>
                              <button
                                onClick={() => {
                                  setEditingMessage(message.id);
                                  setEditContent(message.content);
                                }}
                                className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteMessage(message.id)}
                                className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-red-400"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Emoji Picker */}
                    {showEmojiPicker === message.id && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute top-full left-0 mt-2 z-20 bg-background border border-white/10 rounded-lg p-2 shadow-lg"
                      >
                        <div className="flex gap-1">
                          {Object.entries(REACTION_EMOJIS).map(([type, emoji]) => (
                            <button
                              key={type}
                              onClick={() => handleAddReaction(message.id, type)}
                              className="p-2 hover:bg-white/10 rounded text-lg"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* Reactions */}
                    {Object.keys(reactionCounts).length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {Object.entries(reactionCounts).map(([type, count]) => (
                          <button
                            key={type}
                            onClick={() => handleAddReaction(message.id, type)}
                            className="flex items-center gap-1 px-2 py-1 bg-white/10 rounded-full text-xs hover:bg-white/20 transition-colors"
                          >
                            <span>{REACTION_EMOJIS[type as keyof typeof REACTION_EMOJIS]}</span>
                            <span className="text-white">{count}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        
        {/* Typing Indicators */}
        {isTyping.length > 0 && (
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <div className="flex space-x-1">
              <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" />
              <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
              <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
            </div>
            <span>{isTyping.join(', ')} {isTyping.length === 1 ? 'is' : 'are'} typing...</span>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Reply Context */}
      {replyToMessage && (
        <div className="px-4 py-2 border-t border-white/10 bg-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Reply className="w-4 h-4 text-neon-blue" />
              <span className="text-sm text-gray-400">
                Replying to {replyToMessage.senderName}
              </span>
            </div>
            <button
              onClick={() => setReplyToMessage(null)}
              className="text-gray-400 hover:text-white"
            >
              ×
            </button>
          </div>
          <div className="text-sm text-gray-300 truncate mt-1">
            {replyToMessage.content}
          </div>
        </div>
      )}

      {/* Message Input */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <input
              ref={chatInputRef}
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="w-full px-4 py-3 pr-12 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-neon-blue/50"
            />
            
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
              <button className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white">
                <Paperclip className="w-4 h-4" />
              </button>
              <button className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white">
                <Image className="w-4 h-4" />
              </button>
              <button className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white">
                <Smile className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <NeonButton
            variant="blue"
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className="flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            Send
          </NeonButton>
        </div>
      </div>
    </div>
  );
}

export default LeagueChat;