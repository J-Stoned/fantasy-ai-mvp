# Fantasy.AI Mobile Assets

This directory contains all the assets for the Fantasy.AI mobile application.

## Directory Structure

```
assets/
├── fonts/              # Custom fonts (Inter font family)
│   ├── Inter-Regular.ttf
│   ├── Inter-Bold.ttf
│   └── Inter-SemiBold.ttf
├── images/             # Additional images and graphics
├── icon.png            # App icon (1024x1024)
├── splash.png          # Splash screen (2436x1125)
├── adaptive-icon.png   # Android adaptive icon (1024x1024)
└── favicon.png         # Web favicon (48x48)
```

## Current Status

All files are currently **placeholders** for development. Before production:

1. **Fonts**: Download the Inter font family from [Google Fonts](https://fonts.google.com/specimen/Inter)
2. **Icons**: Replace with actual Fantasy.AI branding
3. **Splash Screen**: Create a proper splash screen with Fantasy.AI branding

## Image Requirements

### App Icon (icon.png)
- Size: 1024x1024 pixels
- Format: PNG with transparency
- Used for: iOS and Android app stores

### Splash Screen (splash.png)
- Size: 2436x1125 pixels (or larger)
- Format: PNG
- Background: #0F172A (dark slate)
- Used for: Loading screen

### Adaptive Icon (adaptive-icon.png)
- Size: 1024x1024 pixels
- Format: PNG with transparency
- Used for: Android adaptive icons
- Note: Should be designed with safe zones for different Android icon shapes

### Favicon (favicon.png)
- Size: 48x48 pixels
- Format: PNG
- Used for: Web app favicon

## Design Guidelines

- Primary Colors:
  - Dark Background: #0F172A
  - Primary Blue: #3B82F6
  - Secondary Purple: #8B5CF6
  - Success Green: #10B981
  - Warning Amber: #F59E0B
  - Error Red: #EF4444

- Font: Inter (Regular, SemiBold, Bold)
- Style: Modern, clean, professional with subtle gradients

## Replacing Placeholders

To replace the placeholder files:

1. Delete the current placeholder files
2. Add your actual asset files with the exact same names
3. Run `npm run start:clear` to clear the cache and reload assets

## Tools for Asset Creation

- **Icons**: Use Figma, Sketch, or Adobe Illustrator
- **Splash Screens**: Design at high resolution and export for different sizes
- **Fonts**: Ensure you have proper licensing for production use

## Useful Commands

```bash
# Clear cache and restart (useful after changing assets)
npm run start:clear

# Create optimized production build
npm run build:all
```