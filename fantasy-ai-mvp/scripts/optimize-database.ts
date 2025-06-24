#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function optimizeDatabase() {
  try {
    console.log('Starting database optimization...');
    
    const optimizations = [
      {
        name: 'Update statistics',
        query: `
          ANALYZE players;
          ANALYZE player_game_logs;
          ANALYZE upcoming_games;
          ANALYZE leagues;
          ANALYZE user_leagues;
        `
      },
      {
        name: 'Create missing indexes',
        query: `
          CREATE INDEX IF NOT EXISTS idx_players_sport_position 
            ON players(sport, position);
          CREATE INDEX IF NOT EXISTS idx_players_team 
            ON players(team);
          CREATE INDEX IF NOT EXISTS idx_players_updated 
            ON players(updated_at DESC);
          CREATE INDEX IF NOT EXISTS idx_game_logs_player_date 
            ON player_game_logs(player_id, game_date DESC);
          CREATE INDEX IF NOT EXISTS idx_upcoming_games_date 
            ON upcoming_games(game_date);
          CREATE INDEX IF NOT EXISTS idx_user_leagues_user 
            ON user_leagues(user_id);
        `
      },
      {
        name: 'Remove duplicate indexes',
        query: `
          -- Identify and drop duplicate indexes
          DO $$
          DECLARE
            dup RECORD;
          BEGIN
            FOR dup IN 
              SELECT indexname 
              FROM pg_indexes 
              WHERE schemaname = 'public' 
              AND indexname LIKE '%_1' 
              OR indexname LIKE '%_2'
            LOOP
              EXECUTE 'DROP INDEX IF EXISTS ' || quote_ident(dup.indexname);
            END LOOP;
          END $$;
        `
      },
      {
        name: 'Vacuum tables',
        query: `
          VACUUM ANALYZE players;
          VACUUM ANALYZE player_game_logs;
          VACUUM ANALYZE upcoming_games;
        `
      },
      {
        name: 'Update table statistics',
        query: `
          -- Update pg_class statistics for better query planning
          UPDATE pg_class 
          SET reltuples = (SELECT COUNT(*) FROM players) 
          WHERE relname = 'players';
          
          UPDATE pg_class 
          SET reltuples = (SELECT COUNT(*) FROM player_game_logs) 
          WHERE relname = 'player_game_logs';
        `
      },
      {
        name: 'Create materialized views for common queries',
        query: `
          -- Player rankings by position
          CREATE MATERIALIZED VIEW IF NOT EXISTS mv_player_rankings AS
          SELECT 
            p.id,
            p.name,
            p.team,
            p.position,
            p.sport,
            p.projection_points,
            RANK() OVER (PARTITION BY p.sport, p.position ORDER BY p.projection_points DESC) as position_rank,
            RANK() OVER (PARTITION BY p.sport ORDER BY p.projection_points DESC) as overall_rank
          FROM players p
          WHERE p.projection_points IS NOT NULL;
          
          CREATE INDEX IF NOT EXISTS idx_mv_rankings_sport_pos 
            ON mv_player_rankings(sport, position);
        `
      },
      {
        name: 'Optimize query cache',
        query: `
          -- Reset query statistics
          SELECT pg_stat_reset();
          
          -- Configure work_mem for better sorting
          SET work_mem = '256MB';
          
          -- Configure shared_buffers cache
          -- Note: This requires superuser privileges
          -- SET shared_buffers = '1GB';
        `
      }
    ];
    
    const results = [];
    
    for (const optimization of optimizations) {
      console.log(`\nRunning: ${optimization.name}...`);
      const startTime = Date.now();
      
      try {
        const { error } = await supabase.rpc('exec_sql', {
          query: optimization.query
        });
        
        if (error) {
          console.error(`Error in ${optimization.name}:`, error);
          results.push({
            optimization: optimization.name,
            status: 'failed',
            error: error.message,
            duration: Date.now() - startTime
          });
        } else {
          const duration = Date.now() - startTime;
          console.log(`✓ ${optimization.name} completed in ${duration}ms`);
          results.push({
            optimization: optimization.name,
            status: 'success',
            duration
          });
        }
      } catch (error) {
        console.error(`Exception in ${optimization.name}:`, error);
        results.push({
          optimization: optimization.name,
          status: 'error',
          error: String(error),
          duration: Date.now() - startTime
        });
      }
    }
    
    // Refresh materialized views
    console.log('\nRefreshing materialized views...');
    await supabase.rpc('exec_sql', {
      query: 'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_player_rankings;'
    });
    
    // Get database size and performance metrics
    const { data: dbStats } = await supabase.rpc('get_database_stats');
    
    console.log('\n=== Optimization Summary ===');
    console.log(`Total optimizations: ${results.length}`);
    console.log(`Successful: ${results.filter(r => r.status === 'success').length}`);
    console.log(`Failed: ${results.filter(r => r.status !== 'success').length}`);
    
    if (dbStats) {
      console.log('\n=== Database Statistics ===');
      console.log(`Database size: ${dbStats.database_size}`);
      console.log(`Total connections: ${dbStats.connections}`);
      console.log(`Cache hit ratio: ${dbStats.cache_hit_ratio}%`);
    }
    
    // Log optimization results
    await supabase
      .from('maintenance_logs')
      .insert({
        operation: 'database_optimization',
        details: results,
        completed_at: new Date().toISOString()
      });
    
    console.log('\nDatabase optimization completed!');
    
  } catch (error) {
    console.error('Fatal error during optimization:', error);
    process.exit(1);
  }
}

// Create helper functions if they don't exist
async function createHelperFunctions() {
  await supabase.rpc('exec_sql', {
    query: `
      -- Function to execute arbitrary SQL (for admin use)
      CREATE OR REPLACE FUNCTION exec_sql(query TEXT)
      RETURNS VOID AS $$
      BEGIN
        EXECUTE query;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
      
      -- Function to get database statistics
      CREATE OR REPLACE FUNCTION get_database_stats()
      RETURNS TABLE (
        database_size TEXT,
        connections INTEGER,
        cache_hit_ratio NUMERIC
      ) AS $$
      BEGIN
        RETURN QUERY
        SELECT 
          pg_size_pretty(pg_database_size(current_database())) as database_size,
          COUNT(*)::INTEGER as connections,
          ROUND(100.0 * SUM(blks_hit) / NULLIF(SUM(blks_hit + blks_read), 0), 2) as cache_hit_ratio
        FROM pg_stat_database
        WHERE datname = current_database()
        GROUP BY datname;
      END;
      $$ LANGUAGE plpgsql;
    `
  }).catch(() => {
    console.log('Helper functions may already exist');
  });
}

createHelperFunctions().then(() => optimizeDatabase());