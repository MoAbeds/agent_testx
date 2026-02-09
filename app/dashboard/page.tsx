'use client';

import TerminalFeed from '@/components/TerminalFeed';
import StatsCard from '@/components/StatsCard';
import DiffViewer from '@/components/DiffViewer';
import { Activity, ShieldCheck, LayoutDashboard, FileText, Bot, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/hooks';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import AddSiteForm from '@/components/AddSiteForm';
import ScanButton from '@/components/ScanButton';
import OptimizeButton from '@/components/OptimizeButton';
import OnboardingChecklist from '@/components/OnboardingChecklist';
import ReasoningLedger from '@/components/ReasoningLedger';
import GuardianPulse from '@/components/GuardianPulse';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ sites: 0, pages: 0, rules: 0 });
  const [allSitesData, setAllSitesData] = useState<any[]>([]);
  const [pages, setPages] = useState<any[]>([]);
  const [latestRule, setLatestRule] = useState<any>(null);
  const [allActiveRules, setAllActiveRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userSiteIds, setUserSiteIds] = useState<string[]>([]);

  // 1. HARD WIPE and Site ID Discovery
  useEffect(() => {
    if (!user || !db) return;
    
    // Wipe local state immediately on account switch
    setStats({ sites: 0, pages: 0, rules: 0 });
    setPages([]);
    setLatestRule(null);
    setUserSiteIds([]);

    const sitesQuery = query(collection(db, "sites"), where("userId", "==", user.uid));
    
    const unsubscribeSites = onSnapshot(sitesQuery, async (sitesSnap) => {
      const siteCount = sitesSnap.size;
      const ids = sitesSnap.docs.map(d => d.id);
      setUserSiteIds(ids);

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
      setAllSitesData(sitesSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setPages(allPages.sort((a, b) => (b.lastCrawled?.seconds || 0) - (a.lastCrawled?.seconds || 0)).slice(0, 5));
      setLoading(false);
    });

    return () => unsubscribeSites();
  }, [user?.uid]);

  // 2. Fetch latest rule for Diff Viewer (Optimized & Isolated)
  useEffect(() => {
    if (!user || userSiteIds.length === 0) {
      setLatestRule(null);
      return;
    }

    // SECURITY: Use 'in' operator with user's specific site IDs to prevent leaks
    // Firestore 'in' supports up to 30 values.
    const rulesQuery = query(
      collection(db, "rules"), 
      where("siteId", "in", userSiteIds.slice(0, 30)),
      where("isActive", "==", true),
      limit(20)
    );

    return onSnapshot(rulesQuery, (snap) => {
      if (!snap.empty) {
        // Sort in memory to find the absolute latest one across all user's sites
        const sorted = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .sort((a: any, b: any) => 
            (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
          );
        setLatestRule(sorted[0]);
        setAllActiveRules(sorted.slice(0, 5));
      } else {
        setLatestRule(null);
        setAllActiveRules([]);
      }
    });
  }, [userSiteIds, user?.uid]);

  let diffData = null;
  if (latestRule) {
    try {
      const payload = JSON.parse(latestRule.payload);
      diffData = {
        path: latestRule.targetPath,
        oldTitle: "Original Title",
        newTitle: payload.title || payload.titleTag || "Optimized Title",
        oldMeta: "Original Meta",
        newMeta: payload.metaDesc || payload.metaDescription || "Optimized Meta Description"
      };
    } catch (e) {}
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 font-serif">Overview</h1>
          <p className="text-sm md:text-base text-gray-400">Real-time SEO infrastructure monitoring</p>
        </header>

        <div className="mb-10">
          <OnboardingChecklist user={user} sites={allSitesData} />
        </div>

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
          <div className="lg:col-span-2 space-y-10">
            <div>
              <h2 className="text-xl font-bold text-gray-100 mb-4 flex items-center gap-2 font-serif">
                <Bot className="text-gray-400" size={20} />
                Live Agent Feed
              </h2>
              <TerminalFeed />
            </div>
            
            <div>
               <h2 className="text-xl font-bold text-gray-100 mb-4 font-serif">Recent Optimizations</h2>
               {latestRule && diffData ? (
                   <div className="space-y-4">
                     <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black ml-1">
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
                   <div className="p-12 border border-dashed border-gray-800 rounded-2xl bg-gray-900/10 text-gray-500 text-center flex flex-col items-center">
                       <ShieldCheck className="text-gray-800 mb-3" size={32} />
                       <p className="italic">No optimizations processed for your domains yet.</p>
                   </div>
               )}
            </div>

            <ReasoningLedger rules={allActiveRules} />

            <div>
                <h2 className="text-xl font-bold text-gray-100 mb-4 font-serif">Discovered Pages</h2>
                <div className="bg-[#0a0a0a] border border-gray-800 rounded-2xl overflow-hidden shadow-sm">
                    <table className="w-full text-left text-sm text-gray-400">
                        <thead className="bg-gray-900/50 text-gray-200 font-bold uppercase tracking-wider text-[10px]">
                            <tr>
                                <th className="p-4">Path</th>
                                <th className="p-4">Domain</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {pages.map(page => (
                                <tr key={page.id} className="hover:bg-white/[0.02] transition-colors">
                                    <td className="p-4 font-mono text-xs text-blue-400">{page.path}</td>
                                    <td className="p-4 text-xs text-gray-500 font-mono truncate">{page.domain}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                          page.status === 200 || page.status === 'LIVE'
                                            ? 'bg-green-900/10 text-green-400 border-green-900/30' 
                                            : 'bg-red-900/10 text-red-400 border-red-900/30'
                                        }`}>
                                            {page.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        {page.lastOptimized ? (
                                          <span className="text-[10px] font-bold uppercase tracking-widest text-terminal flex items-center justify-end gap-1">
                                            <ShieldCheck size={14} />
                                            Optimized
                                          </span>
                                        ) : (
                                          <OptimizeButton pageId={page.id} />
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {pages.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={4} className="p-12 text-center text-gray-500 italic">
                                        No pages indexed yet. Connect a site to begin.
                                    </td>
                                </tr>
                            )}
                            {loading && (
                                <tr>
                                  <td colSpan={4} className="p-12 text-center">
                                    <Loader2 className="animate-spin text-terminal mx-auto" size={24} />
                                  </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
          </div>

          <div className="space-y-6">
            <GuardianPulse />
            <div className="bg-[#0a0a0a] border border-gray-800 rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-100 mb-6 flex items-center gap-2 font-serif">
                <Activity className="text-gray-400" size={20} />
                System Health
              </h3>
              <div className="space-y-8">
                <HealthBar label="Database Sync" value={100} color="bg-terminal" />
                <HealthBar label="Agent Handshake" value={100} color="bg-blue-500" />
                <HealthBar label="Security Isolation" value={100} color="bg-purple-500" />
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
      <div className="flex justify-between text-[10px] uppercase tracking-widest font-black mb-2">
        <span className="text-gray-500">{label}</span>
        <span className="text-gray-300">{value}%</span>
      </div>
      <div className="h-1.5 w-full bg-gray-900 rounded-full overflow-hidden">
        <div 
          className={`h-full ${color} rounded-full transition-all duration-700 shadow-[0_0_10px_currentColor]`} 
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
