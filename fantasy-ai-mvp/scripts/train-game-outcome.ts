#!/usr/bin/env tsx
/**
 * 🏈 Train Game Outcome Predictor Model
 * Neural networks for predicting game outcomes and player impacts
 */

import * as tf from '@tensorflow/tfjs-node';
import * as fs from 'fs';
import * as path from 'path';
import { gameOutcomePredictor } from '../src/lib/ml/models/game-outcome-predictor';

process.env['TF_CPP_MIN_LOG_LEVEL'] = '2';

async function trainGameOutcomePredictor() {
  console.log('🏈 TRAINING GAME OUTCOME PREDICTOR');
  console.log('==================================\n');
  
  try {
    // Initialize models
    console.log('1️⃣ Initializing game outcome predictor...');
    await gameOutcomePredictor.initialize();
    console.log('   ✅ Models initialized\n');
    
    // Generate training data
    console.log('2️⃣ Generating game scenarios...');
    const { outcomeData, scoreData, impactData } = generateTrainingData(5000);
    console.log(`   ✅ Generated ${outcomeData.length} game scenarios\n`);
    
    // Get model references
    const models = (gameOutcomePredictor as any);
    
    // Train outcome model
    console.log('3️⃣ Training Game Outcome Model...');
    await trainOutcomeModel(models.outcomeModel, outcomeData);
    
    // Train score model
    console.log('4️⃣ Training Score Prediction Model...');
    await trainScoreModel(models.scoreModel, scoreData);
    
    // Train player impact model
    console.log('5️⃣ Training Player Impact Model...');
    await trainImpactModel(models.playerImpactModel, impactData);
    
    // Save models
    console.log('6️⃣ Saving models...');
    await gameOutcomePredictor.saveModels();
    console.log('   ✅ Models saved\n');
    
    // Test prediction
    console.log('7️⃣ Testing game prediction...');
    const testGame = createTestGame();
    const prediction = await gameOutcomePredictor.predictGame(
      testGame.context,
      testGame.players
    );
    
    console.log('\n🏈 Game Prediction:');
    console.log('------------------');
    console.log(`${testGame.context.awayTeam.abbreviation} @ ${testGame.context.homeTeam.abbreviation}`);
    console.log(`\nPrediction: ${prediction.winner} wins by ${Math.abs(prediction.spread)} points`);
    console.log(`Confidence: ${prediction.confidence.toFixed(1)}%`);
    console.log(`Score: ${prediction.homeScore}-${prediction.awayScore}`);
    console.log(`Total Points: ${prediction.totalPoints}`);
    
    console.log('\nGame Factors:');
    Object.entries(prediction.factors).forEach(([key, value]) => {
      console.log(`  ${key}: ${value > 0 ? '+' : ''}${(value * 100).toFixed(1)}%`);
    });
    
    console.log('\nTop Player Impacts:');
    prediction.playerImpacts.slice(0, 3).forEach(impact => {
      console.log(`  ${impact.name}: ${impact.projectedChange > 0 ? '+' : ''}${impact.projectedChange.toFixed(1)}%`);
      console.log(`    - ${impact.reasoning}`);
    });
    
    console.log('\n==================================');
    console.log('🎉 GAME OUTCOME PREDICTOR TRAINED!');
    console.log('==================================');
    console.log('✅ 3 models trained successfully');
    console.log('✅ Ready for game predictions');
    
  } catch (error) {
    console.error('❌ Training failed:', error);
  }
}

async function trainOutcomeModel(
  model: tf.LayersModel,
  data: { features: number[]; winner: number }[]
) {
  // Prepare data
  const features = data.map(d => d.features);
  const targets = data.map(d => [d.winner]);
  
  const xTensor = tf.tensor2d(features);
  const yTensor = tf.tensor2d(targets);
  
  // Split
  const splitIdx = Math.floor(features.length * 0.8);
  const xTrain = xTensor.slice([0, 0], [splitIdx, -1]);
  const yTrain = yTensor.slice([0, 0], [splitIdx, -1]);
  const xVal = xTensor.slice([splitIdx, 0], [-1, -1]);
  const yVal = yTensor.slice([splitIdx, 0], [-1, -1]);
  
  // Train
  console.log('   Training on game outcomes...');
  await model.fit(xTrain, yTrain, {
    epochs: 20,
    batchSize: 32,
    validationData: [xVal, yVal],
    verbose: 0,
    callbacks: {
      onEpochEnd: (epoch, logs) => {
        if ((epoch + 1) % 5 === 0) {
          console.log(`     Epoch ${epoch + 1}/20 - Loss: ${logs?.loss?.toFixed(3)}, Acc: ${(logs?.acc * 100).toFixed(1)}%`);
        }
      }
    }
  });
  
  // Evaluate
  const evalResult = model.evaluate(xVal, yVal, { verbose: 0 }) as tf.Tensor[];
  const [loss, acc] = await Promise.all(evalResult.map(t => t.data()));
  console.log(`   ✅ Training complete - Accuracy: ${(acc[0] * 100).toFixed(1)}%\n`);
  
  // Cleanup
  xTensor.dispose();
  yTensor.dispose();
  xTrain.dispose();
  yTrain.dispose();
  xVal.dispose();
  yVal.dispose();
  evalResult.forEach(t => t.dispose());
}

