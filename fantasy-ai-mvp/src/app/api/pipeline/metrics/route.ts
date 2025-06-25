import { NextRequest, NextResponse } from 'next/server';
import { pipelineMonitor } from '@/lib/live-data-pipeline/pipeline-monitor';
import { realTimeSportsCollector } from '@/lib/live-data-pipeline/real-time-sports-collector';

export async function GET(request: NextRequest) {
  try {
    // Get pipeline status
    const pipelineStatus = realTimeSportsCollector.getStatus();
    
    // Get metrics
    const metrics = pipelineMonitor.getMetrics();
    
    // Get health status
    const health = await pipelineMonitor.getHealth();
    
    // Get source performance
    const sourcePerformance = pipelineMonitor.getSourcePerformance();
    
    // Transform sources data
    const sources = pipelineStatus.sources.map(source => {
      const perf = sourcePerformance.find(p => p.source === source.id);
      return {
        id: source.id,
        name: source.name,
        enabled: source.enabled,
        active: source.active,
        successRate: perf?.successRate || 0,
        recordsCollected: perf?.totalRequests || 0,
        lastUpdate: new Date()
      };
    });
    
    return NextResponse.json({
      metrics: {
        uptime: metrics.uptime,
        totalRequests: metrics.totalRequests,
        successfulRequests: metrics.successfulRequests,
        failedRequests: metrics.failedRequests,
        averageLatency: metrics.averageLatency,
        dataProcessed: metrics.dataProcessed,
        errorsPerMinute: metrics.errorsPerMinute,
        lastError: metrics.lastError
      },
      sources,
      health: health.status,
      pipelineRunning: pipelineStatus.isRunning,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error fetching pipeline metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pipeline metrics' },
      { status: 500 }
    );
  }
}

// WebSocket endpoint for real-time updates (would be implemented separately)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (body.action === 'start') {
      await realTimeSportsCollector.start();
      return NextResponse.json({ success: true, message: 'Pipeline started' });
    } else if (body.action === 'stop') {
      await realTimeSportsCollector.stop();
      return NextResponse.json({ success: true, message: 'Pipeline stopped' });
    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error controlling pipeline:', error);
    return NextResponse.json(
      { error: 'Failed to control pipeline' },
      { status: 500 }
    );
  }
}