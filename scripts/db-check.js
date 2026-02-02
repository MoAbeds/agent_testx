const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const events = await prisma.agentEvent.findMany({ select: { type: true, path: true } });
  console.log(JSON.stringify(events, null, 2));
}

check().catch(console.error).finally(() => prisma.$disconnect());
