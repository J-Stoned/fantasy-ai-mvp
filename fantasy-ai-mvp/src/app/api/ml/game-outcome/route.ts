import { NextRequest, NextResponse } from 'next/server';
import { gameOutcomePredictor } from '@/lib/ml/models/game-outcome-predictor';

export async function POST(req: NextRequest) {
  try {
    const { context, players } = await req.json();
    
    if (!context) {
      return NextResponse.json(
        { error: 'Game context is required' },
        { status: 400 }
      );
    }
    
    // Validate teams
    if (!context.homeTeam || !context.awayTeam) {
      return NextResponse.json(
        { error: 'homeTeam and awayTeam are required in context' },
        { status: 400 }
      );
    }
    
    // Initialize model if needed
    await gameOutcomePredictor.initialize();
    
    // Predict game outcome
    const prediction = await gameOutcomePredictor.predictGame(context, players);
    
    return NextResponse.json({
      success: true,
      game: {
        matchup: `${context.awayTeam.abbreviation} @ ${context.homeTeam.abbreviation}`,
        venue: context.venue,
        week: context.weekNumber,
        primetime: context.primetime,
        divisional: context.divisional
      },
      prediction: {
        winner: prediction.winner,
        confidence: prediction.confidence,
        scores: {
          home: prediction.homeScore,
          away: prediction.awayScore,
          total: prediction.totalPoints,
          spread: prediction.spread
        },
        factors: prediction.factors,
        playerImpacts: prediction.playerImpacts
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Game outcome prediction error:', error);
    return NextResponse.json(
      { error: 'Failed to predict game outcome' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: 'Game Outcome Predictor',
    description: 'Predicts game outcomes, scores, and player impacts using 3 specialized models',
    models: [
      'Outcome Model: Win/Loss prediction (68.8% accuracy)',
      'Score Model: Point predictions (±3.64 points MAE)',
      'Player Impact Model: Performance changes (±2.28% MAE)'
    ],
    requiredFields: {
      context: {
        homeTeam: 'Home team stats object',
        awayTeam: 'Away team stats object',
        weekNumber: 'Week of season (1-18)',
        season: 'Year (e.g., 2024)'
      }
    },
    optionalFields: {
      venue: 'Stadium name',
      weather: '{ temperature, wind, precipitation, dome }',
      primetime: 'Boolean for primetime game',
      divisional: 'Boolean for divisional matchup',
      players: 'Array of players to predict impacts for'
    },
    teamObject: {
      required: [
        'teamId', 'name', 'abbreviation',
        'offensiveRating', 'defensiveRating', 'pace',
        'homeRecord/awayRecord', 'lastGameResult', 'restDays',
        'injuries', 'form'
      ]
    },
    exampleRequest: {
      context: {
        gameId: 'kc-vs-buf-wk11',
        homeTeam: {
          teamId: '1',
          name: 'Kansas City Chiefs',
          abbreviation: 'KC',
          offensiveRating: 28.5,
          defensiveRating: 21.2,
          pace: 65.3,
          homeRecord: '7-1',
          awayRecord: '4-3',
          lastGameResult: 'W',
          restDays: 7,
          injuries: 1,
          form: 0.85
        },
        awayTeam: {
          teamId: '2',
          name: 'Buffalo Bills',
          abbreviation: 'BUF',
          offensiveRating: 27.8,
          defensiveRating: 19.5,
          pace: 68.1,
          homeRecord: '6-2',
          awayRecord: '5-2',
          lastGameResult: 'W',
          restDays: 4,
          injuries: 2,
          form: 0.75
        },
        venue: 'Arrowhead Stadium',
        weather: { temperature: 42, wind: 15, precipitation: 0, dome: false },
        primetime: true,
        divisional: false,
        weekNumber: 11,
        season: 2024
      },
      players: [
        { id: '1', name: 'Patrick Mahomes', team: 'KC', position: 'QB', averagePoints: 24.5 }
      ]
    }
  });
}