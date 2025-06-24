import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Fix for Vercel + Supabase prepared statement error
// Use DIRECT_URL if available to avoid pooler issues
const databaseUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;

const prismaOptions: any = {
  log: process.env.NODE_ENV === "development" ? ["query", "info", "warn", "error"] : ["error"],
  datasources: {
    db: {
      url: databaseUrl
    }
  }
};

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient(prismaOptions);

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;