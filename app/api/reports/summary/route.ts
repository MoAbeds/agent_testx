import { NextRequest, NextResponse } from 'next/server';
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

export const dynamic = 'force-dynamic';

interface Opportunity {
  id: string;
  path: string;
  domain: string;
  issues: string[];
}

export async function GET(request: NextRequest) {
  try {
    if (!db) return NextResponse.json({ error: 'Firestore not initialized' }, { status: 500 });

    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get('siteId');

    // 1. Fetch sites (all or filtered by siteId)
    let sitesQuery;
    if (siteId) {
      sitesQuery = query(collection(db, "sites"), where("__name__", "==", siteId));
    } else {
      sitesQuery = collection(db, "sites");
    }
    
    const sitesSnap = await getDocs(sitesQuery);
    const sitesMap: Record<string, any> = {};
    sitesSnap.forEach(doc => {
      sitesMap[doc.id] = doc.data();
    });

    const siteIds = Object.keys(sitesMap);
    if (siteIds.length === 0) {
      return NextResponse.json({
        healthScore: 0,
        pagesScanned: 0,
        issuesFound: 0,
        optimizedCount: 0,
        opportunities: [],
        generatedAt: new Date().toISOString()
      });
    }

    // 2. Fetch pages for these sites
    const pagesQ = query(collection(db, "pages"), where("siteId", "in", siteIds.slice(0, 10))); // Firestore "in" limit is 10
    const pagesSnap = await getDocs(pagesQ);
    const pages = pagesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));

    // 3. Fetch rules for these sites
    const rulesQ = query(collection(db, "rules"), where("siteId", "in", siteIds.slice(0, 10)));
    const rulesSnap = await getDocs(rulesQ);
    const activeRulesCount = rulesSnap.docs.filter(doc => doc.data().isActive).length;

    // 4. Calculate stats and health score
    let healthScore = 100;
    let issuesFound = 0;
    const opportunities: Opportunity[] = [];

    // Factor in PageSpeed if available
    let totalSpeedScore = 0;
    let speedCount = 0;

    for (const id in sitesMap) {
      if (sitesMap[id].lastAudit) {
        try {
          const audit = JSON.parse(sitesMap[id].lastAudit);
          totalSpeedScore += (audit.scores?.performance || 0);
          speedCount++;
        } catch(e) {}
      }
    }

    const avgSpeed = speedCount > 0 ? totalSpeedScore / speedCount : 80;

    for (const page of pages) {
      const pageIssues: string[] = [];
      const siteData = sitesMap[page.siteId];
      const domain = siteData?.domain || 'unknown';
      
      if (!page.title || page.title.trim() === '' || page.title === 'N/A') {
        pageIssues.push('Missing title tag');
        healthScore -= 5;
        issuesFound++;
      }
      
      if (!page.metaDesc || page.metaDesc.trim() === '' || page.metaDesc === 'N/A') {
        pageIssues.push('Missing meta description');
        healthScore -= 5;
        issuesFound++;
      }

      if (page.status === 404) {
        pageIssues.push('404 Broken Link');
        healthScore -= 10;
        issuesFound++;
      }

      if (pageIssues.length > 0) {
        opportunities.push({
          id: page.id,
          path: page.path,
          domain: domain,
          issues: pageIssues
        });
      }
    }

    // Weight health score with average speed
    healthScore = (healthScore * 0.7) + (avgSpeed * 0.3);
    healthScore = Math.max(0, Math.min(100, Math.round(healthScore)));

    return NextResponse.json({
      healthScore,
      pagesScanned: pages.length,
      issuesFound,
      optimizedCount: activeRulesCount,
      opportunities: opportunities.sort((a,b) => b.issues.length - a.issues.length).slice(0, 15),
      generatedAt: new Date().toISOString(),
      siteDetails: siteId ? sitesMap[siteId] : null
    });

  } catch (error: any) {
    console.error('Error generating report summary:', error);
    return NextResponse.json(
      { error: `Failed to generate report: ${error.message}` },
      { status: 500 }
    );
  }
}
