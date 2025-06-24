#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Parse command line arguments
const args = process.argv.slice(2);
const status = args.find(arg => arg.startsWith('--status='))?.split('=')[1] || 'unknown';
const runId = args.find(arg => arg.startsWith('--run-id='))?.split('=')[1] || '';
const runNumber = args.find(arg => arg.startsWith('--run-number='))?.split('=')[1] || '';

async function updateDashboard() {
  try {
    console.log(`Updating status dashboard: ${status}`);
    
    // Calculate metrics
    const endTime = new Date();
    const duration = process.env.GITHUB_RUN_STARTED_AT ? 
      (endTime.getTime() - new Date(process.env.GITHUB_RUN_STARTED_AT).getTime()) / 1000 : 0;
    
    // Get data collection stats
    const { data: recentData } = await supabase
      .from('players')
      .select('data_source, sport')
      .gte('updated_at', new Date(Date.now() - 10 * 60 * 1000).toISOString());
    
    const dataStats = recentData?.reduce((acc, item) => {
      acc.total++;
      acc.sources[item.data_source] = (acc.sources[item.data_source] || 0) + 1;
      acc.sports[item.sport] = (acc.sports[item.sport] || 0) + 1;
      return acc;
    }, { total: 0, sources: {}, sports: {} } as any) || { total: 0, sources: {}, sports: {} };
    
    // Create status entry
    const statusEntry = {
      workflow_name: 'continuous-data-collection',
      run_id: runId,
      run_number: parseInt(runNumber) || 0,
      status,
      trigger: process.env.GITHUB_EVENT_NAME || 'unknown',
      started_at: process.env.GITHUB_RUN_STARTED_AT || endTime.toISOString(),
      completed_at: endTime.toISOString(),
      duration_seconds: Math.round(duration),
      data_collected: dataStats.total,
      data_by_source: dataStats.sources,
      data_by_sport: dataStats.sports,
      actor: process.env.GITHUB_ACTOR || 'system',
      repository: process.env.GITHUB_REPOSITORY || 'fantasy-ai-mvp',
      sha: process.env.GITHUB_SHA || 'unknown',
      ref: process.env.GITHUB_REF || 'unknown'
    };
    
    // Insert status entry
    const { error: insertError } = await supabase
      .from('workflow_status')
      .insert(statusEntry);
    
    if (insertError) {
      console.error('Error inserting status:', insertError);
      // Try to create table if it doesn't exist
      if (insertError.code === '42P01') {
        await createStatusTable();
        await supabase.from('workflow_status').insert(statusEntry);
      }
    }
    
    // Update summary statistics
    const { data: last24h } = await supabase
      .from('workflow_status')
      .select('status, duration_seconds, data_collected')
      .eq('workflow_name', 'continuous-data-collection')
      .gte('completed_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
    
    if (last24h) {
      const stats = last24h.reduce((acc, run) => {
        acc.total_runs++;
        if (run.status === 'success') acc.successful_runs++;
        acc.total_duration += run.duration_seconds || 0;
        acc.total_data += run.data_collected || 0;
        return acc;
      }, { total_runs: 0, successful_runs: 0, total_duration: 0, total_data: 0 });
      
      const summary = {
        workflow_name: 'continuous-data-collection',
        period: '24h',
        total_runs: stats.total_runs,
        successful_runs: stats.successful_runs,
        success_rate: stats.total_runs > 0 ? 
          Math.round((stats.successful_runs / stats.total_runs) * 100) : 0,
        avg_duration_seconds: stats.total_runs > 0 ? 
          Math.round(stats.total_duration / stats.total_runs) : 0,
        total_data_collected: stats.total_data,
        last_run_status: status,
        last_run_at: endTime.toISOString(),
        updated_at: endTime.toISOString()
      };
      
      await supabase
        .from('workflow_summary')
        .upsert(summary, { onConflict: 'workflow_name,period' });
    }
    
    console.log(`Status dashboard updated successfully`);
    console.log(`Run #${runNumber} - Status: ${status}`);
    console.log(`Duration: ${Math.round(duration)}s`);
    console.log(`Data collected: ${dataStats.total} records`);
    
  } catch (error) {
    console.error('Error updating dashboard:', error);
    process.exit(1);
  }
}

async function createStatusTable() {
  console.log('Creating workflow status tables...');
  
  // Create tables via raw SQL
  const { error: createError } = await supabase.rpc('exec_sql', {
    query: `
      CREATE TABLE IF NOT EXISTS workflow_status (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        workflow_name TEXT NOT NULL,
        run_id TEXT,
        run_number INTEGER,
        status TEXT NOT NULL,
        trigger TEXT,
        started_at TIMESTAMPTZ,
        completed_at TIMESTAMPTZ,
        duration_seconds INTEGER,
        data_collected INTEGER,
        data_by_source JSONB,
        data_by_sport JSONB,
        actor TEXT,
        repository TEXT,
        sha TEXT,
        ref TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS workflow_summary (
        workflow_name TEXT NOT NULL,
        period TEXT NOT NULL,
        total_runs INTEGER DEFAULT 0,
        successful_runs INTEGER DEFAULT 0,
        success_rate INTEGER DEFAULT 0,
        avg_duration_seconds INTEGER DEFAULT 0,
        total_data_collected INTEGER DEFAULT 0,
        last_run_status TEXT,
        last_run_at TIMESTAMPTZ,
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        PRIMARY KEY (workflow_name, period)
      );
      
      CREATE INDEX IF NOT EXISTS idx_workflow_status_completed 
        ON workflow_status(completed_at DESC);
      CREATE INDEX IF NOT EXISTS idx_workflow_status_name 
        ON workflow_status(workflow_name);
    `
  });
  
  if (createError) {
    console.error('Error creating tables:', createError);
  }
}

updateDashboard();