const admin = require('firebase-admin');
const serviceAccount = require('../service-account.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}
const db = admin.firestore();

async function debugDataLeak() {
  const email = 'momen231011@gmail.com';
  
  // 1. Sample Sites
  const sitesRef = db.collection('sites');
  const allSitesSnap = await sitesRef.limit(20).get();
  allSitesSnap.forEach(doc => {
    const data = doc.data();
  });

  // 2. Sample Events
  const eventsRef = db.collection('events');
  const allEventsSnap = await eventsRef.limit(10).get();
  allEventsSnap.forEach(doc => {
    const data = doc.data();
  });

  // 4. Check Events for the first site
  if (!sitesSnap.empty) {
    const firstSiteId = sitesSnap.docs[0].id;
    const eventsRef = db.collection('events');
    const eventsSnap = await eventsRef.where('siteId', '==', firstSiteId).limit(5).get();
    eventsSnap.forEach(doc => {
    });
  }
}

debugDataLeak();
