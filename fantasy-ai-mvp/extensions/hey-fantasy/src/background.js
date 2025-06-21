// 🚀 Hey Fantasy Background Service Worker
// Handles voice recognition, API calls, and cross-platform league integration

import { VoiceRecognition } from './lib/voice-recognition.js';
import { FantasyAIAPI } from './lib/fantasy-ai-api.js';
import { MultimediaAnalyzer } from './lib/multimedia-analyzer.js';
import { LeagueIntegrator } from './lib/league-integrator.js';
import { NotificationManager } from './lib/notification-manager.js';

// Initialize core services
const voiceRecognition = new VoiceRecognition();
const fantasyAPI = new FantasyAIAPI();
const multimediaAnalyzer = new MultimediaAnalyzer();
const leagueIntegrator = new LeagueIntegrator();
const notificationManager = new NotificationManager();

// Voice activation state
let isListening = false;
let activeTabId = null;

// Listen for extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('🎙️ Hey Fantasy installed successfully!');
  chrome.storage.local.set({
    settings: {
      voiceActivation: true,
      wakeWord: 'hey fantasy',
      autoAnalyze: true,
      notificationsEnabled: true,
      platformIntegrations: {
        yahoo: true,
        espn: true,
        cbs: true,
        sleeper: true,
        nfl: true,
        draftkings: true,
        fanduel: true
      }
    }
  });
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.type) {
    case 'VOICE_COMMAND':
      handleVoiceCommand(request.command, sender.tab);
      break;
    case 'ANALYZE_PAGE':
      analyzePage(sender.tab);
      break;
    case 'GET_PLAYER_INSIGHTS':
      getPlayerInsights(request.playerName, sendResponse);
      return true; // Keep channel open for async response
    case 'SYNC_LEAGUES':
      syncAllLeagues(sendResponse);
      return true;
    case 'MULTIMEDIA_SEARCH':
      searchMultimedia(request.query, sendResponse);
      return true;
  }
});

// Handle keyboard shortcut activation
chrome.commands.onCommand.addListener((command) => {
  if (command === 'activate-voice') {
    toggleVoiceRecognition();
  }
});

// Voice command handler
async function handleVoiceCommand(command, tab) {
  console.log('🎤 Processing command:', command);
  
  const normalizedCommand = command.toLowerCase().trim();
  
  // Command routing
  if (normalizedCommand.includes('lineup') || normalizedCommand.includes('who should i start')) {
    await handleLineupOptimization(tab);
  } else if (normalizedCommand.includes('trade')) {
    await handleTradeAnalysis(tab);
  } else if (normalizedCommand.includes('waiver') || normalizedCommand.includes('pickup')) {
    await handleWaiverRecommendations(tab);
  } else if (normalizedCommand.includes('injury') || normalizedCommand.includes('injured')) {
    await handleInjuryReport(tab);
  } else if (normalizedCommand.includes('podcast') || normalizedCommand.includes('youtube')) {
    await handleMultimediaInsights(normalizedCommand, tab);
  } else if (normalizedCommand.includes('weather')) {
    await handleWeatherImpact(tab);
  } else if (normalizedCommand.includes('sync') || normalizedCommand.includes('leagues')) {
    await syncAllLeagues();
  } else {
    // AI-powered general query
    await handleGeneralQuery(command, tab);
  }
}

// Lineup optimization with multimedia insights
async function handleLineupOptimization(tab) {
  try {
    // Get current page context
    const pageData = await leagueIntegrator.extractPageData(tab);
    const platform = detectPlatform(tab.url);
    
    // Fetch player data from our database
    const roster = await fantasyAPI.getRoster(pageData.leagueId);
    
    // Get multimedia insights for each player
    const playerInsights = await Promise.all(
      roster.map(player => multimediaAnalyzer.getPlayerInsights(player.name))
    );
    
    // Get weather data
    const weatherData = await fantasyAPI.getWeatherImpact(roster);
    
    // Get biometric data if available
    const biometricData = await fantasyAPI.getBiometricData(roster);
    
    // AI optimization
    const optimizedLineup = await fantasyAPI.optimizeLineup({
      roster,
      playerInsights,
      weatherData,
      biometricData,
      scoringSettings: pageData.scoringSettings
    });
    
    // Inject recommendations into the page
    chrome.tabs.sendMessage(tab.id, {
      type: 'SHOW_LINEUP_RECOMMENDATIONS',
      data: optimizedLineup
    });
    
    // Voice feedback
    const topRecommendation = optimizedLineup.changes[0];
    speakResponse(`I recommend starting ${topRecommendation.playerIn} over ${topRecommendation.playerOut}. ${topRecommendation.reasoning}`);
    
  } catch (error) {
    console.error('Lineup optimization error:', error);
    speakResponse('I encountered an error analyzing your lineup. Please try again.');
  }
}

