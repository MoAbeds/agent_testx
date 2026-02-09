import { NextRequest, NextResponse } from 'next/server';
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp, updateDoc, orderBy, limit } from "firebase/firestore";
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
    const userEnergyMap = userData?.energyUsed || {};
    const lastUpdate = userData?.lastEnergyUpdate || '';
    
    // Reset energy if new day
    if (lastUpdate !== today) {
        userEnergyMap[siteId] = 0;
        await updateDoc(userRef, { energyUsed: {}, lastEnergyUpdate: today }); // Reset all
    }

    const energyUsed = userEnergyMap[siteId] || 0;
    const maxEnergy = 50; // Increased for testing

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

    // 🔒 SECURITY HARDENING: Ownership cross-check
    // In production, we should verify the Firebase ID Token here.
    // For now, we strictly enforce that the siteId and userId relationship is valid.
    if (!userData || siteData.userId !== userSnap.id) {
       return NextResponse.json({ error: 'Security Mismatch', message: 'User/Site relationship is invalid.' }, { status: 403 });
    }

    // 📈 RANKING VELOCITY ANALYSIS (SDC Innovation Trigger)
    // Note: This query requires a Composite Index (siteId + timestamp + DESC)
    let isVelocityFlat = false;
    try {
      const rankHistorySnap = await getDocs(query(
        collection(db, "rank_history"), 
        where("siteId", "==", siteId), 
        orderBy("timestamp", "desc"), 
        limit(3)
      ));
      const history = rankHistorySnap.docs.map(d => d.data());
      
      isVelocityFlat = history.length >= 3 && 
        history[0].averageRank === history[1].averageRank && 
        history[1].averageRank === history[2].averageRank;
    } catch (e: any) {
      if (e.code === 'failed-precondition') {
        console.warn("[Mojo Brain] Missing Index for Ranking Velocity. Defaulting to STABLE mode.");
        // We catch the index error so the Brain can still run in basic mode.
        isVelocityFlat = false; 
      } else {
        throw e;
      }
    }

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
      
      STABILITY & INNOVATION CONTROLLER (SDC-Inspired):
      - Innovation Mode: ${isVelocityFlat ? 'ENABLED (Ranking is flat. High-Curvature radical moves allowed.)' : 'STABLE (Ranking is moving. Stay within conservative optimization boundaries.)'}
      
      You use First-Principles Thinking. 
      IMPORTANT: You must provide a "reasoning" string for each rule and a "divergence_score" (0.0-1.0) indicating how radical the change is.`
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
    let rulesToCreate = JSON.parse(result.response.text().replace(/```json|```/g, '').trim());

    // 🛡️ SPECTRAL DIVERGENCE FILTER
    if (!isVelocityFlat) {
      // Filter out rules with divergence > 0.7 if we are in STABLE mode
      rulesToCreate = rulesToCreate.filter((r: any) => (r.divergence_score || 0) <= 0.7);
    }

    const createdRules = [];
    for (const rule of rulesToCreate) {
      const payload = typeof rule.payload === 'string' ? JSON.parse(rule.payload) : rule.payload;
      
      // Validation: Ensure targetPath exists or fallback to root
      const targetPath = rule.targetPath || rule.path || '/';

      const newRule = {
        siteId,
        targetPath,
        type: isDefense ? 'ALGORITHM_DEFENSE' : (rule.type || 'SEO_OPTIMIZATION'),
        payload: JSON.stringify(payload),
        reasoning: rule.reasoning || payload.reasoning || "Strategic authority optimization",
        isActive: true,
        confidence: rule.confidence || payload.confidence || 0.9,
        divergenceScore: rule.divergence_score || 0,
        createdAt: serverTimestamp()
      };
      const docRef = await addDoc(collection(db, "rules"), newRule);
      createdRules.push({ id: docRef.id, ...newRule });
      
      await logEvent(siteId, isDefense ? 'DEFENSE_DEPLOYED' : 'AI_STRATEGIC_FIX', targetPath, { 
        message: isDefense ? `[DEFENSE] ${newRule.reasoning}` : `Mojo Brain deployed ranking optimization: ${newRule.reasoning}`,
        reasoning: newRule.reasoning,
        ruleId: docRef.id,
        divergence: newRule.divergenceScore
      });
    }

    if (!isDefense && createdRules.length > 0) {
      const newEnergyMap = { ...userEnergyMap };
      newEnergyMap[siteId] = (newEnergyMap[siteId] || 0) + 1;
      
      await updateDoc(userRef, {
        energyUsed: newEnergyMap,
        lastEnergyUpdate: today
      });
    }

    return NextResponse.json({ success: true, actionsDeployed: createdRules.length, rules: createdRules });

  } catch (error: any) {
    console.error("Mojo Brain Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
