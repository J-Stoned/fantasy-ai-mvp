import { prisma } from '@/lib/prisma';
import { cache } from '@/lib/redis/redis-client';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface ModelVersion {
  modelType: string;
  version: number;
  accuracy: number;
  parameters: any;
  metrics: any;
  trainedAt: Date;
  deployedAt?: Date;
  isActive: boolean;
  modelPath?: string;
}

export class ModelVersionManager {
  private readonly MODEL_BASE_PATH = '/tmp/ml-models';
  private activeModels = new Map<string, ModelVersion>();

  constructor() {
    this.initializeStorage();
  }

  /**
   * Initialize model storage directory
   */
  private async initializeStorage() {
    try {
      await fs.mkdir(this.MODEL_BASE_PATH, { recursive: true });
    } catch (error) {
      console.error('Failed to create model storage directory:', error);
    }
  }

  /**
   * Save a new model version
   */
  async saveModelVersion(
    modelType: string,
    model: any,
    metrics: {
      accuracy: number;
      loss: number;
      validationAccuracy?: number;
      validationLoss?: number;
      [key: string]: any;
    },
    parameters: any
  ): Promise<ModelVersion> {
    try {
      // Get next version number
      const latestVersion = await prisma.mLModelMetadata.findFirst({
        where: { modelType },
        orderBy: { version: 'desc' }
      });

      const nextVersion = (latestVersion?.version || 0) + 1;

      // Save model to file system
      const modelPath = path.join(
        this.MODEL_BASE_PATH,
        modelType,
        `v${nextVersion}`
      );
      
      await fs.mkdir(path.dirname(modelPath), { recursive: true });
      
      // Save model (implementation depends on ML framework)
      // For TensorFlow.js:
      if (model.save) {
        await model.save(`file://${modelPath}`);
      }

      // Save metadata to database
      const modelVersion = await prisma.mLModelMetadata.create({
        data: {
          modelType,
          version: nextVersion,
          accuracy: metrics.accuracy,
          parameters,
          metrics,
          trainedAt: new Date(),
          isActive: false // Not active until deployed
        }
      });

      console.log(`✅ Saved model ${modelType} v${nextVersion} with accuracy ${metrics.accuracy}`);

      return {
        ...modelVersion,
        modelPath
      };
    } catch (error) {
      console.error('Failed to save model version:', error);
      throw error;
    }
  }

  /**
   * Load a specific model version
   */
  async loadModelVersion(modelType: string, version?: number): Promise<any> {
    try {
      // If no version specified, load active version
      if (!version) {
        const activeVersion = await this.getActiveVersion(modelType);
        if (!activeVersion) {
          throw new Error(`No active version found for model ${modelType}`);
        }
        version = activeVersion.version;
      }

      // Check cache
      const cacheKey = `model:${modelType}:v${version}`;
      const cachedPath = await cache.get<string>(cacheKey);
      
      if (cachedPath) {
        // Load from cached path
        return await this.loadModelFromPath(cachedPath);
      }

      // Load from database
      const modelVersion = await prisma.mLModelMetadata.findFirst({
        where: {
          modelType,
          version
        }
      });

      if (!modelVersion) {
        throw new Error(`Model version not found: ${modelType} v${version}`);
      }

      // Load model from file system
      const modelPath = path.join(
        this.MODEL_BASE_PATH,
        modelType,
        `v${version}`
      );

      const model = await this.loadModelFromPath(modelPath);

      // Cache model path
      await cache.set(cacheKey, modelPath, 3600); // 1 hour

      return model;
    } catch (error) {
      console.error('Failed to load model version:', error);
      throw error;
    }
  }

  /**
   * Deploy a model version (make it active)
   */
  async deployModelVersion(modelType: string, version: number): Promise<void> {
    try {
      // Deactivate current active version
      await prisma.mLModelMetadata.updateMany({
        where: {
          modelType,
          isActive: true
        },
        data: {
          isActive: false
        }
      });

      // Activate new version
      const deployed = await prisma.mLModelMetadata.update({
        where: {
          modelType_version: {
            modelType,
            version
          }
        },
        data: {
          isActive: true,
          deployedAt: new Date()
        }
      });

      // Update active models map
      this.activeModels.set(modelType, {
        ...deployed,
        modelPath: path.join(this.MODEL_BASE_PATH, modelType, `v${version}`)
      });

      // Clear cache for this model type
      await cache.del(`model:${modelType}:active`);

      console.log(`✅ Deployed ${modelType} v${version} to production`);
    } catch (error) {
      console.error('Failed to deploy model version:', error);
      throw error;
    }
  }

