'use client';

import { useState, useEffect } from 'react';
import { Anchor, RefreshCw, Globe, Link2, Target, ShieldCheck, Loader2 } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

export default function BacklinkSection({ siteId }: { siteId: string }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (!siteId || !db) return;
    return onSnapshot(doc(db, "sites", siteId), (snap) => {
      const siteData = snap.data();
      if (siteData?.backlinksData) {
        try {
          setData(JSON.parse(siteData.backlinksData));
        } catch (e) {}
      }
    });
  }, [siteId]);

  const runBacklinkScan = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/seo/backlinks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId })
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#0a0a0a] border border-gray-800 rounded-2xl overflow-hidden shadow-sm">
      <div className="p-6 border-b border-gray-800 bg-gray-900/30 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
            <Anchor size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-widest">Backlink Intelligence</h3>
            <p className="text-[10px] text-gray-500 font-mono">DataForSEO Integration Active</p>
          </div>
        </div>
        <button
          onClick={runBacklinkScan}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-all disabled:opacity-50"
        >
          {loading ? <RefreshCw className="animate-spin" size={14} /> : <Anchor size={14} />}
          {loading ? 'Analyzing...' : 'Scan Backlinks'}
        </button>
      </div>

      <div className="p-6">
        {data ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <StatItem label="Mojo Rank" value={Math.round(data.rank)} icon={Target} color="text-terminal" />
            <StatItem label="Total Links" value={data.backlinks.toLocaleString()} icon={Anchor} color="text-blue-400" />
            <StatItem label="Ref. Domains" value={data.referringDomains.toLocaleString()} icon={Globe} color="text-purple-400" />
            <StatItem label="Ref. Pages" value={data.referringPages.toLocaleString()} icon={Link2} color="text-orange-400" />
          </div>
        ) : (
          <div className="py-12 text-center flex flex-col items-center">
            <ShieldCheck className="text-gray-800 mb-3" size={40} />
            <p className="text-gray-500 text-sm italic">No backlink data indexed. Run a scan to discover your domain authority.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatItem({ label, value, icon: Icon, color }: any) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-gray-500">
        <Icon size={14} />
        <span className="text-[10px] font-bold uppercase tracking-tighter">{label}</span>
      </div>
      <p className={`text-2xl font-black font-mono ${color}`}>{value}</p>
    </div>
  );
}
