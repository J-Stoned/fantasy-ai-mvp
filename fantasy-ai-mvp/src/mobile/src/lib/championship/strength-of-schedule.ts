/**
 * Strength of Schedule Analyzer
 * 
 * Analyzes remaining and past schedules to determine difficulty
 * and impact on championship probability.
 */

import { Team, MatchupSchedule } from './championship-engine';

export interface ScheduleStrength {
  overall: number; // -1 (hardest) to 1 (easiest)
  past: number;
  remaining: number;
  playoffSchedule: number;
  weekByWeek: WeekStrength[];
  toughestStretch: ScheduleStretch;
  easiestStretch: ScheduleStretch;
  divisionGames: number;
  homeGames: number;
  primetime: number;
  backToBack: BackToBackAnalysis;
}

export interface WeekStrength {
  week: number;
  opponentRank: number;
  difficulty: number;
  isHome: boolean;
  isDivision: boolean;
  restDays: number;
  factors: string[];
}

export interface ScheduleStretch {
  startWeek: number;
  endWeek: number;
  avgDifficulty: number;
  opponents: string[];
  description: string;
}

export interface BackToBackAnalysis {
  toughGames: number; // Consecutive games vs top teams
  easyGames: number; // Consecutive games vs bottom teams
  roadTrips: number; // Consecutive away games
  divisionStretches: number;
}

export class StrengthOfScheduleAnalyzer {
  private readonly TOP_TEAM_THRESHOLD = 0.3; // Top 30% of teams
  private readonly BOTTOM_TEAM_THRESHOLD = 0.7; // Bottom 30% of teams
  private readonly HOME_ADVANTAGE = 0.03;
  private readonly DIVISION_FACTOR = 1.1; // Division games are harder
  private readonly REST_ADVANTAGE_DAYS = 3;

  /**
   * Analyze team's schedule strength
   */
  analyze(
    team: Team,
    allTeams: Team[],
    currentWeek: number
  ): number {
    const strength = this.calculateFullScheduleStrength(
      team,
      allTeams,
      currentWeek
    );
    return strength.overall;
  }

  /**
   * Calculate comprehensive schedule strength
   */
  calculateFullScheduleStrength(
    team: Team,
    allTeams: Team[],
    currentWeek: number
  ): ScheduleStrength {
    const weekByWeek = this.analyzeWeekByWeek(team, allTeams);
    const past = this.calculatePastStrength(weekByWeek, currentWeek);
    const remaining = this.calculateRemainingStrength(weekByWeek, currentWeek);
    const playoffSchedule = this.calculatePlayoffScheduleStrength(
      team,
      allTeams,
      currentWeek
    );

    const stretches = this.findScheduleStretches(weekByWeek);
    const backToBack = this.analyzeBackToBack(weekByWeek, team);

    const divisionGames = team.schedule.filter(m => 
      this.isDivisionGame(team, m, allTeams)
    ).length;

    const homeGames = team.schedule.filter(m => m.isHome).length;
    const primetime = this.countPrimetimeGames(team.schedule);

    const overall = (past * currentWeek + remaining * (14 - currentWeek)) / 14;

    return {
      overall,
      past,
      remaining,
      playoffSchedule,
      weekByWeek,
      toughestStretch: stretches.toughest,
      easiestStretch: stretches.easiest,
      divisionGames,
      homeGames,
      primetime,
      backToBack
    };
  }

  /**
   * Analyze strength week by week
   */
  private analyzeWeekByWeek(
    team: Team,
    allTeams: Team[]
  ): WeekStrength[] {
    return team.schedule.map((matchup, index) => {
      const opponent = allTeams.find(t => t.id === matchup.opponentId);
      if (!opponent) {
        return {
          week: matchup.week,
          opponentRank: allTeams.length / 2,
          difficulty: 0,
          isHome: matchup.isHome,
          isDivision: false,
          restDays: 7,
          factors: ['Unknown opponent']
        };
      }

      const opponentRank = this.getTeamRank(opponent, allTeams);
      const difficulty = this.calculateMatchupDifficulty(
        team,
        opponent,
        matchup,
        allTeams
      );

      const isDivision = this.isDivisionGame(team, matchup, allTeams);
      const restDays = this.calculateRestDays(team.schedule, index);
      const factors = this.identifyDifficultyFactors(
        team,
        opponent,
        matchup,
        allTeams
      );

      return {
        week: matchup.week,
        opponentRank,
        difficulty,
        isHome: matchup.isHome,
        isDivision,
        restDays,
        factors
      };
    });
  }

