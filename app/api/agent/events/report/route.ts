import { NextRequest, NextResponse } from 'next/server';
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { updateUserPlan } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const eventType = body.event_type;
    const resource = body.resource;

    const subscriptionId = resource.id;
    const userId = resource.custom_id;
    const planId = resource.plan_id;

    if (!userId) {
      console.warn("[PayPal-Webhook] No custom_id (userId) found in webhook payload.");
      return NextResponse.json({ success: true, message: "Ignored: No userId" });
    }

    // Determine plan type from PayPal Plan ID
    let internalPlan = 'FREE';
    if (planId === 'P-STARTER') internalPlan = 'STARTER';
    if (planId === 'P-PRO') internalPlan = 'PRO';
    if (planId === 'P-AGENCY') internalPlan = 'AGENCY';

    if (eventType === 'BILLING.SUBSCRIPTION.ACTIVATED' || eventType === 'BILLING.SUBSCRIPTION.CREATED') {
      await updateUserPlan(userId, internalPlan, subscriptionId);
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
