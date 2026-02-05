const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const pages = await prisma.page.findMany();
  const events = await prisma.agentEvent.findMany({ where: { type: 'SEO_GAP' } });
}

check().catch(console.error).finally(() => prisma.$disconnect());
