#!/bin/bash

echo "🚀 Building Fantasy.AI APK for Android..."

# Install EAS CLI if not already installed
if ! command -v eas &> /dev/null; then
    echo "📦 Installing EAS CLI..."
    npm install -g eas-cli
fi

# Login to Expo (you'll need an Expo account)
echo "🔐 Logging into Expo..."
eas login

# Configure the project for EAS Build (first time only)
if [ ! -f "eas.json" ]; then
    echo "⚙️ Configuring EAS Build..."
    eas build:configure
fi

# Build APK for Android
echo "🏗️ Building APK..."
eas build --platform android --profile preview --local

echo "✅ APK build complete! Look for the .apk file in your project directory."
echo "📱 Transfer the APK to your Android device and install it."