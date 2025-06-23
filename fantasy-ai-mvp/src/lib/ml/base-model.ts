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
    validationData?: tf.Tensor | tf.data.Dataset<any>,
    callbacks?: tf.CustomCallbackArgs
  ): Promise<tf.History> {
    if (!this.model) {
      throw new Error('Model not initialized');
    }

    this.isTraining = true;

    const history = await this.model.fit(trainData, {
      epochs: this.config.epochs || 50,
      batchSize: this.config.batchSize || 32,
      validationData,
      callbacks,
    });

    this.isTraining = false;
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