  /**
   * Rollback to a previous model version
   */
  async rollbackModel(modelType: string, targetVersion?: number): Promise<void> {
    try {
      let version = targetVersion;

      // If no version specified, rollback to previous active version
      if (!version) {
        const versions = await prisma.mLModelMetadata.findMany({
          where: { modelType },
          orderBy: { deployedAt: 'desc' },
          take: 2
        });

        if (versions.length < 2) {
          throw new Error('No previous version to rollback to');
        }

        version = versions[1].version;
      }

      await this.deployModelVersion(modelType, version);
      console.log(`✅ Rolled back ${modelType} to v${version}`);
    } catch (error) {
      console.error('Failed to rollback model:', error);
      throw error;
    }
  }

  /**
   * Get active version for a model type
   */
  async getActiveVersion(modelType: string): Promise<ModelVersion | null> {
    // Check cache
    const cached = this.activeModels.get(modelType);
    if (cached) return cached;

    // Load from database
    const active = await prisma.mLModelMetadata.findFirst({
      where: {
        modelType,
        isActive: true
      }
    });

    if (active) {
      const modelVersion = {
        ...active,
        modelPath: path.join(this.MODEL_BASE_PATH, modelType, `v${active.version}`)
      };
      this.activeModels.set(modelType, modelVersion);
      return modelVersion;
    }

    return null;
  }

  /**
   * Get version history for a model type
   */
  async getVersionHistory(modelType: string, limit: number = 10): Promise<ModelVersion[]> {
    const versions = await prisma.mLModelMetadata.findMany({
      where: { modelType },
      orderBy: { version: 'desc' },
      take: limit
    });

    return versions.map(v => ({
      ...v,
      modelPath: path.join(this.MODEL_BASE_PATH, modelType, `v${v.version}`)
    }));
  }

  /**
   * Compare two model versions
   */
  async compareVersions(
    modelType: string,
    version1: number,
    version2: number
  ): Promise<{
    version1: ModelVersion;
    version2: ModelVersion;
    comparison: {
      accuracyDiff: number;
      parameterChanges: any;
      metricChanges: any;
    };
  }> {
    const [v1, v2] = await Promise.all([
      prisma.mLModelMetadata.findFirst({
        where: { modelType, version: version1 }
      }),
      prisma.mLModelMetadata.findFirst({
        where: { modelType, version: version2 }
      })
    ]);

    if (!v1 || !v2) {
      throw new Error('One or both versions not found');
    }

    const comparison = {
      accuracyDiff: v2.accuracy - v1.accuracy,
      parameterChanges: this.compareObjects(
        v1.parameters as any,
        v2.parameters as any
      ),
      metricChanges: this.compareObjects(
        v1.metrics as any,
        v2.metrics as any
      )
    };

    return {
      version1: { ...v1, modelPath: '' },
      version2: { ...v2, modelPath: '' },
      comparison
    };
  }

  /**
   * Clean up old model versions
   */
  async cleanupOldVersions(modelType: string, keepVersions: number = 5): Promise<void> {
    try {
      // Get all versions
      const versions = await prisma.mLModelMetadata.findMany({
        where: { modelType },
        orderBy: { version: 'desc' }
      });

      if (versions.length <= keepVersions) {
        return; // Nothing to clean up
      }

      // Keep the latest N versions and active version
      const activeVersion = versions.find(v => v.isActive);
      const versionsToKeep = new Set(
        versions.slice(0, keepVersions).map(v => v.version)
      );
      
      if (activeVersion) {
        versionsToKeep.add(activeVersion.version);
      }

      // Delete old versions
      for (const version of versions) {
        if (!versionsToKeep.has(version.version)) {
          // Delete from database
          await prisma.mLModelMetadata.delete({
            where: {
              modelType_version: {
                modelType,
                version: version.version
              }
            }
          });

          // Delete from file system
          const modelPath = path.join(
            this.MODEL_BASE_PATH,
            modelType,
            `v${version.version}`
          );
          
          try {
            await fs.rm(modelPath, { recursive: true });
          } catch (error) {
            console.error(`Failed to delete model files for ${modelType} v${version.version}:`, error);
          }
        }
      }

      console.log(`✅ Cleaned up old versions of ${modelType}`);
    } catch (error) {
      console.error('Failed to cleanup old versions:', error);
      throw error;
    }
  }

