const axios = require('axios');

const WEBHOOK_URL = 'http://localhost:3000/api/billing/webhook';
const TEST_USER_ID = 'test-user-123';

async function testWebhook() {
  console.log("⚓ STARTING LOCAL WEBHOOK SIMULATION...");

  // 1. Simulate PayPal Subscription Activation
  console.log("\n➡️  STEP 1: Simulating BILLING.SUBSCRIPTION.ACTIVATED");
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
      console.log("   ✅ Success: SaaS processed activation webhook.");
    }
  } catch (e) {
    console.error("   ❌ Activation Failed:", e.message);
  }

  // 2. Simulate PayPal Subscription Cancellation
  console.log("\n➡️  STEP 2: Simulating BILLING.SUBSCRIPTION.CANCELLED");
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
      console.log("   ✅ Success: SaaS processed cancellation webhook.");
    }
  } catch (e) {
    console.error("   ❌ Cancellation Failed:", e.message);
  }

  console.log("\n🏁 WEBHOOK TEST COMPLETE.");
}

testWebhook();
