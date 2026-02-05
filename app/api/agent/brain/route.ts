import { NextRequest, NextResponse } from 'next/server';
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { GoogleGenerativeAI } from '@google/generative-ai';
import { logEvent } from '@/lib/db';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_KEY || '');

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { siteId, userId } = await req.json();
    if (!siteId || !userId) return NextResponse.json({ error: 'Missing params' }, { status: 400 });

    const siteRef = doc(db, "sites", siteId);
    const siteSnap = await getDoc(siteRef);
    if (!siteSnap.exists()) return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    const siteData = siteSnap.data();

    // 🔒 OWNERSHIP VERIFICATION
    if (siteData.userId !== userId) {
      console.error(`[SECURITY] AUTH VIOLATION: User ${userId} tried to activate Brain for Site ${siteId}`);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const pagesSnap = await getDocs(query(collection(db, "pages"), where("siteId", "==", siteId)));
    const pages = pagesSnap.docs.map(d => d.data());

    const deepDive = siteData.industryDeepDive ? JSON.parse(siteData.industryDeepDive) : null;
    const targetKeywords = siteData.targetKeywords ? JSON.parse(siteData.targetKeywords) : null;

    const existingRulesSnap = await getDocs(query(collection(db, "rules"), where("siteId", "==", siteId), where("isActive", "==", true)));
    const existingRules = existingRulesSnap.docs.map(d => d.data());

    const model = genAI.getGenerativeModel({ 
      model: 'gemini-3-flash-preview',
      systemInstruction: `You are the Mojo Elite SEO Strategist. Your SOLE mission is to rank the website "${siteData.domain}" to Page 1 of Google. 
      You use First-Principles Thinking and Second-Order Thinking. You don't just fix tags; you architect authority. 
      IMPORTANT: This is an iterative optimization process. Look at existing rules and pages, and find NEW ways to improve or refine them. Never repeat the exact same optimization if it hasn't improved rankings.`
    });

    const contextPrompt = `
      WEBSITE: ${siteData.domain}
      INDUSTRY INTEL: ${JSON.stringify(deepDive?.processedIntel || "Not analyzed yet")}
      TOP KEYWORDS: ${JSON.stringify(targetKeywords?.detailed?.slice(0, 10) || "Not researched yet")}
      CURRENT PAGES: ${pages.length} pages found.
      EXISTING ACTIVE RULES: ${JSON.stringify(existingRules.map((r: any) => ({ path: r.targetPath, payload: r.payload })))}
      
      TASK:
      Analyze the current status and generate the next 3 HIGH-IMPACT SEO actions.
      Actions must be "Rules" (Title/Meta/Content overrides) that will be pushed to the live agent.
      
      IMPORTANT: You must provide a "reasoning" string for each rule that explains exactly WHY this move was made based on competitive data or SEO first principles.
      
      Return ONLY JSON (an array of rules).
    `;

    const result = await model.generateContent(contextPrompt);
    const rulesToCreate = JSON.parse(result.response.text().replace(/```json|```/g, '').trim());

    const createdRules = [];
    for (const rule of rulesToCreate) {
      const payload = typeof rule.payload === 'string' ? JSON.parse(rule.payload) : rule.payload;
      
      const newRule = {
        siteId,
        targetPath: rule.targetPath,
        type: rule.type || 'SEO_OPTIMIZATION',
        payload: JSON.stringify(payload),
        reasoning: rule.reasoning || payload.reasoning || "Strategic authority optimization",
        isActive: true,
        confidence: rule.confidence || payload.confidence || 0.9,
        createdAt: serverTimestamp()
      };
      const docRef = await addDoc(collection(db, "rules"), newRule);
      createdRules.push({ id: docRef.id, ...newRule });
      
      await logEvent(siteId, 'AI_STRATEGIC_FIX', rule.targetPath, { 
        message: `Mojo Brain deployed ranking optimization: ${newRule.reasoning}`,
        reasoning: newRule.reasoning,
        ruleId: docRef.id
      });
    }

    return NextResponse.json({ success: true, actionsDeployed: createdRules.length, rules: createdRules });

  } catch (error: any) {
    console.error("Mojo Brain Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
