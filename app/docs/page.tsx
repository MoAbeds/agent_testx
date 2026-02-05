import LandingNavbar from '@/components/LandingNavbar';
import Footer from '@/components/Footer';
import { Terminal, Zap, Shield, Search, BookOpen, Code, Server, BrainCircuit } from 'lucide-react';

export default function DocsPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white antialiased">
      <LandingNavbar />
      
      <div className="max-w-7xl mx-auto px-6 pt-32 pb-20 flex flex-col lg:flex-row gap-12">
        {/* Sidebar Navigation */}
        <aside className="lg:w-64 shrink-0 space-y-8">
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-widest text-terminal mb-4">Getting Started</h4>
            <nav className="flex flex-col gap-2 text-sm text-gray-500">
              <a href="#introduction" className="hover:text-white transition-colors">Introduction</a>
              <a href="#quickstart" className="hover:text-white transition-colors">Quickstart Guide</a>
              <a href="#platform-detection" className="hover:text-white transition-colors">Platform Detection</a>
            </nav>
          </div>
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Core Features</h4>
            <nav className="flex flex-col gap-2 text-sm text-gray-500">
              <a href="#mojo-brain" className="hover:text-white transition-colors">Mojo Brain (AI)</a>
              <a href="#serp-tracking" className="hover:text-white transition-colors">SERP Tracker</a>
              <a href="#backlink-intel" className="hover:text-white transition-colors">Backlink Intelligence</a>
              <a href="#autopilot" className="hover:text-white transition-colors">SEO Autopilot</a>
            </nav>
          </div>
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Technical</h4>
            <nav className="flex flex-col gap-2 text-sm text-gray-500">
              <a href="#agent-sdk" className="hover:text-white transition-colors">Agent SDK</a>
              <a href="#api-reference" className="hover:text-white transition-colors">API Reference</a>
            </nav>
          </div>
        </aside>

        {/* Documentation Content */}
        <div className="flex-1 max-w-3xl">
          <div className="prose prose-invert prose-terminal max-w-none space-y-12">
            
            <section id="introduction">
              <h1 className="text-4xl font-bold font-serif mb-4">Documentation</h1>
              <p className="text-xl text-gray-400 leading-relaxed">
                Welcome to the Mojo Guardian documentation. Mojo is an autonomous SEO infrastructure designed to monitor, fix, and rank your websites on autopilot.
              </p>
            </section>

            <section id="quickstart" className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-terminal/10 rounded-lg text-terminal"><Zap size={24} /></div>
                <h2 className="text-2xl font-bold text-white m-0">Quickstart Guide</h2>
              </div>
              <p className="text-gray-400">Follow these steps to get your first site optimized in under 5 minutes:</p>
              <ol className="list-decimal pl-6 space-y-4 text-gray-400">
                <li><strong>Add your site:</strong> Enter your domain in the dashboard. Our engine will automatically detect if you are running WordPress or Next.js.</li>
                <li><strong>Deploy the Agent:</strong> Install our WordPress plugin or Next.js library using your unique API key.</li>
                <li><strong>Run a Deep Dive:</strong> Tell Mojo about your business. Our AI will build a strategic keyword blueprint.</li>
                <li><strong>Activate Mojo Brain:</strong> Let the AI deploy its first round of optimizations directly to your site.</li>
              </ol>
            </section>

            <section id="mojo-brain" className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400"><BrainCircuit size={24} /></div>
                <h2 className="text-2xl font-bold text-white m-0">Mojo Brain (AI Strategist)</h2>
              </div>
              <p className="text-gray-400">
                The Mojo Brain is the core intelligence of the platform. Powered by Gemini 3 Flash, it uses <strong>First-Principles Thinking</strong> to architect ranking strategies.
              </p>
              <div className="bg-[#111] border border-gray-800 rounded-xl p-6 space-y-4 font-mono text-sm">
                <p className="text-terminal"># Iterative Optimization Loop</p>
                <p className="text-gray-500">1. Analyzes current ranking vs. Target Keywords</p>
                <p className="text-gray-500">2. Audits page metadata and semantic structure</p>
                <p className="text-gray-500">3. Deploys "Rules" to the Live Agent for instant updates</p>
              </div>
            </section>

            <section id="autopilot" className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400"><Server size={24} /></div>
                <h2 className="text-2xl font-bold text-white m-0">SEO Autopilot</h2>
              </div>
              <p className="text-gray-400">
                Autopilot mode ensures your SEO never goes stale. It runs periodic checks on your site's performance and automatically triggers the Mojo Brain to refine your strategy based on the latest Google search landscape.
              </p>
            </section>

            <section id="agent-sdk" className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-800 rounded-lg text-gray-400"><Code size={24} /></div>
                <h2 className="text-2xl font-bold text-white m-0">Agent SDK</h2>
              </div>
              <p className="text-gray-400">
                The Agent is a lightweight bridge that connects Mojo Guardian to your site. It intercepts requests before they hit your server to inject optimized metadata and fix broken links in real-time.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-900/10 border border-blue-500/20 rounded-xl">
                  <h4 className="text-blue-400 font-bold mb-2 flex items-center gap-2">
                    <Zap size={14} /> WordPress
                  </h4>
                  <p className="text-[11px] text-gray-500 mb-3">Install our native plugin for zero-code SEO automation.</p>
                  <a href="/dashboard/install" className="text-[10px] font-black uppercase text-blue-400 hover:underline">Download Plugin →</a>
                </div>
                <div className="p-4 bg-terminal/5 border border-terminal/20 rounded-xl">
                  <h4 className="text-terminal font-bold mb-2 flex items-center gap-2">
                    <Code size={14} /> Next.js / Node
                  </h4>
                  <p className="text-[11px] text-gray-500 mb-3">Deploy via NPM for full control over your SSR metadata.</p>
                  <code className="text-[10px] bg-black px-2 py-1 rounded text-terminal border border-terminal/20 block mb-3">npm install @moabeds/mojo-guardian</code>
                  <a href="#agent-sdk" className="text-[10px] font-black uppercase text-terminal hover:underline">View NPM Docs →</a>
                </div>
              </div>
            </section>

          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
