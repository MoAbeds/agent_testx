const admin = require('firebase-admin');
const serviceAccount = require('../service-account.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}
const db = admin.firestore();

async function forceProForMo() {
  const moUID = '2dcUaOh7jYSILgyO5B5Y424wh343';
  const moEmail = 'momen2310@gmail.com';
  
  console.log(`🚀 Forcing PRO plan for UID: ${moUID}`);
  
  const userRef = db.collection('users').doc(moUID);
  
  await userRef.set({
    email: moEmail,
    plan: 'PRO',
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  console.log(`✅ SUCCESS: Account ${moUID} (${moEmail}) is now permanently PRO in Firestore.`);
}

forceProForMo();
