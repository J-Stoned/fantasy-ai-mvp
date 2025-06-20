"use client";

import { VoiceAnalyticsIntelligence } from '../voice-analytics-intelligence';

export interface VoiceSettings {
  voiceId: string;
  stability: number;
  similarityBoost: number;
  style: number;
  speakerBoost: boolean;
}

export interface VoiceCloneSettings {
  name: string;
  description: string;
  files: File[];
}

export interface AudioAnalysis {
  duration: number;
  confidence: number;
  emotion: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  keywords: string[];
}

export class VoiceService {
  private analytics: VoiceAnalyticsIntelligence;
  private apiKey: string | null = null;
  private baseUrl = 'https://api.elevenlabs.io/v1';

  constructor() {
    this.analytics = new VoiceAnalyticsIntelligence();
    // API key should be set via environment or user input
    this.apiKey = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || null;
  }

  // Text-to-Speech with Fantasy Sports Context
  async synthesizeSpeech(
    text: string, 
    voiceId: string = 'voice_sports_commentator',
    settings?: Partial<VoiceSettings>
  ): Promise<AudioBuffer | null> {
    if (!this.apiKey) {
      console.warn('ElevenLabs API key not configured');
      return null;
    }

    try {
      // Enhance text with sports context
      const enhancedText = this.enhanceTextForSports(text);
      
      const defaultSettings: VoiceSettings = {
        voiceId,
        stability: 0.75,
        similarityBoost: 0.85,
        style: 0.8,
        speakerBoost: true,
        ...settings
      };

      const response = await fetch(`${this.baseUrl}/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': this.apiKey
        },
        body: JSON.stringify({
          text: enhancedText,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: defaultSettings.stability,
            similarity_boost: defaultSettings.similarityBoost,
            style: defaultSettings.style,
            use_speaker_boost: defaultSettings.speakerBoost
          }
        })
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.status}`);
      }

      const audioData = await response.arrayBuffer();
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      return await audioContext.decodeAudioData(audioData);
    } catch (error) {
      console.error('Speech synthesis failed:', error);
      return null;
    }
  }

  // Clone voice for personalized fantasy assistant
  async cloneVoice(settings: VoiceCloneSettings): Promise<string | null> {
    if (!this.apiKey) {
      console.warn('ElevenLabs API key not configured');
      return null;
    }

    try {
      const formData = new FormData();
      formData.append('name', settings.name);
      formData.append('description', settings.description);
      
      settings.files.forEach((file, index) => {
        formData.append(`files`, file);
      });

      const response = await fetch(`${this.baseUrl}/voices/add`, {
        method: 'POST',
        headers: {
          'xi-api-key': this.apiKey
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Voice cloning failed: ${response.status}`);
      }

      const result = await response.json();
      return result.voice_id;
    } catch (error) {
      console.error('Voice cloning failed:', error);
      return null;
    }
  }

  // Generate fantasy-specific audio content
  async generateFantasyAnnouncement(
    type: 'lineup' | 'trade' | 'score_update' | 'injury_alert' | 'waiver_claim',
    data: any,
    voiceId: string = 'voice_sports_commentator'
  ): Promise<AudioBuffer | null> {
    const text = this.generateAnnouncementText(type, data);
    return await this.synthesizeSpeech(text, voiceId);
  }

  // Analyze user voice commands for fantasy actions
  async analyzeVoiceCommand(audioBuffer: ArrayBuffer): Promise<AudioAnalysis | null> {
    try {
      // Use existing voice analytics for command analysis
      const analysis = await this.analytics.analyzeVoiceInteraction(
        audioBuffer, 
        '', // transcript - would be filled by speech recognition
        'user-123', // userId
        'session-123', // sessionId
        { source: 'fantasy_command' } // context
      );
      
      return {
        duration: 3.0, // Default duration estimate for voice commands
        confidence: analysis.satisfactionLevel / 100 || 0.8,
        emotion: this.extractPrimaryEmotion(analysis.emotionalState),
        sentiment: this.determineSentiment(analysis),
        keywords: this.extractFantasyKeywords('')
      };
    } catch (error) {
      console.error('Voice command analysis failed:', error);
      return null;
    }
  }

  // Generate voice-powered lineup recommendations
  async generateVoiceLineupAdvice(
    players: any[],
    matchups: any[],
    voiceId: string = 'voice_fantasy_expert'
  ): Promise<AudioBuffer | null> {
    const advice = this.generateLineupAdviceText(players, matchups);
    return await this.synthesizeSpeech(advice, voiceId, {
      style: 0.9, // More expressive for advice
      stability: 0.8
    });
  }

  // Create epic fantasy intro/outro audio
  async generateEpicIntro(
    leagueName: string,
    weekNumber: number,
    voiceId: string = 'voice_epic_announcer'
  ): Promise<AudioBuffer | null> {
    const introText = `Welcome to ${leagueName}, Week ${weekNumber}! 
    The battle for fantasy supremacy continues! 
    Who will rise to glory, and who will face the agony of defeat? 
    Let the fantasy games begin!`;

    return await this.synthesizeSpeech(introText, voiceId, {
      style: 1.0, // Maximum drama
      stability: 0.7,
      similarityBoost: 0.9
    });
  }

  // Private helper methods
  private enhanceTextForSports(text: string): string {
    // Add SSML-like enhancements for sports commentary
    return text
      .replace(/(\d+)\s*points?/gi, '<emphasis level="strong">$1 points</emphasis>')
      .replace(/touchdown|TD/gi, '<emphasis level="strong">TOUCHDOWN</emphasis>')
      .replace(/quarterback|QB/gi, 'quarterback')
      .replace(/running back|RB/gi, 'running back')
      .replace(/wide receiver|WR/gi, 'wide receiver')
      .replace(/tight end|TE/gi, 'tight end');
  }

  private generateAnnouncementText(type: string, data: any): string {
    switch (type) {
      case 'lineup':
        return `Your optimal lineup is set! Starting ${data.players?.join(', ')}. Good luck this week!`;
      case 'trade':
        return `Trade alert! ${data.player1} has been traded for ${data.player2}. Analyzing impact...`;
      case 'score_update':
        return `Score update! ${data.player} just scored ${data.points} points. Your total is now ${data.total}!`;
      case 'injury_alert':
        return `Injury alert! ${data.player} is listed as ${data.status}. Consider backup options.`;
      case 'waiver_claim':
        return `Waiver wire success! You've claimed ${data.player}. Welcome to the team!`;
      default:
        return 'Fantasy update available.';
    }
  }

  private extractPrimaryEmotion(emotionalState: any): string {
    if (!emotionalState?.primaryEmotions) return 'neutral';
    
    const emotions = emotionalState.primaryEmotions;
    const maxEmotion = Object.entries(emotions).reduce((max, [emotion, score]) => 
      (score as number) > max.score ? { emotion, score: score as number } : max,
      { emotion: 'neutral', score: 0 }
    );
    
    return maxEmotion.emotion;
  }

  private determineSentiment(analysis: any): 'positive' | 'negative' | 'neutral' {
    const emotion = this.extractPrimaryEmotion(analysis.emotionalState).toLowerCase();
    if (['happy', 'excited', 'confident', 'joy'].includes(emotion)) return 'positive';
    if (['angry', 'frustrated', 'disappointed', 'anger'].includes(emotion)) return 'negative';
    return 'neutral';
  }

  private extractFantasyKeywords(text: string): string[] {
    const fantasyKeywords = [
      'lineup', 'trade', 'waiver', 'draft', 'bench', 'start', 'sit',
      'quarterback', 'running back', 'wide receiver', 'tight end', 'defense',
      'kicker', 'points', 'touchdown', 'yards', 'reception', 'carry',
      'injury', 'questionable', 'doubtful', 'out', 'bye week'
    ];

    const words = text.toLowerCase().split(/\s+/);
    return words.filter(word => fantasyKeywords.includes(word));
  }

  private generateLineupAdviceText(players: any[], matchups: any[]): string {
    const topPlayer = players[0];
    const riskyPlayer = players.find(p => p.risk === 'high');

    let advice = `Here's your lineup analysis for this week. `;
    
    if (topPlayer) {
      advice += `Your strongest play is ${topPlayer.name} with a projected ${topPlayer.points} points. `;
    }
    
    if (riskyPlayer) {
      advice += `Watch out for ${riskyPlayer.name} - there's some risk there due to ${riskyPlayer.riskReason}. `;
    }
    
    advice += `Overall, you're looking good for this matchup. Trust your instincts and may the fantasy gods smile upon you!`;
    
    return advice;
  }

  // Voice assistant wake word detection
  async startWakeWordDetection(callback: (command: string) => void): Promise<void> {
    // This would integrate with browser's speech recognition
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('Speech recognition not supported');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase();
      
      if (transcript.includes('hey fantasy') || transcript.includes('fantasy ai')) {
        const command = transcript.replace(/hey fantasy|fantasy ai/g, '').trim();
        callback(command);
      }
    };

    recognition.start();
  }
}

export default VoiceService;