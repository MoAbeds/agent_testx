const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runTests() {
  console.log("🚀 STARTING MOJO INTEGRATION TESTS...\n");

  const site = await prisma.site.findFirst({ where: { domain: 'localhost:3001' } });
  if (!site) throw new Error("Local test site not found. Seed it first.");

  console.log(`📍 TEST 1: KEYWORD RESEARCH (${site.domain})`);
  try {
    const kwRes = await fetch('http://localhost:3000/api/sites/keywords', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ siteId: site.id, manualIndustry: 'AI Voice Agents' })
    });
    const kwData = await kwRes.json();
    console.log("   ✅ Result:", kwData.success ? "SUCCESS" : "FAILED", kwData.error || "");
    if (kwData.keywords) console.log(`   💡 Industry Identified: ${kwData.keywords.industry}`);
  } catch (e) { console.log("   ❌ Error:", e.message); }

  console.log(`\n📍 TEST 2: RECURSIVE SCAN`);
  try {
    const scanRes = await fetch('http://localhost:3000/api/sites/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain: 'localhost:3001' })
    });
    const scanData = await scanRes.json();
    console.log("   ✅ Result:", scanData.success ? "SUCCESS" : "FAILED");
    console.log(`   📄 Pages Crawled: ${scanData.pagesCrawled}`);
  } catch (e) { console.log("   ❌ Error:", e.message); }

  console.log(`\n📍 TEST 3: AUTO-FIX 404s`);
  try {
    const fixRes = await fetch('http://localhost:3000/api/agent/fix-404', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ siteId: site.id })
    });
    const fixData = await fixRes.json();
    console.log("   ✅ Result:", fixData.success ? "SUCCESS" : "FAILED");
    console.log(`   🔧 Fixes Applied: ${fixData.fixesApplied || 0}`);
  } catch (e) { console.log("   ❌ Error:", e.message); }

  console.log(`\n📍 TEST 4: MANIFEST GENERATION`);
  try {
    const manRes = await fetch('http://localhost:3000/api/agent/manifest', {
      headers: { 'Authorization': `Bearer ${site.apiKey}` }
    });
    const manData = await manRes.json();
    console.log("   ✅ Result:", manData.rules ? "SUCCESS" : "FAILED");
    console.log(`   📦 Rules in Manifest: ${Object.keys(manData.rules || {}).length}`);
  } catch (e) { console.log("   ❌ Error:", e.message); }

  console.log("\n🏁 TESTS COMPLETE.");
}

runTests().catch(console.error).finally(() => prisma.$disconnect());
