/**
 * HEY FANTASY - Ad Management System
 * Non-intrusive, sports-targeted advertising for revenue generation
 */

class AdManager {
  constructor() {
    this.adProviders = new Map();
    this.adCache = new Map();
    this.userPreferences = {};
    this.analytics = {
      impressions: 0,
      clicks: 0,
      revenue: 0,
      ctr: 0
    };
    
    // Ad configuration
    this.config = {
      maxAdsPerSession: 5,
      minTimeBetweenAds: 300000, // 5 minutes
      targetedCategories: ['sports', 'fantasy', 'gambling', 'fitness'],
      adFormats: ['banner', 'native', 'video'],
      maxAdDuration: 30000, // 30 seconds
      respectDoNotTrack: true
    };
    
    // Revenue sharing configuration
    this.revenueConfig = {
      cpmRates: {
        sports: 8.50,
        fantasy: 12.00,
        gambling: 15.00,
        premium: 6.00
      },
      seasonalMultipliers: {
        'nfl-season': 1.4,
        'nba-season': 1.2,
        'mlb-season': 1.1,
        'fantasy-playoffs': 1.8
      }
    };
    
    this.lastAdTime = 0;
    this.sessionAdCount = 0;
    
    this.init();
  }
  
  async init() {
    // Load user preferences
    await this.loadUserPreferences();
    
    // Initialize ad providers
    await this.initializeAdProviders();
    
    // Set up analytics tracking
    this.setupAnalytics();
    
    // Check for seasonal multipliers
    this.updateSeasonalRates();
    
    console.log('Ad Manager initialized!');
  }
  
  async loadUserPreferences() {
    return new Promise((resolve) => {
      chrome.storage.sync.get([
        'adPreferences',
        'favoriteTeams',
        'favoriteePlayers',
        'sports',
        'doNotTrack'
      ], (result) => {
        this.userPreferences = {
          adDisplay: result.adPreferences || 'non-intrusive',
          favoriteTeams: result.favoriteTeams || [],
          favoritePlayers: result.favoritePlayers || [],
          sports: result.sports || ['nfl', 'nba'],
          doNotTrack: result.doNotTrack || false
        };
        resolve();
      });
    });
  }
  
  async initializeAdProviders() {
    // Initialize multiple ad networks for better fill rates
    this.adProviders.set('google-adsense', {
      publisherId: 'ca-pub-XXXXXXXXXX', // Would be real publisher ID
      fillRate: 0.95,
      avgCPM: 8.50,
      categories: ['sports', 'fantasy', 'general'],
      formats: ['banner', 'native']
    });
    
    this.adProviders.set('draftkings', {
      partnerId: 'dk-partner-XXXXX',
      fillRate: 0.85,
      avgCPM: 15.00,
      categories: ['gambling', 'fantasy'],
      formats: ['banner', 'native', 'video']
    });
    
    this.adProviders.set('fanduel', {
      partnerId: 'fd-partner-XXXXX',
      fillRate: 0.80,
      avgCPM: 14.50,
      categories: ['gambling', 'fantasy'],
      formats: ['banner', 'native']
    });
    
    this.adProviders.set('espn', {
      partnerId: 'espn-XXXXX',
      fillRate: 0.90,
      avgCPM: 10.00,
      categories: ['sports', 'general'],
      formats: ['banner', 'video']
    });
    
    this.adProviders.set('underdog', {
      partnerId: 'ud-XXXXX',
      fillRate: 0.75,
      avgCPM: 12.00,
      categories: ['fantasy', 'gambling'],
      formats: ['native']
    });
  }
  
