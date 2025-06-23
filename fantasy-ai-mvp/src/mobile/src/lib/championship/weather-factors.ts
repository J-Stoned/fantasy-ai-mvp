/**
 * Weather Factor Calculator
 * 
 * Calculates how weather conditions impact game outcomes and
 * championship probabilities for different team compositions.
 */

import { Team, WeatherData, Player } from './championship-engine';

export interface WeatherImpact {
  overall: number; // -1 to 1 (negative = bad, positive = good)
  passing: number;
  rushing: number;
  kicking: number;
  defense: number;
  factors: WeatherFactor[];
  recommendations: string[];
}

export interface WeatherFactor {
  condition: string;
  impact: number;
  affected: string[]; // Positions/aspects affected
  severity: 'low' | 'medium' | 'high';
  description: string;
}

export interface TeamWeatherProfile {
  adaptability: number; // 0-1 (how well team handles weather)
  homeAdvantage: number; // Extra benefit if used to conditions
  style: 'balanced' | 'pass-heavy' | 'run-heavy' | 'defensive';
  vulnerabilities: string[];
  strengths: string[];
}

export interface HistoricalWeatherPerformance {
  condition: string;
  games: number;
  avgPointDiff: number;
  winRate: number;
}

export class WeatherFactorCalculator {
  // Weather impact thresholds
  private readonly WEATHER_THRESHOLDS = {
    temperature: {
      freezing: 32,
      cold: 45,
      ideal: 70,
      hot: 85,
      extreme: 95
    },
    wind: {
      calm: 5,
      moderate: 15,
      strong: 25,
      severe: 35
    },
    precipitation: {
      none: 0,
      light: 0.1,
      moderate: 0.5,
      heavy: 1.0
    }
  };

  // Position-specific weather impacts
  private readonly POSITION_WEATHER_IMPACTS = {
    QB: {
      cold: -0.15,
      wind: -0.25,
      rain: -0.20,
      snow: -0.30,
      heat: -0.05
    },
    RB: {
      cold: -0.05,
      wind: 0.05,
      rain: -0.10,
      snow: -0.15,
      heat: -0.10
    },
    WR: {
      cold: -0.10,
      wind: -0.30,
      rain: -0.25,
      snow: -0.35,
      heat: -0.05
    },
    TE: {
      cold: -0.05,
      wind: -0.15,
      rain: -0.15,
      snow: -0.20,
      heat: -0.05
    },
    K: {
      cold: -0.10,
      wind: -0.40,
      rain: -0.15,
      snow: -0.25,
      heat: 0
    },
    DEF: {
      cold: 0.10,
      wind: 0.15,
      rain: 0.10,
      snow: 0.15,
      heat: -0.05
    }
  };

  /**
   * Calculate weather impact on team performance
   */
  calculateImpact(team: Team, weather: WeatherData): number {
    if (weather.dome) {
      return 0; // No weather impact in dome
    }

    const impact = this.analyzeWeatherImpact(team, weather);
    const profile = this.getTeamWeatherProfile(team);
    
    // Adjust for team's weather adaptability
    const adjustedImpact = impact.overall * (1 - profile.adaptability * 0.5);
    
    // Home teams are more adapted to local weather
    const homeBonus = profile.homeAdvantage * 0.1;
    
    return adjustedImpact + homeBonus;
  }

