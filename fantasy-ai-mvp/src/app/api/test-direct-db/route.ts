import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

export async function GET() {
  const results: any = {
    timestamp: new Date().toISOString(),
    environment: {
      DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
      DIRECT_URL: process.env.DIRECT_URL ? 'SET' : 'NOT SET',
      POSTGRES_URL: process.env.POSTGRES_URL ? 'SET' : 'NOT SET',
      POSTGRES_URL_NON_POOLING: process.env.POSTGRES_URL_NON_POOLING ? 'SET' : 'NOT SET',
    },
    urls: {
      database_url_has_pooler: (process.env.DATABASE_URL || '').includes('pooler'),
      direct_url_has_pooler: (process.env.DIRECT_URL || '').includes('pooler'),
    }
  }

  // Test with DIRECT_URL specifically
  if (process.env.DIRECT_URL) {
    const directPrisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DIRECT_URL
        }
      }
    })

    try {
      const playerCount = await directPrisma.player.count()
      results.directUrlTest = {
        success: true,
        playerCount,
        message: 'Direct URL connection successful!'
      }
    } catch (error) {
      results.directUrlTest = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    } finally {
      await directPrisma.$disconnect()
    }
  }

  // Test with DATABASE_URL
  if (process.env.DATABASE_URL) {
    const dbPrisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      }
    })

    try {
      const playerCount = await dbPrisma.player.count()
      results.databaseUrlTest = {
        success: true,
        playerCount,
        message: 'Database URL connection successful!'
      }
    } catch (error) {
      results.databaseUrlTest = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    } finally {
      await dbPrisma.$disconnect()
    }
  }

  // Test with default Prisma client from lib
  try {
    const { prisma } = await import('@/lib/prisma')
    const playerCount = await prisma.player.count()
    results.defaultPrismaTest = {
      success: true,
      playerCount,
      message: 'Default Prisma client successful!'
    }
  } catch (error) {
    results.defaultPrismaTest = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }

  return NextResponse.json(results, { 
    status: 200,
    headers: {
      'Cache-Control': 'no-store'
    }
  })
}