/**
 * Injury Impact Model
 * 
 * Advanced model for calculating how injuries affect championship probability
 * using player importance, position scarcity, and replacement value.
 */

import { Player, Team } from './championship-engine';

export interface InjuryAnalysis {
  teamImpact: number; // -1 to 0 (negative impact)
  keyInjuries: PlayerInjuryImpact[];
  positionDepth: Map<string, DepthAnalysis>;
  replacementQuality: number; // 0-1 score
  recoveryTimeline: RecoveryProjection[];
  riskScore: number; // 0-1 (higher = more risk)
  recommendations: string[];
}

export interface PlayerInjuryImpact {
  player: Player;
  impact: number; // -1 to 0
  replacementDrop: number; // Points lost
  positionScarcity: number; // 0-1 (1 = very scarce)
  timeline: InjuryTimeline;
  confidenceLevel: number; // 0-1
}

export interface InjuryTimeline {
  injuryType: string;
  currentStatus: 'healthy' | 'questionable' | 'doubtful' | 'out' | 'IR';
  estimatedReturn: number; // Weeks
  reinjuryRisk: number; // 0-1
  historicalRecovery: number; // Typical weeks for this injury
}

export interface DepthAnalysis {
  position: string;
  healthyStarters: number;
  totalDepth: number;
  qualityScore: number; // 0-1
  vulnerability: number; // 0-1
}

export interface RecoveryProjection {
  player: Player;
  weeks: number[];
  probabilities: number[]; // Probability of return each week
  performanceImpact: number[]; // Expected performance % each week
}

export class InjuryImpactModel {
  // Position importance weights
  private readonly POSITION_WEIGHTS = {
    QB: 1.0,
    RB: 0.9,
    WR: 0.7,
    TE: 0.6,
    K: 0.3,
    DEF: 0.4,
    FLEX: 0.7
  };

  // Injury severity mappings
  private readonly INJURY_SEVERITIES = {
    'healthy': { impact: 0, weeks: 0, confidence: 1.0 },
    'questionable': { impact: -0.15, weeks: 0.5, confidence: 0.7 },
    'doubtful': { impact: -0.35, weeks: 1.5, confidence: 0.6 },
    'out': { impact: -0.7, weeks: 2.5, confidence: 0.8 },
    'IR': { impact: -1.0, weeks: 6, confidence: 0.9 }
  };

  // Common injury types and recovery times
  private readonly INJURY_TYPES = new Map([
    ['hamstring', { weeks: 2.5, reinjuryRisk: 0.35, variance: 1.5 }],
    ['ankle', { weeks: 2.0, reinjuryRisk: 0.25, variance: 1.0 }],
    ['knee', { weeks: 4.0, reinjuryRisk: 0.30, variance: 2.0 }],
    ['shoulder', { weeks: 3.0, reinjuryRisk: 0.20, variance: 1.5 }],
    ['concussion', { weeks: 1.5, reinjuryRisk: 0.40, variance: 0.5 }],
    ['back', { weeks: 2.5, reinjuryRisk: 0.45, variance: 2.0 }],
    ['groin', { weeks: 2.0, reinjuryRisk: 0.35, variance: 1.0 }],
    ['calf', { weeks: 2.0, reinjuryRisk: 0.30, variance: 1.0 }],
    ['quad', { weeks: 1.5, reinjuryRisk: 0.25, variance: 0.5 }],
    ['ribs', { weeks: 2.0, reinjuryRisk: 0.15, variance: 1.0 }],
    ['illness', { weeks: 0.5, reinjuryRisk: 0.05, variance: 0.5 }]
  ]);

  /**
   * Calculate injury impact on championship probability
   */
  async calculateImpact(
    teamRoster: Player[],
    opponentRoster: Player[]
  ): Promise<number> {
    const teamAnalysis = await this.analyzeTeamInjuries(teamRoster);
    const opponentAnalysis = await this.analyzeTeamInjuries(opponentRoster);
    
    // Net impact (positive if opponent more injured)
    const netImpact = opponentAnalysis.teamImpact - teamAnalysis.teamImpact;
    
    // Scale to -0.3 to 0.3 range
    return Math.max(-0.3, Math.min(0.3, netImpact * 0.3));
  }

