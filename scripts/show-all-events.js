const admin = require('firebase-admin');
const serviceAccount = require('../service-account.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}
const db = admin.firestore();

async function showAllEvents() {
  const eventsRef = db.collection('events');
  const snap = await eventsRef.limit(20).get();
  
  snap.forEach(doc => {
    const data = doc.data();
  });
}

showAllEvents();
