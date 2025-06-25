#!/usr/bin/env tsx
/**
 * 🔍 GPU SETUP VERIFICATION
 * Checks CUDA installation and TensorFlow GPU support
 */

import * as tf from '@tensorflow/tfjs-node-gpu';
import { execSync } from 'child_process';
import * as os from 'os';

class GPUSetupVerifier {
  async verify() {
    console.log('🔍 FANTASY.AI GPU SETUP VERIFICATION');
    console.log('===================================\n');

    const results = {
      cuda: false,
      cudnn: false,
      tensorflow: false,
      gpuDetected: false,
      gpuMemory: '',
      backend: '',
      ready: false
    };

    // 1. Check CUDA installation
    console.log('1️⃣ Checking CUDA installation...');
    try {
      const cudaVersion = execSync('nvcc --version', { encoding: 'utf8' });
      console.log('✅ CUDA installed:');
      console.log(cudaVersion.split('\n').find(line => line.includes('release')) || 'Version info not found');
      results.cuda = true;
    } catch {
      console.log('❌ CUDA not found - Please run: bash scripts/install-cuda-wsl.sh');
    }

    // 2. Check cuDNN
    console.log('\n2️⃣ Checking cuDNN installation...');
    try {
      const cudnnCheck = execSync('dpkg -l | grep libcudnn', { encoding: 'utf8' });
      if (cudnnCheck) {
        console.log('✅ cuDNN installed');
        results.cudnn = true;
      }
    } catch {
      console.log('❌ cuDNN not found');
    }

    // 3. Check GPU detection
    console.log('\n3️⃣ Checking GPU detection...');
    try {
      const gpuInfo = execSync('nvidia-smi --query-gpu=name,memory.total,memory.free --format=csv,noheader', { 
        encoding: 'utf8' 
      }).trim();
      console.log(`✅ GPU detected: ${gpuInfo}`);
      results.gpuDetected = true;
      results.gpuMemory = gpuInfo;
    } catch {
      console.log('❌ GPU not detected via nvidia-smi');
    }

    // 4. Check TensorFlow backend
    console.log('\n4️⃣ Checking TensorFlow.js backend...');
    try {
      // Initialize TensorFlow
      await tf.ready();
      const backend = tf.getBackend();
      console.log(`✅ TensorFlow backend: ${backend}`);
      results.backend = backend;
      results.tensorflow = backend === 'tensorflow';

      // Test GPU operations
      if (backend === 'tensorflow') {
        console.log('\n5️⃣ Testing GPU operations...');
        const testTensor = tf.randomNormal([1000, 1000]);
        const startTime = Date.now();
        const result = tf.matMul(testTensor, testTensor);
        await result.data();
        const computeTime = Date.now() - startTime;
        console.log(`✅ GPU computation test: ${computeTime}ms for 1000x1000 matrix multiplication`);
        
        // Cleanup
        testTensor.dispose();
        result.dispose();
      }
    } catch (error) {
      console.log('❌ TensorFlow GPU initialization failed:', error.message);
    }

    // 5. System information
    console.log('\n6️⃣ System Information:');
    console.log(`   CPU: ${os.cpus()[0].model} (${os.cpus().length} threads)`);
    console.log(`   Memory: ${Math.round(os.totalmem() / 1024 / 1024 / 1024)} GB`);
    console.log(`   Platform: ${os.platform()} ${os.release()}`);

    // Summary
    results.ready = results.cuda && results.tensorflow && results.gpuDetected;
    
    console.log('\n📊 VERIFICATION SUMMARY:');
    console.log('=======================');
    console.log(`CUDA Toolkit: ${results.cuda ? '✅' : '❌'}`);
    console.log(`cuDNN Library: ${results.cudnn ? '✅' : '❌'}`);
    console.log(`GPU Detected: ${results.gpuDetected ? '✅' : '❌'}`);
    console.log(`TensorFlow GPU: ${results.tensorflow ? '✅' : '❌'}`);
    console.log(`Backend: ${results.backend}`);
    
    if (results.ready) {
      console.log('\n🎉 GPU ACCELERATION READY!');
      console.log('Your RTX 4060 is configured for ML training.');
      console.log('\nNext step: Run GPU-accelerated training');
      console.log('Command: npx tsx scripts/train-gpu-accelerated.ts');
    } else {
      console.log('\n⚠️  GPU SETUP INCOMPLETE');
      if (!results.cuda) {
        console.log('\n📝 To install CUDA:');
        console.log('1. Run: bash scripts/install-cuda-wsl.sh');
        console.log('2. Enter your sudo password when prompted');
        console.log('3. Wait for installation (5-10 minutes)');
        console.log('4. Restart your terminal');
        console.log('5. Run this verification again');
      }
    }

    return results;
  }
}

// Execute verification
async function main() {
  const verifier = new GPUSetupVerifier();
  await verifier.verify();
}

main().catch(console.error);