const admin = require('firebase-admin');
const serviceAccount = require('../service-account.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}
const db = admin.firestore();

async function cleanupOrphanedEvents() {
  const eventsRef = db.collection('events');
  const snap = await eventsRef.where('siteId', '==', 'local-wp-test').get();
  
  let deleted = 0;
  for (const doc of snap.docs) {
    await doc.ref.delete();
    deleted++;
  }
}

cleanupOrphanedEvents();
