const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.create({
    data: { email: 'local@mojo.ai', name: 'Local Admin' }
  });

  const site = await prisma.site.create({
    data: {
      domain: 'localhost:3001',
      apiKey: 'mojo-local-secret-123',
      userId: user.id
    }
  });

}

main().catch(console.error).finally(() => prisma.$disconnect());
