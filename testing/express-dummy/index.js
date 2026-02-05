const express = require('express');
// Using a local bridge class instead of the NPM package to avoid build dependency issues in this test
class MojoGuardian {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.rules = {};
  }
  async init() {
    try {
      const res = await fetch('https://agenttestx-production-19d6.up.railway.app/api/agent/manifest', {
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      });
      const data = await res.json();
      this.rules = data.rules || {};
    } catch (e) {
      console.error('Mojo Init Failed:', e.message);
    }
  }
  getMetadata(path) {
    return this.rules[path] || null;
  }
}

const app = express();
const port = process.env.PORT || 8080;

// Initialize Mojo Guardian
const mojo = new MojoGuardian("mojo_0olio1pl57dg");

async function start() {
  await mojo.init();

  app.get('*', (req, res) => {
    const seo = mojo.getMetadata(req.path);
    
    const title = seo ? seo.title : "Mojo Express Live Test";
    const description = seo ? (seo.metaDescription || seo.metaDesc) : "An Express.js test site for Mojo Guardian.";

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title}</title>
        <meta name="description" content="${description}">
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body class="bg-[#0a0a0a] text-white flex flex-col items-center justify-center min-h-screen p-6 font-sans">
        <div class="max-w-md w-full bg-gray-900 border border-gray-800 rounded-3xl p-10 shadow-2xl text-center space-y-8">
          <img src="https://agenttestx-production-19d6.up.railway.app/logo.svg" alt="Mojo" class="w-20 h-20 mx-auto">
          <h1 class="text-4xl font-black tracking-tighter text-terminal">Mojo Express</h1>
          <p class="text-gray-500 text-sm">Node.js Autonomous SEO</p>
          
          <div class="bg-black/50 rounded-xl p-4 border border-gray-800 text-left space-y-2">
            <p class="text-[10px] font-black uppercase text-gray-500 tracking-widest">Active Metadata</p>
            <p class="text-xs font-mono text-terminal"><span class="text-gray-600">Title:</span> ${title}</p>
            <p class="text-xs font-mono text-terminal"><span class="text-gray-600">Meta:</span> ${description}</p>
          </div>

          <div class="pt-6 border-t border-gray-800">
            <p class="text-[10px] text-gray-700 font-mono italic">Built for teams who ship fast. Made by Pharaoh_</p>
          </div>
        </div>
      </body>
      </html>
    `);
  });

  app.listen(port, () => {
  });
}

start();