  /**
   * Comprehensive weather impact analysis
   */
  analyzeWeatherImpact(team: Team, weather: WeatherData): WeatherImpact {
    const factors: WeatherFactor[] = [];
    
    // Temperature impact
    const tempImpact = this.calculateTemperatureImpact(weather.temperature);
    if (tempImpact.impact !== 0) {
      factors.push(tempImpact);
    }
    
    // Wind impact
    const windImpact = this.calculateWindImpact(weather.windSpeed);
    if (windImpact.impact !== 0) {
      factors.push(windImpact);
    }
    
    // Precipitation impact
    const precipImpact = this.calculatePrecipitationImpact(
      weather.precipitation,
      weather.temperature
    );
    if (precipImpact.impact !== 0) {
      factors.push(precipImpact);
    }
    
    // Combined conditions
    const combinedFactors = this.analyzeCombinedConditions(weather);
    factors.push(...combinedFactors);
    
    // Calculate position-specific impacts
    const passingImpact = this.calculatePassingImpact(factors, team);
    const rushingImpact = this.calculateRushingImpact(factors, team);
    const kickingImpact = this.calculateKickingImpact(factors);
    const defenseImpact = this.calculateDefenseImpact(factors);
    
    // Overall impact weighted by team composition
    const overall = this.calculateOverallImpact(
      team,
      passingImpact,
      rushingImpact,
      kickingImpact,
      defenseImpact
    );
    
    const recommendations = this.generateWeatherRecommendations(
      team,
      factors,
      weather
    );
    
    return {
      overall,
      passing: passingImpact,
      rushing: rushingImpact,
      kicking: kickingImpact,
      defense: defenseImpact,
      factors,
      recommendations
    };
  }

  /**
   * Calculate temperature impact
   */
  private calculateTemperatureImpact(temperature: number): WeatherFactor {
    const thresholds = this.WEATHER_THRESHOLDS.temperature;
    
    if (temperature <= thresholds.freezing) {
      return {
        condition: 'Freezing',
        impact: -0.25,
        affected: ['QB', 'WR', 'K'],
        severity: 'high',
        description: `${temperature}°F - Severe cold affects passing and kicking`
      };
    } else if (temperature <= thresholds.cold) {
      return {
        condition: 'Cold',
        impact: -0.15,
        affected: ['QB', 'WR', 'K'],
        severity: 'medium',
        description: `${temperature}°F - Cold weather impacts ball handling`
      };
    } else if (temperature >= thresholds.extreme) {
      return {
        condition: 'Extreme Heat',
        impact: -0.20,
        affected: ['RB', 'DEF'],
        severity: 'high',
        description: `${temperature}°F - Extreme heat causes fatigue`
      };
    } else if (temperature >= thresholds.hot) {
      return {
        condition: 'Hot',
        impact: -0.10,
        affected: ['RB', 'DEF'],
        severity: 'medium',
        description: `${temperature}°F - Heat affects stamina`
      };
    }
    
    return {
      condition: 'Ideal',
      impact: 0,
      affected: [],
      severity: 'low',
      description: `${temperature}°F - Perfect football weather`
    };
  }

  /**
   * Calculate wind impact
   */
  private calculateWindImpact(windSpeed: number): WeatherFactor {
    const thresholds = this.WEATHER_THRESHOLDS.wind;
    
    if (windSpeed >= thresholds.severe) {
      return {
        condition: 'Severe Wind',
        impact: -0.40,
        affected: ['QB', 'WR', 'K'],
        severity: 'high',
        description: `${windSpeed} mph winds - Extreme passing/kicking difficulty`
      };
    } else if (windSpeed >= thresholds.strong) {
      return {
        condition: 'Strong Wind',
        impact: -0.25,
        affected: ['QB', 'WR', 'K'],
        severity: 'high',
        description: `${windSpeed} mph winds - Significant passing game impact`
      };
    } else if (windSpeed >= thresholds.moderate) {
      return {
        condition: 'Moderate Wind',
        impact: -0.10,
        affected: ['QB', 'K'],
        severity: 'medium',
        description: `${windSpeed} mph winds - Some passing/kicking difficulty`
      };
    }
    
    return {
      condition: 'Calm',
      impact: 0,
      affected: [],
      severity: 'low',
      description: `${windSpeed} mph winds - Minimal impact`
    };
  }

