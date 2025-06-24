import { NextResponse } from 'next/server';

export async function GET() {
  // Check which DATABASE_URL is being used
  const dbUrl = process.env.DATABASE_URL || 'NOT SET';
  const directUrl = process.env.DIRECT_URL || 'NOT SET';
  const postgresUrl = process.env.POSTGRES_URL || 'NOT SET';
  
  // Mask the password for security
  const maskUrl = (url: string) => {
    if (url === 'NOT SET') return url;
    return url.replace(/:([^@]+)@/, ':****@');
  };
  
  return NextResponse.json({
    DATABASE_URL: maskUrl(dbUrl),
    DIRECT_URL: maskUrl(directUrl),
    POSTGRES_URL: maskUrl(postgresUrl),
    POSTGRES_URL_NON_POOLING: maskUrl(process.env.POSTGRES_URL_NON_POOLING || 'NOT SET'),
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV,
    timestamp: new Date().toISOString()
  });
}