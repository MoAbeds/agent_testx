import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const { pageId } = await request.json();

    if (!pageId) return NextResponse.json({ error: 'pageId is required' }, { status: 400 });

    const page = await prisma.page.findUnique({
      where: { id: pageId },
      include: { site: true }
    });

    if (!page) return NextResponse.json({ error: 'Page not found' }, { status: 404 });

    // Fetch the actual page content to optimize
    const url = `https://${page.site.domain}${page.path}`;
    const response = await fetch(url);
    const html = await response.text();

    const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });
    
    const prompt = `Elite SEO AI Prompt Architecture v2.0
You are an elite on-page SEO content strategist with expertise in semantic optimization, readability engineering, and conversion-focused copywriting.

CONTEXT:
Raw HTML Content: [HTML string below]
Target Keywords: [${page.site.targetKeywords || 'N/A'}]
Current H1: [${page.h1 || 'N/A'}]
Page Type: [${page.path === '/' ? 'homepage' : 'internal'}]

OBJECTIVE: Analyze the HTML content structure and provide actionable, specific recommendations to improve on-page SEO signals, semantic relevance, and user engagement.

ANALYSIS FRAMEWORK:
1. H1 Optimization:
- Is it unique, compelling, and keyword-optimized?
- Does it match search intent?
- Does it use power words for engagement?
2. Content Structure:
- Are headings (H2-H4) properly hierarchical?
- Is keyword distribution natural (avoid stuffing)?
- Are there semantic keyword variations (LSI)?
- Is readability appropriate for target audience?
3. Engagement Signals:
- Are there clear CTAs?
- Is content scannable (short paragraphs, bullets)?
- Are power words used in key positions?
4. Technical SEO:
- Is there keyword cannibalization risk?
- Are internal linking opportunities identified?

POWER WORD LIBRARY (inject where natural):
Proven, Essential, Ultimate, Expert, Premium, Exclusive, Guaranteed, Certified, Advanced, Complete, Professional, Verified, Breakthrough, Revolutionary, Time-Tested

OUTPUT FORMAT (JSON only):
{
  "h1": {
    "current": "Existing H1 text or null",
    "optimized": "Improved H1 with keyword + power word",
    "improvement": "Explanation of what changed and why"
  },
  "contentSuggestions": [
    "Specific actionable improvement 1",
    "Specific actionable improvement 2",
    "Specific actionable improvement 3",
    "Specific actionable improvement 4",
    "Specific actionable improvement 5"
  ],
  "missingElements": [
    "Critical element missing"
  ],
  "readabilityScore": "easy|moderate|complex",
  "keywordDensity": "optimal|too low|too high",
  "reasoning": "Overall strategic rationale for these recommendations"
}`;

    const result = await model.generateContent([
      { text: prompt },
      { text: `Raw HTML Content:\n${html.substring(0, 15000)}` }
    ]);

    const optimized = JSON.parse(result.response.text().replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim());

    // Create a new OptimizationRule for content
    const rule = await prisma.optimizationRule.create({
      data: {
        siteId: page.siteId,
        targetPath: page.path,
        type: 'INJECT_CONTENT',
        payload: JSON.stringify(optimized),
        isActive: false, // User must approve content changes
        confidence: 0.88
      }
    });

    return NextResponse.json({ success: true, rule, optimized });

  } catch (error) {
    console.error('Content optimization error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
