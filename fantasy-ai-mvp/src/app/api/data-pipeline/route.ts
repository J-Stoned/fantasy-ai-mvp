import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { dataPipelineOrchestrator } from '@/lib/data-pipeline/data-pipeline-orchestrator';

// GET: Get pipeline status
export async function GET() {
  try {
    const status = dataPipelineOrchestrator.getPipelineStatus();
    const metrics = await dataPipelineOrchestrator.getMetrics();
    
    return NextResponse.json({
      status,
      metrics,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Get pipeline status error:', error);
    return NextResponse.json(
      { error: 'Failed to get pipeline status' },
      { status: 500 }
    );
  }
}

// POST: Start pipelines
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    
    // In production, would check for admin role
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    const { action, config, pipeline } = await req.json();
    
    switch (action) {
      case 'start':
        await dataPipelineOrchestrator.startAllPipelines(config);
        return NextResponse.json({
          success: true,
          message: 'Data pipelines started successfully',
          status: dataPipelineOrchestrator.getPipelineStatus()
        });
        
      case 'stop':
        await dataPipelineOrchestrator.stopAllPipelines();
        return NextResponse.json({
          success: true,
          message: 'Data pipelines stopped',
          status: dataPipelineOrchestrator.getPipelineStatus()
        });
        
      case 'restart':
        if (pipeline) {
          await dataPipelineOrchestrator.restartPipeline(pipeline);
          return NextResponse.json({
            success: true,
            message: `${pipeline} pipeline restarted`,
            status: dataPipelineOrchestrator.getPipelineStatus()
          });
        } else {
          // Restart all
          await dataPipelineOrchestrator.stopAllPipelines();
          await new Promise(resolve => setTimeout(resolve, 1000)); // Brief pause
          await dataPipelineOrchestrator.startAllPipelines(config);
          return NextResponse.json({
            success: true,
            message: 'All pipelines restarted',
            status: dataPipelineOrchestrator.getPipelineStatus()
          });
        }
        
      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: start, stop, or restart' },
          { status: 400 }
        );
    }
    
  } catch (error) {
    console.error('Pipeline control error:', error);
    return NextResponse.json(
      { error: 'Failed to control pipelines' },
      { status: 500 }
    );
  }
}