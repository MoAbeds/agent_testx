export default function Home() {
  return (
    <main className="bg-[#0a0a0a] text-white flex flex-col items-center justify-center min-h-screen p-6 font-sans">
      <div className="max-w-md w-full bg-gray-900 border border-gray-800 rounded-3xl p-10 shadow-2xl text-center space-y-8">
        <div className="relative">
          <div className="absolute inset-0 bg-terminal/20 blur-3xl rounded-full" />
          <img 
            src="https://agenttestx-production-19d6.up.railway.app/logo.svg" 
            alt="Mojo" 
            className="w-20 h-20 mx-auto relative z-10 animate-bounce"
          />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-4xl font-black tracking-tighter">Mojo Next.js</h1>
          <p className="text-gray-500 text-sm font-medium">SSR-Powered Autonomous SEO</p>
        </div>

        <p className="text-gray-400 leading-relaxed text-sm">
          This Next.js application is utilizing the official <code className="text-terminal">@moabeds/mojo-guardian</code> NPM package to inject AI-optimized metadata at the edge.
        </p>
        
        <div className="pt-6 border-t border-gray-800">
          <p className="text-[10px] text-gray-600 font-mono uppercase tracking-widest">
            Built for speed. Made by Pharaoh_
          </p>
        </div>
      </div>
    </main>
  );
}
