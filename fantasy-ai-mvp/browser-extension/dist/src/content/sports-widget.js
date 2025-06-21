/**
 * HEY FANTASY - Sports Widget
 * Contextual sports data integration for any website
 */

class SportsWidget {
  constructor() {
    this.widgetContainer = null;
    this.activeWidgets = new Map();
    this.observerActive = false;
    
    // Widget configuration
    this.config = {
      enableAutoDetection: true,
      maxWidgetsPerPage: 10,
      updateInterval: 30000, // 30 seconds
      sports: ['nfl', 'nba', 'mlb', 'nhl', 'soccer', 'fantasy']
    };
    
    // Player/Team patterns for detection
    this.patterns = {
      players: /\b(Patrick Mahomes|Lamar Jackson|Derrick Henry|Tyreek Hill|Travis Kelce|LeBron James|Giannis Antetokounmpo|Kevin Durant|Mike Trout|Aaron Judge|Connor McDavid|Lionel Messi|Cristiano Ronaldo)\b/gi,
      teams: /\b(Chiefs|Bills|Cowboys|Eagles|Patriots|Lakers|Celtics|Warriors|Yankees|Dodgers|Rangers|Maple Leafs|Barcelona|Real Madrid)\b/gi,
      stats: /\b(\d+\s*(yards|touchdowns|points|rebounds|assists|goals|RBI|home runs))\b/gi
    };
    
    this.init();
  }
  
  async init() {
    // Load user preferences
    const prefs = await this.getUserPreferences();
    if (!prefs.widgetsEnabled) return;
    
    // Start observing page for sports content
    if (this.config.enableAutoDetection) {
      this.startContentObserver();
    }
    
    // Listen for widget requests
    this.setupEventListeners();
    
    console.log('Hey Fantasy Sports Widget initialized!');
  }
  
  setupEventListeners() {
    // Listen for manual widget creation
    document.addEventListener('hey-fantasy-create-widget', (e) => {
      this.createWidget(e.detail);
    });
    
    // Listen for voice results that could trigger widgets
    document.addEventListener('hey-fantasy-results', (e) => {
      this.handleVoiceResults(e.detail);
    });
  }
  
