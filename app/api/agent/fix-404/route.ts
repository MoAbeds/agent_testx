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
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const prompt = `Act as an SEO Expert. 
I have the following broken (404) URLs on my website:
${deadPages.map(p => p.path).join('\n')}

And the following valid (200 OK) target URLs:
${targetPaths.join('\n')}

For each broken URL, find the most relevant valid target URL to redirect to.
Return ONLY a JSON array of objects: [{"from": "/broken-path", "to": "/valid-path", "reasoning": "..."}]`;

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
