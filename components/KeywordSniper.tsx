'use client';

import { useAuth } from '@/lib/hooks';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Target, TrendingUp, DollarSign, Loader2, Sparkles, Zap, Shield } from 'lucide-react';

export default function KeywordSniper({ siteId }: { siteId: string }) {
  const { user } = useAuth();
  const [gscData, setGscData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [optimizing, setOptimizing] = useState<string | null>(null);

  useEffect(() => {
    if (!siteId || !db) return;
    const siteRef = query(collection(db, "sites"), where("__name__", "==", siteId));
    return onSnapshot(siteRef, (snap) => {
      if (!snap.empty) {
        const data = snap.docs[0].data();
        if (data.gscData) {
          try { setGscData(JSON.parse(data.gscData)); } catch(e) {}
        }
      }
      setLoading(false);
    });
  }, [siteId]);

  const runSniper = async (keyword: string) => {
    setOptimizing(keyword);
    try {
      await fetch('/api/seo/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          siteId, 
          userId: user.uid, 
          topic: `How to dominate rankings for ${keyword}`,
          targetKeyword: keyword
        })
      });
      alert(`Sniper deployed for ${keyword}! Mojo Ghost-Writer is pushing it to Page 1.`);
    } catch (e) {
      console.error(e);
    } finally {
      setOptimizing(null);
    }
  };

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-terminal" /></div>;
  if (!gscData) return null;

  const strikeZone = gscData.topKeywords?.filter((kw: any) => kw.position > 3 && kw.position <= 12) || [];

  return (
    <div className="bg-[#0a0a0a] border border-terminal/20 rounded-2xl overflow-hidden shadow-[0_0_20px_rgba(34,197,94,0.05)]">
      <div className="p-6 border-b border-gray-800 bg-terminal/5 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2 font-serif">
            <Target className="text-terminal" size={20} />
            The "Strike Zone" Sniper
          </h2>
          <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest font-black">Low Hanging Fruit Keywords (#4 - #12)</p>
        </div>
        <div className="bg-terminal/10 px-3 py-1.5 rounded-full border border-terminal/20 flex items-center gap-2">
          <Shield size={14} className="text-terminal" />
          <span className="text-sm font-black text-white font-mono">{gscData.moatIndex || '0'} MOAT INDEX</span>
        </div>
      </div>

      <div className="divide-y divide-gray-800">
        {strikeZone.length === 0 ? (
          <div className="p-8 text-center text-gray-600 italic text-sm">
            No "Strike Zone" opportunities found yet. Keep ranking!
          </div>
        ) : (
          strikeZone.map((kw: any, i: number) => (
            <div key={i} className="p-5 flex items-center justify-between hover:bg-white/[0.02] transition-all group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-gray-900 border border-gray-800 flex items-center justify-center font-black text-terminal font-mono text-xs">
                  #{kw.position}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-200 font-mono">{kw.query}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] text-gray-500 flex items-center gap-1">
                      <TrendingUp size={10} /> {kw.clicks} Clicks
                    </span>
                    <span className="text-[10px] text-gray-500 flex items-center gap-1">
                      <Shield size={10} className="text-purple-400" /> Moat: {kw.moat}%
                    </span>
                  </div>
                </div>
              </div>
              
              <button 
                onClick={() => runSniper(kw.query)}
                disabled={optimizing === kw.query}
                className="px-4 py-2 bg-terminal text-black text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-green-400 transition-all flex items-center gap-2 shadow-[0_0_10px_rgba(34,197,94,0.2)]"
              >
                {optimizing === kw.query ? <Loader2 className="animate-spin" size={14} /> : <Zap size={14} />}
                Deploy Sniper
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
