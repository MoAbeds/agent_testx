'use client';

import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[#0a0a0a]">
        {/* Grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(34, 197, 94, 0.3) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(34, 197, 94, 0.3) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        />
        {/* Radial glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-terminal/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        {/* Status Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-terminal/30 bg-terminal/5 text-sm text-terminal mb-8 animate-pulse">
          <Sparkles size={14} />
          <span>AI-Powered SEO Automation</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
          <span className="bg-gradient-to-b from-white via-gray-200 to-gray-500 bg-clip-text text-transparent">
            Recover Lost Revenue
          </span>
          <br />
          <span className="text-terminal">on Autopilot.</span>
        </h1>

        {/* Subtext */}
        <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          The first SEO agent that finds errors and fixes them instantly.
          <span className="text-gray-300 font-medium"> No developers required.</span>
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/dashboard"
            className="group flex items-center gap-2 bg-terminal hover:bg-green-400 text-black font-semibold px-8 py-4 rounded-lg transition-all shadow-lg shadow-terminal/20 hover:shadow-terminal/40"
          >
            Launch Console
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="#features"
            className="flex items-center gap-2 text-gray-400 hover:text-white font-medium px-6 py-4 transition-colors"
          >
            See how it works
          </Link>
        </div>

        {/* Trust indicators */}
        <div className="mt-16 pt-8 border-t border-gray-800/50">
          <p className="text-xs text-gray-600 uppercase tracking-widest mb-4">Trusted by growth teams at</p>
          <div className="flex items-center justify-center gap-8 text-gray-600">
            <span className="text-lg font-semibold tracking-tight">Vercel</span>
            <span className="text-lg font-semibold tracking-tight">Supabase</span>
            <span className="text-lg font-semibold tracking-tight">Linear</span>
            <span className="text-lg font-semibold tracking-tight">Raycast</span>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-gray-600">
        <span className="text-xs uppercase tracking-widest">Scroll</span>
        <div className="w-px h-8 bg-gradient-to-b from-gray-600 to-transparent" />
      </div>
    </section>
  );
}
