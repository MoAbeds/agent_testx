import { NextRequest, NextResponse } from 'next/server';
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, query, where, deleteDoc, doc, serverTimestamp } from "firebase/firestore";

export const dynamic = 'force-dynamic';

// GET: Fetch all webhooks for a user/site
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get('siteId');

    if (!siteId) return NextResponse.json({ error: 'siteId is required' }, { status: 400 });

    const q = query(collection(db, "webhooks"), where("siteId", "==", siteId));
    const snapshot = await getDocs(q);
    const webhooks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return NextResponse.json(webhooks);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Create a new webhook
export async function POST(request: NextRequest) {
  try {
    const { siteId, url, events } = await request.json();

    if (!siteId || !url) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });

    const webhookRef = await addDoc(collection(db, "webhooks"), {
      siteId,
      url,
      events: events || ['AUTO_FIX', '404_DETECTED'], // Default events
      isActive: true,
      createdAt: serverTimestamp()
    });

    return NextResponse.json({ id: webhookRef.id, success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Remove a webhook
export async function DELETE(request: NextRequest) {
  try {
    const { webhookId } = await request.json();
    if (!webhookId) return NextResponse.json({ error: 'webhookId is required' }, { status: 400 });

    await deleteDoc(doc(db, "webhooks", webhookId));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
