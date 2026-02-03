import { NextRequest, NextResponse } from 'next/server';
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { GoogleGenerativeAI } from '@google/generative-ai';

export const dynamic = 'force-dynamic';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_KEY || '');

function stripMarkdownCodeBlocks(text: string): string {
  return text.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
}

async function generateGeminiOptimization(current: any, keywords: string[]) {
  const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });
  let keywordContext = keywords.length > 0 
    ? `\nTARGET KEYWORDS: [${keywords.join(', ')}]. Prioritize these.` 
    : '';
  
  const prompt = `Act as an Elite SEO Strategist.
Current Title: ${current.title || '(empty)'}
Current Meta: ${current.metaDesc || '(empty)'}${keywordContext}
Goal: Rewrite these to be more click-worthy, use power words, and keep optimal length (Title < 60, Meta < 160).
Return ONLY JSON: { "title": "...", "metaDesc": "...", "reasoning": "..." }`;

  const result = await model.generateContent(prompt);
  const parsed = JSON.parse(stripMarkdownCodeBlocks(result.response.text()));
  return parsed;
}

export async function POST(req: NextRequest) {
  try {
    const { pageId } = await req.json();
    if (!pageId) return NextResponse.json({ error: 'Missing pageId' }, { status: 400 });

    const pageRef = doc(db, "pages", pageId);
    const pageSnap = await getDoc(pageRef);
    if (!pageSnap.exists()) return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    const page = pageSnap.data();

    const siteRef = doc(db, "sites", page.siteId);
    const siteSnap = await getDoc(siteRef);
    if (!siteSnap.exists()) return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    const site = siteSnap.data();

    let keywords: string[] = [];
    if (site.targetKeywords) {
      try {
        const targetObj = JSON.parse(site.targetKeywords);
        keywords = targetObj.detailed?.map((k: any) => k.keyword) || [];
      } catch (e) {}
    }

    const optimized = await generateGeminiOptimization(page, keywords);

    const ruleRef = await addDoc(collection(db, "rules"), {
      siteId: page.siteId,
      targetPath: page.path,
      type: 'REWRITE_META',
      payload: JSON.stringify(optimized),
      isActive: false, 
      confidence: keywords.length > 0 ? 0.95 : 0.92,
      createdAt: serverTimestamp()
    });

    return NextResponse.json({ success: true, ruleId: ruleRef.id, optimized });
  } catch (error) {
    console.error('Optimization error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
