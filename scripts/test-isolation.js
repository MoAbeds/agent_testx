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
  console.log('\n=== DATA ISOLATION TEST ===\n');

  // 1. Find User 2's UID
  console.log('1. Looking up User 2 profile...');
  const usersSnap = await db.collection('users').get();
  let user2Id = null;
  usersSnap.forEach(doc => {
    const data = doc.data();
    if (data.email === USER_2_EMAIL) {
      user2Id = doc.id;
      console.log(`   Found: ${doc.id} (${data.email})`);
    }
  });

  if (!user2Id) {
    console.log('   User 2 not found in users collection. Checking auth...');
  }

  // 2. Get all sites and their owners
  console.log('\n2. Fetching ALL sites...');
  const sitesSnap = await db.collection('sites').get();
  const sitesByUser = {};
  
  sitesSnap.forEach(doc => {
    const data = doc.data();
    const owner = data.userId || 'NO_OWNER';
    if (!sitesByUser[owner]) sitesByUser[owner] = [];
    sitesByUser[owner].push({ id: doc.id, domain: data.domain });
  });

  console.log('   Sites by owner:');
  for (const [userId, sites] of Object.entries(sitesByUser)) {
    const isUser1 = userId === USER_1;
    console.log(`   - ${userId.substring(0, 10)}... ${isUser1 ? '(PRO USER)' : ''}: ${sites.length} site(s)`);
    sites.forEach(s => console.log(`     • ${s.domain} (${s.id})`));
  }

  // 3. Count events per site
  console.log('\n3. Counting events per site...');
  const eventsSnap = await db.collection('events').get();
  const eventsBySite = {};
  
  eventsSnap.forEach(doc => {
    const siteId = doc.data().siteId || 'NO_SITE';
    eventsBySite[siteId] = (eventsBySite[siteId] || 0) + 1;
  });

  console.log('   Events by siteId:');
  for (const [siteId, count] of Object.entries(eventsBySite)) {
    // Find owner of this site
    let owner = 'UNKNOWN';
    for (const [userId, sites] of Object.entries(sitesByUser)) {
      if (sites.find(s => s.id === siteId)) {
        owner = userId.substring(0, 10) + '...';
        break;
      }
    }
    console.log(`   - ${siteId.substring(0, 15)}... (owner: ${owner}): ${count} events`);
  }

  // 4. Check for orphaned events (events with no valid site)
  console.log('\n4. Checking for orphaned events...');
  const allSiteIds = new Set();
  sitesSnap.forEach(doc => allSiteIds.add(doc.id));
  
  let orphanCount = 0;
  eventsSnap.forEach(doc => {
    const siteId = doc.data().siteId;
    if (!allSiteIds.has(siteId)) {
      orphanCount++;
    }
  });
  console.log(`   Orphaned events (no valid site): ${orphanCount}`);

  // 5. Simulate User 2's query (what they SHOULD see)
  console.log('\n5. Simulating User 2 query...');
  if (user2Id) {
    const user2Sites = await db.collection('sites').where('userId', '==', user2Id).get();
    console.log(`   Sites owned by User 2: ${user2Sites.size}`);
    
    if (user2Sites.size === 0) {
      console.log('   ✅ User 2 has NO sites - they should see ZERO events');
    } else {
      const user2SiteIds = [];
      user2Sites.forEach(doc => user2SiteIds.push(doc.id));
      
      let user2EventCount = 0;
      eventsSnap.forEach(doc => {
        if (user2SiteIds.includes(doc.data().siteId)) {
          user2EventCount++;
        }
      });
      console.log(`   Events User 2 should see: ${user2EventCount}`);
    }
  } else {
    console.log('   ⚠️  User 2 has no Firestore profile yet');
  }

  // 6. THE CRITICAL CHECK: What is the NEW USER actually seeing?
  console.log('\n6. THE LEAK TEST...');
  console.log('   If User 2 has no sites, they should see 0 events.');
  console.log('   If they see events from User 1\'s sites, we have a LEAK.');
  
  // Check if there are events WITHOUT a proper siteId filter being applied
  const globalEventsQuery = await db.collection('events').limit(10).get();
  console.log(`\n   Global events query (no filter): ${globalEventsQuery.size} returned`);
  
  if (globalEventsQuery.size > 0) {
    console.log('\n   ⚠️  ISSUE FOUND: A query without siteId filter returns data!');
    console.log('   This means the UI might be fetching global data before filtering.');
  }

  console.log('\n=== TEST COMPLETE ===\n');
}

testIsolation().catch(console.error);
