import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { fantasySocialFeed } from '@/lib/social/fantasy-social-feed';

// GET /api/social/posts - Get social feed
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const leagueId = searchParams.get('leagueId');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Build query
    const where: any = {};
    
    if (leagueId) {
      where.leagueId = leagueId;
    } else {
      // Get user's leagues for personalized feed
      const userLeagues = await prisma.league.findMany({
        where: { userId: user.id },
        select: { id: true }
      });
      
      where.OR = [
        { visibility: 'public' },
        { leagueId: { in: userLeagues.map(l => l.id) } },
        { authorId: user.id }
      ];
    }

    // Get posts
    const posts = await prisma.socialPost.findMany({
      where,
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        League: {
          select: {
            id: true,
            name: true
          }
        },
        SocialReaction: true,
        SocialComment: {
          include: {
            User: {
              select: {
                id: true,
                name: true,
                image: true
              }
            },
            SocialReaction: true
          },
          orderBy: { createdAt: 'desc' },
          take: 3
        },
        _count: {
          select: {
            SocialComment: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    });

    // Format posts
    const formattedPosts = posts.map(post => ({
      id: post.id,
      type: post.type,
      content: post.content,
      media: post.media,
      attachments: post.attachments,
      author: {
        id: post.User.id,
        name: post.User.name,
        email: post.User.email,
        image: post.User.image
      },
      league: post.League,
      reactions: formatReactions(post.SocialReaction),
      comments: post.SocialComment.map(comment => ({
        id: comment.id,
        content: comment.content,
        author: comment.User,
        reactions: formatReactions(comment.SocialReaction),
        createdAt: comment.createdAt
      })),
      commentCount: post._count.SocialComment,
      viewCount: post.viewCount,
      shareCount: post.shareCount,
      createdAt: post.createdAt,
      editedAt: post.editedAt,
      userHasReacted: post.SocialReaction.some(r => r.userId === user.id)
    }));

    return NextResponse.json({
      posts: formattedPosts,
      hasMore: formattedPosts.length === limit
    });
  } catch (error) {
    console.error('Error fetching social feed:', error);
    return NextResponse.json(
      { error: 'Failed to fetch social feed' },
      { status: 500 }
    );
  }
}

// POST /api/social/posts - Create a new post
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { type, content, leagueId, media, attachments, visibility } = await request.json();

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Create post
    const post = await prisma.socialPost.create({
      data: {
        authorId: user.id,
        type,
        content,
        leagueId,
        media,
        attachments,
        visibility: visibility || 'league'
      },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        League: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Check for achievements
    const socialActionCount = await prisma.socialPost.count({
      where: { authorId: user.id }
    });

    if (socialActionCount === 50) {
      // Trigger social butterfly achievement check
      await fetch(`${request.url}/../achievements/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: {
            type: 'social',
            data: { action: 'message', count: socialActionCount }
          }
        })
      });
    }

    return NextResponse.json({
      post: {
        id: post.id,
        type: post.type,
        content: post.content,
        media: post.media,
        attachments: post.attachments,
        author: post.User,
        league: post.League,
        reactions: {},
        comments: [],
        commentCount: 0,
        viewCount: 0,
        shareCount: 0,
        createdAt: post.createdAt,
        userHasReacted: false
      }
    });
  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    );
  }
}

// Helper function to format reactions
function formatReactions(reactions: any[]): Record<string, number> {
  const formatted: Record<string, number> = {};
  
  reactions.forEach(reaction => {
    if (!formatted[reaction.emoji]) {
      formatted[reaction.emoji] = 0;
    }
    formatted[reaction.emoji]++;
  });
  
  return formatted;
}