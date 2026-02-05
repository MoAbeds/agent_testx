const admin = require('firebase-admin');
const serviceAccount = require('../service-account.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function seed() {
  const siteRef = db.collection('sites').doc('local-wp-test');
  await siteRef.set({
    domain: 'localhost:8080',
    apiKey: 'mojo-local-secret-123',
    userId: 'test-user-123',
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
  process.exit(0);
}

seed();
