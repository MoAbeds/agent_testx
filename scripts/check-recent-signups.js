// Check Recent Signups
const admin = require('firebase-admin');
const serviceAccount = require('../service-account.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function checkRecentUsers() {
  console.log('--- 🛡️ Mojo User Activation Audit ---');
  const now = new Date();
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

  const usersSnap = await db.collection('users')
    .where('createdAt', '>=', fiveMinutesAgo)
    .get();

  if (usersSnap.empty) {
    console.log('No new users detected in the last 5 minutes.');
  } else {
    usersSnap.forEach(doc => {
      const data = doc.data();
      console.log(`✅ New User Detected: ${data.email}`);
      console.log(`   UID: ${doc.id}`);
      console.log(`   Plan: ${data.plan}`);
      console.log(`   Created: ${data.createdAt.toDate().toISOString()}`);
    });
  }
}

checkRecentUsers().catch(console.error);
