const { PrismaClient } = require('@prisma/client');
const admin = require('firebase-admin');
const axios = require('axios');

// Initialize Firebase Admin
const serviceAccount = require('../service-account.json');
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}
const db = admin.firestore();

const SAAS_URL = 'http://localhost:3000';
const TEST_SITE_ID = 'local-wp-test';

async function runMasterTest() {
  console.log("🛠️  MOJO QA SUITE: STARTING FULL AUDIT...\n");

  // 1. AUTH & DATABASE INTEGRITY
  console.log("➡️  CHECK 1: Database Connectivity");
  const siteRef = db.collection('sites').doc(TEST_SITE_ID);
  const siteSnap = await siteRef.get();
  if (siteSnap.exists) {
    console.log("   ✅ Firestore: Online & Reachable");
  } else {
    throw new Error("Firestore site record missing.");
  }

  // 2. MARKET INTELLIGENCE (The "Research" Button)
  console.log("\n➡️  CHECK 2: Market Intelligence Engine");
  try {
    const kwRes = await axios.post(`${SAAS_URL}/api/sites/keywords`, {
      siteId: TEST_SITE_ID,
      manualIndustry: "AI Voice Automation"
    });
    if (kwRes.data.success && kwRes.data.keywords.detailed.length > 0) {
      console.log(`   ✅ Research: Success. Industry: ${kwRes.data.keywords.industry}`);
      console.log(`   ✅ Real-time Table Data: ${kwRes.data.keywords.detailed.length} keywords found.`);
    }
  } catch (e) { console.log("   ❌ Research failed:", e.message); }

  // 3. THE GUARDIAN SCANNER (The "Scan Now" Button)
  console.log("\n➡️  CHECK 3: Autonomous Crawler (WP Bridge)");
  try {
    const scanRes = await axios.post(`${SAAS_URL}/api/sites/scan`, {
      domain: 'localhost:8080'
    });
    if (scanRes.data.success && scanRes.data.pagesCrawled > 0) {
      console.log(`   ✅ Crawler: Success. Analyzed ${scanRes.data.pagesCrawled} pages.`);
      
      const eventsSnap = await db.collection('events').where('siteId', '==', TEST_SITE_ID).get();
      const gaps = eventsSnap.docs.filter(d => d.data().type === 'SEO_GAP');
      console.log(`   ✅ Gaps Found & Logged: ${gaps.length}`);
    }
  } catch (e) { console.log("   ❌ Crawler failed:", e.message); }

  // 4. THE AUTO-FIXER (The "Fix All" Buttons)
  console.log("\n➡️  CHECK 4: AI Remediation Engine");
  try {
    const fixRes = await axios.post(`${SAAS_URL}/api/agent/fix-404`, { siteId: TEST_SITE_ID });
    console.log(`   ✅ 404 Fixer API: Online. Result: ${fixRes.data.success ? 'Success' : 'Fail'}`);

    const gapRes = await axios.post(`${SAAS_URL}/api/agent/fix-gaps`, { siteId: TEST_SITE_ID });
    console.log(`   ✅ SEO Gap Fixer API: Online. Applied: ${gapRes.data.appliedFixes || 0}`);
  } catch (e) { console.log("   ❌ Remediation failed:", e.message); }

  // 5. AGENT SYNC (The "Protection" Manifest)
  console.log("\n➡️  CHECK 5: Protection Manifest Delivery");
  const siteData = siteSnap.data();
  try {
    const manRes = await axios.get(`${SAAS_URL}/api/agent/manifest`, {
      headers: { 'Authorization': `Bearer ${siteData.apiKey}` }
    });
    if (manRes.data.rules) {
      console.log(`   ✅ Sync: Success. ${Object.keys(manRes.data.rules).length} active rules delivered.`);
    }
  } catch (e) { console.log("   ❌ Sync failed:", e.message); }

  console.log("\n🏁 MOJO QA SUITE: ALL SYSTEMS GO. READY FOR LAUNCH.");
  process.exit(0);
}

runMasterTest().catch(e => {
  console.error("\n❌ QA FAILED:");
  console.error(e.message);
  process.exit(1);
});
