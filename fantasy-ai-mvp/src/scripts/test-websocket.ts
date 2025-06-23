#!/usr/bin/env tsx

import { io } from 'socket.io-client';

console.log('🧪 Testing Fantasy.AI WebSocket Connection...\n');

const socket = io('http://localhost:3001', {
  transports: ['websocket']
});

let messageCount = 0;
const startTime = Date.now();

socket.on('connect', () => {
  console.log('✅ Connected to WebSocket server');
  console.log(`📡 Socket ID: ${socket.id}\n`);
  
  // Subscribe to channels
  socket.emit('subscribe', 'global');
  socket.emit('subscribe', 'league:demo-league');
  socket.emit('subscribe', 'user:demo-user');
  
  console.log('📢 Subscribed to channels: global, league:demo-league, user:demo-user\n');
  console.log('⏳ Listening for events (press Ctrl+C to stop)...\n');
});

socket.on('disconnect', () => {
  console.log('\n❌ Disconnected from WebSocket server');
});

socket.on('score_update', (data) => {
  messageCount++;
  console.log(`🏈 [${new Date().toLocaleTimeString()}] Score Update:`);
  console.log(`   ${data.homeTeam} ${data.homeScore} - ${data.awayScore} ${data.awayTeam} (${data.quarter})`);
});

socket.on('player_update', (data) => {
  messageCount++;
  const icon = data.type === 'injury' ? '🚑' : '⚡';
  console.log(`${icon} [${new Date().toLocaleTimeString()}] Player Update:`);
  console.log(`   ${data.playerName}: ${data.message}`);
});

socket.on('trade_alert', (data) => {
  messageCount++;
  console.log(`💱 [${new Date().toLocaleTimeString()}] Trade Alert:`);
  console.log(`   ${data.team1} ↔️ ${data.team2}`);
});

socket.on('achievement_unlocked', (data) => {
  messageCount++;
  console.log(`🏆 [${new Date().toLocaleTimeString()}] Achievement Unlocked:`);
  console.log(`   ${data.achievement.name}: ${data.achievement.description}`);
});

socket.on('error', (error) => {
  console.error('❌ WebSocket Error:', error);
});

// Show statistics every 30 seconds
setInterval(() => {
  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  const rate = messageCount / (elapsed / 60);
  console.log(`\n📊 Stats: ${messageCount} messages received | ${rate.toFixed(1)} msg/min | Uptime: ${elapsed}s\n`);
}, 30000);

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n📈 Final Statistics:');
  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  console.log(`   Total Messages: ${messageCount}`);
  console.log(`   Duration: ${elapsed} seconds`);
  console.log(`   Average Rate: ${(messageCount / (elapsed / 60)).toFixed(1)} messages/minute`);
  console.log('\n👋 Closing connection...');
  socket.disconnect();
  process.exit(0);
});