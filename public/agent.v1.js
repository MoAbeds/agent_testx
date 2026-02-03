(function() {
  console.log("[Mojo Guardian] Initializing Universal Agent...");

  const apiKey = window.MOJO_KEY;
  const apiUrl = window.MOJO_API;

  if (!apiKey || !apiUrl) {
    console.error("[Mojo Guardian] Error: Missing API Key or API URL.");
    return;
  }

  async function syncProtection() {
    try {
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': 'Bearer ' + apiKey,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      
      if (data && data.rules) {
        applyRules(data.rules);
      }
    } catch (e) {
      console.error("[Mojo Guardian] Sync failed:", e.message);
    }
  }

  function applyRules(rules) {
    const currentPath = window.location.pathname;
    // Normalize path
    const cleanPath = currentPath.length > 1 ? currentPath.replace(/\/$/, '') : currentPath;
    
    const rule = rules[cleanPath];
    if (!rule) return;

    console.log("[Mojo Guardian] Protection Rule Matched:", rule.type);

    // 1. Client-Side Redirect
    if (rule.redirectTo) {
      console.log("[Mojo Guardian] Redirecting to:", rule.redirectTo);
      window.location.href = rule.redirectTo;
      return;
    }

    // 2. SEO Injections
    if (rule.title) {
      document.title = rule.title;
      console.log("[Mojo Guardian] Title Optimized.");
    }

    if (rule.metaDescription || rule.metaDesc) {
      const desc = rule.metaDescription || rule.metaDesc;
      let meta = document.querySelector('meta[name="description"]');
      if (meta) {
        meta.setAttribute('content', desc);
      } else {
        meta = document.createElement('meta');
        meta.name = "description";
        meta.content = desc;
        document.head.appendChild(meta);
      }
      console.log("[Mojo Guardian] Meta Optimized.");
    }

    // 3. Schema Injection
    if (rule.schema) {
      const script = document.createElement('script');
      script.type = "application/ld+json";
      script.text = JSON.stringify(rule.schema);
      document.head.appendChild(script);
      console.log("[Mojo Guardian] Schema Injected.");
    }
  }

  // Run on load
  if (document.readyState === 'complete') {
    syncProtection();
  } else {
    window.addEventListener('load', syncProtection);
  }
})();
