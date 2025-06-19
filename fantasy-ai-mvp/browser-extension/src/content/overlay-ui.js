/**
 * HEY FANTASY - Overlay UI System
 * Provides visual feedback and results display for voice interactions
 */

class FantasyOverlayUI {
  constructor() {
    this.overlayElement = null;
    this.resultsContainer = null;
    this.adContainer = null;
    this.isVisible = false;
    this.currentSessionId = null;
    this.adRefreshInterval = null;
    
    // UI Configuration
    this.config = {
      position: 'bottom-right',
      animationDuration: 300,
      resultDisplayTime: 30000, // 30 seconds
      adDisplayTime: 30000, // 30 seconds
      maxResults: 5
    };
    
    this.init();
  }
  
  init() {
    // Create overlay elements
    this.createOverlay();
    
    // Listen for voice events
    this.setupEventListeners();
    
    // Load user preferences
    this.loadUserPreferences();
    
    console.log('Hey Fantasy UI initialized!');
  }
  
  createOverlay() {
    // Create main overlay container
    this.overlayElement = document.createElement('div');
    this.overlayElement.id = 'hey-fantasy-overlay';
    this.overlayElement.className = 'hey-fantasy-overlay hidden';
    
    // Create inner structure
    this.overlayElement.innerHTML = `
      <div class="hey-fantasy-container">
        <!-- Voice Activation Indicator -->
        <div class="voice-indicator hidden">
          <div class="pulse-ring"></div>
          <div class="voice-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
            </svg>
          </div>
          <div class="voice-text">Listening...</div>
        </div>
        
        <!-- Results Container -->
        <div class="results-container hidden">
          <div class="results-header">
            <h3 class="results-title">Hey Fantasy Results</h3>
            <button class="close-button" aria-label="Close">×</button>
          </div>
          <div class="results-content"></div>
        </div>
        
        <!-- Ad Container -->
        <div class="ad-container hidden">
          <div class="ad-label">Sponsored</div>
          <div class="ad-content"></div>
        </div>
        
        <!-- Floating Action Button -->
        <button class="hey-fantasy-fab" aria-label="Activate Hey Fantasy">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
          </svg>
        </button>
      </div>
    `;
    
    // Append to body
    document.body.appendChild(this.overlayElement);
    
    // Cache elements
    this.voiceIndicator = this.overlayElement.querySelector('.voice-indicator');
    this.resultsContainer = this.overlayElement.querySelector('.results-container');
    this.adContainer = this.overlayElement.querySelector('.ad-container');
    this.fabButton = this.overlayElement.querySelector('.hey-fantasy-fab');
    
    // Set up interactions
    this.setupUIInteractions();
  }
  
  setupEventListeners() {
    // Voice system events
    document.addEventListener('hey-fantasy-inject-ui', () => this.show());
    document.addEventListener('hey-fantasy-activated', (e) => this.handleActivation(e.detail));
    document.addEventListener('hey-fantasy-processing', (e) => this.handleProcessing(e.detail));
    document.addEventListener('hey-fantasy-results', (e) => this.handleResults(e.detail));
    document.addEventListener('hey-fantasy-error', (e) => this.handleError(e.detail));
    document.addEventListener('hey-fantasy-timeout', (e) => this.handleTimeout(e.detail));
  }
  
