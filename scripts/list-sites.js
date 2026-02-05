const admin = require('firebase-admin');
const serviceAccount = require('../service-account.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}
const db = admin.firestore();

async function listSites() {
  const sitesRef = db.collection('sites');
  const snapshot = await sitesRef.get();

  if (snapshot.empty) {
    return;
  }

  snapshot.forEach(doc => {
    const data = doc.data();
  });
}

listSites();
