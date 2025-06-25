/**
 * Computer Vision Player Recognition
 * Uses TensorFlow.js and pre-trained models for player detection in images/video
 */

import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';

export interface DetectedPlayer {
  playerId: string;
  playerName: string;
  confidence: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  jerseyNumber?: number;
  team?: string;
  action?: 'running' | 'throwing' | 'catching' | 'tackling' | 'celebrating';
}

export interface VideoFrame {
  timestamp: number;
  players: DetectedPlayer[];
  playType?: string;
  yardLine?: number;
}

export class PlayerRecognitionSystem {
  private static instance: PlayerRecognitionSystem;
  private model: tf.GraphModel | null = null;
  private jerseyModel: tf.LayersModel | null = null;
  private actionModel: tf.LayersModel | null = null;
  private isInitialized = false;
  
  // Player database for matching
  private playerDatabase = new Map<string, {
    name: string;
    team: string;
    number: number;
    position: string;
    features?: Float32Array;
  }>();
  
  private constructor() {}
  
  static getInstance(): PlayerRecognitionSystem {
    if (!PlayerRecognitionSystem.instance) {
      PlayerRecognitionSystem.instance = new PlayerRecognitionSystem();
    }
    return PlayerRecognitionSystem.instance;
  }
  
  /**
   * Initialize models and player database
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      // Set WebGL backend for performance
      await tf.setBackend('webgl');
      
      // Load pre-trained models (in production, these would be actual model URLs)
      // For now, we'll create simple models for demonstration
      this.model = await this.createObjectDetectionModel();
      this.jerseyModel = await this.createJerseyNumberModel();
      this.actionModel = await this.createActionClassificationModel();
      
      // Initialize player database
      this.initializePlayerDatabase();
      
      this.isInitialized = true;
      console.log('Player recognition system initialized');
    } catch (error) {
      console.error('Failed to initialize player recognition:', error);
      throw error;
    }
  }
  
  /**
   * Process a single image for player detection
   */
  async detectPlayersInImage(
    imageElement: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement
  ): Promise<DetectedPlayer[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    const detectedPlayers: DetectedPlayer[] = [];
    
    try {
      // Convert image to tensor
      const imageTensor = tf.browser.fromPixels(imageElement);
      const resized = tf.image.resizeBilinear(imageTensor, [640, 640]);
      const normalized = resized.div(255.0);
      const batched = normalized.expandDims(0);
      
      // Run object detection
      const predictions = await this.model!.predict(batched) as tf.Tensor;
      const [boxes, scores, classes] = await this.processDetections(predictions);
      
      // Process each detected person
      for (let i = 0; i < boxes.length; i++) {
        if (scores[i] > 0.5) { // Confidence threshold
          const box = boxes[i];
          const [y1, x1, y2, x2] = box;
          
          // Extract player region
          const playerRegion = await this.extractRegion(
            imageTensor,
            x1 * imageElement.width,
            y1 * imageElement.height,
            (x2 - x1) * imageElement.width,
            (y2 - y1) * imageElement.height
          );
          
          // Detect jersey number
          const jerseyNumber = await this.detectJerseyNumber(playerRegion);
          
          // Classify action
          const action = await this.classifyAction(playerRegion);
          
          // Match to player database
          const playerMatch = await this.matchPlayer(playerRegion, jerseyNumber);
          
          detectedPlayers.push({
            playerId: playerMatch?.id || `unknown_${i}`,
            playerName: playerMatch?.name || 'Unknown Player',
            confidence: scores[i],
            boundingBox: {
              x: x1 * imageElement.width,
              y: y1 * imageElement.height,
              width: (x2 - x1) * imageElement.width,
              height: (y2 - y1) * imageElement.height
            },
            jerseyNumber,
            team: playerMatch?.team,
            action
          });
          
          // Clean up
          playerRegion.dispose();
        }
      }
      
      // Clean up tensors
      imageTensor.dispose();
      resized.dispose();
      normalized.dispose();
      batched.dispose();
      predictions.dispose();
      
    } catch (error) {
      console.error('Error detecting players:', error);
    }
    
    return detectedPlayers;
  }
  
  /**
   * Process video stream for real-time player tracking
   */
  async processVideoStream(
    videoElement: HTMLVideoElement,
    onFrameProcessed: (frame: VideoFrame) => void,
    fps: number = 10
  ): Promise<() => void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    let isProcessing = false;
    const interval = 1000 / fps;
    
    const processFrame = async () => {
      if (isProcessing || videoElement.paused || videoElement.ended) return;
      
      isProcessing = true;
      
      try {
        const players = await this.detectPlayersInImage(videoElement);
        const playType = this.analyzePlayType(players);
        
        onFrameProcessed({
          timestamp: videoElement.currentTime,
          players,
          playType
        });
      } catch (error) {
        console.error('Error processing video frame:', error);
      }
      
      isProcessing = false;
    };
    
    const intervalId = setInterval(processFrame, interval);
    
