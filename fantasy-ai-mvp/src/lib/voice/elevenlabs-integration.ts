/**
 * ELEVENLABS VOICE INTEGRATION
 * Revolutionary voice synthesis with natural speech and expert personas
 * Integrates with ElevenLabs API for ultra-realistic voice generation
 */

export interface ElevenLabsConfig {
  apiKey: string;
  voiceId?: string;
  modelId?: string;
  optimizeStreamingLatency?: number;
  outputFormat?: 'mp3_44100_128' | 'mp3_44100_64' | 'mp3_22050_32' | 'pcm_16000';
}

export interface VoiceSettings {
  stability: number; // 0-1, higher = more consistent
  similarityBoost: number; // 0-1, higher = more like original voice
  style?: number; // 0-1, voice style strength
  useSpeakerBoost?: boolean; // Boost voice clarity
}

export interface ExpertVoiceProfile {
  voiceId: string;
  name: string;
  description: string;
  personality: string;
  settings: VoiceSettings;
  catchphrases: string[];
  speechPatterns: {
    pace: 'slow' | 'normal' | 'fast';
    emphasis: 'minimal' | 'moderate' | 'dramatic';
    pauses: 'short' | 'normal' | 'long';
  };
}

export class ElevenLabsIntegration {
  private apiKey: string;
  private baseUrl = 'https://api.elevenlabs.io/v1';
  private expertVoices: Map<string, ExpertVoiceProfile> = new Map();
  private voiceCache: Map<string, ArrayBuffer> = new Map();

  constructor(config: ElevenLabsConfig) {
    this.apiKey = config.apiKey || process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || '';
    this.initializeExpertVoices();
  }

  private initializeExpertVoices() {
    // Matthew Berry - Enthusiastic Fantasy Expert
    this.expertVoices.set('matthew_berry', {
      voiceId: 'EXAVITQu4vr4xnSDxMaL', // Josh voice as base
      name: 'Matthew Berry',
      description: 'Enthusiastic ESPN fantasy football expert',
      personality: 'energetic, passionate, storytelling',
      settings: {
        stability: 0.75,
        similarityBoost: 0.85,
        style: 0.8,
        useSpeakerBoost: true
      },
      catchphrases: [
        "Love it!",
        "Here's the thing...",
        "Let me tell you why...",
        "Trust me on this one!"
      ],
      speechPatterns: {
        pace: 'fast',
        emphasis: 'dramatic',
        pauses: 'short'
      }
    });

    // Adam Schefter - Insider Authority
    this.expertVoices.set('adam_schefter', {
      voiceId: 'pNInz6obpgDQGcFmaJgB', // Adam voice
      name: 'Adam Schefter',
      description: 'NFL insider with breaking news',
      personality: 'authoritative, professional, insider',
      settings: {
        stability: 0.85,
        similarityBoost: 0.9,
        style: 0.6,
        useSpeakerBoost: true
      },
      catchphrases: [
        "Sources tell me...",
        "Breaking news...",
        "Here's what I'm hearing...",
        "Per league sources..."
      ],
      speechPatterns: {
        pace: 'normal',
        emphasis: 'moderate',
        pauses: 'normal'
      }
    });

    // Sarah Analytics - Data Expert
    this.expertVoices.set('sarah_analytics', {
      voiceId: 'ThT5KcBeYPX3keUQqHPh', // Dorothy voice as base
      name: 'Sarah Analytics',
      description: 'Data-driven fantasy analyst',
      personality: 'analytical, precise, educational',
      settings: {
        stability: 0.9,
        similarityBoost: 0.75,
        style: 0.5,
        useSpeakerBoost: true
      },
      catchphrases: [
        "The numbers show...",
        "Based on the data...",
        "Statistically speaking...",
        "Let's look at the analytics..."
      ],
      speechPatterns: {
        pace: 'normal',
        emphasis: 'minimal',
        pauses: 'long'
      }
    });

    // Fantasy AI Assistant - Default
    this.expertVoices.set('fantasy_ai', {
      voiceId: '21m00Tcm4TlvDq8ikWAM', // Rachel voice
      name: 'Fantasy AI Assistant',
      description: 'Your personal AI fantasy sports assistant',
      personality: 'friendly, helpful, knowledgeable',
      settings: {
        stability: 0.8,
        similarityBoost: 0.8,
        style: 0.7,
        useSpeakerBoost: true
      },
      catchphrases: [
        "I've analyzed the data for you...",
        "Here's my recommendation...",
        "Based on your team's needs...",
        "Let me help you with that..."
      ],
      speechPatterns: {
        pace: 'normal',
        emphasis: 'moderate',
        pauses: 'normal'
      }
    });
  }

