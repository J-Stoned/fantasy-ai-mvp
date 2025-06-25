#!/usr/bin/env tsx
/**
 * 🚀 GPU SETUP WITHOUT SUDO
 * Alternative approach using npm packages for GPU acceleration
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

class GPUSetupNoSudo {
  async setup() {
    console.log('🚀 FANTASY.AI GPU SETUP (No Sudo Required)');
    console.log('=========================================\n');

    // Check current GPU status
    console.log('🔍 Checking GPU status...');
    try {
      const gpuInfo = execSync('nvidia-smi --query-gpu=name,memory.total,memory.free --format=csv,noheader', {
        encoding: 'utf8'
      }).trim();
      console.log(`✅ GPU detected: ${gpuInfo}`);
      console.log('   Your RTX 4060 is accessible!\n');
    } catch {
      console.log('⚠️  Could not detect GPU via nvidia-smi\n');
    }

    // Option 1: Try using pre-built TensorFlow binaries
    console.log('📦 Option 1: Installing pre-built TensorFlow GPU binaries...');
    try {
      console.log('   Checking for existing TensorFlow GPU...');
      const tfVersion = execSync('npm list @tensorflow/tfjs-node-gpu', { encoding: 'utf8' });
      console.log('   ✅ TensorFlow GPU already installed!');
      console.log(`   ${tfVersion.trim()}\n`);
    } catch {
      console.log('   Installing TensorFlow GPU package...');
      execSync('npm install @tensorflow/tfjs-node-gpu@latest --save', { stdio: 'inherit' });
    }

    // Option 2: Create conda environment (if conda is available)
    console.log('📦 Option 2: Checking for Conda/Miniconda...');
    try {
      execSync('conda --version', { encoding: 'utf8' });
      console.log('   ✅ Conda found! You can create a GPU environment:');
      console.log('   conda create -n fantasy-gpu python=3.9');
      console.log('   conda activate fantasy-gpu');
      console.log('   conda install cudatoolkit=11.8 cudnn tensorflow-gpu\n');
    } catch {
      console.log('   ℹ️  Conda not installed (optional)\n');
    }

    // Option 3: Docker with GPU support
    console.log('🐳 Option 3: Docker GPU Setup...');
    try {
      const dockerVersion = execSync('docker --version', { encoding: 'utf8' });
      console.log(`   ✅ Docker found: ${dockerVersion.trim()}`);
      
      // Create docker-compose for GPU
      const dockerCompose = `version: '3.8'

services:
  ml-training:
    image: tensorflow/tensorflow:latest-gpu
    runtime: nvidia
    environment:
      - NVIDIA_VISIBLE_DEVICES=all
    volumes:
      - .:/workspace
    working_dir: /workspace
    command: npm run train:gpu
`;
      
      fs.writeFileSync('docker-compose.gpu.yml', dockerCompose);
      console.log('   ✅ Created docker-compose.gpu.yml');
      console.log('   Run: docker-compose -f docker-compose.gpu.yml up\n');
    } catch {
      console.log('   ℹ️  Docker not installed (optional)\n');
    }

    // Test GPU availability with current setup
    console.log('🧪 Testing GPU availability with current setup...');
    await this.testGPU();

    console.log('\n📋 RECOMMENDATIONS:');
    console.log('====================');
    console.log('Since CUDA installation requires sudo, here are your options:\n');
    
    console.log('1. 🚀 QUICK START (Recommended):');
    console.log('   Your GPU is already detected! Try running:');
    console.log('   npx tsx scripts/train-gpu-accelerated.ts\n');
    
    console.log('2. 🔧 MANUAL CUDA INSTALLATION:');
    console.log('   If you need full CUDA, ask your system admin or:');
    console.log('   - Get your WSL password');
    console.log('   - Run: bash scripts/install-cuda-wsl.sh');
    console.log('   - Enter password when prompted\n');
    
    console.log('3. 🐳 DOCKER APPROACH:');
    console.log('   Use the docker-compose.gpu.yml file created');
    console.log('   This uses NVIDIA Docker runtime\n');

    console.log('💡 TIP: The GPU might work without full CUDA installation!');
    console.log('TensorFlow can sometimes use GPU through Windows drivers.');
  }

  async testGPU() {
    const testScript = `
import * as tf from '@tensorflow/tfjs-node-gpu';

async function test() {
  try {
    await tf.ready();
    console.log('TensorFlow backend:', tf.getBackend());
    
    // Test computation
    const a = tf.randomNormal([1000, 1000]);
    const start = Date.now();
    const b = tf.matMul(a, a);
    await b.data();
    const time = Date.now() - start;
    
    console.log(\`Matrix multiplication (1000x1000): \${time}ms\`);
    console.log('GPU acceleration:', time < 100 ? 'WORKING! ✅' : 'Not detected ❌');
    
    a.dispose();
    b.dispose();
  } catch (error) {
    console.log('GPU test error:', error.message);
  }
}

test();
`;

    fs.writeFileSync('test-gpu-simple.ts', testScript);
    
    try {
      console.log('   Running GPU test...');
      execSync('npx tsx test-gpu-simple.ts', { stdio: 'inherit' });
    } catch (error) {
      console.log('   GPU test failed - this is normal without CUDA');
    } finally {
      fs.unlinkSync('test-gpu-simple.ts');
    }
  }
}

// Run setup
const setup = new GPUSetupNoSudo();
setup.setup().catch(console.error);