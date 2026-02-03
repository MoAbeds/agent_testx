import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { GoogleGenerativeAI } from '@google/generative-ai';

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

      const prompt = `Act as an Elite SEO Strategist.
Website Domain: ${site.domain}
Page Path: ${page.path}
Current Title: ${page.title || 'Missing'}
Current Meta: ${page.metaDesc || 'Missing'}
Target Keywords for the site: [${siteKeywords.join(', ')}]

Goal: Generate high-performance SEO Title and Meta Description.
- Title < 60 chars, Meta < 160 chars.
- Incorporate target keywords naturally.
- Use click-worthy power words.

Return ONLY a JSON object: {"title": "...", "metaDesc": "...", "reasoning": "..."}`;

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
