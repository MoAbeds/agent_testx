import { NextRequest, NextResponse } from 'next/server';
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, getDoc, addDoc, serverTimestamp } from "firebase/firestore";
import { GoogleGenerativeAI } from '@google/generative-ai';
import { logEvent } from '@/lib/db';

export const dynamic = 'force-dynamic';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const { siteId } = await request.json();
    if (!siteId) return NextResponse.json({ error: 'siteId is required' }, { status: 400 });

    const siteRef = doc(db, "sites", siteId);
    const siteSnap = await getDoc(siteRef);
    if (!siteSnap.exists()) return NextResponse.json({ error: 'Site not found' }, { status: 404 });

    const deadPagesQ = query(collection(db, "pages"), where("siteId", "==", siteId), where("status", "==", 404));
    const deadPagesSnap = await getDocs(deadPagesQ);
    const deadPages = deadPagesSnap.docs.map(d => d.data());

    if (deadPages.length === 0) return NextResponse.json({ success: true, message: 'No 404s found' });

    const validPagesQ = query(collection(db, "pages"), where("siteId", "==", siteId), where("status", "==", 200));
    const validPagesSnap = await getDocs(validPagesQ);
    const targetPaths = validPagesSnap.docs.map(d => d.data().path);

    const googleKey = process.env.GOOGLE_AI_KEY;
    let mappings = [];

    if (googleKey) {
      try {
        const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });
        const prompt = `Elite SEO AI Prompt Architecture v2.0
Intelligent Redirect Mapper
CONTEXT:
Broken URLs: [${deadPages.map(p => p.path).join(', ')}]
Valid Target URLs: [${targetPaths.join(', ')}]
Return ONLY a JSON array of objects: [{"from": "/path", "to": "/target", "confidence": "high", "reasoning": "..."}]`;

        const result = await model.generateContent(prompt);
        const text = result.response.text().replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
        mappings = JSON.parse(text);
      } catch (e) {}
    }

    if (mappings.length === 0) {
      for (const dead of deadPages) {
        mappings.push({ from: dead.path, to: '/', reasoning: 'Homepage fallback' });
      }
    }

    for (const mapping of mappings) {
      const ruleRef = await addDoc(collection(db, "rules"), {
        siteId,
        targetPath: mapping.from,
        type: 'REDIRECT_301',
        payload: JSON.stringify({ redirectTo: mapping.to, reasoning: mapping.reasoning }),
        isActive: true,
        confidence: 0.9,
        createdAt: serverTimestamp()
      });
      await logEvent(siteId, 'AUTO_FIX', mapping.from, { message: `Redirected to ${mapping.to}`, ruleId: ruleRef.id });
    }

    return NextResponse.json({ success: true, fixesApplied: mappings.length });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
