/**
 * Base ML Model Class for Fantasy.AI
 * Provides common functionality for all ML models
 */

import * as tf from '@tensorflow/tfjs';

export interface ModelConfig {
  name: string;
  version: string;
  inputShape: number[];
  outputShape: number[];
  batchSize?: number;
  epochs?: number;
  learningRate?: number;
}

export interface PredictionResult {
  prediction: number | number[];
  confidence: number;
  metadata?: Record<string, any>;
}

export abstract class BaseMLModel {
  protected model: tf.LayersModel | null = null;
  protected config: ModelConfig;
  protected isTraining = false;
  protected modelPath: string;

  constructor(config: ModelConfig) {
    this.config = config;
    this.modelPath = `/models/${config.name}_v${config.version}`;
  }

  /**
   * Initialize the model architecture
   */
  protected abstract buildModel(): tf.LayersModel;

  /**
   * Preprocess input data
   */
  protected abstract preprocessInput(data: any): tf.Tensor;

  /**
   * Postprocess model output
   */
  protected abstract postprocessOutput(output: tf.Tensor): PredictionResult;

  /**
   * Create or load the model
   */
  async initialize(): Promise<void> {
    try {
      // Try to load existing model
      this.model = await tf.loadLayersModel(`localstorage://${this.modelPath}`);
      console.log(`Loaded existing model: ${this.config.name}`);
    } catch (error) {
      // Build new model if not found
      console.log(`Building new model: ${this.config.name}`);
      this.model = this.buildModel();
    }
  }

  /**
   * Make a prediction
   */
  async predict(input: any): Promise<PredictionResult> {
    if (!this.model) {
      throw new Error('Model not initialized');
    }

    const inputTensor = this.preprocessInput(input);
    const outputTensor = this.model.predict(inputTensor) as tf.Tensor;
    const result = this.postprocessOutput(outputTensor);

    // Clean up tensors
    inputTensor.dispose();
    outputTensor.dispose();

    return result;
  }

  /**
   * Train the model
   */
  async train(
    trainData: tf.Tensor | tf.data.Dataset<any>,
    trainLabels?: tf.Tensor,
    validationData?: tf.Tensor | tf.data.Dataset<any> | [tf.Tensor, tf.Tensor],
    callbacks?: tf.CustomCallbackArgs
  ): Promise<tf.History> {
    if (!this.model) {
      throw new Error('Model not initialized');
    }

    this.isTraining = true;
    let history: tf.History;

    try {
      // Handle both Tensor and Dataset types
      if (trainData instanceof tf.data.Dataset) {
        history = await this.model.fitDataset(trainData as tf.data.Dataset<any>, {
          epochs: this.config.epochs || 50,
          validationData: validationData as tf.data.Dataset<any> | undefined,
          callbacks,
        });
      } else {
        if (!trainLabels) {
          throw new Error('trainLabels required when trainData is a Tensor');
        }
        history = await this.model.fit(trainData as tf.Tensor, trainLabels, {
          epochs: this.config.epochs || 50,
          batchSize: this.config.batchSize || 32,
          validationData: validationData ? validationData as [tf.Tensor, tf.Tensor] : undefined,
          callbacks,
        });
      }
    } finally {
      this.isTraining = false;
    }
    
    return history;
  }

  /**
   * Save the model
   */
  async save(): Promise<void> {
    if (!this.model) {
      throw new Error('Model not initialized');
    }

    await this.model.save(`localstorage://${this.modelPath}`);
    console.log(`Model saved: ${this.config.name}`);
  }

  /**
   * Get model summary
   */
  summary(): void {
    if (!this.model) {
      throw new Error('Model not initialized');
    }
    this.model.summary();
  }

  /**
   * Dispose of the model and free memory
   */
  dispose(): void {
    if (this.model) {
      this.model.dispose();
      this.model = null;
    }
  }
}