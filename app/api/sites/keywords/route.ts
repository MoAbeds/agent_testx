import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { logEvent } from '@/lib/db';
import axios from 'axios';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_KEY || '');

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { siteId, manualIndustry } = await request.json();

    if (!siteId) return NextResponse.json({ error: 'siteId is required' }, { status: 400 });

    const siteRef = doc(db, "sites", siteId);
    const siteSnap = await getDoc(siteRef);
    if (!siteSnap.exists()) return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    const site = siteSnap.data();

    const serperKey = process.env.SERPER_API_KEY;
    const dfseoLogin = process.env.DATAFORSEO_LOGIN;
    const dfseoPassword = process.env.DATAFORSEO_PASSWORD;

    if (!serperKey) return NextResponse.json({ error: 'Serper API Key not configured' }, { status: 500 });

    // 1. Initial Google Scan via Serper (Context Gathering)
    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: { 'X-API-KEY': serperKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q: manualIndustry ? manualIndustry.substring(0, 100) : `site:${site.domain}`,
        num: 10
      })
    });

    const serperData = await response.json();
    const snippets = serperData.organic?.map((r: any) => `${r.title}: ${r.snippet}`).join('\n') || '';
    
    // 2. AI Analysis (Niche Understanding)
    let analysis;
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });
      const analysisPrompt = `Elite SEO AI Prompt Architecture v2.0
You are an elite keyword research analyst specializing in high-intent commercial B2B/Service queries.

CONTEXT:
- Target Website: ${site.domain}
- User Description: """${manualIndustry || 'None'}"""
- Search Snippets: ${snippets}

OBJECTIVE: 
Analyze the input and identify the 3 most powerful "Core Seed Keywords" that represent the business's actual service.
STRICTLY IGNORE: educational terms (what is), templates, free, tools, or courses.
FOCUS ON: "Service Agency", "Management", "Hire", "Expert", "Solutions".

Return ONLY a JSON object: {
  "seeds": ["seed 1", "seed 2", "seed 3"],
  "industry": "...",
  "topic": "..."
}`;

      const result = await model.generateContent(analysisPrompt);
      const text = result.response.text().replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
      analysis = JSON.parse(text);
    } catch (e) {
      analysis = { seeds: [manualIndustry || site.domain], industry: "General", topic: manualIndustry || site.domain };
    }

    const detailedKeywords: any[] = [];
    let dataSource = 'fallback';

    // 3. DEEP DISCOVERY VIA DATAFORSEO LABS API (Multi-Seed expansion)
    if (dfseoLogin && dfseoPassword && analysis.seeds) {
      try {
        const auth = Buffer.from(`${dfseoLogin}:${dfseoPassword}`).toString('base64');
        
        for (const rawSeed of analysis.seeds.slice(0, 3)) {
          // Sanitize and cap seed length for DataForSEO compatibility
          const seed = rawSeed.replace(/[^a-zA-Z0-9\s]/g, '').trim().substring(0, 60);
          if (seed.length < 3) continue;

          console.log(`[DataForSEO-Labs] Expanding seed: ${seed}`);
          const dfRes = await axios.post('https://api.dataforseo.com/v3/dataforseo_labs/google/keyword_ideas/live', 
            [{
              keyword: seed,
              location_code: 2840, 
              language_code: "en",
              limit: 15,
              include_seed: true
            }],
            { headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json' }, timeout: 25000 }
          );

          const task = dfRes.data.tasks?.[0];
          if (task && task.status_code === 20000 && task.result?.[0]?.items) {
            task.result[0].items.forEach((item: any) => {
              const kwData = item.keyword_data;
              // FILTER: Remove noise (templates, free, etc.)
              const isInfo = kwData.keyword.match(/\b(what|how|why|free|templates|course|pdf|job|salary)\b/i);
              if (!isInfo) {
                detailedKeywords.push({
                  keyword: kwData.keyword,
                  relevance: 'High Intent',
                  competition: kwData.keyword_info?.competition_level || 'Low',
                  results: (kwData.keyword_info?.search_volume || 0).toString(),
                  cpc: kwData.keyword_info?.cpc || 0,
                  difficulty: kwData.keyword_properties?.keyword_difficulty || 0
                });
              }
            });
          }
        }
        if (detailedKeywords.length > 0) dataSource = 'dataforseo_labs_v2';
      } catch (dfError: any) {
        console.error('[DataForSEO-Labs] API Error:', dfError.message);
      }
    }

    // 4. Calculate Metrics
    const organicCount = serperData.organic?.length || 0;
    const finalDetailed = detailedKeywords
      .sort((a, b) => Number(b.results) - Number(a.results))
      .filter((v, i, a) => a.findIndex(t => t.keyword === v.keyword) === i) // Deduplicate
      .slice(0, 15);

    const calculatedVisibility = (500 + (organicCount * 100) + (finalDetailed.length * 25)).toString();
    const calculatedAuthority = Math.floor(60 + Math.min(35, (finalDetailed.length * 2))).toString();

    const finalData = {
      industry: analysis.industry,
      topic: analysis.topic,
      detailed: finalDetailed,
      visibility: calculatedVisibility,
      authority: calculatedAuthority,
      source: dataSource,
      updatedAt: new Date().toISOString()
    };

    await updateDoc(siteRef, { targetKeywords: JSON.stringify(finalData) });

    return NextResponse.json({ success: true, keywords: finalData });

  } catch (error) {
    console.error('Master Keyword Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
