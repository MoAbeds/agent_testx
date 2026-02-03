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
    
    const prompt = `Act as an Elite SEO Content Optimizer.
Analyze this HTML and improve its on-page SEO:
1. Suggest a better H1 if the current one is weak.
2. Provide 3-5 bullet points of content improvements (injecting keywords, improving readability).
3. Identify if any "Power Words" are missing in the headers.

Return ONLY a JSON object: {"h1": "...", "contentSuggestions": ["...", "..."], "reasoning": "..."}`;

    const result = await model.generateContent([
      { text: prompt },
      { text: `HTML Content:\n${html.substring(0, 15000)}` } // Cap for token limits
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
