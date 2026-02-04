const admin = require('firebase-admin');
const serviceAccount = require('../service-account.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}
const db = admin.firestore();

async function cleanupOrphanedSites() {
  console.log("🧹 CLEANING UP ORPHANED SITES...");
  const sitesRef = db.collection('sites');
  const snap = await sitesRef.get();
  
  let deleted = 0;
  for (const doc of snap.docs) {
    const data = doc.data();
    if (!data.userId || data.userId === 'MISSING' || data.userId === 'test-user-123') {
      console.log(`🗑️ Deleting ownerless site: ${data.domain} (${doc.id})`);
      await doc.ref.delete();
      deleted++;
    }
  }
  console.log(`✅ Cleanup complete. Removed ${deleted} sites.`);
}

cleanupOrphanedSites();
