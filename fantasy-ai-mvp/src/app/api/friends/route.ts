import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { friendSystem } from '@/lib/social/friend-system';

// GET /api/friends - Get user's friends
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'accepted';

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get friends from database
    const friendConnections = await prisma.friendConnection.findMany({
      where: {
        OR: [
          { userId: user.id, status },
          { friendId: user.id, status }
        ]
      },
      include: {
        User: true,
        Friend: true
      }
    });

    // Format friends list
    const friends = friendConnections.map(connection => {
      const friend = connection.userId === user.id ? connection.Friend : connection.User;
      return {
        id: friend.id,
        name: friend.name,
        email: friend.email,
        image: friend.image,
        status: connection.status,
        friendsSince: connection.friendsSince,
        stats: {
          headToHeadWins: connection.headToHeadWins,
          headToHeadLosses: connection.headToHeadLosses,
          headToHeadTies: connection.headToHeadTies,
          lastMatchup: connection.lastMatchup
        }
      };
    });

    // Get friend requests if viewing pending
    let friendRequests = [];
    if (status === 'pending') {
      const requests = await prisma.friendConnection.findMany({
        where: {
          friendId: user.id,
          status: 'pending'
        },
        include: {
          User: true
        }
      });

      friendRequests = requests.map(req => ({
        id: req.id,
        fromUser: {
          id: req.User.id,
          name: req.User.name,
          email: req.User.email,
          image: req.User.image
        },
        createdAt: req.createdAt
      }));
    }

    return NextResponse.json({
      friends,
      friendRequests,
      stats: {
        totalFriends: friendConnections.filter(c => c.status === 'accepted').length,
        pendingRequests: friendRequests.length
      }
    });
  } catch (error) {
    console.error('Error fetching friends:', error);
    return NextResponse.json(
      { error: 'Failed to fetch friends' },
      { status: 500 }
    );
  }
}

// POST /api/friends/request - Send friend request
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { toUserId, message } = await request.json();

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if already friends or request exists
    const existingConnection = await prisma.friendConnection.findFirst({
      where: {
        OR: [
          { userId: user.id, friendId: toUserId },
          { userId: toUserId, friendId: user.id }
        ]
      }
    });

    if (existingConnection) {
      return NextResponse.json(
        { error: 'Friend request already exists or users are already friends' },
        { status: 400 }
      );
    }

    // Create friend request
    const friendRequest = await prisma.friendConnection.create({
      data: {
        userId: user.id,
        friendId: toUserId,
        status: 'pending'
      }
    });

    // Create notification for recipient
    await prisma.notification.create({
      data: {
        userId: toUserId,
        notificationType: 'friend_request',
        title: 'New Friend Request',
        message: `${user.name || 'A user'} sent you a friend request`,
        data: JSON.stringify({ requestId: friendRequest.id, fromUserId: user.id })
      }
    });

    return NextResponse.json({
      success: true,
      requestId: friendRequest.id
    });
  } catch (error) {
    console.error('Error sending friend request:', error);
    return NextResponse.json(
      { error: 'Failed to send friend request' },
      { status: 500 }
    );
  }
}

// PUT /api/friends/accept/:requestId - Accept friend request
export async function PUT(
  request: NextRequest,
  { params }: { params: { action: string; requestId: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { requestId } = params;

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get friend request
    const friendRequest = await prisma.friendConnection.findUnique({
      where: { id: requestId },
      include: {
        User: true
      }
    });

    if (!friendRequest || friendRequest.friendId !== user.id) {
      return NextResponse.json(
        { error: 'Friend request not found' },
        { status: 404 }
      );
    }

    // Accept request
    const updatedConnection = await prisma.friendConnection.update({
      where: { id: requestId },
      data: {
        status: 'accepted',
        friendsSince: new Date()
      }
    });

    // Create notification for requester
    await prisma.notification.create({
      data: {
        userId: friendRequest.userId,
        notificationType: 'friend_accepted',
        title: 'Friend Request Accepted',
        message: `${user.name || 'A user'} accepted your friend request`,
        data: JSON.stringify({ friendId: user.id })
      }
    });

    return NextResponse.json({
      success: true,
      friend: {
        id: friendRequest.User.id,
        name: friendRequest.User.name,
        email: friendRequest.User.email,
        image: friendRequest.User.image
      }
    });
  } catch (error) {
    console.error('Error accepting friend request:', error);
    return NextResponse.json(
      { error: 'Failed to accept friend request' },
      { status: 500 }
    );
  }
}

// Handle friend suggestions (moved to separate route file)