'use client';

import { useState, useEffect } from 'react';
import { BrainCircuit, Loader2, Send, CheckCircle2, Sparkles } from 'lucide-react';
import Toast from './Toast';

export default function IndustryDeepDive({ siteId, initialIndustry }: { siteId: string, initialIndustry?: string }) {
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [intel, setIntel] = useState<any>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    if (initialIndustry && initialIndustry !== 'N/A' && initialIndustry !== 'General') {
      setIntel({ industry: initialIndustry });
      setCompleted(true);
    }
  }, [initialIndustry]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || description.length < 10) {
      return setNotification({ message: "Please provide a more detailed description.", type: 'error' });
    }

    setLoading(true);
    try {
      // 1. Process with AI Brain
      const res = await fetch('/api/seo/deep-dive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId, description })
      });
      const data = await res.json();
      
      if (data.success) {
        setIntel(data.intel);
        setNotification({ message: "Brain Analysis complete. Triggering SEO Data-Sync...", type: 'info' });

        // 2. Push to Keywords API to get volumes for the new seeds
        const keywordRes = await fetch('/api/sites/keywords', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            siteId, 
            manualIndustry: data.intel.industry,
            forceSeeds: data.intel.seeds 
          })
        });
        
        if (keywordRes.ok) {
          setCompleted(true);
          setNotification({ message: "Market Intelligence updated with high-volume keywords!", type: 'success' });
        }
      }
    } catch (e) {
      setNotification({ message: "Cognitive sync failed.", type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-indigo-950/20 to-black border border-indigo-500/20 rounded-2xl p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-[0.05]">
        <BrainCircuit size={100} className="text-indigo-400" />
      </div>

      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-indigo-500/10 p-2 rounded-lg border border-indigo-500/20 text-indigo-400">
            <BrainCircuit size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white font-serif">Industry Deep-Dive</h2>
            <p className="text-[10px] uppercase tracking-widest text-indigo-400 font-bold">Autonomous Sync Enabled</p>
          </div>
        </div>

        {!completed ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-xs text-gray-400 leading-relaxed">
              Describe your business. Mojo will extract strategic seeds and instantly pull search volume data from the SEO APIs.
            </p>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. We are a boutique Real Estate agency in Miami focusing on high-end luxury condos..."
              className="w-full bg-black/50 border border-gray-800 rounded-xl p-4 text-sm text-gray-300 focus:border-indigo-500 outline-none transition-all h-32 scrollbar-thin"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-widest disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
              Initialize & Sync Market Data
            </button>
          </form>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                <span className="text-[8px] uppercase text-indigo-400 font-bold block mb-1">Detected Industry</span>
                <span className="text-sm font-bold text-white capitalize">{intel.industry}</span>
              </div>
              <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                <span className="text-[8px] uppercase text-indigo-400 font-bold block mb-1">Sync Status</span>
                <span className="text-sm font-bold text-terminal font-mono uppercase">Live</span>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 bg-green-500/5 border border-green-500/20 rounded-xl text-green-400">
              <CheckCircle2 size={16} />
              <span className="text-[10px] font-bold uppercase tracking-wide">Cognitive Loop Finished. Market Intelligence Populated.</span>
            </div>

            <button 
              onClick={() => setCompleted(false)}
              className="text-[10px] text-gray-500 hover:text-white uppercase font-bold tracking-widest"
            >
              Update Blueprint
            </button>
          </div>
        )}
      </div>

      {notification && <Toast message={notification.message} type={notification.type} onClose={() => setNotification(null)} />}
    </div>
  );
}
