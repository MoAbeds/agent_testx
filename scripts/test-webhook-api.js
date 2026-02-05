const axios = require('axios');
const admin = require('firebase-admin');
const serviceAccount = require('../service-account.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}
const db = admin.firestore();

const API_URL = 'http://localhost:3000/api/webhooks';
const TEST_SITE_ID = 'local-wp-test';

async function testWebhookCRUD() {

  // 1. CREATE WEBHOOK
  try {
    const createRes = await axios.post(API_URL, {
      siteId: TEST_SITE_ID,
      url: 'https://webhook.site/test-mojo',
      events: ['AUTO_FIX']
    });
    const webhookId = createRes.data.id;

    // 2. VERIFY IN FIRESTORE
    const webhookDoc = await db.collection('webhooks').doc(webhookId).get();
    if (webhookDoc.exists && webhookDoc.data().url === 'https://webhook.site/test-mojo') {
    } else {
    }

    // 3. FETCH LIST
    const listRes = await axios.get(`${API_URL}?siteId=${TEST_SITE_ID}`);
    if (Array.isArray(listRes.data) && listRes.data.length > 0) {
    }

    // 4. DELETE WEBHOOK
    const deleteRes = await axios.delete(API_URL, {
      data: { webhookId }
    });

  } catch (e) {
    console.error("   ❌ Test Failed:", e.response?.data || e.message);
  }

}

testWebhookCRUD();
