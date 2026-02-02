const axios = require('axios');
const cheerio = require('cheerio');

// Configuration from environment variables
const API_KEY = process.env.MOJO_API_KEY;
const MANIFEST_URL = process.env.MOJO_MANIFEST_URL;
const REFRESH_INTERVAL = 60000; // 1 minute

if (!API_KEY || !MANIFEST_URL) {
  console.error('[Mojo SDK] Error: MOJO_API_KEY or MOJO_MANIFEST_URL is not set.');
}

// Cache for the manifest rules
let manifestCache = {
  rules: {},
  timestamp: 0
};

// Function to fetch and update manifest
async function fetchManifest() {
  if (!API_KEY || !MANIFEST_URL) return;
  
  try {
    const response = await axios.get(MANIFEST_URL, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`
      }
    });
    if (response.data && response.data.rules) {
      manifestCache.rules = response.data.rules;
      manifestCache.timestamp = Date.now();
      console.log('[Mojo SDK] Manifest synced:', Object.keys(manifestCache.rules).length, 'protection rules loaded.');
    }
  } catch (error) {
    console.error('[Mojo SDK] Sync failed:', error.message);
  }
}

// Start sync cycle
fetchManifest();
setInterval(fetchManifest, REFRESH_INTERVAL);

// The Mojo Guardian Middleware
const mojoGuardian = function(req, res, next) {
  const rule = manifestCache.rules[req.path];

  // 1. Handle Redirects (High Priority)
  if (rule && rule.redirectTo) {
    console.log(`[Mojo SDK] Intercepted 404. Redirecting ${req.path} -> ${rule.redirectTo}`);
    return res.redirect(301, rule.redirectTo);
  }

  // 2. Handle SEO Injections
  const originalSend = res.send;

  res.send = function(body) {
    if (rule && typeof body === 'string' && body.includes('<html')) {
      try {
        const $ = cheerio.load(body);
        
        // Inject Title
        if (rule.title) {
          if ($('title').length) {
            $('title').text(rule.title);
          } else {
            $('head').prepend(`<title>${rule.title}</title>`);
          }
          console.log(`[Mojo SDK] Optimizing Title: ${rule.title}`);
        }

        // Inject Meta Description
        const desc = rule.metaDescription || rule.metaDesc;
        if (desc) {
          if ($('meta[name="description"]').length) {
            $('meta[name="description"]').attr('content', desc);
          } else {
            $('head').append(`<meta name="description" content="${desc}">`);
          }
          console.log(`[Mojo SDK] Optimizing Meta: ${desc.substring(0, 30)}...`);
        }

        // Inject Schema
        if (rule.schema) {
          $('head').append(`<script type="application/ld+json">${JSON.stringify(rule.schema)}</script>`);
        }

        res.send = originalSend;
        return res.send.call(this, $.html());
      } catch (err) {
        console.error('[Mojo SDK] Transformation error:', err);
      }
    }
    
    res.send = originalSend;
    return res.send.call(this, body);
  };

  next();
};

module.exports = mojoGuardian;
