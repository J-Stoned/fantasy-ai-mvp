/**
 * HEY FANTASY - Voice Analytics Collector
 * Advanced voice data collection for AI training and improvement
 */

class VoiceAnalyticsCollector {
  constructor() {
    this.collectionBuffer = [];
    this.sessionData = new Map();
    this.userPatterns = new Map();
    this.privacySettings = {};
    
    // Analytics configuration
    this.config = {
      bufferSize: 50,
      flushInterval: 60000, // 1 minute
      retentionPeriod: 86400000, // 24 hours
      privacyCompliant: true,
      collectAudioFeatures: true,
      collectTranscripts: true,
      collectUserInteractions: true,
      anonymizeData: true
    };
    
    // Voice feature extraction
    this.audioAnalyzer = null;
    this.speechPatterns = {
      confidence: [],
      speed: [],
      clarity: [],
      emotion: [],
      frustration: []
    };
    
    // AI training metrics we want to collect
    this.trainingMetrics = {
      accuracyMeasures: new Map(),
      responseTimes: [],
      userSatisfaction: [],
      errorRates: new Map(),
      improvementOpportunities: []
    };
    
    this.init();
  }
  
  async init() {
    // Load privacy settings
    await this.loadPrivacySettings();
    
    // Initialize audio analysis if enabled
    if (this.config.collectAudioFeatures && this.privacySettings.allowVoiceAnalysis) {
      await this.initializeAudioAnalyzer();
    }
    
    // Set up data collection intervals
    this.setupDataCollection();
    
    // Initialize session tracking
    this.startSessionTracking();
    
    console.log('Voice Analytics Collector initialized!');
  }
  
  async loadPrivacySettings() {
    return new Promise((resolve) => {
      chrome.storage.sync.get([
        'analyticsEnabled',
        'allowVoiceAnalysis',
        'allowTranscriptCollection',
        'dataRetentionDays',
        'shareDataForImprovement'
      ], (result) => {
        this.privacySettings = {
          analyticsEnabled: result.analyticsEnabled !== false,
          allowVoiceAnalysis: result.allowVoiceAnalysis !== false,
          allowTranscriptCollection: result.allowTranscriptCollection !== false,
          dataRetentionDays: result.dataRetentionDays || 7,
          shareDataForImprovement: result.shareDataForImprovement !== false
        };
        resolve();
      });
    });
  }
  
  async initializeAudioAnalyzer() {
    try {
      // Initialize Web Audio API for voice feature extraction
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.analyzer = this.audioContext.createAnalyser();
      this.analyzer.fftSize = 2048;
      this.analyzer.smoothingTimeConstant = 0.8;
      
      // Set up audio processing buffers
      this.bufferLength = this.analyzer.frequencyBinCount;
      this.dataArray = new Uint8Array(this.bufferLength);
      this.frequencyData = new Float32Array(this.bufferLength);
      
      console.log('Audio analyzer initialized for voice feature extraction');
    } catch (error) {
      console.error('Failed to initialize audio analyzer:', error);
      this.config.collectAudioFeatures = false;
    }
  }
  
