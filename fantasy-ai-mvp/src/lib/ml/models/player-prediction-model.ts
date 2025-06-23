/**
 * Player Performance Prediction Model
 * Uses LSTM networks to predict player performance based on historical data
 */

import * as tf from '@tensorflow/tfjs';
import { BaseMLModel, ModelConfig, PredictionResult } from '../base-model';

export interface PlayerFeatures {
  // Historical performance (last 10 games)
  recentPoints: number[];
  recentYards: number[];
  recentTouchdowns: number[];
  recentTargets: number[];
  
  // Player attributes
  position: string;
  age: number;
  yearsInLeague: number;
  injuryStatus: number; // 0-1 scale
  
  // Team context
  teamOffensiveRank: number;
  teamDefensiveRank: number;
  homeGame: boolean;
  
  // Opponent context
  opponentDefensiveRank: number;
  opponentPointsAllowed: number;
  
  // External factors
  weather: {
    temperature: number;
    windSpeed: number;
    precipitation: number;
  };
  
  // Time factors
  weekNumber: number;
  timeOfGame: number; // Hour of day
  restDays: number;
}

export class PlayerPredictionModel extends BaseMLModel {
  private readonly positionEncodings: Record<string, number> = {
    'QB': 0,
    'RB': 1,
    'WR': 2,
    'TE': 3,
    'K': 4,
    'DST': 5,
  };

  constructor() {
    super({
      name: 'player-prediction',
      version: '1.0',
      inputShape: [10, 25], // 10 time steps, 25 features
      outputShape: [4], // Points, yards, TDs, confidence
      batchSize: 64,
      epochs: 100,
      learningRate: 0.001,
    });
  }

  protected buildModel(): tf.LayersModel {
    const model = tf.sequential();

    // LSTM layers for temporal patterns
    model.add(tf.layers.lstm({
      units: 128,
      returnSequences: true,
      inputShape: this.config.inputShape as [number, number],
    }));
    
    model.add(tf.layers.dropout({ rate: 0.2 }));
    
    model.add(tf.layers.lstm({
      units: 64,
      returnSequences: false,
    }));
    
    model.add(tf.layers.dropout({ rate: 0.2 }));

    // Dense layers for final prediction
    model.add(tf.layers.dense({
      units: 32,
      activation: 'relu',
      kernelRegularizer: tf.regularizers.l2({ l2: 0.01 }),
    }));
    
    model.add(tf.layers.dense({
      units: 16,
      activation: 'relu',
    }));
    
    model.add(tf.layers.dense({
      units: this.config.outputShape[0],
      activation: 'linear',
    }));

    // Compile the model
    model.compile({
      optimizer: tf.train.adam(this.config.learningRate!),
      loss: 'meanSquaredError',
      metrics: ['mse', 'mae'],
    });

    return model;
  }

  protected preprocessInput(features: PlayerFeatures): tf.Tensor {
    const sequenceData: number[][] = [];
    
    // Create time series data for last 10 games
    for (let i = 0; i < 10; i++) {
      const gameFeatures = [
        // Performance metrics
        features.recentPoints[i] || 0,
        features.recentYards[i] || 0,
        features.recentTouchdowns[i] || 0,
        features.recentTargets[i] || 0,
        
        // Rolling averages
        this.calculateAverage(features.recentPoints.slice(0, i + 1)),
        this.calculateAverage(features.recentYards.slice(0, i + 1)),
        
        // Player attributes (static across sequence)
        this.positionEncodings[features.position] || 0,
        features.age / 40, // Normalize age
        features.yearsInLeague / 20, // Normalize experience
        features.injuryStatus,
        
        // Team context
        features.teamOffensiveRank / 32,
        features.teamDefensiveRank / 32,
        features.homeGame ? 1 : 0,
        
        // Opponent context
        features.opponentDefensiveRank / 32,
        features.opponentPointsAllowed / 50, // Normalize points
        
        // Weather features
        features.weather.temperature / 100,
        features.weather.windSpeed / 30,
        features.weather.precipitation / 10,
        
        // Time features
        features.weekNumber / 18,
        features.timeOfGame / 24,
        features.restDays / 14,
        
        // Trend indicators
        this.calculateTrend(features.recentPoints.slice(0, i + 1)),
        this.calculateVolatility(features.recentPoints.slice(0, i + 1)),
        
        // Momentum indicators
        i > 0 ? (features.recentPoints[i] - features.recentPoints[i - 1]) / 20 : 0,
        i > 2 ? this.calculateMomentum(features.recentPoints.slice(i - 3, i + 1)) : 0,
      ];
      
      sequenceData.push(gameFeatures);
    }
    
    return tf.tensor3d([sequenceData]);
  }

