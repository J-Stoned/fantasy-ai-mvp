/**
 * Weather Impact Analysis Model
 * Predicts how weather conditions affect player performance
 */

import * as tf from '@tensorflow/tfjs';
import { BaseMLModel, ModelConfig, PredictionResult } from '../base-model';

export interface WeatherConditions {
  temperature: number; // Fahrenheit
  windSpeed: number; // MPH
  windDirection: string; // N, S, E, W, NE, etc.
  precipitation: number; // Inches per hour
  precipitationType: 'none' | 'rain' | 'snow' | 'sleet';
  humidity: number; // Percentage
  pressure: number; // Millibars
  visibility: number; // Miles
  cloudCover: number; // Percentage
  stadiumType: 'dome' | 'retractable' | 'outdoor';
  fieldType: 'grass' | 'turf';
  altitude: number; // Feet above sea level
}

export interface PlayerWeatherProfile {
  playerId: string;
  position: string;
  
  // Historical weather performance
  coldWeatherGames: number;
  coldWeatherAverage: number;
  warmWeatherGames: number;
  warmWeatherAverage: number;
  
  windGames: number;
  windAverage: number;
  precipitationGames: number;
  precipitationAverage: number;
  
  domeGames: number;
  domeAverage: number;
  outdoorGames: number;
  outdoorAverage: number;
  
  // Player style factors
  deepThreatPercentage?: number; // For WRs
  outsideRunPercentage?: number; // For RBs
  passingStyle?: 'deep' | 'intermediate' | 'short'; // For QBs
  kickingRange?: number; // For kickers
}

export interface WeatherImpact {
  impactScore: number; // -1 to 1 (-1 = very negative, 1 = very positive)
  projectionMultiplier: number; // Apply to base projection
  confidenceAdjustment: number; // Increase/decrease confidence
  keyFactors: {
    factor: string;
    impact: number;
    description: string;
  }[];
  positionSpecificImpacts: {
    metric: string;
    adjustment: number;
    reason: string;
  }[];
  recommendation: string;
}

export class WeatherImpactModel extends BaseMLModel {
  private readonly windDirectionEncodings: Record<string, number[]> = {
    'N': [1, 0, 0, 0],
    'S': [0, 1, 0, 0],
    'E': [0, 0, 1, 0],
    'W': [0, 0, 0, 1],
    'NE': [0.7, 0, 0.7, 0],
    'NW': [0.7, 0, 0, 0.7],
    'SE': [0, 0.7, 0.7, 0],
    'SW': [0, 0.7, 0, 0.7],
  };

  constructor() {
    super({
      name: 'weather-impact',
      version: '1.0',
      inputShape: [35], // Weather and player features
      outputShape: [8], // Impact score + 7 factor contributions
      batchSize: 32,
      epochs: 80,
      learningRate: 0.0008,
    });
  }

  protected buildModel(): tf.LayersModel {
    const model = tf.sequential();

    // Input layer
    model.add(tf.layers.dense({
      units: 64,
      inputShape: this.config.inputShape as [number],
      activation: 'relu',
      kernelInitializer: 'glorotNormal',
    }));
    model.add(tf.layers.batchNormalization());
    model.add(tf.layers.dropout({ rate: 0.2 }));

    // Hidden layers
    model.add(tf.layers.dense({
      units: 128,
      activation: 'relu',
      kernelRegularizer: tf.regularizers.l2({ l2: 0.001 }),
    }));
    model.add(tf.layers.batchNormalization());
    model.add(tf.layers.dropout({ rate: 0.3 }));

    model.add(tf.layers.dense({
      units: 64,
      activation: 'relu',
    }));
    model.add(tf.layers.batchNormalization());

    model.add(tf.layers.dense({
      units: 32,
      activation: 'relu',
    }));

    // Output layer (tanh for -1 to 1 range)
    model.add(tf.layers.dense({
      units: this.config.outputShape[0],
      activation: 'tanh',
    }));

    model.compile({
      optimizer: tf.train.adam(this.config.learningRate!),
      loss: 'meanSquaredError',
      metrics: ['mae'],
    });

    return model;
  }

