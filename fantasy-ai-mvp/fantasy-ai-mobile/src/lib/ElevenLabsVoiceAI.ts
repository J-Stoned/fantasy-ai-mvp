import Voice from '@react-native-voice/voice';
import { Audio } from 'expo-av';
import { Platform, NativeModules } from 'react-native';
import { Storage, StorageKeys } from './storage';
import { nativeWebSocket, MessageType } from './NativeWebSocket';
import * as Haptics from 'expo-haptics';

// Voice personas for different contexts
export enum VoicePersona {
  ANALYST = 'fantasy_analyst',
  COMMISSIONER = 'commissioner',
  TRASH_TALKER = 'trash_talker',
  SUPPORTIVE = 'supportive_coach',
  EXPERT = 'expert_advisor',
  CELEBRITY = 'celebrity_voice',
}

// Emotional contexts for voice responses
export enum EmotionalContext {
  EXCITED = 'excited',
  CALM = 'calm',
  URGENT = 'urgent',
  CELEBRATORY = 'celebratory',
  SYMPATHETIC = 'sympathetic',
  ANALYTICAL = 'analytical',
}

interface VoiceCommand {
  text: string;
  intent: string;
  entities: Record<string, any>;
  confidence: number;
}

interface VoiceResponse {
  text: string;
  audioUrl?: string;
  persona: VoicePersona;
  emotion: EmotionalContext;
  actions?: any[];
}

class ElevenLabsVoiceAI {
  private static instance: ElevenLabsVoiceAI;
  private isListening: boolean = false;
  private currentPersona: VoicePersona = VoicePersona.ANALYST;
  private wakeWordDetected: boolean = false;
  private audioPlayer?: Audio.Sound;
  private voiceTimeout?: NodeJS.Timeout;
  private commandBuffer: string = '';
  private apiKey: string = 'sk_ee4201cc317179f18352030b5d5e4b8488cd00f618fdd2a5';
  private voiceIds: Record<VoicePersona, string> = {
    [VoicePersona.ANALYST]: 'EXAVITQu4vr4xnSDxMaL',
    [VoicePersona.COMMISSIONER]: 'TxGEqnHWrfWFTfGW9XjX',
    [VoicePersona.TRASH_TALKER]: 'VR6AewLTigWG4xSOukaG',
    [VoicePersona.SUPPORTIVE]: 'pNInz6obpgDQGcFmaJgB',
    [VoicePersona.EXPERT]: 'yoZ06aMxZJJ28mfd3POQ',
    [VoicePersona.CELEBRITY]: 'SOYHLrjzK2X1ezoPC6cr',
  };
  
  private constructor() {
    this.setupVoiceRecognition();
    this.setupAudioSession();
  }
  
  static getInstance(): ElevenLabsVoiceAI {
    if (!ElevenLabsVoiceAI.instance) {
      ElevenLabsVoiceAI.instance = new ElevenLabsVoiceAI();
    }
    return ElevenLabsVoiceAI.instance;
  }
  
  private setupVoiceRecognition() {
    Voice.onSpeechStart = this.onSpeechStart;
    Voice.onSpeechEnd = this.onSpeechEnd;
    Voice.onSpeechResults = this.onSpeechResults;
    Voice.onSpeechPartialResults = this.onSpeechPartialResults;
    Voice.onSpeechError = this.onSpeechError;
  }
  
