const admin = require('firebase-admin');
const serviceAccount = require('../service-account.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}
const db = admin.firestore();

async function checkMoPlan() {
  const email = 'momen2310@gmail.com';
  console.log(`🔍 Checking plan for email: ${email}`);
  
  const usersRef = db.collection('users');
  const snapshot = await usersRef.where('email', '==', email).get();

  if (snapshot.empty) {
    console.log("❌ No user found with that email.");
    return;
  }

  snapshot.forEach(doc => {
    const data = doc.data();
    console.log(`✅ Found User: ${doc.id}`);
    console.log(`💎 Current Plan: ${data.plan || 'FREE'}`);
    console.log(`📦 Full Data:`, data);
  });
}

checkMoPlan();
