const axios = require('axios');

const WEBHOOK_URL = 'http://localhost:3000/api/billing/webhook';
const TEST_USER_ID = 'test-user-123';

async function testWebhook() {

  // 1. Simulate PayPal Subscription Activation
  try {
    const activationPayload = {
      event_type: 'BILLING.SUBSCRIPTION.ACTIVATED',
      resource: {
        id: 'I-SUB12345',
        custom_id: TEST_USER_ID,
        plan_id: 'P-PRO'
      }
    };

    const res = await axios.post(WEBHOOK_URL, activationPayload);
    if (res.status === 200) {
    }
  } catch (e) {
    console.error("   ❌ Activation Failed:", e.message);
  }

  // 2. Simulate PayPal Subscription Cancellation
  try {
    const cancellationPayload = {
      event_type: 'BILLING.SUBSCRIPTION.CANCELLED',
      resource: {
        id: 'I-SUB12345',
        custom_id: TEST_USER_ID
      }
    };

    const res = await axios.post(WEBHOOK_URL, cancellationPayload);
    if (res.status === 200) {
    }
  } catch (e) {
    console.error("   ❌ Cancellation Failed:", e.message);
  }

}

testWebhook();
