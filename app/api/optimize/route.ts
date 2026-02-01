import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Simulated LLM optimization function.
 * In production, this would call an actual LLM API.
 */
function generateOptimization(current: { title: string | null; metaDesc: string | null; path: string }) {
  const year = new Date().getFullYear();
  
  let optimizedTitle = current.title || '';
  let optimizedMetaDesc = current.metaDesc || '';
  
  // Title optimization heuristics
  if (!optimizedTitle) {
    // Generate from path
    const pathName = current.path.replace(/[/-]/g, ' ').trim();
    optimizedTitle = `${pathName.charAt(0).toUpperCase() + pathName.slice(1)} | Best in ${year}`;
  } else if (optimizedTitle.length < 30) {
    // Short title - make it more compelling
    optimizedTitle = `${optimizedTitle} - Best Guide for ${year}`;
  } else if (!optimizedTitle.includes(String(year))) {
    // Add year if not present
    optimizedTitle = `${optimizedTitle} [${year} Edition]`;
  }
  
  // Ensure title isn't too long (60 chars max for SEO)
  if (optimizedTitle.length > 60) {
    optimizedTitle = optimizedTitle.substring(0, 57) + '...';
  }
  
  // Meta description optimization
  if (!optimizedMetaDesc) {
    // Generate based on title
    optimizedMetaDesc = `Discover everything about ${optimizedTitle.replace(/[|\[\]-]/g, '').trim()}. Updated for ${year} with expert insights and proven strategies.`;
  } else if (optimizedMetaDesc.length < 120) {
    // Too short - expand it
    optimizedMetaDesc = `${optimizedMetaDesc} Learn more about our proven approach, updated for ${year}.`;
  }
  
  // Ensure meta description isn't too long (160 chars max for SEO)
  if (optimizedMetaDesc.length > 160) {
    optimizedMetaDesc = optimizedMetaDesc.substring(0, 157) + '...';
  }
  
  return {
    title: optimizedTitle,
    metaDescription: optimizedMetaDesc,
  };
}

export async function POST(req: Request) {
  try {
    const { pageId } = await req.json();

    if (!pageId) {
      return NextResponse.json({ error: 'Missing pageId' }, { status: 400 });
    }

    // Fetch the page from DB
    const page = await prisma.page.findUnique({
      where: { id: pageId },
      include: { site: true },
    });

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    // Generate optimized content
    const optimized = generateOptimization({
      title: page.title,
      metaDesc: page.metaDesc,
      path: page.path,
    });

    // Create a new OptimizationRule in Draft mode
    const rule = await prisma.optimizationRule.create({
      data: {
        siteId: page.siteId,
        targetPath: page.path,
        type: 'REWRITE_META',
        payload: JSON.stringify(optimized),
        isActive: false, // Draft mode
        confidence: 0.85, // AI-generated confidence
      },
    });

    return NextResponse.json({
      success: true,
      rule,
      optimized,
    });
  } catch (error) {
    console.error('Error generating optimization:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
