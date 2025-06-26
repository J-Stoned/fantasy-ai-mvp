import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Production-optimized Prisma configuration with Vercel support
const prismaClientSingleton = () => {
  console.log('🔧 Initializing Prisma Client');
  console.log('📊 Environment:', process.env.NODE_ENV || 'development');
  console.log('🔗 Database URL exists:', !!process.env.DATABASE_URL);
  console.log('🚀 Vercel:', !!process.env.VERCEL);
  console.log('🏗️ Vercel ENV:', process.env.VERCEL_ENV);
  
  // Use direct URL for migrations, regular URL for queries
  const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
  
  if (!url) {
    console.error('❌ No database URL found!');
    console.error('Available env vars:', Object.keys(process.env).filter(k => k.includes('DATABASE') || k.includes('POSTGRES')));
  }
  
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" 
      ? ["query", "info", "warn", "error"] 
      : ["error"],
    datasources: {
      db: {
        url: url,
      },
    },
    // Production optimizations
    ...(process.env.NODE_ENV === 'production' && {
      errorFormat: 'minimal',
    }),
  });
};

export const prisma = globalForPrisma.prisma || prismaClientSingleton();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Graceful shutdown for serverless
if (process.env.NODE_ENV === "production" && !process.env.VERCEL) {
  process.on('beforeExit', async () => {
    await prisma.$disconnect();
  });
}