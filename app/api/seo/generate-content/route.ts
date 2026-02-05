import { NextRequest, NextResponse } from 'next/server';
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { GoogleGenerativeAI } from '@google/generative-ai';
import { logEvent } from '@/lib/db';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_KEY || '');

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { siteId, userId, topic, targetKeyword, suggestedPath } = await req.json();
    if (!siteId || !userId || !topic) return NextResponse.json({ error: 'Missing params' }, { status: 400 });

    const siteRef = doc(db, "sites", siteId);
    const siteSnap = await getDoc(siteRef);
    if (!siteSnap.exists() || siteSnap.data().userId !== userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });
    const prompt = `Elite SEO Content Architect v4.0
TASK: Write a high-performance SEO blog post.
TOPIC: ${topic}
TARGET KEYWORD: ${targetKeyword || topic}
DOMAIN: ${siteSnap.data().domain}

REQUIREMENTS:
1. Return ONLY valid HTML (no markdown code blocks, no <html>/<body> tags).
2. Include an <h1> title.
3. Use <section>, <h2>, and <p> tags.
4. Include a Call-to-Action (CTA) div at the end with a button.
5. Content must be at least 600 words, highly professional, and optimized for semantic ranking.

Also provide a SEO metadata object.
Final response must be JSON: { "html": "...", "title": "...", "metaDesc": "..." }`;

    const result = await model.generateContent(prompt);
    const rawText = result.response.text().replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
    const article = JSON.parse(rawText);

    // Deploy as an Autonomous Rule (Inject HTML)
    const ruleRef = await addDoc(collection(db, "rules"), {
      siteId,
      targetPath: suggestedPath || `/${topic.toLowerCase().replace(/\s+/g, '-')}`,
      type: 'INJECT_HTML',
      payload: JSON.stringify({
        html: article.html,
        title: article.title,
        metaDesc: article.metaDesc,
        isNewPage: true
      }),
      isActive: true,
      confidence: 0.98,
      createdAt: serverTimestamp()
    });

    await logEvent(siteId, 'AUTO_CONTENT_GEN', article.title, { 
      message: `Mojo Ghost-Writer deployed new optimized page: ${article.title}`,
      ruleId: ruleRef.id
    });

    return NextResponse.json({ success: true, ruleId: ruleRef.id, slug: suggestedPath });

  } catch (error: any) {
    console.error("Ghost-Writer Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
