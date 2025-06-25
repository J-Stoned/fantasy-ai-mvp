import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

// POST /api/social/posts/:postId/reactions - Add reaction to post
export async function POST(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { emoji } = await request.json();
    const postId = params.postId;

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if reaction already exists
    const existingReaction = await prisma.socialReaction.findUnique({
      where: {
        postId_userId_emoji: {
          postId,
          userId: user.id,
          emoji
        }
      }
    });

    if (existingReaction) {
      // Remove reaction
      await prisma.socialReaction.delete({
        where: {
          postId_userId_emoji: {
            postId,
            userId: user.id,
            emoji
          }
        }
      });

      return NextResponse.json({
        action: 'removed',
        emoji
      });
    } else {
      // Add reaction
      await prisma.socialReaction.create({
        data: {
          postId,
          userId: user.id,
          emoji
        }
      });

      // Create notification for post author
      const post = await prisma.socialPost.findUnique({
        where: { id: postId },
        select: { authorId: true }
      });

      if (post && post.authorId !== user.id) {
        await prisma.notification.create({
          data: {
            userId: post.authorId,
            notificationType: 'reaction',
            title: 'New Reaction',
            message: `${user.name || 'Someone'} reacted ${emoji} to your post`,
            data: JSON.stringify({ postId, emoji, fromUserId: user.id })
          }
        });
      }

      return NextResponse.json({
        action: 'added',
        emoji
      });
    }
  } catch (error) {
    console.error('Error handling reaction:', error);
    return NextResponse.json(
      { error: 'Failed to handle reaction' },
      { status: 500 }
    );
  }
}

// GET /api/social/posts/:postId/reactions - Get reactions for post
export async function GET(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const postId = params.postId;

    const reactions = await prisma.socialReaction.findMany({
      where: { postId },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      }
    });

    // Group by emoji
    const grouped: Record<string, any[]> = {};
    
    reactions.forEach(reaction => {
      if (!grouped[reaction.emoji]) {
        grouped[reaction.emoji] = [];
      }
      grouped[reaction.emoji].push({
        user: reaction.User,
        createdAt: reaction.createdAt
      });
    });

    return NextResponse.json({
      reactions: grouped,
      total: reactions.length
    });
  } catch (error) {
    console.error('Error fetching reactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reactions' },
      { status: 500 }
    );
  }
}