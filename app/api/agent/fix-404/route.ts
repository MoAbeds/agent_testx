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

    // 1. Get all 404 pages
    const deadPages = await prisma.page.findMany({
      where: { siteId, status: 404 }
    });

    console.log(`[Fix-404] Found ${deadPages.length} dead pages for site ${siteId}`);

    if (deadPages.length === 0) {
      console.log(`[Fix-404] No 404s to fix. Exiting.`);
      return NextResponse.json({ success: true, message: 'No 404 pages found in database. Run a scan first.' });
    }

    // 2. Get all valid pages (targets)
    const validPages = await prisma.page.findMany({
      where: { siteId, status: 200 },
      select: { path: true }
    });

    console.log(`[Fix-404] Found ${validPages.length} valid target pages.`);

    if (validPages.length === 0) {
      return NextResponse.json({ error: 'No valid target pages found to redirect to. Crawl some working pages first.' }, { status: 400 });
    }

    const targetPaths = validPages.map(p => p.path);

    // 3. Ask Gemini to pair them (with simple fallback if no key)
    const googleKey = process.env.GOOGLE_AI_KEY;
    let mappings = [];

    if (googleKey) {
      try {
        const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });
    const prompt = `Elite SEO AI Prompt Architecture v2.0
You are an expert SEO technical consultant specializing in site architecture and intelligent redirect strategies that preserve link equity and user experience.

CONTEXT:
Broken URLs (404 errors): [${deadPages.map(p => p.path).join(', ')}]
Valid Target URLs (200 OK): [${targetPaths.join(', ')}]

OBJECTIVE: Map each broken URL to the most semantically relevant valid URL using advanced matching algorithms that consider:
1. URL path similarity (substring matching, hierarchical structure)
2. Topical relevance (content theme alignment)
3. User intent preservation (what they were looking for)
4. Link equity value (prefer high-authority targets)

MATCHING CRITERIA (Priority Order):
1. Exact path parent match (e.g., /blog/old-post → /blog/new-post)
2. Keyword overlap in URL slugs (extract nouns/verbs, calculate similarity)
3. Semantic category alignment (product pages → product category, etc.)
4. Fallback to homepage ONLY if no reasonable match exists

RULES:
- Never redirect to irrelevant pages (damages UX and SEO)
- Prefer deeper content pages over category pages
- If multiple matches exist, choose the most specific/relevant
- Flag low-confidence matches (similarity score < 60%)

OUTPUT FORMAT (JSON array only):
[
  {
    "from": "/broken-path",
    "to": "/best-match-path",
    "confidence": "high|medium|low",
    "reasoning": "Brief explanation of why this is the best match (path similarity, topical relevance, etc.)",
    "matchScore": 85
  }
]
Sort results by confidence (high → low).`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text().replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
        mappings = JSON.parse(responseText);
      } catch (aiErr) {
        console.error('[Fix-404] AI pairing failed, falling back to string matching:', aiErr);
      }
    }

    // Heuristic Fallback: String matching if AI fails or key missing
    if (mappings.length === 0) {
      console.log('[Fix-404] Using heuristic string matching');
      for (const dead of deadPages) {
        // Just redirect everything to homepage as ultimate fallback, 
        // or try to find a path that contains a similar word
        const slug = dead.path.split('/').pop() || '';
        const match = targetPaths.find(p => slug && p.includes(slug)) || '/';
        mappings.push({
          from: dead.path,
          to: match,
          reasoning: 'Paired using heuristic string matching (AI unavailable)'
        });
      }
    }

    const createdRules = [];

    // 4. Create REDIRECT_301 rules
    for (const mapping of mappings) {
      const rule = await prisma.optimizationRule.create({
        data: {
          siteId,
          targetPath: mapping.from,
          type: 'REDIRECT_301',
          payload: JSON.stringify({ 
            redirectTo: mapping.to, 
            reasoning: mapping.reasoning 
          }),
          isActive: true, // Auto-fix
          confidence: 0.9
        }
      });
      
      // Log the fix in AgentEvents for the Audit/Undo system
      await prisma.agentEvent.create({
        data: {
          siteId,
          type: 'AUTO_FIX',
          path: mapping.from,
          details: JSON.stringify({ 
            message: `Auto-fixed 404 by redirecting to ${mapping.to}`,
            ruleId: rule.id 
          })
        }
      });
      
      createdRules.push(rule);
    }

    return NextResponse.json({ 
      success: true, 
      fixesApplied: createdRules.length,
      mappings 
    });

  } catch (error) {
    console.error('Fix-404 error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
