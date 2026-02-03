const admin = require('firebase-admin');
const serviceAccount = require('../service-account.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function runTests() {
  console.log("🚀 STARTING MOJO INTEGRATION TESTS (FIREBASE)...\n");

  const siteSnap = await db.collection('sites').where('domain', '==', 'localhost:8080').limit(1).get();
  if (siteSnap.empty) throw new Error("Local test site not found in Firestore. Seed it first.");
  const site = { id: siteSnap.docs[0].id, ...siteSnap.docs[0].data() };

  console.log(`📍 TEST 1: KEYWORD RESEARCH (${site.domain})`);
  try {
    const kwRes = await fetch('http://localhost:3000/api/sites/keywords', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ siteId: site.id, manualIndustry: 'AI Voice Agents' })
    });
    const kwData = await kwRes.json();
    console.log("   ✅ Result:", kwData.success ? "SUCCESS" : "FAILED");
  } catch (e) { console.log("   ❌ Error:", e.message); }

  console.log(`\n📍 TEST 2: RECURSIVE SCAN`);
  try {
    const scanRes = await fetch('http://localhost:3000/api/sites/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain: site.domain })
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
  } catch (e) { console.log("   ❌ Error:", e.message); }

  console.log(`\n📍 TEST 4: FIX SEO GAPS`);
  try {
    const gapRes = await fetch('http://localhost:3000/api/agent/fix-gaps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ siteId: site.id })
    });
    const gapData = await gapRes.json();
    console.log("   ✅ Result:", gapData.success ? "SUCCESS" : "FAILED");
    console.log(`   ✨ Optimizations Applied: ${gapData.appliedFixes || 0}`);
  } catch (e) { console.log("   ❌ Error:", e.message); }

  console.log("\n🏁 TESTS COMPLETE.");
}

runTests().catch(console.error);
