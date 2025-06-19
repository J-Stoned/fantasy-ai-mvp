/**
 * HEY FANTASY - Service Worker
 * Handles background operations, API calls, and voice processing coordination
 */

// Configuration
const CONFIG = {
  API_BASE: 'https://api.fantasy.ai',
  VOICE_ACTIVATION_PHRASE: 'hey fantasy',
  AD_REFRESH_INTERVAL: 300000, // 5 minutes
  ANALYTICS_BATCH_SIZE: 100,
  ANALYTICS_FLUSH_INTERVAL: 60000 // 1 minute
};

// Analytics queue for voice data collection
let analyticsQueue = [];
let voiceSessionActive = false;

// Initialize extension
chrome.runtime.onInstalled.addListener(() => {
  console.log('Hey Fantasy extension installed!');
  
  // Set default settings
  chrome.storage.sync.set({
    voiceEnabled: true,
    adPreferences: 'non-intrusive',
    favoriteTeams: [],
    favoritePlayerss: [],
    voiceActivationMethod: 'voice', // or 'hotkey' or 'both'
    analyticsEnabled: true
  });
  
  // Create context menu
  chrome.contextMenus.create({
    id: 'hey-fantasy-search',
    title: 'Search with Hey Fantasy',
    contexts: ['selection']
  });
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.type) {
    case 'VOICE_ACTIVATION':
      handleVoiceActivation(request, sender, sendResponse);
      return true;
      
    case 'SPORTS_QUERY':
      handleSportsQuery(request, sender, sendResponse);
      return true;
      
    case 'ANALYTICS_EVENT':
      handleAnalyticsEvent(request);
      break;
      
    case 'AD_REQUEST':
      handleAdRequest(sender, sendResponse);
      return true;
      
    case 'GET_USER_PREFERENCES':
      getUserPreferences(sendResponse);
      return true;
  }
});

// Handle voice activation
async function handleVoiceActivation(request, sender, sendResponse) {
  try {
    voiceSessionActive = true;
    
    // Track activation event
    trackEvent({
      event: 'voice_activated',
      method: request.method,
      timestamp: Date.now(),
      url: sender.tab.url
    });
    
    // Send activation confirmation
    sendResponse({ 
      status: 'activated',
      sessionId: generateSessionId(),
      features: await getEnabledFeatures()
    });
    
  } catch (error) {
    console.error('Voice activation error:', error);
    sendResponse({ status: 'error', message: error.message });
  }
}

// Handle sports queries
async function handleSportsQuery(request, sender, sendResponse) {
  try {
    const { query, context, sessionId } = request;
    
    // Track query for analytics
    trackEvent({
      event: 'sports_query',
      query: query,
      context: context,
      sessionId: sessionId,
      timestamp: Date.now()
    });
    
    // Process the query
    const response = await processSportsQuery(query, context);
    
    // Track response metrics
    trackEvent({
      event: 'query_response',
      sessionId: sessionId,
      responseTime: response.processingTime,
      success: response.success,
      dataSource: response.source
    });
    
    sendResponse(response);
    
  } catch (error) {
    console.error('Sports query error:', error);
    sendResponse({ 
      status: 'error', 
      message: 'Unable to process query',
      fallbackSuggestion: 'Try rephrasing your question'
    });
  }
}

// Process sports queries with NLP
async function processSportsQuery(query, context) {
  const startTime = Date.now();
  
  // Parse query intent
  const intent = parseQueryIntent(query);
  
  let response;
  switch (intent.type) {
    case 'PLAYER_STATS':
      response = await fetchPlayerStats(intent.entities);
      break;
      
    case 'GAME_SCORES':
      response = await fetchGameScores(intent.entities);
      break;
      
    case 'INJURY_REPORT':
      response = await fetchInjuryReport(intent.entities);
      break;
      
    case 'TEAM_INFO':
      response = await fetchTeamInfo(intent.entities);
      break;
      
    case 'FANTASY_ADVICE':
      response = await getFantasyAdvice(intent.entities);
      break;
      
    default:
      response = await performGeneralSearch(query);
  }
  
  return {
    ...response,
    processingTime: Date.now() - startTime,
    intent: intent.type,
    confidence: intent.confidence
  };
}

