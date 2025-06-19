/**
 * HEY FANTASY - Voice Activation System
 * Listens for "Hey Fantasy" wake word and handles voice commands
 */

class VoiceActivationSystem {
  constructor() {
    this.isListening = false;
    this.isProcessing = false;
    this.recognition = null;
    this.sessionId = null;
    this.wakeWordDetected = false;
    this.commandTimeout = null;
    this.analyticsBuffer = [];
    
    // Voice configuration
    this.config = {
      wakeWord: 'hey fantasy',
      commandTimeout: 5000, // 5 seconds after wake word
      confidenceThreshold: 0.7,
      maxRetries: 3,
      languages: ['en-US', 'en-GB', 'es-ES', 'fr-FR']
    };
    
    // Initialize on page load
    this.init();
  }
  
  async init() {
    // Check if speech recognition is available
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.log('Speech recognition not supported');
      return;
    }
    
    // Get user preferences
    const prefs = await this.getUserPreferences();
    if (!prefs.voiceEnabled) return;
    
    // Set up speech recognition
    this.setupSpeechRecognition();
    
    // Listen for activation triggers
    this.setupEventListeners();
    
    // Start passive listening for wake word
    if (prefs.voiceActivationMethod === 'voice' || prefs.voiceActivationMethod === 'both') {
      this.startPassiveListening();
    }
    
