import { NextRequest, NextResponse } from 'next/server';
import { tradeAnalyzer } from '@/lib/ml/models/trade-analyzer';

export async function POST(req: NextRequest) {
  try {
    const { teamAGiving, teamBGiving, teamAContext, teamBContext } = await req.json();
    
    if (!teamAGiving || !teamBGiving) {
      return NextResponse.json(
        { error: 'teamAGiving and teamBGiving are required' },
        { status: 400 }
      );
    }
    
    if (!Array.isArray(teamAGiving) || !Array.isArray(teamBGiving)) {
      return NextResponse.json(
        { error: 'teamAGiving and teamBGiving must be arrays of players' },
        { status: 400 }
      );
    }
    
    // Initialize model if needed
    await tradeAnalyzer.initialize();
    
    // Analyze trade
    const analysis = await tradeAnalyzer.analyzeTrade(
      teamAGiving,
      teamBGiving,
      teamAContext,
      teamBContext
    );
    
    return NextResponse.json({
      success: true,
      trade: {
        teamAGiving: teamAGiving.map(p => ({ name: p.name, position: p.position })),
        teamBGiving: teamBGiving.map(p => ({ name: p.name, position: p.position }))
      },
      analysis: {
        fairnessScore: analysis.fairnessScore,
        recommendation: analysis.recommendation,
        teamAGain: analysis.teamAGain,
        teamBGain: analysis.teamBGain,
        confidence: analysis.confidenceLevel,
        factors: analysis.factors,
        reasoning: analysis.reasoning
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Trade analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze trade' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: 'Trade Analyzer',
    description: 'Analyzes trade fairness using 3-model ensemble',
    models: [
      'Value Model: Player trade values',
      'Impact Model: Team impact assessment',
      'Fairness Model: Trade balance evaluation'
    ],
    requiredFields: {
      teamAGiving: 'Array of players Team A is trading away',
      teamBGiving: 'Array of players Team B is trading away'
    },
    optionalFields: {
      teamAContext: 'Team A context (record, playoff position, needs)',
      teamBContext: 'Team B context (record, playoff position, needs)'
    },
    playerObject: {
      required: ['id', 'name', 'position', 'team', 'currentPoints', 'projectedPoints'],
      optional: ['consistency', 'upside', 'injury', 'scheduleStrength', 'tradeValue']
    },
    exampleRequest: {
      teamAGiving: [{
        id: '1',
        name: 'Saquon Barkley',
        position: 'RB',
        team: 'PHI',
        currentPoints: 18.5,
        projectedPoints: 17.2,
        consistency: 0.75,
        upside: 0.85,
        injury: 0.2,
        scheduleStrength: 0.6,
        tradeValue: 75
      }],
      teamBGiving: [{
        id: '2',
        name: 'Chris Olave',
        position: 'WR',
        team: 'NO',
        currentPoints: 14.2,
        projectedPoints: 13.8
      }]
    }
  });
}