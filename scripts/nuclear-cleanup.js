const admin = require('firebase-admin');
const serviceAccount = require('../service-account.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}
const db = admin.firestore();

async function nuclearCleanup() {
  
  const siteIdsToKeep = [
    'dk7R3amWmEBfaHiqZPUl', // Mo's Site 1
    'OWF2t6AELBzajVt2pOCy'  // Mo's Site 2
  ];


  const eventsRef = db.collection('events');
  const snap = await eventsRef.get();
  
  let deleted = 0;
  for (const doc of snap.docs) {
    const data = doc.data();
    if (!siteIdsToKeep.includes(data.siteId)) {
      await doc.ref.delete();
      deleted++;
    }
  }

}

nuclearCleanup();
