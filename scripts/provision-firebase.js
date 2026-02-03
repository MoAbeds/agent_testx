const admin = require('firebase-admin');
const serviceAccount = require('../service-account.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function configureFirestore() {
  console.log("🚀 STARTING FIREBASE PROVISIONING...");
  
  try {
    // 1. Force a write to the (default) database to trigger initialization
    const testRef = db.collection('_mojo_init').doc('status');
    await testRef.set({
      initialized: true,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log("✅ DATABASE CONNECTED: (default) instance is live.");

    // 2. Provision Collections
    const collections = ['sites', 'pages', 'rules', 'events'];
    for (const coll of collections) {
      await db.collection(coll).doc('_init').set({ active: true });
      console.log(`✅ COLLECTION READY: ${coll}`);
    }

    console.log("\n🏁 FIREBASE CONFIGURATION COMPLETE.");
    process.exit(0);
  } catch (e) {
    console.error("\n❌ PROVISIONING FAILED:");
    console.error(e.message);
    if (e.message.includes("NOT_FOUND")) {
      console.log("\n💡 INSTRUCTION: You still need to manually click 'Create Database' in the Firebase Console under the 'Firestore Database' tab. The API is enabled, but the instance doesn't exist yet.");
    }
    process.exit(1);
  }
}

configureFirestore();