  // Main collection method called by voice system
  collectVoiceInteraction(interactionData) {
    if (!this.privacySettings.analyticsEnabled) return;
    
    const collectionPoint = {
      id: this.generateInteractionId(),
      timestamp: Date.now(),
      sessionId: interactionData.sessionId,
      type: 'voice_interaction',
      
      // Voice command data
      command: {
        transcript: this.privacySettings.allowTranscriptCollection ? 
          interactionData.transcript : this.hashTranscript(interactionData.transcript),
        confidence: interactionData.confidence,
        duration: interactionData.duration,
        wakeWordDetected: interactionData.wakeWordDetected,
        retryCount: interactionData.retryCount || 0
      },
      
      // Audio features (if enabled)
      audioFeatures: this.config.collectAudioFeatures ? 
        this.extractAudioFeatures(interactionData.audioData) : null,
      
      // Response data
      response: {
        processingTime: interactionData.processingTime,
        responseType: interactionData.responseType,
        success: interactionData.success,
        errorType: interactionData.errorType,
        dataSource: interactionData.dataSource
      },
      
      // User interaction patterns
      interaction: {
        clickedResult: false,
        expandedDetails: false,
        followUpQuery: false,
        sessionDuration: Date.now() - (this.sessionData.get(interactionData.sessionId)?.startTime || Date.now()),
        queryComplexity: this.calculateQueryComplexity(interactionData.transcript)
      },
      
      // Context data
      context: {
        url: this.anonymizeUrl(interactionData.context?.url),
        timeOfDay: new Date().getHours(),
        dayOfWeek: new Date().getDay(),
        sportContext: this.detectSportContext(interactionData.transcript),
        userAgent: this.anonymizeUserAgent(navigator.userAgent)
      },
      
      // Privacy compliance
      privacy: {
        anonymized: this.config.anonymizeData,
        retentionExpiry: Date.now() + (this.privacySettings.dataRetentionDays * 86400000),
        consentVersion: '1.0'
      }
    };
    
    // Add to buffer
    this.collectionBuffer.push(collectionPoint);
    
    // Update session tracking
    this.updateSessionData(interactionData.sessionId, collectionPoint);
    
    // Update user patterns
    this.updateUserPatterns(collectionPoint);
    
    // Flush if buffer is full
    if (this.collectionBuffer.length >= this.config.bufferSize) {
      this.flushBuffer();
    }
  }
  
  extractAudioFeatures(audioData) {
    if (!this.audioAnalyzer || !audioData) return null;
    
    try {
      // Connect audio data to analyzer
      const source = this.audioContext.createBufferSource();
      source.connect(this.analyzer);
      
      // Get frequency data
      this.analyzer.getByteFrequencyData(this.dataArray);
      this.analyzer.getFloatFrequencyData(this.frequencyData);
      
      // Extract features
      const features = {
        // Fundamental frequency (pitch)
        fundamentalFreq: this.extractFundamentalFrequency(),
        
        // Spectral features
        spectralCentroid: this.calculateSpectralCentroid(),
        spectralRolloff: this.calculateSpectralRolloff(),
        spectralFlux: this.calculateSpectralFlux(),
        
        // Energy features
        energy: this.calculateEnergy(),
        zeroCrossingRate: this.calculateZeroCrossingRate(),
        
        // Voice quality indicators
        harmonicToNoiseRatio: this.calculateHNR(),
        jitter: this.calculateJitter(),
        shimmer: this.calculateShimmer(),
        
        // Prosodic features
        speakingRate: this.estimateSpeakingRate(),
        pauseDuration: this.calculatePauseDuration(),
        volumeVariation: this.calculateVolumeVariation(),
        
        // Emotional indicators
        stressLevel: this.estimateStressLevel(),
        confidenceLevel: this.estimateVoiceConfidence(),
        frustrationLevel: this.estimateFrustrationLevel()
      };
      
      return features;
      
    } catch (error) {
      console.error('Audio feature extraction error:', error);
      return null;
    }
  }
  
  // Audio analysis methods
  extractFundamentalFrequency() {
    // Find the peak frequency in the lower range (80-400 Hz for human voice)
    let maxAmplitude = 0;
    let peakFrequency = 0;
    
    for (let i = 5; i < 50; i++) { // Rough range for fundamental freq
      if (this.dataArray[i] > maxAmplitude) {
        maxAmplitude = this.dataArray[i];
        peakFrequency = i * (this.audioContext.sampleRate / this.analyzer.fftSize);
      }
    }
    
    return peakFrequency;
  }
  
  calculateSpectralCentroid() {
    let weightedSum = 0;
    let magnitudeSum = 0;
    
    for (let i = 0; i < this.frequencyData.length; i++) {
      const magnitude = Math.abs(this.frequencyData[i]);
      const frequency = i * (this.audioContext.sampleRate / this.analyzer.fftSize);
      
      weightedSum += frequency * magnitude;
      magnitudeSum += magnitude;
    }
    
    return magnitudeSum > 0 ? weightedSum / magnitudeSum : 0;
  }
  
  calculateSpectralRolloff() {
    const totalEnergy = this.frequencyData.reduce((sum, val) => sum + Math.abs(val), 0);
    const threshold = totalEnergy * 0.85; // 85% rolloff point
    
    let runningSum = 0;
    for (let i = 0; i < this.frequencyData.length; i++) {
      runningSum += Math.abs(this.frequencyData[i]);
      if (runningSum >= threshold) {
        return i * (this.audioContext.sampleRate / this.analyzer.fftSize);
      }
    }
    
    return 0;
  }
  