async function trainScoreModel(
  model: tf.LayersModel,
  data: { features: number[]; scores: number[] }[]
) {
  // Prepare data
  const features = data.map(d => d.features);
  const targets = data.map(d => d.scores);
  
  const xTensor = tf.tensor2d(features);
  const yTensor = tf.tensor2d(targets);
  
  // Split
  const splitIdx = Math.floor(features.length * 0.8);
  const xTrain = xTensor.slice([0, 0], [splitIdx, -1]);
  const yTrain = yTensor.slice([0, 0], [splitIdx, -1]);
  const xVal = xTensor.slice([splitIdx, 0], [-1, -1]);
  const yVal = yTensor.slice([splitIdx, 0], [-1, -1]);
  
  // Train
  console.log('   Training on score predictions...');
  await model.fit(xTrain, yTrain, {
    epochs: 25,
    batchSize: 32,
    validationData: [xVal, yVal],
    verbose: 0,
    callbacks: {
      onEpochEnd: (epoch, logs) => {
        if ((epoch + 1) % 5 === 0) {
          console.log(`     Epoch ${epoch + 1}/25 - MAE: ${logs?.mae?.toFixed(2)} points`);
        }
      }
    }
  });
  
  // Evaluate
  const evalResult = model.evaluate(xVal, yVal, { verbose: 0 }) as tf.Tensor[];
  const [loss, mae] = await Promise.all(evalResult.map(t => t.data()));
  console.log(`   ✅ Training complete - MAE: ${mae[0].toFixed(2)} points\n`);
  
  // Cleanup
  xTensor.dispose();
  yTensor.dispose();
  xTrain.dispose();
  yTrain.dispose();
  xVal.dispose();
  yVal.dispose();
  evalResult.forEach(t => t.dispose());
}

async function trainImpactModel(
  model: tf.LayersModel,
  data: { features: number[]; impact: number }[]
) {
  // Prepare data
  const features = data.map(d => d.features);
  const targets = data.map(d => [d.impact]);
  
  const xTensor = tf.tensor2d(features);
  const yTensor = tf.tensor2d(targets);
  
  // Split
  const splitIdx = Math.floor(features.length * 0.8);
  const xTrain = xTensor.slice([0, 0], [splitIdx, -1]);
  const yTrain = yTensor.slice([0, 0], [splitIdx, -1]);
  const xVal = xTensor.slice([splitIdx, 0], [-1, -1]);
  const yVal = yTensor.slice([splitIdx, 0], [-1, -1]);
  
  // Train
  console.log('   Training on player impacts...');
  await model.fit(xTrain, yTrain, {
    epochs: 15,
    batchSize: 32,
    validationData: [xVal, yVal],
    verbose: 0,
    callbacks: {
      onEpochEnd: (epoch, logs) => {
        if ((epoch + 1) % 5 === 0) {
          console.log(`     Epoch ${epoch + 1}/15 - MAE: ${(logs?.mae * 20).toFixed(2)}%`);
        }
      }
    }
  });
  
  // Evaluate
  const evalResult = model.evaluate(xVal, yVal, { verbose: 0 }) as tf.Tensor[];
  const [loss, mae] = await Promise.all(evalResult.map(t => t.data()));
  console.log(`   ✅ Training complete - MAE: ${(mae[0] * 20).toFixed(2)}%\n`);
  
  // Cleanup
  xTensor.dispose();
  yTensor.dispose();
  xTrain.dispose();
  yTrain.dispose();
  xVal.dispose();
  yVal.dispose();
  evalResult.forEach(t => t.dispose());
}

function generateTrainingData(gameCount: number) {
  const outcomeData = [];
  const scoreData = [];
  const impactData = [];
  
  for (let i = 0; i < gameCount; i++) {
    const game = generateRandomGame();
    
    // Outcome data
    outcomeData.push({
      features: createOutcomeFeatures(game),
      winner: game.homeWins ? 1 : 0
    });
    
    // Score data
    scoreData.push({
      features: createScoreFeatures(game),
      scores: [game.homeScore, game.awayScore]
    });
    
    // Impact data for each player
    game.players.forEach(player => {
      impactData.push({
        features: createImpactFeatures(player, game),
        impact: player.impact
      });
    });
  }
  
  return { outcomeData, scoreData, impactData };
}

