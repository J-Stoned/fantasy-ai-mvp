#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function updateProjections() {
  try {
    console.log('Updating player projections...');
    
    // Get upcoming games and matchups
    const { data: upcomingGames, error: gamesError } = await supabase
      .from('upcoming_games')
      .select('*')
      .gte('game_date', new Date().toISOString())
      .lte('game_date', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('game_date');

    if (gamesError) {
      console.error('Error fetching games:', gamesError);
      process.exit(1);
    }

    // Get players who need projection updates
    const { data: players, error: playersError } = await supabase
      .from('players')
      .select('*')
      .or('projections_updated_at.is.null,projections_updated_at.lt.' + new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString())
      .limit(100);

    if (playersError) {
      console.error('Error fetching players:', playersError);
      process.exit(1);
    }

    if (!players || players.length === 0) {
      console.log('No players need projection updates');
      process.exit(0);
    }

    console.log(`Updating projections for ${players.length} players...`);

    for (const player of players) {
      try {
        // Find player's upcoming game
        const nextGame = upcomingGames?.find(game => 
          game.home_team === player.team || game.away_team === player.team
        );

        // Calculate base projection
        const baseProjection = await calculateBaseProjection(player);
        
        // Apply matchup adjustments
        const matchupAdjustment = nextGame ? 
          await calculateMatchupAdjustment(player, nextGame) : 1.0;
        
        // Apply AI-powered adjustments
        const aiAdjustment = await getAIProjectionAdjustment(player, nextGame);
        
        // Calculate final projection
        const finalProjection = baseProjection * matchupAdjustment * aiAdjustment;
        
        // Generate projection breakdown
        const breakdown = {
          base: Math.round(baseProjection * 10) / 10,
          matchup_factor: Math.round(matchupAdjustment * 100) / 100,
          ai_factor: Math.round(aiAdjustment * 100) / 100,
          final: Math.round(finalProjection * 10) / 10,
          confidence: calculateProjectionConfidence(player, nextGame)
        };

        // Update player projections
        const { error: updateError } = await supabase
          .from('players')
          .update({
            projection_points: breakdown.final,
            projection_breakdown: breakdown,
            next_game_date: nextGame?.game_date || null,
            next_opponent: nextGame ? 
              (nextGame.home_team === player.team ? nextGame.away_team : nextGame.home_team) : null,
            projections_updated_at: new Date().toISOString()
          })
          .eq('id', player.id);

        if (updateError) {
          console.error(`Error updating projections for ${player.name}:`, updateError);
        } else {
          console.log(`✓ Updated projection for ${player.name}: ${breakdown.final} pts`);
        }
      } catch (error) {
        console.error(`Error processing ${player.name}:`, error);
      }
    }

    console.log('Projection updates completed');
    process.exit(0);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

async function calculateBaseProjection(player: any): Promise<number> {
  // Get player's recent performance
  const { data: recentGames } = await supabase
    .from('player_game_logs')
    .select('fantasy_points')
    .eq('player_id', player.id)
    .order('game_date', { ascending: false })
    .limit(10);

  if (!recentGames || recentGames.length === 0) {
    // Use position average if no history
    const positionAverages: Record<string, number> = {
      QB: 18, RB: 12, WR: 10, TE: 8, K: 8, DEF: 8,
      PG: 35, SG: 30, SF: 28, PF: 28, C: 32,
      C: 15, '1B': 12, '2B': 10, '3B': 10, SS: 11, OF: 10,
      C: 20, LW: 18, RW: 18, D: 15, G: 22
    };
    return positionAverages[player.position] || 10;
  }

  // Calculate weighted average (recent games weighted more)
  const weights = [0.25, 0.20, 0.15, 0.10, 0.08, 0.07, 0.05, 0.04, 0.03, 0.03];
  let weightedSum = 0;
  let totalWeight = 0;
  
  recentGames.forEach((game, index) => {
    if (index < weights.length && game.fantasy_points !== null) {
      weightedSum += game.fantasy_points * weights[index];
      totalWeight += weights[index];
    }
  });

  return totalWeight > 0 ? weightedSum / totalWeight : 10;
}

async function calculateMatchupAdjustment(player: any, game: any): Promise<number> {
  const opponent = game.home_team === player.team ? game.away_team : game.home_team;
  const isHome = game.home_team === player.team;
  
  // Get opponent defensive stats
  const { data: defenseStats } = await supabase
    .from('team_defense_stats')
    .select('*')
    .eq('team', opponent)
    .eq('sport', player.sport)
    .single();

  let adjustment = 1.0;
  
  // Home/away adjustment
  adjustment *= isHome ? 1.03 : 0.97;
  
  // Defense ranking adjustment
  if (defenseStats) {
    const defenseRank = defenseStats.position_ranks?.[player.position] || 16;
    // Top defenses (1-8) reduce projections, bottom defenses (24-32) increase
    adjustment *= 1.0 + ((16 - defenseRank) * 0.02);
  }
  
  // Weather adjustment for outdoor sports
  if (game.weather && ['NFL', 'MLB'].includes(player.sport)) {
    if (game.weather.includes('rain') || game.weather.includes('snow')) {
      adjustment *= 0.92;
    }
    if (game.weather.includes('wind') && parseInt(game.wind_speed) > 20) {
      adjustment *= player.position === 'K' ? 0.85 : 0.95;
    }
  }
  
  return Math.max(0.7, Math.min(1.3, adjustment));
}

async function getAIProjectionAdjustment(player: any, game: any): Promise<number> {
  try {
    const context = `
      Player: ${player.name} (${player.position}, ${player.team})
      Recent avg: ${player.performance_metrics?.avg_points_last_5 || 'N/A'}
      ${game ? `Next game: vs ${game.home_team === player.team ? game.away_team : game.home_team}` : 'No upcoming game'}
      ${player.injury_status ? `Injury: ${player.injury_status}` : ''}
      ${player.notes ? `Notes: ${player.notes}` : ''}
    `;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a fantasy sports projection expert. Return only a number between 0.8 and 1.2 representing a projection adjustment factor.'
        },
        {
          role: 'user',
          content: `Based on this context, provide a projection adjustment factor:\n${context}`
        }
      ],
      temperature: 0.3,
      max_tokens: 10
    });

    const factor = parseFloat(completion.choices[0].message.content || '1.0');
    return isNaN(factor) ? 1.0 : Math.max(0.8, Math.min(1.2, factor));
  } catch (error) {
    console.error('AI adjustment error:', error);
    return 1.0;
  }
}

function calculateProjectionConfidence(player: any, game: any): number {
  let confidence = 70; // Base confidence
  
  // More recent games = higher confidence
  if (player.performance_metrics?.games_played) {
    confidence += Math.min(player.performance_metrics.games_played, 10);
  }
  
  // Lower volatility = higher confidence
  if (player.performance_metrics?.volatility) {
    confidence -= Math.min(player.performance_metrics.volatility * 2, 20);
  }
  
  // Injury reduces confidence
  if (player.injury_status && player.injury_status !== 'Healthy') {
    confidence -= 15;
  }
  
  // No upcoming game reduces confidence
  if (!game) {
    confidence -= 10;
  }
  
  return Math.max(40, Math.min(95, Math.round(confidence)));
}

updateProjections();