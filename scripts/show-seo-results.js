const admin = require('firebase-admin');
const serviceAccount = require('../service-account.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function showOptimizations() {
  console.log("🔍 FETCHING ON-PAGE SEO RESULTS...\n");

  const rulesSnap = await db.collection('rules').where('type', '==', 'REWRITE_META').get();
  
  if (rulesSnap.empty) {
    console.log("❌ No SEO optimizations found in the database.");
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

    console.log(`📍 PATH: ${rule.targetPath}`);
    console.log(`   [OLD TITLE]: ${page.title || 'Missing'}`);
    console.log(`   [NEW TITLE]: ${payload.title}`);
    console.log(`   ---`);
    console.log(`   [OLD META]: ${page.metaDesc || 'Missing'}`);
    console.log(`   [NEW META]: ${payload.metaDesc}`);
    console.log(`   💡 REASONING: ${payload.reasoning}\n`);
  }
}

showOptimizations().catch(console.error);