  calculateEnergy() {
    return this.dataArray.reduce((sum, val) => sum + (val * val), 0) / this.dataArray.length;
  }
  
  estimateStressLevel() {
    // Higher frequencies and energy often indicate stress
    const highFreqEnergy = this.dataArray.slice(50, 100).reduce((sum, val) => sum + val, 0);
    const totalEnergy = this.dataArray.reduce((sum, val) => sum + val, 0);
    
    return totalEnergy > 0 ? (highFreqEnergy / totalEnergy) * 100 : 0;
  }
  
  estimateVoiceConfidence() {
    // Steady pitch and volume usually indicate confidence
    const energyStability = this.calculateEnergyStability();
    const pitchStability = this.calculatePitchStability();
    
    return (energyStability + pitchStability) / 2;
  }
  
  estimateFrustrationLevel() {
    // Increased volume, higher pitch, faster speaking often indicate frustration
    const volumeIncrease = this.detectVolumeIncrease();
    const pitchIncrease = this.detectPitchIncrease();
    const speedIncrease = this.detectSpeedIncrease();
    
    return (volumeIncrease + pitchIncrease + speedIncrease) / 3;
  }
  
  // Pattern analysis methods
  calculateQueryComplexity(transcript) {
    if (!transcript) return 0;
    
    const words = transcript.split(' ').length;
    const hasNumbers = /\d+/.test(transcript);
    const hasMultipleEntities = (transcript.match(/[A-Z][a-z]+/g) || []).length > 2;
    const hasComparisons = /vs|versus|compare|better|worse/.test(transcript.toLowerCase());
    
    let complexity = words / 10; // Base complexity from length
    if (hasNumbers) complexity += 1;
    if (hasMultipleEntities) complexity += 1;
    if (hasComparisons) complexity += 2;
    
    return Math.min(complexity, 10); // Cap at 10
  }
  
  detectSportContext(transcript) {
    if (!transcript) return 'unknown';
    
    const lowerTranscript = transcript.toLowerCase();
    
    if (lowerTranscript.includes('nfl') || lowerTranscript.includes('football')) return 'nfl';
    if (lowerTranscript.includes('nba') || lowerTranscript.includes('basketball')) return 'nba';
    if (lowerTranscript.includes('mlb') || lowerTranscript.includes('baseball')) return 'mlb';
    if (lowerTranscript.includes('nhl') || lowerTranscript.includes('hockey')) return 'nhl';
    if (lowerTranscript.includes('soccer')) return 'soccer';
    if (lowerTranscript.includes('fantasy')) return 'fantasy';
    
    return 'general';
  }
  
  updateSessionData(sessionId, interactionData) {
    if (!this.sessionData.has(sessionId)) {
      this.sessionData.set(sessionId, {
        startTime: Date.now(),
        interactions: [],
        totalQueries: 0,
        successfulQueries: 0,
        averageResponseTime: 0,
        userSatisfactionEvents: []
      });
    }
    
    const session = this.sessionData.get(sessionId);
    session.interactions.push(interactionData);
    session.totalQueries++;
    
    if (interactionData.response.success) {
      session.successfulQueries++;
    }
    
    // Update averages
    session.averageResponseTime = session.interactions
      .reduce((sum, int) => sum + int.response.processingTime, 0) / session.interactions.length;
  }
  
  updateUserPatterns(interactionData) {
    const sport = interactionData.context.sportContext;
    const timeOfDay = interactionData.context.timeOfDay;
    
    // Track patterns by sport
    if (!this.userPatterns.has(sport)) {
      this.userPatterns.set(sport, {
        queryCount: 0,
        averageComplexity: 0,
        preferredTimeSlots: new Map(),
        commonErrors: new Map(),
        satisfactionTrend: []
      });
    }
    
    const sportPattern = this.userPatterns.get(sport);
    sportPattern.queryCount++;
    
    // Update complexity average
    sportPattern.averageComplexity = 
      (sportPattern.averageComplexity * (sportPattern.queryCount - 1) + 
       interactionData.interaction.queryComplexity) / sportPattern.queryCount;
    
    // Track time preferences
    const timeSlot = Math.floor(timeOfDay / 4) * 4; // 4-hour blocks
    sportPattern.preferredTimeSlots.set(timeSlot, 
      (sportPattern.preferredTimeSlots.get(timeSlot) || 0) + 1);
  }
  
