import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import webpush from 'web-push';
import { prisma } from '@/lib/prisma';

// Configure web-push
webpush.setVapidDetails(
  'mailto:notifications@fantasy.ai',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
  process.env.VAPID_PRIVATE_KEY || ''
);

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    
    // Only allow admins or system to send notifications
    if (!session?.user?.email || session.user.email !== 'admin@fantasy.ai') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    const { userId, type, data } = await req.json();
    
    if (!userId || !type) {
      return NextResponse.json(
        { error: 'User ID and notification type are required' },
        { status: 400 }
      );
    }
    
    // Get user's push subscriptions
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId }
    });
    
    if (subscriptions.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No active subscriptions for user'
      });
    }
    
    // Create notification payload
    const payload = JSON.stringify({
      type,
      data,
      timestamp: Date.now()
    });
    
    // Send to all user's devices
    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth
              }
            },
            payload
          );
          return { success: true, endpoint: sub.endpoint };
        } catch (error: any) {
          // Remove invalid subscriptions
          if (error.statusCode === 410) {
            await prisma.pushSubscription.delete({
              where: { id: sub.id }
            });
          }
          return { success: false, endpoint: sub.endpoint, error: error.message };
        }
      })
    );
    
    // Count successful sends
    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    
    // Log notification
    await prisma.notificationLog.create({
      data: {
        userId,
        type,
        data,
        sentCount: successful,
        totalCount: subscriptions.length,
        status: successful > 0 ? 'sent' : 'failed'
      }
    });
    
    return NextResponse.json({
      success: true,
      sent: successful,
      total: subscriptions.length,
      results
    });
    
  } catch (error) {
    console.error('Send notification error:', error);
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}

// Batch send notifications
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email || session.user.email !== 'admin@fantasy.ai') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    const { type, data, filters } = await req.json();
    
    // Build user query based on filters
    const where: any = {};
    
    if (filters?.tier) {
      where.subscriptionTier = filters.tier;
    }
    
    if (filters?.lastActiveWithin) {
      where.lastActive = {
        gte: new Date(Date.now() - filters.lastActiveWithin * 24 * 60 * 60 * 1000)
      };
    }
    
    // Get target users
    const users = await prisma.user.findMany({
      where,
      select: { id: true }
    });
    
    // Send notifications to all matching users
    let totalSent = 0;
    
    for (const user of users) {
      const subscriptions = await prisma.pushSubscription.findMany({
        where: { userId: user.id }
      });
      
      if (subscriptions.length > 0) {
        const payload = JSON.stringify({
          type,
          data,
          timestamp: Date.now()
        });
        
        for (const sub of subscriptions) {
          try {
            await webpush.sendNotification(
              {
                endpoint: sub.endpoint,
                keys: {
                  p256dh: sub.p256dh,
                  auth: sub.auth
                }
              },
              payload
            );
            totalSent++;
          } catch (error: any) {
            if (error.statusCode === 410) {
              await prisma.pushSubscription.delete({
                where: { id: sub.id }
              });
            }
          }
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      userCount: users.length,
      notificationsSent: totalSent
    });
    
  } catch (error) {
    console.error('Batch send error:', error);
    return NextResponse.json(
      { error: 'Failed to send batch notifications' },
      { status: 500 }
    );
  }
}