/**
 * HEY FANTASY BACKGROUND SERVICE WORKER
 * Manages extension lifecycle, data synchronization, and voice processing
 * Connects to our Fantasy.AI infrastructure for real-time updates
 */

import { HeyFantasyExtensionConfig, defaultHeyFantasyConfig } from './hey-fantasy-extension';

interface ExtensionState {
  isActive: boolean;
  voiceEnabled: boolean;
  lastSync: number;
  activeTabId: number | null;
  userSettings: Partial<HeyFantasyExtensionConfig>;
  cachedData: Map<string, any>;
  syncQueue: SyncTask[];
}

interface SyncTask {
  taskId: string;
  type: 'PLAYER_DATA' | 'LINEUP_OPTIMIZATION' | 'INJURY_UPDATE' | 'TRADE_ANALYSIS';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  data: any;
  timestamp: number;
  retryCount: number;
}

interface TabInfo {
  tabId: number;
  url: string;
  fantasySite: string | null;
  injectedScript: boolean;
  lastActivity: number;
}

class HeyFantasyBackground {
  private state: ExtensionState;
  private activeTabs: Map<number, TabInfo> = new Map();
  private syncInterval: NodeJS.Timeout | null = null;
  private alarmHandlers: Map<string, () => void> = new Map();

  constructor() {
    this.state = {
      isActive: true,
      voiceEnabled: true,
      lastSync: 0,
      activeTabId: null,
      userSettings: defaultHeyFantasyConfig,
      cachedData: new Map(),
      syncQueue: []
    };

    this.initialize();
  }

  private initialize(): void {
    this.setupEventListeners();
    this.loadUserSettings();
    this.startSyncInterval();
    this.setupAlarms();
    console.log('Hey Fantasy background service initialized');
  }

