#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const source = process.argv.find(arg => arg.startsWith('--source='))?.split('=')[1] || 'unknown';

const RATE_LIMITS = {
  espn: { requests: 100, window: 60 }, // 100 requests per minute
  yahoo: { requests: 60, window: 60 },  // 60 requests per minute
  cbs: { requests: 50, window: 60 },    // 50 requests per minute
  draftkings: { requests: 30, window: 60 }, // 30 requests per minute
  fanduel: { requests: 30, window: 60 },    // 30 requests per minute
  official: { requests: 120, window: 60 }   // 120 requests per minute
};

async function checkRateLimit() {
  try {
    const limit = RATE_LIMITS[source as keyof typeof RATE_LIMITS];
    if (!limit) {
      console.log(`No rate limit defined for source: ${source}`);
      process.exit(0);
    }

    // Check recent requests from rate_limit_tracker table
    const windowStart = new Date(Date.now() - limit.window * 1000).toISOString();
    
    const { data, error } = await supabase
      .from('rate_limit_tracker')
      .select('count')
      .eq('source', source)
      .gte('created_at', windowStart);

    if (error) {
      console.error('Error checking rate limits:', error);
      // Create table if it doesn't exist
      if (error.code === '42P01') {
        await supabase.rpc('create_rate_limit_table');
        process.exit(0);
      }
      process.exit(1);
    }

    const requestCount = data?.reduce((sum, row) => sum + (row.count || 0), 0) || 0;
    
    if (requestCount >= limit.requests) {
      console.error(`Rate limit exceeded for ${source}: ${requestCount}/${limit.requests} requests in last ${limit.window}s`);
      process.exit(1);
    }

    console.log(`Rate limit OK for ${source}: ${requestCount}/${limit.requests} requests used`);
    
    // Record this check
    await supabase
      .from('rate_limit_tracker')
      .insert({ source, count: 1, created_at: new Date().toISOString() });
    
    process.exit(0);
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

checkRateLimit();