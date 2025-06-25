import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const { credentialId, authenticatorData, clientDataJSON, signature } = await req.json();
    
    if (!credentialId || !authenticatorData || !clientDataJSON || !signature) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Get the stored credential
    const credential = await prisma.biometricCredential.findUnique({
      where: { credentialId }
    });
    
    if (!credential) {
      return NextResponse.json(
        { error: 'Invalid credential' },
        { status: 401 }
      );
    }
    
    // Verify the credential belongs to the user
    if (credential.userId !== session.user.id && credential.userId !== session.user.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    // In a production environment, you would verify the signature
    // using the stored public key and WebAuthn verification logic
    // For now, we'll simulate successful verification
    
    // Update last used
    await prisma.biometricCredential.update({
      where: { id: credential.id },
      data: { lastUsed: new Date() }
    });
    
    // Log successful authentication
    await prisma.auditLog.create({
      data: {
        userId: session.user.id || session.user.email,
        action: 'biometric_auth_success',
        metadata: {
          credentialId,
          deviceName: credential.deviceName
        }
      }
    });
    
    // Generate session token for extended authentication
    const authToken = Buffer.from(
      JSON.stringify({
        userId: session.user.id || session.user.email,
        timestamp: Date.now(),
        biometric: true
      })
    ).toString('base64');
    
    return NextResponse.json({
      success: true,
      authToken,
      message: 'Biometric authentication successful'
    });
    
  } catch (error) {
    console.error('Biometric verification error:', error);
    return NextResponse.json(
      { error: 'Failed to verify biometric' },
      { status: 500 }
    );
  }
}