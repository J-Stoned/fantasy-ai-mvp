# 🔑 GET FREE API KEYS - QUICK START GUIDE

## 🚀 4 FREE API KEYS TO ACTIVATE FULL DATA COLLECTION

### 1. 🌤️ OpenWeather API (FREE)
**Get weather data for games**
1. Go to: https://openweathermap.org/api
2. Click "Sign Up" (FREE)
3. Confirm email
4. Go to "API Keys" tab
5. Copy your API key
6. Add to `.env`: `OPENWEATHER_API_KEY="your-key-here"`

### 2. 💰 The Odds API (FREE TIER)
**Get betting odds and lines**
1. Go to: https://the-odds-api.com/
2. Click "Get API Key" 
3. Sign up (FREE - 500 requests/month)
4. Check email for API key
5. Add to `.env`: `ODDS_API_KEY="your-key-here"`

### 3. 📰 NewsAPI (FREE TIER)
**Get sports news and articles**
1. Go to: https://newsapi.org/
2. Click "Get API Key"
3. Register (FREE - 100 requests/day)
4. Copy API key from dashboard
5. Add to `.env`: `NEWS_API_KEY="your-key-here"`

### 4. 🎙️ ElevenLabs (FREE TIER)
**Voice AI for assistant**
1. Go to: https://elevenlabs.io/
2. Click "Sign Up" (FREE)
3. Go to Profile → API Keys
4. Create new API key
5. Add to `.env`: `ELEVENLABS_API_KEY="your-key-here"`

## ⚡ QUICK COPY-PASTE

After getting all keys, update your `.env`:

```env
# Add these to your .env file
OPENWEATHER_API_KEY="paste-openweather-key-here"
ODDS_API_KEY="paste-odds-api-key-here"
NEWS_API_KEY="paste-newsapi-key-here"
ELEVENLABS_API_KEY="paste-elevenlabs-key-here"
```

## 🏃 RUN DATA COLLECTION

Once keys are added:

```bash
# Test real data collection
npx tsx scripts/REAL-API-DATA-COLLECTOR.ts

# Run continuous collection
npx tsx scripts/REAL-API-DATA-COLLECTOR.ts --continuous
```

## 📊 CURRENT STATUS
- ✅ Ball Don't Lie API (NBA) - NO KEY NEEDED!
- ⏳ OpenWeather - Needs key
- ⏳ The Odds API - Needs key
- ⏳ NewsAPI - Needs key
- ⏳ ElevenLabs - Needs key

**Total time to get all keys: ~10 minutes**

---
*All APIs have generous free tiers perfect for Fantasy.AI!*