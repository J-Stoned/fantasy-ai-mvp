import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const startTime = Date.now();
  
  try {
    console.log('🏥 Health check started');
    console.log('Environment:', process.env.NODE_ENV);
    console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
    console.log('VERCEL env:', process.env.VERCEL);
    
    // Test database connection
    const dbStartTime = Date.now();
    const playerCount = await prisma.player.count();
    const dbResponseTime = Date.now() - dbStartTime;
    
    console.log('✅ Database connected successfully');
    console.log(`📊 Players in database: ${playerCount}`);
    console.log(`⚡ Database response time: ${dbResponseTime}ms`);
    
    // Get sample player to verify data
    const samplePlayer = await prisma.player.findFirst({
      include: {
        League: true,
      },
      orderBy: {
        name: 'asc'
      }
    });
    
    const totalResponseTime = Date.now() - startTime;
    
    return NextResponse.json({
      status: 'healthy',
      environment: process.env.NODE_ENV,
      database: {
        connected: true,
        playerCount,
        responseTime: `${dbResponseTime}ms`,
        samplePlayer: samplePlayer ? {
          name: samplePlayer.name,
          team: samplePlayer.team,
          position: samplePlayer.position,
          league: samplePlayer.League?.name
        } : null
      },
      build: {
        nodeVersion: process.version,
        vercel: !!process.env.VERCEL,
        hasDatabase: !!process.env.DATABASE_URL,
      },
      performance: {
        totalResponseTime: `${totalResponseTime}ms`,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Health check failed:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const totalResponseTime = Date.now() - startTime;
    
    return NextResponse.json({
      status: 'unhealthy',
      environment: process.env.NODE_ENV,
      database: {
        connected: false,
        error: errorMessage,
        errorType: error?.constructor?.name,
        // Log Prisma-specific errors
        prismaError: error instanceof Error && 'code' in error ? error.code : undefined
      },
      build: {
        nodeVersion: process.version,
        vercel: !!process.env.VERCEL,
        hasDatabase: !!process.env.DATABASE_URL,
      },
      performance: {
        totalResponseTime: `${totalResponseTime}ms`,
        timestamp: new Date().toISOString()
      }
    }, { status: 503 });
  }
}