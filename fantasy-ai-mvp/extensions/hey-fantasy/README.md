# 🎙️ Hey Fantasy - Voice-Powered Fantasy Sports Assistant

## 🚀 Installation Guide

### Step 1: Build the Extension
```bash
cd extensions/hey-fantasy
npm install
npm run build
```

### Step 2: Load in Chrome
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select the `extensions/hey-fantasy` folder
5. The Hey Fantasy icon should appear in your toolbar!

### Step 3: Grant Permissions
1. Click the Hey Fantasy icon
2. Allow microphone access when prompted
3. The extension is now ready to use!

## 🎯 How to Use

### Voice Commands
Say "Hey Fantasy" followed by:
- "Optimize my lineup"
- "Who should I start?"
- "Check injuries"
- "Find waiver targets"
- "Analyze this trade"
- "What are the podcasts saying about [player]?"
- "Show me YouTube highlights for [player]"
- "What's the weather impact?"

### Quick Actions
Click the extension icon to:
- 📊 Optimize Lineup
- 🏥 Check Injury Reports
- 📈 Find Waiver Wire Targets
- 🤝 Analyze Trades

### Platform Support
Works seamlessly on:
- ✅ Yahoo Fantasy
- ✅ ESPN Fantasy
- ✅ CBS Sports
- ✅ Sleeper
- ✅ NFL.com
- ✅ DraftKings
- ✅ FanDuel

## 🌟 Features

### 🎤 Voice-First Interface
- Natural language processing
- Always-listening mode
- Context-aware responses
- Multi-language support (coming soon)

### 📊 AI-Powered Analytics
- Lineup optimization using 63 data sources
- Trade analysis with sentiment scoring
- Waiver wire recommendations
- Weather impact analysis

### 🎬 Multimedia Intelligence
- Podcast transcription analysis
- YouTube video insights
- Social media sentiment tracking
- Real-time news aggregation

### 🏫 High School Sports Integration
- Access to complete high school database
- Recruiting profiles and stats
- Equipment recommendations
- Performance tracking

### 💓 Biometric Integration
- WHOOP data analysis
- Recovery score impacts
- Strain level considerations
- Sleep quality factors

## 🔧 Configuration

### API Keys Required
Edit `src/lib/` files to add:
- YouTube Data API key
- Spotify/Apple Podcasts credentials
- Twitter/X Bearer token
- OpenAI API key

### Supabase Connection
Update `src/lib/fantasy-ai-api.js`:
```javascript
this.supabaseURL = 'YOUR_SUPABASE_URL';
this.supabaseKey = 'YOUR_ANON_KEY';
```

## 🛠️ Development

### Project Structure
```
hey-fantasy/
├── manifest.json       # Extension configuration
├── src/
│   ├── background.js   # Service worker
│   ├── content.js      # Page injection
│   ├── popup.js        # Extension popup
│   └── lib/            # Core libraries
├── public/
│   ├── popup.html      # Popup interface
│   └── icons/          # Extension icons
└── components/         # React components
```

### Building from Source
```bash
# Install dependencies
npm install

# Development build with watch
npm run dev

# Production build
npm run build

# Run tests
npm test
```

## 📱 Mobile Companion App
Coming soon! The Hey Fantasy mobile app will sync with the browser extension for:
- Push notifications
- Voice commands on the go
- Apple Watch integration
- Android Wear support

## 🔒 Privacy & Security
- All voice processing happens locally
- No audio is stored or transmitted
- League data is encrypted
- GDPR compliant

## 🐛 Troubleshooting

### Voice Recognition Not Working
1. Check microphone permissions
2. Ensure you're on HTTPS sites
3. Try refreshing the page
4. Check Chrome audio settings

### Extension Not Appearing
1. Verify Developer Mode is enabled
2. Check for errors in chrome://extensions
3. Try reloading the extension
4. Clear Chrome cache

### Platform Integration Issues
1. Make sure you're logged into the fantasy platform
2. Refresh the page after installing
3. Check console for errors (F12)
4. Try disabling other extensions

## 📞 Support
- GitHub Issues: [Report bugs](https://github.com/fantasy-ai/hey-fantasy)
- Discord: [Join our community](https://discord.gg/fantasyai)
- Email: support@fantasy.ai

## 🎉 What's Next?
- [ ] Safari extension
- [ ] Firefox add-on
- [ ] Edge extension
- [ ] Mobile apps (iOS/Android)
- [ ] Smart speaker integration
- [ ] AR glasses support

---

**Built with ❤️ by the Fantasy.AI team**

*Hey Fantasy is your AI-powered copilot for dominating fantasy sports!*