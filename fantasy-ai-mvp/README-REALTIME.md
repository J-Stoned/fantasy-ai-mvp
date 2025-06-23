# 🚀 Fantasy.AI Real-Time Features Guide

## Overview
Fantasy.AI now includes powerful real-time capabilities through WebSocket connections, enabling live updates across the entire platform.

## Real-Time Features

### 📊 Live Score Updates
- Real-time game scores across NFL, NBA, MLB, NHL
- Quarter/period/inning tracking
- Time remaining updates
- Live player statistics

### 🔔 Instant Notifications
- Player injury alerts
- Trade notifications  
- Achievement unlocks
- Weather impact warnings
- Lineup optimization alerts

### 🎯 Interactive Components
- Live data ticker in dashboard
- Floating notification panel
- Connection status indicator
- Real-time score cards

## Getting Started

### 1. Start Everything (Recommended)
```bash
npm run dev:all
```
This starts both the Next.js dev server and WebSocket server concurrently.

### 2. Start Separately
```bash
# Terminal 1 - Start Next.js
npm run dev

# Terminal 2 - Start WebSocket Server
npm run websocket
```

### 3. Access Dashboard
Navigate to http://localhost:3000/dashboard

## WebSocket Architecture

### Server Details
- **Default Port**: 3001
- **Protocol**: Socket.io
- **Reconnection**: Automatic with exponential backoff
- **Simulation**: Demo data in development mode

### Available Channels
- `global` - All users receive updates
- `user:{userId}` - User-specific notifications
- `league:{leagueId}` - League-specific updates
- `player:{playerId}` - Player-specific alerts

### Event Types
- `score_update` - Live game scores
- `player_update` - Player performance/injury
- `trade_alert` - Trade proposals/completions
- `achievement_unlocked` - User achievements
- `system_message` - System-wide announcements

## Dashboard Integration

The real-time system is automatically integrated into all dashboard pages:

1. **Overview Page** - Live performance metrics
2. **Lineup Builder** - Real-time player status
3. **Trade Simulator** - Instant trade alerts
4. **AI Insights** - Live prediction updates
5. **Dominator Suite** - Real-time automation status

## Development Features

### Data Simulation
In development mode, the WebSocket server simulates:
- Live NFL/NBA game scores every 5 seconds
- Player updates every 8 seconds
- Occasional trade alerts
- Random achievement unlocks

### Connection Indicator
- 🟢 Green dot = Connected
- 🔴 Red banner = Disconnected (with auto-reconnect)

### Notification Bell
- Shows unread count
- Click to open notification panel
- Mark as read/clear all functionality

## Customization

### Environment Variables
```env
# WebSocket server port (default: 3001)
WS_PORT=3001

# WebSocket URL for client
NEXT_PUBLIC_WS_URL=http://localhost:3001
```

### Extending Real-Time Features

Add new event types in `src/lib/websocket-service.ts`:
```typescript
export interface CustomEvent {
  type: 'custom_event';
  data: any;
}
```

Subscribe to channels in components:
```typescript
const { subscribe, on } = useWebSocket();

useEffect(() => {
  subscribe('custom-channel');
  
  const handler = (data) => {
    console.log('Received:', data);
  };
  
  on('custom_event', handler);
  
  return () => {
    off('custom_event', handler);
  };
}, []);
```

## Production Deployment

### Vercel Deployment
1. Deploy WebSocket server separately (e.g., Railway, Render)
2. Update `NEXT_PUBLIC_WS_URL` in Vercel environment
3. Enable WebSocket support in hosting provider

### Docker Deployment
```dockerfile
# WebSocket server container
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm install
EXPOSE 3001
CMD ["npm", "run", "websocket"]
```

## Troubleshooting

### Connection Issues
- Check WebSocket server is running on port 3001
- Verify no firewall blocking WebSocket connections
- Check browser console for connection errors

### Missing Updates
- Ensure you're subscribed to correct channels
- Check event handler registration
- Verify server is broadcasting events

### Performance
- Limit notification history to last 50 items
- Implement pagination for large data sets
- Use connection pooling in production

## Next Steps

1. **Production WebSocket Host** - Deploy to dedicated WebSocket service
2. **Redis Integration** - Add Redis for multi-server scaling
3. **Push Notifications** - Mobile app push notification support
4. **WebRTC** - Voice/video chat for league communication
5. **Live Drafts** - Real-time draft room functionality

---

**Remember**: The WebSocket server must be running for real-time features to work!

🎉 Enjoy your real-time Fantasy.AI experience!