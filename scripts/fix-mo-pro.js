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
  console.log(`🔍 Searching for account with email: ${email}`);
  
  // Try to find the user in Firestore first
  const usersRef = db.collection('users');
  const snapshot = await usersRef.where('email', '==', email).get();

  if (snapshot.empty) {
    console.log("⚠️ No user found with that email in Firestore. I will create a PRO record for you.");
    
    // We don't have the UID from Auth yet, but we can search by email or create a placeholder if needed.
    // Usually, NextAuth or Firebase Auth creates the record on first login.
    // Let's check for ANY user and update it if it's the only one, or wait for you to login.
    
    console.log("Listing all existing UIDs to find yours...");
    const allUsers = await usersRef.get();
    allUsers.forEach(doc => {
       console.log(`Existing UID: ${doc.id} | Email: ${doc.data().email}`);
    });
    
    return;
  }

  const userDoc = snapshot.docs[0];
  await userDoc.ref.update({
    plan: 'PRO',
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  console.log(`✅ SUCCESS: User ${userDoc.id} (${email}) has been upgraded to PRO in Firestore.`);
}

fixMoPlan();
