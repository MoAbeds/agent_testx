'use client';

import Link from 'next/link';
import { Terminal, User } from 'lucide-react';
import { useAuth } from '@/lib/firebase';

export default function LandingNavbar() {
  const { user, loading } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-gray-800/50 bg-[#0a0a0a]/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-12">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-lg bg-terminal/10 border border-terminal/30 flex items-center justify-center group-hover:bg-terminal/20 transition-colors">
              <Terminal size={18} className="text-terminal" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              Mojo<span className="text-terminal">.</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Features</Link>
            <Link href="/pricing" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Pricing</Link>
            <Link href="/dashboard" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Console</Link>
          </div>
        </div>

        {/* Auth Button */}
        {!loading && user ? (
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-terminal border border-terminal/30 rounded-lg hover:bg-terminal/10 transition-all"
          >
            <User size={16} />
            Dashboard
          </Link>
        ) : !loading ? (
          <Link
            href="/login"
            className="px-5 py-2 text-sm font-medium text-gray-300 border border-gray-700 rounded-lg hover:bg-gray-800 hover:text-white hover:border-gray-600 transition-all"
          >
            Login
          </Link>
        ) : (
          <div className="w-20 h-8 bg-gray-800 animate-pulse rounded-lg" />
        )}
      </div>
    </nav>
  );
}