  /**
   * Comprehensive injury analysis for a team
   */
  async analyzeTeamInjuries(roster: Player[]): Promise<InjuryAnalysis> {
    const keyInjuries = this.identifyKeyInjuries(roster);
    const positionDepth = this.analyzePositionDepth(roster);
    const replacementQuality = this.calculateReplacementQuality(roster);
    const recoveryTimeline = this.projectRecoveryTimelines(keyInjuries);
    const riskScore = this.calculateInjuryRisk(roster);
    
    const teamImpact = this.calculateTeamImpact(
      keyInjuries,
      positionDepth,
      replacementQuality
    );
    
    const recommendations = this.generateRecommendations(
      keyInjuries,
      positionDepth,
      recoveryTimeline
    );
    
    return {
      teamImpact,
      keyInjuries,
      positionDepth,
      replacementQuality,
      recoveryTimeline,
      riskScore,
      recommendations
    };
  }

  /**
   * Identify injuries to key players
   */
  private identifyKeyInjuries(roster: Player[]): PlayerInjuryImpact[] {
    const injuries: PlayerInjuryImpact[] = [];
    
    for (const player of roster) {
      if (!player.injuryStatus || player.injuryStatus === 'healthy') {
        continue;
      }
      
      const impact = this.calculatePlayerInjuryImpact(player, roster);
      if (Math.abs(impact.impact) > 0.1) { // Significant impact
        injuries.push(impact);
      }
    }
    
    return injuries.sort((a, b) => a.impact - b.impact); // Most negative first
  }

  /**
   * Calculate individual player injury impact
   */
  private calculatePlayerInjuryImpact(
    player: Player,
    roster: Player[]
  ): PlayerInjuryImpact {
    const severity = this.INJURY_SEVERITIES[player.injuryStatus || 'healthy'];
    const positionWeight = this.POSITION_WEIGHTS[player.position] || 0.5;
    
    // Calculate player's value relative to position
    const positionPlayers = roster.filter(p => p.position === player.position);
    const playerRank = positionPlayers
      .sort((a, b) => b.projectedPoints - a.projectedPoints)
      .findIndex(p => p.id === player.id) + 1;
    
    const isStarter = playerRank <= this.getStarterCount(player.position);
    const starterMultiplier = isStarter ? 1.5 : 0.7;
    
    // Calculate replacement drop-off
    const replacement = this.findBestReplacement(player, roster);
    const replacementDrop = player.projectedPoints - (replacement?.projectedPoints || 0);
    
    // Position scarcity
    const positionScarcity = this.calculatePositionScarcity(player.position, roster);
    
    // Overall impact
    const impact = severity.impact * positionWeight * starterMultiplier * 
                  (1 + positionScarcity) * (replacementDrop / 20);
    
    // Get injury timeline
    const timeline = this.getInjuryTimeline(player);
    
    return {
      player,
      impact: Math.max(-1, impact),
      replacementDrop,
      positionScarcity,
      timeline,
      confidenceLevel: severity.confidence
    };
  }

  /**
   * Analyze depth at each position
   */
  private analyzePositionDepth(roster: Player[]): Map<string, DepthAnalysis> {
    const depthMap = new Map<string, DepthAnalysis>();
    const positions = ['QB', 'RB', 'WR', 'TE', 'K', 'DEF'];
    
    for (const position of positions) {
      const positionPlayers = roster.filter(p => p.position === position);
      const healthyPlayers = positionPlayers.filter(
        p => !p.injuryStatus || p.injuryStatus === 'healthy'
      );
      
      const starterCount = this.getStarterCount(position);
      const healthyStarters = healthyPlayers
        .sort((a, b) => b.projectedPoints - a.projectedPoints)
        .slice(0, starterCount).length;
      
      // Quality score based on projected points
      const avgProjected = healthyPlayers.reduce(
        (sum, p) => sum + p.projectedPoints, 0
      ) / (healthyPlayers.length || 1);
      
      const leagueAvg = this.getLeagueAveragePoints(position);
      const qualityScore = Math.min(1, avgProjected / leagueAvg);
      
      // Vulnerability based on depth and injuries
      const vulnerability = 1 - (healthyStarters / starterCount) * qualityScore;
      
      depthMap.set(position, {
        position,
        healthyStarters,
        totalDepth: positionPlayers.length,
        qualityScore,
        vulnerability
      });
    }
    
    return depthMap;
  }

