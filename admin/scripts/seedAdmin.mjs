import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'admin@mygastro.ai';
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        name: 'System Admin',
        email: adminEmail,
        password: 'adminpassword',
        role: 'ADMIN',
      },
    });
    console.log('Admin user created: admin@mygastro.ai / adminpassword');
  } else {
    console.log('Admin user already exists.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
