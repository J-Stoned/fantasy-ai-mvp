/**
 * REAL-TIME PROCESSING WEB WORKER
 * High-performance worker for processing real-time fantasy data updates
 * Handles parallel processing of game data, stats, and fantasy calculations
 */

// Worker message handling
self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'PROCESS_BATCH':
      processBatch(data.updates);
      break;
    case 'CALCULATE_PROJECTIONS':
      calculateProjections(data.players);
      break;
    case 'ANALYZE_GAME_CONTEXT':
      analyzeGameContext(data.gameData);
      break;
    case 'OPTIMIZE_LINEUP':
      optimizeLineup(data.lineup);
      break;
    default:
      console.warn('Unknown worker message type:', type);
  }
});

/**
 * Process a batch of real-time updates
 */
function processBatch(updates) {
  const results = [];
  const startTime = performance.now();
  
  for (const update of updates) {
    try {
      const result = processUpdate(update);
      results.push({
        updateId: update.id,
        success: true,
        result,
        processingTime: performance.now() - startTime
      });
    } catch (error) {
      results.push({
        updateId: update.id,
        success: false,
        error: error.message,
        processingTime: performance.now() - startTime
      });
    }
  }
  
  // Send results back to main thread
  self.postMessage({
    type: 'BATCH_PROCESSED',
    results,
    totalProcessingTime: performance.now() - startTime
  });
}

/**
 * Process individual update
 */
function processUpdate(update) {
  switch (update.type) {
    case 'SCORING_PLAY':
      return processScoringPlayUpdate(update);
    case 'STAT_UPDATE':
      return processStatUpdate(update);
    case 'INJURY':
      return processInjuryUpdate(update);
    case 'GAME_STATUS':
      return processGameStatusUpdate(update);
    case 'WEATHER':
      return processWeatherUpdate(update);
    default:
      return processGenericUpdate(update);
  }
}

/**
 * Process scoring play updates
 */
function processScoringPlayUpdate(update) {
  const { data } = update;
  
  // Calculate fantasy points based on play type
  const fantasyPoints = calculateFantasyPoints(data);
  
  // Analyze impact on projections
  const projectionImpact = analyzeProjectionImpact(data, fantasyPoints);
  
  // Calculate trade value changes
  const tradeImpact = calculateTradeImpact(data, fantasyPoints);
  
  return {
    type: 'SCORING_PLAY_PROCESSED',
    playerId: data.playerId,
    fantasyPoints,
    projectionImpact,
    tradeImpact,
    timestamp: new Date().toISOString()
  };
}

/**
 * Process stat updates
 */
function processStatUpdate(update) {
  const { data } = update;
  
  // Calculate current fantasy points
  const currentPoints = calculateCurrentFantasyPoints(data.stats);
  
  // Project remaining game points
  const remainingProjection = projectRemainingPoints(data);
  
  // Calculate efficiency metrics
  const efficiency = calculateEfficiencyMetrics(data.stats);
  
  // Analyze situational factors
  const situationalFactors = analyzeSituationalFactors(data);
  
  return {
    type: 'STAT_UPDATE_PROCESSED',
    playerId: data.playerId,
    currentPoints,
    remainingProjection,
    totalProjection: currentPoints + remainingProjection,
    efficiency,
    situationalFactors,
    timestamp: new Date().toISOString()
  };
}

/**
 * Process injury updates
 */
function processInjuryUpdate(update) {
  const { data } = update;
  
  // Assess injury severity impact
  const severityImpact = assessInjurySeverity(data);
  
  // Calculate fantasy impact
  const fantasyImpact = calculateInjuryFantasyImpact(data, severityImpact);
  
  // Generate replacement recommendations
  const replacementOptions = generateReplacementOptions(data);
  
  return {
    type: 'INJURY_UPDATE_PROCESSED',
    playerId: data.playerId,
    severityImpact,
    fantasyImpact,
    replacementOptions,
    urgency: severityImpact.severity > 7 ? 'CRITICAL' : 'HIGH',
    timestamp: new Date().toISOString()
  };
}

/**
 * Process game status updates
 */
