const admin = require('firebase-admin');
const serviceAccount = require('../service-account.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}
const db = admin.firestore();

async function showAllEvents() {
  console.log("🔥 FETCHING ALL EVENTS FOR INSPECTION...");
  const eventsRef = db.collection('events');
  const snap = await eventsRef.limit(20).get();
  
  snap.forEach(doc => {
    const data = doc.data();
    console.log(`[Event] ID: ${doc.id} | SiteId: ${data.siteId} | Type: ${data.type} | Path: ${data.path}`);
  });
}

showAllEvents();
