const axios = require('axios');

// This script simulates the PHP SDK logic (mojo-agent.php) 
// to verify it can correctly talk to the SaaS and handle redirects.

const API_KEY = 'mojo-local-secret-123';
const MANIFEST_URL = 'http://localhost:3000/api/agent/manifest';

async function simulatePHPSDK() {

  // 1. SIMULATE: get_manifest()
  try {
    const res = await axios.get(MANIFEST_URL, {
      headers: { 'Authorization': `Bearer ${API_KEY}` }
    });
    
    if (res.status === 200) {
      const rules = res.data.rules;

      // 2. SIMULATE: handle_redirects()
      const testPath = '/old-broken-page';
      if (rules[testPath] && rules[testPath].redirectTo) {
      } else {
      }

      // 3. SIMULATE: injectMetadata() Regex
      let dummyHTML = `<html><head><title>Old Title</title><meta name="description" content="Old meta"></head><body><h1>Hello</h1></body></html>`;
      const rule = rules['/'] || { title: 'Optimized Title', metaDesc: 'New meta description' };
      
      // Mimic PHP preg_replace
      let optimizedHTML = dummyHTML.replace(/<title>(.*?)<\/title>/is, `<title>${rule.title}</title>`);
      optimizedHTML = optimizedHTML.replace(/<meta[^>]+name=["']description["'][^>]*>/is, `<meta name="description" content="${rule.metaDesc}">`);
      
      if (optimizedHTML.includes(rule.title) && optimizedHTML.includes(rule.metaDesc)) {
      }

    }
  } catch (e) {
    console.error("   ❌ Test Failed:", e.message);
  }

}

simulatePHPSDK();
