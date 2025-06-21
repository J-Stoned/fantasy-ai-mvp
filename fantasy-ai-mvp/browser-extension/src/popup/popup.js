/**
 * HEY FANTASY - Popup Script
 * Settings and control panel for the browser extension
 */

class PopupController {
  constructor() {
    this.settings = {};
    this.stats = {};
    this.teams = [];
    
    this.init();
  }
  
  async init() {
    // Load current settings and stats
    await this.loadSettings();
    await this.loadStats();
    
    // Initialize UI
    this.initializeUI();
    
    // Set up event listeners
    this.setupEventListeners();
    
    console.log('Hey Fantasy popup initialized!');
  }
  
  async loadSettings() {
    return new Promise((resolve) => {
      chrome.storage.sync.get([
        'voiceEnabled',
        'voiceActivationMethod',
        'widgetsEnabled',
        'uiPosition',
        'favoriteTeams',
        'adPreferences',
        'theme'
      ], (result) => {
        this.settings = {
          voiceEnabled: result.voiceEnabled !== false,
          voiceActivationMethod: result.voiceActivationMethod || 'both',
          widgetsEnabled: result.widgetsEnabled !== false,
          uiPosition: result.uiPosition || 'bottom-right',
          favoriteTeams: result.favoriteTeams || [],
          adPreferences: result.adPreferences || 'non-intrusive',
          theme: result.theme || 'light'
        };
        resolve();
      });
    });
  }
  
  async loadStats() {
    return new Promise((resolve) => {
      chrome.storage.local.get([
        'dailyQueries',
        'totalQueries',
        'activeTime',
        'lastActive'
      ], (result) => {
        const today = new Date().toDateString();
        const lastActiveDate = result.lastActive || '';
        
        this.stats = {
          dailyQueries: lastActiveDate === today ? (result.dailyQueries || 0) : 0,
          totalQueries: result.totalQueries || 0,
          activeTime: result.activeTime || 0
        };
        resolve();
      });
    });
  }
  
  initializeUI() {
    // Update stats display
    document.getElementById('queries-today').textContent = this.stats.dailyQueries;
    document.getElementById('active-time').textContent = this.formatTime(this.stats.activeTime);
    
    // Set form values
    document.getElementById('voice-enabled').checked = this.settings.voiceEnabled;
    document.getElementById('activation-method').value = this.settings.voiceActivationMethod;
    document.getElementById('widgets-enabled').checked = this.settings.widgetsEnabled;
    document.getElementById('ui-position').value = this.settings.uiPosition;
    document.getElementById('ad-preference').value = this.settings.adPreferences;
    
    // Load favorite teams
    this.renderFavoriteTeams();
  }
  
  setupEventListeners() {
    // Settings changes
    document.getElementById('voice-enabled').addEventListener('change', (e) => {
      this.updateSetting('voiceEnabled', e.target.checked);
    });
    
    document.getElementById('activation-method').addEventListener('change', (e) => {
      this.updateSetting('voiceActivationMethod', e.target.value);
    });
    
    document.getElementById('widgets-enabled').addEventListener('change', (e) => {
      this.updateSetting('widgetsEnabled', e.target.checked);
    });
    
    document.getElementById('ui-position').addEventListener('change', (e) => {
      this.updateSetting('uiPosition', e.target.value);
    });
    
    document.getElementById('ad-preference').addEventListener('change', (e) => {
      this.updateSetting('adPreferences', e.target.value);
    });
    
    // Action buttons
    document.getElementById('test-voice').addEventListener('click', () => {
      this.testVoice();
    });
    
    document.getElementById('view-dashboard').addEventListener('click', () => {
      this.openDashboard();
    });
    
    document.getElementById('upgrade-link').addEventListener('click', () => {
      this.openUpgradePage();
    });
    
    // Add team button
    document.getElementById('add-team').addEventListener('click', () => {
      this.showAddTeamDialog();
    });
  }
  
  async updateSetting(key, value) {
    this.settings[key] = value;
    
    // Save to storage
    await chrome.storage.sync.set({ [key]: value });
    
    // Notify content scripts of changes
    this.notifySettingsChange(key, value);
    
    console.log(`Setting updated: ${key} = ${value}`);
  }
  
