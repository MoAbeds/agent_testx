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
  
  const usersRef = db.collection('users');
  const snap = await usersRef.where('email', '==', email).get();
  
  if (snap.empty) {
    return;
  }
  
  const data = snap.docs[0].data();
}

checkUserPlan();