  /**
   * Calculate matchup difficulty
   */
  private calculateMatchupDifficulty(
    team: Team,
    opponent: Team,
    matchup: MatchupSchedule,
    allTeams: Team[]
  ): number {
    let difficulty = 0;

    // Base difficulty from opponent rank
    const opponentStrength = this.getTeamStrength(opponent, allTeams);
    difficulty += opponentStrength;

    // Home/away adjustment
    if (!matchup.isHome) {
      difficulty += this.HOME_ADVANTAGE;
    }

    // Division game adjustment
    if (this.isDivisionGame(team, matchup, allTeams)) {
      difficulty *= this.DIVISION_FACTOR;
    }

    // Historical matchup data
    const h2hRecord = this.getHeadToHeadRecord(team, opponent);
    if (h2hRecord.total > 0) {
      const winRate = h2hRecord.wins / h2hRecord.total;
      difficulty += (0.5 - winRate) * 0.2; // Adjust based on historical success
    }

    // Style matchup
    const styleAdvantage = this.calculateStyleMatchup(team, opponent);
    difficulty += styleAdvantage;

    // Normalize to -1 to 1 scale
    return Math.max(-1, Math.min(1, difficulty));
  }

  /**
   * Get team strength rating
   */
  private getTeamStrength(team: Team, allTeams: Team[]): number {
    const rank = this.getTeamRank(team, allTeams);
    const totalTeams = allTeams.length;
    
    // Convert rank to strength (1st = 1.0, last = 0.0)
    const strength = 1 - ((rank - 1) / (totalTeams - 1));
    
    // Adjust for point differential
    const avgPointDiff = (team.pointsFor - team.pointsAgainst) / 
      (team.record.wins + team.record.losses);
    const diffBonus = avgPointDiff / 100; // Scale appropriately
    
    return Math.max(0, Math.min(1, strength + diffBonus));
  }

  /**
   * Get team rank
   */
  private getTeamRank(team: Team, allTeams: Team[]): number {
    const sorted = [...allTeams].sort((a, b) => {
      const aWinPct = a.record.wins / (a.record.wins + a.record.losses);
      const bWinPct = b.record.wins / (b.record.wins + b.record.losses);
      
      if (aWinPct !== bWinPct) {
        return bWinPct - aWinPct;
      }
      
      return b.pointsFor - a.pointsFor;
    });
    
    return sorted.findIndex(t => t.id === team.id) + 1;
  }

  /**
   * Calculate past schedule strength
   */
  private calculatePastStrength(
    weekByWeek: WeekStrength[],
    currentWeek: number
  ): number {
    const pastWeeks = weekByWeek.filter(w => w.week <= currentWeek);
    if (pastWeeks.length === 0) return 0;
    
    const avgDifficulty = pastWeeks.reduce(
      (sum, week) => sum + week.difficulty,
      0
    ) / pastWeeks.length;
    
    return avgDifficulty;
  }

  /**
   * Calculate remaining schedule strength
   */
  private calculateRemainingStrength(
    weekByWeek: WeekStrength[],
    currentWeek: number
  ): number {
    const futureWeeks = weekByWeek.filter(w => w.week > currentWeek);
    if (futureWeeks.length === 0) return 0;
    
    const avgDifficulty = futureWeeks.reduce(
      (sum, week) => sum + week.difficulty,
      0
    ) / futureWeeks.length;
    
    // Weight later weeks more heavily (playoff implications)
    const weightedDifficulty = futureWeeks.reduce((sum, week, index) => {
      const weight = 1 + (index / futureWeeks.length) * 0.5;
      return sum + week.difficulty * weight;
    }, 0) / futureWeeks.reduce((sum, _, index) => 
      sum + 1 + (index / futureWeeks.length) * 0.5, 0
    );
    
    return weightedDifficulty;
  }

  /**
   * Calculate playoff schedule strength
   */
  private calculatePlayoffScheduleStrength(
    team: Team,
    allTeams: Team[],
    currentWeek: number
  ): number {
    // Weeks 15-17 are typically playoffs
    const playoffWeeks = [15, 16, 17];
    const playoffMatchups = team.schedule.filter(m => 
      playoffWeeks.includes(m.week) && m.week > currentWeek
    );
    
    if (playoffMatchups.length === 0) return 0;
    
    const playoffDifficulty = playoffMatchups.reduce((sum, matchup) => {
      const opponent = allTeams.find(t => t.id === matchup.opponentId);
      if (!opponent) return sum;
      
      return sum + this.calculateMatchupDifficulty(
        team,
        opponent,
        matchup,
        allTeams
      );
    }, 0) / playoffMatchups.length;
    
    return playoffDifficulty;
  }

  /**
   * Find toughest and easiest stretches
   */
  private findScheduleStretches(
    weekByWeek: WeekStrength[]
  ): { toughest: ScheduleStretch; easiest: ScheduleStretch } {
    let toughest: ScheduleStretch = {
      startWeek: 1,
      endWeek: 1,
      avgDifficulty: -1,
      opponents: [],
      description: ''
    };
    
    let easiest: ScheduleStretch = {
      startWeek: 1,
      endWeek: 1,
      avgDifficulty: 1,
      opponents: [],
      description: ''
    };
    
    // Check all possible 3-week stretches
    for (let i = 0; i <= weekByWeek.length - 3; i++) {
      const stretch = weekByWeek.slice(i, i + 3);
      const avgDifficulty = stretch.reduce(
        (sum, week) => sum + week.difficulty,
        0
      ) / 3;
      
      if (avgDifficulty > toughest.avgDifficulty) {
        toughest = {
          startWeek: stretch[0].week,
          endWeek: stretch[2].week,
          avgDifficulty,
          opponents: stretch.map(w => `Rank ${w.opponentRank}`),
          description: this.describeStretch(stretch, 'tough')
        };
      }
      
      if (avgDifficulty < easiest.avgDifficulty) {
        easiest = {
          startWeek: stretch[0].week,
          endWeek: stretch[2].week,
          avgDifficulty,
          opponents: stretch.map(w => `Rank ${w.opponentRank}`),
          description: this.describeStretch(stretch, 'easy')
        };
      }
    }
    
    return { toughest, easiest };
  }