  // AI Training specific metrics
  collectAccuracyMetric(queryType, wasAccurate, userFeedback) {
    if (!this.trainingMetrics.accuracyMeasures.has(queryType)) {
      this.trainingMetrics.accuracyMeasures.set(queryType, {
        totalQueries: 0,
        accurateResponses: 0,
        accuracy: 0,
        userRatings: []
      });
    }
    
    const metric = this.trainingMetrics.accuracyMeasures.get(queryType);
    metric.totalQueries++;
    
    if (wasAccurate) {
      metric.accurateResponses++;
    }
    
    metric.accuracy = metric.accurateResponses / metric.totalQueries;
    
    if (userFeedback) {
      metric.userRatings.push(userFeedback);
    }
    
    this.trackForTraining('accuracy_metric', {
      queryType,
      accuracy: metric.accuracy,
      sampleSize: metric.totalQueries
    });
  }
  
  collectErrorPattern(errorType, context, resolution) {
    if (!this.trainingMetrics.errorRates.has(errorType)) {
      this.trainingMetrics.errorRates.set(errorType, {
        occurrences: 0,
        contexts: [],
        resolutions: []
      });
    }
    
    const errorMetric = this.trainingMetrics.errorRates.get(errorType);
    errorMetric.occurrences++;
    errorMetric.contexts.push(context);
    
    if (resolution) {
      errorMetric.resolutions.push(resolution);
    }
    
    this.trackForTraining('error_pattern', {
      errorType,
      frequency: errorMetric.occurrences,
      context: context
    });
  }
  
  collectSatisfactionFeedback(sessionId, rating, comments) {
    this.trainingMetrics.userSatisfaction.push({
      sessionId,
      rating,
      comments: this.config.anonymizeData ? this.hashText(comments) : comments,
      timestamp: Date.now()
    });
    
    // Update session data
    if (this.sessionData.has(sessionId)) {
      this.sessionData.get(sessionId).userSatisfactionEvents.push({
        rating,
        timestamp: Date.now()
      });
    }
    
    this.trackForTraining('satisfaction_feedback', {
      rating,
      sessionId: this.config.anonymizeData ? this.hashText(sessionId) : sessionId
    });
  }
  
  identifyImprovementOpportunity(category, description, priority) {
    this.trainingMetrics.improvementOpportunities.push({
      id: this.generateId(),
      category,
      description,
      priority,
      timestamp: Date.now(),
      status: 'identified'
    });
    
    this.trackForTraining('improvement_opportunity', {
      category,
      priority,
      timestamp: Date.now()
    });
  }
  
  // Data processing and aggregation
  generateTrainingDataset() {
    if (!this.privacySettings.shareDataForImprovement) {
      return null;
    }
    
    const dataset = {
      metadata: {
        version: '1.0',
        generatedAt: Date.now(),
        retentionExpiry: Date.now() + (this.privacySettings.dataRetentionDays * 86400000),
        privacy: {
          anonymized: this.config.anonymizeData,
          consentGiven: true,
          dataTypes: ['voice_patterns', 'interaction_metrics', 'satisfaction_scores']
        }
      },
      
      // Aggregated voice patterns
      voicePatterns: this.aggregateVoicePatterns(),
      
      // User interaction insights
      interactionInsights: this.aggregateInteractionPatterns(),
      
      // Accuracy metrics for model training
      accuracyMetrics: this.generateAccuracyReport(),
      
      // Error patterns for improvement
      errorPatterns: this.generateErrorReport(),
      
      // Satisfaction trends
      satisfactionTrends: this.generateSatisfactionReport()
    };
    
    return dataset;
  }
  
