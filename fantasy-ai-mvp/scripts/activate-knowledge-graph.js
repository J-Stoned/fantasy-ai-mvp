#!/usr/bin/env node

/**
 * KNOWLEDGE GRAPH MCP ACTIVATION - DATA RELATIONSHIP MAPPING
 * Phase 3: Building semantic relationships between players, teams, leagues, and data sources
 */

const fs = require('fs');
const path = require('path');

class KnowledgeGraphOrchestrator {
  constructor() {
    this.entities = new Map();
    this.relationships = [];
    this.semanticConnections = [];
    this.startTime = new Date();
    this.processed = 0;
    this.dataDir = path.join(process.cwd(), 'data');
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '🧠❌' : type === 'success' ? '🧠✅' : '🧠📝';
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async activate() {
    this.log('KNOWLEDGE GRAPH MCP ACTIVATION STARTED', 'success');
    this.log('Target: Creating semantic relationships from collected sports data');
    this.log('Capabilities: Entity Recognition, Relationship Mapping, Semantic Search, Graph Queries');
    
    // Process collected data files
    await this.discoverDataSources();
    await this.extractEntities();
    await this.buildRelationships();
    await this.createSemanticConnections();
    await this.generateKnowledgeGraph();
    
    const report = await this.generateReport();
    return report;
  }

  async discoverDataSources() {
    this.log('🔍 Discovering collected data sources...');
    
    const dataSources = [];
    
    // Scan for Firecrawl data
    const firecrawlDir = path.join(this.dataDir, 'raw/espn');
    if (fs.existsSync(firecrawlDir)) {
      const files = fs.readdirSync(firecrawlDir).filter(f => f.endsWith('.json'));
      dataSources.push(...files.map(f => ({ type: 'firecrawl', source: 'ESPN', file: f })));
    }
    
    // Scan for Puppeteer data
    const puppeteerDir = path.join(this.dataDir, 'raw/puppeteer');
    if (fs.existsSync(puppeteerDir)) {
      const files = fs.readdirSync(puppeteerDir).filter(f => f.endsWith('.json'));
      dataSources.push(...files.map(f => ({ type: 'puppeteer', source: 'Dynamic', file: f })));
    }
    
    // Scan for Global data
    const globalDir = path.join(this.dataDir, 'raw/global');
    if (fs.existsSync(globalDir)) {
      const files = fs.readdirSync(globalDir).filter(f => f.endsWith('.json'));
      dataSources.push(...files.map(f => ({ type: 'global', source: 'International', file: f })));
    }
    
    this.log(`📊 Found ${dataSources.length} data source files to process`, 'success');
    this.dataSources = dataSources;
  }

  async extractEntities() {
    this.log('🏷️ Extracting entities from all data sources...');
    
    for (const source of this.dataSources) {
      try {
        const filePath = path.join(this.dataDir, 'raw', source.type === 'firecrawl' ? 'espn' : 
                                  source.type === 'puppeteer' ? 'puppeteer' : 'global', source.file);
        
        if (!fs.existsSync(filePath)) continue;
        
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        await this.processDataForEntities(data, source);
        
      } catch (error) {
        this.log(`❌ Failed to process ${source.file}: ${error.message}`, 'error');
      }
    }
    
    this.log(`🏷️ Extracted ${this.entities.size} unique entities`, 'success');
  }

  async processDataForEntities(data, source) {
    if (!data.data || !Array.isArray(data.data)) return;
    
    for (const record of data.data) {
      // Extract player entities
      if (record.name || record.playerName || record.driverName) {
        const playerName = record.name || record.playerName || record.driverName;
        const playerId = record.id || record.playerId || record.driverId || this.generateId(playerName);
        
        this.addEntity('PLAYER', playerId, {
          name: playerName,
          team: record.team,
          position: record.position,
          sport: data.metadata?.sport || 'unknown',
          source: source.source,
          stats: record.stats || record.dynamicData,
          lastUpdated: record.lastUpdated || record.extractedAt || new Date().toISOString()
        });
      }
      
      // Extract team entities
      if (record.team) {
        this.addEntity('TEAM', record.team, {
          name: record.team,
          sport: data.metadata?.sport || 'unknown',
          region: data.metadata?.region || 'US',
          source: source.source
        });
      }
      
      // Extract league entities
      if (record.league) {
        this.addEntity('LEAGUE', record.league, {
          name: record.league,
          sport: data.metadata?.sport || 'unknown',
          region: data.metadata?.region || 'US'
        });
      }
    }
    
    this.processed += data.data.length;
  }

  addEntity(type, id, properties) {
    const entityId = `${type}:${id}`;
    
    if (!this.entities.has(entityId)) {
      this.entities.set(entityId, {
        id: entityId,
        type: type,
        properties: { ...properties },
        connections: 0
      });
    } else {
      // Merge properties
      const existing = this.entities.get(entityId);
      existing.properties = { ...existing.properties, ...properties };
    }
  }

  async buildRelationships() {
    this.log('🔗 Building relationships between entities...');
    
    const entities = Array.from(this.entities.values());
    let relationshipCount = 0;
    
    // Player-Team relationships
    for (const entity of entities) {
      if (entity.type === 'PLAYER' && entity.properties.team) {
        const teamId = `TEAM:${entity.properties.team}`;
        if (this.entities.has(teamId)) {
          this.addRelationship(entity.id, teamId, 'PLAYS_FOR', {
            sport: entity.properties.sport,
            position: entity.properties.position,
            since: new Date().toISOString()
          });
          relationshipCount++;
        }
      }
    }
    
    // Team-League relationships
    for (const entity of entities) {
      if (entity.type === 'TEAM' && entity.properties.sport) {
        const leagueMap = {
          'nfl': 'LEAGUE:NFL',
          'nba': 'LEAGUE:NBA', 
          'mlb': 'LEAGUE:MLB',
          'nhl': 'LEAGUE:NHL',
          'soccer': 'LEAGUE:Premier League',
          'f1': 'LEAGUE:Formula 1'
        };
        
        const leagueId = leagueMap[entity.properties.sport];
        if (leagueId) {
          if (!this.entities.has(leagueId)) {
            this.addEntity('LEAGUE', leagueId.split(':')[1], {
              name: leagueId.split(':')[1],
              sport: entity.properties.sport,
              region: entity.properties.region
            });
          }
          
          this.addRelationship(entity.id, leagueId, 'COMPETES_IN', {
            sport: entity.properties.sport,
            region: entity.properties.region
          });
          relationshipCount++;
        }
      }
    }
    
    // Similar player relationships (same position, team, etc.)
    for (const player1 of entities.filter(e => e.type === 'PLAYER')) {
      for (const player2 of entities.filter(e => e.type === 'PLAYER')) {
        if (player1.id !== player2.id && 
            player1.properties.position === player2.properties.position &&
            player1.properties.sport === player2.properties.sport) {
          
          this.addRelationship(player1.id, player2.id, 'SIMILAR_POSITION', {
            position: player1.properties.position,
            sport: player1.properties.sport,
            strength: 0.7
          });
          relationshipCount++;
        }
      }
    }
    
    this.log(`🔗 Built ${relationshipCount} relationships`, 'success');
  }

  addRelationship(fromId, toId, type, properties = {}) {
    this.relationships.push({
      from: fromId,
      to: toId,
      type: type,
      properties: properties,
      created: new Date().toISOString()
    });
    
    // Update connection counts
    if (this.entities.has(fromId)) {
      this.entities.get(fromId).connections++;
    }
    if (this.entities.has(toId)) {
      this.entities.get(toId).connections++;
    }
  }

  async createSemanticConnections() {
    this.log('🧠 Creating semantic connections and insights...');
    
    const entities = Array.from(this.entities.values());
    
    // Performance-based connections
    const players = entities.filter(e => e.type === 'PLAYER');
    for (const player of players) {
      if (player.properties.stats) {
        // High-performance players
        const fantasyPoints = player.properties.stats.fantasyPoints || 
                            player.properties.fantasyPoints || 0;
        
        if (fantasyPoints > 200) {
          this.semanticConnections.push({
            entityId: player.id,
            concept: 'HIGH_PERFORMER',
            strength: 0.9,
            evidence: `Fantasy points: ${fantasyPoints}`,
            context: player.properties.sport
          });
        }
        
        // Injury-prone analysis
        if (player.properties.stats.injuryStatus && 
            player.properties.stats.injuryStatus !== 'Healthy') {
          this.semanticConnections.push({
            entityId: player.id,
            concept: 'INJURY_RISK',
            strength: 0.6,
            evidence: player.properties.stats.injuryStatus,
            context: 'health_monitoring'
          });
        }
      }
    }
    
    // Team strength analysis
    const teams = entities.filter(e => e.type === 'TEAM');
    for (const team of teams) {
      const teamPlayers = players.filter(p => p.properties.team === team.properties.name);
      const avgFantasyPoints = teamPlayers.reduce((sum, p) => {
        return sum + (p.properties.fantasyPoints || p.properties.stats?.fantasyPoints || 0);
      }, 0) / Math.max(teamPlayers.length, 1);
      
      if (avgFantasyPoints > 150) {
        this.semanticConnections.push({
          entityId: team.id,
          concept: 'STRONG_TEAM',
          strength: 0.8,
          evidence: `Average fantasy points: ${avgFantasyPoints.toFixed(1)}`,
          context: team.properties.sport
        });
      }
    }
    
    this.log(`🧠 Created ${this.semanticConnections.length} semantic connections`, 'success');
  }

  async generateKnowledgeGraph() {
    this.log('📊 Generating comprehensive knowledge graph...');
    
    const knowledgeGraph = {
      metadata: {
        generated: new Date().toISOString(),
        version: '1.0',
        mcpServer: 'Knowledge Graph',
        totalEntities: this.entities.size,
        totalRelationships: this.relationships.length,
        semanticConnections: this.semanticConnections.length,
        dataProcessed: this.processed
      },
      entities: Array.from(this.entities.values()),
      relationships: this.relationships,
      semanticConnections: this.semanticConnections,
      statistics: this.generateStatistics(),
      queryExamples: this.generateQueryExamples()
    };
    
    // Save the complete knowledge graph
    await this.saveData('knowledge-graph/complete-graph.json', knowledgeGraph);
    
    // Save entity indices for fast lookups
    await this.saveEntityIndices();
    
    // Save query interface
    await this.generateQueryInterface();
    
    this.log('📊 Knowledge graph generation complete', 'success');
    return knowledgeGraph;
  }

  generateStatistics() {
    const entities = Array.from(this.entities.values());
    
    return {
      entityBreakdown: {
        PLAYER: entities.filter(e => e.type === 'PLAYER').length,
        TEAM: entities.filter(e => e.type === 'TEAM').length,
        LEAGUE: entities.filter(e => e.type === 'LEAGUE').length
      },
      sportBreakdown: {
        nfl: entities.filter(e => e.properties.sport === 'nfl').length,
        nba: entities.filter(e => e.properties.sport === 'nba').length,
        mlb: entities.filter(e => e.properties.sport === 'mlb').length,
        nhl: entities.filter(e => e.properties.sport === 'nhl').length,
        soccer: entities.filter(e => e.properties.sport === 'soccer').length,
        f1: entities.filter(e => e.properties.sport === 'f1').length
      },
      relationshipTypes: {
        PLAYS_FOR: this.relationships.filter(r => r.type === 'PLAYS_FOR').length,
        COMPETES_IN: this.relationships.filter(r => r.type === 'COMPETES_IN').length,
        SIMILAR_POSITION: this.relationships.filter(r => r.type === 'SIMILAR_POSITION').length
      },
      topConnectedEntities: entities
        .sort((a, b) => b.connections - a.connections)
        .slice(0, 10)
        .map(e => ({ id: e.id, connections: e.connections, type: e.type }))
    };
  }

  generateQueryExamples() {
    return [
      {
        name: "Find all NFL quarterbacks",
        query: "MATCH (p:PLAYER)-[:PLAYS_FOR]->(t:TEAM) WHERE p.position = 'QB' AND p.sport = 'nfl' RETURN p, t",
        description: "Returns all NFL quarterbacks and their teams"
      },
      {
        name: "High-performing players by sport",
        query: "MATCH (p:PLAYER) WHERE p.fantasyPoints > 200 RETURN p.name, p.team, p.sport, p.fantasyPoints ORDER BY p.fantasyPoints DESC",
        description: "Returns top fantasy performers across all sports"
      },
      {
        name: "Team depth analysis",
        query: "MATCH (t:TEAM)<-[:PLAYS_FOR]-(p:PLAYER) RETURN t.name, COUNT(p) as player_count, COLLECT(p.position) as positions",
        description: "Analyzes team roster depth and position coverage"
      },
      {
        name: "Injury risk assessment",
        query: "MATCH (p:PLAYER) WHERE EXISTS(p.injuryStatus) AND p.injuryStatus <> 'Healthy' RETURN p.name, p.team, p.injuryStatus",
        description: "Identifies players with injury concerns"
      }
    ];
  }

  async saveEntityIndices() {
    const indices = {
      byType: {},
      bySport: {},
      byTeam: {},
      byPosition: {}
    };
    
    for (const entity of this.entities.values()) {
      // By type
      if (!indices.byType[entity.type]) indices.byType[entity.type] = [];
      indices.byType[entity.type].push(entity.id);
      
      // By sport
      const sport = entity.properties.sport;
      if (sport) {
        if (!indices.bySport[sport]) indices.bySport[sport] = [];
        indices.bySport[sport].push(entity.id);
      }
      
      // By team
      const team = entity.properties.team || entity.properties.name;
      if (team && entity.type === 'PLAYER') {
        if (!indices.byTeam[team]) indices.byTeam[team] = [];
        indices.byTeam[team].push(entity.id);
      }
      
      // By position
      const position = entity.properties.position;
      if (position) {
        if (!indices.byPosition[position]) indices.byPosition[position] = [];
        indices.byPosition[position].push(entity.id);
      }
    }
    
    await this.saveData('knowledge-graph/entity-indices.json', indices);
  }

  async generateQueryInterface() {
    const queryInterface = {
      version: '1.0',
      description: 'Fantasy.AI Knowledge Graph Query Interface',
      endpoints: {
        searchPlayers: {
          method: 'GET',
          path: '/api/knowledge-graph/players',
          parameters: ['sport', 'team', 'position', 'minFantasyPoints'],
          example: '/api/knowledge-graph/players?sport=nfl&position=QB&minFantasyPoints=200'
        },
        findSimilarPlayers: {
          method: 'GET', 
          path: '/api/knowledge-graph/similar/{playerId}',
          description: 'Find players with similar attributes',
          example: '/api/knowledge-graph/similar/PLAYER:josh-allen'
        },
        teamAnalysis: {
          method: 'GET',
          path: '/api/knowledge-graph/teams/{teamId}/analysis',
          description: 'Comprehensive team analysis',
          example: '/api/knowledge-graph/teams/TEAM:BUF/analysis'
        },
        semanticSearch: {
          method: 'POST',
          path: '/api/knowledge-graph/semantic-search',
          body: { concept: 'HIGH_PERFORMER', sport: 'nfl', limit: 10 },
          description: 'Search by semantic concepts'
        }
      },
      graphStatistics: this.generateStatistics()
    };
    
    await this.saveData('knowledge-graph/query-interface.json', queryInterface);
  }

  generateId(name) {
    return name.toLowerCase().replace(/[^a-z0-9]/g, '-');
  }

  async saveData(filename, data) {
    try {
      const filepath = path.join(this.dataDir, filename);
      const dir = path.dirname(filepath);
      
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
      this.log(`💾 Saved: ${filename}`, 'success');
    } catch (error) {
      this.log(`❌ Failed to save ${filename}: ${error.message}`, 'error');
    }
  }

  async generateReport() {
    const duration = new Date() - this.startTime;
    
    const report = {
      knowledgeGraphSession: {
        started: this.startTime.toISOString(),
        completed: new Date().toISOString(),
        duration: duration,
        mcpServer: 'Knowledge Graph',
        status: 'COMPLETED'
      },
      processing: {
        dataSources: this.dataSources.length,
        recordsProcessed: this.processed,
        entitiesExtracted: this.entities.size,
        relationshipsBuilt: this.relationships.length,
        semanticConnections: this.semanticConnections.length
      },
      capabilities: [
        'Entity Recognition and Extraction',
        'Relationship Mapping and Graph Building', 
        'Semantic Connection Discovery',
        'Query Interface Generation',
        'Graph Statistics and Analytics',
        'Fast Entity Indexing'
      ],
      files: [
        'data/knowledge-graph/complete-graph.json',
        'data/knowledge-graph/entity-indices.json',
        'data/knowledge-graph/query-interface.json'
      ],
      nextPhase: {
        description: 'Integration with Fantasy.AI database and real-time updates',
        tasks: [
          'Sync knowledge graph with PostgreSQL database',
          'Set up real-time relationship updates',
          'Integrate with Fantasy.AI API endpoints',
          'Enable semantic search in user interface'
        ]
      }
    };
    
    await this.saveData('knowledge-graph/session-report.json', report);
    
    this.log('', 'info');
    this.log('🧠🏆 KNOWLEDGE GRAPH MCP COMPLETE!', 'success');
    this.log(`🏷️ Entities: ${report.processing.entitiesExtracted}`, 'success');
    this.log(`🔗 Relationships: ${report.processing.relationshipsBuilt}`, 'success');
    this.log(`🧠 Semantic Connections: ${report.processing.semanticConnections}`, 'success');
    this.log(`📊 Records Processed: ${report.processing.recordsProcessed}`, 'success');
    this.log(`⏱️ Duration: ${Math.round(duration / 1000)} seconds`, 'success');
    this.log('🚀 Ready for Database Integration!', 'success');
    
    return report;
  }
}

async function activateKnowledgeGraph() {
  const orchestrator = new KnowledgeGraphOrchestrator();
  
  try {
    const report = await orchestrator.activate();
    return report;
  } catch (error) {
    orchestrator.log(`💥 Knowledge Graph activation failed: ${error.message}`, 'error');
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  activateKnowledgeGraph();
}

module.exports = { KnowledgeGraphOrchestrator, activateKnowledgeGraph };