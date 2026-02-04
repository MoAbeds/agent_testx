import { NextRequest, NextResponse } from 'next/server';
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { logEvent, upsertPage } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { type, path, details } = await request.json();
    const authHeader = request.headers.get('Authorization');
    const apiKey = authHeader?.replace('Bearer ', '');

    if (!apiKey) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // 1. Verify Site by API Key
    const sitesRef = collection(db, "sites");
    const qSite = query(sitesRef, where("apiKey", "==", apiKey));
    const siteSnap = await getDocs(qSite);
    if (siteSnap.empty) return NextResponse.json({ error: 'Invalid API Key' }, { status: 403 });
    const site = { id: siteSnap.docs[0].id, ...siteSnap.docs[0].data() };


    // 2. Log the event
    await logEvent(site.id, type, path, details);

    // 3. If it's a 404, also create/update a Page record so it shows up in "Fix 404s"
    if (type === '404_DETECTED') {
      await upsertPage(site.id, path, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Event report error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
