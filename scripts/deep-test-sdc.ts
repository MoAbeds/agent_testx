
import { GoogleGenerativeAI } from '@google/generative-ai';

// --- MOCK DATA ---
const siteData = {
  domain: "test-stagnant-site.com",
  industryDeepDive: JSON.stringify({ processedIntel: "Competitive real estate niche" }),
  targetKeywords: JSON.stringify({ detailed: ["luxury villas", "cheap apartments"] })
};

const history = [
  { averageRank: 42, timestamp: new Date() },
  { averageRank: 42, timestamp: new Date(Date.now() - 86400000) },
  { averageRank: 42, timestamp: new Date(Date.now() - 172800000) }
];

const existingRules = [
  { targetPath: "/", payload: { title: "Old Title" } }
];

// --- TEST LOGIC ---
async function testSDCLogic() {
  console.log("🚀 Starting Deep Test: Spectral Divergence Controller (SDC)");

  // 1. Velocity Analysis
  const isVelocityFlat = history.length >= 3 && 
    history[0].averageRank === history[1].averageRank && 
    history[1].averageRank === history[2].averageRank;

  console.log(`📊 Ranking Velocity Flat: ${isVelocityFlat}`);

  // 2. Prompt Construction Verification
  const systemInstruction = `You are the Mojo Elite SEO Strategist. 
  
  STABILITY & INNOVATION CONTROLLER (SDC-Inspired):
  - Innovation Mode: ${isVelocityFlat ? 'ENABLED (Ranking is flat. High-Curvature radical moves allowed.)' : 'STABLE (Ranking is moving. Stay within conservative optimization boundaries.)'}
  
  You use First-Principles Thinking. 
  IMPORTANT: You must provide a "reasoning" string for each rule and a "divergence_score" (0.0-1.0) indicating how radical the change is.`;

  console.log("\n--- System Instruction ---");
  console.log(systemInstruction);

  if (isVelocityFlat && systemInstruction.includes("Innovation Mode: ENABLED")) {
    console.log("\n✅ SDC Innovation Trigger: PASSED");
  } else {
    console.log("\n❌ SDC Innovation Trigger: FAILED");
  }

  // 3. Mock Gemini Response Filtering
  const mockRulesFromAI = [
    { targetPath: "/blog", reasoning: "Radical pivot to video content", divergence_score: 0.9, payload: {} },
    { targetPath: "/contact", reasoning: "Tiny meta tweak", divergence_score: 0.1, payload: {} }
  ];

  console.log("\n--- Filtering Test ---");
  let filteredRules = mockRulesFromAI;
  if (!isVelocityFlat) {
    filteredRules = mockRulesFromAI.filter((r: any) => (r.divergence_score || 0) <= 0.7);
    console.log("Filtered Rules (Stable Mode):", filteredRules.length);
  } else {
    console.log("Rules (Innovation Mode):", filteredRules.length);
  }

  if (isVelocityFlat && filteredRules.length === 2) {
    console.log("✅ SDC High-Curvature Allowance: PASSED");
  } else {
    console.log("❌ SDC Filtering Logic: FAILED");
  }

  console.log("\n🏁 Deep Test Complete.");
}

testSDCLogic();
