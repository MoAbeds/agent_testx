import Link from 'next/link';
import { ArrowRight, Shield, Zap, LayoutDashboard } from 'lucide-react';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-[#0a0a0a]">
      <div className="text-center space-y-6 max-w-2xl">
        <div className="inline-flex items-center px-3 py-1 rounded-full border border-gray-800 bg-gray-900/50 text-sm text-gray-400 mb-4">
          <span className="w-2 h-2 rounded-full bg-terminal mr-2 animate-pulse"></span>
          System Operational
        </div>
        
        <h1 className="text-6xl font-bold tracking-tight bg-gradient-to-br from-white to-gray-500 bg-clip-text text-transparent">
          Mojo SaaS
        </h1>
        
        <p className="text-xl text-gray-400">
          The autonomous guardian for your digital infrastructure. Detect bots, optimize SEO, and recover lost revenue in real-time.
        </p>

        <div className="flex gap-4 justify-center mt-8">
          <Link 
            href="/dashboard"
            className="flex items-center gap-2 bg-terminal hover:bg-green-600 text-black font-semibold px-6 py-3 rounded-lg transition-all"
          >
            Enter Dashboard <ArrowRight size={18} />
          </Link>
          <button className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-gray-200 border border-gray-800 font-medium px-6 py-3 rounded-lg transition-all">
            View Documentation
          </button>
        </div>
      </div>

      <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl">
        <Feature 
          icon={Shield} 
          title="Bot Protection" 
          desc="Advanced fingerprinting to stop malicious crawlers before they waste resources." 
        />
        <Feature 
          icon={Zap} 
          title="Performance" 
          desc="Edge-cached assets and automated image optimization for 100/100 Lighthouse scores." 
        />
        <Feature 
          icon={LayoutDashboard} 
          title="Real-time Insight" 
          desc="Watch traffic patterns evolve live with our terminal-grade telemetry feed." 
        />
      </div>
    </main>
  );
}

function Feature({ icon: Icon, title, desc }: { icon: any, title: string, desc: string }) {
  return (
    <div className="p-6 rounded-xl border border-gray-800 bg-[#111]">
      <div className="w-10 h-10 rounded-lg bg-gray-900 flex items-center justify-center mb-4 text-terminal">
        <Icon size={20} />
      </div>
      <h3 className="text-lg font-semibold text-gray-200 mb-2">{title}</h3>
      <p className="text-gray-500 leading-relaxed">{desc}</p>
    </div>
  );
}
