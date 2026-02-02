'use client';

import { useState } from 'react';
import { Search, RefreshCw } from 'lucide-react';

export default function ResearchButton({ siteId }: { siteId: string }) {
  const [loading, setLoading] = useState(false);

  const runResearch = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/sites/keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId })
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
    }
  };

  return (
    <button 
      onClick={runResearch}
      disabled={loading}
      className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-terminal hover:text-green-400 transition-colors bg-terminal/10 px-2 py-1 rounded border border-terminal/20"
    >
      {loading ? <RefreshCw className="animate-spin" size={12} /> : <Search size={12} />}
      Research Site
    </button>
  );
}
