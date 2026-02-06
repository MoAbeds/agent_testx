import { NextRequest, NextResponse } from 'next/server';
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { GoogleGenerativeAI } from '@google/generative-ai';
import { logEvent } from '@/lib/db';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_KEY || '');

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { userId, siteId, mode } = await req.json();
    if (!siteId || !userId) return NextResponse.json({ error: 'Missing params' }, { status: 400 });

    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    const userData = userSnap.data();

    // ⚡ STRATEGIC ENERGY CHECK (Scarcity Loop)
    const today = new Date().toISOString().split('T')[0];
    const energyUsed = userData?.energyUsed?.[siteId] || 0;
    const maxEnergy = 3; 

    if (energyUsed >= maxEnergy && mode !== 'DEFENSE') {
      return NextResponse.json({ 
        error: 'Strategic Energy Depleted', 
        message: 'Mojo Brain has exhausted its high-intensity strategic energy for this site today.' 
      }, { status: 429 });
    }

    const siteRef = doc(db, "sites", siteId);
    const siteSnap = await getDoc(siteRef);
    if (!siteSnap.exists()) return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    const siteData = siteSnap.data();

    if (siteData.userId !== userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    const pagesSnap = await getDocs(query(collection(db, "pages"), where("siteId", "==", siteId)));
    const pages = pagesSnap.docs.map(d => d.data());

    const deepDive = siteData.industryDeepDive ? JSON.parse(siteData.industryDeepDive) : null;
    const targetKeywords = siteData.targetKeywords ? JSON.parse(siteData.targetKeywords) : null;

    const existingRulesSnap = await getDocs(query(collection(db, "rules"), where("siteId", "==", siteId), where("isActive", "==", true)));
    const existingRules = existingRulesSnap.docs.map(d => d.data());

    const isDefense = mode === 'DEFENSE';

    const model = genAI.getGenerativeModel({ 
      model: 'gemini-3-flash-preview',
      systemInstruction: `You are the Mojo Elite SEO Strategist. ${isDefense ? 'CRITICAL: SITE IS UNDER ALGORITHM ATTACK. PROPOSE DEFENSE RULES.' : 'Your SOLE mission is to rank the website to Page 1.'}
      You use First-Principles Thinking. IMPORTANT: You must provide a "reasoning" string for each rule.`
    });

    const contextPrompt = `
      WEBSITE: ${siteData.domain}
      MODE: ${isDefense ? 'DEFENSE (Algorithm Drop Detected)' : 'GROWTH'}
      INDUSTRY INTEL: ${JSON.stringify(deepDive?.processedIntel || "Not analyzed yet")}
      TOP KEYWORDS: ${JSON.stringify(targetKeywords?.detailed?.slice(0, 10) || "Not researched yet")}
      EXISTING ACTIVE RULES: ${JSON.stringify(existingRules.map((r: any) => ({ path: r.targetPath, payload: r.payload })))}
      
      TASK: Generate the next 3 HIGH-IMPACT SEO actions as JSON rules.
    `;

    const result = await model.generateContent(contextPrompt);
    const rulesToCreate = JSON.parse(result.response.text().replace(/```json|```/g, '').trim());

    const createdRules = [];
    for (const rule of rulesToCreate) {
      const payload = typeof rule.payload === 'string' ? JSON.parse(rule.payload) : rule.payload;
      const newRule = {
        siteId,
        targetPath: rule.targetPath,
        type: isDefense ? 'ALGORITHM_DEFENSE' : (rule.type || 'SEO_OPTIMIZATION'),
        payload: JSON.stringify(payload),
        reasoning: rule.reasoning || payload.reasoning || "Strategic authority optimization",
        isActive: true,
        confidence: rule.confidence || payload.confidence || 0.9,
        createdAt: serverTimestamp()
      };
      const docRef = await addDoc(collection(db, "rules"), newRule);
      createdRules.push({ id: docRef.id, ...newRule });
      
      await logEvent(siteId, isDefense ? 'DEFENSE_DEPLOYED' : 'AI_STRATEGIC_FIX', rule.targetPath, { 
        message: isDefense ? `[DEFENSE] ${newRule.reasoning}` : `Mojo Brain deployed ranking optimization: ${newRule.reasoning}`,
        reasoning: newRule.reasoning,
        ruleId: docRef.id
      });
    }

    if (!isDefense) {
      await updateDoc(userRef, {
        [`energyUsed.${siteId}`]: (userData?.energyUsed?.[siteId] || 0) + 1,
        lastEnergyUpdate: today
      });
    }

    return NextResponse.json({ success: true, actionsDeployed: createdRules.length, rules: createdRules });

  } catch (error: any) {
    console.error("Mojo Brain Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
