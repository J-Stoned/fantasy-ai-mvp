import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const { userId, credentialId, publicKey } = await req.json();
    
    if (!userId || !credentialId || !publicKey) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Verify the user matches the session
    if (userId !== session.user.id && userId !== session.user.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    // Store the credential
    await prisma.biometricCredential.create({
      data: {
        userId: session.user.id || session.user.email,
        credentialId,
        publicKey,
        deviceName: req.headers.get('user-agent') || 'Unknown Device',
        lastUsed: new Date()
      }
    });
    
    // Log the registration
    await prisma.auditLog.create({
      data: {
        userId: session.user.id || session.user.email,
        action: 'biometric_registered',
        metadata: {
          credentialId,
          deviceName: req.headers.get('user-agent') || 'Unknown Device'
        }
      }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Biometric credential registered successfully'
    });
    
  } catch (error) {
    console.error('Biometric registration error:', error);
    return NextResponse.json(
      { error: 'Failed to register biometric credential' },
      { status: 500 }
    );
  }
}