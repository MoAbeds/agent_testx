const admin = require('firebase-admin');
const serviceAccount = require('../service-account.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function showOptimizations() {

  const rulesSnap = await db.collection('rules').where('type', '==', 'REWRITE_META').get();
  
  if (rulesSnap.empty) {
    return;
  }

  for (const doc of rulesSnap.docs) {
    const rule = doc.data();
    const payload = JSON.parse(rule.payload);
    
    // Find the original page data
    const pageSnap = await db.collection('pages')
      .where('siteId', '==', rule.siteId)
      .where('path', '==', rule.targetPath)
      .get();
    
    const page = !pageSnap.empty ? pageSnap.docs[0].data() : {};

  }
}

showOptimizations().catch(console.error);
