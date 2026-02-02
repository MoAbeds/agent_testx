'use client';

import { useState } from 'react';
import { Search, RefreshCw } from 'lucide-react';

export default function ResearchButton({ siteId, initialIndustry }: { siteId: string, initialIndustry?: string }) {
  const [loading, setLoading] = useState(false);
  const [industry, setIndustry] = useState(initialIndustry || '');
  const [showInput, setShowInput] = useState(false);

  const runResearch = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/sites/keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId, manualIndustry: industry })
      });
      const data = await res.json();
      if (data.success) {
        alert("Site research complete! New target keywords discovered.");
        window.location.reload();
      } else {
        alert(`Research failed: ${data.error || 'Unknown error'}`);
      }
    } catch (e) {
      console.error(e);
      alert("Network error: Could not reach the research API.");
    } finally {
      setLoading(false);
      setShowInput(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {showInput ? (
        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2">
          <input 
            type="text"
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            placeholder="Enter Industry (e.g. Real Estate)"
            className="bg-black border border-gray-800 rounded px-2 py-1 text-[10px] text-white focus:border-terminal outline-none w-40"
            autoFocus
          />
          <button 
            onClick={runResearch}
            disabled={loading}
            className="text-terminal hover:text-green-400 p-1"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
          <button 
            onClick={() => setShowInput(false)}
            className="text-gray-500 hover:text-gray-300 p-1"
          >
            <Search size={14} className="rotate-45" />
          </button>
        </div>
      ) : (
        <button 
          onClick={() => setShowInput(true)}
          disabled={loading}
          className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-terminal hover:text-green-400 transition-colors bg-terminal/10 px-2 py-1 rounded border border-terminal/20"
        >
          {loading ? <RefreshCw className="animate-spin" size={12} /> : <Search size={12} />}
          Research Site
        </button>
      )}
    </div>
  );
}
