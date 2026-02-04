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
  console.log("🔗 STARTING WEBHOOK UI-API INTEGRATION TEST...\n");

  // 1. CREATE WEBHOOK
  console.log("➡️  STEP 1: Creating Webhook via API...");
  try {
    const createRes = await axios.post(API_URL, {
      siteId: TEST_SITE_ID,
      url: 'https://webhook.site/test-mojo',
      events: ['AUTO_FIX']
    });
    console.log("   ✅ Success:", createRes.data.success ? "Webhook Created" : "Failed");
    const webhookId = createRes.data.id;

    // 2. VERIFY IN FIRESTORE
    console.log("\n➡️  STEP 2: Verifying in Firestore...");
    const webhookDoc = await db.collection('webhooks').doc(webhookId).get();
    if (webhookDoc.exists && webhookDoc.data().url === 'https://webhook.site/test-mojo') {
      console.log("   ✅ Success: Webhook data found in Firestore.");
    } else {
      console.log("   ❌ Error: Webhook not found in DB.");
    }

    // 3. FETCH LIST
    console.log("\n➡️  STEP 3: Fetching Webhook List via API...");
    const listRes = await axios.get(`${API_URL}?siteId=${TEST_SITE_ID}`);
    if (Array.isArray(listRes.data) && listRes.data.length > 0) {
      console.log(`   ✅ Success: Retrieved ${listRes.data.length} webhooks.`);
    }

    // 4. DELETE WEBHOOK
    console.log("\n➡️  STEP 4: Deleting Webhook via API...");
    const deleteRes = await axios.delete(API_URL, {
      data: { webhookId }
    });
    console.log("   ✅ Success:", deleteRes.data.success ? "Webhook Removed" : "Failed");

  } catch (e) {
    console.error("   ❌ Test Failed:", e.response?.data || e.message);
  }

  console.log("\n🏁 WEBHOOK CRUD TEST COMPLETE.");
}

testWebhookCRUD();
