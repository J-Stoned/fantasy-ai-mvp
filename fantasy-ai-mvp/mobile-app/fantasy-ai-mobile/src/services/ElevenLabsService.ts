/**
 * ElevenLabsService - Revolutionary Voice AI Integration for Fantasy.AI Mobile
 * 
 * Features:
 * - Natural TTS with voice cloning
 * - Multiple voice personas (commentator, expert, casual)
 * - Real-time voice synthesis optimized for mobile
 * - Fantasy sports specific enhancements
 * - Voice command processing with emotional intelligence
 */

import { NativeModules, Platform } from 'react-native';
import Sound from 'react-native-sound';
import RNFS from 'react-native-fs';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface VoicePersona {
  id: string;
  name: string;
  description: string;
  voiceId: string;
  personality: 'commentator' | 'expert' | 'casual' | 'custom';
  style: {
    stability: number;
    similarityBoost: number;
    style: number;
    speakerBoost: boolean;
  };
}

export interface VoiceSynthesisOptions {
  persona?: string;
  emotion?: 'excited' | 'calm' | 'dramatic' | 'analytical';
  speed?: number;
  pitch?: number;
  useCache?: boolean;
}

export interface VoiceCloneSettings {
  name: string;
  description: string;
  personality: VoicePersona['personality'];
  audioFiles: string[]; // File paths to audio samples
}

export interface SpeechAnalysis {
  transcript: string;
  confidence: number;
  emotion: string;
  intent: 'lineup' | 'trade' | 'waiver' | 'injury' | 'multimedia' | 'general';
  entities: Array<{
    type: 'player' | 'team' | 'position' | 'action';
    value: string;
    confidence: number;
  }>;
}

class ElevenLabsService {
  private apiKey: string | null = null;
  private baseUrl = 'https://api.elevenlabs.io/v1';
  private voiceCache = new Map<string, string>();
  private currentPersona: string = 'commentator';
  private isInitialized = false;

  // Pre-defined voice personas for Fantasy.AI
  private voicePersonas: VoicePersona[] = [
    {
      id: 'commentator',
      name: 'Sports Commentator',
      description: 'Energetic play-by-play style with dramatic flair',
      voiceId: 'pNInz6obpgDQGcFmaJgB', // ElevenLabs default voice
      personality: 'commentator',
      style: {
        stability: 0.5,
        similarityBoost: 0.8,
        style: 1.0,
        speakerBoost: true
      }
    },
    {
      id: 'expert',
      name: 'Fantasy Expert',
      description: 'Analytical and professional with deep insights',
      voiceId: 'EXAVITQu4vr4xnSDxMaL', // Alternative voice
      personality: 'expert',
      style: {
        stability: 0.75,
        similarityBoost: 0.85,
        style: 0.6,
        speakerBoost: false
      }
    },
    {
      id: 'casual',
      name: 'Fantasy Buddy',
      description: 'Friendly conversational tone like a knowledgeable friend',
      voiceId: 'TxGEqnHWrfWFTfGW9XjX', // Another voice option
      personality: 'casual',
      style: {
        stability: 0.8,
        similarityBoost: 0.75,
        style: 0.4,
        speakerBoost: false
      }
    }
  ];

  constructor() {
    Sound.setCategory('Playback');
    this.loadConfiguration();
  }

  async initialize(): Promise<boolean> {
    try {
      // Load API key from secure storage or environment
      this.apiKey = await AsyncStorage.getItem('elevenlabs_api_key');
      
      if (!this.apiKey) {
        console.warn('ElevenLabs API key not found. Voice features will be limited.');
        return false;
      }

      // Load saved voice personas and settings
      await this.loadVoiceSettings();
      
      // Test API connection
      const isConnected = await this.testConnection();
      
      if (isConnected) {
        this.isInitialized = true;
        console.log('ElevenLabs service initialized successfully');
        return true;
      } else {
        console.error('Failed to connect to ElevenLabs API');
        return false;
      }
    } catch (error) {
      console.error('ElevenLabs initialization error:', error);
      return false;
    }
  }

  async setApiKey(apiKey: string): Promise<void> {
    this.apiKey = apiKey;
    await AsyncStorage.setItem('elevenlabs_api_key', apiKey);
  }

