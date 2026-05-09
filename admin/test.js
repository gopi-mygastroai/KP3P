const { PrismaClient } = require('@prisma/client');
try {
  const prisma = new PrismaClient({
    log: ['query'],
  });
  console.log("Prisma instantiated successfully!");
} catch (e) {
  console.error("Error:", e);
}
