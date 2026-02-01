'use client';

import { ArrowRight } from 'lucide-react';

export default function DiffViewer() {
  return (
    <div className="bg-[#111] border border-gray-800 rounded-xl overflow-hidden mt-8">
      <div className="bg-gray-900 px-4 py-3 border-b border-gray-800 flex justify-between items-center">
        <h3 className="text-sm font-medium text-gray-300">SEO Optimization Log</h3>
        <span className="text-xs text-gray-500 font-mono">id: seo-8f92-opt</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-800">
        {/* Before */}
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs uppercase tracking-wider text-gray-400 bg-gray-800 px-2 py-1 rounded">Original</span>
            <span className="text-xs text-gray-500">v1.0.4</span>
          </div>
          <div className="font-mono text-sm text-gray-500 space-y-4">
            <div>
              <p className="text-xs text-gray-600 mb-1">Title Tag</p>
              <div className="line-through decoration-red-500/50 text-red-900/50">Home Page</div>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">Meta Description</p>
              <div className="line-through decoration-red-500/50 text-red-900/50">Welcome to our website. We do stuff.</div>
            </div>
          </div>
        </div>

        {/* After */}
        <div className="p-6 bg-green-950/10">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs uppercase tracking-wider text-green-400 bg-green-900/20 px-2 py-1 rounded">Optimized</span>
            <span className="text-xs text-green-700/70">v1.0.5 <ArrowRight className="inline w-3 h-3 ml-1"/></span>
          </div>
          <div className="font-mono text-sm text-green-400 space-y-4">
            <div>
              <p className="text-xs text-green-700 mb-1">Title Tag</p>
              <div>AI SaaS Automation Platform | Mojo</div>
            </div>
            <div>
              <p className="text-xs text-green-700 mb-1">Meta Description</p>
              <div>Scale your revenue with autonomous AI agents. Automate your workflow today.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
