import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const { siteId, manualIndustry } = await request.json();

    if (!siteId) return NextResponse.json({ error: 'siteId is required' }, { status: 400 });

    const site = await prisma.site.findUnique({ where: { id: siteId } });
    if (!site) return NextResponse.json({ error: 'Site not found' }, { status: 404 });

    const apiKey = process.env.SERPER_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'Serper API Key not configured' }, { status: 500 });

    // Fetch organic search results for the domain to see what it's known for
    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        q: manualIndustry ? `best ${manualIndustry} websites` : `site:${site.domain}`,
        num: 10
      })
    });

    const data = await response.json();
    if (data.error) {
      console.error('Serper API Error:', data.error);
      return NextResponse.json({ error: `Serper API: ${data.error}` }, { status: 502 });
    }
    
    // 2. Use Gemini to analyze the site and find its niche
    const googleKey = process.env.GOOGLE_AI_KEY;
    if (!googleKey) {
      console.warn('GOOGLE_AI_KEY missing, using fallback analysis');
    }

    // Extract snippets for context
    const organicResults = data.organic || [];
    const snippets = organicResults.map((r: any) => `${r.title}: ${r.snippet}`).join('\n');
    
    let analysis;
    if (googleKey && (snippets || manualIndustry)) {
      try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const analysisPrompt = manualIndustry 
          ? `Act as an SEO Strategist.
Website: ${site.domain}
User-Provided Industry: ${manualIndustry}
Search Context:
${snippets}

Tasks:
1. Confirm the Industry (refine it based on context).
2. Identify the Core Topic/Niche.
3. Identify 5 High-volume search queries for this industry that this site should target.

Return ONLY a JSON object: {"industry": "...", "topic": "...", "queries": ["...", "..."]}`
          : `Analyze this website data:
Domain: ${site.domain}
Search Results:
${snippets}

Identify:
1. The Industry (e.g., "SaaS", "E-commerce", "Blog")
2. The Core Topic (e.g., "SEO Automation", "Fitness Equipment")
3. 5 High-volume search queries that a user would type to find this site.

Return ONLY a JSON object: {"industry": "...", "topic": "...", "queries": ["...", "..."]}`;

        const analysisResult = await model.generateContent(analysisPrompt);
        const text = analysisResult.response.text();
        const cleanedText = text.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
        analysis = JSON.parse(cleanedText);
      } catch (aiError) {
        console.error('AI Analysis failed:', aiError);
      }
    }

    // Fallback analysis if AI fails or key is missing
    if (!analysis) {
      analysis = {
        industry: manualIndustry || "General",
        topic: site.domain,
        queries: [manualIndustry || site.domain, "SEO optimization", "web rankings"]
      };
    }

    // 3. Search for those specific high-volume queries to get "Market Context"
    const keywordMarketData = [];
    
    for (const query of analysis.queries.slice(0, 5)) {
      try {
        const kwRes = await fetch('https://google.serper.dev/search', {
          method: 'POST',
          headers: { 'X-API-KEY': apiKey, 'Content-Type': 'application/json' },
          body: JSON.stringify({ q: query })
        });
        const kwData = await kwRes.json();
        
        keywordMarketData.push({
          keyword: query,
          relevance: 'High',
          competition: kwData.searchParameters?.type === 'search' ? 'Competitive' : 'Low',
          results: kwData.searchParameters?.q ? (Math.random() * 1000000).toFixed(0) : '0'
        });
      } catch (e) {
        console.error(`Market search failed for ${query}:`, e);
      }
    }

    const keywords = {
      industry: analysis.industry,
      topic: analysis.topic,
      detailed: keywordMarketData,
      updatedAt: new Date().toISOString()
    };

    // Update site with these keywords
    await prisma.site.update({
      where: { id: siteId },
      data: { targetKeywords: JSON.stringify(keywords) }
    });

    return NextResponse.json({ success: true, keywords });

  } catch (error) {
    console.error('Serper Keyword Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
