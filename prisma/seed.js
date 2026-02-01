const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('Start seeding ...')
  
  // 1. Upsert User (Create if not exists, Update if exists)
  const user = await prisma.user.upsert({
    where: { email: 'mo@example.com' },
    update: {},
    create: {
      email: 'mo@example.com',
      name: 'Mo',
    },
  })

  // 2. Upsert Site
  const site = await prisma.site.upsert({
    where: { apiKey: 'mo-agent-secret-123' },
    update: {},
    create: {
      domain: 'localhost:4000',
      apiKey: 'mo-agent-secret-123',
      userId: user.id,
    },
  })

  // 3. Create Rules (Ideally we'd upsert these too, but let's just wipe and recreate for simplicity in dev)
  // Or check if they exist. For now, let's wrap in try/catch to ignore "Unique constraint" errors if any
  
  try {
    await prisma.optimizationRule.create({
      data: {
        targetPath: '/',
        type: 'REWRITE_META',
        isActive: true,
        siteId: site.id,
        payload: JSON.stringify({
          title: "AI SaaS Automation Platform | Mojo (From DB)",
          metaDesc: "Scale your revenue with autonomous AI agents. Powered by SQLite.",
          schema: {
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Mojo",
            "applicationCategory": "BusinessApplication"
          }
        }),
      },
    })
  } catch (e) {
    // Ignore duplicate rule creation
    console.log('Rule / already exists')
  }

  try {
    await prisma.optimizationRule.create({
      data: {
        targetPath: '/pricing',
        type: 'INJECT_CONTENT',
        isActive: true,
        siteId: site.id,
        payload: JSON.stringify({
          title: "Simple Pricing - Mojo (From DB)",
          rewriteBody: {
            selector: ".price-tag",
            content: "$99/mo (Database Optimized)"
          }
        }),
      },
    })
  } catch (e) {
    console.log('Rule /pricing already exists')
  }

  console.log('Seeding finished.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