  protected preprocessInput(
    weather: WeatherConditions,
    profile: PlayerWeatherProfile
  ): tf.Tensor {
    const features = [
      // Weather conditions (normalized)
      weather.temperature / 100,
      weather.windSpeed / 30,
      ...this.windDirectionEncodings[weather.windDirection] || [0, 0, 0, 0],
      weather.precipitation / 3,
      this.encodePrecipitationType(weather.precipitationType),
      weather.humidity / 100,
      weather.pressure / 1050,
      weather.visibility / 10,
      weather.cloudCover / 100,
      weather.stadiumType === 'dome' ? 1 : 0,
      weather.stadiumType === 'retractable' ? 0.5 : 0,
      weather.fieldType === 'turf' ? 1 : 0,
      weather.altitude / 10000,
      
      // Player profile
      this.encodePosition(profile.position),
      profile.coldWeatherGames / 50,
      profile.coldWeatherAverage / 25,
      profile.warmWeatherGames / 50,
      profile.warmWeatherAverage / 25,
      profile.windGames / 30,
      profile.windAverage / 25,
      profile.precipitationGames / 20,
      profile.precipitationAverage / 25,
      profile.domeGames / 100,
      profile.domeAverage / 25,
      profile.outdoorGames / 100,
      profile.outdoorAverage / 25,
      
      // Position-specific features
      profile.deepThreatPercentage || 0,
      profile.outsideRunPercentage || 0,
      this.encodePassingStyle(profile.passingStyle),
      (profile.kickingRange || 50) / 60,
      
      // Derived features
      this.calculateExtremeFactor(weather),
      this.calculatePassingConditions(weather),
      this.calculateKickingConditions(weather),
      this.calculateVisibilityFactor(weather),
    ];
    
    return tf.tensor2d([features]);
  }

  protected postprocessOutput(output: tf.Tensor): PredictionResult {
    const values = output.arraySync() as number[][];
    const predictions = values[0];
    
    const impactScore = predictions[0];
    const factorContributions = predictions.slice(1);
    
    // Calculate projection multiplier (0.7 to 1.3 range)
    const projectionMultiplier = 1 + (impactScore * 0.3);
    
    // Calculate confidence adjustment
    const confidenceAdjustment = Math.abs(impactScore) * -0.2; // More extreme = less confident
    
    // Map key factors
    const keyFactors = this.mapWeatherFactors(factorContributions);
    
    return {
      prediction: impactScore,
      confidence: 1 - Math.abs(impactScore) * 0.5,
      metadata: {
        impactScore,
        projectionMultiplier,
        confidenceAdjustment,
        keyFactors,
      },
    };
  }

  /**
   * Analyze weather impact for a specific player
   */
  async analyzeWeatherImpact(
    weather: WeatherConditions,
    profile: PlayerWeatherProfile
  ): Promise<WeatherImpact> {
    const result = await this.predict({ weather, profile });
    const baseImpact = result.metadata as any;
    
    // Calculate position-specific impacts
    const positionSpecificImpacts = this.calculatePositionSpecificImpacts(
      weather,
      profile,
      baseImpact.impactScore
    );
    
    // Generate recommendation
    const recommendation = this.generateRecommendation(
      weather,
      profile,
      baseImpact.impactScore,
      positionSpecificImpacts
    );
    
    return {
      ...baseImpact,
      positionSpecificImpacts,
      recommendation,
    };
  }

  /**
   * Compare weather impacts across multiple games
   */
  async compareWeatherScenarios(
    player: PlayerWeatherProfile,
    scenarios: { gameId: string; weather: WeatherConditions }[]
  ): Promise<{
    bestScenario: string;
    worstScenario: string;
    impacts: { gameId: string; impact: WeatherImpact }[];
  }> {
    const impacts = await Promise.all(
      scenarios.map(async (scenario) => ({
        gameId: scenario.gameId,
        impact: await this.analyzeWeatherImpact(scenario.weather, player),
      }))
    );
    
    const sorted = impacts.sort((a, b) => b.impact.impactScore - a.impact.impactScore);
    
    return {
      bestScenario: sorted[0].gameId,
      worstScenario: sorted[sorted.length - 1].gameId,
      impacts,
    };
  }

  // Helper methods
  private encodePrecipitationType(type: WeatherConditions['precipitationType']): number {
    const encoding = {
      'none': 0,
      'rain': 0.5,
      'snow': 0.8,
      'sleet': 1,
    };
    return encoding[type];
  }

  private encodePosition(position: string): number {
    const positionMap: Record<string, number> = {
      'QB': 0.1,
      'RB': 0.3,
      'WR': 0.5,
      'TE': 0.7,
      'K': 0.9,
      'DST': 1,
    };
    return positionMap[position] || 0.5;
  }

  private encodePassingStyle(style?: string): number {
    if (!style) return 0.5;
    const styleMap = {
      'deep': 0.8,
      'intermediate': 0.5,
      'short': 0.2,
    };
    return styleMap[style as keyof typeof styleMap] || 0.5;
  }

