import { NextRequest, NextResponse } from 'next/server';
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { logEvent } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { siteId, url } = await req.json();
    if (!siteId || !url) return NextResponse.json({ error: 'siteId and url required' }, { status: 400 });

    const psiKey = process.env.PAGESPEED_API_KEY;
    // We'll use the public API if no key is provided, but it has lower limits
    const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=mobile${psiKey ? `&key=${psiKey}` : ''}`;

    const res = await fetch(apiUrl);
    const data = await res.json();

    if (!data.lighthouseResult) {
      return NextResponse.json({ error: 'Audit failed', details: data }, { status: 500 });
    }

    const lh = data.lighthouseResult;
    const scores = {
      performance: lh.categories.performance.score * 100,
      accessibility: lh.categories.accessibility.score * 100,
      bestPractices: lh.categories['best-practices'].score * 100,
      seo: lh.categories.seo.score * 100,
    };

    const auditData = {
      scores,
      metrics: {
        fcp: lh.audits['first-contentful-paint'].displayValue,
        lcp: lh.audits['largest-contentful-paint'].displayValue,
        cls: lh.audits['cumulative-layout-shift'].displayValue,
      },
      updatedAt: new Date().toISOString()
    };

    const siteRef = doc(db, "sites", siteId);
    await updateDoc(siteRef, { lastAudit: JSON.stringify(auditData) });

    await logEvent(siteId, 'SPEED_AUDIT_COMPLETE', url, { scores });

    return NextResponse.json({ success: true, audit: auditData });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
