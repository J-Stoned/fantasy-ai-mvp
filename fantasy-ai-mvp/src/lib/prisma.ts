import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Fix for Vercel + Supabase prepared statement error
const prismaOptions: any = {
  log: process.env.NODE_ENV === "development" ? ["query", "info", "warn", "error"] : ["error"],
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
};

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient(prismaOptions);

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;