  // Main ad request handler
  async requestAd(context = {}) {
    // Check if ads are disabled
    if (this.userPreferences.adDisplay === 'disabled') {
      return { status: 'disabled', message: 'Ads disabled by user' };
    }
    
    // Check session limits
    if (!this.shouldShowAd()) {
      return { status: 'limited', message: 'Ad frequency limit reached' };
    }
    
    // Check Do Not Track
    if (this.userPreferences.doNotTrack && this.config.respectDoNotTrack) {
      return this.requestNonTargetedAd(context);
    }
    
    try {
      // Get targeted ad
      const ad = await this.getTargetedAd(context);
      
      if (ad) {
        this.trackAdRequest(ad, context);
        this.sessionAdCount++;
        this.lastAdTime = Date.now();
        
        return {
          status: 'success',
          ad: ad,
          displayDuration: ad.duration || this.config.maxAdDuration
        };
      }
      
      // Fallback to generic ad
      return this.getFallbackAd(context);
      
    } catch (error) {
      console.error('Ad request error:', error);
      return this.getFallbackAd(context);
    }
  }
  
  shouldShowAd() {
    // Check session limits
    if (this.sessionAdCount >= this.config.maxAdsPerSession) {
      return false;
    }
    
    // Check time between ads
    if (Date.now() - this.lastAdTime < this.config.minTimeBetweenAds) {
      return false;
    }
    
    // Check user preference for minimal ads
    if (this.userPreferences.adDisplay === 'minimal' && this.sessionAdCount >= 2) {
      return false;
    }
    
    return true;
  }
  
  async getTargetedAd(context) {
    // Build targeting profile
    const targeting = this.buildTargetingProfile(context);
    
    // Get cached ad if available
    const cacheKey = this.generateCacheKey(targeting);
    const cachedAd = this.adCache.get(cacheKey);
    
    if (cachedAd && this.isCacheValid(cachedAd)) {
      return cachedAd.ad;
    }
    
    // Request new ads from providers
    const adRequests = [];
    
    for (const [providerName, provider] of this.adProviders) {
      if (this.isProviderSuitable(provider, targeting)) {
        adRequests.push(this.requestFromProvider(providerName, provider, targeting));
      }
    }
    
    // Wait for responses and pick best ad
    const ads = await Promise.allSettled(adRequests);
    const successfulAds = ads
      .filter(result => result.status === 'fulfilled' && result.value)
      .map(result => result.value);
    
    if (successfulAds.length === 0) {
      return null;
    }
    
    // Select best ad based on CPM and relevance
    const bestAd = this.selectBestAd(successfulAds, targeting);
    
    // Cache the ad
    this.adCache.set(cacheKey, {
      ad: bestAd,
      timestamp: Date.now(),
      ttl: 3600000 // 1 hour
    });
    
    return bestAd;
  }
  
  buildTargetingProfile(context) {
    return {
      sports: this.userPreferences.sports,
      teams: this.userPreferences.favoriteTeams,
      players: this.userPreferences.favoritePlayers,
      context: {
        url: context.url || '',
        query: context.query || '',
        sport: this.detectSportFromContext(context),
        queryType: this.detectQueryType(context)
      },
      demographics: {
        // Would be inferred from usage patterns
        ageGroup: '25-44',
        interests: ['fantasy-sports', 'betting', 'sports-news']
      },
      behavioral: {
        sessionLength: context.sessionLength || 0,
        queryFrequency: context.queryFrequency || 1,
        timeOfDay: new Date().getHours()
      }
    };
  }
  
  async requestFromProvider(providerName, provider, targeting) {
    try {
      switch (providerName) {
        case 'draftkings':
          return await this.requestDraftKingsAd(provider, targeting);
        case 'fanduel':
          return await this.requestFanDuelAd(provider, targeting);
        case 'espn':
          return await this.requestESPNAd(provider, targeting);
        case 'google-adsense':
          return await this.requestGoogleAd(provider, targeting);
        case 'underdog':
          return await this.requestUnderdogAd(provider, targeting);
        default:
          return null;
      }
    } catch (error) {
      console.error(`Error requesting ad from ${providerName}:`, error);
      return null;
    }
  }
  
