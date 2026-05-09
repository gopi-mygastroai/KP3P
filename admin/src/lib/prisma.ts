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
