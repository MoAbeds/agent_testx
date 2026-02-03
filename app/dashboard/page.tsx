'use client';

import TerminalFeed from '@/components/TerminalFeed';
import StatsCard from '@/components/StatsCard';
import DiffViewer from '@/components/DiffViewer';
import { Activity, ShieldCheck, LayoutDashboard, FileText, Bot } from 'lucide-react';
import { useAuth } from '@/lib/hooks';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import AddSiteForm from '@/components/AddSiteForm';
import ScanButton from '@/components/ScanButton';
import OptimizeButton from '@/components/OptimizeButton';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ sites: 0, pages: 0, rules: 0 });
  const [pages, setPages] = useState<any[]>([]);
  const [latestRule, setLatestRule] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !db) return;

    // Real-time Stats & Data
    const sitesQuery = query(collection(db, "sites"), where("userId", "==", user.uid));
    
    const unsubscribeSites = onSnapshot(sitesQuery, async (sitesSnap) => {
      const siteCount = sitesSnap.size;
      let pageCount = 0;
      let activeRules = 0;
      let allPages: any[] = [];

      for (const siteDoc of sitesSnap.docs) {
        const siteId = siteDoc.id;
        
        // Count Pages
        const pagesSnap = await getDocs(query(collection(db, "pages"), where("siteId", "==", siteId)));
        pageCount += pagesSnap.size;
        allPages = [...allPages, ...pagesSnap.docs.map(d => ({ id: d.id, ...d.data(), domain: siteDoc.data().domain }))];

        // Count Rules
        const rulesSnap = await getDocs(query(collection(db, "rules"), where("siteId", "==", siteId), where("isActive", "==", true)));
        activeRules += rulesSnap.size;
      }

      setStats({ sites: siteCount, pages: pageCount, rules: activeRules });
      setPages(allPages.sort((a, b) => b.lastCrawled?.seconds - a.lastCrawled?.seconds).slice(0, 5));
      setLoading(false);
    });

    return () => unsubscribeSites();
  }, [user]);

  // Fetch latest rule for Diff Viewer
  useEffect(() => {
    if (!user || !db) return;
    const rulesQuery = query(
      collection(db, "rules"), 
      where("isActive", "==", true),
      orderBy("createdAt", "desc"),
      limit(1)
    );
    return onSnapshot(rulesQuery, (snap) => {
      if (!snap.empty) setLatestRule(snap.docs[0].data());
    });
  }, [user]);

  let diffData = null;
  if (latestRule) {
    try {
      const payload = JSON.parse(latestRule.payload);
      diffData = {
        path: latestRule.targetPath,
        oldTitle: "Original Title",
        newTitle: payload.title,
        oldMeta: "Original Meta",
        newMeta: payload.metaDesc
      };
    } catch (e) {}
  }

  return (
    <div className="p-4 md:p-8">
        <header className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Overview</h1>
          <p className="text-sm md:text-base text-gray-400">Real-time SEO infrastructure monitoring</p>
          
          <div className="mt-6 flex items-center gap-2 text-xs text-terminal bg-terminal/5 border border-terminal/20 w-fit px-3 py-1.5 rounded-full">
            <div className="w-2 h-2 rounded-full bg-terminal animate-pulse shadow-[0_0_8px_#22c55e]" />
            Live Firebase Connection
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatsCard 
            title="Sites Connected"
            value={stats.sites.toString()}
            change="+1"
            trend="up"
            icon={Activity}
          />
          <StatsCard 
            title="Pages Scanned"
            value={stats.pages.toString()}
            change={stats.pages > 0 ? "+100%" : "0%"}
            trend="up"
            icon={FileText}
          />
          <StatsCard 
            title="Active Rules"
            value={stats.rules.toString()}
            change="+100%"
            trend="up"
            icon={ShieldCheck}
          />
        </div>

        <div className="mb-8">
            <AddSiteForm />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div>
              <h2 className="text-xl font-bold text-gray-100 mb-4 flex items-center gap-2 font-serif">
                <Bot className="text-gray-400" size={20} />
                Live Agent Feed
              </h2>
              <TerminalFeed />
            </div>
            
            <div>
               <h2 className="text-xl font-bold text-gray-100 mb-4 font-serif">Recent Optimizations</h2>
               {diffData ? (
                   <div className="space-y-2">
                     <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold ml-1">
                       Target Path: <span className="text-blue-400 font-mono">{diffData.path}</span>
                     </p>
                     <DiffViewer 
                          oldTitle={diffData.oldTitle} 
                          newTitle={diffData.newTitle}
                          oldMeta={diffData.oldMeta}
                          newMeta={diffData.newMeta}
                     />
                   </div>
               ) : (
                   <div className="p-6 border border-gray-800 rounded-xl bg-gray-900/50 text-gray-500 text-center">
                       No optimizations found yet.
                   </div>
               )}
            </div>

            <div>
                <h2 className="text-xl font-bold text-gray-100 mb-4 font-serif">Discovered Pages</h2>
                <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-sm text-gray-400">
                        <thead className="bg-gray-900/50 text-gray-200 font-medium">
                            <tr>
                                <th className="p-4">Path</th>
                                <th className="p-4">Title</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {pages.map(page => (
                                <tr key={page.id} className="hover:bg-white/5 transition-colors">
                                    <td className="p-4 font-mono text-xs text-blue-400">{page.path}</td>
                                    <td className="p-4 max-w-xs truncate" title={page.title || ''}>{page.title || '-'}</td>
                                    <td className="p-4">
                                        <span className="px-2 py-1 rounded-full bg-green-900/20 text-green-400 text-xs border border-green-900/50">
                                            {page.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <OptimizeButton pageId={page.id} />
                                    </td>
                                </tr>
                            ))}
                            {pages.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-gray-500">
                                        No pages found. Click "Scan" above.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-100 mb-4 flex items-center gap-2 font-serif">
                <Activity className="text-gray-400" size={20} />
                System Health
              </h3>
              <div className="space-y-6">
                <HealthBar label="Firebase Sync" value={100} color="bg-terminal" />
                <HealthBar label="Agent Latency" value={12} color="bg-blue-500" />
              </div>
            </div>
          </div>
        </div>
    </div>
  );
}

function HealthBar({ label, value, color }: { label: string, value: number, color: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-2 font-medium">
        <span className="text-gray-400">{label}</span>
        <span className="text-gray-300">{value}%</span>
      </div>
      <div className="h-1.5 w-full bg-gray-900 rounded-full overflow-hidden">
        <div 
          className={`h-full ${color} rounded-full transition-all duration-500 shadow-[0_0_10px_currentColor]`} 
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