  startContentObserver() {
    // Don't observe if already active
    if (this.observerActive) return;
    
    // Create mutation observer for dynamic content
    const observer = new MutationObserver((mutations) => {
      this.scanForSportsContent();
    });
    
    // Start observing
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });
    
    this.observerActive = true;
    
    // Initial scan
    this.scanForSportsContent();
  }
  
  scanForSportsContent() {
    // Avoid scanning too frequently
    if (this.scanTimeout) return;
    
    this.scanTimeout = setTimeout(() => {
      const textNodes = this.getTextNodes(document.body);
      const sportsContent = this.detectSportsContent(textNodes);
      
      // Create widgets for detected content
      sportsContent.forEach(content => {
        if (!this.hasNearbyWidget(content.element)) {
          this.createContextualWidget(content);
        }
      });
      
      this.scanTimeout = null;
    }, 1000);
  }
  
  getTextNodes(element) {
    const textNodes = [];
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          // Skip script and style tags
          const parent = node.parentElement;
          if (parent.tagName === 'SCRIPT' || parent.tagName === 'STYLE') {
            return NodeFilter.FILTER_REJECT;
          }
          
          // Only accept nodes with substantial text
          if (node.textContent.trim().length > 20) {
            return NodeFilter.FILTER_ACCEPT;
          }
          
          return NodeFilter.FILTER_REJECT;
        }
      }
    );
    
    let node;
    while (node = walker.nextNode()) {
      textNodes.push(node);
    }
    
    return textNodes;
  }
  
  detectSportsContent(textNodes) {
    const detectedContent = [];
    
    textNodes.forEach(node => {
      const text = node.textContent;
      
      // Check for player mentions
      const playerMatches = [...text.matchAll(this.patterns.players)];
      playerMatches.forEach(match => {
        detectedContent.push({
          type: 'player',
          name: match[0],
          element: node.parentElement,
          position: match.index
        });
      });
      
      // Check for team mentions
      const teamMatches = [...text.matchAll(this.patterns.teams)];
      teamMatches.forEach(match => {
        detectedContent.push({
          type: 'team',
          name: match[0],
          element: node.parentElement,
          position: match.index
        });
      });
      
      // Check for stats mentions
      const statsMatches = [...text.matchAll(this.patterns.stats)];
      if (statsMatches.length > 0 && (playerMatches.length > 0 || teamMatches.length > 0)) {
        detectedContent.push({
          type: 'stats',
          stats: statsMatches.map(m => m[0]),
          element: node.parentElement,
          position: statsMatches[0].index
        });
      }
    });
    
    return detectedContent;
  }
  
  hasNearbyWidget(element) {
    // Check if there's already a widget near this element
    const rect = element.getBoundingClientRect();
    
    for (const [id, widget] of this.activeWidgets) {
      const widgetRect = widget.element.getBoundingClientRect();
      
      // Check if widget is within 100px of the element
      if (Math.abs(rect.top - widgetRect.top) < 100 &&
          Math.abs(rect.left - widgetRect.left) < 100) {
        return true;
      }
    }
    
    return false;
  }
  
  createContextualWidget(content) {
    // Don't exceed max widgets
    if (this.activeWidgets.size >= this.config.maxWidgetsPerPage) {
      return;
    }
    
    const widgetId = `widget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create widget element
    const widget = document.createElement('div');
    widget.className = 'hey-fantasy-contextual-widget';
    widget.id = widgetId;
    widget.dataset.contentType = content.type;
    widget.dataset.contentName = content.name;
    
    // Position widget near content
    this.positionWidget(widget, content.element);
    
    // Load widget content
    this.loadWidgetContent(widget, content);
    
    // Add to active widgets
    this.activeWidgets.set(widgetId, {
      element: widget,
      content: content,
      lastUpdate: Date.now()
    });
    
    // Auto-update widget
    this.scheduleWidgetUpdate(widgetId);
  }
  
  positionWidget(widget, nearElement) {
    // Insert widget after the element
    nearElement.insertAdjacentElement('afterend', widget);
    
    // Add positioning styles
    widget.style.cssText = `
      margin: 8px 0;
      padding: 12px;
      background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
      border-left: 3px solid #667eea;
      border-radius: 8px;
      font-size: 14px;
      line-height: 1.5;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;
      cursor: pointer;
    `;
    
    // Add hover effect
    widget.addEventListener('mouseenter', () => {
      widget.style.transform = 'translateX(4px)';
      widget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
    });
    
    widget.addEventListener('mouseleave', () => {
      widget.style.transform = 'translateX(0)';
      widget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
    });
  }
  
  async loadWidgetContent(widget, content) {
    // Show loading state
    widget.innerHTML = `
      <div class="widget-loading">
        <span class="loading-spinner"></span>
        Loading ${content.type} data...
      </div>
    `;
    
    try {
      // Request data from background
      const response = await chrome.runtime.sendMessage({
        type: 'SPORTS_QUERY',
        query: `${content.type} ${content.name} quick stats`,
        context: {
          widgetRequest: true,
          contentType: content.type,
          contentName: content.name
        }
      });
      
      // Display widget content
      this.renderWidgetContent(widget, content, response);
      
    } catch (error) {
      widget.innerHTML = `
        <div class="widget-error">
          Unable to load ${content.type} data
        </div>
      `;
    }
  }
  
  renderWidgetContent(widget, content, data) {
    switch (content.type) {
      case 'player':
        widget.innerHTML = this.renderPlayerWidget(data);
        break;
        
      case 'team':
        widget.innerHTML = this.renderTeamWidget(data);
        break;
        
      case 'stats':
        widget.innerHTML = this.renderStatsWidget(data);
        break;
    }
    
    // Add click handler for more details
    widget.addEventListener('click', () => {
      document.dispatchEvent(new CustomEvent('hey-fantasy-activate', {
        detail: { prefilledQuery: `Tell me more about ${content.name}` }
      }));
    });
    
    // Track widget impression
    chrome.runtime.sendMessage({
      type: 'ANALYTICS_EVENT',
      event: 'widget_impression',
      data: {
        widgetType: content.type,
        contentName: content.name
      }
    });
  }
  
  renderPlayerWidget(data) {
    if (!data || !data.data) return '<div class="widget-error">No data available</div>';
    
    const player = data.data;
    return `
      <div class="player-widget">
        <div class="widget-header">
          <strong>${player.playerName}</strong>
          <span class="position">${player.position} - ${player.team}</span>
        </div>
        <div class="widget-stats">
          ${Object.entries(player.recentStats || {}).slice(0, 3).map(([key, value]) => `
            <div class="stat">
              <span class="label">${this.formatStatLabel(key)}</span>
              <span class="value">${value}</span>
            </div>
          `).join('')}
        </div>
        ${player.fantasyPoints ? `
          <div class="fantasy-points">
            <span>Fantasy:</span> <strong>${player.fantasyPoints} pts</strong>
          </div>
        ` : ''}
        <div class="widget-footer">
          Click for full stats →
        </div>
      </div>
    `;
  }
  
  renderTeamWidget(data) {
    if (!data || !data.data) return '<div class="widget-error">No data available</div>';
    
    const team = data.data;
    return `
      <div class="team-widget">
        <div class="widget-header">
          <strong>${team.teamName}</strong>
          <span class="record">${team.wins}-${team.losses}</span>
        </div>
        <div class="widget-content">
          <div class="recent-game">
            Last: ${team.lastGame ? `${team.lastGame.result} vs ${team.lastGame.opponent}` : 'N/A'}
          </div>
          <div class="next-game">
            Next: ${team.nextGame ? `vs ${team.nextGame.opponent} (${team.nextGame.date})` : 'N/A'}
          </div>
        </div>
        <div class="widget-footer">
          Click for team details →
        </div>
      </div>
    `;
  }
  
  renderStatsWidget(data) {
    if (!data || !data.data) return '<div class="widget-error">No data available</div>';
    
    return `
      <div class="stats-widget">
        <div class="widget-header">
          <strong>Quick Stats</strong>
        </div>
        <div class="widget-content">
          ${data.data.summary || 'Stats data available'}
        </div>
        <div class="widget-footer">
          Click for detailed analysis →
        </div>
      </div>
    `;
  }
  
  scheduleWidgetUpdate(widgetId) {
    // Update widget periodically
    setTimeout(() => {
      const widgetInfo = this.activeWidgets.get(widgetId);
      if (widgetInfo) {
        this.loadWidgetContent(widgetInfo.element, widgetInfo.content);
        this.scheduleWidgetUpdate(widgetId);
      }
    }, this.config.updateInterval);
  }
  
  handleVoiceResults(detail) {
    // Create a floating widget for voice results if appropriate
    if (detail.response && detail.response.type && detail.response.data) {
      const floatingWidget = this.createFloatingWidget(detail.response);
      document.body.appendChild(floatingWidget);
      
      // Auto-remove after 10 seconds
      setTimeout(() => {
        floatingWidget.remove();
      }, 10000);
    }
  }
  
  createFloatingWidget(response) {
    const widget = document.createElement('div');
    widget.className = 'hey-fantasy-floating-widget';
    widget.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      width: 300px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
      padding: 16px;
      z-index: 10000;
      animation: slideIn 0.3s ease;
    `;
    
    // Render content based on response type
    widget.innerHTML = this.renderFloatingContent(response);
    
    // Add close button
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    closeBtn.style.cssText = `
      position: absolute;
      top: 8px;
      right: 8px;
      background: none;
      border: none;
      font-size: 20px;
      cursor: pointer;
      color: #718096;
    `;
    closeBtn.onclick = () => widget.remove();
    widget.appendChild(closeBtn);
    
    return widget;
  }
  
  renderFloatingContent(response) {
    // Reuse widget renderers
    switch (response.type) {
      case 'player_stats':
        return this.renderPlayerWidget(response);
      case 'team_info':
        return this.renderTeamWidget(response);
      default:
        return `<div>${response.data.summary || 'Info available'}</div>`;
    }
  }
  
  formatStatLabel(key) {
    return key
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  }
  
  async getUserPreferences() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['widgetsEnabled'], (result) => {
        resolve({
          widgetsEnabled: result.widgetsEnabled !== false
        });
      });
    });
  }
}