// Parse query intent using simple NLP
function parseQueryIntent(query) {
  const lowerQuery = query.toLowerCase();
  
  // Player stats patterns
  if (lowerQuery.match(/stats|statistics|numbers|performance/)) {
    return { 
      type: 'PLAYER_STATS', 
      confidence: 0.9,
      entities: extractPlayerNames(query)
    };
  }
  
  // Game scores patterns
  if (lowerQuery.match(/score|game|result|won|lost/)) {
    return { 
      type: 'GAME_SCORES', 
      confidence: 0.85,
      entities: extractTeamNames(query)
    };
  }
  
  // Injury patterns
  if (lowerQuery.match(/injury|injured|hurt|status|health/)) {
    return { 
      type: 'INJURY_REPORT', 
      confidence: 0.9,
      entities: extractPlayerNames(query)
    };
  }
  
  // Fantasy advice patterns
  if (lowerQuery.match(/start|sit|lineup|trade|waiver|pickup/)) {
    return { 
      type: 'FANTASY_ADVICE', 
      confidence: 0.85,
      entities: extractFantasyContext(query)
    };
  }
  
  // Default to general search
  return { 
    type: 'GENERAL_SEARCH', 
    confidence: 0.5,
    entities: {}
  };
}

// Analytics tracking
function trackEvent(eventData) {
  if (!eventData) return;
  
  // Add to queue
  analyticsQueue.push({
    ...eventData,
    extensionVersion: chrome.runtime.getManifest().version,
    platform: navigator.platform,
    voiceSessionActive: voiceSessionActive
  });
  
  // Flush if queue is full
  if (analyticsQueue.length >= CONFIG.ANALYTICS_BATCH_SIZE) {
    flushAnalytics();
  }
}

// Flush analytics to server
async function flushAnalytics() {
  if (analyticsQueue.length === 0) return;
  
  const events = [...analyticsQueue];
  analyticsQueue = [];
  
  try {
    await fetch(`${CONFIG.API_BASE}/analytics/voice-events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events })
    });
  } catch (error) {
    console.error('Analytics flush error:', error);
    // Re-queue events on failure
    analyticsQueue.unshift(...events);
  }
}

// Ad handling for monetization
async function handleAdRequest(sender, sendResponse) {
  try {
    // Get user's ad preferences
    const prefs = await chrome.storage.sync.get(['adPreferences']);
    
    // Fetch appropriate ad
    const ad = await fetchTargetedAd({
      context: sender.tab.url,
      preferences: prefs.adPreferences,
      timestamp: Date.now()
    });
    
    sendResponse({ 
      status: 'success',
      ad: ad,
      displayDuration: 30000 // 30 seconds
    });
    
  } catch (error) {
    console.error('Ad request error:', error);
    sendResponse({ status: 'error' });
  }
}

// Fetch targeted sports ad
async function fetchTargetedAd(params) {
  // This would connect to ad network
  // For now, return mock ad
  return {
    id: generateAdId(),
    type: 'banner',
    content: {
      headline: 'DraftKings - Best Ball Championship',
      description: 'Join now and get $100 bonus',
      cta: 'Play Now',
      imageUrl: '/public/images/sample-ad.jpg',
      clickUrl: 'https://draftkings.com'
    },
    targeting: {
      sport: 'nfl',
      interest: 'fantasy'
    }
  };
}

// Periodic tasks
setInterval(() => {
  flushAnalytics();
}, CONFIG.ANALYTICS_FLUSH_INTERVAL);

// Listen for tab updates to inject voice UI
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // Check if voice should be enabled on this site
    chrome.storage.sync.get(['voiceEnabled'], (result) => {
      if (result.voiceEnabled) {
        chrome.tabs.sendMessage(tabId, { 
          type: 'INIT_VOICE_UI',
          tabInfo: {
            url: tab.url,
            title: tab.title
          }
        });
      }
    });
  }
});

// Utility functions
function generateSessionId() {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateAdId() {
  return `ad_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function extractPlayerNames(query) {
  // This would use more sophisticated NER
  // For now, simple pattern matching
  const players = [];
  const words = query.split(' ');
  
  // Look for capitalized names
  for (let i = 0; i < words.length - 1; i++) {
    if (words[i][0] === words[i][0].toUpperCase() && 
        words[i+1][0] === words[i+1][0].toUpperCase()) {
      players.push(`${words[i]} ${words[i+1]}`);
    }
  }
  
  return players;
}

function extractTeamNames(query) {
  // Team extraction logic
  const teams = [];
  const teamPatterns = [
    'cowboys', 'eagles', 'giants', 'chiefs', 'bills',
    'lakers', 'celtics', 'warriors', 'heat', 'nets'
    // Add all teams
  ];
  
  const lowerQuery = query.toLowerCase();
  teamPatterns.forEach(team => {
    if (lowerQuery.includes(team)) {
      teams.push(team);
    }
  });
  
  return teams;
}

// Command handling
chrome.commands.onCommand.addListener((command) => {
  if (command === 'activate-voice') {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { type: 'TRIGGER_VOICE_ACTIVATION' });
    });
  }
});

console.log('Hey Fantasy service worker initialized!');