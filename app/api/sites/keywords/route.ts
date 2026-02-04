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

    // 1. Initial Context via Serper
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
    
    // 2. AI Analysis - Identify 3 High-Intent Seeds preserving Industry
    let analysis;
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });
      const analysisPrompt = `Elite SEO AI Prompt Architecture v2.0
Identify the 3 most powerful "Core Seed Keywords" for this business.
STRICTLY PRESERVE the specific industry (e.g. if it's Real Estate, keep 'Real Estate').
FOCUS ON: "Service", "Agency", "Expert", "Management".
IGNORE: "What is", "Free", "Templates".

Description: """${manualIndustry || site.domain}"""
Return ONLY JSON: { "seeds": ["seed 1", "seed 2", "seed 3"], "industry": "...", "topic": "..." }`;

      const result = await model.generateContent(analysisPrompt);
      analysis = JSON.parse(result.response.text().replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim());
    } catch (e) {
      analysis = { seeds: [manualIndustry || site.domain], industry: "General", topic: manualIndustry || site.domain };
    }

    const detailedKeywords: any[] = [];
    let dataSource = 'fallback';

    // 3. Parallel DataForSEO Lookup
    if (dfseoLogin && dfseoPassword && analysis.seeds) {
      const auth = Buffer.from(`${dfseoLogin}:${dfseoPassword}`).toString('base64');
      const seeds = analysis.seeds.slice(0, 3).map((s: string) => s.replace(/[^a-zA-Z0-9\s]/g, '').trim().substring(0, 60));

      const requests = seeds.map((seed: string) => 
        axios.post('https://api.dataforseo.com/v3/dataforseo_labs/google/keyword_ideas/live', 
          [{ keyword: seed, location_code: 2840, language_code: "en", limit: 15, include_seed: true }],
          { headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json' }, timeout: 15000 }
        ).catch(() => null)
      );

      const responses = await Promise.all(requests);
      responses.forEach(res => {
        const task = res?.data?.tasks?.[0];
        if (task?.status_code === 20000 && task.result?.[0]?.items) {
          task.result[0].items.forEach((item: any) => {
            const data = item.keyword_data;
            if (!data.keyword.match(/\b(what|how|why|free|templates|course|pdf|salary|job)\b/i)) {
              detailedKeywords.push({
                keyword: data.keyword,
                relevance: 'High Intent',
                competition: data.keyword_info?.competition_level || 'Low',
                results: (data.keyword_info?.search_volume || 0).toString(),
                cpc: data.keyword_info?.cpc || 0,
                difficulty: data.keyword_properties?.keyword_difficulty || 0
              });
            }
          });
        }
      });
      if (detailedKeywords.length > 0) dataSource = 'dataforseo_v4';
    }

    // 4. Final Processing
    const finalDetailed = detailedKeywords
      .filter((v, i, a) => a.findIndex(t => t.keyword === v.keyword) === i)
      .sort((a, b) => Number(b.results) - Number(a.results))
      .slice(0, 15);

    console.log(`[Research] Finalized ${finalDetailed.length} keywords for ${site.domain}`);

    // If still 0, fallback to simple Serper keywords
    if (finalDetailed.length === 0) {
      const d = await (await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: { 'X-API-KEY': serperKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: analysis.topic })
      })).json();
      
      (d.relatedSearches || []).slice(0, 10).forEach((s: any) => {
        finalDetailed.push({
          keyword: s.query,
          relevance: 'Estimated',
          competition: 'Market-Driven',
          results: '1200',
          cpc: 0,
          difficulty: 30
        });
      });
    }

    // Calculate Scores
    const organicCount = serperData.organic?.length || 0;
    const calculatedVisibility = (500 + (organicCount * 100) + (finalDetailed.length * 50)).toString();
    const calculatedAuthority = (Math.min(95, 60 + (finalDetailed.length * 2))).toString();

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

  } catch (error: any) {
    console.error('Research Critical Error:', error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
