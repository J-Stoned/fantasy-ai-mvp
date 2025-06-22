import { PrismaClient } from '@prisma/client'
import path from 'path'
import { promises as fs } from 'fs'

let prisma: PrismaClient | null = null

async function getDatabaseUrl(): Promise<string> {
  // In production on Vercel, we need to handle SQLite differently
  if (process.env.VERCEL && process.env.NODE_ENV === 'production') {
    // Try multiple locations for the database
    const possiblePaths = [
      path.join(process.cwd(), 'public', 'database', 'production.db'),
      path.join(process.cwd(), 'prisma', 'dev.db'),
      path.join(process.cwd(), '.next', 'server', 'database', 'production.db')
    ]
    
    for (const dbPath of possiblePaths) {
      try {
        // Check if the database file exists
        await fs.access(dbPath)
        console.log(`✅ Production database found at: ${dbPath}`)
        return `file:${dbPath}`
      } catch (error) {
        console.log(`Database not found at: ${dbPath}`)
      }
    }
    
    console.error('❌ Database file not found in any expected location')
    // Fall back to the environment variable
    return process.env.DATABASE_URL || 'file:./prisma/dev.db'
  }
  
  // In development or if DATABASE_URL is set, use it directly
  return process.env.DATABASE_URL || 'file:./prisma/dev.db'
}

export async function getProductionPrisma(): Promise<PrismaClient> {
  if (!prisma) {
    const databaseUrl = await getDatabaseUrl()
    
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: databaseUrl
        }
      },
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
    })
    
    // Test the connection
    try {
      const count = await prisma.player.count()
      console.log(`✅ Database connected successfully. Total players: ${count}`)
    } catch (error) {
      console.error('❌ Database connection failed:', error)
      throw error
    }
  }
  
  return prisma
}