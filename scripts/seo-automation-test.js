const admin = require('firebase-admin');
const serviceAccount = require('../service-account.json');
const axios = require('axios');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}
const db = admin.firestore();

const SAAS_URL = 'http://localhost:3000';
const TEST_SITE_ID = 'local-wp-test';
const TEST_DOMAIN = 'localhost:8080';

async function runDeepSEOTest() {

  // PHASE 1: SITE DISCOVERY & THREAT DETECTION
  const scanRes = await axios.post(`${SAAS_URL}/api/sites/scan`, { domain: TEST_DOMAIN });
  
  const eventsSnap = await db.collection('events')
    .where('siteId', '==', TEST_SITE_ID)
    .where('type', 'in', ['404_DETECTED', 'SEO_GAP'])
    .get();
  

  // PHASE 2: MARKET INTELLIGENCE (AI ANALYST)
  const researchText = "We provide high-end AI Voice Agents for insurance companies. Our product automates claim processing and customer support using natural language processing.";
  const kwRes = await axios.post(`${SAAS_URL}/api/sites/keywords`, {
    siteId: TEST_SITE_ID,
    manualIndustry: researchText
  });
  
  const kwData = kwRes.data.keywords;

  // PHASE 3: AI REMEDIATION (The "Optimization" Job)
  
  // Fix 404s
  const fix404Res = await axios.post(`${SAAS_URL}/api/agent/fix-404`, { siteId: TEST_SITE_ID });

  // Fix SEO Gaps
  const fixGapsRes = await axios.post(`${SAAS_URL}/api/agent/fix-gaps`, { siteId: TEST_SITE_ID });

  // PHASE 4: AGENT EXECUTION (The "Live" Job)
  const siteSnap = await db.collection('sites').doc(TEST_SITE_ID).get();
  const manRes = await axios.get(`${SAAS_URL}/api/agent/manifest`, {
    headers: { 'Authorization': `Bearer ${siteSnap.data().apiKey}` }
  });
  
  const rules = manRes.data.rules;
  const paths = Object.keys(rules);
  
  if (paths.length > 0) {
    const firstRule = rules[paths[0]];
    if (firstRule.redirectTo) {
    } else {
        const desc = firstRule.metaDesc || firstRule.metaDescription || '';
    }
  }

  // PHASE 5: AUDIT & UNDO (The "Safety" Job)
  const auditSnap = await db.collection('events')
    .where('siteId', '==', TEST_SITE_ID)
    .where('type', '==', 'AUTO_FIX')
    .limit(1)
    .get();
  
  if (!auditSnap.empty) {
  }

  process.exit(0);
}

runDeepSEOTest().catch(e => {
  console.error("\n❌ DEEP TEST FAILED:");
  console.error(e.message);
  process.exit(1);
});
