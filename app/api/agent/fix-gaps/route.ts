import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const dynamic = 'force-dynamic';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const { siteId } = await request.json();

    if (!siteId) return NextResponse.json({ error: 'siteId is required' }, { status: 400 });

    const site = await prisma.site.findUnique({ where: { id: siteId } });
    if (!site) return NextResponse.json({ error: 'Site not found' }, { status: 404 });

    // 1. Get all SEO Gap events for this site
    const gaps = await prisma.agentEvent.findMany({
      where: { siteId, type: 'SEO_GAP' }
    });

    if (gaps.length === 0) {
      return NextResponse.json({ success: true, message: 'No SEO gaps found' });
    }

    // 2. Get Site Keywords for Context
    let siteKeywords: string[] = [];
    if (site.targetKeywords) {
      try {
        const targetObj = JSON.parse(site.targetKeywords);
        siteKeywords = targetObj.detailed?.map((k: any) => k.keyword) || [];
      } catch (e) {}
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });
    const results = [];

    // 3. Process each gap (Limited to top 5 for performance in bulk)
    for (const gap of gaps.slice(0, 5)) {
      const page = await prisma.page.findFirst({
        where: { siteId, path: gap.path }
      });

      if (!page) continue;

      const prompt = `Elite SEO AI Prompt Architecture v2.0
You are an elite SEO strategist with 15+ years of experience optimizing metadata for Fortune 500 companies and high-converting SaaS products.

CONTEXT:
- Website Domain: ${site.domain}
- Page Path: ${page.path}
- Current Title: ${page.title || 'Missing'}
- Current Meta Description: ${page.metaDesc || 'Missing'}
- Target Keywords: [${siteKeywords.join(', ')}]

OBJECTIVE: Generate high-performance, click-optimized SEO metadata that maximizes CTR while maintaining keyword relevance and search intent alignment.

STRICT REQUIREMENTS:
1. Title tag: 50-60 characters (hard limit: 60)
2. Meta description: 150-160 characters (hard limit: 160)
3. Primary keyword MUST appear in first 8 words of title
4. Include 1-2 power words from this list: Ultimate, Essential, Proven, Expert, Complete, Advanced, Professional, Premium, Verified, Exclusive
5. Ensure emotional trigger + value proposition in meta description
6. Avoid keyword stuffing - maintain natural readability
7. Match search intent (informational/commercial/transactional)
8. NO special characters that break HTML (quotes, brackets, etc.)

ANALYSIS FRAMEWORK:
- Identify primary search intent from keywords
- Analyze competitor patterns in SERP
- Determine user pain point or desire
- Craft compelling value proposition

OUTPUT FORMAT (JSON only, no markdown, no explanation):
{
  "title": "Optimized title here",
  "metaDesc": "Optimized meta description here",
  "reasoning": "Brief explanation of keyword placement strategy and CTR optimization approach",
  "primaryKeyword": "main keyword targeted",
  "intentType": "informational|commercial|transactional"
}`;

      try {
        console.log(`[Bulk-SEO] Requesting Gemini for ${page.path}...`);
        const aiResult = await model.generateContent(prompt);
        const text = aiResult.response.text().replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
        console.log(`[Bulk-SEO] Gemini Response for ${page.path}: ${text}`);
        const optimized = JSON.parse(text);
        
        // ... create rule logic ...
      } catch (err) {
        console.error(`Bulk optimization AI failed for ${page.path}, using heuristic:`, err);
        
        const year = new Date().getFullYear();
        const optimized = {
          title: page.title ? `${page.title} | Official Site ${year}` : `${site.domain} - Professional Services`,
          metaDesc: page.metaDesc ? `${page.metaDesc} Updated for ${year}.` : `Discover the best ${site.domain} services. Expertly crafted for ${year}.`,
          reasoning: 'Heuristic fallback used due to AI service interruption.'
        };

        const rule = await prisma.optimizationRule.create({
          data: {
            siteId,
            targetPath: page.path,
            type: 'REWRITE_META',
            payload: JSON.stringify(optimized),
            isActive: true,
            confidence: 0.8
          }
        });

        await prisma.agentEvent.create({
          data: {
            siteId,
            type: 'AUTO_FIX',
            path: page.path,
            details: JSON.stringify({ 
              message: `Heuristic SEO optimization for ${page.path}`,
              ruleId: rule.id 
            })
          }
        });
        results.push({ path: page.path, success: true });
      }
    }

    return NextResponse.json({ 
      success: true, 
      appliedFixes: results.length,
      processed: gaps.length
    });

  } catch (error) {
    console.error('Bulk SEO Fix error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
