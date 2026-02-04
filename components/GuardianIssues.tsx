'use client';

import { useState, useEffect } from 'react';
import { ShieldAlert, CheckCircle, ArrowRight, Wand2, RefreshCw, Sparkles } from 'lucide-react';
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
  const [issues, setIssues] = useState(initialIssues);
  const [loading, setLoading] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Sync state when props change (real-time updates from parent)
  useEffect(() => {
    setIssues(initialIssues);
  }, [initialIssues]);

  const isFreePlan = user?.plan !== 'PRO';

  const fixAll404s = async () => {
    if (isFreePlan) {
      return setNotification({ 
        message: "The 'Fix' button is a Pro feature. Upgrade your plan to activate autonomous remediation.", 
        type: "info" 
      });
    }
    setLoading(true);
    try {
      const res = await fetch('/api/agent/fix-404', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId })
      });
      const data = await res.json();
      if (data.success) {
        const msg = data.message || `Success! Auto-fixed ${data.fixesApplied} broken links. Check the Audit Trail.`;
        setNotification({ message: msg, type: 'success' });
        setIssues(issues.filter(i => i.type !== '404_DETECTED'));
      } else {
        const msg = data.error || 'The AI could not process the fixes.';
        setNotification({ message: msg, type: 'error' });
      }
    } catch (e) {
      console.error(e);
      setNotification({ message: "Network error while fixing 404s.", type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fixAllGaps = async () => {
    if (isFreePlan) {
      return setNotification({ 
        message: "AI SEO Gaps require a Professional plan. Upgrade to optimize your site in one click.", 
        type: "info" 
      });
    }
    setOptimizing(true);
    try {
      const res = await fetch('/api/agent/fix-gaps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId })
      });
      const data = await res.json();
      if (data.success) {
        setNotification({ 
          message: `Successfully optimized ${data.appliedFixes} pages! Check the Audit Trail below.`,
          type: 'success'
        });
        setIssues(issues.filter(i => i.type !== 'SEO_GAP'));
      }
    } catch (e) {
      console.error(e);
      setNotification({ message: "Bulk optimization failed.", type: 'error' });
    } finally {
      setOptimizing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-gray-100 flex items-center gap-2 font-serif">
          <ShieldAlert className="text-red-500" size={20} />
          Security & SEO Gaps
        </h2>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={fixAll404s}
            disabled={loading || !issues.some(i => i.type === '404_DETECTED')}
            className="flex items-center justify-center gap-2 bg-terminal hover:bg-green-400 text-black text-[10px] uppercase font-bold px-4 py-2 rounded-lg transition-all disabled:opacity-50"
          >
            {loading ? <RefreshCw className="animate-spin" size={14} /> : <Wand2 size={14} />}
            Fix 404s
          </button>
          <button 
            onClick={fixAllGaps}
            disabled={optimizing || !issues.some(i => i.type === 'SEO_GAP')}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-[10px] uppercase font-bold px-4 py-2 rounded-lg transition-all disabled:opacity-50"
          >
            {optimizing ? <RefreshCw className="animate-spin" size={14} /> : <Sparkles size={14} />}
            Fix SEO Gaps
          </button>
        </div>
      </div>

      <div className="grid gap-4">
        {issues.length === 0 ? (
          <div className="p-12 border border-dashed border-gray-800 rounded-xl text-center bg-gray-900/20">
            <CheckCircle className="mx-auto text-terminal mb-4" size={40} />
            <p className="text-gray-400 font-medium">No urgent threats detected.</p>
            <p className="text-gray-600 text-sm mt-1">Your site is guarded by Mojo.</p>
          </div>
        ) : (
          issues.map((issue) => (
            <div key={issue.id} className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-4 flex items-center justify-between group hover:border-gray-700 transition-all shadow-sm">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${issue.type === '404_DETECTED' ? 'bg-red-950/30 text-red-500' : 'bg-yellow-950/30 text-yellow-500'}`}>
                   <ShieldAlert size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-gray-900 border border-gray-800 text-gray-400">
                      {issue.type === '404_DETECTED' ? 'Broken Link' : 'SEO Gap'}
                    </span>
                    <span className="text-sm font-mono text-gray-300">{issue.path}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {issue.type === '404_DETECTED' 
                      ? 'Users are seeing a 404 error page. Redirect recommended.' 
                      : 'Missing metadata or suboptimal on-page SEO detected.'}
                  </p>
                </div>
              </div>
              
              <button className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-gray-500 hover:text-terminal">
                <ArrowRight size={18} />
              </button>
            </div>
          ))
        )}
      </div>

      {notification && (
        <Toast 
          message={notification.message} 
          type={notification.type} 
          onClose={() => setNotification(null)} 
        />
      )}
    </div>
  );
}
