import { NextRequest, NextResponse } from 'next/server';
import { subscriptionsController } from '@/lib/paypal';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { planId } = await req.json();

    if (!planId) {
      return NextResponse.json({ error: 'planId is required' }, { status: 400 });
    }

    // In a real app, you would create a subscription here or return the plan info
    // For PayPal, we often handle subscription creation on the frontend with the SDK
    // but we can validate or log the intent here.

    return NextResponse.json({ success: true, planId });
  } catch (error: any) {
    console.error('PayPal API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