  // Provider-specific ad requests (mock implementations)
  async requestDraftKingsAd(provider, targeting) {
    // Simulate API call
    await this.delay(100 + Math.random() * 200);
    
    const sportsboookAds = [
      {
        id: `dk_${Date.now()}`,
        provider: 'draftkings',
        type: 'native',
        cpm: 15.00,
        content: {
          headline: 'DraftKings Sportsbook',
          description: 'Bet $5, Get $150 in Bonus Bets Instantly!',
          cta: 'Bet Now',
          imageUrl: '/images/draftkings-ad.jpg',
          clickUrl: 'https://draftkings.com/sportsbook',
          disclaimer: 'Must be 21+. Gambling problem? Call 1-800-GAMBLER'
        },
        targeting: {
          relevanceScore: this.calculateRelevance(targeting, ['gambling', 'fantasy']),
          categories: ['gambling', 'fantasy']
        },
        duration: 30000
      },
      {
        id: `dk_fantasy_${Date.now()}`,
        provider: 'draftkings',
        type: 'banner',
        cpm: 12.00,
        content: {
          headline: 'DraftKings Fantasy',
          description: 'Join the $1M Fantasy Football Championship',
          cta: 'Play Now',
          imageUrl: '/images/dk-fantasy-ad.jpg',
          clickUrl: 'https://draftkings.com/fantasy'
        },
        targeting: {
          relevanceScore: this.calculateRelevance(targeting, ['fantasy']),
          categories: ['fantasy']
        },
        duration: 25000
      }
    ];
    
    // Return highest relevance ad
    return sportsboookAds.reduce((best, current) => 
      current.targeting.relevanceScore > best.targeting.relevanceScore ? current : best
    );
  }
  
  async requestFanDuelAd(provider, targeting) {
    await this.delay(80 + Math.random() * 150);
    
    return {
      id: `fd_${Date.now()}`,
      provider: 'fanduel',
      type: 'native',
      cpm: 14.50,
      content: {
        headline: 'FanDuel Sportsbook',
        description: 'No Sweat First Bet up to $1000',
        cta: 'Join Now',
        imageUrl: '/images/fanduel-ad.jpg',
        clickUrl: 'https://fanduel.com/sportsbook',
        disclaimer: '21+ only. First bet offer for new customers only.'
      },
      targeting: {
        relevanceScore: this.calculateRelevance(targeting, ['gambling', 'fantasy']),
        categories: ['gambling', 'fantasy']
      },
      duration: 30000
    };
  }
  
  async requestESPNAd(provider, targeting) {
    await this.delay(120 + Math.random() * 100);
    
    const espnAds = [
      {
        id: `espn_plus_${Date.now()}`,
        provider: 'espn',
        type: 'video',
        cpm: 10.00,
        content: {
          headline: 'ESPN+',
          description: 'Stream exclusive sports content',
          cta: 'Subscribe',
          videoUrl: '/videos/espn-plus-ad.mp4',
          imageUrl: '/images/espn-plus-ad.jpg',
          clickUrl: 'https://espn.com/plus'
        },
        targeting: {
          relevanceScore: this.calculateRelevance(targeting, ['sports']),
          categories: ['sports']
        },
        duration: 15000
      },
      {
        id: `espn_app_${Date.now()}`,
        provider: 'espn',
        type: 'banner',
        cpm: 8.00,
        content: {
          headline: 'ESPN App',
          description: 'Get the latest scores and news',
          cta: 'Download',
          imageUrl: '/images/espn-app-ad.jpg',
          clickUrl: 'https://espn.com/mobile'
        },
        targeting: {
          relevanceScore: this.calculateRelevance(targeting, ['sports']),
          categories: ['sports']
        },
        duration: 20000
      }
    ];
    
    return espnAds[Math.floor(Math.random() * espnAds.length)];
  }
  
  async requestGoogleAd(provider, targeting) {
    await this.delay(150 + Math.random() * 100);
    
    // Generic sports-related ads
    return {
      id: `google_${Date.now()}`,
      provider: 'google-adsense',
      type: 'banner',
      cpm: 8.50,
      content: {
        headline: 'Sports Gear Sale',
        description: 'Up to 50% off Nike, Adidas & more',
        cta: 'Shop Now',
        imageUrl: '/images/sports-gear-ad.jpg',
        clickUrl: 'https://example-sports-retailer.com'
      },
      targeting: {
        relevanceScore: this.calculateRelevance(targeting, ['sports', 'general']),
        categories: ['sports', 'general']
      },
      duration: 25000
    };
  }
  
