import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  // Prisma 7 removed the built-in query-engine connection: every client must be
  // handed a driver adapter. `PrismaPg` owns the underlying `pg` Pool, so the
  // pool's lifetime is the client's lifetime — which is why this factory is only
  // ever called on a cache miss below. Building a pool per hot reload would leak
  // one Postgres pool per reload and exhaust the connection limit.
  //
  // `connectionString` is read lazily by `pg` (the Pool does not dial on
  // construction), preserving the Prisma 5 behaviour where a missing
  // DATABASE_URL surfaced on first query rather than at import time.
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  });

  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });
}

export const prisma: PrismaClient =
  globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Ensure Prisma client is properly initialized
if (!prisma) {
  throw new Error('Prisma Client failed to initialize');
}
