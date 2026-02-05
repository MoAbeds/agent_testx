const axios = require('axios');

const WEBHOOK_URL = 'http://localhost:3000/api/billing/webhook';
const TEST_USER_ID = 'test-user-123';

async function testWebhook() {

  try {
    // 1. Activate
    await axios.post(WEBHOOK_URL, {
      event_type: 'BILLING.SUBSCRIPTION.ACTIVATED',
      resource: { id: 'I-TEST', custom_id: TEST_USER_ID }
    });
  } catch (e) { console.error("   ❌ Failed:", e.message); }
}

testWebhook();