  /**
   * Calculate precipitation impact
   */
  private calculatePrecipitationImpact(
    precipitation: number,
    temperature: number
  ): WeatherFactor {
    const thresholds = this.WEATHER_THRESHOLDS.precipitation;
    const isSnow = temperature <= 32;
    
    if (precipitation >= thresholds.heavy) {
      return {
        condition: isSnow ? 'Heavy Snow' : 'Heavy Rain',
        impact: isSnow ? -0.35 : -0.25,
        affected: ['QB', 'WR', 'RB'],
        severity: 'high',
        description: isSnow ? 
          'Heavy snow - Major impact on all aspects' :
          'Heavy rain - Significant ball handling issues'
      };
    } else if (precipitation >= thresholds.moderate) {
      return {
        condition: isSnow ? 'Moderate Snow' : 'Moderate Rain',
        impact: isSnow ? -0.25 : -0.15,
        affected: ['QB', 'WR'],
        severity: 'medium',
        description: isSnow ?
          'Moderate snow - Passing game affected' :
          'Moderate rain - Some ball handling difficulty'
      };
    } else if (precipitation >= thresholds.light) {
      return {
        condition: isSnow ? 'Light Snow' : 'Light Rain',
        impact: isSnow ? -0.15 : -0.05,
        affected: ['QB', 'WR'],
        severity: 'low',
        description: 'Light precipitation - Minor impact'
      };
    }
    
    return {
      condition: 'Clear',
      impact: 0,
      affected: [],
      severity: 'low',
      description: 'No precipitation'
    };
  }

  /**
   * Analyze combined weather conditions
   */
  private analyzeCombinedConditions(weather: WeatherData): WeatherFactor[] {
    const factors: WeatherFactor[] = [];
    
    // Wind + Cold = Extra harsh
    if (weather.windSpeed > 20 && weather.temperature < 40) {
      factors.push({
        condition: 'Wind Chill',
        impact: -0.15,
        affected: ['QB', 'WR', 'K'],
        severity: 'high',
        description: 'Wind chill makes conditions feel much colder'
      });
    }
    
    // Rain + Wind = Very difficult
    if (weather.precipitation > 0.5 && weather.windSpeed > 15) {
      factors.push({
        condition: 'Driving Rain',
        impact: -0.20,
        affected: ['QB', 'WR', 'RB'],
        severity: 'high',
        description: 'Wind-driven rain severely impacts ball control'
      });
    }
    
    // Extreme conditions bonus for defense
    const extremeCount = [
      weather.temperature < 32 || weather.temperature > 90,
      weather.windSpeed > 25,
      weather.precipitation > 0.5
    ].filter(Boolean).length;
    
    if (extremeCount >= 2) {
      factors.push({
        condition: 'Extreme Conditions',
        impact: 0.15,
        affected: ['DEF'],
        severity: 'medium',
        description: 'Defense benefits from extreme weather'
      });
    }
    
    return factors;
  }

  /**
   * Calculate passing game impact
   */
  private calculatePassingImpact(
    factors: WeatherFactor[],
    team: Team
  ): number {
    const qbImpacts = this.POSITION_WEATHER_IMPACTS.QB;
    const wrImpacts = this.POSITION_WEATHER_IMPACTS.WR;
    
    let totalImpact = 0;
    
    for (const factor of factors) {
      if (factor.affected.includes('QB') || factor.affected.includes('WR')) {
        // Get position-specific impact
        const conditionKey = this.mapConditionToKey(factor.condition);
        const qbImpact = qbImpacts[conditionKey] || 0;
        const wrImpact = wrImpacts[conditionKey] || 0;
        
        totalImpact += (qbImpact + wrImpact) / 2 * Math.abs(factor.impact);
      }
    }
    
    // Adjust for team's passing volume
    const passingVolume = this.estimatePassingVolume(team);
    return totalImpact * passingVolume;
  }

  /**
   * Calculate rushing game impact
   */
  private calculateRushingImpact(
    factors: WeatherFactor[],
    team: Team
  ): number {
    const rbImpacts = this.POSITION_WEATHER_IMPACTS.RB;
    
    let totalImpact = 0;
    
    for (const factor of factors) {
      if (factor.affected.includes('RB')) {
        const conditionKey = this.mapConditionToKey(factor.condition);
        const rbImpact = rbImpacts[conditionKey] || 0;
        totalImpact += rbImpact * Math.abs(factor.impact);
      }
    }
    
    // Bad weather can actually benefit run-heavy teams
    const isRunHeavy = this.getTeamWeatherProfile(team).style === 'run-heavy';
    if (isRunHeavy && totalImpact < 0) {
      totalImpact *= 0.5; // Reduce negative impact
    }
    
    return totalImpact;
  }

