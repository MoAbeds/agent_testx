const admin = require('firebase-admin');
const serviceAccount = require('../service-account.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}
const db = admin.firestore();

async function deepAudit() {
  console.log("🕵️ ATTEMPTING TO FIND THE SOURCE OF THE DATA LEAK...");
  
  const sitesRef = db.collection('sites');
  const eventsRef = db.collection('events');

  // 1. Check for ANY sites that don't belong to Mo or the new account
  const allSites = await sitesRef.get();
  console.log(`📡 Total Sites in DB: ${allSites.size}`);
  
  const knownUids = [
    '2dcUaOh7jYSILgyO5B5Y424wh343', // momen2310@gmail.com
    'test-user-123'
  ];

  for (const doc of allSites.docs) {
    const data = doc.data();
    if (!knownUids.includes(data.userId)) {
      console.log(`⚠️ UNRECOGNIZED SITE OWNER: Domain: ${data.domain} | SiteId: ${doc.id} | UserId: ${data.userId}`);
    }
  }

  // 2. Check for "GLOBAL" events (no siteId or mismatched siteId)
  const sampleEvents = await eventsRef.limit(100).get();
  let leakageFound = false;
  
  console.log("\n🧪 Checking for Events without proper Site associations...");
  for (const doc of sampleEvents.docs) {
    const data = doc.data();
    if (!data.siteId) {
      console.log(`❌ EVENT LEAK (No SiteId): ${doc.id} | Type: ${data.type}`);
      leakageFound = true;
    }
  }

  // 3. NUCLEAR OPTION: Identify all site IDs
  const siteIds = allSites.docs.map(d => d.id);
  
  // Find events where siteId IS NOT in the list of valid sites
  const orphanedEvents = await eventsRef.limit(500).get();
  let orphanCount = 0;
  for (const doc of orphanedEvents.docs) {
    if (!siteIds.includes(doc.data().siteId)) {
      orphanCount++;
    }
  }
  console.log(`\n🧹 Found ~${orphanCount} events pointing to non-existent sites.`);
}

deepAudit();
