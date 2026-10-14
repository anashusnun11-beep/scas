import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

// Reuse one client across hot reloads in dev so we don't exhaust DB connections.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Pool size: pg's default of 10 limited how many signed-in pages could wait on Neon at once (each
// render makes about 15 round trips of ~60 ms from here). Neon's pooled endpoint accepts far more clients.
// Override with DB_POOL_MAX if the database plan needs a smaller number.
const POOL_MAX = Number(process.env.DB_POOL_MAX ?? 25);

function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL, max: POOL_MAX });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
