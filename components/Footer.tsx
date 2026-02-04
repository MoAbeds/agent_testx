'use client';

import Link from 'next/link';
import { Terminal, Github, Twitter } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative border-t border-gray-800/50 bg-[#0a0a0a]">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo & Copyright */}
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 flex items-center justify-center">
              <img src="/logo.svg" alt="Mojo Guardian" className="w-full h-full" />
            </div>
            <div className="text-sm text-gray-600 font-serif">
              © {currentYear} <span className="text-gray-400 font-bold">Mojo Guardian</span>. Autonomous SEO infrastructure.
            </div>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <Link href="#" className="hover:text-white transition-colors">
              Privacy
            </Link>
            <Link href="#" className="hover:text-white transition-colors">
              Terms
            </Link>
            <Link href="#" className="hover:text-white transition-colors">
              Docs
            </Link>
          </div>

          {/* Social */}
          <div className="flex items-center gap-4">
            <a 
              href="#" 
              className="w-9 h-9 rounded-lg border border-gray-800 flex items-center justify-center text-gray-600 hover:text-white hover:border-gray-700 transition-all"
            >
              <Github size={16} />
            </a>
            <a 
              href="#" 
              className="w-9 h-9 rounded-lg border border-gray-800 flex items-center justify-center text-gray-600 hover:text-white hover:border-gray-700 transition-all"
            >
              <Twitter size={16} />
            </a>
          </div>
        </div>

        {/* Bottom tagline */}
        <div className="mt-8 pt-8 border-t border-gray-800/30 text-center">
          <p className="text-xs text-gray-700 font-mono">
            <span className="text-terminal">$</span> Built for teams who ship fast_
          </p>
        </div>
      </div>
    </footer>
  );
}