function processGameStatusUpdate(update) {
  const { data } = update;
  
  // Analyze game flow impact
  const gameFlowImpact = analyzeGameFlow(data);
  
  // Calculate affected players
  const affectedPlayers = identifyAffectedPlayers(data);
  
  return {
    type: 'GAME_STATUS_PROCESSED',
    gameId: data.gameId,
    gameFlowImpact,
    affectedPlayers,
    timestamp: new Date().toISOString()
  };
}

/**
 * Process weather updates
 */
function processWeatherUpdate(update) {
  const { data } = update;
  
  // Calculate weather impact on different positions
  const positionImpacts = calculateWeatherPositionImpacts(data.weather);
  
  // Identify severely affected players
  const severelyAffected = identifySeverelyAffectedPlayers(data, positionImpacts);
  
  return {
    type: 'WEATHER_UPDATE_PROCESSED',
    gameId: data.gameId,
    positionImpacts,
    severelyAffected,
    timestamp: new Date().toISOString()
  };
}

/**
 * Process generic updates
 */
function processGenericUpdate(update) {
  return {
    type: 'GENERIC_UPDATE_PROCESSED',
    originalType: update.type,
    processed: true,
    timestamp: new Date().toISOString()
  };
}

/**
 * Calculate fantasy points for different play types
 */
function calculateFantasyPoints(playData) {
  let points = 0;
  
  switch (playData.playType) {
    case 'TOUCHDOWN':
      if (playData.category === 'passing') {
        points = 4; // Passing TD
      } else {
        points = 6; // Rushing/Receiving TD
      }
      break;
    case 'FIELD_GOAL':
      // Points based on distance
      const distance = playData.distance || 30;
      if (distance < 40) points = 3;
      else if (distance < 50) points = 4;
      else points = 5;
      break;
    case 'SAFETY':
      points = 2;
      break;
    case 'EXTRA_POINT':
      points = 1;
      break;
    case 'TWO_POINT':
      points = 2;
      break;
  }
  
  // Add yardage points if applicable
  if (playData.yards) {
    if (playData.category === 'passing') {
      points += Math.floor(playData.yards / 25); // 1 point per 25 passing yards
    } else {
      points += Math.floor(playData.yards / 10); // 1 point per 10 rushing/receiving yards
    }
  }
  
  // Add reception point for PPR
  if (playData.category === 'receiving') {
    points += 1;
  }
  
  return Math.round(points * 10) / 10; // Round to 1 decimal
}

/**
 * Calculate current fantasy points from stats
 */
function calculateCurrentFantasyPoints(stats) {
  let points = 0;
  
  // Passing points
  points += (stats.passingYards || 0) * 0.04; // 1 point per 25 yards
  points += (stats.passingTouchdowns || 0) * 4;
  points -= (stats.interceptions || 0) * 2;
  
  // Rushing points
  points += (stats.rushingYards || 0) * 0.1; // 1 point per 10 yards
  points += (stats.rushingTouchdowns || 0) * 6;
  
  // Receiving points (PPR)
  points += (stats.receptions || 0) * 1; // PPR
  points += (stats.receivingYards || 0) * 0.1;
  points += (stats.receivingTouchdowns || 0) * 6;
  
  // Kicking points
  points += (stats.fieldGoalsMade || 0) * 3;
  points += (stats.extraPointsMade || 0) * 1;
  
  // Defense/Special Teams
  points += (stats.defensiveTouchdowns || 0) * 6;
  points += (stats.kickReturnTouchdowns || 0) * 6;
  points += (stats.puntReturnTouchdowns || 0) * 6;
  
  return Math.round(points * 10) / 10;
}

/**
 * Project remaining points for the game
 */
function projectRemainingPoints(data) {
  const stats = data.stats;
  const gameContext = data.gameContext;
  
  // Calculate current pace
  const gameProgress = calculateGameProgress(gameContext);
  const currentPoints = calculateCurrentFantasyPoints(stats);
  const pace = gameProgress > 0 ? currentPoints / gameProgress : 0;
  
  // Calculate remaining time factor
  const remainingFactor = Math.max(0, 1 - gameProgress);
  
  // Base projection from pace
  let remainingProjection = pace * remainingFactor;
  
  // Apply situational adjustments
  const situationalMultiplier = calculateSituationalMultiplier(data);
  remainingProjection *= situationalMultiplier;
  
  // Apply position-specific adjustments
  const positionMultiplier = getPositionMultiplier(data.position, gameContext);
  remainingProjection *= positionMultiplier;
  
  return Math.max(0, Math.round(remainingProjection * 10) / 10);
}

