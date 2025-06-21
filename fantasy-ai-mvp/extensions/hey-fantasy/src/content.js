// 🎤 Hey Fantasy Content Script
// Handles voice activation, UI injection, and page interaction

class HeyFantasyAssistant {
  constructor() {
    this.isListening = false;
    this.recognition = null;
    this.floatingWidget = null;
    this.wakeWordDetected = false;
    this.initializeVoiceRecognition();
    this.createFloatingWidget();
    this.injectStyles();
    this.listenForMessages();
  }

  initializeVoiceRecognition() {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      console.error('Speech recognition not supported');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';

    this.recognition.onresult = (event) => {
      const last = event.results.length - 1;
      const transcript = event.results[last][0].transcript.toLowerCase();

      // Check for wake word
      if (transcript.includes('hey fantasy') || transcript.includes('hey fancy')) {
        this.wakeWordDetected = true;
        this.showListeningIndicator();
        this.playActivationSound();
      } else if (this.wakeWordDetected && event.results[last].isFinal) {
        // Process command after wake word
        this.processCommand(transcript);
        this.wakeWordDetected = false;
      }
    };

    this.recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      this.hideListeningIndicator();
    };

    this.recognition.onend = () => {
      if (this.isListening) {
        this.recognition.start();
      }
    };
  }

  createFloatingWidget() {
    this.floatingWidget = document.createElement('div');
    this.floatingWidget.id = 'hey-fantasy-widget';
    this.floatingWidget.innerHTML = `
      <div class="hey-fantasy-container">
        <div class="hey-fantasy-orb">
          <div class="pulse-ring"></div>
          <div class="pulse-ring"></div>
          <div class="pulse-ring"></div>
          <svg class="microphone-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
          </svg>
        </div>
        <div class="hey-fantasy-status">
          <span class="status-text">Say "Hey Fantasy"</span>
        </div>
        <div class="hey-fantasy-results hidden">
          <div class="results-content"></div>
        </div>
      </div>
    `;

    document.body.appendChild(this.floatingWidget);

    // Make widget draggable
    this.makeWidgetDraggable();

    // Click to toggle listening
    const orb = this.floatingWidget.querySelector('.hey-fantasy-orb');
    orb.addEventListener('click', () => this.toggleListening());
  }

  makeWidgetDraggable() {
    const widget = this.floatingWidget;
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    let xOffset = 0;
    let yOffset = 0;

    const dragStart = (e) => {
      if (e.target.closest('.hey-fantasy-orb')) {
        if (e.type === 'touchstart') {
          initialX = e.touches[0].clientX - xOffset;
          initialY = e.touches[0].clientY - yOffset;
        } else {
          initialX = e.clientX - xOffset;
          initialY = e.clientY - yOffset;
        }

        if (e.target === widget || e.target.closest('.hey-fantasy-container')) {
          isDragging = true;
        }
      }
    };

    const dragEnd = () => {
      initialX = currentX;
      initialY = currentY;
      isDragging = false;
    };

    const drag = (e) => {
      if (isDragging) {
        e.preventDefault();
        
        if (e.type === 'touchmove') {
          currentX = e.touches[0].clientX - initialX;
          currentY = e.touches[0].clientY - initialY;
        } else {
          currentX = e.clientX - initialX;
          currentY = e.clientY - initialY;
        }

        xOffset = currentX;
        yOffset = currentY;

        widget.style.transform = `translate(${currentX}px, ${currentY}px)`;
      }
    };

    widget.addEventListener('touchstart', dragStart, false);
    widget.addEventListener('touchend', dragEnd, false);
    widget.addEventListener('touchmove', drag, false);
    widget.addEventListener('mousedown', dragStart, false);
    widget.addEventListener('mouseup', dragEnd, false);
    widget.addEventListener('mousemove', drag, false);
  }

  injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      #hey-fantasy-widget {
        position: fixed;
        bottom: 30px;
        right: 30px;
        z-index: 999999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }

      .hey-fantasy-container {
        position: relative;
      }

      .hey-fantasy-orb {
        width: 60px;
        height: 60px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
        transition: all 0.3s ease;
        position: relative;
      }

      .hey-fantasy-orb:hover {
        transform: scale(1.1);
        box-shadow: 0 6px 30px rgba(102, 126, 234, 0.6);
      }

      .hey-fantasy-orb.listening {
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        animation: pulse 1.5s infinite;
      }

      @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
      }

      .pulse-ring {
        position: absolute;
        width: 100%;
        height: 100%;
        border-radius: 50%;
        border: 2px solid rgba(255, 255, 255, 0.3);
        animation: pulse-ring 1.5s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
        display: none;
      }

      .hey-fantasy-orb.listening .pulse-ring {
        display: block;
      }

      .pulse-ring:nth-child(2) {
        animation-delay: -0.5s;
      }

      .pulse-ring:nth-child(3) {
        animation-delay: -1s;
      }

      @keyframes pulse-ring {
        0% {
          transform: scale(0.8);
          opacity: 1;
        }
        100% {
          transform: scale(1.5);
          opacity: 0;
        }
      }

      .microphone-icon {
        width: 28px;
        height: 28px;
        color: white;
      }

      .hey-fantasy-status {
        position: absolute;
        bottom: -30px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 4px 12px;
        border-radius: 16px;
        font-size: 12px;
        white-space: nowrap;
        opacity: 0;
        transition: opacity 0.3s ease;
      }

      .hey-fantasy-orb:hover + .hey-fantasy-status {
        opacity: 1;
      }

      .hey-fantasy-results {
        position: absolute;
        bottom: 80px;
        right: 0;
        width: 350px;
        max-height: 500px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 8px 40px rgba(0, 0, 0, 0.15);
        overflow: hidden;
        transition: all 0.3s ease;
      }

      .hey-fantasy-results.hidden {
        opacity: 0;
        pointer-events: none;
        transform: translateY(20px);
      }

      .results-content {
        padding: 20px;
        max-height: 480px;
        overflow-y: auto;
      }

      .player-recommendation {
        margin-bottom: 16px;
        padding: 12px;
        background: #f7fafc;
        border-radius: 8px;
        border-left: 4px solid #667eea;
      }

      .player-name {
        font-weight: 600;
        color: #2d3748;
        margin-bottom: 4px;
      }

      .recommendation-reason {
        font-size: 14px;
        color: #4a5568;
        line-height: 1.5;
      }

      .multimedia-insight {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-top: 8px;
        padding: 8px;
        background: #edf2f7;
        border-radius: 6px;
      }

      .insight-icon {
        width: 20px;
        height: 20px;
        flex-shrink: 0;
      }

      .insight-text {
        font-size: 13px;
        color: #2d3748;
      }

      .hey-fantasy-overlay {
        position: absolute;
        background: rgba(102, 126, 234, 0.1);
        border: 2px solid #667eea;
        border-radius: 8px;
        padding: 8px;
        pointer-events: none;
        z-index: 99999;
        animation: highlight 0.5s ease;
      }

      @keyframes highlight {
        0% { opacity: 0; transform: scale(0.95); }
        100% { opacity: 1; transform: scale(1); }
      }

      .voice-command-feedback {
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.9);
        color: white;
        padding: 12px 24px;
        border-radius: 24px;
        font-size: 14px;
        z-index: 999999;
        animation: slideIn 0.3s ease;
      }

      @keyframes slideIn {
        0% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
        100% { opacity: 1; transform: translateX(-50%) translateY(0); }
      }
    `;
    document.head.appendChild(style);
  }

  toggleListening() {
    if (this.isListening) {
      this.stopListening();
    } else {
      this.startListening();
    }
  }

  startListening() {
    this.isListening = true;
    this.recognition.start();
    this.floatingWidget.querySelector('.hey-fantasy-orb').classList.add('listening');
    this.floatingWidget.querySelector('.status-text').textContent = 'Listening...';
  }

  stopListening() {
    this.isListening = false;
    this.recognition.stop();
    this.floatingWidget.querySelector('.hey-fantasy-orb').classList.remove('listening');
    this.floatingWidget.querySelector('.status-text').textContent = 'Say "Hey Fantasy"';
  }

  showListeningIndicator() {
    this.floatingWidget.querySelector('.hey-fantasy-orb').classList.add('listening');
    this.floatingWidget.querySelector('.status-text').textContent = 'Listening for command...';
  }

  hideListeningIndicator() {
    this.floatingWidget.querySelector('.hey-fantasy-orb').classList.remove('listening');
    this.floatingWidget.querySelector('.status-text').textContent = 'Say "Hey Fantasy"';
  }

  playActivationSound() {
    // Create activation sound
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  }

  processCommand(command) {
    // Show feedback
    this.showCommandFeedback(command);

    // Send to background script
    chrome.runtime.sendMessage({
      type: 'VOICE_COMMAND',
      command: command
    });

    this.hideListeningIndicator();
  }

  showCommandFeedback(command) {
    const feedback = document.createElement('div');
    feedback.className = 'voice-command-feedback';
    feedback.textContent = `Processing: "${command}"`;
    document.body.appendChild(feedback);

    setTimeout(() => {
      feedback.remove();
    }, 3000);
  }

  listenForMessages() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      switch (request.type) {
        case 'START_LISTENING':
          this.startListening();
          break;
        case 'STOP_LISTENING':
          this.stopListening();
          break;
        case 'SHOW_LINEUP_RECOMMENDATIONS':
          this.showLineupRecommendations(request.data);
          break;
        case 'SHOW_TRADE_ANALYSIS':
          this.showTradeAnalysis(request.data);
          break;
        case 'SHOW_MULTIMEDIA_INSIGHTS':
          this.showMultimediaInsights(request.data);
          break;
        case 'EXTRACT_TRADE_DETAILS':
          sendResponse(this.extractTradeDetails());
          break;
      }
    });
  }

  showLineupRecommendations(data) {
    const resultsDiv = this.floatingWidget.querySelector('.results-content');
    resultsDiv.innerHTML = `
      <h3 style="margin: 0 0 16px 0; color: #2d3748;">Lineup Recommendations</h3>
      ${data.changes.map(change => `
        <div class="player-recommendation">
          <div class="player-name">Start: ${change.playerIn}</div>
          <div class="player-name" style="text-decoration: line-through; opacity: 0.6;">Bench: ${change.playerOut}</div>
          <div class="recommendation-reason">${change.reasoning}</div>
          ${change.insights ? `
            <div class="multimedia-insight">
              <span class="insight-icon">🎙️</span>
              <span class="insight-text">${change.insights}</span>
            </div>
          ` : ''}
        </div>
      `).join('')}
    `;

    this.floatingWidget.querySelector('.hey-fantasy-results').classList.remove('hidden');

    // Highlight players on page
    this.highlightPlayersOnPage(data.changes);
  }

  highlightPlayersOnPage(changes) {
    changes.forEach(change => {
      // Find player elements on page (platform-specific)
      const playerElements = document.querySelectorAll(`[data-player-name*="${change.playerIn}"], :contains("${change.playerIn}")`);
      
      playerElements.forEach(element => {
        const overlay = document.createElement('div');
        overlay.className = 'hey-fantasy-overlay';
        overlay.style.width = element.offsetWidth + 'px';
        overlay.style.height = element.offsetHeight + 'px';
        overlay.style.top = element.offsetTop + 'px';
        overlay.style.left = element.offsetLeft + 'px';
        
        element.parentElement.appendChild(overlay);
        
        setTimeout(() => overlay.remove(), 5000);
      });
    });
  }

  extractTradeDetails() {
    // Platform-specific extraction logic
    const platform = this.detectCurrentPlatform();
    
    switch (platform) {
      case 'yahoo':
        return this.extractYahooTradeDetails();
      case 'espn':
        return this.extractESPNTradeDetails();
      case 'sleeper':
        return this.extractSleeperTradeDetails();
      default:
        return { playersOffered: [], playersRequested: [] };
    }
  }

  detectCurrentPlatform() {
    const url = window.location.href;
    if (url.includes('yahoo.com')) return 'yahoo';
    if (url.includes('espn.com')) return 'espn';
    if (url.includes('sleeper.app')) return 'sleeper';
    if (url.includes('cbssports.com')) return 'cbs';
    if (url.includes('nfl.com')) return 'nfl';
    return 'unknown';
  }

  extractYahooTradeDetails() {
    const playersOffered = [];
    const playersRequested = [];

    // Yahoo-specific selectors
    document.querySelectorAll('.ys-trade-player-offered').forEach(el => {
      playersOffered.push(el.textContent.trim());
    });

    document.querySelectorAll('.ys-trade-player-requested').forEach(el => {
      playersRequested.push(el.textContent.trim());
    });

    return { playersOffered, playersRequested };
  }

  extractESPNTradeDetails() {
    // ESPN-specific implementation
    const playersOffered = [];
    const playersRequested = [];

    document.querySelectorAll('.trade-offer-players .player-name').forEach(el => {
      playersOffered.push(el.textContent.trim());
    });

    return { playersOffered, playersRequested };
  }

  extractSleeperTradeDetails() {
    // Sleeper-specific implementation
    const playersOffered = [];
    const playersRequested = [];

    document.querySelectorAll('[data-trade-player]').forEach(el => {
      const side = el.getAttribute('data-trade-side');
      const playerName = el.textContent.trim();
      
      if (side === 'give') {
        playersOffered.push(playerName);
      } else {
        playersRequested.push(playerName);
      }
    });

    return { playersOffered, playersRequested };
  }

  showMultimediaInsights(data) {
    const resultsDiv = this.floatingWidget.querySelector('.results-content');
    resultsDiv.innerHTML = `
      <h3 style="margin: 0 0 16px 0; color: #2d3748;">Multimedia Insights</h3>
      ${data.podcasts.length > 0 ? `
        <div style="margin-bottom: 16px;">
          <h4 style="margin: 0 0 8px 0; color: #4a5568; font-size: 14px;">📻 Podcast Mentions</h4>
          ${data.podcasts.map(p => `
            <div class="multimedia-insight">
              <span class="insight-text">"${p.quote}" - ${p.source}</span>
            </div>
          `).join('')}
        </div>
      ` : ''}
      ${data.youtube.length > 0 ? `
        <div style="margin-bottom: 16px;">
          <h4 style="margin: 0 0 8px 0; color: #4a5568; font-size: 14px;">📺 YouTube Analysis</h4>
          ${data.youtube.map(v => `
            <div class="multimedia-insight">
              <span class="insight-text">${v.title} - ${v.views} views</span>
            </div>
          `).join('')}
        </div>
      ` : ''}
      ${data.social.length > 0 ? `
        <div style="margin-bottom: 16px;">
          <h4 style="margin: 0 0 8px 0; color: #4a5568; font-size: 14px;">📱 Social Sentiment</h4>
          ${data.social.map(s => `
            <div class="multimedia-insight">
              <span class="insight-text">${s.platform}: ${s.sentiment} (${s.mentions} mentions)</span>
            </div>
          `).join('')}
        </div>
      ` : ''}
      <div style="margin-top: 16px; padding: 12px; background: #f7fafc; border-radius: 8px;">
        <strong>Summary:</strong> ${data.summary}
      </div>
    `;

    this.floatingWidget.querySelector('.hey-fantasy-results').classList.remove('hidden');
  }
}

// Initialize Hey Fantasy Assistant
const heyFantasy = new HeyFantasyAssistant();

// Platform-specific helpers
document.addEventListener('DOMContentLoaded', () => {
  // Auto-start listening if on a fantasy platform
  const platform = heyFantasy.detectCurrentPlatform();
  if (platform !== 'unknown') {
    console.log(`🏈 Hey Fantasy detected ${platform} platform!`);
    
    // Add platform-specific enhancements
    switch (platform) {
      case 'yahoo':
        enhanceYahooExperience();
        break;
      case 'espn':
        enhanceESPNExperience();
        break;
      case 'sleeper':
        enhanceSleeperExperience();
        break;
    }
  }
});

function enhanceYahooExperience() {
  // Add Hey Fantasy buttons to Yahoo interface
  const playerRows = document.querySelectorAll('.player-row');
  playerRows.forEach(row => {
    const button = document.createElement('button');
    button.className = 'hey-fantasy-quick-check';
    button.textContent = '🎤';
    button.title = 'Ask Hey Fantasy about this player';
    button.onclick = () => {
      const playerName = row.querySelector('.player-name').textContent;
      heyFantasy.processCommand(`tell me about ${playerName}`);
    };
    row.appendChild(button);
  });
}

function enhanceESPNExperience() {
  // ESPN-specific enhancements
  console.log('Enhancing ESPN Fantasy experience...');
}

function enhanceSleeperExperience() {
  // Sleeper-specific enhancements
  console.log('Enhancing Sleeper experience...');
}

console.log('🎙️ Hey Fantasy content script loaded!');