import { NextRequest, NextResponse } from 'next/server';
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";
import { upsertPage, logEvent } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { domain, pages } = await request.json();
    const authHeader = request.headers.get('Authorization');
    const apiKey = authHeader?.replace('Bearer ', '');

    if (!apiKey) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // 1. Verify Site by API Key
    const sitesRef = collection(db, "sites");
    const qSite = query(sitesRef, where("apiKey", "==", apiKey));
    const siteSnap = await getDocs(qSite);
    if (siteSnap.empty) return NextResponse.json({ error: 'Invalid API Key' }, { status: 403 });
    const site = { id: siteSnap.docs[0].id, ...siteSnap.docs[0].data() };


    // 2. Clear old issues for a fresh start
    const eventsRef = collection(db, "events");
    const qEvents = query(eventsRef, where("siteId", "==", site.id));
    const eventsSnap = await getDocs(qEvents);
    for (const d of eventsSnap.docs) {
      if (['404_DETECTED', 'SEO_GAP'].includes(d.data().type)) {
        await deleteDoc(doc(db, "events", d.id));
      }
    }

    // 3. Process each page pushed by the plugin
    for (const pageData of pages) {
      const { path, title, metaDesc, status } = pageData;

      // Check for SEO Gaps
      if (!title || title.length < 10 || !metaDesc || metaDesc.length < 50) {
        await logEvent(site.id, 'SEO_GAP', path, { 
          message: `SEO issues found via Internal Bridge: ${!title ? 'Missing Title' : title.length < 10 ? 'Title too short' : ''} ${!metaDesc ? 'Missing Meta' : metaDesc.length < 50 ? 'Meta too short' : ''}`.trim()
        });
      }

      await upsertPage(site.id, path, { title, metaDesc, status });
    }

    await logEvent(site.id, 'INFO', 'Internal Bridge', { message: `Successfully ingested ${pages.length} pages from WordPress plugin.` });

    return NextResponse.json({ success: true, ingested: pages.length });
  } catch (error) {
    console.error('Ingest error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
