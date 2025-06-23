#!/usr/bin/env tsx

import { startWebSocketServer } from '../lib/websocket-server';

console.log('🚀 Starting Fantasy.AI WebSocket Server...');

const port = process.env.WS_PORT ? parseInt(process.env.WS_PORT) : 3001;

try {
  const server = startWebSocketServer(port);
  console.log(`✅ WebSocket server started on port ${port}`);
  console.log('📡 Real-time features active:');
  console.log('   - Live score updates');
  console.log('   - Player performance alerts');
  console.log('   - Trade notifications');
  console.log('   - Achievement unlocks');
  console.log('   - Injury news');
  
  // Keep the process running
  process.on('SIGINT', () => {
    console.log('\n👋 Shutting down WebSocket server...');
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    console.log('\n👋 Shutting down WebSocket server...');
    process.exit(0);
  });
} catch (error) {
  console.error('❌ Failed to start WebSocket server:', error);
  process.exit(1);
}