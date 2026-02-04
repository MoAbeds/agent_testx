'use client';

import { useState, useEffect } from 'react';
import { Eye, Plus, Trash2, TrendingUp, Search, Loader2 } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import Toast from './Toast';

export default function CompetitorWatchlist({ siteId }: { siteId: string }) {
  const [competitors, setCompetitors] = useState<any[]>([]);
  const [newDomain, setNewDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (!siteId) return;
    const q = query(collection(db, "events"), where("siteId", "==", siteId), where("type", "==", "COMPETITOR_INTEL"));
    const unsubscribe = onSnapshot(q, (snap) => {
      const docs = snap.docs.map(d => ({ id: d.id, ...JSON.parse(d.data().details || '{}') }));
      // Deduplicate by domain (latest first)
      const latest = Array.from(new Map(docs.map(item => [item.domain, item])).values());
      setCompetitors(latest);
      setFetching(false);
    });
    return () => unsubscribe();
  }, [siteId]);

  const addCompetitor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomain) return;
    setLoading(true);
    try {
      const res = await fetch('/api/seo/competitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId, competitorDomain: newDomain.replace(/https?:\/\//, '').split('/')[0] })
      });
      const data = await res.json();
      if (data.success) {
        setNotification({ message: `Tracking ${newDomain}... Intel appearing shortly.`, type: 'success' });
        setNewDomain('');
      }
    } catch (e) {
      setNotification({ message: "Failed to add competitor.", type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2 font-serif">
          <Eye className="text-blue-500" size={22} />
          Market Watchlist
        </h2>
        <form onSubmit={addCompetitor} className="flex gap-2">
          <input 
            type="text" 
            placeholder="competitor.com" 
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value)}
            className="bg-black border border-gray-800 rounded-lg px-3 py-1.5 text-sm text-gray-300 focus:border-blue-500 outline-none w-40 md:w-60"
          />
          <button 
            type="submit" 
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-lg transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
          </button>
        </form>
      </div>

      <div className="space-y-4">
        {fetching ? (
          <div className="flex justify-center p-8"><Loader2 className="animate-spin text-gray-600" /></div>
        ) : competitors.length === 0 ? (
          <div className="text-center p-8 border border-dashed border-gray-800 rounded-xl">
            <p className="text-gray-500 text-sm italic">No competitors tracked yet. Add one above.</p>
          </div>
        ) : (
          competitors.map((comp, i) => (
            <div key={i} className="bg-black/40 border border-gray-800 rounded-xl p-4 hover:border-blue-900/50 transition-all group">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-blue-900/20 flex items-center justify-center border border-blue-900/30">
                    <TrendingUp className="text-blue-500" size={16} />
                  </div>
                  <span className="font-bold text-gray-200">{comp.domain}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase text-gray-500 font-bold block tracking-widest">Visibility Index</span>
                  <span className="text-lg font-mono font-bold text-terminal">{comp.visibilityScore}</span>
                </div>
              </div>

              <div className="bg-gray-950/50 rounded-lg p-3">
                <span className="text-[10px] uppercase text-gray-600 font-bold block mb-2">Top Strategic Pages</span>
                <ul className="space-y-1">
                  {comp.topPages?.map((page: string, pi: number) => (
                    <li key={pi} className="text-xs text-gray-400 flex items-center gap-2 truncate">
                      <Search size={10} className="text-gray-600 shrink-0" />
                      <span className="truncate">{page}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))
        )}
      </div>

      {notification && <Toast message={notification.message} type={notification.type} onClose={() => setNotification(null)} />}
    </div>
  );
}