  private calculateExtremeFactor(weather: WeatherConditions): number {
    let extreme = 0;
    
    // Temperature extremes
    if (weather.temperature < 20 || weather.temperature > 90) extreme += 0.3;
    
    // High wind
    if (weather.windSpeed > 20) extreme += 0.3;
    
    // Heavy precipitation
    if (weather.precipitation > 0.5) extreme += 0.3;
    
    // Poor visibility
    if (weather.visibility < 3) extreme += 0.1;
    
    return Math.min(1, extreme);
  }

  private calculatePassingConditions(weather: WeatherConditions): number {
    let conditions = 1;
    
    // Wind impact
    conditions -= Math.min(0.4, weather.windSpeed / 50);
    
    // Precipitation impact
    conditions -= weather.precipitation * 0.3;
    
    // Visibility impact
    conditions -= Math.max(0, (5 - weather.visibility) / 10);
    
    // Temperature impact
    if (weather.temperature < 32) conditions -= 0.1;
    
    return Math.max(0, conditions);
  }

  private calculateKickingConditions(weather: WeatherConditions): number {
    let conditions = 1;
    
    // Wind is critical for kicking
    conditions -= Math.min(0.5, weather.windSpeed / 40);
    
    // Cross wind is worse than head/tail wind
    if (['E', 'W', 'NE', 'NW', 'SE', 'SW'].includes(weather.windDirection)) {
      conditions -= 0.1;
    }
    
    // Precipitation
    conditions -= weather.precipitation * 0.2;
    
    // Altitude helps
    conditions += weather.altitude / 20000;
    
    return Math.max(0, Math.min(1, conditions));
  }

  private calculateVisibilityFactor(weather: WeatherConditions): number {
    return weather.visibility / 10;
  }

  private calculatePositionSpecificImpacts(
    weather: WeatherConditions,
    profile: PlayerWeatherProfile,
    baseImpact: number
  ): WeatherImpact['positionSpecificImpacts'] {
    const impacts: WeatherImpact['positionSpecificImpacts'] = [];
    
    switch (profile.position) {
      case 'QB':
        // Wind impact on passing
        if (weather.windSpeed > 15) {
          impacts.push({
            metric: 'Passing Yards',
            adjustment: -0.15 - (weather.windSpeed - 15) * 0.01,
            reason: `${weather.windSpeed} MPH winds significantly affect passing accuracy`,
          });
          impacts.push({
            metric: 'Deep Pass Completion',
            adjustment: -0.25 - (weather.windSpeed - 15) * 0.015,
            reason: 'Deep balls particularly affected by wind',
          });
        }
        
        // Cold impact
        if (weather.temperature < 32) {
          impacts.push({
            metric: 'Completion Percentage',
            adjustment: -0.08,
            reason: 'Cold weather affects grip and ball hardness',
          });
        }
        
        // Precipitation
        if (weather.precipitation > 0.1) {
          impacts.push({
            metric: 'Fumble Risk',
            adjustment: 0.15,
            reason: 'Wet conditions increase fumble probability',
          });
        }
        break;
        
      case 'RB':
        // Rain can actually help RBs
        if (weather.precipitationType === 'rain' && weather.precipitation < 0.5) {
          impacts.push({
            metric: 'Rushing Attempts',
            adjustment: 0.12,
            reason: 'Teams run more in light rain',
          });
        }
        
        // Snow/extreme cold
        if (weather.temperature < 20 || weather.precipitationType === 'snow') {
          impacts.push({
            metric: 'Yards per Carry',
            adjustment: -0.1,
            reason: 'Frozen field reduces cutting ability',
          });
        }
        
        // Wind helps RBs
        if (weather.windSpeed > 20) {
          impacts.push({
            metric: 'Workload',
            adjustment: 0.15,
            reason: 'Heavy wind favors running game',
          });
        }
        break;
        
      case 'WR':
        // Wind severely impacts WRs
        if (weather.windSpeed > 15) {
          impacts.push({
            metric: 'Target Quality',
            adjustment: -0.2,
            reason: 'Wind affects passing accuracy to receivers',
          });
          
          if (profile.deepThreatPercentage && profile.deepThreatPercentage > 0.3) {
            impacts.push({
              metric: 'Deep Targets',
              adjustment: -0.3,
              reason: 'Deep threat receivers most affected by wind',
            });
          }
        }
        
        // Precipitation
        if (weather.precipitation > 0.2) {
          impacts.push({
            metric: 'Catch Rate',
            adjustment: -0.12,
            reason: 'Wet ball harder to catch',
          });
        }
        break;
        
      case 'TE':
        // TEs benefit from bad weather
        if (weather.windSpeed > 15 || weather.precipitation > 0.1) {
          impacts.push({
            metric: 'Target Share',
            adjustment: 0.1,
            reason: 'Short passing game favors TEs in bad weather',
          });
        }
        break;
        
      case 'K':
        // Wind is critical
        if (weather.windSpeed > 10) {
          impacts.push({
            metric: 'Field Goal Accuracy',
            adjustment: -0.05 * (weather.windSpeed / 10),
            reason: `${weather.windSpeed} MPH winds affect kick accuracy`,
          });
          impacts.push({
            metric: 'Field Goal Range',
            adjustment: -2 * (weather.windSpeed / 10),
            reason: 'Effective range reduced in wind',
          });
        }
        
        // Altitude bonus
        if (weather.altitude > 5000) {
          impacts.push({
            metric: 'Field Goal Range',
            adjustment: 3,
            reason: 'High altitude increases kick distance',
          });
        }
        break;
        
      case 'DST':
        // Bad weather helps defenses
        if (this.calculateExtremeFactor(weather) > 0.5) {
          impacts.push({
            metric: 'Turnover Probability',
            adjustment: 0.2,
            reason: 'Extreme weather increases offensive mistakes',
          });
          impacts.push({
            metric: 'Points Allowed',
            adjustment: -0.15,
            reason: 'Scoring decreases in extreme weather',
          });
        }
        break;
    }
    
    return impacts;
  }

