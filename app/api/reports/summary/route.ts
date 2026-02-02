import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

interface Opportunity {
  id: string;
  path: string;
  domain: string;
  issues: string[];
}

export async function GET() {
  try {
    // Fetch all pages with site info
    const pages = await prisma.page.findMany({
      include: {
        site: {
          select: { domain: true }
        }
      }
    });

    // Fetch optimization rules
    const rules = await prisma.optimizationRule.findMany();

    // Calculate stats
    const totalPages = pages.length;
    const activeRulesCount = rules.filter(r => r.isActive).length;
    
    // Calculate health score and identify issues
    let healthScore = 100;
    let issuesFound = 0;
    const opportunities: Opportunity[] = [];

    const LOW_WORD_COUNT_THRESHOLD = 100;

    for (const page of pages) {
      const pageIssues: string[] = [];
      
      // Check for missing title
      if (!page.title || page.title.trim() === '') {
        pageIssues.push('Missing title tag');
        healthScore -= 10;
        issuesFound++;
      }
      
      // Check for missing meta description
      if (!page.metaDesc || page.metaDesc.trim() === '') {
        pageIssues.push('Missing meta description');
        healthScore -= 10;
        issuesFound++;
      }

      // Check for low word count in title (proxy for thin content)
      if (page.title && page.title.split(' ').length < 3) {
        pageIssues.push('Title too short');
      }

      // Check for short meta description
      if (page.metaDesc && page.metaDesc.length < 50) {
        pageIssues.push('Meta description too short');
      }

      // If page has issues, add to opportunities
      if (pageIssues.length > 0) {
        opportunities.push({
          id: page.id,
          path: page.path,
          domain: page.site.domain,
          issues: pageIssues
        });
      }
    }

    // Clamp health score to 0-100
    healthScore = Math.max(0, Math.min(100, healthScore));

    return NextResponse.json({
      healthScore,
      pagesScanned: totalPages,
      issuesFound,
      optimizedCount: activeRulesCount,
      opportunities: opportunities.slice(0, 10), // Limit to top 10
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