// Trade analysis with social sentiment
async function handleTradeAnalysis(tab) {
  try {
    const pageData = await leagueIntegrator.extractPageData(tab);
    
    // Extract trade details from page
    const tradeDetails = await chrome.tabs.sendMessage(tab.id, {
      type: 'EXTRACT_TRADE_DETAILS'
    });
    
    // Get multimedia sentiment for all players
    const sentiment = await multimediaAnalyzer.getTradeSentiment(
      tradeDetails.playersOffered,
      tradeDetails.playersRequested
    );
    
    // Historical performance analysis
    const performanceTrends = await fantasyAPI.getPerformanceTrends([
      ...tradeDetails.playersOffered,
      ...tradeDetails.playersRequested
    ]);
    
    // AI trade evaluation
    const tradeAnalysis = await fantasyAPI.analyzeTrade({
      tradeDetails,
      sentiment,
      performanceTrends,
      leagueSettings: pageData.scoringSettings
    });
    
    // Display analysis
    chrome.tabs.sendMessage(tab.id, {
      type: 'SHOW_TRADE_ANALYSIS',
      data: tradeAnalysis
    });
    
    speakResponse(tradeAnalysis.summary);
    
  } catch (error) {
    console.error('Trade analysis error:', error);
    speakResponse('I need more information to analyze this trade.');
  }
}

// Multimedia insights integration
async function handleMultimediaInsights(command, tab) {
  try {
    let searchQuery = command;
    
    // Extract player name from command
    const playerMatch = command.match(/about\s+(.+?)(?:\s+this\s+week)?$/i);
    if (playerMatch) {
      searchQuery = playerMatch[1];
    }
    
    // Search across all multimedia sources
    const insights = await multimediaAnalyzer.searchAll(searchQuery);
    
    // Aggregate and analyze
    const analysis = await fantasyAPI.analyzeMultimediaInsights(insights);
    
    // Create rich notification
    await notificationManager.showMultimediaInsights(analysis);
    
    // Inject into page if on fantasy platform
    if (isFantasyPlatform(tab.url)) {
      chrome.tabs.sendMessage(tab.id, {
        type: 'SHOW_MULTIMEDIA_INSIGHTS',
        data: analysis
      });
    }
    
    speakResponse(analysis.summary);
    
  } catch (error) {
    console.error('Multimedia insights error:', error);
    speakResponse('I could not find multimedia insights for that query.');
  }
}

// Platform detection
function detectPlatform(url) {
  if (url.includes('yahoo.com')) return 'yahoo';
  if (url.includes('espn.com')) return 'espn';
  if (url.includes('cbssports.com')) return 'cbs';
  if (url.includes('sleeper.app')) return 'sleeper';
  if (url.includes('nfl.com')) return 'nfl';
  if (url.includes('draftkings.com')) return 'draftkings';
  if (url.includes('fanduel.com')) return 'fanduel';
  return 'unknown';
}

function isFantasyPlatform(url) {
  return detectPlatform(url) !== 'unknown';
}

// Text-to-speech response
function speakResponse(text) {
  chrome.tts.speak(text, {
    rate: 1.0,
    pitch: 1.0,
    volume: 1.0,
    voiceName: 'Google US English'
  });
}

// Toggle voice recognition
async function toggleVoiceRecognition() {
  isListening = !isListening;
  
  if (isListening) {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    activeTabId = tab.id;
    
    chrome.tabs.sendMessage(activeTabId, {
      type: 'START_LISTENING'
    });
    
    chrome.action.setBadgeText({ text: 'ON' });
    chrome.action.setBadgeBackgroundColor({ color: '#00ff00' });
  } else {
    if (activeTabId) {
      chrome.tabs.sendMessage(activeTabId, {
        type: 'STOP_LISTENING'
      });
    }
    
    chrome.action.setBadgeText({ text: '' });
  }
}

// League synchronization across all platforms
async function syncAllLeagues(sendResponse) {
  try {
    const settings = await chrome.storage.local.get('settings');
    const platforms = Object.entries(settings.settings.platformIntegrations)
      .filter(([_, enabled]) => enabled)
      .map(([platform]) => platform);
    
    const allLeagues = await leagueIntegrator.syncAllPlatforms(platforms);
    
    // Store in database
    await fantasyAPI.updateUserLeagues(allLeagues);
    
    if (sendResponse) {
      sendResponse({ success: true, leagues: allLeagues });
    }
    
    notificationManager.showNotification(
      'League Sync Complete',
      `Successfully synced ${allLeagues.length} leagues across ${platforms.length} platforms!`
    );
    
  } catch (error) {
    console.error('League sync error:', error);
    if (sendResponse) {
      sendResponse({ success: false, error: error.message });
    }
  }
}

// Initialize extension
console.log('🚀 Hey Fantasy background service initialized!');

// Listen for tab updates to detect fantasy platforms
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && isFantasyPlatform(tab.url)) {
    // Inject helper scripts
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['src/platform-helpers.js']
    });
    
    // Auto-analyze if enabled
    chrome.storage.local.get('settings', (data) => {
      if (data.settings.autoAnalyze) {
        analyzePage(tab);
      }
    });
  }
});

// Analyze current fantasy page
async function analyzePage(tab) {
  const platform = detectPlatform(tab.url);
  const analysis = await leagueIntegrator.analyzePage(tab, platform);
  
  if (analysis.suggestions.length > 0) {
    notificationManager.showNotification(
      'Fantasy AI Analysis',
      analysis.suggestions[0]
    );
  }
}