const admin = require('firebase-admin');
const serviceAccount = require('../service-account.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}
const db = admin.firestore();

async function listUsers() {
  console.log("📋 Listing all users in Firestore...");
  const usersRef = db.collection('users');
  const snapshot = await usersRef.get();

  if (snapshot.empty) {
    console.log("❌ No users found in collection 'users'.");
    return;
  }

  snapshot.forEach(doc => {
    console.log(`- [${doc.id}] Plan: ${doc.data().plan || 'FREE'} | Email: ${doc.data().email || 'No Email'}`);
  });
}

listUsers();
