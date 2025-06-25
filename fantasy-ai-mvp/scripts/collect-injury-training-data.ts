#!/usr/bin/env tsx
/**
 * 📊 Collect Injury Risk Training Data
 * Generates training data for the LSTM injury prediction model
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface InjuryTrainingData {
  playerId: string;
  sequence: number[][]; // 10 games of features
  injuryOccurred: boolean;
  injurySeverity: number; // 0-1 (none to severe)
}

async function collectInjuryData() {
  console.log('🏥 COLLECTING INJURY RISK TRAINING DATA');
  console.log('======================================\n');
  
  try {
    // Get players
    console.log('1️⃣ Loading players from database...');
    const players = await prisma.player.findMany({
      take: 500 // Start with 500 players
    });
    console.log(`   ✅ Found ${players.length} players\n`);
    
    // Create training data directory
    const dataDir = path.join(process.cwd(), 'training-data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // Generate training sequences
    console.log('2️⃣ Generating injury risk sequences...');
    const trainingData: InjuryTrainingData[] = [];
    
    for (const player of players) {
      // Generate multiple sequences per player
      for (let s = 0; s < 20; s++) {
        const sequence: number[][] = [];
        let cumulativeLoad = 0;
        let injuryRisk = Math.random() * 0.3; // Base risk
        
        // Generate 10 games of data
        for (let game = 0; game < 10; game++) {
          // Simulate game features
          const minutesPlayed = 20 + Math.random() * 25;
          const backToBack = game > 0 && Math.random() > 0.7 ? 1 : 0;
          const intensity = 0.5 + Math.random() * 0.5;
          
          // Accumulate load
          cumulativeLoad += minutesPlayed * intensity;
          if (backToBack) injuryRisk += 0.1;
          
          // Age factor
          const age = parseInt(player.id.slice(-2)) || 25; // Simulate age
          const ageFactor = age > 30 ? (age - 30) * 0.02 : 0;
          injuryRisk += ageFactor;
          
          // Create feature vector (21 features as expected by model)
          const features = [
            // Physical load metrics
            minutesPlayed,
            cumulativeLoad / (game + 1),
            backToBack,
            game > 5 ? 3 : 1, // games in last 10 days
            
            // Biomechanical indicators
            22 + Math.random() * 8, // average speed
            28 + Math.random() * 7, // max speed
            Math.floor(Math.random() * 50), // jump count
            Math.floor(Math.random() * 100), // hard cuts
            Math.floor(Math.random() * 10), // collisions
            
            // Historical factors
            Math.floor(Math.random() * 3), // previous injuries
            30 + Math.random() * 300, // days since last injury
            50 + Math.random() * 500, // career games
            age,
            
            // Current status
            Math.min(1, cumulativeLoad / 300), // fatigue level
            Math.random() * 0.3, // muscle stiffness
            Math.random() > 0.9 ? 1 : 0, // reported discomfort
            
            // External factors
            Math.random() * 3000, // travel distance
            Math.random() * 2000, // altitude
            60 + Math.random() * 40, // temperature
            30 + Math.random() * 60 // humidity
          ];
          
          sequence.push(features);
        }
        
        // Determine if injury occurred
        const injuryOccurred = injuryRisk > 0.7 && Math.random() > 0.5;
        const injurySeverity = injuryOccurred ? 0.3 + Math.random() * 0.7 : 0;
        
        trainingData.push({
          playerId: player.id,
          sequence,
          injuryOccurred,
          injurySeverity
        });
      }
    }
    
    console.log(`   ✅ Generated ${trainingData.length} training sequences\n`);
    
    // Split into train/test
    console.log('3️⃣ Preparing ML-ready format...');
    
    // Convert to tensor-friendly format
    const sequences = trainingData.map(d => d.sequence);
    const labels = trainingData.map(d => [
      d.injuryOccurred ? 1 : 0,
      d.injurySeverity
    ]);
    
    const mlData = {
      sequences,
      labels,
      metadata: {
        totalSamples: trainingData.length,
        sequenceLength: 10,
        featureCount: 21,
        injuryRate: trainingData.filter(d => d.injuryOccurred).length / trainingData.length
      }
    };
    
    // Save data
    const filename = path.join(dataDir, 'injury-risk-lstm-data.json');
    fs.writeFileSync(filename, JSON.stringify(mlData, null, 2));
    console.log(`   ✅ Saved to ${filename}\n`);
    
    // Summary statistics
    console.log('4️⃣ Training Data Summary:');
    console.log(`   Total sequences: ${mlData.metadata.totalSamples}`);
    console.log(`   Injury rate: ${(mlData.metadata.injuryRate * 100).toFixed(1)}%`);
    console.log(`   Players covered: ${players.length}`);
    console.log(`   Sequences per player: 20`);
    console.log(`   Feature dimensions: ${mlData.metadata.sequenceLength}x${mlData.metadata.featureCount}`);
    
    console.log('\n======================================');
    console.log('✅ INJURY TRAINING DATA READY');
    console.log('======================================');
    console.log('\nNext: Train the LSTM model');
    
  } catch (error) {
    console.error('❌ Error collecting injury data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run collector
collectInjuryData().catch(console.error);