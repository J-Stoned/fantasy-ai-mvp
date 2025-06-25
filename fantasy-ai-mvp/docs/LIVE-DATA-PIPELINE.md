# 🚀 Fantasy.AI Live Data Pipeline

## Overview

The Fantasy.AI Live Data Pipeline is a real-time sports data collection system that leverages MCP (Model Context Protocol) servers to gather, process, and feed live sports data into our ML models for instant predictions and insights.

## Features

### 🌐 Multi-Source Data Collection
- **ESPN**: Player statistics, team standings, game schedules
- **Yahoo Sports**: Injury reports, player news, fantasy rankings
- **NFL.com**: Live scores, play-by-play data, official stats
- **DraftKings**: Real-time odds, player props, betting lines
- **Weather.com**: Stadium weather conditions affecting gameplay
- **NBA.com, MLB.com, NHL.com**: Sport-specific data feeds

### 🤖 MCP Server Integration
- **Firecrawl MCP**: High-speed web crawling for static content
- **Puppeteer MCP**: Dynamic content scraping for JavaScript-heavy sites
- **Knowledge Graph MCP**: Relationship mapping between players, teams, and performance

### ⚡ Real-Time Processing
- 30-second update intervals for critical data
- Automatic rate limiting and backoff strategies
- Error handling and recovery mechanisms
- Live feed to ML models for instant predictions

### 📊 ML Model Integration
- Automatic feeding of live data to trained models
- Real-time player performance predictions
- Injury risk assessments
- Game outcome probabilities
- Fantasy point projections

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Live Data Pipeline                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  Firecrawl  │  │  Puppeteer  │  │   WebSocket │        │
│  │     MCP     │  │     MCP     │  │   Streams   │        │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘        │
│         │                 │                 │                │
│         ▼                 ▼                 ▼                │
│  ┌──────────────────────────────────────────────┐          │
│  │        Data Collection Orchestrator           │          │
│  │  • Rate Limiting  • Error Handling           │          │
│  │  • Retry Logic    • Priority Queuing         │          │
│  └─────────────────────┬────────────────────────┘          │
│                        │                                     │
│                        ▼                                     │
│  ┌──────────────────────────────────────────────┐          │
│  │           Data Processing Engine              │          │
│  │  • Parsing        • Normalization            │          │
│  │  • Validation     • Enrichment               │          │
│  └─────────────────────┬────────────────────────┘          │
│                        │                                     │
│         ┌──────────────┴──────────────┐                     │
│         ▼                             ▼                      │
│  ┌─────────────┐              ┌─────────────┐              │
│  │  PostgreSQL │              │ Knowledge   │              │
│  │   Database  │              │    Graph    │              │
│  └─────────────┘              └─────────────┘              │
│         │                             │                      │
│         └──────────────┬──────────────┘                     │
│                        ▼                                     │
│  ┌──────────────────────────────────────────────┐          │
│  │            ML Model Pipeline                  │          │
│  │  • Player Performance  • Injury Risk         │          │
│  │  • Game Predictions   • Fantasy Projections  │          │
│  └──────────────────────────────────────────────┘          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start

### 1. Start the Pipeline

```bash
npm run pipeline:start
```

This will:
- Initialize MCP server connections
- Start data collection from all enabled sources
- Begin feeding data to ML models
- Enable real-time monitoring

### 2. Monitor Pipeline Health

```bash
npm run pipeline:monitor
```

Interactive dashboard showing:
- System health status
- Source performance metrics
- Error tracking and alerts
- Live data feed

### 3. View in Web Dashboard

Navigate to `http://localhost:3000/live-data` to see:
- Real-time metrics visualization
- Source status indicators
- Live update feed
- Performance graphs

## Configuration

### Data Sources

Edit `src/lib/live-data-pipeline/real-time-sports-collector.ts` to configure sources:

```typescript
this.addDataSource({
  id: 'espn_player_stats',
  name: 'ESPN Player Statistics',
  url: 'https://www.espn.com/nfl/stats',
  type: 'firecrawl',
  sport: 'NFL',
  dataType: 'player_stats',
  interval: 30000, // 30 seconds
  enabled: true,
  priority: 1,
  selectors: {
    playerName: '.player-name',
    stats: '.player-stats'
  }
});
```

### Rate Limiting

Configure per-domain rate limits:

```typescript
this.rateLimitTracker.set('espn.com', {
  requestsPerMinute: 60,
  backoffMultiplier: 2,
  maxRetries: 3
});
```

## Data Processing

### Player Statistics
- Parsing of complex stat tables
- Normalization across different sources
- Historical comparison and trending
- ML model input preparation

### Injury Reports
- Severity classification
- Impact assessment on fantasy value
- Timeline predictions
- Related player opportunities

### Live Game Updates
- Score tracking
- Play-by-play analysis
- In-game player performance
- Real-time fantasy point calculations

### Weather Data
- Stadium-specific conditions
- Impact analysis on passing/kicking games
- Historical weather performance correlation

## ML Model Integration

The pipeline automatically feeds data to these models:

1. **Player Performance Predictor**
   - Input: Current stats, matchup, weather
   - Output: Projected fantasy points

2. **Injury Risk Assessment**
   - Input: Injury history, workload, play style
   - Output: Risk percentage and timeline

3. **Game Flow Predictor**
   - Input: Team stats, weather, betting lines
   - Output: Score predictions, game script

4. **Value Optimizer**
   - Input: All available data
   - Output: Optimal lineup recommendations

## Monitoring & Alerts

### Health Checks
- Pipeline status (running/stopped)
- Database connectivity
- ML model availability
- MCP server connections

### Performance Metrics
- Requests per minute
- Success/failure rates
- Data processing latency
- ML inference times

### Alerts
- Source failures
- High error rates
- Rate limit violations
- Data quality issues

## Error Handling

### Automatic Recovery
- Exponential backoff for failed requests
- Source-specific retry strategies
- Fallback data sources
- Cache utilization during outages

### Manual Intervention
- Error logs with full context
- Source health dashboard
- Manual source restart capability
- Data validation tools

## Best Practices

1. **Resource Management**
   - Monitor memory usage
   - Implement data retention policies
   - Use batch processing for ML inference

2. **Data Quality**
   - Validate all incoming data
   - Cross-reference multiple sources
   - Flag anomalies for review

3. **Scalability**
   - Horizontal scaling with multiple workers
   - Queue-based processing
   - Database connection pooling

## Troubleshooting

### Common Issues

1. **High Error Rate**
   - Check rate limit configurations
   - Verify selector accuracy
   - Monitor source website changes

2. **ML Model Timeouts**
   - Reduce batch sizes
   - Check GPU availability
   - Monitor model complexity

3. **Data Inconsistencies**
   - Verify parsing logic
   - Check timezone handling
   - Validate data transformations

## Future Enhancements

- [ ] WebSocket connections for instant updates
- [ ] GraphQL API for flexible data queries
- [ ] Distributed processing with message queues
- [ ] Advanced caching strategies
- [ ] Multi-region deployment
- [ ] Custom alert webhooks
- [ ] Historical data backfilling
- [ ] A/B testing for model predictions

## Contributing

To add a new data source:

1. Create source configuration in `real-time-sports-collector.ts`
2. Implement parsing logic in `processCollectedData()`
3. Add ML model integration if needed
4. Update monitoring dashboard
5. Add tests for new functionality

## License

This pipeline is part of the Fantasy.AI MVP and follows the same license terms.