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
      console.error(`[SECURITY] AUTH VIOLATION: User ${userId} tried to Fix 404s for Site ${siteId}`);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const pagesQ = query(collection(db, "pages"), where("siteId", "==", siteId));
    const pagesSnap = await getDocs(pagesQ);
    const allPages = pagesSnap.docs.map(d => ({ id: d.id, ...d.data() as any }));
    
    const deadPages = allPages.filter(p => p.status == 404 || p.status == "404");
    const targetPaths = allPages.filter(p => p.status == 200 || p.status == "200").map(p => p.path);

    if (deadPages.length === 0) {
      return NextResponse.json({ success: true, message: 'No 404 pages found.' });
    }

    if (targetPaths.length === 0) {
      return NextResponse.json({ error: 'No valid target pages found.' }, { status: 400 });
    }

    let mappings = [];
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
    } catch (e: any) {
      console.error("[Fix-404] AI failed:", e.message);
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
    console.error('Fix-404 error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
