# Fantasy.AI Mobile App

## 🚀 Overview
A powerful React Native mobile companion app for Fantasy.AI with cutting-edge features including voice commands, AR player stats, biometric authentication, and real-time updates.

## ✨ Features

### Core Features
- **📱 Native iOS/Android Support**: Built with React Native & Expo
- **🔐 Biometric Authentication**: Face ID/Touch ID login
- **🎙️ Voice Commands**: "Hey Fantasy" voice assistant
- **🥽 AR Player Stats**: View player stats in augmented reality
- **🔔 Push Notifications**: Real-time alerts for lineups, injuries, and scores
- **🔗 Deep Linking**: Navigate directly from notifications
- **📶 Offline Mode**: Full functionality with data sync
- **⌚ Apple Watch App**: Companion app for quick access
- **📊 Home Screen Widgets**: iOS/Android widget support
- **🌐 WebSocket Integration**: Real-time score updates

### Screens
1. **Home**: Dashboard with live scores, quick actions, and AI insights
2. **Lineup**: Drag-and-drop lineup management with optimization
3. **Scores**: Real-time scoring updates across all leagues
4. **Players**: Search, filter, and analyze player stats
5. **Leagues**: Manage multiple fantasy leagues
6. **Profile**: User settings and account management

## 🛠️ Tech Stack

### Frontend
- React Native 0.72.6
- Expo SDK 49
- TypeScript
- React Navigation 6
- React Native Reanimated 3
- React Native Gesture Handler
- Zustand (State Management)
- React Query (Data Fetching)

### Native Features
- Expo Camera (AR)
- Expo Speech (TTS)
- Expo AV (Voice Recognition)
- Expo Notifications
- Expo Local Authentication
- Expo Secure Store
- React Native Voice
- Socket.io Client

### UI Libraries
- React Native Skia
- Lottie React Native
- React Native SVG
- Expo Linear Gradient
- Expo Blur

## 📂 Project Structure

```
src/mobile/
├── App.tsx                    # App entry point
├── app.json                   # Expo configuration
├── package.json              # Dependencies
├── tsconfig.json             # TypeScript config
├── src/
│   ├── screens/              # Screen components
│   │   ├── HomeScreen.tsx
│   │   ├── LineupScreen.tsx
│   │   ├── ScoresScreen.tsx
│   │   ├── PlayersScreen.tsx
│   │   ├── LeaguesScreen.tsx
│   │   ├── ProfileScreen.tsx
│   │   ├── ARCameraScreen.tsx
│   │   └── VoiceAssistantScreen.tsx
│   ├── components/           # Reusable components
│   ├── navigation/           # Navigation setup
│   ├── contexts/             # React contexts
│   │   ├── ThemeContext.tsx
│   │   ├── AuthContext.tsx
│   │   ├── VoiceContext.tsx
│   │   ├── NotificationContext.tsx
│   │   └── WebSocketContext.tsx
│   ├── services/             # API and services
│   ├── store/                # Zustand store
│   ├── types/                # TypeScript types
│   ├── utils/                # Utility functions
│   ├── hooks/                # Custom hooks
│   └── watch/                # Apple Watch app
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac only) or Android Emulator
- Physical device for testing (recommended)

### Installation

1. Navigate to the mobile app directory:
```bash
cd src/mobile
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
# or
expo start
```

4. Run on specific platform:
```bash
npm run ios      # iOS Simulator
npm run android  # Android Emulator
npm run web      # Web browser
```

### Development

1. **Hot Reload**: Enabled by default
2. **Debugging**: Shake device or press `d` in terminal
3. **Type Checking**: `npm run type-check`
4. **Linting**: `npm run lint`

## 🎙️ Voice Commands

### Available Commands
- "Hey Fantasy, show my lineup"
- "Hey Fantasy, optimize my lineup"
- "Hey Fantasy, check scores"
- "Hey Fantasy, bench [player name]"
- "Hey Fantasy, start [player name]"
- "Hey Fantasy, show player stats for [player name]"
- "Hey Fantasy, analyze trade"
- "Hey Fantasy, add [player name] to watchlist"

### Setup
Voice commands are automatically enabled. Users can toggle in Settings.

## 🥽 AR Features

### Player Stats Overlay
1. Point camera at player jersey or trading card
2. See real-time stats overlay
3. Swipe for additional insights
4. Tap to add to lineup

### Requirements
- iOS 11+ with ARKit
- Android 7.0+ with ARCore
- Camera permissions

## 🔔 Push Notifications

### Notification Types
- **Lineup Alerts**: Starting player injured/out
- **Score Updates**: Close games, big plays
- **Trade Offers**: New trades received
- **Waiver Results**: Claims processed
- **News Alerts**: Breaking player news

### Setup
1. Request permissions on first launch
2. Configure in Settings
3. Customize notification preferences

## 📱 Deep Linking

### Supported URLs
- `fantasyai://lineup/week/15`
- `fantasyai://player/patrick-mahomes`
- `fantasyai://trade/12345`
- `fantasyai://scores`
- `https://fantasy.ai/app/*`

## 🌐 WebSocket Events

### Subscribed Events
- `score:update` - Live score changes
- `player:update` - Player stat updates
- `injury:alert` - Injury notifications
- `trade:offer` - New trade offers
- `lineup:alert` - Lineup notifications

## ⌚ Apple Watch Integration

### Features
- View current matchup score
- Check lineup projections
- Receive haptic alerts
- Siri shortcuts
- Watch face complications

### Setup
See `src/watch/README.md` for detailed Watch app documentation.

## 🏗️ Building for Production

### iOS
```bash
expo build:ios
# or with EAS
eas build --platform ios
```

### Android
```bash
expo build:android
# or with EAS
eas build --platform android
```

### Environment Variables
Create `.env` file:
```
EXPO_PUBLIC_API_URL=https://api.fantasy.ai
EXPO_PUBLIC_WS_URL=wss://api.fantasy.ai
EXPO_PUBLIC_SENTRY_DSN=your-sentry-dsn
```

## 🧪 Testing

### Unit Tests
```bash
npm test
```

### E2E Tests
```bash
npm run test:e2e
```

### Device Testing
1. Use Expo Go app for development
2. TestFlight for iOS beta testing
3. Google Play Console for Android beta

## 📊 Performance Optimization

### Best Practices
- Lazy load screens with React.lazy
- Optimize images with expo-image
- Use FlatList for long lists
- Implement proper memoization
- Monitor with React DevTools

### Monitoring
- Sentry for crash reporting
- Analytics with Amplitude/Mixpanel
- Performance monitoring with Firebase

## 🔐 Security

### Implemented Measures
- Biometric authentication
- Secure token storage
- Certificate pinning
- Encrypted WebSocket connections
- Input validation
- Code obfuscation (production)

## 📝 Contributing

1. Fork the repository
2. Create feature branch
3. Follow TypeScript/React Native best practices
4. Write tests for new features
5. Submit pull request

## 🐛 Known Issues

- Voice recognition may be less accurate in noisy environments
- AR features require good lighting
- Watch complications update every 15 minutes (WatchOS limitation)

## 📄 License

Copyright © 2024 Fantasy.AI. All rights reserved.

---

Built with ❤️ by the Fantasy.AI Team