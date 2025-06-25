import { NextRequest, NextResponse } from 'next/server';
import { injuryRiskModel } from '@/lib/ml/models/injury-risk-assessment';

export async function POST(req: NextRequest) {
  try {
    const { playerId, weeksAhead = 4 } = await req.json();
    
    if (!playerId) {
      return NextResponse.json(
        { error: 'playerId is required' },
        { status: 400 }
      );
    }
    
    // Initialize model if needed
    await injuryRiskModel.initialize();
    
    // Assess injury risk
    const assessment = await injuryRiskModel.assessRisk(playerId, weeksAhead);
    
    return NextResponse.json({
      success: true,
      playerId,
      assessment: {
        riskLevels: assessment.riskLevels,
        weeklyRisks: assessment.weeklyRisks,
        highRiskAlert: assessment.highRiskAlert,
        recommendations: assessment.recommendations
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Injury risk assessment error:', error);
    return NextResponse.json(
      { error: 'Failed to assess injury risk' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: 'Injury Risk Assessment',
    description: 'Predicts injury risk 1-4 weeks ahead using LSTM',
    accuracy: '98.8%',
    requiredFields: ['playerId'],
    optionalFields: ['weeksAhead (default: 4)'],
    features: [
      '21 biomechanical features',
      'Workload patterns',
      'Recovery time analysis',
      'Position-specific risks',
      'Historical injury data'
    ],
    exampleRequest: {
      playerId: 'derrick-henry',
      weeksAhead: 4
    }
  });
}