/**
 * Calculate game progress (0-1)
 */
function calculateGameProgress(gameContext) {
  const totalGameTime = 3600; // 60 minutes in seconds
  const elapsedTime = gameContext.elapsedTime || 0;
  return Math.min(1, elapsedTime / totalGameTime);
}

/**
 * Calculate situational multiplier for projections
 */
function calculateSituationalMultiplier(data) {
  let multiplier = 1.0;
  const gameContext = data.gameContext;
  
  // Game script adjustment
  if (gameContext.scoreDifferential) {
    const differential = gameContext.scoreDifferential;
    
    if (data.position === 'RB') {
      // Running backs benefit from positive game script
      if (differential > 10) multiplier *= 1.2;
      else if (differential < -10) multiplier *= 0.8;
    } else if (data.position === 'WR' || data.position === 'TE') {
      // Receivers benefit from negative game script
      if (differential < -10) multiplier *= 1.2;
      else if (differential > 10) multiplier *= 0.9;
    } else if (data.position === 'QB') {
      // QBs benefit from negative game script
      if (differential < -7) multiplier *= 1.1;
      else if (differential > 14) multiplier *= 0.9;
    }
  }
  
  // Red zone opportunities
  if (gameContext.redZoneVisits > 2) {
    multiplier *= 1.1; // More red zone opportunities
  }
  
  // Time of possession
  if (gameContext.timeOfPossession > 60) {
    multiplier *= 1.05; // More possession time
  }
  
  // Weather impact
  if (data.weather) {
    const weather = data.weather;
    if (weather.windSpeed > 15) {
      if (data.position === 'QB' || data.position === 'WR') {
        multiplier *= 0.9; // Wind hurts passing game
      } else if (data.position === 'RB') {
        multiplier *= 1.05; // More rushing in wind
      }
    }
    
    if (weather.conditions === 'RAIN' || weather.conditions === 'SNOW') {
      if (data.position === 'RB') {
        multiplier *= 1.1; // More rushing in bad weather
      } else {
        multiplier *= 0.95; // Less passing in bad weather
      }
    }
  }
  
  return multiplier;
}

/**
 * Get position-specific multiplier based on game context
 */
function getPositionMultiplier(position, gameContext) {
  let multiplier = 1.0;
  
  switch (position) {
    case 'QB':
      // QBs in high-scoring games
      if (gameContext.totalScore > 45) multiplier *= 1.1;
      break;
    case 'RB':
      // RBs in close games (more clock control)
      if (Math.abs(gameContext.scoreDifferential) < 7) multiplier *= 1.05;
      break;
    case 'WR':
    case 'TE':
      // Receivers in pass-heavy games
      if (gameContext.passingAttempts > 35) multiplier *= 1.1;
      break;
    case 'K':
      // Kickers in close games
      if (Math.abs(gameContext.scoreDifferential) < 10) multiplier *= 1.15;
      break;
    case 'DST':
      // Defense against struggling offenses
      if (gameContext.turnovers > 2) multiplier *= 1.2;
      break;
  }
  
  return multiplier;
}

/**
 * Calculate efficiency metrics
 */
function calculateEfficiencyMetrics(stats) {
  const metrics = {
    overall: 50,
    redZone: 50,
    thirdDown: 50,
    explosive: 50
  };
  
  // Overall efficiency
  if (stats.yardsPerCarry && stats.yardsPerCarry > 4) metrics.overall += 20;
  if (stats.yardsPerTarget && stats.yardsPerTarget > 8) metrics.overall += 15;
  if (stats.completionPercentage && stats.completionPercentage > 0.65) metrics.overall += 15;
  
  // Red zone efficiency
  const redZoneOpportunities = (stats.redZoneTargets || 0) + (stats.redZoneCarries || 0);
  const redZoneScores = stats.redZoneTouchdowns || 0;
  if (redZoneOpportunities > 0) {
    metrics.redZone = (redZoneScores / redZoneOpportunities) * 100;
  }
  
  // Third down efficiency
  if (stats.thirdDownConversions) {
    const [conversions, attempts] = stats.thirdDownConversions.split('/').map(Number);
    if (attempts > 0) {
      metrics.thirdDown = (conversions / attempts) * 100;
    }
  }
  
  // Explosive play efficiency
  const totalPlays = (stats.rushingAttempts || 0) + (stats.targets || 0);
  const explosivePlays = (stats.playsOver20Yards || 0);
  if (totalPlays > 0) {
    metrics.explosive = (explosivePlays / totalPlays) * 100;
  }
  
  return metrics;
}

