import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { initializeWebSocketServer } from './websocket-server';
import { scoreUpdater } from '@/lib/realtime/score-updater';
import { scheduleJobs } from '@/lib/jobs/job-queue';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

// Create Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

export async function startServer() {
  try {
    await app.prepare();
    
    const server = createServer(async (req, res) => {
      try {
        const parsedUrl = parse(req.url!, true);
        await handle(req, res, parsedUrl);
      } catch (err) {
        console.error('Error occurred handling', req.url, err);
        res.statusCode = 500;
        res.end('internal server error');
      }
    });

    // Initialize WebSocket server
    const wsServer = initializeWebSocketServer(server);
    console.log('✅ WebSocket server initialized');

    // Start background services
    await startBackgroundServices();

    server.once('error', (err) => {
      console.error(err);
      process.exit(1);
    });

    server.listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

async function startBackgroundServices() {
  try {
    // Start score monitoring
    await scoreUpdater.startGlobalMonitoring();
    console.log('✅ Score monitoring started');

    // Schedule recurring jobs
    await scheduleJobs.scheduleLeaderboardUpdates();
    console.log('✅ Leaderboard updates scheduled');

    await scheduleJobs.scheduleDataCollection();
    console.log('✅ Data collection scheduled');

    await scheduleJobs.scheduleMLTraining();
    console.log('✅ ML training scheduled');

    console.log('✅ All background services started');
  } catch (error) {
    console.error('Failed to start background services:', error);
    // Don't exit - server can still run without background services
  }
}

// Graceful shutdown
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

async function shutdown() {
  console.log('Shutting down gracefully...');
  
  // Stop score monitoring
  scoreUpdater.stopGlobalMonitoring();
  
  // Give ongoing requests 10 seconds to complete
  setTimeout(() => {
    process.exit(0);
  }, 10000);
}