import { NextRequest, NextResponse } from 'next/server';
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { siteId } = await req.json();
    if (!siteId) return NextResponse.json({ error: 'siteId required' }, { status: 400 });

    const serperKey = process.env.SERPER_API_KEY;

    // 1. Find competitors tracked for this site
    const compQ = query(collection(db, "events"), where("siteId", "==", siteId), where("type", "==", "COMPETITOR_INTEL"));
    const compSnap = await getDocs(compQ);
    
    // Get unique domains from the details
    const competitors = compSnap.docs.map(d => {
      try { return JSON.parse(d.data().details).domain; } catch(e) { return null; }
    }).filter(Boolean);

    if (competitors.length === 0) {
      return NextResponse.json({ error: 'No competitors in watchlist yet.' }, { status: 400 });
    }

    let scoutCount = 0;

    // 2. Scout for backlink mentions
    for (const domain of competitors.slice(0, 3)) {
      const response = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: { 'X-API-KEY': serperKey || '', 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: `link:${domain} -site:${domain}`, num: 10 })
      });
      const data = await response.json();

      if (data.organic) {
        for (const link of data.organic) {
          await addDoc(collection(db, "events"), {
            siteId,
            type: 'BACKLINK_OPPORTUNITY',
            path: link.link,
            details: JSON.stringify({
              competitor: domain,
              sourceTitle: link.title,
              snippet: link.snippet
            }),
            occurredAt: serverTimestamp()
          });
          scoutCount++;
        }
      }
    }

    return NextResponse.json({ success: true, opportunities: scoutCount });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
