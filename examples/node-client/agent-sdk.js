const axios = require('axios');
const cheerio = require('cheerio');

// Cache for the manifest rules
let manifestCache = {
  rules: {},
  timestamp: 0
};

const MANIFEST_URL = 'http://localhost:3000/api/agent/manifest';
const REFRESH_INTERVAL = 60000; // Refresh every minute
const API_KEY = 'mo-agent-secret-123';

// Function to fetch and update manifest
async function fetchManifest() {
  try {
    const response = await axios.get(MANIFEST_URL, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`
      }
    });
    if (response.data && response.data.rules) {
      manifestCache.rules = response.data.rules;
      manifestCache.timestamp = Date.now();
      console.log('[Mojo SDK] Manifest updated:', Object.keys(manifestCache.rules).length, 'rules loaded.');
    }
  } catch (error) {
    console.error('[Mojo SDK] Failed to fetch manifest:', error.message);
  }
}

fetchManifest();
setInterval(fetchManifest, REFRESH_INTERVAL);

// The Middleware
const mojoMiddleware = function(req, res, next) {
  const rule = manifestCache.rules[req.path];

  if (!rule) {
    return next();
  }

  // 1. Handle Redirects (Highest priority)
  if (rule.redirectTo) {
    console.log(`[Mojo SDK] 301 Redirect: ${req.path} -> ${rule.redirectTo}`);
    return res.redirect(301, rule.redirectTo);
  }

  // 2. Handle SEO Injections (HTML modification)
  const originalSend = res.send;

  res.send = function(body) {
    if (typeof body === 'string' && body.includes('<html')) {
      try {
        const $ = cheerio.load(body);
        
        // Inject Title
        if (rule.title) {
          if ($('title').length) {
            $('title').text(rule.title);
          } else {
            $('head').prepend(`<title>${rule.title}</title>`);
          }
        }

        // Inject Meta Description
        if (rule.metaDescription || rule.metaDesc) {
          const desc = rule.metaDescription || rule.metaDesc;
          if ($('meta[name="description"]').length) {
            $('meta[name="description"]').attr('content', desc);
          } else {
            $('head').append(`<meta name="description" content="${desc}">`);
          }
        }

        // Inject Schema (if present)
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

module.exports = mojoMiddleware;
