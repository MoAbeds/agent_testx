const admin = require('firebase-admin');
const serviceAccount = require('../service-account.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}
const db = admin.firestore();

async function findMo() {
  console.log("Searching for user records...");
  const usersRef = db.collection('users');
  const snapshot = await usersRef.get();

  if (snapshot.empty) {
    console.log("❌ No users found in Firestore.");
    return;
  }

  snapshot.forEach(doc => {
    const data = doc.data();
    console.log(`- [${doc.id}] Email: ${data.email} | Plan: ${data.plan} | Full:`, JSON.stringify(data));
  });
}

findMo();
