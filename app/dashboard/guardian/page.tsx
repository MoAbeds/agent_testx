'use client';

import GuardianIssues from '@/components/GuardianIssues';
import AuditFeed from '@/components/AuditFeed';
import ResearchButton from '@/components/ResearchButton';
import AddKeywordButton from '@/components/AddKeywordButton';
import SiteManager from '@/components/SiteManager';
import ScanButton from '@/components/ScanButton';
import { Shield, Target, Search, Sparkles, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/hooks';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
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

    // Use a simple query to avoid composite index requirements
    const issuesQuery = query(
      collection(db, "events"), 
      where("siteId", "==", site.id)
    );

    const unsubscribeIssues = onSnapshot(issuesQuery, (snap) => {
      const allEvents = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // Filter for Issues
      const filteredIssues = allEvents.filter((e: any) => 
        ["404_DETECTED", "SEO_GAP"].includes(e.type)
      );

      // Sort by occurredAt (Manual in-memory sort to bypass index requirement)
      const sortedIssues = filteredIssues.sort((a: any, b: any) => {
        const tA = a.occurredAt?.seconds || 0;
        const tB = b.occurredAt?.seconds || 0;
        return tB - tA;
      });

      setIssues(sortedIssues);
      
      // Update Audit Trail (Top 20 any events)
      const sortedAudit = allEvents.sort((a: any, b: any) => {
        const tA = a.occurredAt?.seconds || 0;
        const tB = b.occurredAt?.seconds || 0;
        return tB - tA;
      }).slice(0, 20);
      
      setAuditEvents(sortedAudit);
      setLoading(false);
    }, (error) => {
      console.error("Issues fetch error:", error);
      setLoading(false);
    });

    return () => unsubscribeIssues();
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
                <ScanButton domain={site.domain} apiKey={site.apiKey} />
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
              <div className="flex items-center gap-3">
                <AddKeywordButton siteId={site.id} />
                <ResearchButton siteId={site.id} initialIndustry={keywords.industry !== 'N/A' ? keywords.industry : ''} />
              </div>
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
              <table className="w-full text-left text-sm min-w-[800px]">
                <thead className="bg-gray-900/50 text-gray-400 uppercase text-[10px] font-bold tracking-widest">
                  <tr>
                    <th className="p-4 whitespace-nowrap">High-Volume Keyword</th>
                    <th className="p-4 whitespace-nowrap">Volume</th>
                    <th className="p-4 whitespace-nowrap">Difficulty</th>
                    <th className="p-4 whitespace-nowrap">Est. CPC</th>
                    <th className="p-4 whitespace-nowrap">Relevance</th>
                    <th className="p-4 whitespace-nowrap hidden md:table-cell">Competition</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50">
                  {keywords.detailed && keywords.detailed.length > 0 ? (
                    keywords.detailed.map((kw: any, i: number) => (
                      <tr key={i} className="text-gray-300 hover:bg-white/5 transition-colors">
                        <td className="p-4 font-medium whitespace-nowrap">{kw.keyword}</td>
                        <td className="p-4 font-mono text-terminal">{Number(kw.results).toLocaleString()}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="w-12 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${Number(kw.difficulty) > 70 ? 'bg-red-500' : Number(kw.difficulty) > 40 ? 'bg-yellow-500' : 'bg-green-500'}`} 
                                style={{ width: `${kw.difficulty || 0}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-mono text-gray-400">{kw.difficulty || 0}</span>
                          </div>
                        </td>
                        <td className="p-4 font-mono text-gray-400">${Number(kw.cpc || 0).toFixed(2)}</td>
                        <td className="p-4">
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${kw.relevance === 'Market Match' ? 'text-green-500 bg-green-500/10' : 'text-blue-400 bg-blue-400/10'}`}>
                            {kw.relevance}
                          </span>
                        </td>
                        <td className="p-4 text-gray-500 hidden md:table-cell capitalize">{kw.competition?.toLowerCase().replace('_', ' ')}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-gray-600 italic">
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
