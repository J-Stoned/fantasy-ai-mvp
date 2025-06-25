import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Get all credentials for the user
    const credentials = await prisma.biometricCredential.findMany({
      where: {
        userId: session.user.id || session.user.email
      },
      select: {
        credentialId: true,
        deviceName: true,
        lastUsed: true,
        createdAt: true
      }
    });
    
    return NextResponse.json({
      credentialIds: credentials.map(c => c.credentialId),
      credentials: credentials.map(c => ({
        id: c.credentialId,
        device: c.deviceName,
        lastUsed: c.lastUsed,
        registered: c.createdAt
      }))
    });
    
  } catch (error) {
    console.error('Get credentials error:', error);
    return NextResponse.json(
      { error: 'Failed to get credentials' },
      { status: 500 }
    );
  }
}

// Delete a credential
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const { credentialId } = await req.json();
    
    if (!credentialId) {
      return NextResponse.json(
        { error: 'Credential ID required' },
        { status: 400 }
      );
    }
    
    // Delete the credential
    const deleted = await prisma.biometricCredential.deleteMany({
      where: {
        credentialId,
        userId: session.user.id || session.user.email
      }
    });
    
    if (deleted.count === 0) {
      return NextResponse.json(
        { error: 'Credential not found' },
        { status: 404 }
      );
    }
    
    // Log the removal
    await prisma.auditLog.create({
      data: {
        userId: session.user.id || session.user.email,
        action: 'biometric_removed',
        metadata: { credentialId }
      }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Credential removed successfully'
    });
    
  } catch (error) {
    console.error('Delete credential error:', error);
    return NextResponse.json(
      { error: 'Failed to delete credential' },
      { status: 500 }
    );
  }
}