  /**
   * Calculate kicking game impact
   */
  private calculateKickingImpact(factors: WeatherFactor[]): number {
    const kImpacts = this.POSITION_WEATHER_IMPACTS.K;
    
    let totalImpact = 0;
    
    for (const factor of factors) {
      if (factor.affected.includes('K')) {
        const conditionKey = this.mapConditionToKey(factor.condition);
        const kImpact = kImpacts[conditionKey] || 0;
        totalImpact += kImpact * Math.abs(factor.impact);
      }
    }
    
    return totalImpact;
  }

  /**
   * Calculate defensive impact
   */
  private calculateDefenseImpact(factors: WeatherFactor[]): number {
    const defImpacts = this.POSITION_WEATHER_IMPACTS.DEF;
    
    let totalImpact = 0;
    
    for (const factor of factors) {
      if (factor.affected.includes('DEF')) {
        const conditionKey = this.mapConditionToKey(factor.condition);
        const defImpact = defImpacts[conditionKey] || 0;
        totalImpact += defImpact * Math.abs(factor.impact);
      }
    }
    
    // Defense generally benefits from bad weather
    if (factors.some(f => f.severity === 'high')) {
      totalImpact += 0.1;
    }
    
    return totalImpact;
  }

  /**
   * Calculate overall weather impact
   */
  private calculateOverallImpact(
    team: Team,
    passing: number,
    rushing: number,
    kicking: number,
    defense: number
  ): number {
    const profile = this.getTeamWeatherProfile(team);
    
    // Weight impacts based on team style
    const weights = this.getStyleWeights(profile.style);
    
    const weightedImpact = 
      passing * weights.passing +
      rushing * weights.rushing +
      kicking * weights.kicking +
      defense * weights.defense;
    
    return Math.max(-1, Math.min(1, weightedImpact));
  }

  /**
   * Get team's weather profile
   */
  private getTeamWeatherProfile(team: Team): TeamWeatherProfile {
    // Analyze team composition and historical performance
    const qbStrength = team.roster
      .filter(p => p.position === 'QB')
      .reduce((sum, p) => sum + p.projectedPoints, 0);
    
    const rbStrength = team.roster
      .filter(p => p.position === 'RB')
      .reduce((sum, p) => sum + p.projectedPoints, 0);
    
    const style = this.determineTeamStyle(qbStrength, rbStrength);
    
    // Determine adaptability based on location (simplified)
    const adaptability = this.calculateAdaptability(team);
    
    const vulnerabilities = this.identifyWeatherVulnerabilities(team, style);
    const strengths = this.identifyWeatherStrengths(team, style);
    
    return {
      adaptability,
      homeAdvantage: Math.random() * 0.3, // Simplified
      style,
      vulnerabilities,
      strengths
    };
  }

  /**
   * Generate weather-based recommendations
   */
  private generateWeatherRecommendations(
    team: Team,
    factors: WeatherFactor[],
    weather: WeatherData
  ): string[] {
    const recommendations: string[] = [];
    
    // Severe weather warnings
    const severeFactors = factors.filter(f => f.severity === 'high');
    if (severeFactors.length > 0) {
      recommendations.push(
        `⚠️ Severe weather: ${severeFactors[0].description}`
      );
    }
    
    // Position-specific advice
    if (factors.some(f => f.affected.includes('QB') && f.impact < -0.2)) {
      recommendations.push(
        '🏈 Consider QB with strong arm and weather experience'
      );
    }
    
    if (factors.some(f => f.affected.includes('K') && f.impact < -0.3)) {
      recommendations.push(
        '🦵 Avoid kickers in these conditions if possible'
      );
    }
    
    // Game script predictions
    if (weather.windSpeed > 25 || weather.precipitation > 0.5) {
      recommendations.push(
        '🏃 Expect run-heavy game script, favor RBs'
      );
    }
    
    // Defense recommendations
    if (factors.some(f => f.affected.includes('DEF') && f.impact > 0.1)) {
      recommendations.push(
        '🛡️ Defense likely to outperform in these conditions'
      );
    }
    
    // Dome alternative
    if (weather.dome) {
      recommendations.push(
        '✅ Playing in dome - no weather concerns'
      );
    }
    
    return recommendations;
  }

