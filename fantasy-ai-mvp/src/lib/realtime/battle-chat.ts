import { prisma } from '@/lib/prisma';
import { cache, pubsub } from '@/lib/redis/redis-client';
import { getWebSocketServer } from '@/lib/websocket/websocket-server';

interface ChatMessage {
  id: string;
  battleId: string;
  userId: string;
  userName?: string;
  userAvatar?: string;
  message: string;
  type: 'text' | 'emoji' | 'gif' | 'system';
  metadata?: any;
  timestamp: Date;
  edited?: boolean;
  editedAt?: Date;
}

interface ChatReaction {
  messageId: string;
  userId: string;
  emoji: string;
  timestamp: Date;
}

export class BattleChat {
  private readonly MAX_MESSAGE_LENGTH = 500;
  private readonly MAX_MESSAGES_PER_MINUTE = 10;
  private readonly CHAT_HISTORY_LIMIT = 100;

  // Send a chat message
  async sendMessage(battleId: string, userId: string, content: string, type: 'text' | 'emoji' | 'gif' = 'text') {
    try {
      // Validate user is participant
      const participant = await prisma.battleParticipant.findFirst({
        where: { battleId, userId },
        include: {
          User: {
            select: {
              name: true,
              image: true
            }
          }
        }
      });

      if (!participant) {
        throw new Error('User is not a participant in this battle');
      }

      // Check battle status
      const battle = await prisma.battle.findUnique({
        where: { id: battleId },
        select: { status: true, chatEnabled: true }
      });

      if (!battle?.chatEnabled) {
        throw new Error('Chat is disabled for this battle');
      }

      if (battle.status === 'completed') {
        throw new Error('Battle has ended');
      }

      // Rate limiting
      const rateLimitKey = `chat:ratelimit:${userId}`;
      const isAllowed = await this.checkRateLimit(rateLimitKey);
      if (!isAllowed) {
        throw new Error('Message rate limit exceeded');
      }

      // Validate message
      if (type === 'text' && content.length > this.MAX_MESSAGE_LENGTH) {
        throw new Error(`Message too long (max ${this.MAX_MESSAGE_LENGTH} characters)`);
      }

      // Create message
      const message: ChatMessage = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        battleId,
        userId,
        userName: participant.User.name || 'Anonymous',
        userAvatar: participant.User.image,
        message: this.sanitizeMessage(content),
        type,
        timestamp: new Date()
      };

      // Store in Redis
      await this.storeChatMessage(battleId, message);

      // Send via WebSocket
      const ws = getWebSocketServer();
      ws.sendBattleUpdate(battleId, {
        type: 'chat_message',
        message
      });

      // Publish to Redis pub/sub
      await pubsub.publish(`battle:${battleId}:chat`, message);

      // Check for mentions and send notifications
      await this.handleMentions(battleId, userId, content);

      return message;
    } catch (error) {
      console.error('Failed to send chat message:', error);
      throw error;
    }
  }

  // Edit a chat message
  async editMessage(battleId: string, messageId: string, userId: string, newContent: string) {
    try {
      // Get existing message
      const messages = await this.getChatHistory(battleId, 100);
      const message = messages.find(m => m.id === messageId);

      if (!message) {
        throw new Error('Message not found');
      }

      if (message.userId !== userId) {
        throw new Error('You can only edit your own messages');
      }

      // Check if message is too old (5 minutes)
      const messageAge = Date.now() - new Date(message.timestamp).getTime();
      if (messageAge > 5 * 60 * 1000) {
        throw new Error('Message is too old to edit');
      }

      // Update message
      message.message = this.sanitizeMessage(newContent);
      message.edited = true;
      message.editedAt = new Date();

      // Update in Redis
      await this.updateChatMessage(battleId, message);

      // Send update via WebSocket
      const ws = getWebSocketServer();
      ws.sendBattleUpdate(battleId, {
        type: 'chat_message_edited',
        message
      });

      return message;
    } catch (error) {
      console.error('Failed to edit chat message:', error);
      throw error;
    }
  }

  // Delete a chat message
  async deleteMessage(battleId: string, messageId: string, userId: string) {
    try {
      // Get existing message
      const messages = await this.getChatHistory(battleId, 100);
      const messageIndex = messages.findIndex(m => m.id === messageId);

      if (messageIndex === -1) {
        throw new Error('Message not found');
      }

      const message = messages[messageIndex];

      if (message.userId !== userId) {
        throw new Error('You can only delete your own messages');
      }

      // Remove from Redis
      messages.splice(messageIndex, 1);
      await cache.set(
        `battle:${battleId}:chat`,
        messages,
        86400 // 24 hours
      );

      // Send deletion via WebSocket
      const ws = getWebSocketServer();
      ws.sendBattleUpdate(battleId, {
        type: 'chat_message_deleted',
        messageId
      });

      return { deleted: true };
    } catch (error) {
      console.error('Failed to delete chat message:', error);
      throw error;
    }
  }

  // Add reaction to message
  async addReaction(battleId: string, messageId: string, userId: string, emoji: string) {
    try {
      // Validate user is participant
      const participant = await prisma.battleParticipant.findFirst({
        where: { battleId, userId }
      });

      if (!participant) {
        throw new Error('User is not a participant in this battle');
      }

      const reaction: ChatReaction = {
        messageId,
        userId,
        emoji,
        timestamp: new Date()
      };

      // Store reaction
      const reactionKey = `battle:${battleId}:reactions:${messageId}`;
      const reactions = await cache.get<ChatReaction[]>(reactionKey) || [];
      
      // Check if user already reacted with this emoji
      const existingIndex = reactions.findIndex(
        r => r.userId === userId && r.emoji === emoji
      );

      if (existingIndex >= 0) {
        // Remove reaction (toggle)
        reactions.splice(existingIndex, 1);
      } else {
        // Add reaction
        reactions.push(reaction);
      }

      await cache.set(reactionKey, reactions, 86400);

      // Send update via WebSocket
      const ws = getWebSocketServer();
      ws.sendBattleUpdate(battleId, {
        type: 'chat_reaction',
        messageId,
        reactions
      });

      return reactions;
    } catch (error) {
      console.error('Failed to add reaction:', error);
      throw error;
    }
  }

  // Get chat history
  async getChatHistory(battleId: string, limit: number = 50): Promise<ChatMessage[]> {
    const messages = await cache.get<ChatMessage[]>(`battle:${battleId}:chat`) || [];
    return messages.slice(-limit);
  }

  // Get message reactions
  async getMessageReactions(battleId: string, messageId: string): Promise<ChatReaction[]> {
    const reactionKey = `battle:${battleId}:reactions:${messageId}`;
    return await cache.get<ChatReaction[]>(reactionKey) || [];
  }

  // Send system message
  async sendSystemMessage(battleId: string, message: string, metadata?: any) {
    const systemMessage: ChatMessage = {
      id: `system-${Date.now()}`,
      battleId,
      userId: 'system',
      message,
      type: 'system',
      metadata,
      timestamp: new Date()
    };

    await this.storeChatMessage(battleId, systemMessage);

    // Send via WebSocket
    const ws = getWebSocketServer();
    ws.sendBattleUpdate(battleId, {
      type: 'chat_message',
      message: systemMessage
    });

    return systemMessage;
  }

  // Get online participants
  async getOnlineParticipants(battleId: string): Promise<string[]> {
    const participants = await prisma.battleParticipant.findMany({
      where: { battleId },
      select: { userId: true }
    });

    const ws = getWebSocketServer();
    const onlineUsers = participants
      .map(p => p.userId)
      .filter(userId => ws.isUserOnline(userId));

    return onlineUsers;
  }

  // Typing indicators
  async setTypingStatus(battleId: string, userId: string, isTyping: boolean) {
    const key = `battle:${battleId}:typing`;
    const typingUsers = await cache.get<Set<string>>(key) || new Set();

    if (isTyping) {
      typingUsers.add(userId);
    } else {
      typingUsers.delete(userId);
    }

    await cache.set(key, Array.from(typingUsers), 10); // 10 second expiry

    // Send update via WebSocket
    const ws = getWebSocketServer();
    ws.sendBattleUpdate(battleId, {
      type: 'typing_status',
      typingUsers: Array.from(typingUsers)
    });
  }

  // Private helper methods

  private async checkRateLimit(key: string): Promise<boolean> {
    const count = await cache.incr(key);
    
    if (count === 1) {
      // Set expiry on first message
      await cache.set(key, count, 60); // 1 minute window
    }

    return count <= this.MAX_MESSAGES_PER_MINUTE;
  }

  private sanitizeMessage(message: string): string {
    // Basic sanitization - in production would use a proper library
    return message
      .trim()
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, '');
  }

  private async storeChatMessage(battleId: string, message: ChatMessage) {
    const key = `battle:${battleId}:chat`;
    const messages = await cache.get<ChatMessage[]>(key) || [];
    
    messages.push(message);
    
    // Keep only last N messages
    if (messages.length > this.CHAT_HISTORY_LIMIT) {
      messages.splice(0, messages.length - this.CHAT_HISTORY_LIMIT);
    }

    await cache.set(key, messages, 86400); // 24 hours
  }

  private async updateChatMessage(battleId: string, updatedMessage: ChatMessage) {
    const key = `battle:${battleId}:chat`;
    const messages = await cache.get<ChatMessage[]>(key) || [];
    
    const index = messages.findIndex(m => m.id === updatedMessage.id);
    if (index >= 0) {
      messages[index] = updatedMessage;
      await cache.set(key, messages, 86400);
    }
  }

  private async handleMentions(battleId: string, senderId: string, message: string) {
    // Find @mentions in message
    const mentionRegex = /@(\w+)/g;
    const mentions = message.match(mentionRegex);

    if (!mentions || mentions.length === 0) {
      return;
    }

    // Get battle participants
    const participants = await prisma.battleParticipant.findMany({
      where: { battleId },
      include: {
        User: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Send notifications for mentions
    for (const mention of mentions) {
      const username = mention.substring(1); // Remove @
      const mentioned = participants.find(
        p => p.User.name?.toLowerCase() === username.toLowerCase()
      );

      if (mentioned && mentioned.userId !== senderId) {
        // Send notification
        const { notificationManager } = await import('@/lib/realtime/notification-manager');
        await notificationManager.sendTemplateNotification(
          mentioned.userId,
          'battle_mention',
          {
            battleId,
            fromUser: participants.find(p => p.userId === senderId)?.User.name || 'Someone',
            message: message.substring(0, 100)
          }
        );
      }
    }
  }

  // Chat commands
  async processCommand(battleId: string, userId: string, command: string): Promise<ChatMessage | null> {
    const [cmd, ...args] = command.substring(1).split(' '); // Remove / prefix

    switch (cmd.toLowerCase()) {
      case 'help':
        return await this.sendSystemMessage(
          battleId,
          'Available commands: /help, /status, /participants, /emoji [name]'
        );

      case 'status':
        const battle = await prisma.battle.findUnique({
          where: { id: battleId },
          select: {
            status: true,
            currentRound: true,
            _count: {
              select: { BattleParticipant: true }
            }
          }
        });
        return await this.sendSystemMessage(
          battleId,
          `Battle Status: ${battle?.status}, Round: ${battle?.currentRound}, Participants: ${battle?._count.BattleParticipant}`
        );

      case 'participants':
        const online = await this.getOnlineParticipants(battleId);
        return await this.sendSystemMessage(
          battleId,
          `Online participants: ${online.length}`
        );

      case 'emoji':
        const emojiName = args[0];
        if (emojiName) {
          return await this.sendMessage(battleId, userId, `:${emojiName}:`, 'emoji');
        }
        break;

      default:
        return null;
    }

    return null;
  }
}

// Singleton instance
export const battleChat = new BattleChat();