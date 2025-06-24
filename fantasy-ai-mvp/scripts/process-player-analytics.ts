#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface PlayerStats {
  id: string;
  name: string;
  team: string;
  position: string;
  sport: string;
  recent_games: any[];
  season_stats: any;
}

async function processAnalytics() {
  try {
    console.log('Starting player analytics processing...');
    
    // Get players that need analytics updates
    const { data: players, error } = await supabase
      .from('players')
      .select('*')
      .or('analytics_updated_at.is.null,analytics_updated_at.lt.' + new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString())
      .limit(50);

    if (error) {
      console.error('Error fetching players:', error);
      process.exit(1);
    }

    if (!players || players.length === 0) {
      console.log('No players need analytics updates');
      process.exit(0);
    }

    console.log(`Processing analytics for ${players.length} players...`);

    for (const player of players) {
      try {
        // Calculate performance metrics
        const metrics = await calculatePlayerMetrics(player);
        
        // Generate AI insights
        const insights = await generateAIInsights(player, metrics);
        
        // Update player record with analytics
        const { error: updateError } = await supabase
          .from('players')
          .update({
            performance_metrics: metrics,
            ai_insights: insights,
            analytics_updated_at: new Date().toISOString(),
            trend_direction: calculateTrend(metrics),
            confidence_score: calculateConfidenceScore(metrics, insights)
          })
          .eq('id', player.id);

        if (updateError) {
          console.error(`Error updating player ${player.name}:`, updateError);
        } else {
          console.log(`✓ Processed analytics for ${player.name}`);
        }
      } catch (error) {
        console.error(`Error processing ${player.name}:`, error);
      }
    }

    console.log('Analytics processing completed');
    process.exit(0);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

async function calculatePlayerMetrics(player: any) {
  // Fetch recent game data
  const { data: recentGames } = await supabase
    .from('player_game_logs')
    .select('*')
    .eq('player_id', player.id)
    .order('game_date', { ascending: false })
    .limit(10);

  const games = recentGames || [];
  
  if (games.length === 0) {
    return {
      avg_points_last_5: 0,
      avg_points_last_10: 0,
      consistency_rating: 0,
      ceiling: 0,
      floor: 0,
      volatility: 0
    };
  }

  // Calculate metrics
  const last5Games = games.slice(0, 5);
  const points = games.map(g => g.fantasy_points || 0);
  const last5Points = last5Games.map(g => g.fantasy_points || 0);
  
  const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
  const stdDev = (arr: number[]) => {
    const mean = avg(arr);
    const squareDiffs = arr.map(value => Math.pow(value - mean, 2));
    return Math.sqrt(avg(squareDiffs));
  };

  return {
    avg_points_last_5: Math.round(avg(last5Points) * 10) / 10,
    avg_points_last_10: Math.round(avg(points) * 10) / 10,
    consistency_rating: Math.round((1 - (stdDev(points) / (avg(points) || 1))) * 100),
    ceiling: Math.max(...points),
    floor: Math.min(...points),
    volatility: Math.round(stdDev(points) * 10) / 10,
    games_played: games.length,
    last_game_points: games[0]?.fantasy_points || 0
  };
}

async function generateAIInsights(player: any, metrics: any) {
  try {
    const prompt = `
      Analyze this fantasy ${player.sport} player and provide 2-3 brief, actionable insights:
      
      Player: ${player.name} (${player.position}, ${player.team})
      Recent Performance:
      - Last 5 games avg: ${metrics.avg_points_last_5} points
      - Last 10 games avg: ${metrics.avg_points_last_10} points
      - Consistency: ${metrics.consistency_rating}%
      - Ceiling/Floor: ${metrics.ceiling}/${metrics.floor}
      - Volatility: ${metrics.volatility}
      ${player.injury_status ? `- Injury Status: ${player.injury_status}` : ''}
      
      Provide insights in JSON format: { "insights": ["insight1", "insight2", "insight3"] }
    `;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a fantasy sports analyst. Provide brief, actionable insights based on player statistics.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 200,
      response_format: { type: 'json_object' }
    });

    const response = JSON.parse(completion.choices[0].message.content || '{}');
    return response.insights || [];
  } catch (error) {
    console.error('Error generating AI insights:', error);
    return [
      `${player.name} has averaged ${metrics.avg_points_last_5} points over the last 5 games`,
      `Consistency rating: ${metrics.consistency_rating}%`
    ];
  }
}

function calculateTrend(metrics: any): 'up' | 'down' | 'stable' {
  if (!metrics.avg_points_last_5 || !metrics.avg_points_last_10) return 'stable';
  
  const recentVsOverall = metrics.avg_points_last_5 / metrics.avg_points_last_10;
  
  if (recentVsOverall > 1.1) return 'up';
  if (recentVsOverall < 0.9) return 'down';
  return 'stable';
}

function calculateConfidenceScore(metrics: any, insights: string[]): number {
  let score = 50; // Base score
  
  // More games = higher confidence
  score += Math.min(metrics.games_played * 2, 20);
  
  // Higher consistency = higher confidence
  score += metrics.consistency_rating * 0.2;
  
  // AI insights available = higher confidence
  score += insights.length * 3;
  
  // Cap at 95
  return Math.min(Math.round(score), 95);
}

processAnalytics();