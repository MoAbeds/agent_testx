import { NextRequest, NextResponse } from 'next/server';
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // 1. Verify User (Security)
    // For now, we trust the client-side call in this MVP.
    // In a production app, verify the session cookie here.

    const { planId, tier, userId } = await req.json();

    if (!planId || !tier) {
      return NextResponse.json({ error: 'Missing planId or tier' }, { status: 400 });
    }

    if (!userId) {
       return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // 2. Update Firestore
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      plan: tier,
      subscriptionId: planId,
      subscriptionStatus: 'active',
      updatedAt: new Date().toISOString()
    });

    return NextResponse.json({ success: true, plan: tier });
  } catch (error: any) {
    console.error('Subscription Upgrade Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