  async requestUnderdogAd(provider, targeting) {
    await this.delay(90 + Math.random() * 120);
    
    return {
      id: `ud_${Date.now()}`,
      provider: 'underdog',
      type: 'native',
      cpm: 12.00,
      content: {
        headline: 'Underdog Fantasy',
        description: 'Play Pick\'em contests with no salary cap',
        cta: 'Play Free',
        imageUrl: '/images/underdog-ad.jpg',
        clickUrl: 'https://underdogfantasy.com'
      },
      targeting: {
        relevanceScore: this.calculateRelevance(targeting, ['fantasy']),
        categories: ['fantasy']
      },
      duration: 30000
    };
  }
  
  calculateRelevance(targeting, adCategories) {
    let score = 0;
    
    // Category match bonus
    const categoryMatch = targeting.context.queryType && 
      adCategories.includes(targeting.context.queryType);
    if (categoryMatch) score += 40;
    
    // Sport match bonus
    const sportMatch = targeting.context.sport && 
      this.userPreferences.sports.includes(targeting.context.sport);
    if (sportMatch) score += 30;
    
    // Team/player interest bonus
    if (targeting.teams.length > 0 || targeting.players.length > 0) {
      score += 20;
    }
    
    // Time of day bonus (evening = higher sports interest)
    if (targeting.behavioral.timeOfDay >= 18 && targeting.behavioral.timeOfDay <= 23) {
      score += 10;
    }
    
    // Random factor to prevent showing same ad repeatedly
    score += Math.random() * 10;
    
    return Math.min(score, 100);
  }
  
  selectBestAd(ads, targeting) {
    // Score each ad based on CPM and relevance
    return ads.reduce((best, current) => {
      const currentScore = (current.cpm * 0.7) + (current.targeting.relevanceScore * 0.3);
      const bestScore = (best.cpm * 0.7) + (best.targeting.relevanceScore * 0.3);
      
      return currentScore > bestScore ? current : best;
    });
  }
  
  getFallbackAd(context) {
    // Return a generic sports ad when targeting fails
    return {
      status: 'success',
      ad: {
        id: `fallback_${Date.now()}`,
        provider: 'fallback',
        type: 'banner',
        cpm: 5.00,
        content: {
          headline: 'Fantasy.AI Premium',
          description: 'Upgrade for ad-free experience',
          cta: 'Upgrade',
          imageUrl: '/images/premium-ad.jpg',
          clickUrl: 'https://fantasy.ai/premium'
        },
        targeting: { relevanceScore: 50, categories: ['premium'] },
        duration: 20000
      },
      displayDuration: 20000
    };
  }
  
  async requestNonTargetedAd(context) {
    // Respect Do Not Track - show generic, non-personalized ads
    return {
      status: 'success',
      ad: {
        id: `generic_${Date.now()}`,
        provider: 'generic',
        type: 'banner',
        cpm: 3.00, // Lower CPM for non-targeted
        content: {
          headline: 'Sports News & Updates',
          description: 'Stay informed with the latest sports news',
          cta: 'Read More',
          imageUrl: '/images/generic-sports-ad.jpg',
          clickUrl: 'https://fantasy.ai/news'
        },
        targeting: { relevanceScore: 25, categories: ['general'] },
        duration: 15000
      },
      displayDuration: 15000
    };
  }
  
  // Analytics and tracking
  trackAdRequest(ad, context) {
    chrome.runtime.sendMessage({
      type: 'ANALYTICS_EVENT',
      event: 'ad_requested',
      data: {
        adId: ad.id,
        provider: ad.provider,
        cpm: ad.cpm,
        relevanceScore: ad.targeting.relevanceScore,
        context: context
      }
    });
  }
  
  trackAdImpression(adId, viewDuration) {
    this.analytics.impressions++;
    
    chrome.runtime.sendMessage({
      type: 'ANALYTICS_EVENT',
      event: 'ad_impression',
      data: {
        adId: adId,
        viewDuration: viewDuration,
        timestamp: Date.now()
      }
    });
    
    // Calculate revenue
    const ad = this.findAdById(adId);
    if (ad) {
      const revenue = (ad.cpm / 1000); // CPM to per-impression revenue
      this.analytics.revenue += revenue;
    }
  }
  
