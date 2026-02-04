'use client';

import GuardianIssues from '@/components/GuardianIssues';
import AuditFeed from '@/components/AuditFeed';
import ResearchButton from '@/components/ResearchButton';
import AddKeywordButton from '@/components/AddKeywordButton';
import SiteManager from '@/components/SiteManager';
import ScanButton from '@/components/ScanButton';
import CompetitorWatchlist from '@/components/CompetitorWatchlist';
import IndustryDeepDive from '@/components/IndustryDeepDive';
import { Shield, Target, Search, Sparkles, Loader2, Zap, Globe } from 'lucide-react';
import { useAuth } from '@/lib/hooks';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, limit } from 'firebase/firestore';
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

  // 1. Fetch only sites that BELONG to this specific user ID
  useEffect(() => {
    if (!user?.uid || !db) return;

    // IMMEDIATE HARD WIPE on user change to prevent data ghosting
    setAllSites([]);
    setSite(null);
    setIssues([]);
    setAuditEvents([]);

    const sitesQuery = query(
      collection(db, "sites"), 
      where("userId", "==", user.uid)
    );
    
    const unsubscribeSites = onSnapshot(sitesQuery, (snap) => {
      const sites = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // Secondary filter in JS to be 1000% sure
      const verifiedSites = sites.filter(s => s.userId === user.uid);
      setAllSites(verifiedSites);

      const current = selectedSiteId 
        ? verifiedSites.find(s => s.id === selectedSiteId) 
        : verifiedSites[0];
      
      setSite(current || null);
      setLoading(false);
    }, (error) => {
      setLoading(false);
    });

    return () => unsubscribeSites();
  }, [user?.uid, selectedSiteId]);

  // 2. Fetch events ONLY for the verified site belonging to the current user
  useEffect(() => {
    // SECURITY WIPE
    setIssues([]);
    setAuditEvents([]);

    // Check if site exists AND belongs to the current logged-in user
    if (!site?.id || !user?.uid || site.userId !== user.uid) {
      return;
    }

    const eventsQuery = query(
      collection(db, "events"), 
      where("siteId", "==", site.id),
      limit(50)
    );

    const unsubscribeEvents = onSnapshot(eventsQuery, (snap) => {
      const allEvents = snap.docs
        .map(d => ({ id: d.id, ...d.data() } as any))
        .filter(e => e.siteId === site.id); // Re-verify siteId filter
      
      const filtered = allEvents.filter((e: any) => 
        ["404_DETECTED", "SEO_GAP", "LINK_OPPORTUNITY", "CONTENT_GAP", "BACKLINK_OPPORTUNITY"].includes(e.type)
      );

      const sorted = allEvents.sort((a: any, b: any) => 
        (b.occurredAt?.seconds || 0) - (a.occurredAt?.seconds || 0)
      );

      setIssues(filtered);
      setAuditEvents(sorted.slice(0, 20));
    }, (error) => {
      setIssues([]);
      setAuditEvents([]);
    });

    return () => unsubscribeEvents();
  }, [site?.id, user?.uid]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-terminal" size={48} />
      </div>
    );
  }

  if (!site && !loading) {
    return (
      <div className="p-8 text-center min-h-screen flex flex-col items-center justify-center">
        <Globe className="mx-auto text-gray-600 mb-4" size={48} />
        <h1 className="text-2xl font-bold text-white mb-4">Autonomous SEO Guardian</h1>
        <p className="text-gray-400 mb-8 max-w-sm">No site found for this account. Go to the Overview to connect your first domain.</p>
        <button onClick={() => window.location.href = '/dashboard'} className="px-6 py-3 bg-terminal text-black font-bold rounded-xl hover:bg-green-400 transition-all">
          Connect First Site
        </button>
      </div>
    );
  }

  // --- UI Extraction ---
  let keywords = { industry: 'N/A', topic: 'N/A', detailed: [], visibility: '0', authority: '0' };
  if (site?.targetKeywords) { try { keywords = JSON.parse(site.targetKeywords); } catch (e) {} }

  let audit = { scores: { performance: 0, accessibility: 0, bestPractices: 0, seo: 0 } };
  if (site?.lastAudit) { try { audit = JSON.parse(site.lastAudit); } catch (e) {} }

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
            Monitoring <span className="text-blue-400 font-mono">{site?.domain}</span> for threats and opportunities.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <SiteManager sites={allSites} currentSiteId={site?.id} />
              <div className="w-32">
                <ScanButton domain={site?.domain} apiKey={site?.apiKey} />
              </div>
            </div>
            <div className="flex gap-3">
              <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl px-3 py-2 md:px-4 md:py-3 flex items-center gap-3">
                  <Zap className={Number(audit.scores.performance) > 80 ? "text-terminal" : "text-yellow-500"} size={18} />
                  <div>
                      <span className="text-[8px] md:text-[10px] uppercase tracking-widest text-gray-500 font-bold block">Performance</span>
                      <span className="text-sm md:text-lg font-bold text-white font-mono">{Math.round(audit.scores.performance)}%</span>
                  </div>
              </div>
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

      <div className="lg:col-span-2 space-y-10">
        <IndustryDeepDive siteId={site?.id} />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2">
            <GuardianIssues initialIssues={issues} siteId={site?.id} />
          </div>
          <div>
            <AuditFeed initialEvents={auditEvents} siteId={site?.id} />
          </div>
        </div>
        <CompetitorWatchlist siteId={site?.id} />
      </div>
    </div>
  );
}

export default function GuardianPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-terminal" size={48} /></div>}>
      <GuardianContent />
    </Suspense>
  );
}
