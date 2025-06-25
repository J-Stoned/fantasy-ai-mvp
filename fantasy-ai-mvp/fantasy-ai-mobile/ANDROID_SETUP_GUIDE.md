# 📱 Fantasy.AI Android Setup Guide

## Quick Start (Using Expo Go)

1. **Install Expo Go** from Google Play Store:
   - [Download Expo Go](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. **Start the app**:
   ```bash
   cd fantasy-ai-mobile
   npm start
   ```

3. **Scan QR code** with Expo Go app

## 🚀 Development Setup

### Prerequisites
- Node.js 16+ installed
- Android device with Developer Mode enabled
- Same WiFi network for device and computer

### Enable Developer Mode on Android
1. Settings → About Phone
2. Tap "Build Number" 7 times
3. Go back → Developer Options
4. Enable "USB Debugging"

### Running the App

#### Option 1: Wireless (Expo Go)
```bash
# Start Metro bundler
npm start

# Press 'a' to open on Android
# Or scan QR code with Expo Go
```

#### Option 2: USB Connection
```bash
# Check device is connected
adb devices

# Run directly on device
npx expo run:android
```

## 🏗️ Building APK for Testing

### Method 1: Local Build (Fastest)
```bash
# Build debug APK
npx expo run:android --variant release

# APK location: android/app/build/outputs/apk/release/
```

### Method 2: EAS Build (Recommended)
```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo account
eas login

# Build APK
eas build --platform android --profile preview

# Download APK from the link provided
```

### Method 3: Quick Development Build
```bash
# Generate APK without Expo servers
npx expo export:android

# Find APK in: dist/
```

## 📲 Installing APK on Device

1. **Transfer APK** to your device via:
   - USB cable
   - Google Drive
   - Email
   - WhatsApp

2. **Enable "Install Unknown Apps"**:
   - Settings → Security
   - Enable "Unknown Sources" or "Install Unknown Apps"

3. **Install the APK**:
   - Open file manager
   - Locate the APK
   - Tap to install

## 🐛 Troubleshooting

### "Metro bundler not found"
```bash
# Clear cache and restart
npx expo start -c
```

### "Device not authorized"
1. Disconnect USB
2. Revoke USB debugging authorizations
3. Reconnect and accept prompt

### "App crashes on startup"
```bash
# Check logs
adb logcat | grep -i fantasy

# Clear app data
adb shell pm clear com.fantasyai.mobile
```

### "Network request failed"
- Ensure device and computer are on same network
- Check API URL in .env.local
- Try using your computer's IP instead of localhost

## 🎯 Quick Commands

```bash
# Start with cache clear
npm start -- --clear

# Run on specific device
adb devices  # Get device ID
npx expo run:android --device [DEVICE_ID]

# Build and install immediately
npx expo run:android --no-build-cache

# Open in Android Studio
npx expo run:android --no-install
```

## 📱 Testing Features

Once installed, test these key features:

1. **Authentication**
   - Login with test@fantasy.ai / password123
   - Try biometric authentication

2. **Voice Commands**
   - Tap microphone icon
   - Say "Hey Fantasy, what's my best lineup?"

3. **Real-time Updates**
   - Check WebSocket connection indicator
   - Watch live score ticker

4. **API Test Screen**
   - Profile → API Test (Dev)
   - Run all tests to verify connection

## 🚀 Performance Tips

1. **Enable Hermes** (already configured):
   - 50% faster app startup
   - Lower memory usage

2. **Use Release Build** for testing:
   ```bash
   npx expo run:android --variant release
   ```

3. **Monitor Performance**:
   - Shake device → Show Perf Monitor
   - Check FPS and RAM usage

## Need Help?

- Check logs: `adb logcat`
- Expo forums: https://forums.expo.dev
- Create issue: https://github.com/anthropics/claude-code/issues

Happy testing! 🎉