function generateRandomGame() {
  const teams = [
    { abbr: 'KC', off: 28, def: 22, pace: 65 },
    { abbr: 'BUF', off: 27, def: 19, pace: 68 },
    { abbr: 'SF', off: 25, def: 17, pace: 62 },
    { abbr: 'DAL', off: 26, def: 21, pace: 64 },
    { abbr: 'PHI', off: 29, def: 24, pace: 71 },
    { abbr: 'MIA', off: 30, def: 26, pace: 73 },
    { abbr: 'CIN', off: 24, def: 20, pace: 66 },
    { abbr: 'BAL', off: 22, def: 16, pace: 60 }
  ];
  
  const homeTeam = teams[Math.floor(Math.random() * teams.length)];
  const awayTeam = teams[Math.floor(Math.random() * teams.length)];
  
  // Calculate expected scores
  const homeExpected = (homeTeam.off + awayTeam.def) / 2 + 3; // Home advantage
  const awayExpected = (awayTeam.off + homeTeam.def) / 2;
  
  // Add randomness
  const homeScore = Math.max(0, homeExpected + (Math.random() - 0.5) * 14);
  const awayScore = Math.max(0, awayExpected + (Math.random() - 0.5) * 14);
  
  // Generate player impacts
  const players = [];
  const positions = ['QB', 'RB', 'WR', 'TE'];
  
  for (let i = 0; i < 10; i++) {
    const isHome = i < 5;
    const team = isHome ? homeTeam : awayTeam;
    const baseImpact = isHome && homeScore > awayScore ? 0.1 : -0.1;
    
    players.push({
      position: positions[i % 4],
      team: team.abbr,
      averagePoints: 10 + Math.random() * 20,
      impact: baseImpact + (Math.random() - 0.5) * 0.4
    });
  }
  
  return {
    homeTeam: {
      abbreviation: homeTeam.abbr,
      offensiveRating: homeTeam.off,
      defensiveRating: homeTeam.def,
      pace: homeTeam.pace,
      form: 0.5 + Math.random() * 0.5,
      lastGameResult: Math.random() > 0.5 ? 'W' : 'L',
      restDays: 3 + Math.floor(Math.random() * 5),
      injuries: Math.floor(Math.random() * 3),
      homeRecord: `${Math.floor(Math.random() * 8)}-${Math.floor(Math.random() * 8)}`
    },
    awayTeam: {
      abbreviation: awayTeam.abbr,
      offensiveRating: awayTeam.off,
      defensiveRating: awayTeam.def,
      pace: awayTeam.pace,
      form: 0.5 + Math.random() * 0.5,
      lastGameResult: Math.random() > 0.5 ? 'W' : 'L',
      restDays: 3 + Math.floor(Math.random() * 5),
      injuries: Math.floor(Math.random() * 3),
      awayRecord: `${Math.floor(Math.random() * 8)}-${Math.floor(Math.random() * 8)}`
    },
    weather: {
      temperature: 32 + Math.random() * 60,
      wind: Math.random() * 25,
      precipitation: Math.random() > 0.7 ? Math.random() : 0,
      dome: Math.random() > 0.6
    },
    primetime: Math.random() > 0.8,
    divisional: Math.random() > 0.7,
    weekNumber: 1 + Math.floor(Math.random() * 18),
    homeScore,
    awayScore,
    homeWins: homeScore > awayScore,
    players
  };
}

function createOutcomeFeatures(game: any): number[] {
  return [
    // Team ratings
    game.homeTeam.offensiveRating / 30,
    game.homeTeam.defensiveRating / 30,
    game.awayTeam.offensiveRating / 30,
    game.awayTeam.defensiveRating / 30,
    
    // Pace and style
    game.homeTeam.pace / 100,
    game.awayTeam.pace / 100,
    
    // Form and momentum
    game.homeTeam.form,
    game.awayTeam.form,
    game.homeTeam.lastGameResult === 'W' ? 1 : 0,
    game.awayTeam.lastGameResult === 'W' ? 1 : 0,
    
    // Rest advantage
    Math.tanh(game.homeTeam.restDays / 7),
    Math.tanh(game.awayTeam.restDays / 7),
    
    // Injuries
    1 - game.homeTeam.injuries / 5,
    1 - game.awayTeam.injuries / 5,
    
    // Home advantage
    1,
    parseRecord(game.homeTeam.homeRecord),
    parseRecord(game.awayTeam.awayRecord),
    
    // Game context
    game.primetime ? 1 : 0,
    game.divisional ? 1 : 0,
    game.weekNumber / 18,
    
    // Weather
    game.weather && !game.weather.dome ? game.weather.temperature / 100 : 0.7,
    game.weather && !game.weather.dome ? game.weather.wind / 30 : 0,
    game.weather && !game.weather.dome ? game.weather.precipitation : 0,
    
    // Matchup specific
    (game.homeTeam.offensiveRating - game.awayTeam.defensiveRating) / 20,
    (game.awayTeam.offensiveRating - game.homeTeam.defensiveRating) / 20,
    
    // Historical
    0.52,
    
    // Padding
    Math.random() * 0.1,
    Math.random() * 0.1,
    Math.random() * 0.1,
    1
  ];
}

