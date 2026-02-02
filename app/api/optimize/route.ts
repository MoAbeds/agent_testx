import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_KEY || '');

/**
 * Fallback heuristic optimization (used if Gemini fails).
 */
function generateHeuristicOptimization(current: { title: string | null; metaDesc: string | null; path: string }) {
  const year = new Date().getFullYear();
  
  let optimizedTitle = current.title || '';
  let optimizedMetaDesc = current.metaDesc || '';
  
  // Title optimization heuristics
  if (!optimizedTitle) {
    const pathName = current.path.replace(/[/-]/g, ' ').trim();
    optimizedTitle = `${pathName.charAt(0).toUpperCase() + pathName.slice(1)} | Best in ${year}`;
  } else if (optimizedTitle.length < 30) {
    optimizedTitle = `${optimizedTitle} - Best Guide for ${year}`;
  } else if (!optimizedTitle.includes(String(year))) {
    optimizedTitle = `${optimizedTitle} [${year} Edition]`;
  }
  
  if (optimizedTitle.length > 60) {
    optimizedTitle = optimizedTitle.substring(0, 57) + '...';
  }
  
  // Meta description optimization
  if (!optimizedMetaDesc) {
    optimizedMetaDesc = `Discover everything about ${optimizedTitle.replace(/[|\[\]-]/g, '').trim()}. Updated for ${year} with expert insights and proven strategies.`;
  } else if (optimizedMetaDesc.length < 120) {
    optimizedMetaDesc = `${optimizedMetaDesc} Learn more about our proven approach, updated for ${year}.`;
  }
  
  if (optimizedMetaDesc.length > 160) {
    optimizedMetaDesc = optimizedMetaDesc.substring(0, 157) + '...';
  }
  
  return {
    title: optimizedTitle,
    metaDescription: optimizedMetaDesc,
    reasoning: 'Generated using heuristic fallback (AI unavailable)',
  };
}

/**
 * Strip markdown code blocks from Gemini response
 */
function stripMarkdownCodeBlocks(text: string): string {
  // Remove ```json ... ``` or ``` ... ``` wrappers
  return text.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
}

/**
 * Use Gemini AI to generate optimized SEO content.
 */
async function generateGeminiOptimization(current: { title: string | null; metaDesc: string | null; path: string }) {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  
  const prompt = `Act as an Elite SEO Strategist.
Current Title: ${current.title || '(empty)'}
Current Meta: ${current.metaDesc || '(empty)'}
Goal: Rewrite these to be more click-worthy, use power words, and keep optimal length (Title < 60, Meta < 160).
Return ONLY a JSON object: { "title": "...", "metaDesc": "...", "reasoning": "..." }`;

  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text();
  
  // Strip markdown code blocks and parse JSON
  const cleanedText = stripMarkdownCodeBlocks(text);
  const parsed = JSON.parse(cleanedText);
  
  return {
    title: parsed.title,
    metaDescription: parsed.metaDesc,
    reasoning: parsed.reasoning,
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

    // Try Gemini first, fallback to heuristics
    let optimized;
    let usedGemini = false;
    
    try {
      optimized = await generateGeminiOptimization({
        title: page.title,
        metaDesc: page.metaDesc,
        path: page.path,
      });
      usedGemini = true;
    } catch (geminiError) {
      console.error('Gemini API failed, using heuristic fallback:', geminiError);
      optimized = generateHeuristicOptimization({
        title: page.title,
        metaDesc: page.metaDesc,
        path: page.path,
      });
    }

    // Create a new OptimizationRule in Draft mode
    const rule = await prisma.optimizationRule.create({
      data: {
        siteId: page.siteId,
        targetPath: page.path,
        type: 'REWRITE_META',
        payload: JSON.stringify(optimized),
        isActive: false, // Draft mode
        confidence: usedGemini ? 0.92 : 0.85, // Higher confidence for AI
      },
    });

    return NextResponse.json({
      success: true,
      rule,
      optimized,
      source: usedGemini ? 'gemini' : 'heuristic',
    });
  } catch (error) {
    console.error('Error generating optimization:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
