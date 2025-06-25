import { z } from "zod";

export const BiometricTypeSchema = z.enum([
  "heart_rate",
  "sleep_quality", 
  "stress_level",
  "activity_level",
  "sleep_duration",
  "recovery_score"
]);

export const BiometricDataSchema = z.object({
  userId: z.string(),
  type: BiometricTypeSchema,
  value: z.number(),
  timestamp: z.date(),
  source: z.enum(["apple_health", "google_fit", "fitbit", "garmin", "manual"]),
  context: z.string().optional(),
});

export const BiometricLineupAdjustmentSchema = z.object({
  playerId: z.string(),
  adjustment: z.number(), // -1 to 1 multiplier
  reason: z.string(),
  confidence: z.number(), // 0 to 1
});

export type BiometricType = z.infer<typeof BiometricTypeSchema>;
export type BiometricData = z.infer<typeof BiometricDataSchema>;
export type BiometricLineupAdjustment = z.infer<typeof BiometricLineupAdjustmentSchema>;

export class BiometricFantasyEngine {
  private readonly healthKitAvailable = typeof window !== 'undefined' && 'HealthKit' in window;
  private readonly webBluetoothAvailable = typeof navigator !== 'undefined' && 'bluetooth' in navigator;
  private readonly webHIDAvailable = typeof navigator !== 'undefined' && 'hid' in navigator;
  
  // Connection states
  private healthKitConnected = false;
  private googleFitConnected = false;
  private fitbitConnected = false;
  private garminConnected = false;
  private polarH10Connected = false; // Heart rate strap
  
  // Real-time monitoring
  private realTimeMonitoring = false;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private lastBiometricReading: Date | null = null;
  
  // Event emitters for real-time data
  private biometricSubscribers = new Map<string, Set<(data: BiometricData) => void>>();

  // Biometric thresholds for fantasy decision-making
  private readonly thresholds = {
    heart_rate: {
      resting_low: 60,
      resting_high: 100,
      stress_threshold: 120,
    },
    sleep_quality: {
      poor: 60, // percentage
      good: 80,
      excellent: 90,
    },
    stress_level: {
      low: 30,
      moderate: 60,
      high: 80,
    },
    recovery_score: {
      poor: 40,
      average: 70,
      excellent: 85,
    }
  };

  async connectHealthKit(): Promise<boolean> {
    if (!this.healthKitAvailable) {
      console.warn("HealthKit not available - using Web APIs fallback");
      return this.connectWebHealthAPIs();
    }

    try {
      // Request comprehensive HealthKit permissions
      const permissions = {
        toRead: [
          'HKQuantityTypeIdentifierHeartRate',
          'HKQuantityTypeIdentifierHeartRateVariabilitySDNN',
          'HKQuantityTypeIdentifierSleepAnalysis', 
          'HKQuantityTypeIdentifierActiveEnergyBurned',
          'HKQuantityTypeIdentifierStepCount',
          'HKQuantityTypeIdentifierRestingHeartRate',
          'HKQuantityTypeIdentifierVO2Max',
          'HKQuantityTypeIdentifierBloodPressureSystolic',
          'HKQuantityTypeIdentifierBloodPressureDiastolic',
          'HKQuantityTypeIdentifierBodyTemperature',
          'HKQuantityTypeIdentifierOxygenSaturation',
          'HKCategoryTypeIdentifierStressLevel'
        ]
      };

      // @ts-ignore - HealthKit types not available
      await window.HealthKit.requestAuthorization(permissions);
      this.healthKitConnected = true;
      
      // Start real-time monitoring
      this.startRealTimeHealthKitMonitoring();
      
      console.log("✅ HealthKit connected with comprehensive biometric access");
      return true;
    } catch (error) {
      console.error("HealthKit connection failed:", error);
      return this.connectWebHealthAPIs(); // Fallback
    }
  }

  /**
   * Fallback to Web APIs when HealthKit isn't available
   */
  private async connectWebHealthAPIs(): Promise<boolean> {
    let connected = false;
    
    // Try Web Bluetooth for heart rate monitors
    if (this.webBluetoothAvailable) {
      try {
        connected = await this.connectBluetoothHeartRate() || connected;
      } catch (error) {
        console.log("Bluetooth heart rate not available");
      }
    }
    
    // Try WebHID for advanced devices
    if (this.webHIDAvailable) {
      try {
        connected = await this.connectHIDDevices() || connected;
      } catch (error) {
        console.log("HID devices not available");
      }
    }
    
    // Use device sensors as fallback
    connected = await this.connectDeviceSensors() || connected;
    
    return connected;
  }