    // Return cleanup function
    return () => {
      clearInterval(intervalId);
    };
  }
  
  /**
   * Detect jersey number from player region
   */
  private async detectJerseyNumber(playerTensor: tf.Tensor3D): Promise<number | undefined> {
    try {
      // Resize to model input size
      const resized = tf.image.resizeBilinear(playerTensor, [128, 128]);
      const batched = resized.expandDims(0);
      
      // Run jersey number detection
      const prediction = this.jerseyModel!.predict(batched) as tf.Tensor;
      const jerseyNumber = await prediction.data();
      
      // Clean up
      resized.dispose();
      batched.dispose();
      prediction.dispose();
      
      // Extract most likely number (simplified - in reality would be OCR)
      const detectedNumber = Math.round(jerseyNumber[0] * 99);
      return detectedNumber > 0 && detectedNumber < 100 ? detectedNumber : undefined;
      
    } catch (error) {
      console.error('Error detecting jersey number:', error);
      return undefined;
    }
  }
  
  /**
   * Classify player action
   */
  private async classifyAction(
    playerTensor: tf.Tensor3D
  ): Promise<DetectedPlayer['action'] | undefined> {
    try {
      const resized = tf.image.resizeBilinear(playerTensor, [224, 224]);
      const batched = resized.expandDims(0);
      
      const prediction = this.actionModel!.predict(batched) as tf.Tensor;
      const actionScores = await prediction.data();
      
      resized.dispose();
      batched.dispose();
      prediction.dispose();
      
      const actions: DetectedPlayer['action'][] = [
        'running', 'throwing', 'catching', 'tackling', 'celebrating'
      ];
      
      const maxIndex = actionScores.indexOf(Math.max(...Array.from(actionScores)));
      return actionScores[maxIndex] > 0.7 ? actions[maxIndex] : undefined;
      
    } catch (error) {
      console.error('Error classifying action:', error);
      return undefined;
    }
  }
  
  /**
   * Match detected player to database
   */
  private async matchPlayer(
    playerTensor: tf.Tensor3D,
    jerseyNumber?: number
  ): Promise<{ id: string; name: string; team: string } | null> {
    // In a real implementation, this would use facial recognition
    // or more sophisticated matching algorithms
    
    if (!jerseyNumber) return null;
    
    // Simple lookup by jersey number (would be more complex in reality)
    for (const [id, player] of this.playerDatabase) {
      if (player.number === jerseyNumber) {
        return { id, name: player.name, team: player.team };
      }
    }
    
    return null;
  }
  
  /**
   * Extract region from image tensor
   */
  private async extractRegion(
    imageTensor: tf.Tensor3D,
    x: number,
    y: number,
    width: number,
    height: number
  ): Promise<tf.Tensor3D> {
    const [imgHeight, imgWidth] = imageTensor.shape;
    
    // Ensure coordinates are within bounds
    const x1 = Math.max(0, Math.floor(x));
    const y1 = Math.max(0, Math.floor(y));
    const x2 = Math.min(imgWidth, Math.ceil(x + width));
    const y2 = Math.min(imgHeight, Math.ceil(y + height));
    
    return tf.slice(imageTensor, [y1, x1, 0], [y2 - y1, x2 - x1, 3]);
  }
  
  /**
   * Process raw detections from model
   */
  private async processDetections(
    predictions: tf.Tensor
  ): Promise<[number[][], number[], number[]]> {
    // Simplified processing - in reality would use NMS and proper decoding
    const data = await predictions.data();
    
    const boxes: number[][] = [];
    const scores: number[] = [];
    const classes: number[] = [];
    
    // Mock data for demonstration
    boxes.push([0.1, 0.2, 0.3, 0.4]);
    scores.push(0.95);
    classes.push(1); // Person class
    
    return [boxes, scores, classes];
  }
  
  /**
   * Analyze play type from detected players
   */
  private analyzePlayType(players: DetectedPlayer[]): string | undefined {
    const actions = players.map(p => p.action).filter(Boolean);
    
    if (actions.includes('throwing')) {
      return 'pass_play';
    } else if (actions.filter(a => a === 'running').length > 2) {
      return 'run_play';
    } else if (actions.includes('catching')) {
      return 'reception';
    } else if (actions.includes('celebrating')) {
      return 'touchdown';
    }
    
    return undefined;
  }
  
  /**
   * Create mock object detection model
   */
  private async createObjectDetectionModel(): Promise<tf.GraphModel> {
    // In production, load a real pre-trained model
    // For now, create a simple sequential model
    const model = tf.sequential({
      layers: [
        tf.layers.conv2d({
          inputShape: [640, 640, 3],
          filters: 32,
          kernelSize: 3,
          activation: 'relu'
        }),
        tf.layers.maxPooling2d({ poolSize: 2 }),
        tf.layers.flatten(),
        tf.layers.dense({ units: 100, activation: 'sigmoid' })
      ]
    });
    
    return model as any;
  }
  
  /**
   * Create mock jersey number detection model
   */
  private async createJerseyNumberModel(): Promise<tf.LayersModel> {
    return tf.sequential({
      layers: [
        tf.layers.conv2d({
          inputShape: [128, 128, 3],
          filters: 16,
          kernelSize: 3,
          activation: 'relu'
        }),
        tf.layers.flatten(),
        tf.layers.dense({ units: 1, activation: 'sigmoid' })
      ]
    });
  }
  
  /**
   * Create mock action classification model
   */
  private async createActionClassificationModel(): Promise<tf.LayersModel> {
    return tf.sequential({
      layers: [
        tf.layers.conv2d({
          inputShape: [224, 224, 3],
          filters: 16,
          kernelSize: 3,
          activation: 'relu'
        }),
        tf.layers.globalAveragePooling2d(),
        tf.layers.dense({ units: 5, activation: 'softmax' })
      ]
    });
  }
  
  /**
   * Initialize player database
   */
  private initializePlayerDatabase(): void {
    // Add some sample players
    this.playerDatabase.set('mahomes_15', {
      name: 'Patrick Mahomes',
      team: 'KC',
      number: 15,
      position: 'QB'
    });
    
    this.playerDatabase.set('kelce_87', {
      name: 'Travis Kelce',
      team: 'KC',
      number: 87,
      position: 'TE'
    });
    
    this.playerDatabase.set('hill_10', {
      name: 'Tyreek Hill',
      team: 'MIA',
      number: 10,
      position: 'WR'
    });
    
    // Add more players as needed
  }
}

// Export singleton instance
export const playerRecognition = PlayerRecognitionSystem.getInstance();