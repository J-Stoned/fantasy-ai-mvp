#!/usr/bin/env node

// 🚀 Fantasy.AI Database Connection Test
// Testing our 79-table Supabase production database

require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');

async function testDatabaseConnection() {
  console.log('🚀 Testing Fantasy.AI Database Connection...\n');
  
  // Check if DATABASE_URL is available
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not found in environment variables');
    process.exit(1);
  }
  
  console.log('✅ DATABASE_URL found');
  console.log('🔗 Database URL:', process.env.DATABASE_URL.replace(/:[^:]*@/, ':***@'));
  
  const prisma = new PrismaClient();
  
  try {
    // Test basic connection
    console.log('\n📡 Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connection successful!');
    
    // Test query execution
    console.log('\n🔍 Testing query execution...');
    const result = await prisma.$queryRaw`SELECT version() as version, current_database() as database, current_user as user`;
    console.log('✅ Query execution successful!');
    console.log('📊 Database Info:', result[0]);
    
    // Check for existing tables
    console.log('\n📋 Checking existing tables...');
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    
    console.log('🗄️  Found', tables.length, 'tables in database');
    if (tables.length > 0) {
      console.log('📝 First 10 tables:', tables.slice(0, 10).map(t => t.table_name).join(', '));
    }
    
    // Test Supabase-specific features
    console.log('\n🔒 Testing Supabase features...');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (supabaseUrl && supabaseAnonKey) {
      console.log('✅ Supabase URL configured:', supabaseUrl);
      console.log('✅ Supabase Anon Key configured:', supabaseAnonKey.substring(0, 20) + '...');
    }
    
    console.log('\n🎉 DATABASE CONNECTION TEST PASSED!');
    console.log('🚀 Ready for real data collection!');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('🔧 Check your DATABASE_URL and network connection');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabaseConnection().catch(console.error);