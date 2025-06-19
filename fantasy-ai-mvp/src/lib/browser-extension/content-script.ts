/**
 * HEY FANTASY CONTENT SCRIPT
 * Injected into fantasy sports websites to provide AI-powered insights
 * Connects voice commands to our revolutionary data collection systems
 */

import { HeyFantasyExtension, defaultHeyFantasyConfig } from './hey-fantasy-extension';

class FantasyContentScript {
  private extension: HeyFantasyExtension;
  private overlayContainer: HTMLElement | null = null;
  private voiceIndicator: HTMLElement | null = null;
  private currentSite: string = '';
  private isInitialized: boolean = false;

  constructor() {
    this.currentSite = this.detectFantasySite();
    this.extension = new HeyFantasyExtension(defaultHeyFantasyConfig);
    this.init();
  }

  private detectFantasySite(): string {
    const hostname = window.location.hostname.toLowerCase();
    
    if (hostname.includes('draftkings')) return 'draftkings';
    if (hostname.includes('fanduel')) return 'fanduel';
    if (hostname.includes('espn')) return 'espn';
    if (hostname.includes('yahoo')) return 'yahoo';
    if (hostname.includes('nfl.com')) return 'nfl';
    if (hostname.includes('sleeper')) return 'sleeper';
    if (hostname.includes('superdraft')) return 'superdraft';
    
    return 'unknown';
  }

