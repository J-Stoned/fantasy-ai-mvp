/**
 * VoiceService - Enhanced Mobile Voice Assistant for Fantasy.AI
 * 
 * Integrates with ElevenLabs for revolutionary voice capabilities:
 * - Natural text-to-speech with voice personas
 * - Real-time voice command processing
 * - Fantasy sports context intelligence
 * - Emotional voice responses
 * - Voice cloning and personalization
 */

import Voice, { SpeechResultsEvent, SpeechErrorEvent } from '@react-native-voice/voice';
import { Platform, PermissionsAndroid } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ElevenLabsService, { VoiceSynthesisOptions, VoicePersona } from './ElevenLabsService';
import { HapticService } from './HapticService';
import { NotificationService } from './NotificationService';

export interface VoiceCommand {
  command: string;
  intent: 'lineup' | 'trade' | 'waiver' | 'injury' | 'multimedia' | 'general' | 'persona_change';
  entities: Array<{
    type: 'player' | 'team' | 'position' | 'action' | 'persona';
    value: string;
    confidence: number;
  }>;
  confidence: number;
  timestamp: Date;
}

export interface VoiceResponse {
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  data?: any;
  audioPath?: string;
  shouldSpeak: boolean;
}

export interface VoiceSettings {
  isEnabled: boolean;
  currentPersona: string;
  voiceSpeed: number;
  autoSpeak: boolean;
  useWakeWord: boolean;
  wakeWord: string;
  useHapticFeedback: boolean;
  contextualResponses: boolean;
}

class VoiceService {
  private isInitialized = false;
  private isListening = false;
  private isProcessing = false;
  private isSpeaking = false;
  private wakeWordActive = false;
  private currentSession: string | null = null;
  private commandHistory: VoiceCommand[] = [];
  private settings: VoiceSettings = {
    isEnabled: false,
    currentPersona: 'commentator',
    voiceSpeed: 1.0,
    autoSpeak: true,
    useWakeWord: true,
    wakeWord: 'hey fantasy',
    useHapticFeedback: true,
    contextualResponses: true
  };

  // Event callbacks
  private onVoiceCommandCallback?: (command: VoiceCommand) => void;
  private onVoiceResponseCallback?: (response: VoiceResponse) => void;
  private onListeningStateCallback?: (isListening: boolean) => void;
  private onSpeakingStateCallback?: (isSpeaking: boolean) => void;
  private onErrorCallback?: (error: string) => void;

  constructor() {
    this.loadSettings();
    this.setupVoiceRecognition();
  }

  // Initialization
  async initialize(): Promise<boolean> {
    try {
      // Request necessary permissions
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        ]);

        const allGranted = Object.values(granted).every(
          permission => permission === PermissionsAndroid.RESULTS.GRANTED
        );

