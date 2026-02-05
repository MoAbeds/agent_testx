import { NextRequest, NextResponse } from 'next/server';
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { GoogleGenerativeAI } from '@google/generative-ai';
import { logEvent } from '@/lib/db';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_KEY || '');

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { siteId } = await req.json();
    if (!siteId) return NextResponse.json({ error: 'Missing siteId' }, { status: 400 });

    const siteRef = doc(db, "sites", siteId);
    const siteSnap = await getDoc(siteRef);
    if (!siteSnap.exists()) return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    const siteData = siteSnap.data();

    // 1. GATHER ALL CONTEXT (The Knowledge Base)
    // - Industry Deep Dive
    // - Target Keywords (SERP data)
    // - Page Audit Data
    const pagesSnap = await getDocs(query(collection(db, "pages"), where("siteId", "==", siteId)));
    const pages = pagesSnap.docs.map(d => d.data());

    const deepDive = siteData.industryDeepDive ? JSON.parse(siteData.industryDeepDive) : null;
    const targetKeywords = siteData.targetKeywords ? JSON.parse(siteData.targetKeywords) : null;

    // 2. ACTIVATE ELITE STRATEGIST BRAIN
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-3-flash-preview',
      systemInstruction: `You are the Mojo Elite SEO Strategist. Your SOLE mission is to rank the website "${siteData.domain}" to Page 1 of Google. 
      You use First-Principles Thinking and Second-Order Thinking. You don't just fix tags; you architect authority.`
    });

    const contextPrompt = `
      WEBSITE: ${siteData.domain}
      INDUSTRY INTEL: ${JSON.stringify(deepDive?.processedIntel || "Not analyzed yet")}
      TOP KEYWORDS: ${JSON.stringify(targetKeywords?.detailed?.slice(0, 10) || "Not researched yet")}
      CURRENT PAGES: ${pages.length} pages found.
      
      TASK:
      Analyze the current status and generate the next 3 HIGH-IMPACT SEO actions.
      Actions must be "Rules" (Title/Meta/Content overrides) that will be pushed to the live agent.
      
      Focus on:
      1. Aggressive Keyword Targeting (Commercial Intent).
      2. Click-Through Rate (CTR) Optimization for metadata.
      3. Semantic Gap Filling.

      Return ONLY JSON (an array of rules):
      [
        {
          "targetPath": "/path",
          "type": "SEO_OPTIMIZATION",
          "payload": {
            "title": "Optimized Title (max 60 chars)",
            "metaDescription": "Optimized Meta (max 160 chars)",
            "reasoning": "Why this will help rank #1",
            "confidence": 0.98
          }
        }
      ]
    `;

    const result = await model.generateContent(contextPrompt);
    const rulesToCreate = JSON.parse(result.response.text().replace(/```json|```/g, '').trim());

    // 3. DEPLOY RULES TO LIVE AGENT
    const createdRules = [];
    for (const rule of rulesToCreate) {
      const newRule = {
        siteId,
        targetPath: rule.targetPath,
        type: rule.type || 'SEO_OPTIMIZATION',
        payload: JSON.stringify(rule.payload),
        isActive: true,
        confidence: rule.payload.confidence || 0.9,
        createdAt: serverTimestamp()
      };
      const docRef = await addDoc(collection(db, "rules"), newRule);
      createdRules.push({ id: docRef.id, ...newRule });
      
      await logEvent(siteId, 'AI_STRATEGIC_FIX', rule.targetPath, { 
        message: `Mojo Brain deployed ranking optimization: ${rule.payload.reasoning}`
      });
    }

    return NextResponse.json({ 
      success: true, 
      actionsDeployed: createdRules.length,
      rules: createdRules
    });

  } catch (error: any) {
    console.error("Mojo Brain Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