  private async setupAudioSession() {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DUCK_OTHERS,
        shouldDuckAndroid: true,
        interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DUCK_OTHERS,
        playThroughEarpieceAndroid: false,
      });
    } catch (error) {
      console.error('[VoiceAI] Audio session setup failed:', error);
    }
  }
  
  private onSpeechStart = () => {
    console.log('[VoiceAI] Speech started');
    this.commandBuffer = '';
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };
  
  private onSpeechEnd = () => {
    console.log('[VoiceAI] Speech ended');
    this.processCommand();
  };
  
  private onSpeechResults = (event: any) => {
    if (event.value && event.value[0]) {
      this.commandBuffer = event.value[0];
      console.log('[VoiceAI] Final:', this.commandBuffer);
    }
  };
  
  private onSpeechPartialResults = (event: any) => {
    if (event.value && event.value[0]) {
      const partial = event.value[0].toLowerCase();
      
      // Check for wake word
      if (!this.wakeWordDetected && (partial.includes('hey fantasy') || partial.includes('fantasy'))) {
        this.wakeWordDetected = true;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        this.playActivationSound();
      }
      
      // Real-time command preview
      if (this.wakeWordDetected) {
        this.commandBuffer = partial.replace(/hey fantasy/gi, '').trim();
      }
    }
  };
  
  private onSpeechError = (event: any) => {
    console.error('[VoiceAI] Speech error:', event);
    this.stopListening();
  };
  
  private async playActivationSound() {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require('../assets/sounds/activation.mp3'),
        { shouldPlay: true, volume: 0.5 }
      );
      await sound.playAsync();
      setTimeout(() => sound.unloadAsync(), 1000);
    } catch (error) {
      console.error('[VoiceAI] Activation sound failed:', error);
    }
  }
  
  async startListening() {
    if (this.isListening) return;
    
    try {
      this.isListening = true;
      this.wakeWordDetected = false;
      await Voice.start('en-US');
      
      // Auto-stop after 10 seconds
      this.voiceTimeout = setTimeout(() => {
        this.stopListening();
      }, 10000);
      
    } catch (error) {
      console.error('[VoiceAI] Start listening failed:', error);
      this.isListening = false;
    }
  }
  
  async stopListening() {
    if (!this.isListening) return;
    
    try {
      this.isListening = false;
      await Voice.stop();
      
      if (this.voiceTimeout) {
        clearTimeout(this.voiceTimeout);
        this.voiceTimeout = undefined;
      }
    } catch (error) {
      console.error('[VoiceAI] Stop listening failed:', error);
    }
  }
  
  private async processCommand() {
    if (!this.commandBuffer || !this.wakeWordDetected) return;
    
    try {
      // Parse intent and entities
      const command = await this.parseCommand(this.commandBuffer);
      
      // Execute command
      const response = await this.executeCommand(command);
      
      // Generate and play response
      await this.speakResponse(response);
      
      // Send to WebSocket for real-time updates
      nativeWebSocket.send({
        type: MessageType.LIVE_CHAT,
        data: {
          command: command.text,
          response: response.text,
          persona: response.persona,
        },
      });
      
    } catch (error) {
      console.error('[VoiceAI] Command processing failed:', error);
      await this.speakResponse({
        text: "Sorry, I didn't understand that. Try asking about your lineup or players.",
        persona: this.currentPersona,
        emotion: EmotionalContext.SYMPATHETIC,
      });
    }
  }
  
  private async parseCommand(text: string): Promise<VoiceCommand> {
    const lowerText = text.toLowerCase();
    
    // Intent detection patterns
    const intents = {
      lineup: /lineup|roster|team|start|bench|sit/i,
      player: /player|stats|performance|how is|how's/i,
      trade: /trade|swap|exchange|offer/i,
      injury: /injury|injured|hurt|status|health/i,
      score: /score|points|winning|losing|game/i,
      waiver: /waiver|pickup|add|drop|available/i,
      prediction: /predict|projection|will|forecast/i,
      help: /help|what can|how do|explain/i,
    };
    
    let intent = 'general';
    let confidence = 0.5;
    
    for (const [key, pattern] of Object.entries(intents)) {
      if (pattern.test(lowerText)) {
        intent = key;
        confidence = 0.8;
        break;
      }
    }
    
    // Extract entities (players, teams, etc.)
    const entities: Record<string, any> = {};
    
    // Player names (simplified - in production, use NLP service)
    const playerPattern = /(\w+\s+\w+)/g;
    const matches = lowerText.match(playerPattern);
    if (matches) {
      entities.players = matches;
    }
    
    return {
      text,
      intent,
      entities,
      confidence,
    };
  }
  
  private async executeCommand(command: VoiceCommand): Promise<VoiceResponse> {
    switch (command.intent) {
      case 'lineup':
        return this.handleLineupCommand(command);
      case 'player':
        return this.handlePlayerCommand(command);
      case 'trade':
        return this.handleTradeCommand(command);
      case 'injury':
        return this.handleInjuryCommand(command);
      case 'score':
        return this.handleScoreCommand(command);
      case 'prediction':
        return this.handlePredictionCommand(command);
      case 'help':
        return this.handleHelpCommand();
      default:
        return this.handleGeneralCommand(command);
    }
  }
  
  private async handleLineupCommand(command: VoiceCommand): Promise<VoiceResponse> {
    // Get lineup data from storage or API
    const lineup = Storage.get(StorageKeys.LINEUP);
    
    if (!lineup) {
      return {
        text: "You haven't set your lineup yet. Would you like me to help you optimize it?",
        persona: VoicePersona.SUPPORTIVE,
        emotion: EmotionalContext.CALM,
      };
    }
    
    // Analyze lineup
    const analysis = await this.analyzeLineup(lineup);
    
    return {
      text: `Your lineup is ${analysis.rating}. ${analysis.suggestion}`,
      persona: VoicePersona.ANALYST,
      emotion: analysis.rating === 'optimal' ? EmotionalContext.EXCITED : EmotionalContext.ANALYTICAL,
      actions: analysis.changes,
    };
  }
  
  private async handlePlayerCommand(command: VoiceCommand): Promise<VoiceResponse> {
    const playerName = command.entities.players?.[0];
    
    if (!playerName) {
      return {
        text: "Which player would you like to know about?",
        persona: VoicePersona.ANALYST,
        emotion: EmotionalContext.CALM,
      };
    }
    
    // Get player data
    const players = Storage.get<any[]>(StorageKeys.PLAYERS) || [];
    const player = players.find(p => 
      p.name.toLowerCase().includes(playerName.toLowerCase())
    );
    
    if (!player) {
      return {
        text: `I couldn't find ${playerName} in your league. Try checking the player list.`,
        persona: VoicePersona.SUPPORTIVE,
        emotion: EmotionalContext.SYMPATHETIC,
      };
    }
    
    return {
      text: `${player.name} is averaging ${player.stats.averagePoints} points per game. ${this.getPlayerInsight(player)}`,
      persona: VoicePersona.EXPERT,
      emotion: player.stats.trend === 'up' ? EmotionalContext.EXCITED : EmotionalContext.ANALYTICAL,
    };
  }
  
  private async handleTradeCommand(command: VoiceCommand): Promise<VoiceResponse> {
    return {
      text: "I can analyze any trade for you. Just tell me which players you're thinking about trading.",
      persona: VoicePersona.COMMISSIONER,
      emotion: EmotionalContext.ANALYTICAL,
    };
  }
  
  private async handleInjuryCommand(command: VoiceCommand): Promise<VoiceResponse> {
    // Get injury updates from storage
    const injuries = Storage.get('injury_updates') || [];
    
    if (injuries.length === 0) {
      return {
        text: "Good news! None of your players have injury concerns right now.",
        persona: VoicePersona.SUPPORTIVE,
        emotion: EmotionalContext.CELEBRATORY,
      };
    }
    
    const summary = injuries.slice(0, 3).map((i: any) => 
      `${i.player} is ${i.status}`
    ).join('. ');
    
    return {
      text: `Injury update: ${summary}. Check the app for full details.`,
      persona: VoicePersona.ANALYST,
      emotion: EmotionalContext.URGENT,
    };
  }
  
  private async handleScoreCommand(command: VoiceCommand): Promise<VoiceResponse> {
    const scores = Storage.get('live_scores') || {};
    const userScore = scores.userTeam?.score || 0;
    const opponentScore = scores.opponent?.score || 0;
    
    const isWinning = userScore > opponentScore;
    const margin = Math.abs(userScore - opponentScore);
    
    return {
      text: isWinning 
        ? `You're winning ${userScore} to ${opponentScore}! Keep it up!`
        : `You're down ${opponentScore} to ${userScore}. Still plenty of time to come back!`,
      persona: isWinning ? VoicePersona.TRASH_TALKER : VoicePersona.SUPPORTIVE,
      emotion: isWinning ? EmotionalContext.CELEBRATORY : EmotionalContext.SYMPATHETIC,
    };
  }
  
  private async handlePredictionCommand(command: VoiceCommand): Promise<VoiceResponse> {
    return {
      text: "Based on my analysis, your team has a 73% chance of winning this week. Your strongest matchup advantage is at running back.",
      persona: VoicePersona.EXPERT,
      emotion: EmotionalContext.ANALYTICAL,
    };
  }
  
  private async handleHelpCommand(): Promise<VoiceResponse> {
    return {
      text: "I can help with your lineup, check player stats, analyze trades, give injury updates, or tell you the score. Just ask!",
      persona: VoicePersona.SUPPORTIVE,
      emotion: EmotionalContext.CALM,
    };
  }
  
  private async handleGeneralCommand(command: VoiceCommand): Promise<VoiceResponse> {
    return {
      text: "I'm here to help with all your fantasy needs. Try asking about your lineup or a specific player.",
      persona: VoicePersona.ANALYST,
      emotion: EmotionalContext.CALM,
    };
  }
  
  private async analyzeLineup(lineup: any): Promise<any> {
    // Simplified analysis - in production, use ML model
    const totalProjected = lineup.players?.reduce((sum: number, p: any) => 
      sum + (p.projectedPoints || 0), 0
    ) || 0;
    
    const rating = totalProjected > 120 ? 'optimal' : 
                   totalProjected > 100 ? 'good' : 'needs improvement';
    
    const suggestion = rating === 'optimal' 
      ? "You're all set for a big week!"
      : "Consider checking the waiver wire for better options.";
    
    return { rating, suggestion, changes: [] };
  }
  
  private getPlayerInsight(player: any): string {
    if (player.stats.trend === 'up') {
      return "He's on fire lately!";
    } else if (player.stats.trend === 'down') {
      return "He's been struggling recently.";
    }
    return "He's been consistent.";
  }
  
  private async speakResponse(response: VoiceResponse) {
    try {
      // Stop any existing audio
      if (this.audioPlayer) {
        await this.audioPlayer.unloadAsync();
      }
      
      // Generate speech with ElevenLabs
      const audioUrl = await this.generateSpeech(
        response.text,
        response.persona,
        response.emotion
      );
      
      if (audioUrl) {
        // Play the generated audio
        const { sound } = await Audio.Sound.createAsync(
          { uri: audioUrl },
          { shouldPlay: true, volume: 1.0 }
        );
        
        this.audioPlayer = sound;
        
        // Haptic feedback during speech
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.isPlaying) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
        });
        
        // Save audio URL in response
        response.audioUrl = audioUrl;
      }
    } catch (error) {
      console.error('[VoiceAI] Speech generation failed:', error);
      // Fallback to text-to-speech
      if (Platform.OS === 'ios' && NativeModules.Speech) {
        NativeModules.Speech.speak(response.text);
      }
    }
  }
  
  private async generateSpeech(
    text: string,
    persona: VoicePersona,
    emotion: EmotionalContext
  ): Promise<string | null> {
    try {
      const voiceId = this.voiceIds[persona];
      
      const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/' + voiceId, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': this.apiKey,
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: emotion === EmotionalContext.EXCITED ? 0.3 : 0.5,
            similarity_boost: 0.8,
            style: emotion === EmotionalContext.EXCITED ? 0.7 : 0.3,
            use_speaker_boost: true,
          },
        }),
      });
      
      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.status}`);
      }
      
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      return audioUrl;
    } catch (error) {
      console.error('[VoiceAI] ElevenLabs API error:', error);
      return null;
    }
  }
  
  // Public API
  setPersona(persona: VoicePersona) {
    this.currentPersona = persona;
  }
  
  async processTextCommand(text: string): Promise<VoiceResponse> {
    const command = await this.parseCommand(text);
    return this.executeCommand(command);
  }
  
  isActive(): boolean {
    return this.isListening;
  }
}

export const voiceAI = ElevenLabsVoiceAI.getInstance();