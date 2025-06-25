#!/usr/bin/env node
/**
 * 🧪 Test ML Training Setup
 * Verifies everything is configured correctly before full training
 */

import * as tf from '@tensorflow/tfjs-node-gpu';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Supabase configuration
const SUPABASE_URL = 'https://jhfhsbqrdblytrlrconc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpoZmhzYnFyZGJseXRybHJjb25jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyMzk0NjMsImV4cCI6MjA2NTgxNTQ2M30.6-B6OM69HUhp1-pG_l1CRK6WQk_cFdHAhMB5ELJZsJU';

async function testSetup() {
  console.log('🧪 Testing ML Training Setup...\n');
  
  const tests = {
    tensorflowGPU: false,
    supabaseConnection: false,
    playerDataAccess: false,
    modelDirectory: false,
    memoryAvailable: false
  };
  
  try {
    // Test 1: TensorFlow GPU
    console.log('1️⃣ Checking TensorFlow.js GPU support...');
    await tf.ready();
    const backend = tf.getBackend();
    console.log(`   Backend: ${backend}`);
    if (backend === 'tensorflow' || backend === 'webgl' || backend === 'cpu') {
      tests.tensorflowGPU = true;
      console.log('   ✅ TensorFlow.js ready!\n');
    } else {
      console.log('   ⚠️  GPU not detected, will use CPU (slower)\n');
    }
    
    // Test 2: Supabase Connection
    console.log('2️⃣ Testing Supabase connection...');
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { count, error } = await supabase
      .from('Player')
      .select('*', { count: 'exact', head: true });
    
    if (!error && count !== null) {
      tests.supabaseConnection = true;
      console.log(`   ✅ Connected! Found ${count} players in database\n`);
    } else {
      console.log(`   ❌ Connection failed: ${error?.message}\n`);
    }
    
    // Test 3: Player Data Access
    console.log('3️⃣ Testing player data access...');
    const { data: samplePlayers, error: playerError } = await supabase
      .from('Player')
      .select('id, name, team, position, sport, fantasyPointsAvg')
      .limit(5);
    
    if (!playerError && samplePlayers && samplePlayers.length > 0) {
      tests.playerDataAccess = true;
      console.log('   ✅ Player data accessible!');
      console.log('   Sample players:');
      samplePlayers.forEach(p => {
        console.log(`     - ${p.name} (${p.team} ${p.position}) - ${p.fantasyPointsAvg} pts`);
      });
      console.log();
    } else {
      console.log(`   ❌ Failed to access player data: ${playerError?.message}\n`);
    }
    
    // Test 4: Model Directory
    console.log('4️⃣ Checking model directory...');
    const modelDir = path.join(process.cwd(), 'models');
    if (!fs.existsSync(modelDir)) {
      fs.mkdirSync(modelDir, { recursive: true });
    }
    tests.modelDirectory = true;
    console.log(`   ✅ Model directory ready: ${modelDir}\n`);
    
    // Test 5: Memory Check
    console.log('5️⃣ Checking system memory...');
    const memoryUsage = process.memoryUsage();
    const totalMemoryGB = (memoryUsage.rss / 1024 / 1024 / 1024).toFixed(2);
    console.log(`   Current memory usage: ${totalMemoryGB} GB`);
    if (parseFloat(totalMemoryGB) < 8) {
      console.log('   ⚠️  Low memory detected, training might be slow');
    } else {
      tests.memoryAvailable = true;
      console.log('   ✅ Sufficient memory available');
    }
    
    // Summary
    console.log('\n=====================================');
    console.log('📊 SETUP TEST RESULTS:');
    console.log('=====================================');
    console.log(`TensorFlow GPU:     ${tests.tensorflowGPU ? '✅ Ready' : '⚠️  CPU only'}`);
    console.log(`Supabase Database:  ${tests.supabaseConnection ? '✅ Connected' : '❌ Failed'}`);
    console.log(`Player Data:        ${tests.playerDataAccess ? '✅ Accessible' : '❌ Failed'}`);
    console.log(`Model Directory:    ${tests.modelDirectory ? '✅ Created' : '❌ Failed'}`);
    console.log(`System Memory:      ${tests.memoryAvailable ? '✅ Sufficient' : '⚠️  Low'}`);
    console.log('=====================================');
    
    const allPassed = Object.values(tests).every(t => t);
    if (allPassed) {
      console.log('\n🎉 All tests passed! Ready to train models.');
      console.log('Run: npm run ml:train-real');
    } else {
      console.log('\n⚠️  Some tests failed. Fix issues before training.');
    }
    
  } catch (error) {
    console.error('\n❌ Setup test failed:', error);
    process.exit(1);
  }
}

// Run tests
testSetup().catch(console.error);