/**
 * Analyze situational factors
 */
function analyzeSituationalFactors(data) {
  const factors = [];
  
  // Weather factors
  if (data.weather) {
    const weather = data.weather;
    if (weather.windSpeed > 15) {
      factors.push({
        factor: 'WEATHER',
        impact: weather.windSpeed > 20 ? 'VERY_NEGATIVE' : 'NEGATIVE',
        weight: Math.min(80, weather.windSpeed * 2),
        description: `High winds (${weather.windSpeed} mph) affecting play`
      });
    }
    
    if (weather.conditions === 'RAIN' || weather.conditions === 'SNOW') {
      factors.push({
        factor: 'WEATHER',
        impact: 'NEGATIVE',
        weight: 60,
        description: `Poor weather conditions (${weather.conditions})`
      });
    }
  }
  
  // Game script factors
  if (data.gameContext.scoreDifferential) {
    const differential = Math.abs(data.gameContext.scoreDifferential);
    if (differential > 14) {
      factors.push({
        factor: 'GAME_SCRIPT',
        impact: 'NEGATIVE',
        weight: Math.min(90, differential * 3),
        description: `Large lead/deficit affecting play calling`
      });
    }
  }
  
  // Injury factors
  if (data.injuryStatus && data.injuryStatus !== 'HEALTHY') {
    factors.push({
      factor: 'INJURY',
      impact: 'NEGATIVE',
      weight: 70,
      description: `Player dealing with ${data.injuryStatus} status`
    });
  }
  
  return factors;
}

/**
 * Analyze projection impact
 */
function analyzeProjectionImpact(playData, fantasyPoints) {
  return {
    immediateImpact: fantasyPoints,
    gameProjectionChange: fantasyPoints * 1.2, // Slight boost for momentum
    seasonImpact: fantasyPoints * 0.1, // Small long-term impact
    confidenceChange: 5 // Slight confidence boost
  };
}

/**
 * Calculate trade impact
 */
function calculateTradeImpact(playData, fantasyPoints) {
  let valueChange = 0;
  
  if (fantasyPoints >= 6) {
    valueChange = 5; // 5% value increase for TD
  } else if (fantasyPoints >= 3) {
    valueChange = 2; // 2% value increase for good play
  }
  
  return {
    immediateValueChange: valueChange,
    shortTermTrend: valueChange > 0 ? 'UP' : 'STABLE',
    tradeWindow: fantasyPoints >= 6 ? 'IMMEDIATE' : 'SHORT_TERM'
  };
}

/**
 * Assess injury severity
 */
function assessInjurySeverity(injuryData) {
  let severity = 5; // Base severity
  let timeline = 'UNKNOWN';
  let fantasyImpact = 'MODERATE';
  
  const injuryType = injuryData.injuryType?.toLowerCase() || '';
  const bodyPart = injuryData.bodyPart?.toLowerCase() || '';
  
  // Severity by injury type
  if (injuryType.includes('concussion')) {
    severity = 8;
    timeline = '1-2_WEEKS';
    fantasyImpact = 'HIGH';
  } else if (injuryType.includes('hamstring')) {
    severity = 6;
    timeline = '2-4_WEEKS';
    fantasyImpact = 'MODERATE';
  } else if (injuryType.includes('ankle')) {
    severity = 5;
    timeline = '1-3_WEEKS';
    fantasyImpact = 'MODERATE';
  } else if (injuryType.includes('knee')) {
    severity = 9;
    timeline = '4-8_WEEKS';
    fantasyImpact = 'SEVERE';
  } else if (injuryType.includes('shoulder')) {
    severity = 7;
    timeline = '2-6_WEEKS';
    fantasyImpact = 'HIGH';
  }
  
  // Adjust by body part
  if (bodyPart.includes('leg') || bodyPart.includes('foot')) {
    if (injuryData.position === 'RB') severity += 1;
  } else if (bodyPart.includes('arm') || bodyPart.includes('hand')) {
    if (injuryData.position === 'QB' || injuryData.position === 'WR') severity += 1;
  }
  
  return {
    severity: Math.min(10, severity),
    timeline,
    fantasyImpact,
    description: `${injuryType} injury affecting ${bodyPart}`
  };
}

