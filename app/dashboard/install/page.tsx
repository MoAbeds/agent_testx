import { prisma } from '@/lib/prisma';
import { Shield, Code, Globe, Zap, CheckCircle, Copy } from 'lucide-react';
import CopyButton from '@/components/CopyButton';

export const dynamic = 'force-dynamic';

export default async function InstallPage() {
  const site = await prisma.site.findFirst();

  if (!site) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-white mb-4">No Site Found</h1>
        <p className="text-gray-400">Please add a site first to generate your installation snippets.</p>
      </div>
    );
  }

  const apiKey = site.apiKey;
  const manifestUrl = `${process.env.NEXTAUTH_URL || 'https://mojo-saas.vercel.app'}/api/agent/manifest`;

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
          Connect <span className="text-blue-400 font-mono">{site.domain}</span> to the Mojo Network. Choose your platform below to start the autonomous optimization.
        </p>
      </header>

      <div className="space-y-12">
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
    s.src = "https://cdn.mojo-guardian.com/agent.v1.js";
    s.async = true; document.head.appendChild(s);
  })();
</script>`}
            </pre>
            <div className="mt-4 flex justify-end">
               <CopyButton text={`<script>(function(m,o,j,o_){ window.MOJO_KEY = "${apiKey}"; window.MOJO_API = "${manifestUrl}"; var s = document.createElement('script'); s.src = "https://cdn.mojo-guardian.com/agent.v1.js"; s.async = true; document.head.appendChild(s); })();</script>`} />
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
                Step 1: Install Plugin
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Download the <strong>Mojo Guardian WordPress Bridge</strong>. This handles server-side 301 redirects before your page even loads.
              </p>
              <button className="mt-6 w-full py-2 rounded-lg bg-white/5 border border-white/10 text-xs font-bold hover:bg-white/10 transition-all">
                Download .zip (Coming Soon)
              </button>
            </div>

            <div className="bg-[#0a0a0a] border border-gray-800 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-gray-300 mb-4 flex items-center gap-2">
                <CheckCircle size={14} className="text-terminal" />
                Step 2: Add API Key
              </h3>
              <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                Add this key to your WordPress <code>wp-config.php</code> or the Mojo settings page:
              </p>
              <div className="flex items-center gap-2 bg-black rounded-lg border border-gray-800 p-2">
                <code className="flex-1 text-[10px] text-terminal font-mono truncate">{apiKey}</code>
                <CopyButton text={apiKey} size={14} />
              </div>
            </div>
          </div>
        </section>

        {/* Node.js / Other Section */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-green-500/10 rounded-lg border border-green-500/20 text-green-500">
              <Code size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Advanced SDK (Node.js, PHP, Python)</h2>
              <p className="text-sm text-gray-500">For developers who want full server-side control.</p>
            </div>
          </div>
          
          <div className="bg-[#0a0a0a] border border-gray-800 rounded-2xl p-6">
            <div className="flex items-center gap-4 mb-6">
               <span className="px-3 py-1 rounded bg-terminal/10 text-terminal text-[10px] font-bold border border-terminal/20 uppercase tracking-widest">npm</span>
               <span className="px-3 py-1 rounded bg-blue-500/10 text-blue-400 text-[10px] font-bold border border-blue-500/20 uppercase tracking-widest">composer</span>
               <span className="px-3 py-1 rounded bg-yellow-500/10 text-yellow-400 text-[10px] font-bold border border-yellow-500/20 uppercase tracking-widest">pip</span>
            </div>
            <p className="text-sm text-gray-400">
              The Mojo Agent is a simple middleware that intercepts requests. You can find our official SDKs on GitHub or build your own by hitting the 
              <code className="text-blue-400 mx-1">/api/agent/manifest</code> endpoint.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
