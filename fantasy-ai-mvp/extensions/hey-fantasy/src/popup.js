// 🎯 Hey Fantasy Popup Controller

class HeyFantasyPopup {
  constructor() {
    this.isListening = false;
    this.recognition = null;
    this.initializeElements();
    this.attachEventListeners();
    this.initializeVoiceRecognition();
    this.loadUserData();
  }

  initializeElements() {
    this.voiceOrb = document.getElementById('voiceOrb');
    this.voiceText = document.getElementById('voiceText');
    this.transcript = document.getElementById('transcript');
    this.status = document.getElementById('status');
    this.leagueList = document.getElementById('leagueList');
    this.insightsFeed = document.getElementById('insightsFeed');
    this.syncButton = document.getElementById('syncLeagues');
    this.settingsLink = document.getElementById('settingsLink');
  }

  attachEventListeners() {
    // Voice orb click
    this.voiceOrb.addEventListener('click', () => this.toggleVoice());

    // Quick action buttons
    document.querySelectorAll('.action-button').forEach(button => {
      button.addEventListener('click', (e) => {
        const command = e.currentTarget.getAttribute('data-command');
        this.sendCommand(command);
      });
    });

    // Sync leagues
    this.syncButton.addEventListener('click', () => this.syncLeagues());

    // Settings
    this.settingsLink.addEventListener('click', () => {
      chrome.runtime.openOptionsPage();
    });
  }

  initializeVoiceRecognition() {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      this.voiceText.textContent = 'Voice recognition not supported';
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';

    this.recognition.onstart = () => {
      this.isListening = true;
      this.voiceOrb.classList.add('listening');
      this.voiceText.textContent = 'Listening...';
      this.transcript.style.display = 'block';
      this.transcript.textContent = '';
    };

    this.recognition.onresult = (event) => {
      const last = event.results.length - 1;
      const transcript = event.results[last][0].transcript;
      
      this.transcript.textContent = transcript;

      if (event.results[last].isFinal) {
        this.processVoiceCommand(transcript);
      }
    };

    this.recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      this.stopListening();
      this.voiceText.textContent = 'Error: ' + event.error;
    };

