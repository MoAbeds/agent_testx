import { NextRequest, NextResponse } from 'next/server';
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { siteId } = await request.json();
    if (!siteId) return NextResponse.json({ error: 'siteId required' }, { status: 400 });

    // In a real production environment, you'd use a PDF generation library like puppeteer or a service.
    // For this implementation, we aggregate the data and the frontend handles the 'Print to PDF' view.
    
    // 1. Get Site Data
    const sitesRef = collection(db, "sites");
    const qSite = query(sitesRef, where("__name__", "==", siteId));
    const siteSnap = await getDocs(qSite);
    if (siteSnap.empty) return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    const site = siteSnap.docs[0].data();

    // 2. Get Recent Events (Audit Trail)
    const eventsQ = query(collection(db, "events"), where("siteId", "==", siteId));
    const eventsSnap = await getDocs(eventsQ);
    const events = eventsSnap.docs.map(d => d.data());

    // 3. Get Pages (SEO Gaps)
    const pagesQ = query(collection(db, "pages"), where("siteId", "==", siteId));
    const pagesSnap = await getDocs(pagesQ);
    const pages = pagesSnap.docs.map(d => d.data());

    return NextResponse.json({
      success: true,
      report: {
        domain: site.domain,
        generatedAt: new Date().toISOString(),
        metrics: {
          totalActions: events.length,
          pagesAnalyzed: pages.length,
          healthScore: 85 // Mock calculation
        },
        recentFixes: events.filter((e: any) => e.type === 'AUTO_FIX').slice(0, 10),
        seoGaps: pages.filter((p: any) => p.status === 404 || !p.title).slice(0, 10)
      }
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
