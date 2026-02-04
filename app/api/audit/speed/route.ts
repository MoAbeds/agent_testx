import { NextRequest, NextResponse } from 'next/server';
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, getDoc, updateDoc } from "firebase/firestore";
import { logEvent } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { siteId, url } = await req.json();
    if (!siteId) return NextResponse.json({ error: 'siteId required' }, { status: 400 });

    const siteRef = doc(db, "sites", siteId);
    const siteSnap = await getDoc(siteRef);
    if (!siteSnap.exists()) return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    const siteData = siteSnap.data();

    const targetUrl = url || `https://${siteData.domain}`;
    const psiKey = process.env.PAGESPEED_API_KEY;
    
    // We'll use the public API if no key is provided
    const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(targetUrl)}&strategy=mobile${psiKey ? `&key=${psiKey}` : ''}`;

    const res = await fetch(apiUrl);
    const data = await res.json();

    if (!data.lighthouseResult) {
      return NextResponse.json({ error: 'Audit failed', details: data }, { status: 500 });
    }

    const lh = data.lighthouseResult;
    const scores = {
      performance: (lh.categories.performance?.score || 0) * 100,
      accessibility: (lh.categories.accessibility?.score || 0) * 100,
      bestPractices: (lh.categories['best-practices']?.score || 0) * 100,
      seo: (lh.categories.seo?.score || 0) * 100,
    };

    const auditData = {
      scores,
      metrics: {
        fcp: lh.audits['first-contentful-paint']?.displayValue || 'N/A',
        lcp: lh.audits['largest-contentful-paint']?.displayValue || 'N/A',
        cls: lh.audits['cumulative-layout-shift']?.displayValue || 'N/A',
      },
      updatedAt: new Date().toISOString()
    };

    await updateDoc(siteRef, { 
      lastAudit: JSON.stringify(auditData),
      // Update visibility/authority based on speed too
      visibility: (500 + scores.seo * 5).toString() 
    });

    await logEvent(siteId, 'SPEED_AUDIT_COMPLETE', targetUrl, { scores });

    return NextResponse.json({ success: true, audit: auditData });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
