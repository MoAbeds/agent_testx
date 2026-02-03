'use client';

import { useAuth, db } from '@/lib/hooks';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useEffect, useState, Suspense } from 'react';
import { Shield, Code, Globe, Zap, CheckCircle, Copy, Loader2, ChevronDown } from 'lucide-react';
import CopyButton from '@/components/CopyButton';

function InstallContent() {
  const { user } = useAuth();
  const [sites, setSites] = useState<any[]>([]);
  const [selectedSite, setSelectedSite] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!user || !db) return;

    const q = query(collection(db, "sites"), where("userId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snap) => {
      const siteList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setSites(siteList);
      if (siteList.length > 0 && !selectedSite) {
        setSelectedSite(siteList[0]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader2 className="animate-spin text-terminal" size={48} />
      </div>
    );
  }

  if (sites.length === 0) {
    return (
      <div className="p-8 text-center border border-dashed border-gray-800 rounded-2xl bg-gray-900/20">
        <Globe className="mx-auto text-gray-600 mb-4" size={48} />
        <h1 className="text-2xl font-bold text-white mb-4">No Sites Connected</h1>
        <p className="text-gray-400 mb-8">You need to add a site in the Overview page before you can deploy the agent.</p>
        <a href="/dashboard" className="bg-terminal text-black px-6 py-2 rounded-lg font-bold">Go to Dashboard</a>
      </div>
    );
  }

  const apiKey = selectedSite?.apiKey || 'MOJO_API_KEY';
  const manifestUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://mojo-saas.vercel.app'}/api/agent/manifest`;

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      {/* Site Selector Header */}
      <div className="bg-gray-900/30 border border-gray-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-1">Configuration for:</h3>
          <div className="relative">
            <button 
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center gap-3 text-2xl font-bold text-white hover:text-terminal transition-colors group"
            >
              {selectedSite?.domain}
              <ChevronDown size={20} className="text-gray-600 group-hover:text-terminal" />
            </button>
            
            {isOpen && (
              <div className="absolute top-full left-0 mt-2 w-64 bg-[#111] border border-gray-800 rounded-xl shadow-2xl z-50 overflow-hidden">
                {sites.map(s => (
                  <button
                    key={s.id}
                    onClick={() => { setSelectedSite(s); setIsOpen(false); }}
                    className="w-full text-left px-4 py-3 text-sm hover:bg-terminal/10 hover:text-terminal border-b border-gray-800/50 last:border-0"
                  >
                    {s.domain}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold text-gray-600 uppercase tracking-tighter">Your Unique API Key</span>
          <div className="flex items-center gap-2 bg-black px-3 py-2 rounded-lg border border-gray-800">
            <code className="text-xs text-terminal font-mono">{apiKey}</code>
            <CopyButton text={apiKey} size={14} />
          </div>
        </div>
      </div>

      {/* Universal JS Snippet */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-yellow-500/10 rounded-lg border border-yellow-500/20 text-yellow-500">
            <Globe size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Universal HTML / Static Sites</h2>
            <p className="text-sm text-gray-500">Works on any website. Best for Webflow, Shopify, or plain HTML.</p>
          </div>
        </div>
        
        <div className="bg-[#0a0a0a] border border-gray-800 rounded-2xl p-6 relative group overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <Code size={100} />
          </div>
          <p className="text-xs text-gray-400 mb-4 font-medium uppercase tracking-widest">Paste this inside your &lt;head&gt; tag:</p>
          <pre className="text-[11px] md:text-sm font-mono text-terminal bg-black/50 p-4 rounded-xl border border-white/5 overflow-x-auto whitespace-pre">
{`<script>
  (function(m,o,j,o_){
    window.MOJO_KEY = "${apiKey}";
    window.MOJO_API = "${manifestUrl}";
    var s = document.createElement('script');
    s.src = "${window.location.origin}/agent.v1.js";
    s.async = true; document.head.appendChild(s);
  })();
</script>`}
          </pre>
          <div className="mt-4 flex justify-end">
             <CopyButton text={`<script>(function(m,o,j,o_){ window.MOJO_KEY = "${apiKey}"; window.MOJO_API = "${manifestUrl}"; var s = document.createElement('script'); s.src = "${window.location.origin}/agent.v1.js"; s.async = true; document.head.appendChild(s); })();</script>`} />
          </div>
        </div>
      </section>

      {/* WordPress Section */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20 text-blue-500">
            <Shield size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">WordPress Integration</h2>
            <p className="text-sm text-gray-500">Deep integration for 301 redirects and on-page SEO overrides.</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#0a0a0a] border border-gray-800 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-gray-300 mb-4 flex items-center gap-2">
              <CheckCircle size={14} className="text-terminal" />
              Step 1: Download Plugin
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Our WordPress bridge handles server-side redirects before your page even loads for maximum speed.
            </p>
            <a 
              href="https://github.com/MoAbeds/agent_testx/raw/main/integrations/wordpress/mojo-guardian.php"
              download
              className="mt-6 inline-block w-full text-center py-2 rounded-lg bg-white/5 border border-white/10 text-xs font-bold hover:bg-white/10 transition-all"
            >
              Download mojo-guardian.php
            </a>
          </div>

          <div className="bg-[#0a0a0a] border border-gray-800 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-gray-300 mb-4 flex items-center gap-2">
              <CheckCircle size={14} className="text-terminal" />
              Step 2: Connect Key
            </h3>
            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
              Use this site-specific key in the Mojo settings page on your WordPress dashboard:
            </p>
            <div className="flex items-center gap-2 bg-black rounded-lg border border-gray-800 p-2">
              <code className="flex-1 text-[10px] text-terminal font-mono truncate">{apiKey}</code>
              <CopyButton text={apiKey} size={14} />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function InstallPage() {
  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <header className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-terminal/10 p-2 rounded-lg border border-terminal/20">
            <Zap className="text-terminal" size={24} />
          </div>
          <h1 className="text-4xl font-bold text-white font-serif tracking-tight">Deploy Guardian</h1>
        </div>
        <p className="text-gray-400 max-w-2xl text-lg">
          Transform your site into autonomous infrastructure. Select a site to get your deployment code.
        </p>
      </header>

      <Suspense fallback={<Loader2 className="animate-spin text-terminal" size={48} />}>
        <InstallContent />
      </Suspense>
    </div>
  );
}