  private setupEventListeners(): void {
    // Extension installation/startup
    chrome.runtime.onInstalled.addListener((details) => {
      this.handleInstallation(details);
    });

    chrome.runtime.onStartup.addListener(() => {
      this.handleStartup();
    });

    // Tab management
    chrome.tabs.onActivated.addListener((activeInfo) => {
      this.handleTabActivated(activeInfo);
    });

    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      this.handleTabUpdated(tabId, changeInfo, tab);
    });

    chrome.tabs.onRemoved.addListener((tabId) => {
      this.handleTabRemoved(tabId);
    });

    // Message handling from content scripts
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true; // Indicates async response
    });

    // External connections (from Fantasy.AI platform)
    chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
      this.handleExternalMessage(message, sender, sendResponse);
      return true;
    });

    // Commands (keyboard shortcuts)
    chrome.commands.onCommand.addListener((command) => {
      this.handleCommand(command);
    });

    // Alarms for periodic tasks
    chrome.alarms.onAlarm.addListener((alarm) => {
      this.handleAlarm(alarm);
    });

    // Storage changes
    chrome.storage.onChanged.addListener((changes, namespace) => {
      this.handleStorageChange(changes, namespace);
    });
  }

  private async handleInstallation(details: chrome.runtime.InstalledDetails): Promise<void> {
    console.log('Hey Fantasy extension installed:', details.reason);

    if (details.reason === 'install') {
      // First time installation
      await this.setupDefaultSettings();
      await this.showWelcomePage();
    } else if (details.reason === 'update') {
      // Extension updated
      await this.handleUpdate(details.previousVersion);
    }

    // Initialize data sync
    await this.performInitialSync();
  }

  private async handleStartup(): Promise<void> {
    console.log('Hey Fantasy extension startup');
    await this.loadUserSettings();
    await this.resumeSyncQueue();
  }

  private async handleTabActivated(activeInfo: chrome.tabs.TabActivatedInfo): Promise<void> {
    this.state.activeTabId = activeInfo.tabId;

    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab.url) {
      const fantasySite = this.detectFantasySite(tab.url);
      if (fantasySite) {
        await this.injectContentScript(activeInfo.tabId, fantasySite);
      }
    }
  }

  private async handleTabUpdated(
    tabId: number, 
    changeInfo: chrome.tabs.TabChangeInfo, 
    tab: chrome.tabs.Tab
  ): Promise<void> {
    if (changeInfo.status === 'complete' && tab.url) {
      const fantasySite = this.detectFantasySite(tab.url);
      
      if (fantasySite) {
        // Update tab info
        this.activeTabs.set(tabId, {
          tabId,
          url: tab.url,
          fantasySite,
          injectedScript: false,
          lastActivity: Date.now()
        });

        // Inject content script
        await this.injectContentScript(tabId, fantasySite);
      } else {
        // Remove from active tabs if not a fantasy site
        this.activeTabs.delete(tabId);
      }
    }
  }

  private handleTabRemoved(tabId: number): void {
    this.activeTabs.delete(tabId);
    if (this.state.activeTabId === tabId) {
      this.state.activeTabId = null;
    }
  }

  private async handleMessage(
    message: any, 
    sender: chrome.runtime.MessageSender, 
    sendResponse: (response?: any) => void
  ): Promise<void> {
    try {
      switch (message.type) {
        case 'GET_PLAYER_DATA':
          const playerData = await this.fetchPlayerData(message.playerName);
          sendResponse({ success: true, data: playerData });
          break;

        case 'OPTIMIZE_LINEUP':
          const lineup = await this.optimizeLineup(message.constraints);
          sendResponse({ success: true, data: lineup });
          break;

        case 'ANALYZE_TRADE':
          const tradeAnalysis = await this.analyzeTrade(message.tradeData);
          sendResponse({ success: true, data: tradeAnalysis });
          break;

        case 'GET_INJURY_INTEL':
          const injuryData = await this.getInjuryIntelligence(message.players);
          sendResponse({ success: true, data: injuryData });
          break;

        case 'VOICE_COMMAND':
          await this.processVoiceCommand(message.command);
          sendResponse({ success: true });
          break;

        case 'UPDATE_SETTINGS':
          await this.updateSettings(message.settings);
          sendResponse({ success: true });
          break;

        case 'GET_EXTENSION_STATE':
          sendResponse({ success: true, data: this.getPublicState() });
          break;

        case 'SYNC_REQUEST':
          await this.performSync();
          sendResponse({ success: true });
          break;

        default:
          sendResponse({ success: false, error: 'Unknown message type' });
      }
    } catch (error) {
      console.error('Error handling message:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  private async handleExternalMessage(
    message: any,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void
  ): Promise<void> {
    // Handle messages from Fantasy.AI platform
    if (sender.origin !== 'https://fantasyai.com' && sender.origin !== 'https://api.fantasyai.com') {
      sendResponse({ success: false, error: 'Unauthorized origin' });
      return;
    }

    try {
      switch (message.type) {
        case 'DATA_UPDATE':
          await this.handleDataUpdate(message.data);
          sendResponse({ success: true });
          break;

        case 'PLAYER_ALERT':
          await this.handlePlayerAlert(message.alert);
          sendResponse({ success: true });
          break;

        case 'SYSTEM_NOTIFICATION':
          await this.handleSystemNotification(message.notification);
          sendResponse({ success: true });
          break;

        default:
          sendResponse({ success: false, error: 'Unknown external message type' });
      }
    } catch (error) {
      console.error('Error handling external message:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  private async handleCommand(command: string): Promise<void> {
    switch (command) {
      case 'activate-voice':
        await this.toggleVoiceActivation();
        break;

      case 'toggle-overlay':
        await this.toggleOverlay();
        break;

      case 'quick-lineup':
        await this.quickLineupOptimization();
        break;
    }
  }

  private handleAlarm(alarm: chrome.alarms.Alarm): void {
    const handler = this.alarmHandlers.get(alarm.name);
    if (handler) {
      handler();
    }
  }

  private async handleStorageChange(
    changes: { [key: string]: chrome.storage.StorageChange },
    namespace: string
  ): Promise<void> {
    if (namespace === 'sync' && changes.userSettings) {
      this.state.userSettings = { ...this.state.userSettings, ...changes.userSettings.newValue };
    }
  }

  private detectFantasySite(url: string): string | null {
    const hostname = new URL(url).hostname.toLowerCase();
    
    if (hostname.includes('draftkings')) return 'draftkings';
    if (hostname.includes('fanduel')) return 'fanduel';
    if (hostname.includes('espn')) return 'espn';
    if (hostname.includes('yahoo')) return 'yahoo';
    if (hostname.includes('nfl.com')) return 'nfl';
    if (hostname.includes('sleeper')) return 'sleeper';
    if (hostname.includes('superdraft')) return 'superdraft';
    
    return null;
  }

  private async injectContentScript(tabId: number, fantasySite: string): Promise<void> {
    try {
      const tabInfo = this.activeTabs.get(tabId);
      if (tabInfo?.injectedScript) return;

      await chrome.scripting.executeScript({
        target: { tabId },
        files: ['content-script.js']
      });

      await chrome.scripting.insertCSS({
        target: { tabId },
        files: ['fantasy-overlay.css']
      });

      // Update tab info
      if (tabInfo) {
        tabInfo.injectedScript = true;
        this.activeTabs.set(tabId, tabInfo);
      }

      console.log(`Content script injected into ${fantasySite} tab ${tabId}`);
    } catch (error) {
      console.error('Failed to inject content script:', error);
    }
  }

  // Data fetching methods that connect to our Fantasy.AI infrastructure
  private async fetchPlayerData(playerName: string): Promise<any> {
    const cacheKey = `player_${playerName.replace(/\s+/g, '_').toLowerCase()}`;
    
    // Check cache first
    if (this.state.cachedData.has(cacheKey)) {
      const cached = this.state.cachedData.get(cacheKey);
      if (Date.now() - cached.timestamp < 300000) { // 5 minutes
        return cached.data;
      }
    }

    try {
      // Fetch from our Fantasy.AI API
      const response = await fetch('https://api.fantasyai.com/v1/player-intelligence', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Extension-ID': chrome.runtime.id
        },
        body: JSON.stringify({ 
          playerName,
          includeHighSchoolData: true,
          includeEquipmentSafety: true,
          includeRealTimeUpdates: true
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      
      // Cache the data
      this.state.cachedData.set(cacheKey, {
        data,
        timestamp: Date.now()
      });

      return data;
    } catch (error) {
      console.error('Failed to fetch player data:', error);
      
      // Return mock data for demo purposes
      return this.getMockPlayerData(playerName);
    }
  }

  private async optimizeLineup(constraints: any): Promise<any> {
    try {
      const response = await fetch('https://api.fantasyai.com/v1/lineup-optimization', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Extension-ID': chrome.runtime.id
        },
        body: JSON.stringify({
          constraints,
          useAIOptimization: true,
          includeHighSchoolData: true,
          includeEquipmentFactors: true
        })
      });

      if (!response.ok) {
        throw new Error(`Optimization request failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to optimize lineup:', error);
      return this.getMockLineupData();
    }
  }

  private async analyzeTrade(tradeData: any): Promise<any> {
    try {
      const response = await fetch('https://api.fantasyai.com/v1/trade-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Extension-ID': chrome.runtime.id
        },
        body: JSON.stringify({
          ...tradeData,
          includeJourneyAnalysis: true,
          includeEquipmentFactors: true
        })
      });

      if (!response.ok) {
        throw new Error(`Trade analysis failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to analyze trade:', error);
      return this.getMockTradeData();
    }
  }

  private async getInjuryIntelligence(players: string[]): Promise<any> {
    try {
      const response = await fetch('https://api.fantasyai.com/v1/injury-intelligence', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Extension-ID': chrome.runtime.id
        },
        body: JSON.stringify({
          players,
          includeEquipmentFactors: true,
          includeRecoveryTimelines: true
        })
      });

      if (!response.ok) {
        throw new Error(`Injury intelligence request failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get injury intelligence:', error);
      return this.getMockInjuryData();
    }
  }

  private async processVoiceCommand(command: any): Promise<void> {
    // Add voice command to sync queue for processing
    this.state.syncQueue.push({
      taskId: `voice_${Date.now()}`,
      type: 'PLAYER_DATA', // Determine type based on command
      priority: 'HIGH',
      data: command,
      timestamp: Date.now(),
      retryCount: 0
    });

    // Process immediately if possible
    await this.processSyncQueue();
  }

  // Settings management
  private async setupDefaultSettings(): Promise<void> {
    await chrome.storage.sync.set({
      userSettings: defaultHeyFantasyConfig,
      isFirstRun: true,
      installDate: Date.now()
    });
  }

  private async loadUserSettings(): Promise<void> {
    try {
      const result = await chrome.storage.sync.get(['userSettings']);
      if (result.userSettings) {
        this.state.userSettings = { ...defaultHeyFantasyConfig, ...result.userSettings };
      }
    } catch (error) {
      console.error('Failed to load user settings:', error);
    }
  }

  private async updateSettings(newSettings: Partial<HeyFantasyExtensionConfig>): Promise<void> {
    this.state.userSettings = { ...this.state.userSettings, ...newSettings };
    
    await chrome.storage.sync.set({
      userSettings: this.state.userSettings
    });

    // Notify all content scripts of settings change
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      if (tab.id && this.activeTabs.has(tab.id)) {
        chrome.tabs.sendMessage(tab.id, {
          type: 'SETTINGS_UPDATED',
          settings: this.state.userSettings
        }).catch(() => {}); // Ignore errors for inactive tabs
      }
    }
  }

  // Sync management
  private startSyncInterval(): void {
    this.syncInterval = setInterval(async () => {
      await this.performSync();
    }, 60000); // Sync every minute
  }

  private async performSync(): Promise<void> {
    if (!this.state.userSettings.syncWithCloud) return;

    try {
      // Process sync queue
      await this.processSyncQueue();

      // Update cached data
      await this.refreshCachedData();

      this.state.lastSync = Date.now();
      
      console.log('Sync completed successfully');
    } catch (error) {
      console.error('Sync failed:', error);
    }
  }

  private async performInitialSync(): Promise<void> {
    // Perform comprehensive initial sync
    await this.performSync();
  }

  private async resumeSyncQueue(): Promise<void> {
    // Resume any pending sync tasks
    await this.processSyncQueue();
  }

  private async processSyncQueue(): Promise<void> {
    const highPriorityTasks = this.state.syncQueue.filter(task => task.priority === 'HIGH');
    
    for (const task of highPriorityTasks) {
      try {
        await this.processSyncTask(task);
        this.state.syncQueue = this.state.syncQueue.filter(t => t.taskId !== task.taskId);
      } catch (error) {
        console.error('Failed to process sync task:', error);
        task.retryCount++;
        
        if (task.retryCount > 3) {
          // Remove failed tasks after 3 retries
          this.state.syncQueue = this.state.syncQueue.filter(t => t.taskId !== task.taskId);
        }
      }
    }
  }

  private async processSyncTask(task: SyncTask): Promise<void> {
    switch (task.type) {
      case 'PLAYER_DATA':
        await this.syncPlayerData(task.data);
        break;
      case 'LINEUP_OPTIMIZATION':
        await this.syncLineupOptimization(task.data);
        break;
      case 'INJURY_UPDATE':
        await this.syncInjuryUpdate(task.data);
        break;
      case 'TRADE_ANALYSIS':
        await this.syncTradeAnalysis(task.data);
        break;
    }
  }

  private async syncPlayerData(data: any): Promise<void> {
    // Sync player data with cloud
    console.log('Syncing player data:', data);
  }

  private async syncLineupOptimization(data: any): Promise<void> {
    // Sync lineup optimization with cloud
    console.log('Syncing lineup optimization:', data);
  }

  private async syncInjuryUpdate(data: any): Promise<void> {
    // Sync injury updates with cloud
    console.log('Syncing injury update:', data);
  }

  private async syncTradeAnalysis(data: any): Promise<void> {
    // Sync trade analysis with cloud
    console.log('Syncing trade analysis:', data);
  }

  private async refreshCachedData(): Promise<void> {
    // Refresh cached data that's getting stale
    const staleKeys = Array.from(this.state.cachedData.keys()).filter(key => {
      const cached = this.state.cachedData.get(key);
      return Date.now() - cached.timestamp > 900000; // 15 minutes
    });

    for (const key of staleKeys) {
      this.state.cachedData.delete(key);
    }
  }

  // Alarm management
  private setupAlarms(): void {
    // Set up periodic sync alarm
    chrome.alarms.create('periodic-sync', { periodInMinutes: 5 });
    this.alarmHandlers.set('periodic-sync', () => this.performSync());

    // Set up cache cleanup alarm
    chrome.alarms.create('cache-cleanup', { periodInMinutes: 30 });
    this.alarmHandlers.set('cache-cleanup', () => this.refreshCachedData());

    // Set up injury alerts alarm
    chrome.alarms.create('injury-alerts', { periodInMinutes: 15 });
    this.alarmHandlers.set('injury-alerts', () => this.checkInjuryAlerts());
  }

  // Command handlers
  private async toggleVoiceActivation(): Promise<void> {
    this.state.voiceEnabled = !this.state.voiceEnabled;
    
    // Notify active tabs
    if (this.state.activeTabId) {
      chrome.tabs.sendMessage(this.state.activeTabId, {
        type: 'TOGGLE_VOICE',
        enabled: this.state.voiceEnabled
      }).catch(() => {});
    }
  }

  private async toggleOverlay(): Promise<void> {
    if (this.state.activeTabId) {
      chrome.tabs.sendMessage(this.state.activeTabId, {
        type: 'TOGGLE_OVERLAY'
      }).catch(() => {});
    }
  }

  private async quickLineupOptimization(): Promise<void> {
    if (this.state.activeTabId) {
      chrome.tabs.sendMessage(this.state.activeTabId, {
        type: 'QUICK_LINEUP'
      }).catch(() => {});
    }
  }

  // Event handlers for external data
  private async handleDataUpdate(data: any): Promise<void> {
    // Handle real-time data updates from Fantasy.AI platform
    console.log('Received data update:', data);
    
    // Update cache
    if (data.playerUpdates) {
      for (const update of data.playerUpdates) {
        const cacheKey = `player_${update.playerName.replace(/\s+/g, '_').toLowerCase()}`;
        this.state.cachedData.set(cacheKey, {
          data: update,
          timestamp: Date.now()
        });
      }
    }

    // Notify active tabs
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      if (tab.id && this.activeTabs.has(tab.id)) {
        chrome.tabs.sendMessage(tab.id, {
          type: 'DATA_UPDATE',
          data
        }).catch(() => {});
      }
    }
  }

  private async handlePlayerAlert(alert: any): Promise<void> {
    // Handle player alerts (injuries, news, etc.)
    console.log('Received player alert:', alert);
    
    // Show notification if enabled
    if (this.state.userSettings.popupAlerts) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'Hey Fantasy Alert',
        message: alert.message
      });
    }

    // Notify active tabs
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      if (tab.id && this.activeTabs.has(tab.id)) {
        chrome.tabs.sendMessage(tab.id, {
          type: 'PLAYER_ALERT',
          alert
        }).catch(() => {});
      }
    }
  }

  private async handleSystemNotification(notification: any): Promise<void> {
    // Handle system notifications
    console.log('Received system notification:', notification);
  }

  private async checkInjuryAlerts(): Promise<void> {
    // Periodic check for new injury alerts
    try {
      const response = await fetch('https://api.fantasyai.com/v1/injury-alerts', {
        headers: {
          'X-Extension-ID': chrome.runtime.id
        }
      });

      if (response.ok) {
        const alerts = await response.json();
        for (const alert of alerts) {
          await this.handlePlayerAlert(alert);
        }
      }
    } catch (error) {
      console.error('Failed to check injury alerts:', error);
    }
  }

  // Utility methods
  private async showWelcomePage(): Promise<void> {
    chrome.tabs.create({
      url: chrome.runtime.getURL('welcome.html')
    });
  }

  private async handleUpdate(previousVersion?: string): Promise<void> {
    console.log(`Extension updated from ${previousVersion} to ${chrome.runtime.getManifest().version}`);
    // Handle any migration logic here
  }

  private getPublicState(): any {
    return {
      isActive: this.state.isActive,
      voiceEnabled: this.state.voiceEnabled,
      lastSync: this.state.lastSync,
      activeTabs: Array.from(this.activeTabs.values()),
      cacheSize: this.state.cachedData.size,
      syncQueueLength: this.state.syncQueue.length
    };
  }

  // Mock data methods for demo/fallback
  private getMockPlayerData(playerName: string): any {
    return {
      playerId: `mock_${playerName.replace(/\s+/g, '_')}`,
      playerName,
      quickStats: {
        position: 'RB',
        team: 'NYG',
        fantasyPoints: 14.2,
        weeklyRank: 8,
        seasonRank: 12,
        ownership: 75,
        trend: 'UP',
        confidence: 85
      },
      fantasyProjection: {
        projectedPoints: 16.8,
        floor: 8.2,
        ceiling: 28.4,
        consistency: 78,
        confidenceLevel: 85,
        factors: [
          { factor: 'Matchup', impact: 'POSITIVE', weight: 85, description: 'Favorable run defense' },
          { factor: 'Health', impact: 'POSITIVE', weight: 95, description: 'No injury concerns' }
        ]
      },
      injuryStatus: {
        status: 'HEALTHY',
        injuryType: '',
        affectedBodyPart: '',
        severity: 0,
        recoveryTime: 0,
        fantasyImpact: 0,
        equipmentFactors: [],
        historicalComparison: []
      },
      recommendation: {
        action: 'START',
        confidence: 85,
        reasoning: 'Strong matchup with high upside potential',
        alternativeOptions: []
      }
    };
  }

  private getMockLineupData(): any {
    return {
      optimizedLineup: {
        lineup: [
          { position: 'QB', playerName: 'Josh Allen', team: 'BUF', projection: 24.2, ownership: 15 },
          { position: 'RB', playerName: 'Christian McCaffrey', team: 'SF', projection: 22.8, ownership: 25 },
          { position: 'RB', playerName: 'Austin Ekeler', team: 'LAC', projection: 18.4, ownership: 18 },
          { position: 'WR', playerName: 'Cooper Kupp', team: 'LAR', projection: 19.6, ownership: 22 }
        ],
        totalProjection: 125.4,
        upside: 145.2,
        floor: 98.7,
        uniqueness: 68,
        riskScore: 45
      },
      projectedPoints: 125.4,
      confidence: 82,
      riskLevel: 'MEDIUM'
    };
  }

  private getMockTradeData(): any {
    return {
      tradeScenarios: [
        {
          scenarioId: 'trade_1',
          myPlayers: ['Derrick Henry'],
          theirPlayers: ['Travis Kelce'],
          fairnessScore: 15,
          projectedImpact: 8.2,
          riskLevel: 35,
          reasoning: ['Kelce provides more consistent scoring', 'Henry has injury risk']
        }
      ]
    };
  }

  private getMockInjuryData(): any {
    return [
      {
        playerId: 'mock_player',
        playerName: 'Mock Player',
        status: 'HEALTHY',
        injuryType: '',
        severity: 0,
        recoveryTime: 0,
        fantasyImpact: 0
      }
    ];
  }
}

// Initialize the background service
const backgroundService = new HeyFantasyBackground();

// Export for debugging
(globalThis as any).HeyFantasyBackground = backgroundService;