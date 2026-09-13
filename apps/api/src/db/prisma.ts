/**
 * Lazy Prisma Client singleton.
 *
 * The import is deferred so the backend can boot and run with the
 * in-memory store even if `prisma generate` hasn't been run yet
 * or no DATABASE_URL is configured.
 *
 * Call `getPrisma()` only when you actually need database access.
 */

let _prisma: any = null;

export function getPrisma() {
  if (process.env.PROOFPAY_USE_DATABASE !== 'true') return null;
  if (!_prisma) {
    try {
      // Dynamic import avoids crash at startup when @prisma/client isn't generated
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { PrismaClient } = require('@prisma/client');
      _prisma = new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
      });
    } catch (err) {
      console.warn(
        '⚠️  Prisma Client not available. Run "pnpm db:generate" to enable database access.',
        'The API will continue using the in-memory store.'
      );
      return null;
    }
  }
  return _prisma;
}