/**
 * Calculate injury fantasy impact
 */
function calculateInjuryFantasyImpact(injuryData, severityAssessment) {
  const severity = severityAssessment.severity;
  let projectionReduction = 0;
  let valueReduction = 0;
  
  // Calculate reductions based on severity
  if (severity >= 8) {
    projectionReduction = 80; // 80% reduction for severe injuries
    valueReduction = 60;
  } else if (severity >= 6) {
    projectionReduction = 50; // 50% reduction for moderate injuries
    valueReduction = 30;
  } else if (severity >= 4) {
    projectionReduction = 25; // 25% reduction for minor injuries
    valueReduction = 15;
  }
  
  return {
    projectionReduction,
    valueReduction,
    recommendedAction: severity >= 6 ? 'BENCH_IMMEDIATELY' : 'MONITOR',
    urgency: severity >= 8 ? 'CRITICAL' : severity >= 6 ? 'HIGH' : 'MEDIUM'
  };
}

/**
 * Generate replacement options
 */
function generateReplacementOptions(injuryData) {
  // This would typically query a database of available players
  // For now, return mock replacement suggestions
  return [
    {
      playerId: 'replacement_1',
      playerName: 'Backup Player 1',
      position: injuryData.position,
      availability: 95, // 95% available in leagues
      projectedPoints: injuryData.projectedPoints * 0.7,
      reasoning: 'Primary backup with proven track record'
    },
    {
      playerId: 'replacement_2',
      playerName: 'Backup Player 2',
      position: injuryData.position,
      availability: 80,
      projectedPoints: injuryData.projectedPoints * 0.6,
      reasoning: 'Secondary option with upside potential'
    }
  ];
}

/**
 * Analyze game flow
 */
function analyzeGameFlow(gameData) {
  const flow = {
    tempo: 'AVERAGE',
    scoringExpectation: 'AVERAGE',
    script: 'NEUTRAL',
    overtimeChance: 0
  };
  
  // Analyze tempo
  const playsPerMinute = gameData.totalPlays / (gameData.elapsedTime / 60);
  if (playsPerMinute > 2.5) flow.tempo = 'FAST';
  else if (playsPerMinute < 1.8) flow.tempo = 'SLOW';
  
  // Scoring expectation
  const currentPace = gameData.totalScore / (gameData.elapsedTime / 3600);
  if (currentPace > 50) flow.scoringExpectation = 'HIGH';
  else if (currentPace < 35) flow.scoringExpectation = 'LOW';
  
  // Game script
  if (gameData.scoreDifferential > 14) flow.script = 'BLOWOUT';
  else if (Math.abs(gameData.scoreDifferential) < 7) flow.script = 'CLOSE';
  
  // Overtime chance
  if (Math.abs(gameData.scoreDifferential) < 3 && gameData.quarter >= 4) {
    flow.overtimeChance = 25; // 25% chance
  }
  
  return flow;
}

/**
 * Identify affected players from game status change
 */
function identifyAffectedPlayers(gameData) {
  // This would identify players whose projections are affected
  // by game status changes (weather, delays, etc.)
  return [];
}

/**
 * Calculate weather impact on different positions
 */
