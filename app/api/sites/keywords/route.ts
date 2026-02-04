import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { logEvent } from '@/lib/db';
import axios from 'axios';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_KEY || '');

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { siteId, manualIndustry, forceSeeds } = await request.json();

    if (!siteId) return NextResponse.json({ error: 'siteId is required' }, { status: 400 });

    const siteRef = doc(db, "sites", siteId);
    const siteSnap = await getDoc(siteRef);
    if (!siteSnap.exists()) return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    const site = siteSnap.data();

    const serperKey = process.env.SERPER_API_KEY;
    const dfseoLogin = process.env.DATAFORSEO_LOGIN;
    const dfseoPassword = process.env.DATAFORSEO_PASSWORD;

    if (!serperKey) return NextResponse.json({ error: 'Serper API Key not configured' }, { status: 500 });

    let seeds = forceSeeds || [];
    let industry = manualIndustry || site.manualIndustry || "General";
    let topic = site.domain;

    // 1. If no seeds provided, run AI Analysis
    if (seeds.length === 0) {
      try {
        const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });
        const analysisPrompt = `Elite SEO AI Prompt Architecture v2.0
Identify the 3 most powerful "Core Seed Keywords" for this business.
Industry: ${industry}
Description: """${site.domain}"""
Return ONLY JSON: { "seeds": ["seed 1", "seed 2", "seed 3"], "industry": "...", "topic": "..." }`;

        const result = await model.generateContent(analysisPrompt);
        const analysis = JSON.parse(result.response.text().replace(/```json|```/g, '').trim());
        seeds = analysis.seeds;
        industry = analysis.industry;
        topic = analysis.topic;
      } catch (e) {
        seeds = [industry];
      }
    }

    const detailedKeywords: any[] = [];
    let dataSource = 'fallback';

    // 2. DataForSEO Lookup with provided seeds
    if (dfseoLogin && dfseoPassword && seeds.length > 0) {
      const auth = Buffer.from(`${dfseoLogin}:${dfseoPassword}`).toString('base64');
      const sanitizedSeeds = seeds.slice(0, 5).map((s: string) => s.replace(/[^a-zA-Z0-9\s]/g, '').trim().substring(0, 60));

      const requests = sanitizedSeeds.map((seed: string) => 
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
            if (!data.keyword.match(/\b(what|how|why|free|pdf|salary|job)\b/i)) {
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

    // 3. Final Processing
    const finalDetailed = detailedKeywords
      .filter((v, i, a) => a.findIndex(t => t.keyword === v.keyword) === i)
      .sort((a, b) => Number(b.results) - Number(a.results))
      .slice(0, 20);

    // Calculate Visibility/Authority
    const myVisibility = 500 + (finalDetailed.length * 150);
    const myAuthority = Math.min(98, 60 + (finalDetailed.length * 1.5));

    const finalData = {
      industry: industry,
      topic: topic || seeds[0],
      detailed: finalDetailed,
      visibility: myVisibility.toString(),
      authority: myAuthority.toString(),
      source: dataSource,
      updatedAt: new Date().toISOString()
    };

    await updateDoc(siteRef, { targetKeywords: JSON.stringify(finalData) });
    return NextResponse.json({ success: true, keywords: finalData });

  } catch (error: any) {
    console.error('Research Error:', error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