    this.recognition.onend = () => {
      this.stopListening();
    };
  }

  toggleVoice() {
    if (this.isListening) {
      this.recognition.stop();
    } else {
      this.recognition.start();
    }
  }

  stopListening() {
    this.isListening = false;
    this.voiceOrb.classList.remove('listening');
    this.voiceText.textContent = 'Click or say "Hey Fantasy"';
    setTimeout(() => {
      this.transcript.style.display = 'none';
    }, 3000);
  }

  processVoiceCommand(command) {
    // Remove "hey fantasy" wake word if present
    const cleanCommand = command.toLowerCase().replace(/hey fantasy,?\s*/i, '').trim();
    this.sendCommand(cleanCommand);
  }

  sendCommand(command) {
    // Send to background script
    chrome.runtime.sendMessage({
      type: 'VOICE_COMMAND',
      command: command
    }, response => {
      if (response && response.success) {
        this.showNotification('Command processed successfully');
      }
    });

    // Get active tab and send command
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: 'PROCESS_COMMAND',
          command: command
        });
      }
    });
  }

  async loadUserData() {
    // Load user's leagues
    chrome.storage.local.get(['leagues', 'recentInsights'], (data) => {
      if (data.leagues) {
        this.displayLeagues(data.leagues);
      }
      
      if (data.recentInsights) {
        this.displayInsights(data.recentInsights);
      }
    });

    // Check extension status
    chrome.storage.local.get('settings', (data) => {
      if (data.settings && data.settings.voiceActivation) {
        this.status.textContent = 'Active';
        this.status.classList.add('active');
      } else {
        this.status.textContent = 'Inactive';
        this.status.classList.remove('active');
      }
    });
  }

  displayLeagues(leagues) {
    this.leagueList.innerHTML = leagues.map(league => `
      <div class="league-item">
        <span>${league.name}</span>
        <span class="league-platform">${league.platform}</span>
      </div>
    `).join('');
  }

  displayInsights(insights) {
    this.insightsFeed.innerHTML = insights.map(insight => `
      <div class="insight-item">
        <div>${insight.icon} ${insight.content}</div>
        <div class="insight-source">${insight.source} - ${this.getTimeAgo(insight.timestamp)}</div>
      </div>
    `).join('');
  }

  syncLeagues() {
    this.syncButton.textContent = 'Syncing...';
    this.syncButton.disabled = true;

    chrome.runtime.sendMessage({
      type: 'SYNC_LEAGUES'
    }, response => {
      if (response && response.success) {
        this.displayLeagues(response.leagues);
        this.showNotification(`Synced ${response.leagues.length} leagues!`);
      } else {
        this.showNotification('Sync failed. Please try again.');
      }
      
      this.syncButton.textContent = 'Sync All Leagues';
      this.syncButton.disabled = false;
    });
  }

  showNotification(message) {
    // Simple notification in popup
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 12px 24px;
      border-radius: 24px;
      font-size: 13px;
      z-index: 9999;
      animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  getTimeAgo(timestamp) {
    const seconds = Math.floor((new Date() - new Date(timestamp)) / 1000);
    
    const intervals = {
      year: 31536000,
      month: 2592000,
      week: 604800,
      day: 86400,
      hour: 3600,
      minute: 60
    };

    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
      const interval = Math.floor(seconds / secondsInUnit);
      if (interval > 1) {
        return `${interval} ${unit}s ago`;
      } else if (interval === 1) {
        return `${interval} ${unit} ago`;
      }
    }

    return 'just now';
  }

  // Simulate real-time insights updates
  startInsightsUpdates() {
    setInterval(() => {
      // Fetch latest insights
      chrome.runtime.sendMessage({
        type: 'GET_LATEST_INSIGHTS'
      }, response => {
        if (response && response.insights) {
          this.displayInsights(response.insights);
        }
      });
    }, 60000); // Update every minute
  }
}

// Add popup animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    0% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
    100% { opacity: 1; transform: translateX(-50%) translateY(0); }
  }
  
  @keyframes slideOut {
    0% { opacity: 1; transform: translateX(-50%) translateY(0); }
    100% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
  }
`;
document.head.appendChild(style);

// Initialize popup
document.addEventListener('DOMContentLoaded', () => {
  const popup = new HeyFantasyPopup();
  popup.startInsightsUpdates();
});

// Mock data for demo
const mockInsights = [
  {
    icon: '🎙️',
    content: 'Patrick Mahomes discussed as QB1 for playoffs',
    source: 'The Ringer Fantasy Football Show',
    timestamp: new Date(Date.now() - 1800000).toISOString()
  },
  {
    icon: '📺',
    content: 'Justin Jefferson route running analysis goes viral',
    source: 'Brett Kollmann - YouTube',
    timestamp: new Date(Date.now() - 3600000).toISOString()
  },
  {
    icon: '📱',
    content: 'Travis Kelce injury update trending #1 on Twitter',
    source: 'Social Media Tracker',
    timestamp: new Date(Date.now() - 7200000).toISOString()
  },
  {
    icon: '🏈',
    content: 'Weather alert: Snow expected for Bills vs Dolphins',
    source: 'Weather Impact Analysis',
    timestamp: new Date(Date.now() - 10800000).toISOString()
  },
  {
    icon: '💊',
    content: 'Saquon Barkley upgraded to full practice',
    source: 'Injury Report Monitor',
    timestamp: new Date(Date.now() - 14400000).toISOString()
  }
];

// Store mock data for demo
chrome.storage.local.set({
  leagues: [
    { name: 'Championship League', platform: 'yahoo' },
    { name: 'Friends League', platform: 'espn' },
    { name: 'Dynasty Masters', platform: 'sleeper' },
    { name: 'DFS Main Event', platform: 'draftkings' }
  ],
  recentInsights: mockInsights
});