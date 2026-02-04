const admin = require('firebase-admin');
const serviceAccount = require('../service-account.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}
const db = admin.firestore();

async function checkUserPlan() {
  const userRef = db.collection('users').doc('test-user-123');
  const snap = await userRef.get();
  if (snap.exists) {
    console.log("👤 USER PLAN STATUS:", snap.data().plan);
  } else {
    console.log("❌ User not found.");
  }
}

checkUserPlan();
