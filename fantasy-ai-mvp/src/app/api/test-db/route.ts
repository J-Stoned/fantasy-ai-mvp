import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    database_url: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
    direct_url: process.env.DIRECT_URL ? 'SET' : 'NOT SET',
    postgres_url: process.env.POSTGRES_URL ? 'SET' : 'NOT SET',
    node_env: process.env.NODE_ENV,
    vercel: process.env.VERCEL,
    // Show which URL would be used
    using_url: process.env.DIRECT_URL ? 'DIRECT_URL' : 
               process.env.DATABASE_URL ? 'DATABASE_URL' : 
               'NONE',
    // Check if it's a pooler URL
    is_pooler: (process.env.DATABASE_URL || '').includes('pooler') || 
               (process.env.DIRECT_URL || '').includes('pooler')
  })
}