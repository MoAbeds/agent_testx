const admin = require('firebase-admin');
const serviceAccount = require('../service-account.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function configureFirestore() {
  
  try {
    // 1. Force a write to the (default) database to trigger initialization
    const testRef = db.collection('_mojo_init').doc('status');
    await testRef.set({
      initialized: true,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    // 2. Provision Collections
    const collections = ['sites', 'pages', 'rules', 'events'];
    for (const coll of collections) {
      await db.collection(coll).doc('_init').set({ active: true });
    }

    process.exit(0);
  } catch (e) {
    console.error("\n❌ PROVISIONING FAILED:");
    console.error(e.message);
    if (e.message.includes("NOT_FOUND")) {
    }
    process.exit(1);
  }
}

configureFirestore();
