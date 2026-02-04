import { NextRequest, NextResponse } from 'next/server';
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_KEY || '');

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { siteId } = await request.json();
    if (!siteId) return NextResponse.json({ error: 'siteId required' }, { status: 400 });

    const siteSnap = await getDoc(doc(db, "sites", siteId));
    if (!siteSnap.exists()) return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    const siteData = siteSnap.data();

    // 1. Get current keywords
    let keywords: any[] = [];
    if (siteData.targetKeywords) {
      try { keywords = JSON.parse(siteData.targetKeywords).detailed || []; } catch (e) {}
    }

    // 2. Get existing pages to avoid duplicates
    const pagesQ = query(collection(db, "pages"), where("siteId", "==", siteId));
    const pagesSnap = await getDocs(pagesQ);
    const existingPaths = pagesSnap.docs.map(d => d.data().path);

    // 3. AI Identify Gaps
    const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });
    const prompt = `Elite SEO Architect v3.0
Analyze these keywords and existing pages. Identify 3 massive "Content Gaps" (topics we aren't covering but should).
Keywords: [${keywords.map(k => k.keyword).join(', ')}]
Existing Paths: [${existingPaths.join(', ')}]

Return ONLY JSON array of objects: [{"topic": "...", "targetKeyword": "...", "suggestedPath": "...", "reasoning": "..."}]`;

    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();
    if (text.includes('```')) text = text.replace(/```json|```/g, '').trim();
    
    const gaps = JSON.parse(text);

    let count = 0;
    for (const gap of (Array.isArray(gaps) ? gaps : gaps.gaps || [])) {
      await addDoc(collection(db, "events"), {
        siteId,
        type: 'CONTENT_GAP',
        path: gap.suggestedPath,
        details: JSON.stringify(gap),
        occurredAt: serverTimestamp()
      });
      count++;
    }

    return NextResponse.json({ success: true, gapsFound: count });
  } catch (error: any) {
    console.error("Gap Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
