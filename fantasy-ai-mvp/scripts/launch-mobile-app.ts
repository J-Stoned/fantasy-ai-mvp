#!/usr/bin/env tsx

import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

const MOBILE_DIR = path.join(__dirname, '../src/mobile');

console.log('🚀 Launching Fantasy.AI Mobile App...\n');

// Check if mobile directory exists
if (!fs.existsSync(MOBILE_DIR)) {
  console.error('❌ Mobile app directory not found at:', MOBILE_DIR);
  process.exit(1);
}

// Check if node_modules exists
const nodeModulesPath = path.join(MOBILE_DIR, 'node_modules');
if (!fs.existsSync(nodeModulesPath)) {
  console.log('📦 Installing dependencies...');
  console.log('This might take a few minutes on first run...\n');
  
  try {
    execSync('npm install', { 
      cwd: MOBILE_DIR, 
      stdio: 'inherit' 
    });
    console.log('\n✅ Dependencies installed successfully!\n');
  } catch (error) {
    console.error('❌ Failed to install dependencies:', error);
    process.exit(1);
  }
}

// Display launch options
console.log('📱 Fantasy.AI Mobile App Ready!\n');
console.log('Choose your platform:\n');
console.log('1. 📱 iOS Simulator (requires Xcode)');
console.log('2. 🤖 Android Emulator (requires Android Studio)');
console.log('3. 🌐 Web Browser (Expo Web)');
console.log('4. 📲 Physical Device (Expo Go)\n');

// Start Expo
console.log('Starting Expo development server...\n');
console.log('📌 Scan the QR code with Expo Go app on your device');
console.log('📌 Press "i" for iOS simulator');
console.log('📌 Press "a" for Android emulator');
console.log('📌 Press "w" for web browser\n');

try {
  execSync('npm start', { 
    cwd: MOBILE_DIR, 
    stdio: 'inherit' 
  });
} catch (error) {
  if (error.signal !== 'SIGINT') {
    console.error('\n❌ Error running mobile app:', error);
    process.exit(1);
  }
}

console.log('\n👋 Mobile app closed');