  /**
   * Connect to Bluetooth heart rate monitors (Polar, Garmin, etc.)
   */
  private async connectBluetoothHeartRate(): Promise<boolean> {
    try {
      // @ts-ignore
      const device = await navigator.bluetooth.requestDevice({
        filters: [
          { services: ['heart_rate'] },
          { namePrefix: 'Polar H10' },
          { namePrefix: 'Garmin HRM' },
          { namePrefix: 'Wahoo' }
        ],
        optionalServices: ['heart_rate', 'battery_service']
      });

      // @ts-ignore
      const server = await device.gatt.connect();
      const service = await server.getPrimaryService('heart_rate');
      const characteristic = await service.getCharacteristic('heart_rate_measurement');
      
      // Listen for heart rate data
      characteristic.addEventListener('characteristicvaluechanged', (event: any) => {
        const heartRate = this.parseHeartRateData(event.target.value);
        this.emitBiometricData({
          userId: this.getCurrentUserId(),
          type: 'heart_rate',
          value: heartRate,
          timestamp: new Date(),
          source: 'bluetooth_hr',
          context: 'real_time_monitoring'
        });
      });

      await characteristic.startNotifications();
      this.polarH10Connected = true;
      
      console.log("✅ Bluetooth heart rate monitor connected");
      return true;
    } catch (error) {
      console.log("Bluetooth heart rate connection failed:", error);
      return false;
    }
  }

  /**
   * Connect to HID devices (advanced fitness trackers)
   */
  private async connectHIDDevices(): Promise<boolean> {
    try {
      // @ts-ignore
      const devices = await navigator.hid.requestDevice({
        filters: [
          { vendorId: 0x1234 }, // Example vendor IDs for fitness devices
          { vendorId: 0x5678 }
        ]
      });

      for (const device of devices) {
        await device.open();
        device.addEventListener('inputreport', (event: any) => {
          const biometricData = this.parseHIDData(event.data);
          if (biometricData) {
            this.emitBiometricData(biometricData);
          }
        });
      }

      return devices.length > 0;
    } catch (error) {
      console.log("HID device connection failed:", error);
      return false;
    }
  }

  /**
   * Use device sensors (accelerometer, gyroscope) for activity detection
   */
  private async connectDeviceSensors(): Promise<boolean> {
    try {
      if ('Accelerometer' in window) {
        // @ts-ignore
        const sensor = new Accelerometer({ frequency: 60 });
        sensor.addEventListener('reading', () => {
          const activityLevel = this.calculateActivityFromAccelerometer(
            sensor.x, sensor.y, sensor.z
          );
          
          if (activityLevel > 0.1) { // Only emit when there's significant activity
            this.emitBiometricData({
              userId: this.getCurrentUserId(),
              type: 'activity_level',
              value: activityLevel,
              timestamp: new Date(),
              source: 'device_sensors',
              context: 'activity_detection'
            });
          }
        });
        sensor.start();
        
        console.log("✅ Device sensors connected");
        return true;
      }
    } catch (error) {
      console.log("Device sensors not available:", error);
    }
    
    return false;
  }

  /**
   * Start real-time HealthKit monitoring
   */
  private startRealTimeHealthKitMonitoring(): void {
    if (!this.healthKitConnected) return;
    
    this.realTimeMonitoring = true;
    
    // Monitor heart rate every 30 seconds
    this.monitoringInterval = setInterval(async () => {
      try {
        const heartRateData = await this.getLatestHealthKitData('HKQuantityTypeIdentifierHeartRate');
        const stressData = await this.getLatestHealthKitData('HKCategoryTypeIdentifierStressLevel');
        
        if (heartRateData) {
          this.emitBiometricData({
            userId: this.getCurrentUserId(),
            type: 'heart_rate',
            value: heartRateData.value,
            timestamp: new Date(heartRateData.timestamp),
            source: 'apple_health',
            context: 'real_time_monitoring'
          });
        }
        
        if (stressData) {
          this.emitBiometricData({
            userId: this.getCurrentUserId(),
            type: 'stress_level',
            value: stressData.value,
            timestamp: new Date(stressData.timestamp),
            source: 'apple_health',
            context: 'stress_monitoring'
          });
        }
        
        this.lastBiometricReading = new Date();
      } catch (error) {
        console.error("Real-time monitoring error:", error);
      }
    }, 30000); // 30 second intervals
  }

