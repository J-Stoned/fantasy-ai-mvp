# Fantasy.AI Apple Watch App

## Overview
The Fantasy.AI Apple Watch companion app provides quick access to lineup information, live scores, and key alerts directly on your wrist.

## Features

### 1. **Watch Face Complications**
- Live score updates
- Next game countdown
- Projected points display
- Win/loss probability

### 2. **Main App Screens**

#### Home Screen
- Current matchup score
- Projected vs actual points
- Quick actions (optimize, view full lineup)

#### Lineup Screen
- Scrollable list of starting players
- Position, name, and projected points
- Color-coded performance indicators

#### Alerts Screen
- Injury notifications
- Lineup deadline reminders
- Score alerts
- Trade notifications

### 3. **Siri Integration**
- "Hey Siri, what's my fantasy score?"
- "Hey Siri, optimize my Fantasy.AI lineup"
- "Hey Siri, show my fantasy injuries"

### 4. **Haptic Feedback**
- Touchdown vibrations
- Injury alert patterns
- Score update taps

## Implementation Structure

```
watch/
├── WatchApp.swift           # Main watch app entry
├── Views/
│   ├── HomeView.swift       # Main score display
│   ├── LineupView.swift     # Lineup management
│   ├── AlertsView.swift     # Notifications
│   └── ComplicationView.swift
├── Models/
│   ├── WatchLineup.swift
│   ├── WatchScore.swift
│   └── WatchAlert.swift
├── Services/
│   ├── PhoneConnector.swift # Communication with phone
│   └── ComplicationController.swift
└── Resources/
    └── Assets.xcassets
```

## Communication Protocol

### Phone → Watch
```typescript
{
  type: 'lineup' | 'score' | 'alert',
  data: {
    // Specific data based on type
  },
  timestamp: Date
}
```

### Watch → Phone
```typescript
{
  type: 'getLineup' | 'getScores' | 'performAction',
  action?: 'optimize' | 'viewDetails',
  replyRequired: boolean
}
```

## Development Notes

1. **WatchOS Requirements**
   - WatchOS 9.0+
   - SwiftUI for UI
   - Watch Connectivity framework

2. **Complications**
   - Update every 15 minutes minimum
   - Use push updates for critical alerts
   - Optimize for battery life

3. **Performance**
   - Minimize data transfer
   - Cache recent data
   - Use background refresh wisely

## Setup Instructions

1. Add WatchKit App target to Xcode project
2. Configure Info.plist for watch app
3. Set up App Groups for data sharing
4. Implement WatchConnectivity on both sides
5. Design complications for various watch faces

## Testing

- Test on real Apple Watch for haptics
- Verify complication updates
- Test phone-watch sync scenarios
- Validate battery usage