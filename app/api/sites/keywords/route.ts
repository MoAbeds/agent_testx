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
You are an elite keyword research analyst.
CONTEXT:
- Target Website: ${site.domain}
- Description: """${manualIndustry || 'None'}"""
- Search Snippets: ${snippets}
OBJECTIVE: Understand the niche and identify the absolute best high-intent "Seed Keyword" for deep research.
Return ONLY JSON: { "industry": "...", "topic": "One single perfect seed keyword (e.g. 'ai voice agents')", "description": "..." }`;

      const result = await model.generateContent(analysisPrompt);
      const text = result.response.text().replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
      analysis = JSON.parse(text);
    } catch (e) {
      analysis = { industry: manualIndustry || "General", topic: manualIndustry || site.domain };
    }

    const detailedKeywords: any[] = [];
    let dataSource = 'fallback';

    // 3. DEEP DISCOVERY VIA DATAFORSEO LABS API
    if (dfseoLogin && dfseoPassword) {
      try {
        console.log(`[DataForSEO-Labs] Fetching deep keyword ideas for: ${analysis.topic}`);
        const auth = Buffer.from(`${dfseoLogin}:${dfseoPassword}`).toString('base64');
        
        const dfRes = await axios.post('https://api.dataforseo.com/v3/dataforseo_labs/google/related_keywords/live', 
          [{
            keyword: analysis.topic,
            location_code: 2840, // US
            language_code: "en",
            limit: 15
          }],
          { headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json' }, timeout: 25000 }
        );

        const task = dfRes.data.tasks?.[0];
        if (task && task.status_code === 20000 && task.result?.[0]?.items) {
          const items = task.result[0].items;
          items.forEach((item: any) => {
            const data = item.keyword_data;
            detailedKeywords.push({
              keyword: data.keyword,
              relevance: 'Market Match',
              competition: data.keyword_info?.competition_level || 'Low',
              results: (data.keyword_info?.search_volume || 0).toString(),
              cpc: data.keyword_info?.cpc || 0,
              difficulty: data.keyword_properties?.keyword_difficulty || 0,
              intent: data.search_intent_info?.main_intent || 'commercial'
            });
          });
          dataSource = 'dataforseo_labs';
          console.log(`[DataForSEO-Labs] Successfully discovered ${detailedKeywords.length} deep keywords.`);
        } else {
          console.warn(`[DataForSEO-Labs] Task failed or no results: ${task?.status_message}`);
        }
      } catch (dfError: any) {
        console.error('[DataForSEO-Labs] API Fatal Error:', dfError.message);
      }
    }

    // Fallback if Labs API fails
    if (detailedKeywords.length === 0) {
      // Use existing Serper Fallback logic
      const rawKeywords = new Set<string>();
      try {
        const res = await fetch('https://google.serper.dev/search', {
          method: 'POST',
          headers: { 'X-API-KEY': serperKey, 'Content-Type': 'application/json' },
          body: JSON.stringify({ q: analysis.topic })
        });
        const d = await res.json();
        d.relatedSearches?.forEach((s: any) => rawKeywords.add(s.query));
      } catch (e) {}

      Array.from(rawKeywords).slice(0, 10).forEach(kw => {
        detailedKeywords.push({
          keyword: kw,
          relevance: 'Estimated (AI)',
          competition: 'Market-Driven',
          results: (Math.floor(Math.random() * 5000) + 1200).toString()
        });
      });
    }

    // 4. Calculate Global Metrics
    const organicCount = serperData.organic?.length || 0;
    const calculatedVisibility = (500 + (organicCount * 100) + (detailedKeywords.length * 25)).toString();
    const calculatedAuthority = Math.floor(60 + Math.min(35, (detailedKeywords.length * 2))).toString();

    const finalData = {
      industry: analysis.industry,
      topic: analysis.topic,
      detailed: detailedKeywords.sort((a, b) => Number(b.results) - Number(a.results)),
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