  /**
   * Calculate replacement player quality
   */
  private calculateReplacementQuality(roster: Player[]): number {
    let totalQuality = 0;
    let positionCount = 0;
    
    const positions = ['QB', 'RB', 'WR', 'TE'];
    
    for (const position of positions) {
      const players = roster
        .filter(p => p.position === position)
        .sort((a, b) => b.projectedPoints - a.projectedPoints);
      
      const starterCount = this.getStarterCount(position);
      const backups = players.slice(starterCount);
      
      if (backups.length > 0) {
        const backupAvg = backups.reduce(
          (sum, p) => sum + p.projectedPoints, 0
        ) / backups.length;
        
        const starterAvg = players.slice(0, starterCount).reduce(
          (sum, p) => sum + p.projectedPoints, 0
        ) / starterCount;
        
        const quality = backupAvg / (starterAvg || 1);
        totalQuality += quality;
        positionCount++;
      }
    }
    
    return positionCount > 0 ? totalQuality / positionCount : 0.5;
  }

  /**
   * Project recovery timelines
   */
  private projectRecoveryTimelines(
    injuries: PlayerInjuryImpact[]
  ): RecoveryProjection[] {
    return injuries.map(injury => {
      const timeline = injury.timeline;
      const weeks = Array.from({ length: 8 }, (_, i) => i + 1);
      
      const probabilities = weeks.map(week => {
        if (week < timeline.estimatedReturn) {
          return 0.1 * (week / timeline.estimatedReturn);
        } else if (week === Math.ceil(timeline.estimatedReturn)) {
          return 0.7;
        } else {
          return Math.min(0.95, 0.7 + 0.1 * (week - timeline.estimatedReturn));
        }
      });
      
      const performanceImpact = weeks.map(week => {
        if (week < timeline.estimatedReturn) {
          return 0;
        } else {
          const weeksBack = week - timeline.estimatedReturn;
          return Math.min(1, 0.7 + 0.1 * weeksBack);
        }
      });
      
      return {
        player: injury.player,
        weeks,
        probabilities,
        performanceImpact
      };
    });
  }

  /**
   * Calculate overall injury risk score
   */
  private calculateInjuryRisk(roster: Player[]): number {
    let riskScore = 0;
    let weightSum = 0;
    
    for (const player of roster) {
      const weight = this.POSITION_WEIGHTS[player.position] || 0.5;
      
      // Age factor (older = higher risk)
      const ageFactor = player.name.includes('Sr.') ? 1.2 : 1.0; // Simplified
      
      // Injury history factor
      const historyFactor = player.injuryStatus ? 1.5 : 1.0;
      
      // Recent performance variance (inconsistent = higher risk)
      const variance = this.calculatePerformanceVariance(player);
      const varianceFactor = 1 + variance * 0.5;
      
      const playerRisk = ageFactor * historyFactor * varianceFactor * weight;
      riskScore += playerRisk;
      weightSum += weight;
    }
    
    return Math.min(1, riskScore / (weightSum * 2));
  }

  /**
   * Calculate team-wide injury impact
   */
  private calculateTeamImpact(
    injuries: PlayerInjuryImpact[],
    positionDepth: Map<string, DepthAnalysis>,
    replacementQuality: number
  ): number {
    // Sum individual impacts
    const directImpact = injuries.reduce((sum, inj) => sum + inj.impact, 0);
    
    // Position vulnerability multiplier
    const avgVulnerability = Array.from(positionDepth.values())
      .reduce((sum, depth) => sum + depth.vulnerability, 0) / positionDepth.size;
    
    // Replacement quality factor
    const replacementFactor = 1 - replacementQuality;
    
    // Combined impact
    const totalImpact = directImpact * (1 + avgVulnerability) * (1 + replacementFactor);
    
    return Math.max(-1, Math.min(0, totalImpact));
  }

