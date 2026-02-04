const admin = require('firebase-admin');
const serviceAccount = require('../service-account.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}
const db = admin.firestore();

async function listUsers() {
  console.log("👥 LISTING ALL USERS IN FIRESTORE:");
  const usersRef = db.collection('users');
  const snap = await usersRef.get();
  
  snap.forEach(doc => {
    const data = doc.data();
    console.log(`- UID: ${doc.id} | Email: ${data.email} | Plan: ${data.plan}`);
  });
}

listUsers();
