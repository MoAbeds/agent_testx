'use client';

import { useState } from 'react';
import { Search, RefreshCw, X } from 'lucide-react';
import Toast from './Toast';

export default function ResearchButton({ siteId, initialIndustry }: { siteId: string, initialIndustry?: string }) {
  const [loading, setLoading] = useState(false);
  const [industry, setIndustry] = useState(initialIndustry || '');
  const [showInput, setShowInput] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const runResearch = async () => {
    if (!industry.trim()) {
      setNotification({ message: "Please provide some industry context.", type: "info" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/sites/keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId, manualIndustry: industry })
      });
      const data = await res.json();
      if (data.success) {
        setNotification({ message: "Site research complete! Market Intelligence updated.", type: "success" });
        setShowInput(false);
      } else {
        setNotification({ message: `Research failed: ${data.error || 'Unknown error'}`, type: "error" });
      }
    } catch (e) {
      console.error(e);
      setNotification({ message: "Network error: Could not reach the research API.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      {showInput ? (
        <div className="absolute right-0 top-0 mt-10 w-80 bg-[#0d0d0d] border border-gray-800 rounded-xl p-4 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Industry Deep-Dive</span>
            <button onClick={() => setShowInput(false)} className="text-gray-500 hover:text-white">
              <X size={14} />
            </button>
          </div>
          
          <textarea 
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            placeholder="Describe your industry, product, or specific target niche in detail..."
            className="w-full bg-black border border-gray-800 rounded-lg p-3 text-xs text-white focus:border-terminal outline-none h-32 mb-4 resize-none leading-relaxed placeholder:text-gray-700"
            autoFocus
          />
          
          <button 
            onClick={runResearch}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-terminal hover:bg-green-400 text-black text-[10px] font-black uppercase py-2.5 rounded-lg transition-all disabled:opacity-50"
          >
            {loading ? <RefreshCw className="animate-spin" size={12} /> : <Search size={12} />}
            Analyze & Fetch Keywords
          </button>
        </div>
      ) : (
        <button 
          onClick={() => setShowInput(true)}
          disabled={loading}
          className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-terminal hover:text-green-400 transition-colors bg-terminal/10 px-3 py-1.5 rounded-lg border border-terminal/20"
        >
          {loading ? <RefreshCw className="animate-spin" size={12} /> : <Search size={12} />}
          Research Site
        </button>
      )}

      {notification && (
        <Toast 
          message={notification.message} 
          type={notification.type} 
          onClose={() => setNotification(null)} 
        />
      )}
    </div>
  );
}
