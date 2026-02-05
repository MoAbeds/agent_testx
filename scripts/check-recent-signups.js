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
  const now = new Date();
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

  const usersSnap = await db.collection('users')
    .where('createdAt', '>=', fiveMinutesAgo)
    .get();

  if (usersSnap.empty) {
  } else {
    usersSnap.forEach(doc => {
      const data = doc.data();
    });
  }
}

checkRecentUsers().catch(console.error);
