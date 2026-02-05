const admin = require('firebase-admin');
const serviceAccount = require('../service-account.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}
const db = admin.firestore();

async function findMo() {
  const usersRef = db.collection('users');
  const snapshot = await usersRef.get();

  if (snapshot.empty) {
    return;
  }

  snapshot.forEach(doc => {
    const data = doc.data();
  });
}

findMo();
