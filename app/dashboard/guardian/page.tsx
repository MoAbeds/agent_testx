'use client';

import GuardianIssues from '@/components/GuardianIssues';
import AuditFeed from '@/components/AuditFeed';
import ResearchButton from '@/components/ResearchButton';
import SiteManager from '@/components/SiteManager';
import ScanButton from '@/components/ScanButton';
import { Shield, Target, Search, Sparkles, Loader2 } from 'lucide-react';
import { useAuth, db } from '@/lib/hooks';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function GuardianContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [allSites, setAllSites] = useState<any[]>([]);
  const [site, setSite] = useState<any>(null);
  const [issues, setIssues] = useState<any[]>([]);
  const [auditEvents, setAuditEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const selectedSiteId = searchParams.get('siteId');

  // 1. Listen to all sites for this user
  useEffect(() => {
    if (!user || !db) return;

    const sitesQuery = query(collection(db, "sites"), where("userId", "==", user.uid));
    const unsubscribeSites = onSnapshot(sitesQuery, (snap) => {
      const sites = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setAllSites(sites);

      const current = selectedSiteId 
        ? sites.find(s => s.id === selectedSiteId) 
        : sites[0];
      
      setSite(current || null);
      if (!current) setLoading(false);
    }, (error) => {
      console.error("Sites fetch error:", error);
      setLoading(false);
    });

    return () => unsubscribeSites();
  }, [user, selectedSiteId]);

  // 2. Listen to issues (404s, Gaps) for the selected site
  useEffect(() => {
    if (!site?.id || !db) return;

    const issuesQuery = query(
      collection(db, "events"), 
      where("siteId", "==", site.id),
      where("type", "in", ["404_DETECTED", "SEO_GAP"]),
      orderBy("occurredAt", "desc")
    );

    const unsubscribeIssues = onSnapshot(issuesQuery, (snap) => {
      setIssues(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, (error) => {
      console.error("Issues fetch error:", error);
      setLoading(false);
    });

    return () => unsubscribeIssues();
  }, [site?.id]);

  // 3. Listen to all events for the Audit Trail
  useEffect(() => {
    if (!site?.id || !db) return;

    const auditQuery = query(
      collection(db, "events"), 
      where("siteId", "==", site.id),
      orderBy("occurredAt", "desc"),
      limit(20)
    );

    const unsubscribeAudit = onSnapshot(auditQuery, (snap) => {
      setAuditEvents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (error) => {
      console.error("Audit fetch error:", error);
    });

    return () => unsubscribeAudit();
  }, [site?.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-terminal" size={48} />
      </div>
    );
  }

  if (!site) {
    return (
      <div className="p-8 text-center">
        <Globe className="mx-auto text-gray-600 mb-4" size={48} />
        <h1 className="text-2xl font-bold text-white mb-4">No Site Found</h1>
        <p className="text-gray-400">Please connect a site in the Overview first.</p>
      </div>
    );
  }

  // Extract keywords if present
  let keywords = { industry: 'N/A', topic: 'N/A', detailed: [], visibility: '0', authority: '0' };
  if (site.targetKeywords) {
    try {
      keywords = JSON.parse(site.targetKeywords);
    } catch (e) {}
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <header className="mb-10 flex flex-col xl:flex-row xl:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-terminal/10 p-2 rounded-lg border border-terminal/20">
              <Shield className="text-terminal" size={24} />
            </div>
            <h1 className="text-2xl md:text-4xl font-bold text-white font-serif tracking-tight">Mojo Guardian</h1>
          </div>
          <p className="text-sm md:text-base text-gray-400 max-w-xl">
            Autonomous SEO infrastructure. Monitoring <span className="text-blue-400 font-mono">{site.domain}</span> for threats and opportunities.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <SiteManager sites={allSites} currentSiteId={site.id} />
              <div className="w-32">
                <ScanButton domain={site.domain} />
              </div>
            </div>
            
            <div className="flex gap-3">
              <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl px-3 py-2 md:px-4 md:py-3 flex items-center gap-3">
                  <Target className="text-gray-500" size={18} />
                  <div>
                      <span className="text-[8px] md:text-[10px] uppercase tracking-widest text-gray-500 font-bold block">Authority</span>
                      <span className="text-sm md:text-lg font-bold text-white font-mono">{keywords.authority}/100</span>
                  </div>
              </div>
              <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl px-3 py-2 md:px-4 md:py-3 flex items-center gap-3">
                  <Search className="text-gray-500" size={18} />
                  <div>
                      <span className="text-[8px] md:text-[10px] uppercase tracking-widest text-gray-500 font-bold block">Visibility</span>
                      <span className="text-sm md:text-lg font-bold text-white font-mono">{keywords.visibility}</span>
                  </div>
              </div>
            </div>
        </div>
      </header>

      {/* Keywords & AI Context Section */}
      <section className="mb-12">
        <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Sparkles size={120} className="text-terminal" />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-lg font-bold text-gray-100 flex items-center gap-2">
                <Sparkles className="text-terminal" size={18} />
                Market Intelligence
              </h2>
              <ResearchButton siteId={site.id} initialIndustry={keywords.industry !== 'N/A' ? keywords.industry : ''} />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
              <div>
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 block">Industry</span>
                <span className="text-xl font-bold text-white capitalize">{keywords.industry}</span>
              </div>
              <div>
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 block">Niche/Topic</span>
                <span className="text-xl font-bold text-terminal capitalize">{keywords.topic}</span>
              </div>
            </div>

            <div className="bg-black/40 border border-gray-800 rounded-xl overflow-x-auto scrollbar-thin scrollbar-thumb-gray-800">
              <table className="w-full text-left text-sm min-w-[600px]">
                <thead className="bg-gray-900/50 text-gray-400 uppercase text-[10px] font-bold tracking-widest">
                  <tr>
                    <th className="p-4 whitespace-nowrap">High-Volume Keyword</th>
                    <th className="p-4 whitespace-nowrap">Relevance</th>
                    <th className="p-4 whitespace-nowrap hidden md:table-cell">Competition</th>
                    <th className="p-4 text-right whitespace-nowrap">Est. Monthly Volume</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50">
                  {keywords.detailed && keywords.detailed.length > 0 ? (
                    keywords.detailed.map((kw: any, i: number) => (
                      <tr key={i} className="text-gray-300 hover:bg-white/5 transition-colors">
                        <td className="p-4 font-medium whitespace-nowrap">{kw.keyword}</td>
                        <td className="p-4">
                          <span className="text-green-500 bg-green-500/10 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                            {kw.relevance}
                          </span>
                        </td>
                        <td className="p-4 text-gray-500 hidden md:table-cell">{kw.competition}</td>
                        <td className="p-4 text-right font-mono text-terminal whitespace-nowrap">
                          {Number(kw.results).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-gray-600 italic">
                        No keyword data discovered. Click "Research Site" above.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2">
          <GuardianIssues initialIssues={issues} siteId={site.id} />
        </div>

        <div>
          <AuditFeed initialEvents={auditEvents} siteId={site.id} />
        </div>
      </div>
    </div>
  );
}

export default function GuardianPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-terminal" size={48} />
      </div>
    }>
      <GuardianContent />
    </Suspense>
  );
}

function Globe(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  )
}
