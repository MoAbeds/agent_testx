'use client';

import { useState, useEffect } from 'react';
import { ShieldAlert, CheckCircle, ArrowRight, Wand2, RefreshCw, Sparkles, Link, Zap, BookOpen, Anchor, PenTool, FileText } from 'lucide-react';
import { useAuth } from '@/lib/hooks';
import Toast from './Toast';

interface Issue {
  id: string;
  type: string;
  path: string;
  details: string | null;
}

export default function GuardianIssues({ initialIssues, siteId }: { initialIssues: Issue[], siteId: string }) {
  const { user } = useAuth();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [auditing, setAuditing] = useState(false);
  const [linking, setLinking] = useState(false);
  const [scouting, setScouting] = useState(false);
  const [gapping, setGapping] = useState(false);
  const [generating, setGenerating] = useState<string | null>(null);
  const [reporting, setReporting] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  function issuesFilter(items: any[]) {
     return items.filter(i => ["404_DETECTED", "SEO_GAP", "LINK_OPPORTUNITY", "CONTENT_GAP", "BACKLINK_OPPORTUNITY"].includes(i.type));
  }

  useEffect(() => {
    setIssues(issuesFilter(initialIssues));
  }, [initialIssues]);

  // STRICT PLAN CHECK
  const isFreePlan = !user?.plan || user.plan === 'FREE';

  const runSpeedAudit = async () => {
    if (isFreePlan) return setNotification({ message: "PageSpeed audits are a Pro feature.", type: "info" });
    setAuditing(true);
    try {
      const res = await fetch('/api/audit/speed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId, url: window.location.origin })
      });
      const data = await res.json();
      if (data.success) setNotification({ message: "Speed audit complete!", type: 'success' });
    } catch (e) { setNotification({ message: "Audit failed.", type: 'error' }); } finally { setAuditing(false); }
  };

  const findLinkOpportunities = async () => {
    if (isFreePlan) return setNotification({ message: "Internal Linking Intelligence is a Pro feature.", type: "info" });
    setLinking(true);
    try {
      const res = await fetch('/api/seo/internal-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId })
      });
      const data = await res.json();
      if (data.success) setNotification({ message: `Found ${data.opportunitiesFound} link opportunities!`, type: 'success' });
    } catch (e) { setNotification({ message: "Linking scan failed.", type: 'error' }); } finally { setLinking(false); }
  };

  const scoutBacklinks = async () => {
    if (isFreePlan) return setNotification({ message: "Backlink Scouting is a Pro feature.", type: "info" });
    setScouting(true);
    try {
      const res = await fetch('/api/seo/backlink-scout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId })
      });
      const data = await res.json();
      if (data.success) setNotification({ message: `Scouted ${data.opportunities} backlink prospects!`, type: 'success' });
    } catch (e) { setNotification({ message: "Scout failed.", type: 'error' }); } finally { setScouting(false); }
  };

  const scanContentGaps = async () => {
    if (isFreePlan) return setNotification({ message: "Content Gap Analysis is a Pro feature.", type: "info" });
    setGapping(true);
    try {
      const res = await fetch('/api/seo/content-gaps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId })
      });
      const data = await res.json();
      if (data.success) setNotification({ message: `Identified ${data.gapsFound} high-impact content gaps!`, type: 'success' });
    } catch (e) { setNotification({ message: "Gap analysis failed.", type: 'error' }); } finally { setGapping(false); }
  };

  const generatePage = async (issue: any) => {
    if (isFreePlan) return setNotification({ message: "Content Generation is a Pro feature.", type: "info" });
    const details = JSON.parse(issue.details || '{}');
    setGenerating(issue.id);
    try {
      const res = await fetch('/api/seo/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          siteId, 
          topic: details.topic, 
          targetKeyword: details.targetKeyword,
          suggestedPath: issue.path
        })
      });
      const data = await res.json();
      if (data.success) {
        setNotification({ message: `Page "${issue.path}" created and deployed!`, type: 'success' });
        setIssues(prev => prev.filter(i => i.id !== issue.id));
      }
    } catch (e) { setNotification({ message: "Generation failed.", type: 'error' }); } finally { setGenerating(null); }
  };

  const generateReport = async () => {
    if (isFreePlan) return setNotification({ message: "Whitelabel Reports are an Agency feature.", type: "info" });
    setReporting(true);
    setTimeout(() => {
      window.print();
      setNotification({ message: "Report ready!", type: 'success' });
      setReporting(false);
    }, 1000);
  };

  const fixAll404s = async () => {
    if (isFreePlan) return setNotification({ message: "Fixing is a Pro feature.", type: "info" });
    setLoading(true);
    try {
      const res = await fetch('/api/agent/fix-404', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ siteId }) });
      const data = await res.json();
      if (data.success) {
        setNotification({ message: `Success! Auto-fixed broken links.`, type: 'success' });
        setIssues(prev => prev.filter(i => i.type !== '404_DETECTED'));
      }
    } catch (e) { setNotification({ message: "Network error.", type: 'error' }); } finally { setLoading(false); }
  };

  const fixAllGaps = async () => {
    if (isFreePlan) return setNotification({ message: "AI SEO Gaps require a Pro plan.", type: "info" });
    setOptimizing(true);
    try {
      const res = await fetch('/api/agent/fix-gaps', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ siteId }) });
      const data = await res.json();
      if (data.success) {
        setNotification({ message: `Successfully optimized pages!`, type: 'success' });
        setIssues(prev => prev.filter(i => i.type !== 'SEO_GAP'));
      }
    } catch (e) { setNotification({ message: "Bulk optimization failed.", type: 'error' }); } finally { setOptimizing(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-gray-100 flex items-center gap-2 font-serif">
          <ShieldAlert className="text-red-500" size={20} />
          Autonomous SEO Guardian
        </h2>
        <div className="flex flex-wrap gap-2">
          <button onClick={runSpeedAudit} disabled={auditing} className="flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-white text-[10px] uppercase font-bold px-3 py-2 rounded-lg transition-all">
            {auditing ? <RefreshCw className="animate-spin" size={14} /> : <Zap size={14} className="text-yellow-500" />}
            Speed
          </button>
          <button onClick={findLinkOpportunities} disabled={linking} className="flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-white text-[10px] uppercase font-bold px-3 py-2 rounded-lg transition-all">
            {linking ? <RefreshCw className="animate-spin" size={14} /> : <Link size={14} className="text-blue-500" />}
            Links
          </button>
          <button onClick={scoutBacklinks} disabled={scouting} className="flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-white text-[10px] uppercase font-bold px-3 py-2 rounded-lg transition-all">
            {scouting ? <RefreshCw className="animate-spin" size={14} /> : <Anchor size={14} className="text-purple-500" />}
            Scout
          </button>
          <button onClick={scanContentGaps} disabled={gapping} className="flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-white text-[10px] uppercase font-bold px-3 py-2 rounded-lg transition-all">
            {gapping ? <RefreshCw className="animate-spin" size={14} /> : <BookOpen size={14} className="text-orange-500" />}
            Gaps
          </button>
          <button onClick={generateReport} disabled={reporting} className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] uppercase font-bold px-3 py-2 rounded-lg transition-all">
            {reporting ? <RefreshCw className="animate-spin" size={14} /> : <FileText size={14} />}
            Report
          </button>
          <button onClick={fixAll404s} disabled={loading || !issues.some(i => i.type === '404_DETECTED')} className="flex items-center justify-center gap-2 bg-terminal hover:bg-green-400 text-black text-[10px] uppercase font-bold px-3 py-2 rounded-lg transition-all">
            {loading ? <RefreshCw className="animate-spin" size={14} /> : <Wand2 size={14} />}
            Fix 404s
          </button>
          <button onClick={fixAllGaps} disabled={optimizing || !issues.some(i => i.type === 'SEO_GAP')} className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-[10px] uppercase font-bold px-3 py-2 rounded-lg transition-all">
            {optimizing ? <RefreshCw className="animate-spin" size={14} /> : <Sparkles size={14} />}
            Fix Gaps
          </button>
        </div>
      </div>

      <div className="grid gap-4">
        {issues.length === 0 ? (
          <div className="p-12 border border-dashed border-gray-800 rounded-xl text-center bg-gray-900/20">
            <CheckCircle className="mx-auto text-terminal mb-4" size={40} />
            <p className="text-gray-400 font-medium">No urgent threats detected.</p>
          </div>
        ) : (
          issues.map((issue) => (
            <div key={issue.id} className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-4 flex items-center justify-between group hover:border-gray-700 transition-all shadow-sm">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${
                  issue.type === '404_DETECTED' ? 'bg-red-950/30 text-red-500' : 
                  issue.type === 'LINK_OPPORTUNITY' ? 'bg-blue-950/30 text-blue-500' : 
                  issue.type === 'CONTENT_GAP' ? 'bg-orange-950/30 text-orange-500' :
                  issue.type === 'BACKLINK_OPPORTUNITY' ? 'bg-purple-950/30 text-purple-500' :
                  'bg-yellow-950/30 text-yellow-500'}`}>
                   {issue.type === 'LINK_OPPORTUNITY' ? <Link size={20} /> : 
                    issue.type === 'CONTENT_GAP' ? <BookOpen size={20} /> :
                    issue.type === 'BACKLINK_OPPORTUNITY' ? <Anchor size={20} /> :
                    <ShieldAlert size={20} />}
                </div>
                <div className="overflow-hidden">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-gray-900 border border-gray-800 text-gray-400 whitespace-nowrap">
                      {issue.type.replace('_', ' ')}
                    </span>
                    <span className="text-xs font-mono text-gray-300 truncate">{issue.path}</span>
                  </div>
                  <p className="text-[11px] text-gray-500 line-clamp-1">
                    {issue.type === 'CONTENT_GAP' ? 'AI identified a high-traffic topic missing from your site.' :
                     issue.type === 'BACKLINK_OPPORTUNITY' ? 'Source linking to your competitor found. Outreach recommended.' :
                     'Actionable SEO item detected.'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 shrink-0">
                {issue.type === 'CONTENT_GAP' && (
                  <button 
                    onClick={() => generatePage(issue)}
                    disabled={!!generating}
                    className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
                  >
                    {generating === issue.id ? <RefreshCw className="animate-spin" size={12} /> : <PenTool size={12} />}
                    Draft Page
                  </button>
                )}
                <button className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-gray-500 hover:text-terminal">
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {notification && <Toast message={notification.message} type={notification.type} onClose={() => setNotification(null)} />}
    </div>
  );
}
