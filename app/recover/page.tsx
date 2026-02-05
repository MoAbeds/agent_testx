'use client';

import Link from 'next/link';
import { Terminal, Shield } from 'lucide-react';

export default function RecoverPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-4">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-terminal/5 rounded-full blur-[120px]" />
      </div>

      {/* Logo */}
      <Link href="/" className="flex items-center gap-3 mb-8 group relative z-10">
        <div className="w-10 h-10 rounded-lg bg-terminal/10 border border-terminal/30 flex items-center justify-center group-hover:bg-terminal/20 transition-colors">
          <Terminal size={20} className="text-terminal" />
        </div>
        <span className="text-2xl font-bold tracking-tight text-white">
          Mojo<span className="text-terminal">.</span>
        </span>
      </Link>

      {/* Auth Card */}
      <div className="relative z-10 w-full max-w-md">
        <div className="absolute inset-0 bg-gradient-to-b from-terminal/10 to-transparent rounded-2xl blur-xl opacity-50" />
        <div className="relative bg-gray-900/60 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-8 shadow-2xl">
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 rounded-full bg-terminal/10 border border-terminal/30 flex items-center justify-center">
              <Shield size={24} className="text-terminal" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-white text-center mb-2">
            Forgot Password?
          </h1>
          <p className="text-gray-400 text-center mb-8 text-sm leading-relaxed">
            Please use our official login page to sign in with your Google or Email account.
          </p>

          <Link
            href="/login"
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-terminal text-black font-black uppercase tracking-widest text-xs rounded-xl hover:bg-green-400 transition-all"
          >
            Go to Login
          </Link>

          <div className="mt-6 pt-6 border-t border-gray-800 text-center">
            <p className="text-sm text-gray-400">
              Back to{' '}
              <Link href="/" className="text-terminal hover:underline font-medium">
                Home
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
