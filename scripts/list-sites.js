const admin = require('firebase-admin');
const serviceAccount = require('../service-account.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}
const db = admin.firestore();

async function listSites() {
  console.log("Listing all sites to find Mo's projects...");
  const sitesRef = db.collection('sites');
  const snapshot = await sitesRef.get();

  if (snapshot.empty) {
    console.log("❌ No sites found.");
    return;
  }

  snapshot.forEach(doc => {
    const data = doc.data();
    console.log(`- SiteID: ${doc.id} | Domain: ${data.domain} | OwnerUID: ${data.userId}`);
  });
}

listSites();
