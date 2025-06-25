import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { mlOrchestrator } from '@/lib/ml/ml-orchestrator';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { model, data, modelType } = await req.json();
    
    // Support both old API (model) and new API (modelType)
    const type = modelType || model;
    
    if (!type || !data) {
      return NextResponse.json(
        { error: 'Model type and data are required' },
        { status: 400 }
      );
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Make prediction
    const result = await mlOrchestrator.predict(type, data);
    
    // Store prediction in database
    const mlPrediction = await prisma.mLPrediction.create({
      data: {
        userId: user.id,
        modelType: type,
        inputData: data,
        prediction: result,
        confidence: result.confidence || 0.85,
        metadata: {
          timestamp: new Date(),
          modelVersion: '1.0.0',
          features: Object.keys(data)
        }
      }
    });
    
    return NextResponse.json({
      success: true,
      id: mlPrediction.id,
      model: type,
      modelType: type,
      prediction: result,
      confidence: mlPrediction.confidence,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('ML prediction error:', error);
    return NextResponse.json(
      { error: 'Failed to make prediction' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const modelType = searchParams.get('modelType');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // If requesting history
    if (searchParams.has('history')) {
      const predictions = await prisma.mLPrediction.findMany({
        where: {
          userId: user.id,
          ...(modelType && { modelType })
        },
        orderBy: { createdAt: 'desc' },
        take: limit
      });

      return NextResponse.json({
        predictions,
        stats: {
          total: predictions.length,
          averageConfidence: predictions.reduce((acc, p) => acc + p.confidence, 0) / predictions.length || 0
        }
      });
    }
    
    // Get system status
    const status = await mlOrchestrator.getSystemStatus();
    
    return NextResponse.json({
      success: true,
      status,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('ML status error:', error);
    return NextResponse.json(
      { error: 'Failed to get ML status' },
      { status: 500 }
    );
  }
}