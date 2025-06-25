import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

// PUT /api/anomaly/:eventId/resolve - Mark anomaly as resolved
export async function PUT(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const eventId = params.eventId;
    const { resolution, notes } = await request.json();

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update anomaly event
    const existingEvent = await prisma.anomalyDetection.findUnique({ 
      where: { id: eventId } 
    });

    if (!existingEvent) {
      return NextResponse.json({ error: 'Anomaly event not found' }, { status: 404 });
    }

    const event = await prisma.anomalyDetection.update({
      where: {
        id: eventId
      },
      data: {
        resolved: true,
        resolvedAt: new Date(),
        details: {
          ...existingEvent.details as any,
          resolution: resolution || 'User marked as resolved',
          resolvedBy: user.id,
          notes
        }
      }
    });

    return NextResponse.json({
      success: true,
      event
    });
  } catch (error) {
    console.error('Error resolving anomaly:', error);
    return NextResponse.json(
      { error: 'Failed to resolve anomaly' },
      { status: 500 }
    );
  }
}