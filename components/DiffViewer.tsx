'use client';

import { ArrowRight } from 'lucide-react';

interface DiffViewerProps {
  oldTitle: string;
  newTitle: string;
  oldMeta: string;
  newMeta: string;
}

export default function DiffViewer({ oldTitle, newTitle, oldMeta, newMeta }: DiffViewerProps) {
  return (
    <div className="bg-[#111] border border-gray-800 rounded-xl overflow-hidden mt-8">
      <div className="bg-gray-900 px-4 py-3 border-b border-gray-800 flex justify-between items-center">
        <h3 className="text-sm font-medium text-gray-300">SEO Optimization Log</h3>
        <span className="text-xs text-gray-500 font-mono">id: latest</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-800">
        {/* Before */}
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs uppercase tracking-wider text-gray-400 bg-gray-800 px-2 py-1 rounded">Original</span>
            <span className="text-xs text-gray-500">Previous</span>
          </div>
          <div className="font-mono text-sm text-gray-500 space-y-4">
            <div>
              <p className="text-xs text-gray-600 mb-1">Title Tag</p>
              <div className="line-through decoration-red-500/50 text-red-500/50">{oldTitle}</div>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">Meta Description</p>
              <div className="line-through decoration-red-500/50 text-red-500/50">{oldMeta}</div>
            </div>
          </div>
        </div>

        {/* After */}
        <div className="p-6 bg-green-950/10">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs uppercase tracking-wider text-green-400 bg-green-900/20 px-2 py-1 rounded">Optimized</span>
            <span className="text-xs text-green-700/70">Live <ArrowRight className="inline w-3 h-3 ml-1"/></span>
          </div>
          <div className="font-mono text-sm text-green-400 space-y-4">
            <div>
              <p className="text-xs text-green-700 mb-1">Title Tag</p>
              <div>{newTitle}</div>
            </div>
            <div>
              <p className="text-xs text-green-700 mb-1">Meta Description</p>
              <div>{newMeta}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
