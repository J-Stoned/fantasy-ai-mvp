import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    hasDatabase: !!process.env.DATABASE_URL,
    hasDirect: !!process.env.DIRECT_URL,
    hasPostgres: !!process.env.POSTGRES_URL,
    hasNonPooling: !!process.env.POSTGRES_URL_NON_POOLING,
    databaseUrlType: process.env.DATABASE_URL?.includes('pooler') ? 'pooler' : 'direct',
    timestamp: new Date().toISOString()
  });
}