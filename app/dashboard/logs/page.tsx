'use client';

import { Suspense, useEffect, useState } from 'react';
import { Bot, Terminal as TerminalIcon, Search, Clock, ShieldAlert, Loader2, Globe } from 'lucide-react';
import { useAuth } from '@/lib/hooks';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { useSearchParams, useRouter } from 'next/navigation';

function LogsContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const siteId = searchParams.get('siteId');

  const [allSites, setAllSites] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetch sites belonging ONLY to this user
  useEffect(() => {
    if (!user) return;
    const fetchSites = async () => {
      const q = query(collection(db, "sites"), where("userId", "==", user.uid));
      const snap = await getDocs(q);
      const sites = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setAllSites(sites);
    };
    fetchSites();
  }, [user]);

  // 2. Fetch logs with ownership verification
  useEffect(() => {
    // SECURITY: Immediate wipe on account/site change
    setLogs([]);
    
    if (!user) return;

    const fetchLogs = async () => {
      setLoading(true);
      try {
        // Use the secure API that verifies ownership server-side
        const baseUrl = `/api/agent/logs?userId=${user.uid}`;
        const url = siteId ? `${baseUrl}&siteId=${siteId}` : baseUrl;
        
        const res = await fetch(url);
        const data = await res.json();
        
        if (data.success) {
          setLogs(data.events || []);
        }
      } catch (e) {
        console.error("Logs fetch error:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [siteId, user?.uid]);

  if (loading && logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-500 font-mono text-sm">
        <Loader2 className="animate-spin text-terminal mb-4" size={32} />
        Decrypting agent transmissions...
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3 font-serif">
            <Bot className="text-terminal" size={32} />
            AI Decision Logs
          </h1>
          <p className="text-gray-400 text-sm md:text-base">
            Real-time audit of Mojo Guardian's autonomous reasoning and actions.
          </p>
        </div>

        {/* Site Filter */}
        <div className="relative group">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-hover:text-terminal transition-colors">
            <Globe size={14} />
          </div>
          <select 
            value={siteId || ''}
            onChange={(e) => router.push(`/dashboard/logs${e.target.value ? `?siteId=${e.target.value}` : ''}`)}
            className="pl-9 pr-8 py-2.5 bg-[#0a0a0a] border border-gray-800 rounded-xl text-xs font-bold text-gray-300 appearance-none focus:border-terminal outline-none cursor-pointer min-w-[200px]"
          >
            <option value="">All Managed Domains</option>
            {allSites.map(s => (
              <option key={s.id} value={s.id}>{s.domain}</option>
            ))}
          </select>
        </div>
      </header>

      <div className="grid gap-4">
        {logs.length === 0 ? (
          <div className="p-20 text-center border border-dashed border-gray-800 rounded-2xl bg-gray-900/10">
            <Clock className="mx-auto text-gray-700 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-400">No logs found</h3>
            <p className="text-gray-600 text-sm mt-1">Connect your agent to see live autonomous decisions.</p>
          </div>
        ) : (
          logs.map((log) => {
            const date = log.occurredAt?.seconds ? new Date(log.occurredAt.seconds * 1000) : new Date();
            return (
              <div key={log.id} className="bg-[#0a0a0a] border border-gray-800 rounded-2xl p-5 hover:border-gray-700 transition-all group shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${log.type.includes('FIX') ? 'bg-green-500/10 text-green-400' : 'bg-blue-500/10 text-blue-400'}`}>
                      <TerminalIcon size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-gray-900 border border-gray-800 text-gray-500">
                          {log.type.replace('_', ' ')}
                        </span>
                        <span className="text-xs font-mono text-terminal">{log.path}</span>
                      </div>
                      <p className="text-sm text-gray-300 leading-relaxed max-w-2xl">
                        {log.details ? (JSON.parse(typeof log.details === 'string' ? log.details : '{}').message || 'Autonomous task processed') : 'Mojo reasoning sequence completed.'}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-row md:flex-col items-center md:items-end gap-2 shrink-0">
                    <span className="text-[10px] font-mono text-gray-600 uppercase tracking-tighter">
                      {date.toLocaleDateString()}
                    </span>
                    <span className="text-xs font-bold text-gray-400 font-mono">
                      {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default function LogsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin text-terminal" size={48} /></div>}>
      <LogsContent />
    </Suspense>
  );
}
