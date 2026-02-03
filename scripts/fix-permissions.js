const admin = require('firebase-admin');
const serviceAccount = require('../service-account.json');
const fs = require('fs');
const path = require('path');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

async function updateSecurityRules() {
  const rulesPath = path.join(__dirname, '../firestore.rules');
  const newRules = fs.readFileSync(rulesPath, 'utf8');
  
  try {
    console.log("🚀 Updating Firestore Security Rules...");
    await admin.securityRules().releaseFirestoreRulesetFromSource(newRules);
    console.log("✅ Rules updated successfully!");
    
    // Also create the first site record to ensure the database is initialized
    const db = admin.firestore();
    await db.collection('_system').doc('init').set({
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      status: 'ready'
    });
    console.log("✅ Firestore initialized.");
    
  } catch (error) {
    console.error("❌ Failed to update rules:", error.message);
  }
}

updateSecurityRules();
