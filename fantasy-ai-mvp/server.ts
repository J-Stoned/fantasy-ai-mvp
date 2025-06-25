import { startServer } from './src/lib/websocket/socket-init';

// Start the server with WebSocket support
startServer().catch((err) => {
  console.error('Server failed to start:', err);
  process.exit(1);
});