  protected postprocessOutput(output: tf.Tensor): PredictionResult {
    const values = output.arraySync() as number[][];
    const prediction = values[0];
    
    // Extract predictions
    const projectedPoints = Math.max(0, prediction[0] * 30); // Denormalize
    const projectedYards = Math.max(0, prediction[1] * 150);
    const projectedTDs = Math.max(0, prediction[2] * 3);
    const confidence = Math.min(1, Math.max(0, prediction[3]));
    
    return {
      prediction: projectedPoints,
      confidence,
      metadata: {
        projectedPoints,
        projectedYards,
        projectedTDs,
        confidenceLevel: this.getConfidenceLevel(confidence),
        range: {
          low: projectedPoints * (1 - (1 - confidence) * 0.3),
          high: projectedPoints * (1 + (1 - confidence) * 0.3),
        },
      },
    };
  }

  /**
   * Advanced prediction with ensemble approach
   */
  async predictWithEnsemble(features: PlayerFeatures): Promise<PredictionResult> {
    const predictions: PredictionResult[] = [];
    
    // Make multiple predictions with slight variations
    for (let i = 0; i < 5; i++) {
      const noisyFeatures = this.addNoise(features, 0.05);
      const pred = await this.predict(noisyFeatures);
      predictions.push(pred);
    }
    
    // Aggregate predictions
    const avgPoints = predictions.reduce((sum, p) => sum + (p.prediction as number), 0) / predictions.length;
    const avgConfidence = predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length;
    
    return {
      prediction: avgPoints,
      confidence: avgConfidence,
      metadata: {
        ensembleSize: predictions.length,
        variance: this.calculateVariance(predictions.map(p => p.prediction as number)),
        predictions: predictions,
      },
    };
  }

  // Helper methods
  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    return (this.calculateAverage(secondHalf) - this.calculateAverage(firstHalf)) / 10;
  }

  private calculateVolatility(values: number[]): number {
    if (values.length < 2) return 0;
    const avg = this.calculateAverage(values);
    const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;
    return Math.sqrt(variance) / 10;
  }

  private calculateMomentum(values: number[]): number {
    if (values.length < 2) return 0;
    let momentum = 0;
    for (let i = 1; i < values.length; i++) {
      momentum += (values[i] - values[i - 1]) / values[i - 1];
    }
    return momentum / (values.length - 1);
  }

  private calculateVariance(values: number[]): number {
    const avg = this.calculateAverage(values);
    return values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;
  }

  private getConfidenceLevel(confidence: number): string {
    if (confidence > 0.8) return 'High';
    if (confidence > 0.6) return 'Medium';
    if (confidence > 0.4) return 'Low';
    return 'Very Low';
  }

  private addNoise(features: PlayerFeatures, noiseLevel: number): PlayerFeatures {
    // Add small random noise to numerical features for ensemble
    return {
      ...features,
      recentPoints: features.recentPoints.map(p => p * (1 + (Math.random() - 0.5) * noiseLevel)),
      recentYards: features.recentYards.map(y => y * (1 + (Math.random() - 0.5) * noiseLevel)),
      age: features.age * (1 + (Math.random() - 0.5) * noiseLevel * 0.1),
    };
  }
}