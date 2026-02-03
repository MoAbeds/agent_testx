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
    const site = siteSnap.data();

    const gapsQ = query(collection(db, "events"), where("siteId", "==", siteId), where("type", "==", "SEO_GAP"));
    const gapsSnap = await getDocs(gapsQ);
    if (gapsSnap.empty) return NextResponse.json({ success: true, message: 'No gaps' });

    let siteKeywords = [];
    if (site.targetKeywords) {
      try { siteKeywords = JSON.parse(site.targetKeywords).detailed?.map((k: any) => k.keyword) || []; } catch (e) {}
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });
    let count = 0;

    for (const gapDoc of gapsSnap.docs.slice(0, 5)) {
      const gap = gapDoc.data();
      const pageQ = query(collection(db, "pages"), where("siteId", "==", siteId), where("path", "==", gap.path));
      const pageSnap = await getDocs(pageQ);
      if (pageSnap.empty) continue;
      const page = pageSnap.docs[0].data();

      const prompt = `Elite SEO AI Prompt Architecture v2.0
SEO Fixer
Website: ${site.domain}
Path: ${page.path}
Keywords: [${siteKeywords.join(', ')}]
Return ONLY JSON: {"title": "...", "metaDesc": "...", "reasoning": "..."}`;

      try {
        const result = await model.generateContent(prompt);
        const optimized = JSON.parse(result.response.text().replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim());
        
        const ruleRef = await addDoc(collection(db, "rules"), {
          siteId,
          targetPath: page.path,
          type: 'REWRITE_META',
          payload: JSON.stringify(optimized),
          isActive: true,
          confidence: 0.95,
          createdAt: serverTimestamp()
        });

        await logEvent(siteId, 'AUTO_FIX', page.path, { message: `Optimized SEO`, ruleId: ruleRef.id });
        count++;
      } catch (e) {}
    }

    return NextResponse.json({ success: true, appliedFixes: count });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
