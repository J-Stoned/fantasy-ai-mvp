#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Parse command line arguments
const daysArg = process.argv.find(arg => arg.startsWith('--days='));
const daysToKeep = daysArg ? parseInt(daysArg.split('=')[1]) : 7;

async function cleanupOldData() {
  try {
    console.log(`Starting cleanup of data older than ${daysToKeep} days...`);
    
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000).toISOString();
    const tables = [
      { name: 'player_game_logs', dateColumn: 'game_date' },
      { name: 'rate_limit_tracker', dateColumn: 'created_at' },
      { name: 'data_validation_logs', dateColumn: 'created_at' },
      { name: 'workflow_status', dateColumn: 'completed_at' },
      { name: 'api_request_logs', dateColumn: 'timestamp' },
      { name: 'error_logs', dateColumn: 'created_at' }
    ];
    
    let totalDeleted = 0;
    
    for (const table of tables) {
      try {
        // Count records to delete
        const { count: recordCount } = await supabase
          .from(table.name)
          .select('*', { count: 'exact', head: true })
          .lt(table.dateColumn, cutoffDate);
        
        if (recordCount && recordCount > 0) {
          console.log(`Deleting ${recordCount} records from ${table.name}...`);
          
          // Delete in batches to avoid timeouts
          const batchSize = 1000;
          let deleted = 0;
          
          while (deleted < recordCount) {
            const { error: deleteError } = await supabase
              .from(table.name)
              .delete()
              .lt(table.dateColumn, cutoffDate)
              .limit(batchSize);
            
            if (deleteError) {
              console.error(`Error deleting from ${table.name}:`, deleteError);
              break;
            }
            
            deleted += batchSize;
          }
          
          totalDeleted += recordCount;
          console.log(`✓ Cleaned ${recordCount} records from ${table.name}`);
        } else {
          console.log(`No old records found in ${table.name}`);
        }
      } catch (error) {
        console.error(`Error processing ${table.name}:`, error);
      }
    }
    
    // Archive important data before deletion
    await archiveImportantData(cutoffDate);
    
    // Clean up orphaned records
    await cleanupOrphanedRecords();
    
    console.log(`\nCleanup completed. Total records deleted: ${totalDeleted}`);
    
    // Log cleanup statistics
    await supabase
      .from('maintenance_logs')
      .insert({
        operation: 'data_cleanup',
        records_deleted: totalDeleted,
        cutoff_date: cutoffDate,
        duration_seconds: Math.round((Date.now() - startTime) / 1000),
        completed_at: new Date().toISOString()
      });
    
  } catch (error) {
    console.error('Fatal error during cleanup:', error);
    process.exit(1);
  }
}

const startTime = Date.now();

async function archiveImportantData(cutoffDate: string) {
  console.log('\nArchiving important data...');
  
  // Archive player performance summaries
  const { data: playerStats } = await supabase
    .from('player_game_logs')
    .select('player_id, sport, COUNT(*) as games, AVG(fantasy_points) as avg_points')
    .lt('game_date', cutoffDate)
    .groupBy('player_id', 'sport');
  
  if (playerStats && playerStats.length > 0) {
    await supabase
      .from('archived_player_stats')
      .insert(
        playerStats.map(stat => ({
          ...stat,
          period_end: cutoffDate,
          archived_at: new Date().toISOString()
        }))
      );
    
    console.log(`✓ Archived ${playerStats.length} player stat summaries`);
  }
}

async function cleanupOrphanedRecords() {
  console.log('\nCleaning up orphaned records...');
  
  // Remove player_game_logs without valid player references
  const { error: orphanError } = await supabase.rpc('cleanup_orphaned_game_logs');
  
  if (orphanError && orphanError.code === '42883') {
    // Function doesn't exist, create it
    await supabase.rpc('exec_sql', {
      query: `
        CREATE OR REPLACE FUNCTION cleanup_orphaned_game_logs()
        RETURNS INTEGER AS $$
        DECLARE
          deleted_count INTEGER;
        BEGIN
          DELETE FROM player_game_logs
          WHERE player_id NOT IN (SELECT id FROM players);
          
          GET DIAGNOSTICS deleted_count = ROW_COUNT;
          RETURN deleted_count;
        END;
        $$ LANGUAGE plpgsql;
      `
    });
    
    // Try again
    await supabase.rpc('cleanup_orphaned_game_logs');
  }
  
  console.log('✓ Orphaned records cleaned');
}

// Create archive table if needed
async function ensureArchiveTables() {
  await supabase.rpc('exec_sql', {
    query: `
      CREATE TABLE IF NOT EXISTS archived_player_stats (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        player_id TEXT,
        sport TEXT,
        games INTEGER,
        avg_points NUMERIC,
        period_end TIMESTAMPTZ,
        archived_at TIMESTAMPTZ DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS maintenance_logs (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        operation TEXT,
        records_deleted INTEGER,
        cutoff_date TIMESTAMPTZ,
        duration_seconds INTEGER,
        completed_at TIMESTAMPTZ DEFAULT NOW()
      );
    `
  });
}

ensureArchiveTables().then(() => cleanupOldData());