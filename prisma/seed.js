const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('Start seeding ...')
  
  // 1. Create User
  const user = await prisma.user.create({
    data: {
      email: 'mo@example.com',
      name: 'Mo',
    },
  })

  // 2. Create Site
  const site = await prisma.site.create({
    data: {
      domain: 'localhost:4000',
      apiKey: 'mo-agent-secret-123',
      userId: user.id,
    },
  })

  // 3. Create Rules
  // Rule 1: Home Page Title
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

  // Rule 2: Pricing Page
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