  notifySettingsChange(key, value) {
    // Send message to all tabs
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, {
          type: 'SETTINGS_CHANGED',
          setting: key,
          value: value
        }).catch(() => {
          // Ignore errors for tabs that don't have content script
        });
      });
    });
  }
  
  renderFavoriteTeams() {
    const container = document.getElementById('favorite-teams');
    const addButton = document.getElementById('add-team');
    
    // Clear existing teams (except add button)
    container.querySelectorAll('.team-chip').forEach(chip => chip.remove());
    
    // Add team chips
    this.settings.favoriteTeams.forEach(team => {
      const chip = this.createTeamChip(team);
      container.insertBefore(chip, addButton);
    });
  }
  
  createTeamChip(team) {
    const chip = document.createElement('div');
    chip.className = 'team-chip';
    chip.innerHTML = `
      <span>${team}</span>
      <button type="button" onclick="popup.removeTeam('${team}')">&times;</button>
    `;
    return chip;
  }
  
  async removeTeam(teamName) {
    this.settings.favoriteTeams = this.settings.favoriteTeams.filter(team => team !== teamName);
    await this.updateSetting('favoriteTeams', this.settings.favoriteTeams);
    this.renderFavoriteTeams();
  }
  
  showAddTeamDialog() {
    const teamName = prompt('Enter team name (e.g., "Chiefs", "Lakers", "Yankees"):');
    if (teamName && teamName.trim()) {
      this.addTeam(teamName.trim());
    }
  }
  
  async addTeam(teamName) {
    if (!this.settings.favoriteTeams.includes(teamName)) {
      this.settings.favoriteTeams.push(teamName);
      await this.updateSetting('favoriteTeams', this.settings.favoriteTeams);
      this.renderFavoriteTeams();
    }
  }
  
  async testVoice() {
    const button = document.getElementById('test-voice');
    const originalText = button.innerHTML;
    
    // Show loading state
    button.innerHTML = '<span class="loading">Testing Voice</span>';
    button.disabled = true;
    
    try {
      // Get current active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // Send test message to content script
      const response = await chrome.tabs.sendMessage(tab.id, {
        type: 'TEST_VOICE_ACTIVATION'
      });
      
      if (response && response.status === 'success') {
        this.showNotification('Voice test successful!', 'success');
      } else {
        this.showNotification('Voice test failed. Please check microphone permissions.', 'error');
      }
      
    } catch (error) {
      console.error('Voice test error:', error);
      this.showNotification('Voice test failed. Make sure you\'re on a supported website.', 'error');
    }
    
    // Restore button
    setTimeout(() => {
      button.innerHTML = originalText;
      button.disabled = false;
    }, 2000);
  }
  
  openDashboard() {
    chrome.tabs.create({ url: 'https://fantasy.ai/dashboard' });
    window.close();
  }
  
  openUpgradePage() {
    chrome.tabs.create({ url: 'https://fantasy.ai/premium' });
    window.close();
  }
  
  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      left: 20px;
      right: 20px;
      padding: 12px 16px;
      border-radius: 8px;
      color: white;
      font-size: 14px;
      font-weight: 500;
      z-index: 1000;
      animation: slideDown 0.3s ease;
      background: ${type === 'success' ? '#48bb78' : type === 'error' ? '#f56565' : '#667eea'};
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove notification
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }
  
  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const hours = Math.floor(mins / 60);
    
    if (hours > 0) {
      return `${hours}h ${mins % 60}m`;
    } else if (mins > 0) {
      return `${mins}m`;
    } else {
      return `${seconds}s`;
    }
  }
  
  // Update stats (called by background script)
  updateStats(newStats) {
    this.stats = { ...this.stats, ...newStats };
    
    document.getElementById('queries-today').textContent = this.stats.dailyQueries;
    document.getElementById('active-time').textContent = this.formatTime(this.stats.activeTime);
  }
}

// Global reference for team management
let popup;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  popup = new PopupController();
});

// Listen for stats updates from background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'STATS_UPDATE' && popup) {
    popup.updateStats(request.stats);
  }
});

// Add notification styles
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;
document.head.appendChild(notificationStyles);