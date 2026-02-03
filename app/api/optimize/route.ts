import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { google } from 'googleapis';
import { getServerSession } from 'next-auth';

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
 * Fetch ranking keywords from Google Search Console for a given URL.
 * Returns top 5 queries the page ranks for (last 30 days).
 */
async function fetchGSCKeywords(userId: string, targetUrl: string): Promise<string[] | null> {
  try {
    // Get the user's Google account with tokens
    const account = await prisma.account.findFirst({
      where: {
        userId,
        provider: 'google',
      },
    });

    if (!account?.access_token || !account?.refresh_token) {
      console.log('GSC: User not connected to Google or missing tokens');
      return null;
    }

    // Create OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );

    // Set credentials
    oauth2Client.setCredentials({
      access_token: account.access_token,
      refresh_token: account.refresh_token,
      expiry_date: account.expires_at ? account.expires_at * 1000 : undefined,
    });

    // Check if token is expired and refresh if needed
    const now = Date.now();
    if (account.expires_at && account.expires_at * 1000 < now) {
      console.log('GSC: Token expired, refreshing...');
      const { credentials } = await oauth2Client.refreshAccessToken();
      
      // Update the stored tokens
      await prisma.account.update({
        where: { id: account.id },
        data: {
          access_token: credentials.access_token,
          refresh_token: credentials.refresh_token || account.refresh_token,
          expires_at: credentials.expiry_date ? Math.floor(credentials.expiry_date / 1000) : null,
        },
      });
      
      oauth2Client.setCredentials(credentials);
    }

    // Initialize Search Console API
    const searchconsole = google.searchconsole({ version: 'v1', auth: oauth2Client });

    // Calculate dates (last 30 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    const formatDate = (d: Date) => d.toISOString().split('T')[0];

    // Extract domain from target URL for siteUrl
    const urlObj = new URL(targetUrl);
    const siteUrl = `sc-domain:${urlObj.hostname.replace(/^www\./, '')}`;
    
    // Query Search Console
    const response = await searchconsole.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate: formatDate(startDate),
        endDate: formatDate(endDate),
        dimensions: ['query'],
        dimensionFilterGroups: [
          {
            filters: [
              {
                dimension: 'page',
                operator: 'equals',
                expression: targetUrl,
              },
            ],
          },
        ],
        rowLimit: 5,
      },
    });

    // Extract keywords from response
    const keywords = response.data.rows?.map(row => row.keys?.[0]).filter(Boolean) as string[];
    
    if (keywords && keywords.length > 0) {
      console.log(`GSC: Found ${keywords.length} keywords for ${targetUrl}:`, keywords);
      return keywords;
    }
    
    console.log('GSC: No keywords found for this page');
    return null;
  } catch (error) {
    console.error('GSC: Error fetching keywords:', error);
    return null;
  }
}

/**
 * Use Gemini AI to generate optimized SEO content.
 * Optionally includes GSC keyword data if available.
 */
async function generateGeminiOptimization(
  current: { title: string | null; metaDesc: string | null; path: string },
  keywords?: string[] | null
) {
  const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });
  
  // Build the prompt with optional keyword data
  let keywordContext = '';
  
  // Priority 1: Serper Keywords (Global Site Context)
  const siteKeywords = keywords && keywords.length > 0 ? keywords : null;
  
  if (siteKeywords) {
    keywordContext = `\nTARGET KEYWORDS: This website targets these high-value keywords: [${siteKeywords.join(', ')}]. Prioritize these in the optimization.`;
  }
  
  const prompt = `Act as an Elite SEO Strategist.
Current Title: ${current.title || '(empty)'}
Current Meta: ${current.metaDesc || '(empty)'}${keywordContext}
Goal: Rewrite these to be more click-worthy, use power words, and keep optimal length (Title < 60, Meta < 160). Leverage the TARGET KEYWORDS to maximize relevance and ranking potential.
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
    keywordsUsed: keywords || [],
  };
}

export async function POST(req: Request) {
  try {
    const { pageId } = await req.json();

    if (!pageId) {
      return NextResponse.json({ error: 'Missing pageId' }, { status: 400 });
    }

    // Fetch the page from DB with site info
    const page = await prisma.page.findUnique({
      where: { id: pageId },
      include: { 
        site: {
          include: { user: true }
        } 
      },
    });

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    // Construct full URL for GSC query
    const fullUrl = `https://${page.site.domain}${page.path}`;
    
    // 1. Try to fetch GSC keywords for this page
    let keywords: string[] = [];
    try {
      const gscKeywords = await fetchGSCKeywords(page.site.userId, fullUrl);
      if (gscKeywords) keywords = [...gscKeywords];
    } catch (gscError) {
      console.error('GSC fetch failed, continuing with Serper/Site keywords:', gscError);
    }

    // 2. Supplement with Serper keywords from the Site record
    if (page.site.targetKeywords) {
      try {
        const targetObj = JSON.parse(page.site.targetKeywords);
        const suggestions = targetObj.suggestions || [];
        // Add top 3 suggestions to the list
        keywords = Array.from(new Set([...keywords, ...suggestions.slice(0, 3)]));
      } catch (e) {}
    }

    // Try Gemini first, fallback to heuristics
    let optimized;
    let usedGemini = false;
    
    try {
      optimized = await generateGeminiOptimization(
        {
          title: page.title,
          metaDesc: page.metaDesc,
          path: page.path,
        },
        keywords
      );
      usedGemini = true;
    } catch (geminiError) {
      console.error('Gemini API failed, using heuristic fallback:', geminiError);
      optimized = {
        ...generateHeuristicOptimization({
          title: page.title,
          metaDesc: page.metaDesc,
          path: page.path,
        }),
        keywordsUsed: keywords,
      };
    }

    // Create a new OptimizationRule in Draft mode
    const rule = await prisma.optimizationRule.create({
      data: {
        siteId: page.siteId,
        targetPath: page.path,
        type: 'REWRITE_META',
        payload: JSON.stringify(optimized),
        isActive: false, // Draft mode
        confidence: usedGemini ? (keywords.length > 0 ? 0.95 : 0.92) : 0.85, // Higher confidence with keyword data
      },
    });

    return NextResponse.json({
      success: true,
      rule,
      optimized,
      source: usedGemini ? 'gemini' : 'heuristic',
      keywords: keywords,
    });
  } catch (error) {
    console.error('Error generating optimization:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
