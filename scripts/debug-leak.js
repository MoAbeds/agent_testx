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
  console.log(`🔍 DEBUGGING LEAK FOR: ${email}`);
  
  // 1. Sample Sites
  const sitesRef = db.collection('sites');
  const allSitesSnap = await sitesRef.limit(20).get();
  console.log(`🌍 Global Site Sample (Owner Check):`);
  allSitesSnap.forEach(doc => {
    const data = doc.data();
    console.log(`   - Site: ${data.domain} | Owner: ${data.userId || 'MISSING'}`);
  });

  // 2. Sample Events
  const eventsRef = db.collection('events');
  const allEventsSnap = await eventsRef.limit(10).get();
  console.log(`\n🌍 Global Event Sample (Site Association Check):`);
  allEventsSnap.forEach(doc => {
    const data = doc.data();
    console.log(`   - Event: ${data.type} | SiteId: ${data.siteId || 'MISSING'}`);
  });

  // 4. Check Events for the first site
  if (!sitesSnap.empty) {
    const firstSiteId = sitesSnap.docs[0].id;
    const eventsRef = db.collection('events');
    const eventsSnap = await eventsRef.where('siteId', '==', firstSiteId).limit(5).get();
    console.log(`\n🔔 Events for Site ${firstSiteId}: ${eventsSnap.size}`);
    eventsSnap.forEach(doc => {
      console.log(`   - Event: ${doc.data().type} | Path: ${doc.data().path}`);
    });
  }
}

debugDataLeak();
