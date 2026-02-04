import { NextRequest, NextResponse } from 'next/server';
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { GoogleGenerativeAI } from '@google/generative-ai';
import { logEvent } from '@/lib/db';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_KEY || '');

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { siteId, description } = await req.json();
    if (!siteId || !description) return NextResponse.json({ error: 'Missing siteId or description' }, { status: 400 });

    const siteRef = doc(db, "sites", siteId);
    const siteSnap = await getDoc(siteRef);
    if (!siteSnap.exists()) return NextResponse.json({ error: 'Site not found' }, { status: 404 });

    // 1. AI Brain "Deep Dive" - Analyze the user's plain text description
    const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });
    const prompt = `Elite SEO Architect v3.0 - Industry Deep-Dive
User Description: """${description}"""

TASK:
Analyze the text above and extract a high-precision SEO blueprint.
1. Identify the specific Industry.
2. Define the core Topic/Niche.
3. Determine the primary Target Audience.
4. Extract 5 "Power Seed Keywords" for API expansion.

Return ONLY JSON:
{
  "industry": "...",
  "topic": "...",
  "audience": "...",
  "seeds": ["seed 1", "seed 2", "seed 3", "seed 4", "seed 5"],
  "intent": "Commercial/Informational/Local"
}`;

    const result = await model.generateContent(prompt);
    const intel = JSON.parse(result.response.text().replace(/```json|```/g, '').trim());

    // 2. Store this deep understanding in the site profile
    await updateDoc(siteRef, { 
      industryDeepDive: JSON.stringify({
        rawDescription: description,
        processedIntel: intel,
        analyzedAt: new Date().toISOString()
      }),
      // Pre-set the industry for the Research Engine
      manualIndustry: intel.industry 
    });

    await logEvent(siteId, 'DEEP_DIVE_COMPLETE', 'Industry Analysis', { intel });

    return NextResponse.json({ success: true, intel });
  } catch (error: any) {
    console.error("Deep Dive Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