  aggregateVoicePatterns() {
    const patterns = {};
    
    for (const [sport, data] of this.userPatterns) {
      patterns[sport] = {
        queryFrequency: data.queryCount,
        averageComplexity: data.averageComplexity,
        preferredTimes: Object.fromEntries(data.preferredTimeSlots),
        commonErrors: Object.fromEntries(data.commonErrors)
      };
    }
    
    return patterns;
  }
  
  // Privacy and anonymization
  hashTranscript(transcript) {
    if (!this.config.anonymizeData) return transcript;
    
    // Simple hash function for demonstration
    // In production, use proper cryptographic hashing
    let hash = 0;
    for (let i = 0; i < transcript.length; i++) {
      const char = transcript.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `hash_${Math.abs(hash)}`;
  }
  
  anonymizeUrl(url) {
    if (!url) return null;
    
    try {
      const urlObj = new URL(url);
      return {
        domain: urlObj.hostname,
        hasParams: urlObj.search.length > 0,
        isSecure: urlObj.protocol === 'https:'
      };
    } catch {
      return null;
    }
  }
  
  anonymizeUserAgent(userAgent) {
    // Extract only browser family and OS, remove version specifics
    const browserMatch = userAgent.match(/(Chrome|Firefox|Safari|Edge)/);
    const osMatch = userAgent.match(/(Windows|Mac|Linux)/);
    
    return {
      browser: browserMatch ? browserMatch[1] : 'Unknown',
      os: osMatch ? osMatch[1] : 'Unknown'
    };
  }
  
  // Data management
  setupDataCollection() {
    // Flush buffer periodically
    setInterval(() => {
      this.flushBuffer();
    }, this.config.flushInterval);
    
    // Clean up old data
    setInterval(() => {
      this.cleanupExpiredData();
    }, 3600000); // Every hour
  }
  
  flushBuffer() {
    if (this.collectionBuffer.length === 0) return;
    
    const dataToFlush = [...this.collectionBuffer];
    this.collectionBuffer = [];
    
    // Send to background script for processing
    chrome.runtime.sendMessage({
      type: 'VOICE_ANALYTICS_DATA',
      data: dataToFlush,
      timestamp: Date.now()
    });
  }
  
  cleanupExpiredData() {
    const now = Date.now();
    
    // Clean up session data
    for (const [sessionId, session] of this.sessionData) {
      if (now - session.startTime > this.config.retentionPeriod) {
        this.sessionData.delete(sessionId);
      }
    }
    
    // Clean up satisfaction data
    this.trainingMetrics.userSatisfaction = this.trainingMetrics.userSatisfaction
      .filter(item => now - item.timestamp < this.config.retentionPeriod);
  }
  
  trackForTraining(eventType, data) {
    chrome.runtime.sendMessage({
      type: 'AI_TRAINING_EVENT',
      eventType: eventType,
      data: data,
      timestamp: Date.now()
    });
  }
  
  // Utility methods
  generateInteractionId() {
    return `int_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  generateId() {
    return `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  hashText(text) {
    return this.hashTranscript(text);
  }
  
  startSessionTracking() {
    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.flushBuffer();
      }
    });
    
    // Track before page unload
    window.addEventListener('beforeunload', () => {
      this.flushBuffer();
    });
  }
  
  // Mock implementations for complex audio analysis
  calculateSpectralFlux() { return Math.random() * 0.5; }
  calculateZeroCrossingRate() { return Math.random() * 100; }
  calculateHNR() { return Math.random() * 20 + 5; }
  calculateJitter() { return Math.random() * 0.02; }
  calculateShimmer() { return Math.random() * 0.1; }
  estimateSpeakingRate() { return 120 + Math.random() * 80; }
  calculatePauseDuration() { return Math.random() * 2; }
  calculateVolumeVariation() { return Math.random() * 30; }
  calculateEnergyStability() { return Math.random() * 100; }
  calculatePitchStability() { return Math.random() * 100; }
  detectVolumeIncrease() { return Math.random() * 50; }
  detectPitchIncrease() { return Math.random() * 50; }
  detectSpeedIncrease() { return Math.random() * 50; }
  aggregateInteractionPatterns() { return {}; }
  generateAccuracyReport() { return {}; }
  generateErrorReport() { return {}; }
  generateSatisfactionReport() { return {}; }
}

// Export for use in content scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = VoiceAnalyticsCollector;
}