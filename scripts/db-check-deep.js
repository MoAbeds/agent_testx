const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const pages = await prisma.page.findMany();
  console.log("PAGES:", JSON.stringify(pages, null, 2));
  const events = await prisma.agentEvent.findMany({ where: { type: 'SEO_GAP' } });
  console.log("GAPS:", JSON.stringify(events, null, 2));
}

check().catch(console.error).finally(() => prisma.$disconnect());
