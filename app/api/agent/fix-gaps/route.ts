import { NextRequest, NextResponse } from 'next/server';
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, getDoc, addDoc, serverTimestamp } from "firebase/firestore";
import { GoogleGenerativeAI } from '@google/generative-ai';
import { logEvent } from '@/lib/db';

export const dynamic = 'force-dynamic';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const { siteId, userId } = await request.json();
    if (!siteId || !userId) return NextResponse.json({ error: 'Missing params' }, { status: 400 });

    const siteRef = doc(db, "sites", siteId);
    const siteSnap = await getDoc(siteRef);
    if (!siteSnap.exists()) return NextResponse.json({ error: 'Site not found' }, { status: 404 });

    // 🔒 OWNERSHIP VERIFICATION
    if (siteSnap.data().userId !== userId) {
      console.error(`[SECURITY] AUTH VIOLATION: User ${userId} tried to Fix Gaps for Site ${siteId}`);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const pagesQ = query(collection(db, "pages"), where("siteId", "==", siteId));
    const pagesSnap = await getDocs(pagesQ);
    const pages = pagesSnap.docs.map(d => d.data());

    const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });
    const prompt = `Elite SEO AI Prompt Architecture v2.0
SEO Meta-Tag Architect
CONTEXT:
Pages to optimize: ${JSON.stringify(pages.slice(0, 10).map(p => ({ path: p.path, currentTitle: p.title })))}
TASK:
Generate optimized titles and meta descriptions.
Return ONLY JSON: [{"path": "/...", "title": "...", "metaDesc": "...", "reasoning": "..."}]`;

    const result = await model.generateContent(prompt);
    const optimizations = JSON.parse(result.response.text().replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim());

    for (const opt of optimizations) {
      const ruleRef = await addDoc(collection(db, "rules"), {
        siteId,
        targetPath: opt.path,
        type: 'SEO_OPTIMIZATION',
        payload: JSON.stringify({ title: opt.title, metaDesc: opt.metaDesc, reasoning: opt.reasoning }),
        isActive: true,
        confidence: 0.95,
        createdAt: serverTimestamp()
      });
      await logEvent(siteId, 'AUTO_FIX', opt.path, { message: `Optimized metadata: ${opt.reasoning}`, ruleId: ruleRef.id });
    }

    return NextResponse.json({ success: true, optimizedCount: optimizations.length });
  } catch (error) {
    console.error('Fix-Gaps error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
