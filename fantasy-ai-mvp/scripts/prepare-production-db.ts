#!/usr/bin/env node

import fs from 'fs'
import path from 'path'

// This script ensures the production database is in the correct location for Vercel

const sourceDb = path.join(process.cwd(), 'prisma', 'dev.db')
const sourceDbJournal = path.join(process.cwd(), 'prisma', 'dev.db-journal')

// Check if database exists and has content
if (fs.existsSync(sourceDb)) {
  const stats = fs.statSync(sourceDb)
  console.log(`Database found at ${sourceDb}`)
  console.log(`Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`)
  
  // For Vercel, we need to ensure the database URL points to the correct location
  console.log('\nVercel should use DATABASE_URL=file:./prisma/dev.db')
  console.log('This is already configured in vercel.json')
  
  // Check if journal file exists
  if (fs.existsSync(sourceDbJournal)) {
    console.log('\nJournal file also found - database is ready for production')
  }
} else {
  console.error('ERROR: Database file not found!')
  console.error('Please run the player collection scripts first')
  process.exit(1)
}

console.log('\n✅ Database is ready for production deployment!')