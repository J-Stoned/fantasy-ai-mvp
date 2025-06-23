import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Check environment
    const dbUrl = process.env.DATABASE_URL;
    const isSupabase = dbUrl?.includes('supabase.co') || dbUrl?.includes('supabase.com');
    const isSQLite = dbUrl?.includes('file:') || dbUrl?.includes('.db');
    
    // Try to count players
    let playerCount = 0;
    let error = null;
    
    try {
      playerCount = await prisma.player.count();
    } catch (e) {
      error = e instanceof Error ? e.message : 'Unknown error';
    }
    
    return NextResponse.json({
      success: !error,
      database: {
        type: isSupabase ? 'Supabase PostgreSQL' : isSQLite ? 'SQLite' : 'Unknown',
        urlPrefix: dbUrl ? dbUrl.substring(0, 30) + '...' : 'Not set',
        isConfigured: !!dbUrl,
        isSupabase,
        isSQLite
      },
      data: {
        playerCount,
        error
      },
      env: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL: process.env.VERCEL,
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}