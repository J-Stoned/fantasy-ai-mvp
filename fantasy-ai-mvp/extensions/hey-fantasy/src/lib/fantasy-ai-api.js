// 🚀 Fantasy.AI API Client
// Connects to our Supabase backend with all 63 tables

export class FantasyAIAPI {
  constructor() {
    this.baseURL = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3000/api'
      : 'https://fantasy-ai.vercel.app/api';
    
    this.supabaseURL = 'https://jhfhsbqrdblytrlrconc.supabase.co';
    this.supabaseKey = 'YOUR_ANON_KEY'; // Public anon key goes here
  }

  async makeRequest(endpoint, options = {}) {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  // Player and roster management
  async getRoster(leagueId) {
    return this.makeRequest(`/leagues/${leagueId}/roster`);
  }

  async getPlayer(playerId) {
    return this.makeRequest(`/players/${playerId}`);
  }

  async getPlayerProjections(playerIds) {
    return this.makeRequest('/players/projections', {
      method: 'POST',
      body: JSON.stringify({ playerIds })
    });
  }

  // AI-powered lineup optimization
  async optimizeLineup(data) {
    const { roster, playerInsights, weatherData, biometricData, scoringSettings } = data;
    
    return this.makeRequest('/ai/optimize-lineup', {
      method: 'POST',
      body: JSON.stringify({
        roster,
        insights: playerInsights,
        weather: weatherData,
        biometrics: biometricData,
        scoring: scoringSettings
      })
    });
  }

  // Trade analysis
  async analyzeTrade(data) {
    return this.makeRequest('/ai/analyze-trade', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // Multimedia insights
  async analyzeMultimediaInsights(insights) {
    return this.makeRequest('/ai/multimedia-analysis', {
      method: 'POST',
      body: JSON.stringify(insights)
    });
  }

  // Weather impact
  async getWeatherImpact(players) {
    const gameIds = [...new Set(players.map(p => p.gameId))];
    return this.makeRequest('/weather/impact', {
      method: 'POST',
      body: JSON.stringify({ gameIds })
    });
  }

  // Biometric data
  async getBiometricData(players) {
    const athleteIds = players.map(p => p.athleteId).filter(Boolean);
    if (athleteIds.length === 0) return [];
    
    return this.makeRequest('/biometrics/latest', {
      method: 'POST',
      body: JSON.stringify({ athleteIds })
    });
  }

  // Performance trends
  async getPerformanceTrends(playerNames) {
    return this.makeRequest('/analytics/performance-trends', {
      method: 'POST',
      body: JSON.stringify({ playerNames })
    });
  }

  // League synchronization
  async updateUserLeagues(leagues) {
    return this.makeRequest('/user/leagues', {
      method: 'PUT',
      body: JSON.stringify({ leagues })
    });
  }

  // High school sports data
  async searchHighSchoolAthletes(query) {
    return this.makeRequest(`/highschool/athletes/search?q=${encodeURIComponent(query)}`);
  }

  async getHighSchoolTeam(teamId) {
    return this.makeRequest(`/highschool/teams/${teamId}`);
  }

  // Equipment recommendations
  async getEquipmentRecommendations(athleteProfile) {
    return this.makeRequest('/equipment/recommendations', {
      method: 'POST',
      body: JSON.stringify(athleteProfile)
    });
  }

  // Podcast content
  async getPodcastInsights(playerName) {
    return this.makeRequest(`/podcasts/insights?player=${encodeURIComponent(playerName)}`);
  }

  // YouTube content
  async getYouTubeAnalysis(query) {
    return this.makeRequest(`/youtube/analysis?q=${encodeURIComponent(query)}`);
  }

  // Social media sentiment
  async getSocialSentiment(entities) {
    return this.makeRequest('/social/sentiment', {
      method: 'POST',
      body: JSON.stringify({ entities })
    });
  }

  // Live game analytics
  async getLiveGameData(gameId) {
    return this.makeRequest(`/games/${gameId}/live`);
  }

  // AI model predictions
  async getAIPredictions(data) {
    return this.makeRequest('/ai/predictions', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // Clutch performance metrics
  async getClutchMetrics(playerId) {
    return this.makeRequest(`/analytics/clutch/${playerId}`);
  }

  // Historical analytics
  async getHistoricalAnalytics(query) {
    return this.makeRequest('/analytics/historical', {
      method: 'POST',
      body: JSON.stringify(query)
    });
  }

  // Voice command processing
  async processVoiceCommand(command, context) {
    return this.makeRequest('/ai/voice-command', {
      method: 'POST',
      body: JSON.stringify({ command, context })
    });
  }

  // General AI query
  async askFantasyAI(question, context = {}) {
    return this.makeRequest('/ai/ask', {
      method: 'POST',
      body: JSON.stringify({ question, context })
    });
  }

  // Waiver wire recommendations
  async getWaiverRecommendations(leagueId, roster) {
    return this.makeRequest('/ai/waiver-recommendations', {
      method: 'POST',
      body: JSON.stringify({ leagueId, roster })
    });
  }

  // Injury reports
  async getInjuryReports(playerIds) {
    return this.makeRequest('/injuries/reports', {
      method: 'POST',
      body: JSON.stringify({ playerIds })
    });
  }

  // DFS lineup optimization
  async optimizeDFSLineup(contest, budget) {
    return this.makeRequest('/dfs/optimize', {
      method: 'POST',
      body: JSON.stringify({ contest, budget })
    });
  }

  // Betting insights
  async getBettingInsights(games) {
    return this.makeRequest('/betting/insights', {
      method: 'POST',
      body: JSON.stringify({ games })
    });
  }

  // Equipment product search
  async searchEquipment(query, filters = {}) {
    const params = new URLSearchParams({ q: query, ...filters });
    return this.makeRequest(`/equipment/search?${params}`);
  }

  // Training dataset access
  async getTrainingDataset(datasetId) {
    return this.makeRequest(`/ai/datasets/${datasetId}`);
  }

  // Model performance metrics
  async getModelPerformance(modelName) {
    return this.makeRequest(`/ai/models/${modelName}/performance`);
  }

  // School district data
  async getSchoolDistrict(districtId) {
    return this.makeRequest(`/highschool/districts/${districtId}`);
  }

  // Contest entry
  async enterContest(contestId, lineup) {
    return this.makeRequest('/contests/enter', {
      method: 'POST',
      body: JSON.stringify({ contestId, lineup })
    });
  }

  // Draft assistant
  async getDraftRecommendations(draftId, position) {
    return this.makeRequest(`/drafts/${draftId}/recommendations?position=${position}`);
  }

  // Subscription management
  async getSubscriptionStatus() {
    return this.makeRequest('/user/subscription');
  }

  // Activity feed
  async getActivityFeed(leagueId) {
    return this.makeRequest(`/leagues/${leagueId}/activity`);
  }

  // Notifications
  async getNotifications() {
    return this.makeRequest('/user/notifications');
  }

  // User preferences
  async updatePreferences(preferences) {
    return this.makeRequest('/user/preferences', {
      method: 'PUT',
      body: JSON.stringify(preferences)
    });
  }
}