'use client';

import { useAuth } from '@/lib/hooks';
import { collection, query, where, onSnapshot, orderBy, getDocs, limit } from 'firebase/firestore';
import { useEffect, useState, Suspense } from 'react';
import { Server, RefreshCw, Loader2, Globe, Shield, Activity } from 'lucide-react';
import { db } from '@/lib/firebase';

function StatusContent() {
  const { user } = useAuth();
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !db) return;

    // Listen to sites
    const sitesQuery = query(collection(db, "sites"), where("userId", "==", user.uid));
    
    const unsubscribe = onSnapshot(sitesQuery, async (sitesSnap) => {
      const agentList = [];

      for (const siteDoc of sitesSnap.docs) {
        const siteData = siteDoc.data();
        
        // Fetch active rules count for this site
        const rulesSnap = await getDocs(query(
          collection(db, "rules"), 
          where("siteId", "==", siteDoc.id),
          where("isActive", "==", true)
        ));

        // Fetch latest events (sync proxy)
        const eventsSnap = await getDocs(query(
          collection(db, "events"),
          where("siteId", "==", siteDoc.id),
          limit(10)
        ));

        const siteEvents = eventsSnap.docs.map(d => d.data());
        const sortedSiteEvents = siteEvents.sort((a: any, b: any) => 
          (b.occurredAt?.seconds || 0) - (a.occurredAt?.seconds || 0)
        );

        const lastEvent = sortedSiteEvents[0] || null;
        const lastSyncDate = lastEvent?.occurredAt?.toDate() || null;
        
        // Consider online if synced in last 15 mins (WordPress/Node SDK frequency)
        const isOnline = lastSyncDate && (Date.now() - lastSyncDate.getTime()) < 15 * 60 * 1000;

        agentList.push({
          id: siteDoc.id,
          domain: siteData.domain,
          apiKey: siteData.apiKey,
          activeRules: rulesSnap.size,
          lastSync: lastSyncDate,
          isOnline: isOnline,
          version: 'v1.0.2-wp'
        });
      }

      setAgents(agentList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader2 className="animate-spin text-terminal" size={48} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-[#0a0a0a] border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-900/50">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Agent Instance</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Connection</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest text-center">Active Rules</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Last Handshake</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Build</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {agents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <Server className="mx-auto mb-4 text-gray-700" size={40} />
                    <p className="text-gray-500 font-medium">No active agents detected.</p>
                    <p className="text-sm text-gray-600 mt-1">Deploy the Guardian SDK to start monitoring.</p>
                  </td>
                </tr>
              ) : (
                agents.map((agent) => (
                  <tr key={agent.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20 text-blue-400">
                          <Globe size={16} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white font-mono">{agent.domain}</p>
                          <p className="text-[10px] text-gray-600 font-mono tracking-tighter uppercase">{agent.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide border ${
                        agent.isOnline 
                          ? 'bg-green-500/10 text-terminal border-green-500/20' 
                          : 'bg-red-500/10 text-red-500 border-red-500/20'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${agent.isOnline ? 'bg-terminal animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]' : 'bg-red-500'}`} />
                        {agent.isOnline ? 'Live' : 'Standby'}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gray-900 border border-gray-800 text-xs font-bold text-gray-300">
                        <Shield size={12} className="text-gray-500" />
                        {agent.activeRules}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-300 font-medium">
                          {agent.lastSync ? agent.lastSync.toLocaleTimeString() : 'Waiting...'}
                        </span>
                        <span className="text-[10px] text-gray-600 uppercase tracking-widest font-bold">
                          {agent.lastSync ? agent.lastSync.toLocaleDateString() : 'Initial Sync'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="px-2 py-1 bg-black border border-gray-800 rounded text-[10px] font-mono text-gray-500">
                        {agent.version}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Network Health Proxy */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <HealthCard title="Relay Latency" value="14ms" trend="Optimal" icon={Activity} color="text-terminal" />
        <HealthCard title="Manifest Uptime" value="99.9%" trend="Stable" icon={Shield} color="text-blue-400" />
        <HealthCard title="Sync Frequency" value="10s" trend="Real-time" icon={RefreshCw} color="text-yellow-500" />
      </div>
    </div>
  );
}

function HealthCard({ title, value, trend, icon: Icon, color }: any) {
  return (
    <div className="bg-[#0a0a0a] border border-gray-800 rounded-2xl p-5 flex items-center gap-4">
      <div className={`p-3 bg-gray-900 rounded-xl border border-gray-800 ${color}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{title}</p>
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-bold text-white font-mono">{value}</span>
          <span className={`text-[10px] font-bold ${color} opacity-80 uppercase tracking-tighter`}>{trend}</span>
        </div>
      </div>
    </div>
  );
}

export default function AgentStatusPage() {
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <header className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-terminal/10 p-2 rounded-lg border border-terminal/20">
            <Server className="text-terminal" size={24} />
          </div>
          <h1 className="text-4xl font-bold text-white font-serif tracking-tight">Agent Status</h1>
        </div>
        <p className="text-gray-400 max-w-2xl text-lg">
          Global infrastructure health. Monitoring real-time handshakes between the Mojo Guardian and your websites.
        </p>
      </header>

      <Suspense fallback={<Loader2 className="animate-spin text-terminal" size={48} />}>
        <StatusContent />
      </Suspense>
    </div>
  );
}
