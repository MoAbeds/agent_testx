import { NextRequest, NextResponse } from 'next/server';
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_KEY || '');

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { siteId, topic, targetKeyword, suggestedPath } = await request.json();
    if (!siteId || !topic) return NextResponse.json({ error: 'Missing params' }, { status: 400 });

    const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });
    
    const prompt = `Elite SEO Content Architect v3.0
Generate a high-converting, SEO-optimized landing page for:
Topic: ${topic}
Target Keyword: ${targetKeyword}
Target Path: ${suggestedPath}

REQUIREMENTS:
1. Catchy H1 with target keyword.
2. 3 Sections of value-dense content.
3. Call to Action (CTA).
4. Meta Title & Meta Description.

Return ONLY JSON:
{
  "title": "...",
  "metaDesc": "...",
  "html": "<h1>...</h1><p>...</p>...",
  "slug": "${suggestedPath}"
}`;

    const result = await model.generateContent(prompt);
    const content = JSON.parse(result.response.text().replace(/```json|```/g, '').trim());

    // Save as a dynamic rule for the Agent SDK to serve
    const ruleRef = await addDoc(collection(db, "rules"), {
      siteId,
      targetPath: suggestedPath,
      type: 'INJECT_HTML',
      payload: JSON.stringify({ 
        html: content.html, 
        title: content.title, 
        metaDesc: content.metaDesc,
        isNewPage: true 
      }),
      isActive: true,
      confidence: 0.98,
      createdAt: serverTimestamp()
    });

    return NextResponse.json({ success: true, ruleId: ruleRef.id, slug: content.slug });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
