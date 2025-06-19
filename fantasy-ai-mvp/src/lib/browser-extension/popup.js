/**
 * HEY FANTASY POPUP SCRIPT
 * Controls the extension popup interface
 */

class FantasyPopup {
  constructor() {
    this.isVoiceActive = false;
    this.extensionState = null;
    this.init();
  }

  async init() {
    this.setupEventListeners();
    await this.loadExtensionState();
    this.updateUI();
    this.startUpdateInterval();
  }

  setupEventListeners() {
    // Voice button
    const voiceButton = document.getElementById('voiceButton');
    const voiceStatus = document.getElementById('voiceStatus');
    
    voiceButton.addEventListener('click', async () => {
      await this.toggleVoice();
    });

    // Quick action buttons
    document.getElementById('toggleOverlay').addEventListener('click', () => {
      this.sendCommand('TOGGLE_OVERLAY');
    });

    document.getElementById('quickLineup').addEventListener('click', () => {
      this.sendCommand('QUICK_LINEUP');
    });

    document.getElementById('syncData').addEventListener('click', async () => {
      await this.syncData();
    });

    document.getElementById('openSettings').addEventListener('click', () => {
      chrome.runtime.openOptionsPage();
    });

    // Footer links
    document.getElementById('helpLink').addEventListener('click', (e) => {
      e.preventDefault();
      chrome.tabs.create({ url: 'https://fantasyai.com/help' });
    });

    document.getElementById('privacyLink').addEventListener('click', (e) => {
      e.preventDefault();
      chrome.tabs.create({ url: 'https://fantasyai.com/privacy' });
    });

    document.getElementById('supportLink').addEventListener('click', (e) => {
      e.preventDefault();
      chrome.tabs.create({ url: 'https://fantasyai.com/support' });
    });
  }

  async loadExtensionState() {
    try {
      const response = await this.sendMessage({ type: 'GET_EXTENSION_STATE' });
      if (response.success) {
        this.extensionState = response.data;
        this.isVoiceActive = response.data.voiceEnabled;
      }
    } catch (error) {
      console.error('Failed to load extension state:', error);
      this.showError('Failed to connect to extension');
    }
  }

  updateUI() {
    if (!this.extensionState) return;

    // Update voice button and status
    const voiceButton = document.getElementById('voiceButton');
    const voiceStatus = document.getElementById('voiceStatus');
    
    if (this.isVoiceActive) {
      voiceButton.classList.add('active');
      voiceStatus.textContent = 'Voice Active - Say "Hey Fantasy"';
    } else {
      voiceButton.classList.remove('active');
      voiceStatus.textContent = 'Voice Inactive - Click to activate';
    }

    // Update stats
    document.getElementById('activeTabs').textContent = this.extensionState.activeTabs?.length || 0;
    document.getElementById('cacheSize').textContent = this.extensionState.cacheSize || 0;
    
    // Format last sync time
    const lastSync = this.extensionState.lastSync;
    if (lastSync && lastSync > 0) {
      const minutes = Math.floor((Date.now() - lastSync) / 60000);
      document.getElementById('lastSync').textContent = minutes < 1 ? 'Just now' : `${minutes}m ago`;
    } else {
      document.getElementById('lastSync').textContent = 'Never';
    }

    // Format uptime
    const uptime = this.extensionState.uptime;
    if (uptime) {
      const minutes = Math.floor(uptime / 60000);
      const hours = Math.floor(minutes / 60);
      if (hours > 0) {
        document.getElementById('uptime').textContent = `${hours}h ${minutes % 60}m`;
      } else {
        document.getElementById('uptime').textContent = `${minutes}m`;
      }
    } else {
      document.getElementById('uptime').textContent = '0m';
    }
  }

  async toggleVoice() {
    this.showLoading();
    
    try {
      // Send command to background script
      await this.sendCommand('TOGGLE_VOICE');
      
      // Toggle local state
      this.isVoiceActive = !this.isVoiceActive;
      
      this.hideLoading();
      this.updateUI();
      
      if (this.isVoiceActive) {
        this.showSuccess('Voice activation enabled');
      } else {
        this.showSuccess('Voice activation disabled');
      }
    } catch (error) {
      this.hideLoading();
      this.showError('Failed to toggle voice activation');
    }
  }

  async syncData() {
    this.showLoading();
    
    try {
      const response = await this.sendMessage({ type: 'SYNC_REQUEST' });
      
      if (response.success) {
        // Reload extension state after sync
        await this.loadExtensionState();
        this.updateUI();
        this.showSuccess('Data synchronized successfully');
      } else {
        this.showError('Sync failed: ' + (response.error || 'Unknown error'));
      }
    } catch (error) {
      this.showError('Sync failed: ' + error.message);
    } finally {
      this.hideLoading();
    }
  }

  async sendCommand(command) {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (tab?.id) {
      try {
        await chrome.tabs.sendMessage(tab.id, {
          type: command
        });
      } catch (error) {
        // If content script not available, send to background
        await this.sendMessage({ type: command });
      }
    } else {
      await this.sendMessage({ type: command });
    }
  }

  async sendMessage(message) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    });
  }

  showLoading() {
    document.getElementById('loading').classList.add('active');
  }

  hideLoading() {
    document.getElementById('loading').classList.remove('active');
  }

  showError(message) {
    const errorElement = document.getElementById('error');
    const errorMessage = document.getElementById('errorMessage');
    
    errorMessage.textContent = message;
    errorElement.classList.add('active');
    
    setTimeout(() => {
      errorElement.classList.remove('active');
    }, 4000);
  }

  showSuccess(message) {
    const successElement = document.getElementById('success');
    const successMessage = document.getElementById('successMessage');
    
    successMessage.textContent = message;
    successElement.classList.add('active');
    
    setTimeout(() => {
      successElement.classList.remove('active');
    }, 3000);
  }

  startUpdateInterval() {
    // Update stats every 5 seconds
    setInterval(async () => {
      await this.loadExtensionState();
      this.updateUI();
    }, 5000);
  }

  // Handle keyboard shortcuts
  handleKeyPress(event) {
    if (event.ctrlKey && event.shiftKey) {
      switch (event.code) {
        case 'KeyF':
          event.preventDefault();
          this.toggleVoice();
          break;
        case 'KeyO':
          event.preventDefault();
          this.sendCommand('TOGGLE_OVERLAY');
          break;
        case 'KeyL':
          event.preventDefault();
          this.sendCommand('QUICK_LINEUP');
          break;
      }
    }
  }
}

// Initialize popup when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const popup = new FantasyPopup();
  
  // Handle keyboard shortcuts
  document.addEventListener('keydown', (event) => {
    popup.handleKeyPress(event);
  });
});

// Handle external updates from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'EXTENSION_STATE_UPDATE') {
    // Update popup if extension state changes
    window.location.reload();
  }
});