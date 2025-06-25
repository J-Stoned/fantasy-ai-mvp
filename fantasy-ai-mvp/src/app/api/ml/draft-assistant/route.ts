import { NextRequest, NextResponse } from 'next/server';
import { draftAssistant } from '@/lib/ml/models/draft-assistant';

export async function POST(req: NextRequest) {
  try {
    const { context, draftedPlayers, availablePlayers, myRoster } = await req.json();
    
    // Validate required fields
    if (!context || !draftedPlayers || !availablePlayers || !myRoster) {
      return NextResponse.json(
        { error: 'context, draftedPlayers, availablePlayers, and myRoster are required' },
        { status: 400 }
      );
    }
    
    // Validate context
    if (!context.round || !context.pick || !context.draftPosition) {
      return NextResponse.json(
        { error: 'context must include round, pick, and draftPosition' },
        { status: 400 }
      );
    }
    
    // Initialize model if needed
    await draftAssistant.initialize();
    
    // Get recommendations
    const recommendations = await draftAssistant.recommendPick(
      context,
      draftedPlayers,
      availablePlayers,
      myRoster
    );
    
    return NextResponse.json({
      success: true,
      context: {
        round: context.round,
        pick: context.pick,
        draftPosition: context.draftPosition
      },
      recommendations: recommendations.map(rec => ({
        player: {
          name: rec.player.name,
          position: rec.player.position,
          team: rec.player.team,
          adp: rec.player.adp
        },
        score: rec.score,
        confidence: rec.confidence,
        reasoning: rec.reasoning,
        alternates: rec.alternates
      })),
      rosterStatus: {
        currentPlayers: myRoster.length,
        positionsFilled: myRoster.reduce((acc, p) => {
          acc[p.position] = (acc[p.position] || 0) + 1;
          return acc;
        }, {})
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Draft assistant error:', error);
    return NextResponse.json(
      { error: 'Failed to get draft recommendations' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: 'Draft Assistant',
    description: 'LSTM-based draft recommendations considering team needs and player values',
    architecture: 'LSTM + Dense Neural Networks',
    requiredFields: {
      context: {
        round: 'Current round number',
        pick: 'Overall pick number',
        draftPosition: 'Your draft position (1-12)',
        totalTeams: 'Number of teams in draft',
        scoringFormat: 'STANDARD, PPR, or HALF_PPR',
        rosterRequirements: 'Position requirements (e.g., {QB: 1, RB: 2, WR: 3})'
      },
      draftedPlayers: 'Array of all drafted players',
      availablePlayers: 'Array of available players to draft',
      myRoster: 'Array of players already on your team'
    },
    playerFields: {
      required: ['id', 'name', 'position', 'team', 'adp', 'projectedPoints'],
      optional: ['tier', 'upside', 'consistency', 'injury', 'bye']
    },
    features: [
      'LSTM for draft sequence understanding',
      'Position need analysis',
      'ADP value calculation',
      'Bye week distribution',
      'Team stacking opportunities'
    ],
    exampleRequest: {
      context: {
        round: 5,
        pick: 53,
        draftPosition: 5,
        totalTeams: 12,
        scoringFormat: 'PPR',
        rosterRequirements: { QB: 1, RB: 2, WR: 3, TE: 1, FLEX: 1 }
      },
      draftedPlayers: [
        { id: '1', name: 'Christian McCaffrey', position: 'RB', team: 'SF', adp: 1, round: 1, pick: 1 }
      ],
      myRoster: [
        { id: '1', name: 'Christian McCaffrey', position: 'RB', team: 'SF', adp: 1, round: 1, pick: 5, bye: 9 }
      ],
      availablePlayers: [
        { id: '5', name: 'Mark Andrews', position: 'TE', team: 'BAL', adp: 45, projectedPoints: 180, tier: 1 }
      ]
    }
  });
}