  /**
   * Export model version for backup or transfer
   */
  async exportModelVersion(
    modelType: string,
    version: number,
    exportPath: string
  ): Promise<void> {
    try {
      const modelVersion = await prisma.mLModelMetadata.findFirst({
        where: { modelType, version }
      });

      if (!modelVersion) {
        throw new Error(`Model version not found: ${modelType} v${version}`);
      }

      const sourcePath = path.join(
        this.MODEL_BASE_PATH,
        modelType,
        `v${version}`
      );

      // Create export directory
      await fs.mkdir(exportPath, { recursive: true });

      // Copy model files
      await this.copyDirectory(sourcePath, path.join(exportPath, 'model'));

      // Export metadata
      await fs.writeFile(
        path.join(exportPath, 'metadata.json'),
        JSON.stringify(modelVersion, null, 2)
      );

      console.log(`✅ Exported ${modelType} v${version} to ${exportPath}`);
    } catch (error) {
      console.error('Failed to export model version:', error);
      throw error;
    }
  }

  /**
   * Import model version from backup
   */
  async importModelVersion(
    importPath: string,
    overwrite: boolean = false
  ): Promise<ModelVersion> {
    try {
      // Read metadata
      const metadataPath = path.join(importPath, 'metadata.json');
      const metadata = JSON.parse(
        await fs.readFile(metadataPath, 'utf-8')
      );

      // Check if version already exists
      const existing = await prisma.mLModelMetadata.findFirst({
        where: {
          modelType: metadata.modelType,
          version: metadata.version
        }
      });

      if (existing && !overwrite) {
        throw new Error(
          `Model version already exists: ${metadata.modelType} v${metadata.version}`
        );
      }

      // Import model files
      const modelPath = path.join(
        this.MODEL_BASE_PATH,
        metadata.modelType,
        `v${metadata.version}`
      );

      await this.copyDirectory(
        path.join(importPath, 'model'),
        modelPath
      );

      // Save metadata to database
      const modelVersion = await prisma.mLModelMetadata.upsert({
        where: {
          modelType_version: {
            modelType: metadata.modelType,
            version: metadata.version
          }
        },
        create: {
          modelType: metadata.modelType,
          version: metadata.version,
          accuracy: metadata.accuracy,
          parameters: metadata.parameters,
          metrics: metadata.metrics,
          trainedAt: new Date(metadata.trainedAt),
          deployedAt: metadata.deployedAt ? new Date(metadata.deployedAt) : null,
          isActive: false // Don't auto-activate imported models
        },
        update: {
          accuracy: metadata.accuracy,
          parameters: metadata.parameters,
          metrics: metadata.metrics
        }
      });

      console.log(`✅ Imported ${metadata.modelType} v${metadata.version}`);

      return {
        ...modelVersion,
        modelPath
      };
    } catch (error) {
      console.error('Failed to import model version:', error);
      throw error;
    }
  }

  // Helper methods

  private async loadModelFromPath(modelPath: string): Promise<any> {
    // Implementation depends on ML framework
    // For TensorFlow.js:
    const tf = await import('@tensorflow/tfjs-node');
    return await tf.loadLayersModel(`file://${modelPath}/model.json`);
  }

  private compareObjects(obj1: any, obj2: any): any {
    const changes: any = {};
    
    // Find changed and new keys
    for (const key in obj2) {
      if (obj1[key] !== obj2[key]) {
        changes[key] = {
          old: obj1[key],
          new: obj2[key]
        };
      }
    }
    
    // Find removed keys
    for (const key in obj1) {
      if (!(key in obj2)) {
        changes[key] = {
          old: obj1[key],
          new: undefined
        };
      }
    }
    
    return changes;
  }

  private async copyDirectory(src: string, dest: string): Promise<void> {
    await fs.mkdir(dest, { recursive: true });
    const entries = await fs.readdir(src, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);

      if (entry.isDirectory()) {
        await this.copyDirectory(srcPath, destPath);
      } else {
        await fs.copyFile(srcPath, destPath);
      }
    }
  }
}

// Export singleton
export const modelVersionManager = new ModelVersionManager();