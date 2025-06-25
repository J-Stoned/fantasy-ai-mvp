import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const { pin } = await req.json();
    
    if (!pin || pin.length < 4) {
      return NextResponse.json(
        { error: 'Invalid PIN' },
        { status: 400 }
      );
    }
    
    // Get user's stored PIN
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { 
        id: true,
        pinHash: true,
        failedPinAttempts: true,
        pinLockedUntil: true
      }
    });
    
    if (!user || !user.pinHash) {
      return NextResponse.json(
        { error: 'PIN not set up' },
        { status: 400 }
      );
    }
    
    // Check if account is locked
    if (user.pinLockedUntil && user.pinLockedUntil > new Date()) {
      const minutesLeft = Math.ceil(
        (user.pinLockedUntil.getTime() - Date.now()) / 60000
      );
      return NextResponse.json(
        { error: `Account locked. Try again in ${minutesLeft} minutes.` },
        { status: 429 }
      );
    }
    
    // Verify PIN
    const isValid = await bcrypt.compare(pin, user.pinHash);
    
    if (!isValid) {
      // Increment failed attempts
      const failedAttempts = (user.failedPinAttempts || 0) + 1;
      const updateData: any = { failedPinAttempts: failedAttempts };
      
      // Lock account after 5 failed attempts
      if (failedAttempts >= 5) {
        updateData.pinLockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
      }
      
      await prisma.user.update({
        where: { id: user.id },
        data: updateData
      });
      
      return NextResponse.json(
        { error: 'Invalid PIN', attemptsLeft: 5 - failedAttempts },
        { status: 401 }
      );
    }
    
    // Reset failed attempts on success
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedPinAttempts: 0,
        pinLockedUntil: null
      }
    });
    
    // Log successful authentication
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'pin_auth_success',
        metadata: {}
      }
    });
    
    // Generate auth token
    const authToken = Buffer.from(
      JSON.stringify({
        userId: user.id,
        timestamp: Date.now(),
        pin: true
      })
    ).toString('base64');
    
    return NextResponse.json({
      success: true,
      authToken,
      message: 'PIN verification successful'
    });
    
  } catch (error) {
    console.error('PIN verification error:', error);
    return NextResponse.json(
      { error: 'Failed to verify PIN' },
      { status: 500 }
    );
  }
}

// Set or update PIN
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const { newPin, currentPin } = await req.json();
    
    if (!newPin || newPin.length < 4 || newPin.length > 6) {
      return NextResponse.json(
        { error: 'PIN must be 4-6 digits' },
        { status: 400 }
      );
    }
    
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, pinHash: true }
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // If user has existing PIN, verify it first
    if (user.pinHash && currentPin) {
      const isValid = await bcrypt.compare(currentPin, user.pinHash);
      if (!isValid) {
        return NextResponse.json(
          { error: 'Current PIN is incorrect' },
          { status: 401 }
        );
      }
    }
    
    // Hash new PIN
    const pinHash = await bcrypt.hash(newPin, 10);
    
    // Update user PIN
    await prisma.user.update({
      where: { id: user.id },
      data: { pinHash }
    });
    
    // Log PIN change
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'pin_changed',
        metadata: {}
      }
    });
    
    return NextResponse.json({
      success: true,
      message: 'PIN updated successfully'
    });
    
  } catch (error) {
    console.error('PIN update error:', error);
    return NextResponse.json(
      { error: 'Failed to update PIN' },
      { status: 500 }
    );
  }
}