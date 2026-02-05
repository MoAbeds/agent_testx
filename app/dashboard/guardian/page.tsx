'use client';

import GuardianIssues from '@/components/GuardianIssues';
import AuditFeed from '@/components/AuditFeed';
import ResearchButton from '@/components/ResearchButton';
import AddKeywordButton from '@/components/AddKeywordButton';
import SiteManager from '@/components/SiteManager';
import ScanButton from '@/components/ScanButton';
import CompetitorWatchlist from '@/components/CompetitorWatchlist';
import IndustryDeepDive from '@/components/IndustryDeepDive';
import BacklinkSection from '@/components/BacklinkSection';
import { Shield, Target, Search, Sparkles, Loader2, Zap, Globe, BrainCircuit } from 'lucide-react';
import { useAuth } from '@/lib/hooks';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, limit, getDocs } from 'firebase/firestore';
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
  const [brainstorming, setBrainstorming] = useState(false);

  const selectedSiteId = searchParams.get('siteId');

  // 1. HARD WIPE on every account change
  useEffect(() => {
    setAllSites([]);
    setSite(null);
    setIssues([]);
    setAuditEvents([]);
    if (!user) setLoading(false);
  }, [user?.uid]);

  // 2. Fetch only sites that BELONG to this user
  useEffect(() => {
    if (!user?.uid || !db) return;

    const sitesQuery = query(
      collection(db, "sites"), 
      where("userId", "==", user.uid)
    );
    
    const unsubscribeSites = onSnapshot(sitesQuery, (snap) => {
      const sites = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setAllSites(sites);

      const current = selectedSiteId 
        ? sites.find(s => s.id === selectedSiteId) 
        : sites[0];
      
      setSite(current || null);
      setLoading(false);
    }, (error) => {
      console.error("Sites fetch error:", error);
      setLoading(false);
    });

    return () => unsubscribeSites();
  }, [user?.uid, selectedSiteId]);

  // 3. Fetch events ONLY for the verified site belonging to the current user
  useEffect(() => {
    // SECURITY WIPE: Immediate wipe if site ID or User ID changes
    setIssues([]);
    setAuditEvents([]);

    if (!site?.id || !user?.uid) return;

    // Direct filter on siteId ensures we don't grab global data
    const eventsQuery = query(
      collection(db, "events"), 
      where("siteId", "==", site.id),
      limit(100)
    );

    const unsubscribeEvents = onSnapshot(eventsQuery, (snap) => {
      // 🔒 HARD SECONDARY CHECK in JS: If Firestore leaks, we filter here.
      const allEvents = snap.docs
        .map(d => ({ id: d.id, ...d.data() } as any))
        .filter(e => e.siteId === site.id);
      
      const filtered = allEvents.filter((e: any) => 
        ["404_DETECTED", "SEO_GAP", "LINK_OPPORTUNITY", "CONTENT_GAP", "BACKLINK_OPPORTUNITY"].includes(e.type)
      );

      const sorted = allEvents.sort((a: any, b: any) => 
        (b.occurredAt?.seconds || 0) - (a.occurredAt?.seconds || 0)
      );

      setIssues(filtered);
      setAuditEvents(sorted.slice(0, 20));
    });

    return () => unsubscribeEvents();
  }, [site?.id, user?.uid]);

  const runBrain = async () => {
    if (!site?.id) return;
    setBrainstorming(true);
    try {
      const res = await fetch('/api/agent/brain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId: site.id })
      });
      const data = await res.json();
      if (data.success) {
        // Removed browser alert for better UX
      }
    } catch (e) {
      // Quiet fail
    } finally {
      setBrainstorming(false);
    }
  };

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
        <h1 className="text-2xl font-bold text-white mb-4">Mojo Guardian</h1>
        <p className="text-gray-400 mb-8 max-w-sm">No site found for this account. Add your first site in the Overview.</p>
        <button onClick={() => window.location.href = '/dashboard'} className="px-6 py-3 bg-terminal text-black font-bold rounded-xl hover:bg-green-400 transition-all">
          Add First Site
        </button>
      </div>
    );
  }

  // UI Extraction
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
            Autonomous SEO monitoring for <span className="text-blue-400 font-mono">{site?.domain}</span>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
            <button 
              onClick={runBrain}
              disabled={brainstorming}
              className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_0_15px_rgba(147,51,234,0.3)] disabled:opacity-50"
            >
              {brainstorming ? <Loader2 className="animate-spin" size={16} /> : <BrainCircuit size={16} />}
              {brainstorming ? 'Thinking...' : 'Activate Mojo Brain'}
            </button>
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
        <BacklinkSection siteId={site?.id} />
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
