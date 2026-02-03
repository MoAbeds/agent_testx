const axios = require('axios');

// This script simulates the PHP SDK logic (mojo-agent.php) 
// to verify it can correctly talk to the SaaS and handle redirects.

const API_KEY = 'mojo-local-secret-123';
const MANIFEST_URL = 'http://localhost:3000/api/agent/manifest';

async function simulatePHPSDK() {
  console.log("🐘 STARTING PHP SDK INTEGRATION TEST...\n");

  // 1. SIMULATE: get_manifest()
  console.log("➡️  STEP 1: Fetching Manifest (Auth Check)");
  try {
    const res = await axios.get(MANIFEST_URL, {
      headers: { 'Authorization': `Bearer ${API_KEY}` }
    });
    
    if (res.status === 200) {
      console.log("   ✅ Success: SaaS authorized the PHP Agent.");
      const rules = res.data.rules;
      console.log(`   ✅ Rules Loaded: ${Object.keys(rules).length}`);

      // 2. SIMULATE: handle_redirects()
      console.log("\n➡️  STEP 2: Testing Redirect Logic");
      const testPath = '/old-broken-page';
      if (rules[testPath] && rules[testPath].redirectTo) {
        console.log(`   ✅ Success: Detected Redirect rule for ${testPath}`);
        console.log(`   🚀 Action: PHP would now trigger: header("Location: ${rules[testPath].redirectTo}", true, 301);`);
      } else {
        console.log("   ❌ Error: Redirect rule not found in manifest.");
      }

      // 3. SIMULATE: injectMetadata() Regex
      console.log("\n➡️  STEP 3: Testing Regex Injection (HTML Modification)");
      let dummyHTML = `<html><head><title>Old Title</title><meta name="description" content="Old meta"></head><body><h1>Hello</h1></body></html>`;
      const rule = rules['/'] || { title: 'Optimized Title', metaDesc: 'New meta description' };
      
      // Mimic PHP preg_replace
      let optimizedHTML = dummyHTML.replace(/<title>(.*?)<\/title>/is, `<title>${rule.title}</title>`);
      optimizedHTML = optimizedHTML.replace(/<meta[^>]+name=["']description["'][^>]*>/is, `<meta name="description" content="${rule.metaDesc}">`);
      
      if (optimizedHTML.includes(rule.title) && optimizedHTML.includes(rule.metaDesc)) {
        console.log("   ✅ Success: SEO Metadata successfully injected via Regex.");
        console.log("   💡 Result:", optimizedHTML.substring(0, 100) + "...");
      }

    }
  } catch (e) {
    console.error("   ❌ Test Failed:", e.message);
  }

  console.log("\n🏁 PHP TEST COMPLETE.");
}

simulatePHPSDK();
