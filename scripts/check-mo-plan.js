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
  
  const usersRef = db.collection('users');
  const snapshot = await usersRef.where('email', '==', email).get();

  if (snapshot.empty) {
    return;
  }

  snapshot.forEach(doc => {
    const data = doc.data();
  });
}

checkMoPlan();