  /**
   * Generate speech from text using ElevenLabs API
   */
  async generateSpeech(
    text: string,
    voiceProfile: string = 'fantasy_ai',
    emotionalContext?: {
      emotion?: string;
      intensity?: number;
      urgency?: number;
      frustration?: number;
    }
  ): Promise<{ audioUrl: string; audioBuffer: ArrayBuffer }> {
    try {
      const profile = this.expertVoices.get(voiceProfile) || this.expertVoices.get('fantasy_ai')!;
      
      // Adapt text based on voice profile
      const adaptedText = this.adaptTextForVoice(text, profile, emotionalContext);
      
      // Adjust voice settings based on emotional context
      const adjustedSettings = this.adjustVoiceSettings(profile.settings, emotionalContext);
      
      // Check cache first
      const cacheKey = `${voiceProfile}_${adaptedText}_${JSON.stringify(adjustedSettings)}`;
      if (this.voiceCache.has(cacheKey)) {
        const cachedBuffer = this.voiceCache.get(cacheKey)!;
        return {
          audioUrl: this.createAudioUrl(cachedBuffer),
          audioBuffer: cachedBuffer
        };
      }
      
      // Call ElevenLabs API
      const response = await fetch(`${this.baseUrl}/text-to-speech/${profile.voiceId}`, {
        method: 'POST',
        headers: {
          'xi-api-key': this.apiKey,
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg'
        },
        body: JSON.stringify({
          text: adaptedText,
          model_id: 'eleven_monolingual_v1',
          voice_settings: adjustedSettings
        })
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.status}`);
      }

      const audioBuffer = await response.arrayBuffer();
      
      // Cache the result
      this.voiceCache.set(cacheKey, audioBuffer);
      
      // Clean cache if too large (keep last 100 entries)
      if (this.voiceCache.size > 100) {
        const firstKey = this.voiceCache.keys().next().value;
        this.voiceCache.delete(firstKey);
      }

      return {
        audioUrl: this.createAudioUrl(audioBuffer),
        audioBuffer
      };
    } catch (error) {
      console.error('ElevenLabs speech generation error:', error);
      
      // Fallback to browser TTS if ElevenLabs fails
      return this.fallbackToWebSpeech(text);
    }
  }

  /**
   * Stream speech generation for lower latency
   */
  async streamSpeech(
    text: string,
    voiceProfile: string = 'fantasy_ai',
    onChunk: (chunk: ArrayBuffer) => void
  ): Promise<void> {
    const profile = this.expertVoices.get(voiceProfile) || this.expertVoices.get('fantasy_ai')!;
    
    const response = await fetch(`${this.baseUrl}/text-to-speech/${profile.voiceId}/stream`, {
      method: 'POST',
      headers: {
        'xi-api-key': this.apiKey,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg'
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: profile.settings,
        optimize_streaming_latency: 3
      })
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs streaming error: ${response.status}`);
    }

    const reader = response.body!.getReader();
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      onChunk(value.buffer);
    }
  }

  /**
   * Get available voices from ElevenLabs
   */
  async getAvailableVoices(): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/voices`, {
        headers: {
          'xi-api-key': this.apiKey
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch voices: ${response.status}`);
      }

      const data = await response.json();
      return data.voices;
    } catch (error) {
      console.error('Error fetching voices:', error);
      return [];
    }
  }

  /**
   * Clone a voice from audio samples
   */
  async cloneVoice(
    name: string,
    description: string,
    audioFiles: File[]
  ): Promise<string> {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    
    audioFiles.forEach((file, index) => {
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

    const data = await response.json();
    return data.voice_id;
  }

  /**
   * Adapt text to match voice personality
   */
  private adaptTextForVoice(
    text: string,
    profile: ExpertVoiceProfile,
    emotionalContext?: any
  ): string {
    let adaptedText = text;
    
    // Add catchphrases based on context
    if (Math.random() < 0.3) { // 30% chance to add catchphrase
      const catchphrase = profile.catchphrases[Math.floor(Math.random() * profile.catchphrases.length)];
      adaptedText = `${catchphrase} ${adaptedText}`;
    }
    
    // Adjust for emotional context
    if (emotionalContext?.frustration && emotionalContext.frustration > 60) {
      adaptedText = this.addEmpathyToText(adaptedText);
    }
    
    if (emotionalContext?.urgency && emotionalContext.urgency > 70) {
      adaptedText = this.makeTextMoreConcise(adaptedText);
    }
    
    // Add personality-specific modifications
    switch (profile.name) {
      case 'Matthew Berry':
        adaptedText = this.makeTextMoreEnthusiastic(adaptedText);
        break;
      case 'Adam Schefter':
        adaptedText = this.makeTextMoreAuthoritative(adaptedText);
        break;
      case 'Sarah Analytics':
        adaptedText = this.makeTextMoreAnalytical(adaptedText);
        break;
    }
    
    return adaptedText;
  }

  /**
   * Adjust voice settings based on emotional context
   */
  private adjustVoiceSettings(
    baseSettings: VoiceSettings,
    emotionalContext?: any
  ): VoiceSettings {
    const adjusted = { ...baseSettings };
    
    if (emotionalContext?.frustration && emotionalContext.frustration > 60) {
      adjusted.stability += 0.1; // More stable for frustrated users
      adjusted.similarityBoost -= 0.05; // Slightly less character-specific
    }
    
    if (emotionalContext?.urgency && emotionalContext.urgency > 70) {
      adjusted.stability -= 0.05; // Slightly less stable for urgency
    }
    
    if (emotionalContext?.emotion === 'excitement') {
      adjusted.style = Math.min(1, (adjusted.style || 0.5) + 0.2);
    }
    
    // Ensure values stay within bounds
    adjusted.stability = Math.max(0, Math.min(1, adjusted.stability));
    adjusted.similarityBoost = Math.max(0, Math.min(1, adjusted.similarityBoost));
    if (adjusted.style !== undefined) {
      adjusted.style = Math.max(0, Math.min(1, adjusted.style));
    }
    
    return adjusted;
  }

  /**
   * Create audio URL from buffer
   */
  private createAudioUrl(buffer: ArrayBuffer): string {
    const blob = new Blob([buffer], { type: 'audio/mpeg' });
    return URL.createObjectURL(blob);
  }

  /**
   * Fallback to Web Speech API if ElevenLabs fails
   */
  private async fallbackToWebSpeech(text: string): Promise<{ audioUrl: string; audioBuffer: ArrayBuffer }> {
    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      // Create a simple audio buffer (this is a mock - real implementation would record the speech)
      const audioBuffer = new ArrayBuffer(1024);
      const audioUrl = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAAA=';
      
      speechSynthesis.speak(utterance);
      
      resolve({ audioUrl, audioBuffer });
    });
  }

  // Text modification helpers
  private addEmpathyToText(text: string): string {
    const empathyPhrases = [
      "I understand this can be frustrating. ",
      "I hear you, and I'm here to help. ",
      "Let me make this easier for you. "
    ];
    
    const phrase = empathyPhrases[Math.floor(Math.random() * empathyPhrases.length)];
    return phrase + text;
  }

  private makeTextMoreConcise(text: string): string {
    // Remove filler words and make more direct
    return text
      .replace(/\bactually\b/gi, '')
      .replace(/\bbasically\b/gi, '')
      .replace(/\bI think\b/gi, '')
      .replace(/\bperhaps\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private makeTextMoreEnthusiastic(text: string): string {
    // Add enthusiasm markers
    if (!text.endsWith('!') && Math.random() < 0.5) {
      text = text.replace(/\.$/, '!');
    }
    
    return text.replace(/good/gi, 'fantastic')
               .replace(/great/gi, 'amazing')
               .replace(/okay/gi, 'solid');
  }

  private makeTextMoreAuthoritative(text: string): string {
    // Add authority markers
    const authorityPhrases = ['According to my sources, ', 'I can confirm that ', 'Reports indicate '];
    
    if (Math.random() < 0.4) {
      const phrase = authorityPhrases[Math.floor(Math.random() * authorityPhrases.length)];
      return phrase + text.charAt(0).toLowerCase() + text.slice(1);
    }
    
    return text;
  }

  private makeTextMoreAnalytical(text: string): string {
    // Add analytical language
    return text.replace(/shows/gi, 'indicates')
               .replace(/suggests/gi, 'demonstrates')
               .replace(/probably/gi, 'statistically likely to');
  }

  /**
   * Get voice profile by name
   */
  getVoiceProfile(profileName: string): ExpertVoiceProfile | undefined {
    return this.expertVoices.get(profileName);
  }

  /**
   * List all available expert voices
   */
  listExpertVoices(): ExpertVoiceProfile[] {
    return Array.from(this.expertVoices.values());
  }
}

// Export singleton instance
export const elevenLabsIntegration = new ElevenLabsIntegration({
  apiKey: process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || ''
});