const admin = require('firebase-admin');
const serviceAccount = require('../service-account.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}
const db = admin.firestore();

async function checkUserPlan() {
  const email = 'momen231011@gmail.com';
  console.log(`🔍 Checking plan for account: ${email}`);
  
  const usersRef = db.collection('users');
  const snap = await usersRef.where('email', '==', email).get();
  
  if (snap.empty) {
    console.log("❌ No Firestore profile found for this user.");
    return;
  }
  
  const data = snap.docs[0].data();
  console.log(`✅ Profile Found! UID: ${snap.docs[0].id}`);
  console.log(`💎 Current Plan: ${data.plan || 'FREE (Default)'}`);
  console.log(`📦 Subscription ID: ${data.subscriptionId || 'None'}`);
}

checkUserPlan();
