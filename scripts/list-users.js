const admin = require('firebase-admin');
const serviceAccount = require('../service-account.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}
const db = admin.firestore();

async function listUsers() {
  const usersRef = db.collection('users');
  const snap = await usersRef.get();
  
  snap.forEach(doc => {
    const data = doc.data();
  });
}

listUsers();