  // Text-to-Speech with Fantasy Sports Intelligence
  async synthesizeSpeech(
    text: string, 
    options: VoiceSynthesisOptions = {}
  ): Promise<string | null> {
    if (!this.isInitialized || !this.apiKey) {
      console.warn('ElevenLabs service not initialized');
      return null;
    }

    try {
      const persona = options.persona || this.currentPersona;
      const voicePersona = this.getVoicePersona(persona);
      
      if (!voicePersona) {
        console.error(`Voice persona '${persona}' not found`);
        return null;
      }

      // Enhance text for fantasy sports context
      const enhancedText = this.enhanceTextForFantasy(text, options.emotion);
      
      // Check cache first
      const cacheKey = this.generateCacheKey(enhancedText, voicePersona.id, options);
      if (options.useCache !== false) {
        const cachedPath = this.voiceCache.get(cacheKey);
        if (cachedPath && await RNFS.exists(cachedPath)) {
          return cachedPath;
        }
      }

      const response = await fetch(`${this.baseUrl}/text-to-speech/${voicePersona.voiceId}`, {
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
            stability: voicePersona.style.stability,
            similarity_boost: voicePersona.style.similarityBoost,
            style: voicePersona.style.style,
            use_speaker_boost: voicePersona.style.speakerBoost
          }
        })
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.status}`);
      }

      // Save audio file
      const audioBuffer = await response.arrayBuffer();
      const fileName = `voice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.mp3`;
      const filePath = `${RNFS.DocumentDirectoryPath}/voice_cache/${fileName}`;
      
      // Ensure cache directory exists
      await RNFS.mkdir(`${RNFS.DocumentDirectoryPath}/voice_cache`);
      
      // Write audio file
      await RNFS.writeFile(filePath, Buffer.from(audioBuffer).toString('base64'), 'base64');
      
      // Cache the file path
      if (options.useCache !== false) {
        this.voiceCache.set(cacheKey, filePath);
      }

      return filePath;
    } catch (error) {
      console.error('Speech synthesis failed:', error);
      return null;
    }
  }

  // Play synthesized speech
  async speak(text: string, options: VoiceSynthesisOptions = {}): Promise<boolean> {
    try {
      const audioPath = await this.synthesizeSpeech(text, options);
      if (!audioPath) return false;

      return new Promise((resolve) => {
        const sound = new Sound(audioPath, '', (error) => {
          if (error) {
            console.error('Failed to load sound:', error);
            resolve(false);
            return;
          }

          sound.play((success) => {
            sound.release();
            resolve(success);
          });
        });
      });
    } catch (error) {
      console.error('Speak error:', error);
      return false;
    }
  }

  // Voice cloning for personalized fantasy assistant
  async cloneVoice(settings: VoiceCloneSettings): Promise<string | null> {
    if (!this.isInitialized || !this.apiKey) {
      console.warn('ElevenLabs service not initialized');
      return null;
    }

    try {
      const formData = new FormData();
      formData.append('name', settings.name);
      formData.append('description', settings.description);
      
      // Add audio files
      for (let i = 0; i < settings.audioFiles.length; i++) {
        const filePath = settings.audioFiles[i];
        const fileData = await RNFS.readFile(filePath, 'base64');
        
        formData.append('files', {
          uri: Platform.OS === 'ios' ? filePath : `file://${filePath}`,
          type: 'audio/wav',
          name: `sample_${i}.wav`
        } as any);
      }

      const response = await fetch(`${this.baseUrl}/voices/add`, {
        method: 'POST',
        headers: {
          'xi-api-key': this.apiKey,
          'Content-Type': 'multipart/form-data'
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Voice cloning failed: ${response.status}`);
      }

      const result = await response.json();
      
      // Add to custom personas
      const customPersona: VoicePersona = {
        id: `custom_${Date.now()}`,
        name: settings.name,
        description: settings.description,
        voiceId: result.voice_id,
        personality: settings.personality,
        style: this.getDefaultStyleForPersonality(settings.personality)
      };

      this.voicePersonas.push(customPersona);
      await this.saveVoiceSettings();

      return result.voice_id;
    } catch (error) {
      console.error('Voice cloning failed:', error);
      return null;
    }
  }

  // Generate fantasy-specific announcements
  async generateFantasyAnnouncement(
    type: 'lineup' | 'trade' | 'score_update' | 'injury_alert' | 'waiver_claim' | 'draft_pick',
    data: any,
    options: VoiceSynthesisOptions = {}
  ): Promise<string | null> {
    const text = this.generateAnnouncementText(type, data);
    const enhancedOptions = {
      ...options,
      emotion: this.getEmotionForAnnouncementType(type),
      persona: options.persona || 'commentator'
    };

    return await this.synthesizeSpeech(text, enhancedOptions);
  }

  // Real-time voice response for commands
  async generateVoiceResponse(
    command: string,
    responseData: any,
    options: VoiceSynthesisOptions = {}
  ): Promise<string | null> {
    const responseText = this.generateResponseText(command, responseData);
    const contextualOptions = {
      ...options,
      persona: options.persona || this.determinePersonaForCommand(command),
      emotion: this.determineEmotionForResponse(responseData)
    };

    return await this.synthesizeSpeech(responseText, contextualOptions);
  }

  // Voice persona management
  setCurrentPersona(personaId: string): boolean {
    const persona = this.getVoicePersona(personaId);
    if (persona) {
      this.currentPersona = personaId;
      AsyncStorage.setItem('current_voice_persona', personaId);
      return true;
    }
    return false;
  }

  getCurrentPersona(): VoicePersona | null {
    return this.getVoicePersona(this.currentPersona);
  }

  getAvailablePersonas(): VoicePersona[] {
    return [...this.voicePersonas];
  }

  getVoicePersona(personaId: string): VoicePersona | null {
    return this.voicePersonas.find(p => p.id === personaId) || null;
  }

  // Cache management
  async clearVoiceCache(): Promise<void> {
    try {
      const cacheDir = `${RNFS.DocumentDirectoryPath}/voice_cache`;
      if (await RNFS.exists(cacheDir)) {
        await RNFS.unlink(cacheDir);
      }
      this.voiceCache.clear();
    } catch (error) {
      console.error('Failed to clear voice cache:', error);
    }
  }

  async getCacheSize(): Promise<number> {
    try {
      const cacheDir = `${RNFS.DocumentDirectoryPath}/voice_cache`;
      if (!(await RNFS.exists(cacheDir))) return 0;

      const files = await RNFS.readDir(cacheDir);
      let totalSize = 0;
      
      for (const file of files) {
        totalSize += file.size;
      }
      
      return totalSize;
    } catch (error) {
      console.error('Failed to get cache size:', error);
      return 0;
    }
  }

  // Private helper methods
  private async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/voices`, {
        headers: {
          'xi-api-key': this.apiKey!
        }
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  private async loadConfiguration(): Promise<void> {
    try {
      const config = await AsyncStorage.getItem('elevenlabs_config');
      if (config) {
        const parsedConfig = JSON.parse(config);
        this.currentPersona = parsedConfig.currentPersona || 'commentator';
      }
    } catch (error) {
      console.warn('Failed to load ElevenLabs configuration:', error);
    }
  }

  private async loadVoiceSettings(): Promise<void> {
    try {
      const savedPersonas = await AsyncStorage.getItem('custom_voice_personas');
      if (savedPersonas) {
        const customPersonas = JSON.parse(savedPersonas);
        this.voicePersonas.push(...customPersonas);
      }

      const currentPersona = await AsyncStorage.getItem('current_voice_persona');
      if (currentPersona) {
        this.currentPersona = currentPersona;
      }
    } catch (error) {
      console.warn('Failed to load voice settings:', error);
    }
  }

  private async saveVoiceSettings(): Promise<void> {
    try {
      const customPersonas = this.voicePersonas.filter(p => p.id.startsWith('custom_'));
      await AsyncStorage.setItem('custom_voice_personas', JSON.stringify(customPersonas));
    } catch (error) {
      console.error('Failed to save voice settings:', error);
    }
  }

  private enhanceTextForFantasy(text: string, emotion?: string): string {
    let enhanced = text;

    // Add SSML-like enhancements for fantasy sports
    enhanced = enhanced
      .replace(/(\d+)\s*points?/gi, '<emphasis level="strong">$1 points</emphasis>')
      .replace(/touchdown|TD/gi, '<emphasis level="strong">TOUCHDOWN</emphasis>')
      .replace(/(\d+)\s*yards?/gi, '$1 yards')
      .replace(/quarterback|QB/gi, 'quarterback')
      .replace(/running back|RB/gi, 'running back')
      .replace(/wide receiver|WR/gi, 'wide receiver')
      .replace(/tight end|TE/gi, 'tight end');

    // Add emotional context
    if (emotion === 'excited') {
      enhanced = `<prosody rate="fast" pitch="high">${enhanced}</prosody>`;
    } else if (emotion === 'dramatic') {
      enhanced = `<prosody rate="slow" pitch="low">${enhanced}</prosody>`;
    } else if (emotion === 'analytical') {
      enhanced = `<prosody rate="medium" pitch="medium">${enhanced}</prosody>`;
    }

    return enhanced;
  }

  private generateCacheKey(text: string, personaId: string, options: VoiceSynthesisOptions): string {
    const optionsStr = JSON.stringify(options);
    return `${personaId}_${text.length}_${this.hashString(text + optionsStr)}`;
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString();
  }

  private generateAnnouncementText(type: string, data: any): string {
    switch (type) {
      case 'lineup':
        return `Your optimal lineup is locked and loaded! Starting ${data.players?.slice(0, 3).join(', ')} and more. Time to dominate this week!`;
      case 'trade':
        return `Trade alert! ${data.player1} is heading out, ${data.player2} is coming in. Let's see how this shakes up your championship run!`;
      case 'score_update':
        return `BOOM! ${data.player} just put up ${data.points} points! Your total is climbing to ${data.total}. Keep it rolling!`;
      case 'injury_alert':
        return `Injury update: ${data.player} is listed as ${data.status}. Time to check your bench and make some moves!`;
      case 'waiver_claim':
        return `Waiver wire success! You've snagged ${data.player}. Welcome to the squad, let's see what you've got!`;
      case 'draft_pick':
        return `With the ${data.pick} pick, you're selecting ${data.player}! Solid choice for your ${data.position} position!`;
      default:
        return 'Fantasy update available.';
    }
  }

  private generateResponseText(command: string, responseData: any): string {
    // Generate contextual responses based on command type and data
    if (command.includes('lineup') || command.includes('optimize')) {
      return `I've analyzed your lineup and here's what I recommend: ${responseData.summary || 'Making strategic adjustments for maximum points.'}`;
    } else if (command.includes('injury') || command.includes('health')) {
      return `Here's the injury report: ${responseData.summary || 'Checking player health status for this week.'}`;
    } else if (command.includes('trade') || command.includes('deal')) {
      return `Trade analysis complete: ${responseData.summary || 'Evaluating potential deals for your team.'}`;
    } else if (command.includes('waiver') || command.includes('pickup')) {
      return `Waiver wire targets identified: ${responseData.summary || 'Found some potential gems on the wire.'}`;
    } else {
      return responseData.summary || responseData.message || 'Analysis complete. Here are my recommendations.';
    }
  }

  private getEmotionForAnnouncementType(type: string): VoiceSynthesisOptions['emotion'] {
    switch (type) {
      case 'score_update':
        return 'excited';
      case 'injury_alert':
        return 'calm';
      case 'trade':
        return 'analytical';
      case 'draft_pick':
        return 'dramatic';
      default:
        return 'calm';
    }
  }

  private determinePersonaForCommand(command: string): string {
    if (command.includes('analyze') || command.includes('stats') || command.includes('projection')) {
      return 'expert';
    } else if (command.includes('excited') || command.includes('pumped') || command.includes('hype')) {
      return 'commentator';
    } else {
      return 'casual';
    }
  }

  private determineEmotionForResponse(responseData: any): VoiceSynthesisOptions['emotion'] {
    if (responseData.confidence > 0.8) return 'excited';
    if (responseData.type === 'analysis') return 'analytical';
    if (responseData.urgency === 'high') return 'dramatic';
    return 'calm';
  }

  private getDefaultStyleForPersonality(personality: VoicePersona['personality']) {
    switch (personality) {
      case 'commentator':
        return { stability: 0.5, similarityBoost: 0.8, style: 1.0, speakerBoost: true };
      case 'expert':
        return { stability: 0.75, similarityBoost: 0.85, style: 0.6, speakerBoost: false };
      case 'casual':
        return { stability: 0.8, similarityBoost: 0.75, style: 0.4, speakerBoost: false };
      default:
        return { stability: 0.7, similarityBoost: 0.8, style: 0.7, speakerBoost: false };
    }
  }
}

export default new ElevenLabsService();