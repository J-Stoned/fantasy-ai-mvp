import { NextRequest, NextResponse } from 'next/server';
import { voiceAssistantService } from '@/lib/voice-assistant-service';
import { elevenLabsIntegration } from '@/lib/voice/elevenlabs-integration';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { command, userId, voiceProfile = 'fantasy_ai', emotionalContext } = body;

    if (!command) {
      return NextResponse.json(
        { error: 'Command is required' },
        { status: 400 }
      );
    }

    // Process the voice command
    const response = await voiceAssistantService.processVoiceCommand(
      command,
      userId || 'anonymous'
    );

    // Generate speech if requested
    let audioData = null;
    if (body.generateSpeech !== false) {
      try {
        const { audioUrl } = await elevenLabsIntegration.generateSpeech(
          response.text,
          voiceProfile,
          emotionalContext
        );
        audioData = { audioUrl };
      } catch (error) {
        console.error('Speech generation error:', error);
        // Continue without audio if generation fails
      }
    }

    return NextResponse.json({
      success: true,
      response: {
        ...response,
        audio: audioData
      },
      metadata: {
        voiceProfile,
        processedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Voice processing error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process voice command',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Handle preflight requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}