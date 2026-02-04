const axios = require('axios');

const WEBHOOK_URL = 'http://localhost:3000/api/billing/webhook';
const TEST_USER_ID = 'test-user-123';

async function testWebhook() {
  console.log("⚓ STARTING STEP-BY-STEP WEBHOOK TEST...");

  try {
    // 1. Activate
    console.log("\n➡️  ACTION: Send ACTIVATED Webhook");
    await axios.post(WEBHOOK_URL, {
      event_type: 'BILLING.SUBSCRIPTION.ACTIVATED',
      resource: { id: 'I-TEST', custom_id: TEST_USER_ID }
    });
    console.log("   ✅ Sent.");
  } catch (e) { console.error("   ❌ Failed:", e.message); }
}

testWebhook();
