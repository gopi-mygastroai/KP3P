import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const queryLoggingEnabled = process.env.PRISMA_LOG_QUERIES === "true";
const prismaLogLevels: ("query" | "warn" | "error")[] = queryLoggingEnabled
  ? ["query", "warn", "error"]
  : ["warn", "error"];

const dbUrl = process.env.POSTGRES_PRISMA_URL;
const connectionLimit = process.env.PRISMA_CONNECTION_LIMIT ?? "5";
const poolTimeout = process.env.PRISMA_POOL_TIMEOUT ?? "20";

/**
 * PgBouncer / Neon / Supabase poolers in transaction mode reuse connections and
 * clash with Prisma's named prepared statements (Postgres 42P05). Prisma expects
 * `pgbouncer=true` on the URL to disable that behaviour for the pooled URL only.
 * @see https://www.prisma.io/docs/guides/performance-and-optimization/connection-management/configure-for-pgbouncer
 */
function pooledHostNeedsPgbouncerMode(url: URL): boolean {
  const h = url.hostname.toLowerCase();
  const port = url.port || "";
  if (port === "6543") return true;
  if (h.includes("pooler")) return true;
  if (h.includes("neon.tech")) return true;
  if (h.includes("supabase")) return true;
  if (h.includes("cockroachlabs.cloud")) return true;
  return false;
}

const getPrismaUrl = () => {
  if (!dbUrl) return undefined;
  try {
    const parsed = new URL(dbUrl);
    if (!parsed.searchParams.has("connection_limit")) {
      parsed.searchParams.set("connection_limit", connectionLimit);
    }
    if (!parsed.searchParams.has("pool_timeout")) {
      parsed.searchParams.set("pool_timeout", poolTimeout);
    }
    const forcePgbouncer = process.env.PRISMA_PG_BOUNCER === "true";
    const skipPgbouncer = process.env.PRISMA_PG_BOUNCER === "false";
    if (
      !skipPgbouncer &&
      !parsed.searchParams.has("pgbouncer") &&
      (forcePgbouncer || pooledHostNeedsPgbouncerMode(parsed))
    ) {
      parsed.searchParams.set("pgbouncer", "true");
    }
    return parsed.toString();
  } catch {
    return dbUrl;
  }
};

const prismaDatasourceUrl = getPrismaUrl();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: prismaLogLevels,
    ...(prismaDatasourceUrl
      ? { datasources: { db: { url: prismaDatasourceUrl } } }
      : {}),
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