  /**
   * Get latest data from HealthKit
   */
  private async getLatestHealthKitData(dataType: string): Promise<{ value: number; timestamp: string } | null> {
    try {
      // @ts-ignore
      const result = await window.HealthKit.querySampleType({
        sampleType: dataType,
        limit: 1,
        ascending: false
      });
      
      if (result && result.length > 0) {
        return {
          value: result[0].quantity,
          timestamp: result[0].startDate
        };
      }
    } catch (error) {
      console.error(`Error fetching ${dataType}:`, error);
    }
    
    return null;
  }

  async connectGoogleFit(): Promise<boolean> {
    try {
      // Google Fit Web API integration
      const response = await fetch('https://www.googleapis.com/auth/fitness.activity.read', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + await this.getGoogleFitToken(),
          'Content-Type': 'application/json',
        }
      });
      return response.ok;
    } catch (error) {
      console.error("Google Fit connection failed:", error);
      return false;
    }
  }

  async connectFitbit(): Promise<boolean> {
    try {
      // Fitbit Web API OAuth flow
      const clientId = process.env.NEXT_PUBLIC_FITBIT_CLIENT_ID;
      const redirectUri = `${window.location.origin}/auth/fitbit/callback`;
      
      const authUrl = `https://www.fitbit.com/oauth2/authorize?` +
        `client_id=${clientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=heartrate%20sleep%20activity&` +
        `response_type=code`;

      window.location.href = authUrl;
      return true;
    } catch (error) {
      console.error("Fitbit connection failed:", error);
      return false;
    }
  }

  async getBiometricData(
    userId: string,
    type: BiometricType,
    timeRange: { start: Date; end: Date }
  ): Promise<BiometricData[]> {
    // This would integrate with various health APIs
    // For now, we'll simulate data
    return this.simulateBiometricData(userId, type, timeRange);
  }

  async generateLineupRecommendations(
    userId: string,
    currentLineup: { playerId: string; position: string; projectedPoints: number }[],
    gameTime: Date
  ): Promise<{
    adjustments: BiometricLineupAdjustment[];
    userState: {
      stress_level: number;
      sleep_quality: number;
      decision_confidence: number;
    };
    recommendations: string[];
  }> {
    // Get recent biometric data
    const now = new Date();
    const timeRange = {
      start: new Date(now.getTime() - 24 * 60 * 60 * 1000), // Last 24 hours
      end: now
    };

    const [heartRateData, sleepData, stressData] = await Promise.all([
      this.getBiometricData(userId, "heart_rate", timeRange),
      this.getBiometricData(userId, "sleep_quality", timeRange),
      this.getBiometricData(userId, "stress_level", timeRange),
    ]);

    const userState = this.analyzeUserState(heartRateData, sleepData, stressData);
    const adjustments = this.calculateLineupAdjustments(currentLineup, userState, gameTime);
    const recommendations = this.generateRecommendations(userState);

    return {
      adjustments,
      userState,
      recommendations
    };
  }

  private analyzeUserState(
    heartRateData: BiometricData[],
    sleepData: BiometricData[],
    stressData: BiometricData[]
  ): {
    stress_level: number;
    sleep_quality: number;
    decision_confidence: number;
  } {
    // Analyze sleep quality
    const avgSleepQuality = sleepData.length > 0 
      ? sleepData.reduce((sum, d) => sum + d.value, 0) / sleepData.length 
      : 75; // Default

    // Analyze stress from heart rate variability
    const avgHeartRate = heartRateData.length > 0
      ? heartRateData.reduce((sum, d) => sum + d.value, 0) / heartRateData.length
      : 70; // Default

    const stressLevel = stressData.length > 0
      ? stressData[stressData.length - 1].value // Latest stress reading
      : this.estimateStressFromHeartRate(avgHeartRate);

    // Calculate decision confidence based on sleep and stress
    const sleepFactor = Math.max(0, Math.min(1, avgSleepQuality / 100));
    const stressFactor = Math.max(0, Math.min(1, (100 - stressLevel) / 100));
    const decisionConfidence = (sleepFactor * 0.6 + stressFactor * 0.4) * 100;

    return {
      stress_level: stressLevel,
      sleep_quality: avgSleepQuality,
      decision_confidence: decisionConfidence
    };
  }

  private calculateLineupAdjustments(
    lineup: { playerId: string; position: string; projectedPoints: number }[],
    userState: {
      stress_level: number;
      sleep_quality: number;
      decision_confidence: number;
    },
    gameTime: Date
  ): BiometricLineupAdjustment[] {
    const adjustments: BiometricLineupAdjustment[] = [];

    // If user is stressed or sleep-deprived, recommend safer plays
    const riskTolerance = userState.decision_confidence / 100;
    
    lineup.forEach(player => {
      let adjustment = 0;
      let reason = "";
      let confidence = 0.7;

      // High stress = prefer safer, more consistent players
      if (userState.stress_level > this.thresholds.stress_level.high) {
        if (this.isHighVariancePlayer(player.playerId)) {
          adjustment = -0.2; // Reduce preference for boom/bust players
          reason = "High stress detected - recommending safer play";
          confidence = 0.8;
        }
      }

      // Poor sleep = avoid complex decisions
      if (userState.sleep_quality < this.thresholds.sleep_quality.poor) {
        if (this.isComplexDecision(player.playerId)) {
          adjustment = -0.15;
          reason = "Poor sleep quality - simplifying lineup decisions";
          confidence = 0.75;
        }
      }

      // Low decision confidence = stick with projections
      if (userState.decision_confidence < 60) {
        if (this.isContrarianPlay(player.playerId)) {
          adjustment = -0.3;
          reason = "Low decision confidence - avoiding contrarian plays";
          confidence = 0.85;
        }
      }

      // High confidence = allow for more aggressive plays
      if (userState.decision_confidence > 85 && userState.stress_level < 40) {
        if (this.isHighUpsidePlay(player.playerId)) {
          adjustment = 0.15;
          reason = "High confidence and low stress - enabling aggressive upside plays";
          confidence = 0.7;
        }
      }

      if (adjustment !== 0) {
        adjustments.push({
          playerId: player.playerId,
          adjustment,
          reason,
          confidence
        });
      }
    });

    return adjustments;
  }

  private generateRecommendations(userState: {
    stress_level: number;
    sleep_quality: number;
    decision_confidence: number;
  }): string[] {
    const recommendations: string[] = [];

    if (userState.stress_level > this.thresholds.stress_level.high) {
      recommendations.push(
        "🧘 High stress detected. Consider meditation before making lineup decisions.",
        "💚 Prefer safer, more consistent players today.",
        "⏰ Set lineup early to avoid last-minute stress."
      );
    }

    if (userState.sleep_quality < this.thresholds.sleep_quality.poor) {
      recommendations.push(
        "😴 Poor sleep detected. Stick to projected lineups rather than getting creative.",
        "☕ Consider postponing major trade decisions until you're well-rested.",
        "🤖 Let AI handle complex decisions today."
      );
    }

    if (userState.decision_confidence < 50) {
      recommendations.push(
        "🎯 Focus on your top-projected players only.",
        "📊 Avoid contrarian plays and trust the consensus.",
        "🤝 Consider consulting with league mates before major decisions."
      );
    }

    if (userState.decision_confidence > 85 && userState.stress_level < 40) {
      recommendations.push(
        "🚀 You're in optimal decision-making mode! Perfect time for bold moves.",
        "💎 Consider high-upside plays with your confident state.",
        "📈 Great time to explore trade opportunities."
      );
    }

    if (recommendations.length === 0) {
      recommendations.push(
        "✅ Your biometrics look good for making fantasy decisions!",
        "🎮 You're in a great state to trust your instincts."
      );
    }

    return recommendations;
  }

  // Helper methods for player analysis
  private isHighVariancePlayer(playerId: string): boolean {
    // This would check player variance in projections/performance
    return Math.random() > 0.7; // Placeholder
  }

  private isComplexDecision(playerId: string): boolean {
    // This would identify players with complex situational factors
    return Math.random() > 0.8; // Placeholder
  }

  private isContrarianPlay(playerId: string): boolean {
    // This would identify players going against consensus
    return Math.random() > 0.75; // Placeholder
  }

  private isHighUpsidePlay(playerId: string): boolean {
    // This would identify high-ceiling players
    return Math.random() > 0.6; // Placeholder
  }

  private estimateStressFromHeartRate(avgHeartRate: number): number {
    if (avgHeartRate > this.thresholds.heart_rate.stress_threshold) return 80;
    if (avgHeartRate > this.thresholds.heart_rate.resting_high) return 60;
    if (avgHeartRate < this.thresholds.heart_rate.resting_low) return 30;
    return 45;
  }

  private async getGoogleFitToken(): Promise<string> {
    // This would handle Google OAuth flow
    return "mock-token";
  }

  private simulateBiometricData(
    userId: string,
    type: BiometricType,
    timeRange: { start: Date; end: Date }
  ): BiometricData[] {
    const data: BiometricData[] = [];
    const hours = Math.floor((timeRange.end.getTime() - timeRange.start.getTime()) / (1000 * 60 * 60));
    
    for (let i = 0; i < Math.min(hours, 24); i++) {
      const timestamp = new Date(timeRange.start.getTime() + i * 60 * 60 * 1000);
      let value: number;

      switch (type) {
        case "heart_rate":
          value = 65 + Math.random() * 15; // 65-80 bpm
          break;
        case "sleep_quality":
          value = 70 + Math.random() * 25; // 70-95%
          break;
        case "stress_level":
          value = 20 + Math.random() * 40; // 20-60
          break;
        case "activity_level":
          value = Math.random() * 100; // 0-100%
          break;
        case "sleep_duration":
          value = 6 + Math.random() * 3; // 6-9 hours
          break;
        case "recovery_score":
          value = 60 + Math.random() * 35; // 60-95
          break;
        default:
          value = 50 + Math.random() * 50;
      }

      data.push({
        userId,
        type,
        value,
        timestamp,
        source: "manual",
      });
    }

    return data;
  }

  /**
   * Real-time game stress tracking with intervention
   */
  async trackGameStress(
    userId: string,
    gameId: string,
    players: string[]
  ): Promise<{
    baselineHeartRate: number;
    peakHeartRate: number;
    stressEvents: { timestamp: Date; heartRate: number; trigger: string }[];
    recommendations: string[];
    interventionTriggered: boolean;
    emotionalTradingRisk: 'low' | 'medium' | 'high' | 'critical';
  }> {
    // Get baseline heart rate from recent history
    const baselineData = await this.getUserBaseline(userId);
    const baselineHeartRate = baselineData.restingHeartRate || 72;
    
    const stressEvents: any[] = [];
    let peakHeartRate = baselineHeartRate;
    let interventionTriggered = false;
    
    // Start real-time monitoring for this game
    const gameMonitoringInterval = setInterval(async () => {
      const currentBiometrics = await this.getCurrentBiometrics(userId);
      
      if (currentBiometrics.heartRate > baselineHeartRate * 1.3) {
        // 30%+ increase indicates stress
        const stressEvent = {
          timestamp: new Date(),
          heartRate: currentBiometrics.heartRate,
          trigger: await this.identifyStressTrigger(gameId, players)
        };
        
        stressEvents.push(stressEvent);
        peakHeartRate = Math.max(peakHeartRate, currentBiometrics.heartRate);
        
        // Trigger intervention if heart rate exceeds 150% of baseline
        if (currentBiometrics.heartRate > baselineHeartRate * 1.5) {
          interventionTriggered = true;
          this.triggerEmotionalTradingProtection(userId, currentBiometrics);
        }
      }
    }, 10000); // Check every 10 seconds during games
    
    // Stop monitoring after 4 hours (max game time)
    setTimeout(() => {
      clearInterval(gameMonitoringInterval);
    }, 4 * 60 * 60 * 1000);

    const emotionalTradingRisk = this.calculateEmotionalTradingRisk(
      baselineHeartRate,
      peakHeartRate,
      stressEvents.length
    );

    const recommendations = this.generateStressRecommendations(
      baselineHeartRate,
      peakHeartRate,
      emotionalTradingRisk
    );

    return {
      baselineHeartRate,
      peakHeartRate,
      stressEvents,
      recommendations,
      interventionTriggered,
      emotionalTradingRisk
    };
  }

  /**
   * Emotional trading protection system
   */
  private async triggerEmotionalTradingProtection(
    userId: string,
    biometrics: { heartRate: number; stressLevel: number }
  ): Promise<void> {
    console.log(`🚨 Emotional trading protection activated for user ${userId}`);
    
    // Create "cooling off" period
    const coolingPeriod = this.calculateCoolingPeriod(biometrics);
    
    // Emit protection event
    this.emitBiometricData({
      userId,
      type: 'stress_level',
      value: biometrics.stressLevel,
      timestamp: new Date(),
      source: 'emotional_protection',
      context: `cooling_period_${coolingPeriod}`
    });

    // Send notification to user
    this.sendEmotionalProtectionNotification(userId, {
      type: 'trading_restriction',
      duration: coolingPeriod,
      message: `High stress detected (❤️ ${biometrics.heartRate} BPM). Trading restricted for ${coolingPeriod} minutes to protect against emotional decisions.`,
      suggestions: [
        "Take 5 deep breaths",
        "Step away from the screen",
        "Drink some water",
        "Remember: it's just one game"
      ]
    });
  }

  /**
   * Calculate optimal cooling period based on stress level
   */
  private calculateCoolingPeriod(biometrics: { heartRate: number; stressLevel: number }): number {
    const baselineCooling = 15; // 15 minutes base
    const heartRateMultiplier = Math.max(1, (biometrics.heartRate - 80) / 20);
    const stressMultiplier = Math.max(1, biometrics.stressLevel / 50);
    
    return Math.min(120, Math.round(baselineCooling * heartRateMultiplier * stressMultiplier)); // Max 2 hours
  }

  /**
   * Calculate emotional trading risk level
   */
  private calculateEmotionalTradingRisk(
    baseline: number,
    peak: number,
    stressEventCount: number
  ): 'low' | 'medium' | 'high' | 'critical' {
    const heartRateIncrease = (peak - baseline) / baseline;
    
    if (heartRateIncrease > 0.6 || stressEventCount > 5) return 'critical';
    if (heartRateIncrease > 0.4 || stressEventCount > 3) return 'high';
    if (heartRateIncrease > 0.2 || stressEventCount > 1) return 'medium';
    return 'low';
  }

  /**
   * Generate stress management recommendations
   */
  private generateStressRecommendations(
    baseline: number,
    peak: number,
    riskLevel: string
  ): string[] {
    const recommendations: string[] = [];
    
    const increase = ((peak - baseline) / baseline) * 100;
    
    if (increase > 50) {
      recommendations.push(
        "🚨 Heart rate spiked 50%+ above baseline - step away and practice breathing exercises"
      );
      recommendations.push(
        "🧘‍♂️ Try the 4-7-8 breathing technique: inhale 4, hold 7, exhale 8"
      );
      recommendations.push(
        "⏰ Trading is temporarily restricted to protect against emotional decisions"
      );
    } else if (increase > 30) {
      recommendations.push(
        "⚠️ Elevated stress detected - consider taking breaks during commercial breaks"
      );
      recommendations.push(
        "🚫 Avoid making any major roster moves until stress levels normalize"
      );
    } else if (increase > 15) {
      recommendations.push(
        "📊 Slightly elevated stress - monitor your reactions to game events"
      );
    }
    
    // Always include general advice
    recommendations.push(
      "💧 Stay hydrated and maintain perspective - fantasy is for fun!",
      "📱 Consider enabling stress alerts for future games"
    );

    return recommendations;
  }

  // Helper methods for biometric data processing
  private parseHeartRateData(dataView: DataView): number {
    // Parse Bluetooth heart rate characteristic data
    const flags = dataView.getUint8(0);
    const is16Bit = flags & 0x01;
    
    if (is16Bit) {
      return dataView.getUint16(1, true); // Little endian
    } else {
      return dataView.getUint8(1);
    }
  }

  private parseHIDData(data: DataView): BiometricData | null {
    // Parse HID device data (would be device-specific)
    // This is a simplified example
    try {
      const type = data.getUint8(0);
      const value = data.getFloat32(1, true);
      
      const typeMap: Record<number, BiometricType> = {
        1: 'heart_rate',
        2: 'stress_level',
        3: 'activity_level'
      };
      
      if (typeMap[type]) {
        return {
          userId: this.getCurrentUserId(),
          type: typeMap[type],
          value,
          timestamp: new Date(),
          source: 'hid_device'
        };
      }
    } catch (error) {
      console.error("Error parsing HID data:", error);
    }
    
    return null;
  }

  private calculateActivityFromAccelerometer(x: number, y: number, z: number): number {
    // Calculate magnitude of acceleration vector
    const magnitude = Math.sqrt(x * x + y * y + z * z);
    
    // Normalize to 0-1 scale (removing gravity ~9.8 m/s²)
    const activity = Math.max(0, (magnitude - 9.8) / 10);
    
    return Math.min(1, activity);
  }

  private emitBiometricData(data: BiometricData): void {
    // Emit to all subscribers for this data type
    const subscribers = this.biometricSubscribers.get(data.type);
    if (subscribers) {
      subscribers.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error("Error in biometric subscriber:", error);
        }
      });
    }
    
    // Also emit to general subscribers
    const generalSubscribers = this.biometricSubscribers.get('all');
    if (generalSubscribers) {
      generalSubscribers.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error("Error in general biometric subscriber:", error);
        }
      });
    }
  }

  private getCurrentUserId(): string {
    // This would get the current user ID from your auth system
    return 'current-user-id';
  }

  private async getUserBaseline(userId: string): Promise<{ restingHeartRate: number; averageStress: number }> {
    // Get user's baseline metrics from recent history
    const timeRange = {
      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
      end: new Date()
    };
    
    const heartRateData = await this.getBiometricData(userId, 'heart_rate', timeRange);
    const stressData = await this.getBiometricData(userId, 'stress_level', timeRange);
    
    const avgHeartRate = heartRateData.length > 0 
      ? heartRateData.reduce((sum, d) => sum + d.value, 0) / heartRateData.length 
      : 72;
    
    const avgStress = stressData.length > 0
      ? stressData.reduce((sum, d) => sum + d.value, 0) / stressData.length
      : 30;
    
    return {
      restingHeartRate: avgHeartRate,
      averageStress: avgStress
    };
  }

  private async getCurrentBiometrics(userId: string): Promise<{ heartRate: number; stressLevel: number }> {
    // Get current biometric readings
    const now = new Date();
    const recent = new Date(now.getTime() - 2 * 60 * 1000); // Last 2 minutes
    
    const recentHeartRate = await this.getBiometricData(userId, 'heart_rate', { start: recent, end: now });
    const recentStress = await this.getBiometricData(userId, 'stress_level', { start: recent, end: now });
    
    return {
      heartRate: recentHeartRate.length > 0 ? recentHeartRate[0].value : 72,
      stressLevel: recentStress.length > 0 ? recentStress[0].value : 30
    };
  }

  private async identifyStressTrigger(gameId: string, players: string[]): Promise<string> {
    // This would integrate with real-time game data to identify what caused the stress spike
    const triggers = [
      "Your quarterback threw an interception",
      "Opponent scored a touchdown",
      "Your kicker missed a field goal", 
      "Star player left the game with injury",
      "Fumble in the red zone",
      "Missed opportunity for points"
    ];
    
    return triggers[Math.floor(Math.random() * triggers.length)];
  }

  private sendEmotionalProtectionNotification(userId: string, notification: any): void {
    // Send notification through your app's notification system
    console.log(`📱 Emotional protection notification sent to ${userId}:`, notification);
    
    // Emit event for UI to handle
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('biometric-protection', {
        detail: notification
      }));
    }
  }

  /**
   * Public API for subscribing to biometric updates
   */
  subscribeToBiometricUpdates(
    type: BiometricType | 'all',
    callback: (data: BiometricData) => void
  ): () => void {
    if (!this.biometricSubscribers.has(type)) {
      this.biometricSubscribers.set(type, new Set());
    }
    
    this.biometricSubscribers.get(type)!.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.biometricSubscribers.get(type)?.delete(callback);
    };
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): {
    healthKit: boolean;
    googleFit: boolean;
    fitbit: boolean;
    bluetooth: boolean;
    realTimeMonitoring: boolean;
  } {
    return {
      healthKit: this.healthKitConnected,
      googleFit: this.googleFitConnected,
      fitbit: this.fitbitConnected,
      bluetooth: this.polarH10Connected,
      realTimeMonitoring: this.realTimeMonitoring
    };
  }

  /**
   * Stop all biometric monitoring
   */
  stopMonitoring(): void {
    this.realTimeMonitoring = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    // Clear all subscribers
    this.biometricSubscribers.clear();
    
    console.log("🛑 Biometric monitoring stopped");
  }
}

// Export singleton instance
export const biometricEngine = new BiometricFantasyEngine();