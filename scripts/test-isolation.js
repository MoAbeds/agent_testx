// Test Data Isolation Script
// Simulates querying events for both users to verify isolation

const admin = require('firebase-admin');
const serviceAccount = require('../service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const USER_1 = '2dcUaOh7jYSILgyO5B5Y424wh343'; // momen2310@gmail.com (PRO)
const USER_2_EMAIL = 'momen231011@gmail.com'; // New account

async function testIsolation() {

  // 1. Find User 2's UID
  const usersSnap = await db.collection('users').get();
  let user2Id = null;
  usersSnap.forEach(doc => {
    const data = doc.data();
    if (data.email === USER_2_EMAIL) {
      user2Id = doc.id;
    }
  });

  if (!user2Id) {
  }

  // 2. Get all sites and their owners
  const sitesSnap = await db.collection('sites').get();
  const sitesByUser = {};
  
  sitesSnap.forEach(doc => {
    const data = doc.data();
    const owner = data.userId || 'NO_OWNER';
    if (!sitesByUser[owner]) sitesByUser[owner] = [];
    sitesByUser[owner].push({ id: doc.id, domain: data.domain });
  });

  for (const [userId, sites] of Object.entries(sitesByUser)) {
    const isUser1 = userId === USER_1;
  }

  // 3. Count events per site
  const eventsSnap = await db.collection('events').get();
  const eventsBySite = {};
  
  eventsSnap.forEach(doc => {
    const siteId = doc.data().siteId || 'NO_SITE';
    eventsBySite[siteId] = (eventsBySite[siteId] || 0) + 1;
  });

  for (const [siteId, count] of Object.entries(eventsBySite)) {
    // Find owner of this site
    let owner = 'UNKNOWN';
    for (const [userId, sites] of Object.entries(sitesByUser)) {
      if (sites.find(s => s.id === siteId)) {
        owner = userId.substring(0, 10) + '...';
        break;
      }
    }
  }

  // 4. Check for orphaned events (events with no valid site)
  const allSiteIds = new Set();
  sitesSnap.forEach(doc => allSiteIds.add(doc.id));
  
  let orphanCount = 0;
  eventsSnap.forEach(doc => {
    const siteId = doc.data().siteId;
    if (!allSiteIds.has(siteId)) {
      orphanCount++;
    }
  });

  // 5. Simulate User 2's query (what they SHOULD see)
  if (user2Id) {
    const user2Sites = await db.collection('sites').where('userId', '==', user2Id).get();
    
    if (user2Sites.size === 0) {
    } else {
      const user2SiteIds = [];
      user2Sites.forEach(doc => user2SiteIds.push(doc.id));
      
      let user2EventCount = 0;
      eventsSnap.forEach(doc => {
        if (user2SiteIds.includes(doc.data().siteId)) {
          user2EventCount++;
        }
      });
    }
  } else {
  }

  // 6. THE CRITICAL CHECK: What is the NEW USER actually seeing?
  
  // Check if there are events WITHOUT a proper siteId filter being applied
  const globalEventsQuery = await db.collection('events').limit(10).get();
  
  if (globalEventsQuery.size > 0) {
  }

}

testIsolation().catch(console.error);
