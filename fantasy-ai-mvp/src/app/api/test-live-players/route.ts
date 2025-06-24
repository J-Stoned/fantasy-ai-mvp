import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Get player count
    const playerCount = await prisma.player.count();
    
    // Get sample players with different positions
    const samplePlayers = await prisma.player.findMany({
      take: 20,
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        position: true,
        team: true,
        stats: true,
        projections: true,
        injuryStatus: true,
        imageUrl: true,
        leagueId: true
      }
    });
    
    // Get position breakdown
    const positionCounts = await prisma.player.groupBy({
      by: ['position'],
      _count: true,
      orderBy: {
        _count: {
          position: 'desc'
        }
      },
      take: 10
    });
    
    return NextResponse.json({
      success: true,
      playerCount,
      samplePlayers,
      positionBreakdown: positionCounts.map(p => ({
        position: p.position,
        count: p._count
      })),
      message: `Database has ${playerCount.toLocaleString()} players!`
    });
  } catch (error) {
    console.error('Error fetching live players:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        playerCount: 0,
        samplePlayers: [],
        positionBreakdown: []
      },
      { status: 500 }
    );
  }
}