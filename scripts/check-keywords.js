const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const sites = await prisma.site.findMany({
    select: { domain: true, targetKeywords: true }
  });
  console.log(JSON.stringify(sites, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
