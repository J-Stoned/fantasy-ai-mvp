# Fantasy.AI Mobile App Setup Guide

## Prerequisites

- Node.js 16+ and npm/yarn
- Expo CLI: `npm install -g expo-cli`
- EAS CLI (for builds): `npm install -g eas-cli`
- iOS: Xcode 14+ (Mac only)
- Android: Android Studio with Android SDK

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm start
   ```

3. **Run on specific platform:**
   ```bash
   npm run ios      # iOS Simulator (Mac only)
   npm run android  # Android Emulator/Device
   npm run web      # Web Browser
   ```

## Development Scripts

### Common Commands

- `npm start` - Start Expo development server
- `npm run start:clear` - Start with cache cleared (use after asset changes)
- `npm run dev` - Start with dev client
- `npm run preview` - Preview production build locally

### Platform-Specific

- `npm run ios` - Run on iOS simulator
- `npm run android` - Run on Android emulator/device
- `npm run web` - Run in web browser

### Building

- `npm run build:ios` - Build iOS app with EAS
- `npm run build:android` - Build Android app with EAS
- `npm run build:all` - Build for all platforms

### Testing & Quality

- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage
- `npm run lint` - Check code style
- `npm run lint:fix` - Fix code style issues
- `npm run type-check` - Check TypeScript types
- `npm run format` - Format code with Prettier

### Maintenance

- `npm run clean` - Clean all generated files
- `npm run reset` - Full reset (clean + reinstall + clear cache)

## Project Structure

```
fantasy-ai-mobile/
├── App.tsx                 # Main app entry point
├── app.json               # Expo configuration
├── assets/                # Images, fonts, and other assets
├── src/
│   ├── components/        # Reusable UI components
│   ├── contexts/          # React contexts (Auth, Theme, Voice, etc.)
│   ├── navigation/        # Navigation configuration
│   ├── screens/           # App screens
│   ├── services/          # API and external services
│   ├── theme/             # Theme configuration
│   └── types/             # TypeScript type definitions
└── package.json          # Dependencies and scripts
```

## Environment Setup

1. **Create `.env.local` file:**
   ```env
   EXPO_PUBLIC_API_URL=http://localhost:3000/api
   EXPO_PUBLIC_WS_URL=ws://localhost:3000
   ```

2. **For production builds, update `app.json`:**
   ```json
   "extra": {
     "apiUrl": "https://your-production-api.com/api",
     "websocketUrl": "wss://your-production-api.com"
   }
   ```

## Running on Physical Devices

### iOS (iPhone/iPad)
1. Install Expo Go app from App Store
2. Scan QR code from terminal with Camera app
3. Open in Expo Go

### Android
1. Install Expo Go app from Google Play
2. Scan QR code from Expo Go app
3. Or shake device and enter URL manually

## Troubleshooting

### Clear Cache
```bash
npm run start:clear
```

### Reset Everything
```bash
npm run reset
```

### Common Issues

1. **Metro bundler issues:**
   - Clear cache: `npx expo start -c`
   - Reset Metro: `npx react-native start --reset-cache`

2. **iOS Simulator not opening:**
   - Make sure Xcode is installed
   - Open Xcode once to accept licenses
   - Try: `xcrun simctl list devices`

3. **Android Emulator not found:**
   - Open Android Studio
   - Start AVD Manager
   - Create/start an emulator

4. **Asset loading issues:**
   - Ensure all assets exist in `assets/` directory
   - Run `npm run start:clear` after adding new assets

## Production Builds

### Using EAS Build

1. **Login to Expo account:**
   ```bash
   eas login
   ```

2. **Configure project:**
   ```bash
   eas build:configure
   ```

3. **Build for stores:**
   ```bash
   npm run build:ios      # iOS App Store
   npm run build:android  # Google Play Store
   ```

### Local Builds (Advanced)

1. **Prebuild native projects:**
   ```bash
   npm run prebuild
   ```

2. **Build with native tools:**
   - iOS: Open `ios/` in Xcode
   - Android: Open `android/` in Android Studio

## Next Steps

1. Replace placeholder assets in `assets/` directory
2. Update API endpoints in environment configuration
3. Test on physical devices
4. Set up EAS Build for production releases

For more information, see the [Expo documentation](https://docs.expo.dev/).