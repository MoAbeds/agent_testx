'use client';

import { db } from '@/lib/firebase';
import { collection, query, limit, onSnapshot, orderBy } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Activity, Trophy, Zap, Globe } from 'lucide-react';

export default function GuardianPulse() {
  const [pulses, setPulse] = useState<any[]>([]);

  useEffect(() => {
    // Pulse shows global (anonymized) wins to build Social Proof
    const q = query(
      collection(db, "events"), 
      where("type", "in", ["AI_STRATEGIC_FIX", "AUTO_CONTENT_GEN", "HEARTBEAT"]),
      orderBy("occurredAt", "desc"),
      limit(5)
    );

    return onSnapshot(q, (snap) => {
      const news = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPulse(news);
    });
  }, []);

  return (
    <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl overflow-hidden shadow-sm">
      <div className="px-4 py-3 bg-gray-900/50 border-b border-gray-800 flex items-center justify-between">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
          <Activity size={12} className="text-terminal animate-pulse" />
          Guardian Pulse
        </h3>
        <span className="text-[8px] font-bold text-gray-600 uppercase">Live Network Feed</span>
      </div>
      <div className="p-4 space-y-4">
        {pulses.map((p, i) => (
          <div key={i} className="flex items-center gap-3 animate-in fade-in slide-in-from-right duration-500">
            <div className="w-8 h-8 rounded-lg bg-gray-900 border border-gray-800 flex items-center justify-center shrink-0">
              {p.type === 'AI_STRATEGIC_FIX' ? <Zap size={14} className="text-terminal" /> : <Globe size={14} className="text-blue-400" />}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-gray-300 font-mono truncate">
                <span className="text-gray-500">Guardian #{p.siteId?.substring(0,4)}</span> deployed 
                <span className="text-terminal"> {p.type === 'AI_STRATEGIC_FIX' ? 'Optimization' : 'Handshake'}</span>
              </p>
              <p className="text-[8px] text-gray-600 uppercase font-black tracking-tighter mt-0.5">
                {new Date(p.occurredAt?.seconds * 1000).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
