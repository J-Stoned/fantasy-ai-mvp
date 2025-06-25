import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Production-optimized Prisma configuration
const prismaClientSingleton = () => {
  console.log('🔧 Initializing Prisma Client for:', process.env.NODE_ENV);
  console.log('📊 Database URL exists:', !!process.env.DATABASE_URL);
  
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" 
      ? ["query", "info", "warn", "error"] 
      : ["error"],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
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

// Graceful shutdown
if (process.env.NODE_ENV === "production") {
  process.on('beforeExit', async () => {
    await prisma.$disconnect();
  });
}