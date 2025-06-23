/**
 * Community Features
 * Comments, reactions, and social interactions
 */

import { CommunityPost, Comment } from '../types';
import { prisma } from '@/lib/prisma';

export class CommunityService {
  /**
   * Create a new community post
   */
  async createPost(
    userId: string,
    content: string,
    leagueId?: string,
    mediaUrls?: string[],
    tags?: string[]
  ): Promise<CommunityPost> {
    const post = await prisma.communityPost.create({
      data: {
        userId,
        content,
        leagueId,
        mediaUrls: mediaUrls || [],
        tags: tags || [],
        likes: 0
      },
      include: {
        user: true,
        comments: {
          include: {
            user: true,
            replies: {
              include: {
                user: true
              }
            }
          }
        }
      }
    });

    return this.transformPost(post);
  }

  /**
   * Get community posts
   */
  async getPosts(options: {
    leagueId?: string;
    userId?: string;
    limit?: number;
    offset?: number;
  }): Promise<CommunityPost[]> {
    const posts = await prisma.communityPost.findMany({
      where: {
        ...(options.leagueId && { leagueId: options.leagueId }),
        ...(options.userId && { userId: options.userId })
      },
      include: {
        user: true,
        comments: {
          include: {
            user: true,
            replies: {
              include: {
                user: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: options.limit || 20,
      skip: options.offset || 0
    });

    return posts.map(post => this.transformPost(post));
  }

  /**
   * Like/unlike a post
   */
  async toggleLike(postId: string, userId: string): Promise<boolean> {
    const existingLike = await prisma.postLike.findUnique({
      where: {
        userId_postId: {
          userId,
          postId
        }
      }
    });

    if (existingLike) {
      // Unlike
      await prisma.$transaction([
        prisma.postLike.delete({
          where: {
            id: existingLike.id
          }
        }),
        prisma.communityPost.update({
          where: { id: postId },
          data: { likes: { decrement: 1 } }
        })
      ]);
      return false;
    } else {
      // Like
      await prisma.$transaction([
        prisma.postLike.create({
          data: {
            userId,
            postId
          }
        }),
        prisma.communityPost.update({
          where: { id: postId },
          data: { likes: { increment: 1 } }
        })
      ]);
      return true;
    }
  }

  /**
   * Add a comment to a post
   */
  async addComment(
    postId: string,
    userId: string,
    content: string,
    parentCommentId?: string
  ): Promise<Comment> {
    const comment = await prisma.comment.create({
      data: {
        postId,
        userId,
        content,
        parentId: parentCommentId,
        likes: 0
      },
      include: {
        user: true,
        replies: {
          include: {
            user: true
          }
        }
      }
    });

    // Update post comment count
    await prisma.communityPost.update({
      where: { id: postId },
      data: { updatedAt: new Date() }
    });

    return this.transformComment(comment);
  }

  /**
   * Like/unlike a comment
   */
  async toggleCommentLike(commentId: string, userId: string): Promise<boolean> {
    const existingLike = await prisma.commentLike.findUnique({
      where: {
        userId_commentId: {
          userId,
          commentId
        }
      }
    });

    if (existingLike) {
      // Unlike
      await prisma.$transaction([
        prisma.commentLike.delete({
          where: {
            id: existingLike.id
          }
        }),
        prisma.comment.update({
          where: { id: commentId },
          data: { likes: { decrement: 1 } }
        })
      ]);
      return false;
    } else {
      // Like
      await prisma.$transaction([
        prisma.commentLike.create({
          data: {
            userId,
            commentId
          }
        }),
        prisma.comment.update({
          where: { id: commentId },
          data: { likes: { increment: 1 } }
        })
      ]);
      return true;
    }
  }

  /**
   * Report inappropriate content
   */
  async reportContent(
    contentType: 'post' | 'comment',
    contentId: string,
    reporterId: string,
    reason: string
  ): Promise<void> {
    await prisma.report.create({
      data: {
        contentType,
        contentId,
        reporterId,
        reason,
        status: 'pending'
      }
    });
  }

  /**
   * Get trending topics
   */
  async getTrendingTopics(limit = 10): Promise<string[]> {
    const recentPosts = await prisma.communityPost.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      },
      select: {
        tags: true
      }
    });

    // Count tag occurrences
    const tagCounts = new Map<string, number>();
    recentPosts.forEach(post => {
      post.tags.forEach(tag => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    });

    // Sort by count and return top tags
    return Array.from(tagCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([tag]) => tag);
  }

  /**
   * Get user activity feed
   */
  async getUserFeed(userId: string, limit = 50): Promise<CommunityPost[]> {
    // Get user's leagues and followed users
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        leagues: true,
        following: true
      }
    });

    if (!user) return [];

    const leagueIds = user.leagues.map(l => l.id);
    const followingIds = user.following.map(f => f.followingId);

    // Get posts from user's leagues and followed users
    const posts = await prisma.communityPost.findMany({
      where: {
        OR: [
          { leagueId: { in: leagueIds } },
          { userId: { in: [...followingIds, userId] } }
        ]
      },
      include: {
        user: true,
        comments: {
          include: {
            user: true,
            replies: {
              include: {
                user: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 3 // Limit comments per post
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    });

    return posts.map(post => this.transformPost(post));
  }

  /**
   * Transform database post to CommunityPost type
   */
  private transformPost(post: any): CommunityPost {
    return {
      id: post.id,
      userId: post.userId,
      leagueId: post.leagueId,
      content: post.content,
      mediaUrls: post.mediaUrls,
      tags: post.tags,
      likes: post.likes,
      comments: post.comments?.map((c: any) => this.transformComment(c)) || [],
      createdAt: post.createdAt,
      updatedAt: post.updatedAt
    };
  }

  /**
   * Transform database comment to Comment type
   */
  private transformComment(comment: any): Comment {
    return {
      id: comment.id,
      userId: comment.userId,
      content: comment.content,
      likes: comment.likes,
      replies: comment.replies?.map((r: any) => this.transformComment(r)),
      createdAt: comment.createdAt
    };
  }
}

/**
 * Real-time updates using WebSockets
 */
export class CommunityRealtime {
  private connections: Map<string, WebSocket> = new Map();

  /**
   * Handle new WebSocket connection
   */
  handleConnection(ws: WebSocket, userId: string) {
    this.connections.set(userId, ws);

    ws.on('message', (message) => {
      const data = JSON.parse(message.toString());
      this.handleMessage(userId, data);
    });

    ws.on('close', () => {
      this.connections.delete(userId);
    });
  }

  /**
   * Handle incoming messages
   */
  private handleMessage(userId: string, data: any) {
    switch (data.type) {
      case 'subscribe':
        // Subscribe to specific channels (leagues, users, etc.)
        break;
      case 'unsubscribe':
        // Unsubscribe from channels
        break;
    }
  }

  /**
   * Broadcast new post to relevant users
   */
  broadcastPost(post: CommunityPost, targetUserIds: string[]) {
    const message = JSON.stringify({
      type: 'new_post',
      data: post
    });

    targetUserIds.forEach(userId => {
      const ws = this.connections.get(userId);
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });
  }

  /**
   * Broadcast new comment
   */
  broadcastComment(comment: Comment, postId: string, targetUserIds: string[]) {
    const message = JSON.stringify({
      type: 'new_comment',
      data: { comment, postId }
    });

    targetUserIds.forEach(userId => {
      const ws = this.connections.get(userId);
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });
  }

  /**
   * Broadcast like update
   */
  broadcastLike(
    type: 'post' | 'comment',
    id: string,
    likes: number,
    targetUserIds: string[]
  ) {
    const message = JSON.stringify({
      type: 'like_update',
      data: { type, id, likes }
    });

    targetUserIds.forEach(userId => {
      const ws = this.connections.get(userId);
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });
  }
}

// Singleton instances
let communityService: CommunityService | null = null;
let communityRealtime: CommunityRealtime | null = null;

export function getCommunityService(): CommunityService {
  if (!communityService) {
    communityService = new CommunityService();
  }
  return communityService;
}

export function getCommunityRealtime(): CommunityRealtime {
  if (!communityRealtime) {
    communityRealtime = new CommunityRealtime();
  }
  return communityRealtime;
}