import { NextResponse } from 'next/server';
import { db } from "@/lib/firebase";
import { collection, getDocs, query, limit } from "firebase/firestore";

export const dynamic = 'force-dynamic';

interface Opportunity {
  id: string;
  path: string;
  domain: string;
  issues: string[];
}

export async function GET() {
  try {
    if (!db) return NextResponse.json({ error: 'Firestore not initialized' }, { status: 500 });

    // 1. Fetch all sites
    const sitesSnap = await getDocs(collection(db, "sites"));
    const sitesMap: Record<string, string> = {};
    sitesSnap.forEach(doc => {
      sitesMap[doc.id] = doc.data().domain;
    });

    // 2. Fetch all pages
    const pagesSnap = await getDocs(collection(db, "pages"));
    const pages = pagesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));

    // 3. Fetch all rules
    const rulesSnap = await getDocs(collection(db, "rules"));
    const activeRulesCount = rulesSnap.docs.filter(doc => doc.data().isActive).length;

    // 4. Calculate stats and health score
    let healthScore = 100;
    let issuesFound = 0;
    const opportunities: Opportunity[] = [];

    for (const page of pages) {
      const pageIssues: string[] = [];
      const domain = sitesMap[page.siteId] || 'unknown';
      
      if (!page.title || page.title.trim() === '') {
        pageIssues.push('Missing title tag');
        healthScore -= 5;
        issuesFound++;
      }
      
      if (!page.metaDesc || page.metaDesc.trim() === '') {
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

    healthScore = Math.max(0, Math.min(100, healthScore));

    return NextResponse.json({
      healthScore,
      pagesScanned: pages.length,
      issuesFound,
      optimizedCount: activeRulesCount,
      opportunities: opportunities.slice(0, 10),
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error generating report summary:', error);
    return NextResponse.json(
      { error: 'Failed to generate report summary' },
      { status: 500 }
    );
  }
}