  private async init(): Promise<void> {
    if (this.isInitialized || this.currentSite === 'unknown') return;

    try {
      // Wait for page to be ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.setupExtension());
      } else {
        this.setupExtension();
      }
    } catch (error) {
      console.error('Failed to initialize Hey Fantasy extension:', error);
    }
  }

  private setupExtension(): void {
    this.createOverlayContainer();
    this.createVoiceIndicator();
    this.setupEventListeners();
    this.injectSiteSpecificEnhancements();
    this.isInitialized = true;

    console.log(`Hey Fantasy extension initialized on ${this.currentSite}`);
  }

  private createOverlayContainer(): void {
    // Create main overlay container
    this.overlayContainer = document.createElement('div');
    this.overlayContainer.id = 'hey-fantasy-overlay';
    this.overlayContainer.className = 'hey-fantasy-overlay hidden';
    
    // Styling for overlay
    this.overlayContainer.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      width: 400px;
      height: 600px;
      z-index: 10000;
      background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
      border-radius: 16px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      overflow: hidden;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    // Create header
    const header = document.createElement('div');
    header.className = 'fantasy-header';
    header.style.cssText = `
      background: rgba(255, 255, 255, 0.1);
      padding: 16px 20px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      align-items: center;
      justify-content: space-between;
    `;

    const title = document.createElement('h3');
    title.textContent = 'Hey Fantasy AI';
    title.style.cssText = `
      margin: 0;
      color: white;
      font-size: 16px;
      font-weight: 600;
    `;

    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '×';
    closeBtn.style.cssText = `
      background: none;
      border: none;
      color: white;
      font-size: 24px;
      cursor: pointer;
      opacity: 0.7;
      transition: opacity 0.2s;
    `;
    closeBtn.addEventListener('click', () => this.hideOverlay());

    header.appendChild(title);
    header.appendChild(closeBtn);

    // Create content area
    const content = document.createElement('div');
    content.id = 'fantasy-content';
    content.className = 'fantasy-content';
    content.style.cssText = `
      padding: 20px;
      height: calc(100% - 70px);
      overflow-y: auto;
      color: white;
    `;

    this.overlayContainer.appendChild(header);
    this.overlayContainer.appendChild(content);
    document.body.appendChild(this.overlayContainer);
  }

  private createVoiceIndicator(): void {
    this.voiceIndicator = document.createElement('div');
    this.voiceIndicator.id = 'hey-fantasy-voice-indicator';
    this.voiceIndicator.className = 'voice-indicator';
    
    this.voiceIndicator.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 60px;
      height: 60px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 9999;
      box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      border: 2px solid rgba(255, 255, 255, 0.2);
    `;

    // Microphone icon
    const micIcon = document.createElement('div');
    micIcon.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
        <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
        <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
      </svg>
    `;
    
    this.voiceIndicator.appendChild(micIcon);
    this.voiceIndicator.addEventListener('click', () => this.toggleVoiceActivation());
    
    document.body.appendChild(this.voiceIndicator);
  }

  private setupEventListeners(): void {
    // Extension event listeners
    this.extension.on('voiceActivated', () => {
      this.updateVoiceIndicator(true);
    });

    this.extension.on('commandReceived', (command) => {
      this.showCommandFeedback(command.command);
    });

    this.extension.on('commandCompleted', ({ response }) => {
      if (response.visualData) {
        this.updateOverlayContent(response.visualData);
        this.showOverlay();
      }
    });

    this.extension.on('commandError', ({ error }) => {
      this.showErrorMessage(error);
    });

    this.extension.on('overlayUpdate', (content) => {
      this.updateOverlayContent(content);
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (event) => {
      if (event.ctrlKey && event.shiftKey) {
        switch (event.code) {
          case 'KeyF':
            event.preventDefault();
            this.toggleVoiceActivation();
            break;
          case 'KeyO':
            event.preventDefault();
            this.toggleOverlay();
            break;
          case 'KeyL':
            event.preventDefault();
            this.quickLineupOptimization();
            break;
        }
      }
    });

    // Page navigation handling
    let currentUrl = window.location.href;
    setInterval(() => {
      if (window.location.href !== currentUrl) {
        currentUrl = window.location.href;
        this.handlePageChange();
      }
    }, 1000);
  }

  private injectSiteSpecificEnhancements(): void {
    switch (this.currentSite) {
      case 'draftkings':
        this.enhanceDraftKings();
        break;
      case 'fanduel':
        this.enhanceFanDuel();
        break;
      case 'espn':
        this.enhanceESPN();
        break;
      case 'yahoo':
        this.enhanceYahoo();
        break;
      case 'sleeper':
        this.enhanceSleeper();
        break;
      default:
        this.enhanceGeneric();
    }
  }

  private enhanceDraftKings(): void {
    // Add player insight buttons to DraftKings player cards
    const addInsightButtons = () => {
      const playerCards = document.querySelectorAll('[data-testid="player-card"]');
      playerCards.forEach((card) => {
        if (!card.querySelector('.hey-fantasy-insight-btn')) {
          const playerName = this.extractPlayerName(card);
          if (playerName) {
            this.addPlayerInsightButton(card as HTMLElement, playerName);
          }
        }
      });
    };

    // Run initially and on content changes
    addInsightButtons();
    const observer = new MutationObserver(addInsightButtons);
    observer.observe(document.body, { childList: true, subtree: true });
  }

  private enhanceFanDuel(): void {
    // Add insight buttons to FanDuel roster grids
    const addInsightButtons = () => {
      const playerRows = document.querySelectorAll('.player-row, .roster-slot');
      playerRows.forEach((row) => {
        if (!row.querySelector('.hey-fantasy-insight-btn')) {
          const playerName = this.extractPlayerName(row);
          if (playerName) {
            this.addPlayerInsightButton(row as HTMLElement, playerName);
          }
        }
      });
    };

    addInsightButtons();
    const observer = new MutationObserver(addInsightButtons);
    observer.observe(document.body, { childList: true, subtree: true });
  }

  private enhanceESPN(): void {
    // Enhance ESPN fantasy pages
    const addInsightButtons = () => {
      const playerCells = document.querySelectorAll('.player-column, .playertablePlayerName');
      playerCells.forEach((cell) => {
        if (!cell.querySelector('.hey-fantasy-insight-btn')) {
          const playerName = this.extractPlayerName(cell);
          if (playerName) {
            this.addPlayerInsightButton(cell as HTMLElement, playerName);
          }
        }
      });
    };

    addInsightButtons();
    const observer = new MutationObserver(addInsightButtons);
    observer.observe(document.body, { childList: true, subtree: true });
  }

  private enhanceYahoo(): void {
    // Enhance Yahoo Fantasy pages
    const addInsightButtons = () => {
      const playerLinks = document.querySelectorAll('.player-name, .player-link');
      playerLinks.forEach((link) => {
        if (!link.querySelector('.hey-fantasy-insight-btn')) {
          const playerName = this.extractPlayerName(link);
          if (playerName) {
            this.addPlayerInsightButton(link as HTMLElement, playerName);
          }
        }
      });
    };

    addInsightButtons();
    const observer = new MutationObserver(addInsightButtons);
    observer.observe(document.body, { childList: true, subtree: true });
  }

  private enhanceSleeper(): void {
    // Enhance Sleeper app pages
    const addInsightButtons = () => {
      const playerCards = document.querySelectorAll('.player-card, .player-info');
      playerCards.forEach((card) => {
        if (!card.querySelector('.hey-fantasy-insight-btn')) {
          const playerName = this.extractPlayerName(card);
          if (playerName) {
            this.addPlayerInsightButton(card as HTMLElement, playerName);
          }
        }
      });
    };

    addInsightButtons();
    const observer = new MutationObserver(addInsightButtons);
    observer.observe(document.body, { childList: true, subtree: true });
  }

  private enhanceGeneric(): void {
    // Generic enhancements for unknown sites
    console.log('Generic fantasy site enhancements applied');
  }

  private extractPlayerName(element: Element): string | null {
    // Try various selectors to extract player names
    const selectors = [
      '.player-name',
      '.player-link',
      '[data-player-name]',
      '.name',
      '.playertablePlayerName a',
      '.player-column a'
    ];

    for (const selector of selectors) {
      const nameElement = element.querySelector(selector);
      if (nameElement) {
        return nameElement.textContent?.trim() || null;
      }
    }

    // Try data attributes
    const dataName = element.getAttribute('data-player-name');
    if (dataName) return dataName;

    // Try extracting from text content
    const text = element.textContent?.trim();
    if (text && text.length > 3 && text.length < 50) {
      // Basic validation that it looks like a player name
      if (/^[A-Za-z\s.-]+$/.test(text)) {
        return text;
      }
    }

    return null;
  }

  private addPlayerInsightButton(container: HTMLElement, playerName: string): void {
    const button = document.createElement('button');
    button.className = 'hey-fantasy-insight-btn';
    button.innerHTML = '🧠';
    button.title = `Get AI insights for ${playerName}`;
    
    button.style.cssText = `
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: none;
      border-radius: 4px;
      color: white;
      cursor: pointer;
      font-size: 12px;
      margin-left: 8px;
      padding: 4px 8px;
      transition: all 0.2s;
      font-weight: 600;
    `;

    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.getPlayerInsights(playerName);
    });

    container.appendChild(button);
  }

  private async getPlayerInsights(playerName: string): Promise<void> {
    // Simulate voice command for player inquiry
    try {
      const command = {
        commandId: `manual_${Date.now()}`,
        command: `tell me about ${playerName}`,
        category: 'PLAYER_INQUIRY' as const,
        parameters: [{
          paramName: 'entity',
          paramType: 'PLAYER_NAME' as const,
          value: playerName,
          confidence: 100
        }],
        confidence: 100,
        processingTime: 0,
        responseType: 'BOTH' as const,
        requiredData: ['playerStats', 'fantasyProjections', 'injuryStatus']
      };

      // Process the command through our extension
      this.extension.emit('commandReceived', command);
      
    } catch (error) {
      console.error('Failed to get player insights:', error);
      this.showErrorMessage('Failed to fetch player insights');
    }
  }

  private toggleVoiceActivation(): void {
    if (this.extension.getExtensionStats().voiceActive) {
      this.extension.deactivateVoice();
      this.updateVoiceIndicator(false);
    } else {
      this.extension.activateVoice();
      this.updateVoiceIndicator(true);
    }
  }

  private updateVoiceIndicator(isActive: boolean): void {
    if (!this.voiceIndicator) return;

    if (isActive) {
      this.voiceIndicator.style.background = 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)';
      this.voiceIndicator.style.animation = 'pulse 2s infinite';
      this.voiceIndicator.title = 'Voice activated - Say "Hey Fantasy"';
    } else {
      this.voiceIndicator.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
      this.voiceIndicator.style.animation = 'none';
      this.voiceIndicator.title = 'Click to activate voice commands';
    }
  }

  private toggleOverlay(): void {
    if (this.overlayContainer?.classList.contains('hidden')) {
      this.showOverlay();
    } else {
      this.hideOverlay();
    }
  }

  private showOverlay(): void {
    if (this.overlayContainer) {
      this.overlayContainer.classList.remove('hidden');
      this.overlayContainer.style.transform = 'translateX(0)';
      this.overlayContainer.style.opacity = '1';
    }
  }

  private hideOverlay(): void {
    if (this.overlayContainer) {
      this.overlayContainer.style.transform = 'translateX(100%)';
      this.overlayContainer.style.opacity = '0';
      setTimeout(() => {
        this.overlayContainer?.classList.add('hidden');
      }, 300);
    }
  }

  private updateOverlayContent(content: any): void {
    const contentDiv = document.getElementById('fantasy-content');
    if (!contentDiv) return;

    // Clear existing content
    contentDiv.innerHTML = '';

    // Generate HTML based on content type
    if (content.playerId) {
      // Player insight widget
      contentDiv.appendChild(this.createPlayerWidget(content));
    } else if (content.optimizedLineup) {
      // Lineup optimizer widget
      contentDiv.appendChild(this.createLineupWidget(content));
    } else if (content.tradeScenarios) {
      // Trade analyzer widget
      contentDiv.appendChild(this.createTradeWidget(content));
    } else {
      // Generic content
      contentDiv.innerHTML = '<p>Loading insights...</p>';
    }
  }

  private createPlayerWidget(player: any): HTMLElement {
    const widget = document.createElement('div');
    widget.className = 'player-widget';
    
    widget.innerHTML = `
      <div class="player-header">
        <h4>${player.playerName}</h4>
        <span class="position">${player.quickStats.position} - ${player.quickStats.team}</span>
      </div>
      
      <div class="fantasy-projection">
        <h5>Fantasy Projection</h5>
        <div class="projection-row">
          <span>Projected Points:</span>
          <span class="highlight">${player.fantasyProjection.projectedPoints}</span>
        </div>
        <div class="projection-row">
          <span>Floor:</span>
          <span>${player.fantasyProjection.floor}</span>
        </div>
        <div class="projection-row">
          <span>Ceiling:</span>
          <span>${player.fantasyProjection.ceiling}</span>
        </div>
        <div class="confidence">
          Confidence: ${player.fantasyProjection.confidenceLevel}%
        </div>
      </div>
      
      <div class="injury-status ${player.injuryStatus.status.toLowerCase()}">
        <h5>Health Status</h5>
        <span class="status">${player.injuryStatus.status}</span>
        ${player.injuryStatus.injuryType ? `<span class="injury-type">${player.injuryStatus.injuryType}</span>` : ''}
      </div>
      
      <div class="recommendation">
        <h5>Recommendation</h5>
        <span class="action ${player.recommendation.action.toLowerCase()}">${player.recommendation.action}</span>
        <p class="reasoning">${player.recommendation.reasoning}</p>
      </div>
    `;

    // Add styling
    widget.style.cssText = `
      background: rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 16px;
    `;

    return widget;
  }

  private createLineupWidget(lineup: any): HTMLElement {
    const widget = document.createElement('div');
    widget.className = 'lineup-widget';
    
    widget.innerHTML = `
      <div class="lineup-header">
        <h4>Optimized Lineup</h4>
        <span class="projected-points">${lineup.projectedPoints} pts</span>
      </div>
      
      <div class="lineup-positions">
        ${lineup.optimizedLineup.lineup.map((pos: any) => `
          <div class="lineup-position">
            <span class="position">${pos.position}</span>
            <span class="player">${pos.playerName}</span>
            <span class="projection">${pos.projection} pts</span>
          </div>
        `).join('')}
      </div>
      
      <div class="lineup-stats">
        <div class="stat">
          <span>Risk Level:</span>
          <span class="${lineup.riskLevel.toLowerCase()}">${lineup.riskLevel}</span>
        </div>
        <div class="stat">
          <span>Confidence:</span>
          <span>${lineup.confidence}%</span>
        </div>
      </div>
    `;

    widget.style.cssText = `
      background: rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 16px;
    `;

    return widget;
  }

  private createTradeWidget(trades: any): HTMLElement {
    const widget = document.createElement('div');
    widget.className = 'trade-widget';
    
    widget.innerHTML = `
      <div class="trade-header">
        <h4>Trade Analysis</h4>
      </div>
      
      <div class="trade-scenarios">
        ${trades.tradeScenarios.slice(0, 3).map((trade: any) => `
          <div class="trade-scenario">
            <div class="fairness-score ${trade.fairnessScore > 10 ? 'positive' : trade.fairnessScore < -10 ? 'negative' : 'neutral'}">
              Fairness: ${trade.fairnessScore > 0 ? '+' : ''}${trade.fairnessScore}
            </div>
            <div class="trade-players">
              <div class="your-players">
                <strong>You give:</strong> ${trade.myPlayers.join(', ')}
              </div>
              <div class="their-players">
                <strong>You get:</strong> ${trade.theirPlayers.join(', ')}
              </div>
            </div>
            <div class="projected-impact">
              Impact: ${trade.projectedImpact > 0 ? '+' : ''}${trade.projectedImpact} pts
            </div>
          </div>
        `).join('')}
      </div>
    `;

    widget.style.cssText = `
      background: rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 16px;
    `;

    return widget;
  }

  private showCommandFeedback(command: string): void {
    // Show temporary feedback that command was received
    const feedback = document.createElement('div');
    feedback.className = 'command-feedback';
    feedback.textContent = `Processing: "${command}"`;
    
    feedback.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      z-index: 10001;
      font-weight: 500;
    `;

    document.body.appendChild(feedback);
    
    setTimeout(() => {
      document.body.removeChild(feedback);
    }, 2000);
  }

  private showErrorMessage(error: string): void {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = error;
    
    errorDiv.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #ff4757;
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      z-index: 10001;
      font-weight: 500;
    `;

    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
      document.body.removeChild(errorDiv);
    }, 4000);
  }

  private async quickLineupOptimization(): Promise<void> {
    // Quick lineup optimization via keyboard shortcut
    try {
      const command = {
        commandId: `quick_lineup_${Date.now()}`,
        command: 'optimize my lineup',
        category: 'LINEUP_OPTIMIZATION' as const,
        parameters: [],
        confidence: 100,
        processingTime: 0,
        responseType: 'BOTH' as const,
        requiredData: ['playerProjections', 'salaries', 'ownership']
      };

      this.extension.emit('commandReceived', command);
      
    } catch (error) {
      console.error('Quick lineup optimization failed:', error);
      this.showErrorMessage('Failed to optimize lineup');
    }
  }

  private handlePageChange(): void {
    // Re-inject enhancements when page changes (SPA navigation)
    setTimeout(() => {
      this.injectSiteSpecificEnhancements();
    }, 1000);
  }
}

// CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes pulse {
    0% { transform: scale(1); box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4); }
    50% { transform: scale(1.1); box-shadow: 0 12px 35px rgba(102, 126, 234, 0.6); }
    100% { transform: scale(1); box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4); }
  }
  
  .hey-fantasy-overlay.hidden {
    transform: translateX(100%) !important;
    opacity: 0 !important;
  }
  
  .player-widget .player-header h4 {
    margin: 0 0 4px 0;
    font-size: 18px;
    font-weight: 600;
  }
  
  .player-widget .position {
    color: rgba(255, 255, 255, 0.7);
    font-size: 14px;
  }
  
  .player-widget .projection-row {
    display: flex;
    justify-content: space-between;
    margin: 8px 0;
  }
  
  .player-widget .highlight {
    color: #4ade80;
    font-weight: 600;
  }
  
  .player-widget .injury-status.healthy {
    background: rgba(74, 222, 128, 0.2);
    border-left: 3px solid #4ade80;
    padding: 8px 12px;
    border-radius: 4px;
    margin: 12px 0;
  }
  
  .player-widget .injury-status.questionable {
    background: rgba(251, 191, 36, 0.2);
    border-left: 3px solid #fbbf24;
    padding: 8px 12px;
    border-radius: 4px;
    margin: 12px 0;
  }
  
  .player-widget .injury-status.out {
    background: rgba(239, 68, 68, 0.2);
    border-left: 3px solid #ef4444;
    padding: 8px 12px;
    border-radius: 4px;
    margin: 12px 0;
  }
  
  .player-widget .recommendation .action.start {
    color: #4ade80;
    font-weight: 600;
  }
  
  .player-widget .recommendation .action.sit {
    color: #ef4444;
    font-weight: 600;
  }
  
  .lineup-widget .lineup-position {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .lineup-widget .lineup-position:last-child {
    border-bottom: none;
  }
  
  .trade-widget .trade-scenario {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 6px;
    padding: 12px;
    margin: 8px 0;
  }
  
  .trade-widget .fairness-score.positive {
    color: #4ade80;
  }
  
  .trade-widget .fairness-score.negative {
    color: #ef4444;
  }
  
  .trade-widget .fairness-score.neutral {
    color: #fbbf24;
  }
`;
document.head.appendChild(style);

// Initialize the content script
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new FantasyContentScript();
  });
} else {
  new FantasyContentScript();
}

// Export for potential external access
(window as any).FantasyContentScript = FantasyContentScript;