  trackAdClick(adId, clickUrl) {
    this.analytics.clicks++;
    this.analytics.ctr = (this.analytics.clicks / this.analytics.impressions) * 100;
    
    chrome.runtime.sendMessage({
      type: 'ANALYTICS_EVENT',
      event: 'ad_click',
      data: {
        adId: adId,
        clickUrl: clickUrl,
        timestamp: Date.now()
      }
    });
  }
  
  // Utility methods
  detectSportFromContext(context) {
    const query = (context.query || '').toLowerCase();
    
    if (query.includes('nfl') || query.includes('football')) return 'nfl';
    if (query.includes('nba') || query.includes('basketball')) return 'nba';
    if (query.includes('mlb') || query.includes('baseball')) return 'mlb';
    if (query.includes('nhl') || query.includes('hockey')) return 'nhl';
    
    return 'general';
  }
  
  detectQueryType(context) {
    const query = (context.query || '').toLowerCase();
    
    if (query.includes('fantasy') || query.includes('start') || query.includes('sit')) {
      return 'fantasy';
    }
    if (query.includes('bet') || query.includes('odds')) {
      return 'gambling';
    }
    
    return 'sports';
  }
  
  isProviderSuitable(provider, targeting) {
    // Check if provider serves relevant categories
    const hasRelevantCategory = provider.categories.some(cat => 
      targeting.context.queryType === cat || 
      this.config.targetedCategories.includes(cat)
    );
    
    // Check fill rate
    const hasGoodFillRate = provider.fillRate > 0.7;
    
    return hasRelevantCategory && hasGoodFillRate;
  }
  
  generateCacheKey(targeting) {
    return btoa(JSON.stringify({
      sport: targeting.context.sport,
      queryType: targeting.context.queryType,
      timeSlot: Math.floor(Date.now() / 3600000) // Hour-based cache
    }));
  }
  
  isCacheValid(cachedItem) {
    return Date.now() - cachedItem.timestamp < cachedItem.ttl;
  }
  
  findAdById(adId) {
    // Find ad in cache by ID
    for (const cachedItem of this.adCache.values()) {
      if (cachedItem.ad.id === adId) {
        return cachedItem.ad;
      }
    }
    return null;
  }
  
  updateSeasonalRates() {
    const now = new Date();
    const month = now.getMonth(); // 0-11
    
    // NFL season (September - February)
    if (month >= 8 || month <= 1) {
      this.applySeasonalMultiplier('nfl-season');
    }
    
    // NBA season (October - June)
    if (month >= 9 || month <= 5) {
      this.applySeasonalMultiplier('nba-season');
    }
    
    // Fantasy playoffs (December - January)
    if (month === 11 || month === 0) {
      this.applySeasonalMultiplier('fantasy-playoffs');
    }
  }
  
  applySeasonalMultiplier(season) {
    const multiplier = this.revenueConfig.seasonalMultipliers[season] || 1.0;
    console.log(`Applying ${season} multiplier: ${multiplier}x`);
    
    // Apply to all provider CPMs
    for (const provider of this.adProviders.values()) {
      provider.seasonalCPM = provider.avgCPM * multiplier;
    }
  }
  
  setupAnalytics() {
    // Initialize analytics tracking
    setInterval(() => {
      this.flushAnalytics();
    }, 300000); // Flush every 5 minutes
  }
  
  flushAnalytics() {
    if (this.analytics.impressions > 0) {
      chrome.runtime.sendMessage({
        type: 'ANALYTICS_EVENT',
        event: 'ad_analytics_summary',
        data: {
          ...this.analytics,
          timestamp: Date.now()
        }
      });
      
      // Reset counters
      this.analytics.impressions = 0;
      this.analytics.clicks = 0;
      this.analytics.revenue = 0;
    }
  }
  
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export for use in background script
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AdManager;
}