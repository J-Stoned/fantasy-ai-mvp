#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const source = process.argv.find(arg => arg.startsWith('--source='))?.split('=')[1] || 'unknown';

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    totalRecords: number;
    validRecords: number;
    invalidRecords: number;
  };
}

async function validateData(): Promise<ValidationResult> {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
    stats: {
      totalRecords: 0,
      validRecords: 0,
      invalidRecords: 0
    }
  };

  try {
    // Get recently collected data (last 10 minutes)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    
    const { data: players, error } = await supabase
      .from('players')
      .select('*')
      .eq('data_source', source)
      .gte('updated_at', tenMinutesAgo);

    if (error) {
      result.valid = false;
      result.errors.push(`Failed to fetch data: ${error.message}`);
      return result;
    }

    if (!players || players.length === 0) {
      result.warnings.push(`No new data found from ${source} in the last 10 minutes`);
      return result;
    }

    result.stats.totalRecords = players.length;

    // Validate each player record
    for (const player of players) {
      const recordErrors: string[] = [];

      // Required fields validation
      if (!player.name) recordErrors.push('Missing player name');
      if (!player.team) recordErrors.push('Missing team');
      if (!player.position) recordErrors.push('Missing position');
      if (!player.sport) recordErrors.push('Missing sport');

      // Data type validation
      if (player.projection_points !== null && typeof player.projection_points !== 'number') {
        recordErrors.push('Invalid projection_points type');
      }
      if (player.actual_points !== null && typeof player.actual_points !== 'number') {
        recordErrors.push('Invalid actual_points type');
      }

      // Range validation
      if (player.projection_points !== null && (player.projection_points < 0 || player.projection_points > 100)) {
        recordErrors.push(`Projection points out of range: ${player.projection_points}`);
      }

      // Sport-specific validation
      const validPositions: Record<string, string[]> = {
        NFL: ['QB', 'RB', 'WR', 'TE', 'K', 'DEF', 'FLEX'],
        NBA: ['PG', 'SG', 'SF', 'PF', 'C', 'G', 'F', 'UTIL'],
        MLB: ['C', '1B', '2B', '3B', 'SS', 'OF', 'DH', 'SP', 'RP', 'P'],
        NHL: ['C', 'LW', 'RW', 'D', 'G', 'W', 'F', 'UTIL']
      };

      if (player.sport && validPositions[player.sport]) {
        if (!validPositions[player.sport].includes(player.position)) {
          recordErrors.push(`Invalid position ${player.position} for sport ${player.sport}`);
        }
      }

      if (recordErrors.length > 0) {
        result.stats.invalidRecords++;
        result.errors.push(`Player ${player.name}: ${recordErrors.join(', ')}`);
      } else {
        result.stats.validRecords++;
      }
    }

    // Check data freshness
    const { data: latestUpdate } = await supabase
      .from('players')
      .select('updated_at')
      .eq('data_source', source)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (latestUpdate) {
      const lastUpdateTime = new Date(latestUpdate.updated_at);
      const timeSinceUpdate = Date.now() - lastUpdateTime.getTime();
      
      if (timeSinceUpdate > 15 * 60 * 1000) { // 15 minutes
        result.warnings.push(`Data from ${source} is stale (last update: ${lastUpdateTime.toISOString()})`);
      }
    }

    // Set overall validity
    result.valid = result.errors.length === 0;

    return result;
  } catch (error) {
    result.valid = false;
    result.errors.push(`Unexpected error: ${error}`);
    return result;
  }
}

async function main() {
  console.log(`Validating data from ${source}...`);
  
  const validation = await validateData();
  
  console.log('\nValidation Results:');
  console.log(`Valid: ${validation.valid}`);
  console.log(`Total Records: ${validation.stats.totalRecords}`);
  console.log(`Valid Records: ${validation.stats.validRecords}`);
  console.log(`Invalid Records: ${validation.stats.invalidRecords}`);
  
  if (validation.errors.length > 0) {
    console.error('\nErrors:');
    validation.errors.forEach(error => console.error(`  - ${error}`));
  }
  
  if (validation.warnings.length > 0) {
    console.warn('\nWarnings:');
    validation.warnings.forEach(warning => console.warn(`  - ${warning}`));
  }
  
  // Store validation results
  await supabase
    .from('data_validation_logs')
    .insert({
      source,
      valid: validation.valid,
      total_records: validation.stats.totalRecords,
      valid_records: validation.stats.validRecords,
      invalid_records: validation.stats.invalidRecords,
      errors: validation.errors,
      warnings: validation.warnings,
      created_at: new Date().toISOString()
    });
  
  process.exit(validation.valid ? 0 : 1);
}

main();