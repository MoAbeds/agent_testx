const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const events = await prisma.agentEvent.findMany({ select: { type: true, path: true } });
}

check().catch(console.error).finally(() => prisma.$disconnect());
