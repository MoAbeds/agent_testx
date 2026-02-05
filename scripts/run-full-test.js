const admin = require('firebase-admin');
const serviceAccount = require('../service-account.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function runTests() {

  const siteSnap = await db.collection('sites').where('domain', '==', 'localhost:8080').limit(1).get();
  if (siteSnap.empty) throw new Error("Local test site not found in Firestore. Seed it first.");
  const site = { id: siteSnap.docs[0].id, ...siteSnap.docs[0].data() };

  try {
    const kwRes = await fetch('http://localhost:3000/api/sites/keywords', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ siteId: site.id, manualIndustry: 'AI Voice Agents' })
    });
    const kwData = await kwRes.json();

  try {
    const scanRes = await fetch('http://localhost:3000/api/sites/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain: site.domain })
    });
    const scanData = await scanRes.json();

  try {
    const fixRes = await fetch('http://localhost:3000/api/agent/fix-404', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ siteId: site.id })
    });
    const fixData = await fixRes.json();

  try {
    const gapRes = await fetch('http://localhost:3000/api/agent/fix-gaps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ siteId: site.id })
    });
    const gapData = await gapRes.json();

}

runTests().catch(console.error);
