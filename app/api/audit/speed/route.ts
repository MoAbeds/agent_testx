import { NextRequest, NextResponse } from 'next/server';
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
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

    // Ensure we have a valid protocol
    let targetUrl = url || siteData.domain;
    if (!targetUrl.startsWith('http')) {
      targetUrl = `https://${targetUrl}`;
    }

    console.log(`[Speed-Audit] Testing URL: ${targetUrl}`);

    const psiKey = process.env.PAGESPEED_API_KEY;
    // strategy=mobile is standard for Google's mobile-first indexing
    const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(targetUrl)}&strategy=mobile${psiKey ? `&key=${psiKey}` : ''}`;

    const res = await fetch(apiUrl);
    const data = await res.json();

    // Detailed error logging for debugging
    if (data.error) {
      console.error("[Speed-Audit] Google API Error:", data.error);
      return NextResponse.json({ 
        error: `Google API Error: ${data.error.message}`,
        details: data.error 
      }, { status: 500 });
    }

    if (!data.lighthouseResult) {
      return NextResponse.json({ error: 'Audit failed: No Lighthouse result returned from Google.' }, { status: 500 });
    }

    const lh = data.lighthouseResult;
    
    // Defensive score extraction
    const getScore = (cat: string) => (lh.categories[cat]?.score || 0) * 100;

    const scores = {
      performance: getScore('performance'),
      accessibility: getScore('accessibility'),
      bestPractices: getScore('best-practices'),
      seo: getScore('seo'),
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
      visibility: (500 + scores.seo * 5).toString() 
    });

    await logEvent(siteId, 'SPEED_AUDIT_COMPLETE', targetUrl, { scores });

    return NextResponse.json({ success: true, audit: auditData });
  } catch (error: any) {
    console.error("[Speed-Audit] Critical Crash:", error.message);
    return NextResponse.json({ error: `Critical: ${error.message}` }, { status: 500 });
  }
}
