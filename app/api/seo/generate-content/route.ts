import { NextRequest, NextResponse } from 'next/server';
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, addDoc, serverTimestamp, updateDoc, increment, query, where, limit, getDocs } from "firebase/firestore";
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

    // 🧠 CHECK NEURAL BANDWIDTH
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    const userData = userSnap.data();
    
    if (userData && (userData.bandwidth || 0) <= 0) {
      return NextResponse.json({ 
        error: 'Insufficient Neural Bandwidth. Bandwidth resets every 24 hours.',
        insufficientBandwidth: true 
      }, { status: 403 });
    }

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

REASONING:
Explain WHY this content will rank. Cite semantic keywords and structural logic.

Final response must be JSON: { "html": "...", "title": "...", "metaDesc": "...", "reasoning": "..." }`;

    const result = await model.generateContent(prompt);
    const rawText = result.response.text().replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
    const article = JSON.parse(rawText);

    const targetPath = suggestedPath || `/${topic.toLowerCase().replace(/\s+/g, '-')}`;

    // Deploy as an Autonomous Rule (Inject HTML)
    const ruleRef = await addDoc(collection(db, "rules"), {
      siteId,
      targetPath,
      type: 'INJECT_HTML',
      payload: JSON.stringify({
        html: article.html,
        title: article.title,
        metaDesc: article.metaDesc,
        reasoning: article.reasoning,
        isNewPage: true
      }),
      isActive: true,
      confidence: 0.98,
      createdAt: serverTimestamp()
    });

    // 📉 DECREMENT BANDWIDTH
    await updateDoc(userRef, {
      bandwidth: increment(-1)
    });

    await logEvent(siteId, 'AUTO_CONTENT_GEN', article.title, { 
      message: `Mojo Ghost-Writer deployed new optimized page: ${article.title}`,
      ruleId: ruleRef.id
    });

    // 🔄 PHASE 6: AUTHORITY FLYWHEEL (Autonomous Internal Linking)
    try {
      // Find 3 high-authority pages to link FROM
      const pagesQ = query(
        collection(db, "pages"),
        where("siteId", "==", siteId),
        limit(10)
      );
      const pagesSnap = await getDocs(pagesQ);
      const existingPages = pagesSnap.docs
        .map(d => d.data())
        .filter(p => p.path !== targetPath && p.path !== '/')
        .slice(0, 3);

      for (const sourcePage of existingPages) {
        // Create an INJECT_LINK rule
        await addDoc(collection(db, "rules"), {
          siteId,
          targetPath: sourcePage.path,
          type: 'INJECT_LINK',
          payload: JSON.stringify({
            href: targetPath,
            anchorText: targetKeyword || topic,
            reasoning: `Internal link flywheel: Strengthening authority for new page '${article.title}' from source '${sourcePage.path}'.`
          }),
          isActive: true,
          confidence: 0.95,
          createdAt: serverTimestamp()
        });

        await logEvent(siteId, 'FLYWHEEL_LINK', sourcePage.path, {
          message: `Mojo deployed autonomous internal link from ${sourcePage.path} to ${targetPath}`,
          target: targetPath
        });
      }
    } catch (flywheelError) {
      console.error("Authority Flywheel Error:", flywheelError);
    }

    return NextResponse.json({ success: true, ruleId: ruleRef.id, slug: targetPath });

  } catch (error: any) {
    console.error("Ghost-Writer Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
