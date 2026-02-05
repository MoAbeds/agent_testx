const admin = require('firebase-admin');
const serviceAccount = require('../service-account.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}
const db = admin.firestore();

async function fixMoPlan() {
  const email = 'momen2310@gmail.com';
  
  // Try to find the user in Firestore first
  const usersRef = db.collection('users');
  const snapshot = await usersRef.where('email', '==', email).get();

  if (snapshot.empty) {
    
    // We don't have the UID from Auth yet, but we can search by email or create a placeholder if needed.
    // Usually, NextAuth or Firebase Auth creates the record on first login.
    // Let's check for ANY user and update it if it's the only one, or wait for you to login.
    
    const allUsers = await usersRef.get();
    allUsers.forEach(doc => {
    });
    
    return;
  }

  const userDoc = snapshot.docs[0];
  await userDoc.ref.update({
    plan: 'PRO',
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

}

fixMoPlan();