    console.log('Hey Fantasy voice system initialized!');
  }
  
  setupSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    
    // Configure recognition
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.maxAlternatives = 3;
    this.recognition.lang = 'en-US'; // Default, can be changed
    
    // Handle results
    this.recognition.onresult = (event) => this.handleSpeechResult(event);
    
    // Handle errors
    this.recognition.onerror = (event) => this.handleSpeechError(event);
    
    // Handle end
    this.recognition.onend = () => this.handleSpeechEnd();
    
    // Handle start
    this.recognition.onstart = () => {
      this.isListening = true;
      console.log('Voice recognition started');
    };
  }
  
  setupEventListeners() {
    // Listen for hotkey trigger from background
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.type === 'TRIGGER_VOICE_ACTIVATION') {
        this.activateVoiceCommand();
      } else if (request.type === 'INIT_VOICE_UI') {
        this.injectVoiceUI();
      }
    });
    
    // Listen for manual activation click
    document.addEventListener('hey-fantasy-activate', () => {
      this.activateVoiceCommand();
    });
  }
  
  startPassiveListening() {
    if (this.isListening) return;
    
    try {
      this.recognition.start();
      this.trackEvent('passive_listening_started');
    } catch (error) {
      console.error('Failed to start voice recognition:', error);
    }
  }
  
  handleSpeechResult(event) {
    const results = event.results;
    const lastResult = results[results.length - 1];
    
    // Get all alternatives for better wake word detection
    const alternatives = [];
    for (let i = 0; i < lastResult.length; i++) {
      alternatives.push({
        transcript: lastResult[i].transcript.toLowerCase(),
        confidence: lastResult[i].confidence || 0.5
      });
    }
    
    // Check for wake word in any alternative
    const wakeWordFound = alternatives.some(alt => 
      alt.transcript.includes(this.config.wakeWord) && 
      alt.confidence >= this.config.confidenceThreshold
    );
    
    if (wakeWordFound && !this.wakeWordDetected) {
      this.handleWakeWordDetected();
    } else if (this.wakeWordDetected && lastResult.isFinal) {
      // Process command after wake word
      const command = lastResult[0].transcript;
      this.processVoiceCommand(command);
    }
    
    // Track partial results for analytics
    if (!lastResult.isFinal) {
      this.analyticsBuffer.push({
        timestamp: Date.now(),
        transcript: lastResult[0].transcript,
        confidence: lastResult[0].confidence,
        isFinal: false
      });
    }
  }
  
  handleWakeWordDetected() {
    this.wakeWordDetected = true;
    this.sessionId = this.generateSessionId();
    
    // Notify user with visual/audio feedback
    this.showActivationFeedback();
    
    // Notify background script
    chrome.runtime.sendMessage({
      type: 'VOICE_ACTIVATION',
      method: 'wake_word',
      sessionId: this.sessionId
    });
    
    // Set timeout for command
    this.commandTimeout = setTimeout(() => {
      this.resetVoiceSession();
      this.showTimeoutFeedback();
    }, this.config.commandTimeout);
    
    this.trackEvent('wake_word_detected');
  }
  
  async processVoiceCommand(fullTranscript) {
    if (!this.wakeWordDetected) return;
    
    // Clear timeout
    clearTimeout(this.commandTimeout);
    
    // Extract command (remove wake word)
    const command = fullTranscript
      .toLowerCase()
      .replace(this.config.wakeWord, '')
      .trim();
    
    if (!command) {
      this.showErrorFeedback('No command detected');
      this.resetVoiceSession();
      return;
    }
    
    // Show processing state
    this.showProcessingFeedback(command);
    
    // Track command
    this.trackEvent('voice_command', {
      command: command,
      fullTranscript: fullTranscript,
      sessionId: this.sessionId
    });
    
    try {
      // Send to background for processing
      const response = await chrome.runtime.sendMessage({
        type: 'SPORTS_QUERY',
        query: command,
        context: {
          url: window.location.href,
          title: document.title,
          timestamp: Date.now()
        },
        sessionId: this.sessionId
      });
      
      // Display results
      this.displayQueryResults(response);
      
      // Track success
      this.trackEvent('command_success', {
        sessionId: this.sessionId,
        responseTime: response.processingTime
      });
      
    } catch (error) {
      console.error('Command processing error:', error);
      this.showErrorFeedback('Unable to process command');
      
      // Track error
      this.trackEvent('command_error', {
        sessionId: this.sessionId,
        error: error.message
      });
    }
    
    // Reset for next command
    this.resetVoiceSession();
  }
  
  handleSpeechError(event) {
    console.error('Speech recognition error:', event.error);
    
    // Track error
    this.trackEvent('speech_error', {
      error: event.error,
      message: event.message
    });
    
    // Handle specific errors
    switch (event.error) {
      case 'no-speech':
        // Ignore, this is common during passive listening
        break;
        
      case 'audio-capture':
        this.showErrorFeedback('Microphone access denied');
        break;
        
      case 'not-allowed':
        this.showErrorFeedback('Voice recognition not allowed');
        break;
        
      default:
        // Retry on other errors
        if (this.isListening) {
          setTimeout(() => this.startPassiveListening(), 1000);
        }
    }
  }
  
  handleSpeechEnd() {
    this.isListening = false;
    
    // Restart if we should be listening
    if (!this.isProcessing) {
      setTimeout(() => this.startPassiveListening(), 100);
    }
  }
  
  activateVoiceCommand() {
    // Manual activation via hotkey or button
    this.wakeWordDetected = true;
    this.sessionId = this.generateSessionId();
    
    // Show activation UI
    this.showActivationFeedback();
    
    // Start listening if not already
    if (!this.isListening) {
      this.recognition.start();
    }
    
    // Track activation
    this.trackEvent('manual_activation', {
      method: 'hotkey',
      sessionId: this.sessionId
    });
    
    // Set timeout
    this.commandTimeout = setTimeout(() => {
      this.resetVoiceSession();
      this.showTimeoutFeedback();
    }, this.config.commandTimeout);
  }
  
  // UI Feedback Methods
  showActivationFeedback() {
    // This will be implemented in overlay-ui.js
    document.dispatchEvent(new CustomEvent('hey-fantasy-activated', {
      detail: { sessionId: this.sessionId }
    }));
  }
  
  showProcessingFeedback(command) {
    document.dispatchEvent(new CustomEvent('hey-fantasy-processing', {
      detail: { command, sessionId: this.sessionId }
    }));
  }
  
  showTimeoutFeedback() {
    document.dispatchEvent(new CustomEvent('hey-fantasy-timeout', {
      detail: { sessionId: this.sessionId }
    }));
  }
  
  showErrorFeedback(error) {
    document.dispatchEvent(new CustomEvent('hey-fantasy-error', {
      detail: { error, sessionId: this.sessionId }
    }));
  }
  
  displayQueryResults(response) {
    document.dispatchEvent(new CustomEvent('hey-fantasy-results', {
      detail: { response, sessionId: this.sessionId }
    }));
  }
  
  // Helper Methods
  resetVoiceSession() {
    this.wakeWordDetected = false;
    this.sessionId = null;
    clearTimeout(this.commandTimeout);
    
    // Flush analytics buffer
    if (this.analyticsBuffer.length > 0) {
      this.trackEvent('voice_session_complete', {
        sessionId: this.sessionId,
        partialResults: this.analyticsBuffer
      });
      this.analyticsBuffer = [];
    }
  }
  
  async getUserPreferences() {
    return new Promise((resolve) => {
      chrome.storage.sync.get([
        'voiceEnabled',
        'voiceActivationMethod',
        'preferredLanguage'
      ], (result) => {
        resolve({
          voiceEnabled: result.voiceEnabled !== false,
          voiceActivationMethod: result.voiceActivationMethod || 'both',
          preferredLanguage: result.preferredLanguage || 'en-US'
        });
      });
    });
  }
  
  generateSessionId() {
    return `voice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  trackEvent(eventName, data = {}) {
    chrome.runtime.sendMessage({
      type: 'ANALYTICS_EVENT',
      event: eventName,
      data: {
        ...data,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent
      }
    });
  }
  
  injectVoiceUI() {
    // Signal to overlay-ui.js to inject the UI
    document.dispatchEvent(new Event('hey-fantasy-inject-ui'));
  }
}

// Initialize voice system when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.heyFantasyVoice = new VoiceActivationSystem();
  });
} else {
  window.heyFantasyVoice = new VoiceActivationSystem();
}