  setupUIInteractions() {
    // FAB button click
    this.fabButton.addEventListener('click', () => {
      document.dispatchEvent(new Event('hey-fantasy-activate'));
    });
    
    // Close button
    const closeButton = this.overlayElement.querySelector('.close-button');
    closeButton.addEventListener('click', () => this.hideResults());
    
    // Click outside to close
    document.addEventListener('click', (e) => {
      if (this.isVisible && !this.overlayElement.contains(e.target)) {
        this.hideResults();
      }
    });
    
    // Escape key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isVisible) {
        this.hideResults();
      }
    });
  }
  
  handleActivation(detail) {
    this.currentSessionId = detail.sessionId;
    this.show();
    this.showVoiceIndicator();
    
    // Animate pulse
    this.voiceIndicator.classList.add('active');
  }
  
  handleProcessing(detail) {
    const voiceText = this.voiceIndicator.querySelector('.voice-text');
    voiceText.textContent = `Processing: "${detail.command}"`;
  }
  
  handleResults(detail) {
    const { response, sessionId } = detail;
    
    if (sessionId !== this.currentSessionId) return;
    
    // Hide voice indicator
    this.hideVoiceIndicator();
    
    // Show results
    this.displayResults(response);
    
    // Request ad if enabled
    this.requestAd();
  }
  
  handleError(detail) {
    this.hideVoiceIndicator();
    this.showError(detail.error);
  }
  
  handleTimeout(detail) {
    this.hideVoiceIndicator();
    this.showError('No command detected. Try saying "Hey Fantasy" followed by your question.');
  }
  
  displayResults(response) {
    const content = this.resultsContainer.querySelector('.results-content');
    
    // Clear previous results
    content.innerHTML = '';
    
    // Check response type
    if (response.status === 'error') {
      this.showError(response.message);
      return;
    }
    
    // Display based on response type
    switch (response.type) {
      case 'player_stats':
        content.appendChild(this.createPlayerStatsDisplay(response.data));
        break;
        
      case 'game_scores':
        content.appendChild(this.createGameScoresDisplay(response.data));
        break;
        
      case 'injury_report':
        content.appendChild(this.createInjuryReportDisplay(response.data));
        break;
        
      case 'fantasy_advice':
        content.appendChild(this.createFantasyAdviceDisplay(response.data));
        break;
        
      default:
        content.appendChild(this.createGeneralResultDisplay(response.data));
    }
    
    // Show results container
    this.showResults();
    
    // Auto-hide after timeout
    setTimeout(() => this.hideResults(), this.config.resultDisplayTime);
  }
  
  createPlayerStatsDisplay(data) {
    const container = document.createElement('div');
    container.className = 'player-stats-display';
    
    container.innerHTML = `
      <div class="player-header">
        <img src="${data.playerImage || '/public/images/default-player.png'}" 
             alt="${data.playerName}" class="player-image">
        <div class="player-info">
          <h4>${data.playerName}</h4>
          <p>${data.position} - ${data.team}</p>
        </div>
      </div>
      <div class="stats-grid">
        ${Object.entries(data.stats).map(([key, value]) => `
          <div class="stat-item">
            <span class="stat-label">${this.formatStatLabel(key)}</span>
            <span class="stat-value">${value}</span>
          </div>
        `).join('')}
      </div>
      ${data.fantasyProjection ? `
        <div class="fantasy-projection">
          <strong>Fantasy Projection:</strong> ${data.fantasyProjection} pts
        </div>
      ` : ''}
    `;
    
    return container;
  }
  
  createGameScoresDisplay(data) {
    const container = document.createElement('div');
    container.className = 'game-scores-display';
    
    const games = Array.isArray(data) ? data : [data];
    
    container.innerHTML = `
      <div class="scores-list">
        ${games.map(game => `
          <div class="game-score">
            <div class="team-score ${game.awayScore > game.homeScore ? 'winner' : ''}">
              <img src="${game.awayLogo}" alt="${game.awayTeam}" class="team-logo">
              <span class="team-name">${game.awayTeam}</span>
              <span class="score">${game.awayScore}</span>
            </div>
            <div class="game-status">${game.status}</div>
            <div class="team-score ${game.homeScore > game.awayScore ? 'winner' : ''}">
              <img src="${game.homeLogo}" alt="${game.homeTeam}" class="team-logo">
              <span class="team-name">${game.homeTeam}</span>
              <span class="score">${game.homeScore}</span>
            </div>
          </div>
        `).join('')}
      </div>
    `;
    
    return container;
  }
  
  createInjuryReportDisplay(data) {
    const container = document.createElement('div');
    container.className = 'injury-report-display';
    
    const injuries = Array.isArray(data) ? data : [data];
    
    container.innerHTML = `
      <div class="injury-list">
        ${injuries.map(injury => `
          <div class="injury-item">
            <div class="injury-player">
              <strong>${injury.playerName}</strong>
              <span class="injury-team">${injury.team}</span>
            </div>
            <div class="injury-details">
              <span class="injury-status ${injury.status.toLowerCase()}">${injury.status}</span>
              <span class="injury-description">${injury.description}</span>
            </div>
            ${injury.returnDate ? `
              <div class="return-date">Expected return: ${injury.returnDate}</div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    `;
    
    return container;
  }
  
  createFantasyAdviceDisplay(data) {
    const container = document.createElement('div');
    container.className = 'fantasy-advice-display';
    
    container.innerHTML = `
      <div class="advice-content">
        <h4>${data.title}</h4>
        <p>${data.advice}</p>
        ${data.players ? `
          <div class="player-recommendations">
            ${data.players.map(player => `
              <div class="player-rec">
                <span class="player-name">${player.name}</span>
                <span class="recommendation ${player.action}">${player.action}</span>
                <span class="reasoning">${player.reason}</span>
              </div>
            `).join('')}
          </div>
        ` : ''}
        ${data.confidence ? `
          <div class="confidence-meter">
            <span>Confidence:</span>
            <div class="meter">
              <div class="meter-fill" style="width: ${data.confidence}%"></div>
            </div>
            <span>${data.confidence}%</span>
          </div>
        ` : ''}
      </div>
    `;
    
    return container;
  }
  
  createGeneralResultDisplay(data) {
    const container = document.createElement('div');
    container.className = 'general-result-display';
    
    container.innerHTML = `
      <div class="result-content">
        ${data.title ? `<h4>${data.title}</h4>` : ''}
        ${data.content ? `<p>${data.content}</p>` : ''}
        ${data.source ? `<div class="source">Source: ${data.source}</div>` : ''}
      </div>
    `;
    
    return container;
  }
  
  async requestAd() {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'AD_REQUEST' });
      
      if (response.status === 'success' && response.ad) {
        this.displayAd(response.ad);
      }
    } catch (error) {
      console.error('Ad request failed:', error);
    }
  }
  
  displayAd(ad) {
    const adContent = this.adContainer.querySelector('.ad-content');
    
    adContent.innerHTML = `
      <a href="${ad.content.clickUrl}" target="_blank" class="ad-link">
        <div class="ad-creative">
          ${ad.content.imageUrl ? 
            `<img src="${ad.content.imageUrl}" alt="${ad.content.headline}">` : 
            ''
          }
          <div class="ad-text">
            <h5>${ad.content.headline}</h5>
            <p>${ad.content.description}</p>
            <span class="ad-cta">${ad.content.cta}</span>
          </div>
        </div>
      </a>
    `;
    
    this.adContainer.classList.remove('hidden');
    
    // Track ad impression
    chrome.runtime.sendMessage({
      type: 'ANALYTICS_EVENT',
      event: 'ad_impression',
      data: { adId: ad.id }
    });
    
    // Auto-hide ad after display time
    setTimeout(() => {
      this.adContainer.classList.add('hidden');
    }, this.config.adDisplayTime);
  }
  
  // UI State Management
  show() {
    this.overlayElement.classList.remove('hidden');
    this.isVisible = true;
  }
  
  hide() {
    this.overlayElement.classList.add('hidden');
    this.isVisible = false;
  }
  
  showVoiceIndicator() {
    this.voiceIndicator.classList.remove('hidden');
    this.resultsContainer.classList.add('hidden');
  }
  
  hideVoiceIndicator() {
    this.voiceIndicator.classList.remove('hidden');
    this.voiceIndicator.classList.remove('active');
  }
  
  showResults() {
    this.resultsContainer.classList.remove('hidden');
    this.voiceIndicator.classList.add('hidden');
  }
  
  hideResults() {
    this.resultsContainer.classList.add('hidden');
    this.hide();
  }
  
  showError(message) {
    const content = this.resultsContainer.querySelector('.results-content');
    content.innerHTML = `
      <div class="error-display">
        <svg class="error-icon" width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
        </svg>
        <p>${message}</p>
        <button class="retry-button">Try Again</button>
      </div>
    `;
    
    // Add retry handler
    const retryButton = content.querySelector('.retry-button');
    retryButton.addEventListener('click', () => {
      document.dispatchEvent(new Event('hey-fantasy-activate'));
    });
    
    this.showResults();
  }
  
  // Helper Methods
  formatStatLabel(key) {
    return key
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  }
  
  async loadUserPreferences() {
    const prefs = await chrome.storage.sync.get(['uiPosition', 'theme']);
    
    if (prefs.uiPosition) {
      this.config.position = prefs.uiPosition;
      this.updatePosition();
    }
    
    if (prefs.theme) {
      this.overlayElement.dataset.theme = prefs.theme;
    }
  }
  
  updatePosition() {
    const positions = {
      'bottom-right': { bottom: '20px', right: '20px', left: 'auto', top: 'auto' },
      'bottom-left': { bottom: '20px', left: '20px', right: 'auto', top: 'auto' },
      'top-right': { top: '20px', right: '20px', bottom: 'auto', left: 'auto' },
      'top-left': { top: '20px', left: '20px', bottom: 'auto', right: 'auto' }
    };
    
    const pos = positions[this.config.position];
    Object.assign(this.overlayElement.style, pos);
  }
}

// Initialize UI when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.heyFantasyUI = new FantasyOverlayUI();
  });
} else {
  window.heyFantasyUI = new FantasyOverlayUI();
}