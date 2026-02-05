// Reset Unpaid Accounts to FREE
// Run this to ensure no one has exploited the permissive rules

const admin = require('firebase-admin');
const serviceAccount = require('../service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function resetUnpaid() {
  const usersSnap = await db.collection('users').get();
  
  let count = 0;
  for (const doc of usersSnap.docs) {
    const data = doc.data();
    // If they are PRO or AGENCY but have NO subscriptionId, they might have exploited the rule
    if (data.plan && data.plan !== 'FREE' && !data.subscriptionId) {
      await doc.ref.update({
        plan: 'FREE',
        auditedAt: new Date().toISOString()
      });
      count++;
    }
  }
  
}

resetUnpaid().catch(console.error);