function calculateWeatherPositionImpacts(weather) {
  const impacts = {
    QB: 0,
    RB: 0,
    WR: 0,
    TE: 0,
    K: 0,
    DST: 0
  };
  
  // Wind impact
  if (weather.windSpeed > 15) {
    impacts.QB = -15; // Passing difficulty
    impacts.WR = -10; // Receiving difficulty
    impacts.TE = -8;
    impacts.K = -20; // Kicking difficulty
    impacts.RB = 5; // More rushing attempts
  }
  
  // Precipitation impact
  if (weather.conditions === 'RAIN' || weather.conditions === 'SNOW') {
    impacts.QB = -10;
    impacts.WR = -12;
    impacts.TE = -8;
    impacts.RB = 8; // More rushing in bad weather
    impacts.K = -15;
    impacts.DST = 5; // More mistakes by offense
  }
  
  // Temperature impact
  if (weather.temperature < 32) {
    impacts.K = -10; // Cold affects kicking
    impacts.QB = -5; // Cold affects grip
  } else if (weather.temperature > 90) {
    // Hot weather generally neutral for fantasy
  }
  
  return impacts;
}

/**
 * Identify severely affected players
 */
function identifySeverelyAffectedPlayers(weatherData, positionImpacts) {
  const severelyAffected = [];
  
  // Check each position for significant impact
  Object.entries(positionImpacts).forEach(([position, impact]) => {
    if (Math.abs(impact) > 15) {
      severelyAffected.push({
        position,
        impact,
        severity: Math.abs(impact) > 20 ? 'SEVERE' : 'MODERATE',
        recommendation: impact < 0 ? 'CONSIDER_ALTERNATIVES' : 'POTENTIAL_BOOST'
      });
    }
  });
  
  return severelyAffected;
}

/**
 * Calculate projections for multiple players
 */
function calculateProjections(players) {
  const results = players.map(player => {
    const projection = projectRemainingPoints(player);
    const efficiency = calculateEfficiencyMetrics(player.stats);
    
    return {
      playerId: player.playerId,
      projection,
      efficiency,
      lastUpdated: new Date().toISOString()
    };
  });
  
  self.postMessage({
    type: 'PROJECTIONS_CALCULATED',
    results
  });
}

/**
 * Analyze game context for strategic insights
 */
function analyzeGameContext(gameData) {
  const analysis = {
    gameFlow: analyzeGameFlow(gameData),
    keyFactors: [],
    strategicImplications: []
  };
  
  // Identify key factors affecting fantasy performance
  if (gameData.weather && gameData.weather.windSpeed > 15) {
    analysis.keyFactors.push({
      factor: 'High Winds',
      impact: 'Favors running game, hurts passing',
      weight: 'HIGH'
    });
  }
  
  if (Math.abs(gameData.scoreDifferential) > 14) {
    analysis.keyFactors.push({
      factor: 'Lopsided Score',
      impact: 'Affects play calling and usage',
      weight: 'HIGH'
    });
  }
  
  self.postMessage({
    type: 'GAME_CONTEXT_ANALYZED',
    gameId: gameData.gameId,
    analysis
  });
}

/**
 * Optimize lineup based on current projections
 */
function optimizeLineup(lineupData) {
  // Simplified lineup optimization
  const optimizedPositions = lineupData.positions.map(position => {
    // Sort available players by projection
    const sortedPlayers = position.availablePlayers.sort((a, b) => 
      b.projection - a.projection
    );
    
    return {
      position: position.name,
      recommendedPlayer: sortedPlayers[0],
      alternatives: sortedPlayers.slice(1, 3),
      projectionImprovement: sortedPlayers[0].projection - (position.currentPlayer?.projection || 0)
    };
  });
  
  const totalProjection = optimizedPositions.reduce((sum, pos) => 
    sum + pos.recommendedPlayer.projection, 0
  );
  
  self.postMessage({
    type: 'LINEUP_OPTIMIZED',
    optimizedPositions,
    totalProjection,
    timestamp: new Date().toISOString()
  });
}

// Performance monitoring
let processedUpdates = 0;
let totalProcessingTime = 0;

setInterval(() => {
  if (processedUpdates > 0) {
    self.postMessage({
      type: 'WORKER_PERFORMANCE',
      stats: {
        processedUpdates,
        averageProcessingTime: totalProcessingTime / processedUpdates,
        updatesPerSecond: processedUpdates / 60 // Last minute average
      }
    });
    
    // Reset counters
    processedUpdates = 0;
    totalProcessingTime = 0;
  }
}, 60000); // Report every minute

console.log('Real-time processing worker initialized');