  /**
   * Helper methods
   */
  private mapConditionToKey(condition: string): string {
    const mapping = {
      'Freezing': 'cold',
      'Cold': 'cold',
      'Extreme Heat': 'heat',
      'Hot': 'heat',
      'Severe Wind': 'wind',
      'Strong Wind': 'wind',
      'Moderate Wind': 'wind',
      'Heavy Snow': 'snow',
      'Moderate Snow': 'snow',
      'Light Snow': 'snow',
      'Heavy Rain': 'rain',
      'Moderate Rain': 'rain',
      'Light Rain': 'rain'
    };
    
    return mapping[condition] || 'normal';
  }

  private estimatePassingVolume(team: Team): number {
    const qbPoints = team.roster
      .filter(p => p.position === 'QB')
      .reduce((sum, p) => sum + p.projectedPoints, 0);
    
    const totalOffensive = team.roster
      .filter(p => ['QB', 'RB', 'WR', 'TE'].includes(p.position))
      .reduce((sum, p) => sum + p.projectedPoints, 0);
    
    return qbPoints / (totalOffensive || 1);
  }

  private determineTeamStyle(qbStrength: number, rbStrength: number): TeamWeatherProfile['style'] {
    const ratio = qbStrength / (rbStrength || 1);
    
    if (ratio > 1.5) return 'pass-heavy';
    if (ratio < 0.7) return 'run-heavy';
    if (qbStrength < 15 && rbStrength < 20) return 'defensive';
    return 'balanced';
  }

  private calculateAdaptability(team: Team): number {
    // Teams from extreme weather locations are more adaptable
    // This would use actual team location data
    return 0.5 + Math.random() * 0.3; // 0.5-0.8 range
  }

  private identifyWeatherVulnerabilities(
    team: Team,
    style: TeamWeatherProfile['style']
  ): string[] {
    const vulnerabilities: string[] = [];
    
    if (style === 'pass-heavy') {
      vulnerabilities.push('High winds', 'Heavy precipitation');
    }
    
    if (style === 'defensive') {
      vulnerabilities.push('Perfect weather (limits advantage)');
    }
    
    // Check for specific player vulnerabilities
    const hasWeakArm = team.roster.some(p => 
      p.position === 'QB' && p.consistency < 0.5
    );
    
    if (hasWeakArm) {
      vulnerabilities.push('Cold weather', 'Wind');
    }
    
    return vulnerabilities;
  }

  private identifyWeatherStrengths(
    team: Team,
    style: TeamWeatherProfile['style']
  ): string[] {
    const strengths: string[] = [];
    
    if (style === 'run-heavy') {
      strengths.push('Bad weather games', 'Cold conditions');
    }
    
    if (style === 'defensive') {
      strengths.push('Extreme conditions', 'Low-scoring affairs');
    }
    
    // Strong offensive line helps in all weather
    const hasStrongOLine = Math.random() > 0.5; // Simplified
    if (hasStrongOLine) {
      strengths.push('Wind resistance', 'Snow games');
    }
    
    return strengths;
  }

  private getStyleWeights(style: TeamWeatherProfile['style']): {
    passing: number;
    rushing: number;
    kicking: number;
    defense: number;
  } {
    const weights = {
      'balanced': { passing: 0.35, rushing: 0.35, kicking: 0.1, defense: 0.2 },
      'pass-heavy': { passing: 0.5, rushing: 0.2, kicking: 0.1, defense: 0.2 },
      'run-heavy': { passing: 0.2, rushing: 0.5, kicking: 0.1, defense: 0.2 },
      'defensive': { passing: 0.2, rushing: 0.2, kicking: 0.1, defense: 0.5 }
    };
    
    return weights[style];
  }

  /**
   * Get historical weather performance
   */
  getHistoricalPerformance(
    team: Team,
    condition: string
  ): HistoricalWeatherPerformance {
    // This would query actual historical data
    // Mock data for demonstration
    return {
      condition,
      games: 12,
      avgPointDiff: condition.includes('Snow') ? -5.2 : 2.1,
      winRate: condition.includes('Dome') ? 0.65 : 0.52
    };
  }
}

export default WeatherFactorCalculator;