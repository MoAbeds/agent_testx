import { NextRequest, NextResponse } from 'next/server';
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { updateUserPlan } from '@/lib/db';

export const dynamic = 'force-dynamic';

// PayPal Webhook Event Types:
// BILLING.SUBSCRIPTION.CREATED
// BILLING.SUBSCRIPTION.ACTIVATED
// BILLING.SUBSCRIPTION.CANCELLED
// BILLING.SUBSCRIPTION.EXPIRED

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const eventType = body.event_type;
    const resource = body.resource;


    // For subscriptions, the 'custom_id' or 'subscriber.email_address' 
    // is usually used to map to our internal user.
    // Ideally, we passed userId in 'custom_id' during checkout.
    const subscriptionId = resource.id;
    const userId = resource.custom_id; 

    if (!userId) {
      console.warn("[PayPal-Webhook] No custom_id (userId) found in webhook payload.");
      return NextResponse.json({ success: true, message: "Ignored: No userId" });
    }

    if (eventType === 'BILLING.SUBSCRIPTION.ACTIVATED' || eventType === 'BILLING.SUBSCRIPTION.CREATED') {
      await updateUserPlan(userId, 'PRO', subscriptionId);
    }

    if (eventType === 'BILLING.SUBSCRIPTION.CANCELLED' || eventType === 'BILLING.SUBSCRIPTION.EXPIRED') {
      await updateUserPlan(userId, 'FREE', subscriptionId);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('PayPal Webhook Error:', error.message);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
