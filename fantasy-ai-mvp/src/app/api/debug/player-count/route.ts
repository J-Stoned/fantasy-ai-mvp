import { NextResponse } from 'next/server'
import { getProductionPrisma } from '@/lib/db-production'

export async function GET() {
  let prisma;
  
  try {
    // Get production-ready Prisma instance
    prisma = await getProductionPrisma()
    
    // Count total players
    const totalPlayers = await prisma.player.count()
    
    // Count by position
    const playersByPosition = await prisma.player.groupBy({
      by: ['position'],
      _count: true,
      orderBy: {
        _count: {
          position: 'desc'
        }
      }
    })
    
    // Get database URL info (without exposing sensitive info)
    const dbUrl = process.env.DATABASE_URL || 'not set'
    const dbType = dbUrl.includes('file:') ? 'SQLite' : 
                   dbUrl.includes('postgresql') ? 'PostgreSQL' :
                   dbUrl.includes('mysql') ? 'MySQL' : 'Unknown'
    
    return NextResponse.json({
      success: true,
      totalPlayers,
      playersByPosition: playersByPosition.map(p => ({
        position: p.position,
        count: p._count
      })),
      database: {
        type: dbType,
        isConfigured: !!process.env.DATABASE_URL
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error counting players:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      database: {
        type: 'Unknown',
        isConfigured: !!process.env.DATABASE_URL
      }
    }, { status: 500 })
  } finally {
    // Don't disconnect in production as we're reusing the connection
    if (prisma && process.env.NODE_ENV !== 'production') {
      await prisma.$disconnect()
    }
  }
}