function createScoreFeatures(game: any): number[] {
  const outcomeFeatures = createOutcomeFeatures(game);
  
  // Add score-specific features
  return [...outcomeFeatures,
    // Combined ratings
    (game.homeTeam.offensiveRating + game.awayTeam.offensiveRating) / 60,
    (game.homeTeam.defensiveRating + game.awayTeam.defensiveRating) / 60,
    
    // Total pace
    (game.homeTeam.pace + game.awayTeam.pace) / 200,
    
    // Scoring environment
    game.weather && !game.weather.dome && game.weather.wind > 20 ? 0.8 : 1,
    game.weekNumber > 14 ? 1.1 : 1
  ];
}

function createImpactFeatures(player: any, game: any): number[] {
  const isHome = player.team === game.homeTeam.abbreviation;
  const team = isHome ? game.homeTeam : game.awayTeam;
  const opponent = isHome ? game.awayTeam : game.homeTeam;
  
  const features = [
    // Player base stats
    player.averagePoints / 30,
    positionToNumber(player.position) / 6,
    
    // Team context
    team.offensiveRating / 30,
    opponent.defensiveRating / 30,
    team.pace / 100,
    team.form,
    
    // Matchup
    (team.offensiveRating - opponent.defensiveRating) / 20,
    isHome ? 0.1 : -0.1,
    
    // Game context
    isHome ? 1 : 0,
    game.primetime ? 1 : 0,
    game.divisional ? 1 : 0,
    
    // Environmental
    game.weather && !game.weather.dome && game.weather.wind > 20 ? -0.1 : 0,
    team.restDays / 7,
    
    // Position-specific
    player.position === 'QB' && game.weather?.wind > 20 ? -0.2 : 0,
    player.position === 'RB' && opponent.defensiveRating < 20 ? 0.2 : 0,
    player.position === 'WR' && team.pace > 70 ? 0.1 : 0,
    
    // Injuries
    1 - team.injuries / 5,
    
    // Random factors
    Math.random() * 0.1,
    Math.random() * 0.1,
    Math.random() * 0.1,
    Math.random() * 0.1,
    Math.random() * 0.1,
    Math.random() * 0.1,
    1
  ];
  
  // Ensure we have exactly 25 features
  while (features.length < 25) features.push(0);
  return features.slice(0, 25);
}

function createTestGame() {
  return {
    context: {
      gameId: 'test-game-1',
      homeTeam: {
        teamId: '1',
        name: 'Kansas City Chiefs',
        abbreviation: 'KC',
        offensiveRating: 28.5,
        defensiveRating: 21.2,
        pace: 65.3,
        homeRecord: '7-1',
        awayRecord: '4-3',
        lastGameResult: 'W' as const,
        restDays: 7,
        injuries: 1,
        form: 0.85
      },
      awayTeam: {
        teamId: '2',
        name: 'Buffalo Bills',
        abbreviation: 'BUF',
        offensiveRating: 27.8,
        defensiveRating: 19.5,
        pace: 68.1,
        homeRecord: '6-2',
        awayRecord: '5-2',
        lastGameResult: 'W' as const,
        restDays: 4,
        injuries: 2,
        form: 0.75
      },
      venue: 'Arrowhead Stadium',
      weather: {
        temperature: 42,
        wind: 15,
        precipitation: 0,
        dome: false
      },
      primetime: true,
      divisional: false,
      weekNumber: 11,
      season: 2024
    },
    players: [
      { id: '1', name: 'Patrick Mahomes', team: 'KC', position: 'QB', averagePoints: 24.5 },
      { id: '2', name: 'Josh Allen', team: 'BUF', position: 'QB', averagePoints: 26.2 },
      { id: '3', name: 'Isiah Pacheco', team: 'KC', position: 'RB', averagePoints: 15.3 },
      { id: '4', name: 'James Cook', team: 'BUF', position: 'RB', averagePoints: 14.8 },
      { id: '5', name: 'Travis Kelce', team: 'KC', position: 'TE', averagePoints: 16.7 }
    ]
  };
}

function parseRecord(record: string): number {
  const [wins, losses] = record.split('-').map(Number);
  return wins / (wins + losses || 1);
}

function positionToNumber(position: string): number {
  const positions: Record<string, number> = {
    'QB': 1, 'RB': 2, 'WR': 3, 'TE': 4, 'K': 5, 'DST': 6
  };
  return positions[position] || 0;
}

// Run training
trainGameOutcomePredictor().catch(console.error);