        if (!allGranted) {
          console.error('Required permissions not granted');
          return false;
        }
      }

      // Initialize ElevenLabs service
      const elevenLabsInitialized = await ElevenLabsService.initialize();
      if (!elevenLabsInitialized) {
        console.warn('ElevenLabs service not available, using fallback TTS');
      }

      // Initialize voice recognition
      await this.initializeVoiceRecognition();

      this.isInitialized = true;
      console.log('VoiceService initialized successfully');
      
      // Welcome message
      if (this.settings.autoSpeak && elevenLabsInitialized) {
        await this.speak('Voice assistant ready! Say "Hey Fantasy" to get started.', {
          persona: this.settings.currentPersona,
          emotion: 'calm'
        });
      }

      return true;
    } catch (error) {
      console.error('VoiceService initialization failed:', error);
      return false;
    }
  }

  async disable(): Promise<void> {
    try {
      await this.stopListening();
      this.isInitialized = false;
      this.settings.isEnabled = false;
      await this.saveSettings();
      
      Voice.removeAllListeners();
      console.log('VoiceService disabled');
    } catch (error) {
      console.error('Error disabling VoiceService:', error);
    }
  }

  // Voice Recognition
  async startListening(): Promise<boolean> {
    if (!this.isInitialized || this.isListening) return false;

    try {
      this.currentSession = `session_${Date.now()}`;
      await Voice.start('en-US');
      this.isListening = true;
      
      if (this.settings.useHapticFeedback) {
        HapticService.impact('light');
      }

      this.onListeningStateCallback?.(true);
      return true;
    } catch (error) {
      console.error('Failed to start listening:', error);
      this.onErrorCallback?.('Failed to start voice recognition');
      return false;
    }
  }

  async stopListening(): Promise<void> {
    if (!this.isListening) return;

    try {
      await Voice.stop();
      this.isListening = false;
      this.onListeningStateCallback?.(false);
    } catch (error) {
      console.error('Failed to stop listening:', error);
    }
  }

  // Text-to-Speech with ElevenLabs
  async speak(text: string, options: VoiceSynthesisOptions = {}): Promise<boolean> {
    if (!this.isInitialized || this.isSpeaking) return false;

    try {
      this.isSpeaking = true;
      this.onSpeakingStateCallback?.(true);

      const synthesisOptions: VoiceSynthesisOptions = {
        persona: options.persona || this.settings.currentPersona,
        emotion: options.emotion || 'calm',
        speed: options.speed || this.settings.voiceSpeed,
        useCache: true,
        ...options
      };

      const success = await ElevenLabsService.speak(text, synthesisOptions);
      
      if (this.settings.useHapticFeedback && success) {
        HapticService.success();
      }

      return success;
    } catch (error) {
      console.error('Speech synthesis failed:', error);
      return false;
    } finally {
      this.isSpeaking = false;
      this.onSpeakingStateCallback?.(false);
    }
  }

  // Command Processing
  async processCommand(commandText: string): Promise<VoiceResponse> {
    if (!this.isInitialized || this.isProcessing) {
      return {
        type: 'error',
        message: 'Voice service not ready',
        shouldSpeak: false
      };
    }

    try {
      this.isProcessing = true;

      // Parse command and extract intent/entities
      const command = await this.parseCommand(commandText);
      
      // Add to history
      this.commandHistory.unshift(command);
      if (this.commandHistory.length > 50) {
        this.commandHistory = this.commandHistory.slice(0, 50);
      }

      // Execute command
      const response = await this.executeCommand(command);

      // Notify callback
      this.onVoiceCommandCallback?.(command);
      this.onVoiceResponseCallback?.(response);

      // Auto-speak response if enabled
      if (response.shouldSpeak && this.settings.autoSpeak && response.message) {
        const emotion = this.getEmotionForResponseType(response.type);
        await this.speak(response.message, { 
          emotion,
          persona: this.settings.currentPersona 
        });
      }

      return response;
    } catch (error) {
      console.error('Command processing error:', error);
      const errorResponse: VoiceResponse = {
        type: 'error',
        message: 'Sorry, I had trouble processing that command. Could you try again?',
        shouldSpeak: true
      };
      
      this.onVoiceResponseCallback?.(errorResponse);
      return errorResponse;
    } finally {
      this.isProcessing = false;
    }
  }

  // Persona Management
  async setVoicePersona(personaId: string): Promise<boolean> {
    const personas = ElevenLabsService.getAvailablePersonas();
    const persona = personas.find(p => p.id === personaId);
    
    if (persona) {
      this.settings.currentPersona = personaId;
      await this.saveSettings();
      
      ElevenLabsService.setCurrentPersona(personaId);
      
      // Announce persona change
      if (this.settings.autoSpeak) {
        await this.speak(`Voice changed to ${persona.name}. ${persona.description}`, {
          persona: personaId,
          emotion: 'calm'
        });
      }
      
      return true;
    }
    
    return false;
  }

  getAvailablePersonas(): VoicePersona[] {
    return ElevenLabsService.getAvailablePersonas();
  }

  getCurrentPersona(): VoicePersona | null {
    return ElevenLabsService.getCurrentPersona();
  }

  // Fantasy-Specific Features
  async announceLineupOptimization(data: any): Promise<void> {
    const audioPath = await ElevenLabsService.generateFantasyAnnouncement(
      'lineup', 
      data, 
      { 
        persona: 'commentator',
        emotion: 'excited' 
      }
    );

    if (audioPath && this.settings.autoSpeak) {
      // Play the generated audio
      console.log('Playing lineup optimization announcement');
    }
  }

  async announceInjuryUpdate(playerName: string, status: string): Promise<void> {
    const data = { player: playerName, status };
    await ElevenLabsService.generateFantasyAnnouncement(
      'injury_alert', 
      data, 
      { 
        persona: 'expert',
        emotion: 'calm' 
      }
    );
  }

  async announceScoreUpdate(playerName: string, points: number, total: number): Promise<void> {
    const data = { player: playerName, points, total };
    await ElevenLabsService.generateFantasyAnnouncement(
      'score_update', 
      data, 
      { 
        persona: 'commentator',
        emotion: 'excited' 
      }
    );
  }

  // Settings Management
  async updateSettings(newSettings: Partial<VoiceSettings>): Promise<void> {
    this.settings = { ...this.settings, ...newSettings };
    await this.saveSettings();
    
    // Apply persona change if updated
    if (newSettings.currentPersona) {
      ElevenLabsService.setCurrentPersona(newSettings.currentPersona);
    }
  }

  getSettings(): VoiceSettings {
    return { ...this.settings };
  }

  // Event Listeners
  setOnVoiceCommand(callback: (command: VoiceCommand) => void): void {
    this.onVoiceCommandCallback = callback;
  }

  setOnVoiceResponse(callback: (response: VoiceResponse) => void): void {
    this.onVoiceResponseCallback = callback;
  }

  setOnListeningState(callback: (isListening: boolean) => void): void {
    this.onListeningStateCallback = callback;
  }

  setOnSpeakingState(callback: (isSpeaking: boolean) => void): void {
    this.onSpeakingStateCallback = callback;
  }

  setOnError(callback: (error: string) => void): void {
    this.onErrorCallback = callback;
  }

  // State Getters
  getIsListening(): boolean {
    return this.isListening;
  }

  getIsProcessing(): boolean {
    return this.isProcessing;
  }

  getIsSpeaking(): boolean {
    return this.isSpeaking;
  }

  getCommandHistory(): VoiceCommand[] {
    return [...this.commandHistory];
  }

  // Private Methods
  private async setupVoiceRecognition(): Promise<void> {
    Voice.onSpeechStart = this.onSpeechStart.bind(this);
    Voice.onSpeechEnd = this.onSpeechEnd.bind(this);
    Voice.onSpeechError = this.onSpeechError.bind(this);
    Voice.onSpeechResults = this.onSpeechResults.bind(this);
    Voice.onSpeechPartialResults = this.onSpeechPartialResults.bind(this);
  }

  private async initializeVoiceRecognition(): Promise<void> {
    try {
      const available = await Voice.isAvailable();
      if (!available) {
        throw new Error('Voice recognition not available');
      }
    } catch (error) {
      console.error('Voice recognition initialization failed:', error);
      throw error;
    }
  }

  private onSpeechStart(): void {
    console.log('Speech recognition started');
    if (this.settings.useHapticFeedback) {
      HapticService.impact('light');
    }
  }

  private onSpeechEnd(): void {
    console.log('Speech recognition ended');
    this.isListening = false;
    this.onListeningStateCallback?.(false);
  }

  private onSpeechError(error: SpeechErrorEvent): void {
    console.error('Speech recognition error:', error);
    this.isListening = false;
    this.onListeningStateCallback?.(false);
    this.onErrorCallback?.(`Voice recognition error: ${error.error?.message || 'Unknown error'}`);
    
    if (this.settings.useHapticFeedback) {
      HapticService.impact('heavy');
    }
  }

  private async onSpeechResults(event: SpeechResultsEvent): Promise<void> {
    const result = event.value?.[0];
    if (result) {
      await this.processCommand(result);
    }
  }

  private onSpeechPartialResults(event: SpeechResultsEvent): void {
    const partialResult = event.value?.[0];
    if (partialResult && this.settings.useWakeWord) {
      const lowerResult = partialResult.toLowerCase();
      if (lowerResult.includes(this.settings.wakeWord)) {
        this.wakeWordActive = true;
        if (this.settings.useHapticFeedback) {
          HapticService.impact('medium');
        }
      }
    }
  }

  private async parseCommand(commandText: string): Promise<VoiceCommand> {
    const lowerCommand = commandText.toLowerCase();
    
    // Determine intent
    let intent: VoiceCommand['intent'] = 'general';
    if (lowerCommand.includes('lineup') || lowerCommand.includes('start') || lowerCommand.includes('bench')) {
      intent = 'lineup';
    } else if (lowerCommand.includes('trade') || lowerCommand.includes('deal')) {
      intent = 'trade';
    } else if (lowerCommand.includes('waiver') || lowerCommand.includes('pickup') || lowerCommand.includes('drop')) {
      intent = 'waiver';
    } else if (lowerCommand.includes('injury') || lowerCommand.includes('injured') || lowerCommand.includes('health')) {
      intent = 'injury';
    } else if (lowerCommand.includes('podcast') || lowerCommand.includes('youtube') || lowerCommand.includes('social')) {
      intent = 'multimedia';
    } else if (lowerCommand.includes('voice') || lowerCommand.includes('persona') || lowerCommand.includes('sound like')) {
      intent = 'persona_change';
    }

    // Extract entities (simplified for now)
    const entities = this.extractEntities(commandText, intent);

    return {
      command: commandText,
      intent,
      entities,
      confidence: 0.8, // Would be calculated based on various factors
      timestamp: new Date()
    };
  }

  private extractEntities(text: string, intent: VoiceCommand['intent']): VoiceCommand['entities'] {
    const entities: VoiceCommand['entities'] = [];
    const lowerText = text.toLowerCase();

    // Extract player names (simplified pattern matching)
    const playerPatterns = [
      /(?:start|bench|drop|pickup|trade)\s+([a-z\s]+?)(?:\s|$)/gi,
      /([a-z]+\s+[a-z]+)(?:\s+is|'s)/gi
    ];

    playerPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        entities.push({
          type: 'player',
          value: match[1].trim(),
          confidence: 0.7
        });
      }
    });

    // Extract positions
    const positions = ['quarterback', 'qb', 'running back', 'rb', 'wide receiver', 'wr', 'tight end', 'te', 'defense', 'dst', 'kicker', 'k'];
    positions.forEach(pos => {
      if (lowerText.includes(pos)) {
        entities.push({
          type: 'position',
          value: pos,
          confidence: 0.9
        });
      }
    });

    // Extract actions
    const actions = ['start', 'bench', 'drop', 'pickup', 'trade', 'analyze', 'optimize'];
    actions.forEach(action => {
      if (lowerText.includes(action)) {
        entities.push({
          type: 'action',
          value: action,
          confidence: 0.9
        });
      }
    });

    // Extract personas for persona change intent
    if (intent === 'persona_change') {
      const personas = ElevenLabsService.getAvailablePersonas();
      personas.forEach(persona => {
        if (lowerText.includes(persona.name.toLowerCase()) || lowerText.includes(persona.personality)) {
          entities.push({
            type: 'persona',
            value: persona.id,
            confidence: 0.8
          });
        }
      });
    }

    return entities;
  }

  private async executeCommand(command: VoiceCommand): Promise<VoiceResponse> {
    switch (command.intent) {
      case 'persona_change':
        return await this.handlePersonaChange(command);
      
      case 'lineup':
        return await this.handleLineupCommand(command);
      
      case 'injury':
        return await this.handleInjuryCommand(command);
      
      case 'trade':
        return await this.handleTradeCommand(command);
      
      case 'waiver':
        return await this.handleWaiverCommand(command);
      
      case 'multimedia':
        return await this.handleMultimediaCommand(command);
      
      default:
        return await this.handleGeneralCommand(command);
    }
  }

  private async handlePersonaChange(command: VoiceCommand): Promise<VoiceResponse> {
    const personaEntity = command.entities.find(e => e.type === 'persona');
    
    if (personaEntity) {
      const success = await this.setVoicePersona(personaEntity.value);
      if (success) {
        return {
          type: 'success',
          message: `Voice persona changed successfully!`,
          shouldSpeak: false // Already spoken in setVoicePersona
        };
      }
    }
    
    return {
      type: 'error',
      message: 'Sorry, I couldn\'t change the voice persona. Try saying "sound like commentator" or "sound like expert".',
      shouldSpeak: true
    };
  }

  private async handleLineupCommand(command: VoiceCommand): Promise<VoiceResponse> {
    // This would integrate with your existing lineup optimization logic
    return {
      type: 'success',
      message: 'Analyzing your lineup now. I recommend starting your highest projected scorers and checking for any last-minute injury updates.',
      data: { optimizedLineup: true },
      shouldSpeak: true
    };
  }

  private async handleInjuryCommand(command: VoiceCommand): Promise<VoiceResponse> {
    return {
      type: 'info',
      message: 'Checking injury reports across all your players. I\'ll notify you of any updates that could impact your lineup.',
      shouldSpeak: true
    };
  }

  private async handleTradeCommand(command: VoiceCommand): Promise<VoiceResponse> {
    return {
      type: 'info',
      message: 'Analyzing potential trades based on your team needs and market values. Looking for win-win opportunities.',
      shouldSpeak: true
    };
  }

  private async handleWaiverCommand(command: VoiceCommand): Promise<VoiceResponse> {
    return {
      type: 'info',
      message: 'Scanning the waiver wire for breakout candidates and players trending up. I\'ll prioritize based on your roster gaps.',
      shouldSpeak: true
    };
  }

  private async handleMultimediaCommand(command: VoiceCommand): Promise<VoiceResponse> {
    return {
      type: 'info',
      message: 'Gathering insights from fantasy podcasts, YouTube videos, and social media buzz to give you the latest intel.',
      shouldSpeak: true
    };
  }

  private async handleGeneralCommand(command: VoiceCommand): Promise<VoiceResponse> {
    return {
      type: 'info',
      message: 'I\'m here to help with your fantasy team. Try asking about lineups, injuries, trades, or waiver wire targets.',
      shouldSpeak: true
    };
  }

  private getEmotionForResponseType(type: VoiceResponse['type']): VoiceSynthesisOptions['emotion'] {
    switch (type) {
      case 'success':
        return 'excited';
      case 'error':
        return 'calm';
      case 'warning':
        return 'analytical';
      case 'info':
      default:
        return 'calm';
    }
  }

  private async loadSettings(): Promise<void> {
    try {
      const savedSettings = await AsyncStorage.getItem('voice_service_settings');
      if (savedSettings) {
        this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
      }
    } catch (error) {
      console.warn('Failed to load voice settings:', error);
    }
  }

  private async saveSettings(): Promise<void> {
    try {
      await AsyncStorage.setItem('voice_service_settings', JSON.stringify(this.settings));
    } catch (error) {
      console.error('Failed to save voice settings:', error);
    }
  }
}

export default new VoiceService();