  /**
   * Analyze back-to-back games
   */
  private analyzeBackToBack(
    weekByWeek: WeekStrength[],
    team: Team
  ): BackToBackAnalysis {
    let toughGames = 0;
    let easyGames = 0;
    let roadTrips = 0;
    let divisionStretches = 0;
    
    let currentTough = 0;
    let currentEasy = 0;
    let currentRoad = 0;
    let currentDivision = 0;
    
    for (const week of weekByWeek) {
      // Tough games
      if (week.difficulty > 0.5) {
        currentTough++;
        toughGames = Math.max(toughGames, currentTough);
      } else {
        currentTough = 0;
      }
      
      // Easy games
      if (week.difficulty < -0.5) {
        currentEasy++;
        easyGames = Math.max(easyGames, currentEasy);
      } else {
        currentEasy = 0;
      }
      
      // Road trips
      if (!week.isHome) {
        currentRoad++;
        roadTrips = Math.max(roadTrips, currentRoad);
      } else {
        currentRoad = 0;
      }
      
      // Division stretches
      if (week.isDivision) {
        currentDivision++;
        divisionStretches = Math.max(divisionStretches, currentDivision);
      } else {
        currentDivision = 0;
      }
    }
    
    return {
      toughGames,
      easyGames,
      roadTrips,
      divisionStretches
    };
  }

  /**
   * Helper methods
   */
  private isDivisionGame(
    team: Team,
    matchup: MatchupSchedule,
    allTeams: Team[]
  ): boolean {
    const opponent = allTeams.find(t => t.id === matchup.opponentId);
    return opponent?.divisionId === team.divisionId;
  }

  private calculateRestDays(
    schedule: MatchupSchedule[],
    currentIndex: number
  ): number {
    if (currentIndex === 0) return 7;
    
    const currentWeek = schedule[currentIndex].week;
    const previousWeek = schedule[currentIndex - 1].week;
    
    return (currentWeek - previousWeek) * 7;
  }

  private identifyDifficultyFactors(
    team: Team,
    opponent: Team,
    matchup: MatchupSchedule,
    allTeams: Team[]
  ): string[] {
    const factors: string[] = [];
    
    const opponentRank = this.getTeamRank(opponent, allTeams);
    if (opponentRank <= allTeams.length * this.TOP_TEAM_THRESHOLD) {
      factors.push('Elite opponent');
    }
    
    if (!matchup.isHome) {
      factors.push('Away game');
    }
    
    if (this.isDivisionGame(team, matchup, allTeams)) {
      factors.push('Division rival');
    }
    
    if (matchup.weatherConditions && !matchup.weatherConditions.dome) {
      if (matchup.weatherConditions.temperature < 32) {
        factors.push('Cold weather');
      }
      if (matchup.weatherConditions.windSpeed > 20) {
        factors.push('High winds');
      }
    }
    
    return factors;
  }

  private getHeadToHeadRecord(
    team: Team,
    opponent: Team
  ): { wins: number; losses: number; total: number } {
    // This would typically query historical data
    // For now, return mock data
    return { wins: 5, losses: 3, total: 8 };
  }

  private calculateStyleMatchup(team: Team, opponent: Team): number {
    // Analyze how team's style matches up against opponent
    // This is simplified - real implementation would analyze:
    // - Pass vs run tendencies
    // - Defensive strengths/weaknesses
    // - Pace of play
    // - Home/away performance splits
    
    return Math.random() * 0.2 - 0.1; // -0.1 to 0.1
  }

  private countPrimetimeGames(schedule: MatchupSchedule[]): number {
    // Count Thursday, Sunday night, Monday night games
    // This would check actual game times in real implementation
    return Math.floor(schedule.length * 0.15); // Estimate 15% primetime
  }

  private describeStretch(
    stretch: WeekStrength[],
    type: 'tough' | 'easy'
  ): string {
    const avgRank = stretch.reduce(
      (sum, week) => sum + week.opponentRank,
      0
    ) / stretch.length;
    
    const roadGames = stretch.filter(w => !w.isHome).length;
    const divGames = stretch.filter(w => w.isDivision).length;
    
    let desc = `${type === 'tough' ? 'Difficult' : 'Favorable'} stretch: `;
    desc += `Avg opponent rank ${avgRank.toFixed(1)}`;
    
    if (roadGames > 1) {
      desc += `, ${roadGames} road games`;
    }
    
    if (divGames > 1) {
      desc += `, ${divGames} division games`;
    }
    
    return desc;
  }
}

export default StrengthOfScheduleAnalyzer;