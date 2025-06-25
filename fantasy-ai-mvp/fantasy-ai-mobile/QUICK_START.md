# 🚀 Fantasy.AI Mobile - Quick Start Guide

## Option 1: Direct Command (Simplest)

Open a terminal/command prompt and run:

```bash
cd fantasy-ai-mvp/fantasy-ai-mobile
npx expo start
```

## Option 2: If that doesn't work

```bash
cd fantasy-ai-mvp/fantasy-ai-mobile
npm install expo --save-dev
npx expo start
```

## Option 3: Use the provided scripts

**Windows:**
```bash
cd fantasy-ai-mvp/fantasy-ai-mobile
start-android.bat
```

**Mac/Linux:**
```bash
cd fantasy-ai-mvp/fantasy-ai-mobile
./start-android.sh
```

## What happens next:

1. A QR code will appear in your terminal
2. Open Expo Go app on your Android
3. Tap "Scan QR Code"
4. Point at the QR code in your terminal
5. The app will load!

## Test Login:
- Email: test@fantasy.ai
- Password: password123

## Troubleshooting:

If you see "Something went wrong":
1. Make sure phone and computer are on same WiFi
2. Try: `npx expo start --tunnel`
3. Or use your computer's IP: `npx expo start --host [YOUR_IP]`

## Need the IP address?
- Windows: `ipconfig` (look for IPv4 Address)
- Mac/Linux: `ifconfig` or `ip addr`