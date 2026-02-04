import { NextRequest, NextResponse } from 'next/server';
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";

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
    const userId = searchParams.get('userId'); // Pass userId for server-side verification

    if (!userId) return NextResponse.json({ error: 'Unauthorized: No userId' }, { status: 401 });

    // 1. Fetch sites belonging ONLY to this user
    const sitesQuery = query(collection(db, "sites"), where("userId", "==", userId));
    const sitesSnap = await getDocs(sitesQuery);
    
    const sitesMap: Record<string, any> = {};
    sitesSnap.forEach(doc => {
      const siteData = doc.data();
      if (siteData.targetKeywords) {
        try {
          const parsed = JSON.parse(siteData.targetKeywords);
          siteData.authority = parsed.authority;
          siteData.visibility = parsed.visibility;
        } catch (e) {}
      }
      sitesMap[doc.id] = siteData;
    });

    const siteIds = Object.keys(sitesMap);
    
    // If a specific siteId was requested, verify ownership
    if (siteId && !siteIds.includes(siteId)) {
      return NextResponse.json({ error: 'Unauthorized site access' }, { status: 403 });
    }

    const targetSiteIds = siteId ? [siteId] : siteIds;

    if (targetSiteIds.length === 0) {
      return NextResponse.json({
        healthScore: 0,
        pagesScanned: 0,
        issuesFound: 0,
        optimizedCount: 0,
        opportunities: [],
        generatedAt: new Date().toISOString()
      });
    }

    // 2. Fetch pages for THESE specific sites only
    const pagesQ = query(collection(db, "pages"), where("siteId", "in", targetSiteIds.slice(0, 10)));
    const pagesSnap = await getDocs(pagesQ);
    const pages = pagesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));

    // 3. Fetch rules for THESE specific sites only
    const rulesQ = query(collection(db, "rules"), where("siteId", "in", targetSiteIds.slice(0, 10)));
    const rulesSnap = await getDocs(rulesQ);
    const activeRulesCount = rulesSnap.docs.filter(doc => doc.data().isActive).length;

    // 4. Calculate stats
    let healthScore = 100;
    let issuesFound = 0;
    const opportunities: Opportunity[] = [];

    for (const page of pages) {
      const pageIssues: string[] = [];
      const siteData = sitesMap[page.siteId];
      if (!siteData) continue; // Final safety filter

      const domain = siteData.domain || 'unknown';
      
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
