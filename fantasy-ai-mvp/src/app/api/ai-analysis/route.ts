/**
 * 🤖 AI ANALYSIS API - Process Players with 7 AI Models + REAL Data
 * Mission: "Either we know it or we don't... yet!"
 */

import { NextRequest, NextResponse } from 'next/server';
import { realDataAIProcessor } from '@/lib/ai/real-data-ai-processor';

export async function POST(req: NextRequest) {
  try {
    const { playerId, playerName } = await req.json();

    if (!playerId) {
      return NextResponse.json({
        error: 'Player ID required',
        missionStatement: "Either we know it or we don't... yet!"
      }, { status: 400 });
    }

    console.log(`🤖 STARTING AI ANALYSIS FOR PLAYER: ${playerId}`);
    
    // 🔥 PROCESS WITH ALL 7 AI MODELS + REAL DATA
    const aiResult = await realDataAIProcessor.processPlayerWithRealData(playerId);
    
    return NextResponse.json({
      success: true,
      message: `🎯 AI Analysis Complete for ${aiResult.playerName}`,
      analysis: aiResult,
      summary: {
        action: aiResult.overallRecommendation.action,
        confidence: aiResult.overallRecommendation.confidence,
        dataPoints: aiResult.overallRecommendation.dataPoints,
        modelsUsed: 7,
        dataSource: 'real_database_mcp'
      }
    });

  } catch (error) {
    console.error('AI analysis failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'AI analysis failed',
      message: error instanceof Error ? error.message : String(error),
      missionStatement: "Either we know it or we don't... yet!"
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const playerId = searchParams.get('playerId');

  if (playerId) {
    // Return cached analysis if available
    return NextResponse.json({
      message: 'Use POST method to trigger new AI analysis',
      playerId,
      missionStatement: "Either we know it or we don't... yet!"
    });
  }

  return NextResponse.json({
    endpoint: '/api/ai-analysis',
    method: 'POST',
    description: 'Process player with 7 specialized AI models using real database data',
    aiModels: [
      '🎙️ Voice Analytics Intelligence',
      '👁️ Computer Vision Analysis', 
      '💓 Biometric Intelligence',
      '🐦 Social Intelligence',
      '📈 Momentum Detection',
      '🌪️ Chaos Theory Analysis',
      '🔮 Predictive Feedback'
    ],
    dataSource: 'real_database_mcp',
    missionStatement: "Either we know it or we don't... yet!",
    parameters: {
      playerId: 'required - Player ID to analyze',
      playerName: 'optional - Player name for context'
    }
  });
}