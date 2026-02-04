import { NextRequest, NextResponse } from 'next/server';
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, getDoc, addDoc, serverTimestamp } from "firebase/firestore";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { siteId, competitorDomain } = await req.json();
    if (!siteId || !competitorDomain) return NextResponse.json({ error: 'Missing params' }, { status: 400 });

    const serperKey = process.env.SERPER_API_KEY;
    
    // 1. Fetch Competitor Visibility via Serper
    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: { 'X-API-KEY': serperKey || '', 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: `site:${competitorDomain}`, num: 20 })
    });
    const data = await response.json();

    // 2. Log Competitor intelligence
    const organicCount = data.organic?.length || 0;
    const intel = {
      domain: competitorDomain,
      visibilityScore: organicCount * 10,
      topPages: data.organic?.slice(0, 5).map((p: any) => p.link) || [],
      timestamp: new Date().toISOString()
    };

    await addDoc(collection(db, "events"), {
      siteId,
      type: 'COMPETITOR_INTEL',
      path: competitorDomain,
      details: JSON.stringify(intel),
      occurredAt: serverTimestamp()
    });

    return NextResponse.json({ success: true, intel });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