  private mapWeatherFactors(contributions: number[]): WeatherImpact['keyFactors'] {
    const factors = [
      'Temperature Impact',
      'Wind Conditions',
      'Precipitation',
      'Stadium Type',
      'Historical Performance',
      'Visibility',
      'Game Conditions',
    ];
    
    return contributions
      .map((contribution, i) => ({
        factor: factors[i],
        impact: contribution,
        description: this.getFactorDescription(factors[i], contribution),
      }))
      .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))
      .slice(0, 4);
  }

  private getFactorDescription(factor: string, impact: number): string {
    const negative = impact < 0;
    const magnitude = Math.abs(impact);
    
    const descriptions: Record<string, { positive: string; negative: string }> = {
      'Temperature Impact': {
        positive: `Favorable temperature conditions for performance`,
        negative: `Extreme temperatures likely to hinder performance`,
      },
      'Wind Conditions': {
        positive: `Minimal wind impact expected`,
        negative: `Strong winds will significantly affect play`,
      },
      'Precipitation': {
        positive: `Dry conditions favor this player's style`,
        negative: `Precipitation expected to reduce effectiveness`,
      },
      'Stadium Type': {
        positive: `Stadium conditions favor this player`,
        negative: `Stadium type not ideal for player's strengths`,
      },
      'Historical Performance': {
        positive: `Strong track record in similar conditions`,
        negative: `Historically struggles in these conditions`,
      },
    };
    
    const desc = descriptions[factor];
    if (!desc) return `${factor}: ${negative ? 'Negative' : 'Positive'} impact`;
    
    return negative ? desc.negative : desc.positive;
  }

  private generateRecommendation(
    weather: WeatherConditions,
    profile: PlayerWeatherProfile,
    impactScore: number,
    positionImpacts: WeatherImpact['positionSpecificImpacts']
  ): string {
    const severity = Math.abs(impactScore);
    const isNegative = impactScore < 0;
    
    let recommendation = '';
    
    // Overall assessment
    if (severity < 0.2) {
      recommendation = 'Weather conditions should have minimal impact on performance. ';
    } else if (severity < 0.5) {
      recommendation = isNegative
        ? 'Moderate weather concerns - consider slight downgrade. '
        : 'Favorable weather conditions provide slight boost. ';
    } else {
      recommendation = isNegative
        ? 'Significant weather concerns - strongly consider alternatives. '
        : 'Excellent weather conditions - upgrade with confidence. ';
    }
    
    // Position-specific advice
    const majorImpacts = positionImpacts.filter(i => Math.abs(i.adjustment) > 0.15);
    if (majorImpacts.length > 0) {
      recommendation += `Key concern: ${majorImpacts[0].reason}. `;
    }
    
    // Specific weather warnings
    if (weather.windSpeed > 20 && ['QB', 'WR', 'K'].includes(profile.position)) {
      recommendation += 'Strong winds are a major red flag for this position. ';
    }
    
    if (weather.precipitation > 0.5) {
      recommendation += 'Heavy precipitation significantly increases variance. ';
    }
    
    if (weather.temperature < 20 && profile.coldWeatherGames < 5) {
      recommendation += 'Limited cold weather experience is concerning. ';
    }
    
    // Historical context
    if (profile.position === weather.stadiumType) {
      const domeDiff = profile.domeAverage - profile.outdoorAverage;
      if (Math.abs(domeDiff) > 3) {
        recommendation += domeDiff > 0
          ? 'Historically performs better in domes. '
          : 'Historically performs better outdoors. ';
      }
    }
    
    return recommendation.trim();
  }
}