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
    // Keep using old cache if fetch fails
  }
}

// Initial fetch (non-blocking for app startup, but started immediately)
fetchManifest();

// Periodic refresh
setInterval(fetchManifest, REFRESH_INTERVAL);

// The Middleware
const mojoMiddleware = function(req, res, next) {
  // 1. Check if current path matches any rule
  // The manifest rules are an object keyed by path (e.g., "/")
  const rule = manifestCache.rules[req.path];

  if (!rule) {
    return next();
  }

  console.log(`[Mojo SDK] Rule matched for ${req.path}:`, rule);

  // 2. Hijack res.send to modify the response
  const originalSend = res.send;

  res.send = function(body) {
    // Only modify if it's HTML
    if (typeof body === 'string' && body.includes('<html')) {
      try {
        const $ = cheerio.load(body);
        
        // Apply transformations based on the rule
        // Update Title
        if (rule.title) {
          $('title').text(rule.title);
          console.log(`[Mojo SDK] Injected title: ${rule.title}`);
        }

        // Restore original send and return modified body
        res.send = originalSend;
        return res.send.call(this, $.html());
      } catch (err) {
        console.error('[Mojo SDK] Transformation error:', err);
      }
    }
    
    // Fallback if not HTML or error
    res.send = originalSend;
    return res.send.call(this, body);
  };

  next();
};

module.exports = mojoMiddleware;