  /**
   * Generate actionable recommendations
   */
  private generateRecommendations(
    injuries: PlayerInjuryImpact[],
    positionDepth: Map<string, DepthAnalysis>,
    timeline: RecoveryProjection[]
  ): string[] {
    const recommendations: string[] = [];
    
    // Check for critical injuries
    const criticalInjuries = injuries.filter(inj => inj.impact < -0.5);
    if (criticalInjuries.length > 0) {
      recommendations.push(
        `🚨 Critical: ${criticalInjuries[0].player.name} injury severely impacts championship odds`
      );
    }
    
    // Check vulnerable positions
    const vulnerablePositions = Array.from(positionDepth.entries())
      .filter(([_, depth]) => depth.vulnerability > 0.7)
      .map(([pos]) => pos);
    
    if (vulnerablePositions.length > 0) {
      recommendations.push(
        `⚠️ Strengthen depth at: ${vulnerablePositions.join(', ')}`
      );
    }
    
    // Recovery timing recommendations
    const playoffReturns = timeline.filter(proj => {
      const playoffWeek = proj.weeks.findIndex(w => w >= 15);
      return playoffWeek >= 0 && proj.probabilities[playoffWeek] > 0.6;
    });
    
    if (playoffReturns.length > 0) {
      recommendations.push(
        `✅ ${playoffReturns[0].player.name} expected back for playoffs`
      );
    }
    
    // Handcuff recommendations
    const injuredRBs = injuries.filter(inj => 
      inj.player.position === 'RB' && inj.impact < -0.3
    );
    
    if (injuredRBs.length > 0) {
      recommendations.push(
        `💡 Consider handcuffing ${injuredRBs[0].player.name}`
      );
    }
    
    // Load management
    const highRisk = injuries.filter(inj => inj.timeline.reinjuryRisk > 0.4);
    if (highRisk.length > 0) {
      recommendations.push(
        `⏰ Monitor ${highRisk[0].player.name} - high reinjury risk`
      );
    }
    
    return recommendations;
  }

  /**
   * Helper methods
   */
  private getStarterCount(position: string): number {
    const starterCounts = {
      QB: 1,
      RB: 2,
      WR: 3,
      TE: 1,
      K: 1,
      DEF: 1
    };
    return starterCounts[position] || 1;
  }

  private findBestReplacement(
    player: Player,
    roster: Player[]
  ): Player | null {
    const samePosition = roster.filter(
      p => p.position === player.position && 
      p.id !== player.id &&
      (!p.injuryStatus || p.injuryStatus === 'healthy')
    );
    
    return samePosition.sort((a, b) => 
      b.projectedPoints - a.projectedPoints
    )[0] || null;
  }

  private calculatePositionScarcity(
    position: string,
    roster: Player[]
  ): number {
    const healthyAtPosition = roster.filter(
      p => p.position === position && 
      (!p.injuryStatus || p.injuryStatus === 'healthy')
    ).length;
    
    const needed = this.getStarterCount(position);
    const scarcity = 1 - (healthyAtPosition / (needed * 2));
    
    return Math.max(0, Math.min(1, scarcity));
  }

  private getInjuryTimeline(player: Player): InjuryTimeline {
    // Simplified - would use actual injury data
    const injuryType = this.inferInjuryType(player);
    const injuryData = this.INJURY_TYPES.get(injuryType) || {
      weeks: 2,
      reinjuryRisk: 0.25,
      variance: 1
    };
    
    const severity = this.INJURY_SEVERITIES[player.injuryStatus || 'healthy'];
    
    return {
      injuryType,
      currentStatus: player.injuryStatus || 'healthy',
      estimatedReturn: severity.weeks,
      reinjuryRisk: injuryData.reinjuryRisk,
      historicalRecovery: injuryData.weeks
    };
  }

  private inferInjuryType(player: Player): string {
    // In real implementation, would parse injury reports
    const commonInjuries = ['hamstring', 'ankle', 'knee', 'shoulder'];
    return commonInjuries[Math.floor(Math.random() * commonInjuries.length)];
  }

  private getLeagueAveragePoints(position: string): number {
    const averages = {
      QB: 18,
      RB: 12,
      WR: 10,
      TE: 8,
      K: 8,
      DEF: 8
    };
    return averages[position] || 10;
  }

  private calculatePerformanceVariance(player: Player): number {
    if (!player.recentPerformance || player.recentPerformance.length < 3) {
      return 0.5;
    }
    
    const mean = player.recentPerformance.reduce((a, b) => a + b, 0) / 
                player.recentPerformance.length;
    
    const variance = player.recentPerformance.reduce(
      (sum, score) => sum + Math.pow(score - mean, 2), 0
    ) / player.recentPerformance.length;
    
    const cv = Math.sqrt(variance) / (mean || 1);
    return Math.min(1, cv);
  }

  /**
   * Real-time injury update
   */
  async updateInjuryStatus(
    player: Player,
    newStatus: Player['injuryStatus'],
    additionalInfo?: {
      injuryType?: string;
      estimatedReturn?: number;
      severity?: 'minor' | 'moderate' | 'severe';
    }
  ): Promise<PlayerInjuryImpact> {
    // Update player status
    player.injuryStatus = newStatus;
    
    // Recalculate impact with new information
    const roster = [player]; // Would get full roster in real implementation
    return this.calculatePlayerInjuryImpact(player, roster);
  }
}

export default InjuryImpactModel;