// Initialize sports widget
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.heyFantasySportsWidget = new SportsWidget();
  });
} else {
  window.heyFantasySportsWidget = new SportsWidget();
}

// Add widget styles
const widgetStyles = document.createElement('style');
widgetStyles.textContent = `
  .hey-fantasy-contextual-widget {
    opacity: 0;
    animation: fadeIn 0.3s ease forwards;
  }
  
  .widget-loading {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #718096;
  }
  
  .loading-spinner {
    display: inline-block;
    width: 14px;
    height: 14px;
    border: 2px solid #e2e8f0;
    border-radius: 50%;
    border-top-color: #667eea;
    animation: spin 0.8s linear infinite;
  }
  
  .widget-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }
  
  .widget-header strong {
    color: #2d3748;
  }
  
  .position, .record {
    font-size: 12px;
    color: #718096;
  }
  
  .widget-stats {
    display: flex;
    gap: 16px;
    margin-bottom: 8px;
  }
  
  .stat {
    text-align: center;
  }
  
  .stat .label {
    display: block;
    font-size: 11px;
    color: #a0aec0;
    text-transform: uppercase;
  }
  
  .stat .value {
    display: block;
    font-size: 16px;
    font-weight: 600;
    color: #2d3748;
  }
  
  .fantasy-points {
    background: #667eea;
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    display: inline-block;
    margin-bottom: 8px;
  }
  
  .widget-footer {
    font-size: 12px;
    color: #667eea;
    text-align: right;
    margin-top: 8px;
  }
  
  .widget-error {
    color: #e53e3e;
    text-align: center;
    padding: 8px;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-4px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  @keyframes slideIn {
    from { opacity: 0; transform: translateX(20px); }
    to { opacity: 1; transform: translateX(0); }
  }
`;
document.head.appendChild(widgetStyles);