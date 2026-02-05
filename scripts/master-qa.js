const { PrismaClient } = require('@prisma/client');
const admin = require('firebase-admin');
const axios = require('axios');

// Initialize Firebase Admin
const serviceAccount = require('../service-account.json');
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}
const db = admin.firestore();

const SAAS_URL = 'http://localhost:3000';
const TEST_SITE_ID = 'local-wp-test';

async function runMasterTest() {

  // 1. AUTH & DATABASE INTEGRITY
  const siteRef = db.collection('sites').doc(TEST_SITE_ID);
  const siteSnap = await siteRef.get();
  if (siteSnap.exists) {
  } else {
    throw new Error("Firestore site record missing.");
  }

  // 2. MARKET INTELLIGENCE (The "Research" Button)
  try {
    const kwRes = await axios.post(`${SAAS_URL}/api/sites/keywords`, {
      siteId: TEST_SITE_ID,
      manualIndustry: "AI Voice Automation"
    });
    if (kwRes.data.success && kwRes.data.keywords.detailed.length > 0) {
    }

  // 3. THE GUARDIAN SCANNER (The "Scan Now" Button)
  try {
    const scanRes = await axios.post(`${SAAS_URL}/api/sites/scan`, {
      domain: 'localhost:8080'
    });
    if (scanRes.data.success && scanRes.data.pagesCrawled > 0) {
      
      const eventsSnap = await db.collection('events').where('siteId', '==', TEST_SITE_ID).get();
      const gaps = eventsSnap.docs.filter(d => d.data().type === 'SEO_GAP');
    }

  // 4. THE AUTO-FIXER (The "Fix All" Buttons)
  try {
    const fixRes = await axios.post(`${SAAS_URL}/api/agent/fix-404`, { siteId: TEST_SITE_ID });

    const gapRes = await axios.post(`${SAAS_URL}/api/agent/fix-gaps`, { siteId: TEST_SITE_ID });

  // 5. AGENT SYNC (The "Protection" Manifest)
  const siteData = siteSnap.data();
  try {
    const manRes = await axios.get(`${SAAS_URL}/api/agent/manifest`, {
      headers: { 'Authorization': `Bearer ${siteData.apiKey}` }
    });
    if (manRes.data.rules) {
    }

  process.exit(0);
}

runMasterTest().catch(e => {
  console.error("\n❌ QA FAILED:");
  console.error(e.message);
  process.exit(1);
});
