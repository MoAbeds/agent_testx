'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { FileBarChart, AlertTriangle, CheckCircle, FileText, Download, RefreshCw, TrendingUp, Target, Loader2, ShieldCheck, Globe } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface Opportunity {
  id: string;
  path: string;
  domain: string;
  issues: string[];
}

interface ReportData {
  healthScore: number;
  pagesScanned: number;
  issuesFound: number;
  optimizedCount: number;
  opportunities: Opportunity[];
  generatedAt: string;
  siteDetails?: any;
}

function ReportsContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const siteId = searchParams.get('siteId');
  
  const [allSites, setAllSites] = useState<any[]>([]);
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  // 1. Fetch available sites for dropdown
  useEffect(() => {
    if (!user) return;
    const fetchSites = async () => {
      const q = query(collection(db, "sites"), where("userId", "==", user.uid));
      const snap = await getDocs(q);
      setAllSites(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    fetchSites();
  }, [user]);

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = siteId ? `/api/reports/summary?siteId=${siteId}` : '/api/reports/summary';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch report');
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    if (!reportRef.current || !data) return;
    
    setExporting(true);
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        backgroundColor: '#0a0a0a',
        logging: false,
        useCORS: true
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width / 2, canvas.height / 2]
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
      pdf.save(`Mojo-SEO-Report-${data.siteDetails?.domain || 'All-Sites'}-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error('PDF Export failed:', err);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [siteId]);

  const getHealthColor = (score: number) => {
    if (score >= 80) return '#22c55e'; // green
    if (score >= 60) return '#eab308'; // yellow
    if (score >= 40) return '#f97316'; // orange
    return '#ef4444'; // red
  };

  const getHealthLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Needs Work';
    return 'Critical';
  };

  return (
    <main className="p-4 md:p-8 max-w-7xl mx-auto">
      <header className="mb-10 flex flex-col xl:flex-row xl:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3 font-serif">
            <FileBarChart className="text-terminal" size={32} />
            {data?.siteDetails?.domain ? `${data.siteDetails.domain} Audit` : 'SEO Intelligence'}
          </h1>
          <p className="text-gray-400 text-sm md:text-base">
            Autonomous health analysis and AI remediation trail.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Site Selection Dropdown */}
          <div className="relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-hover:text-terminal transition-colors">
              <Globe size={14} />
            </div>
            <select 
              value={siteId || ''}
              onChange={(e) => router.push(`/dashboard/reports${e.target.value ? `?siteId=${e.target.value}` : ''}`)}
              className="pl-9 pr-8 py-2.5 bg-[#0a0a0a] border border-gray-800 rounded-xl text-xs font-bold text-gray-300 appearance-none focus:border-terminal outline-none cursor-pointer hover:border-gray-700 transition-all min-w-[180px]"
            >
              <option value="">All Connected Sites</option>
              {allSites.map(s => (
                <option key={s.id} value={s.id}>{s.domain}</option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-600">
              <RefreshCw size={10} />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchReport}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#111] border border-gray-800 text-gray-300 hover:bg-[#161616] hover:border-gray-700 transition-all disabled:opacity-50 text-[10px] font-bold uppercase tracking-widest"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Re-Sync
            </button>
            <button
              onClick={handleExportPDF}
              disabled={loading || exporting || !data}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-terminal text-black hover:bg-green-400 transition-all disabled:opacity-50 text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-terminal/10"
            >
              {exporting ? <Loader2 className="animate-spin" size={14} /> : <Download size={14} />}
              {exporting ? 'Rendering...' : 'Export PDF'}
            </button>
          </div>
        </div>
      </header>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 flex items-center gap-2">
          <AlertTriangle size={18} />
          {error}
        </div>
      )}

      {loading && !data ? (
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-3 text-gray-400 font-mono">
            <Loader2 className="animate-spin text-terminal" size={24} />
            Compiling audit data...
          </div>
        </div>
      ) : data ? (
        <div ref={reportRef} className="space-y-8 p-2">
          {/* Top Section: Health Gauge + Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1 bg-[#0a0a0a] border border-gray-800 rounded-2xl p-6 flex flex-col items-center justify-center shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-terminal/20 to-transparent" />
              <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-6">Mojo Health Index</h3>
              <div className="relative w-40 h-40">
                <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="#141414"
                    strokeWidth="10"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke={getHealthColor(data.healthScore)}
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={`${(data.healthScore / 100) * 264} 264`}
                    style={{
                      transition: 'stroke-dasharray 1s ease-in-out',
                      filter: `drop-shadow(0 0 8px ${getHealthColor(data.healthScore)}40)`
                    }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span 
                    className="text-5xl font-black font-mono"
                    style={{ color: getHealthColor(data.healthScore) }}
                  >
                    {data.healthScore}
                  </span>
                  <span className="text-[10px] text-gray-600 font-bold uppercase tracking-tighter mt-1">Percent</span>
                </div>
              </div>
              <div 
                className="mt-6 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border"
                style={{ 
                  backgroundColor: `${getHealthColor(data.healthScore)}10`,
                  color: getHealthColor(data.healthScore),
                  borderColor: `${getHealthColor(data.healthScore)}30`
                }}
              >
                {getHealthLabel(data.healthScore)}
              </div>
            </div>

            <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard
                icon={FileText}
                label="Pages Scanned"
                value={data.pagesScanned}
                color="#3b82f6"
              />
              <StatCard
                icon={AlertTriangle}
                label="Issues Found"
                value={data.issuesFound}
                color="#ef4444"
              />
              <StatCard
                icon={CheckCircle}
                label="Active Rules"
                value={data.optimizedCount}
                color="#22c55e"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InsightCard
              icon={TrendingUp}
              title="Optimization Impact"
              description={
                data.pagesScanned > 0
                  ? `Mojo has successfully remediated ${data.optimizedCount} SEO gaps across your site structure.`
                  : 'No pages scanned yet'
              }
              color="#8b5cf6"
            />
            <InsightCard
              icon={Target}
              title="Niche Authority"
              description={
                data.siteDetails 
                  ? `Based on market competition, your domain authority is ranked at ${data.siteDetails.authority || 'N/A'}/100.`
                  : `Analyzed ${data.pagesScanned} pages for structural integrity and metadata alignment.`
              }
              color="#06b6d4"
            />
          </div>

          <div className="bg-[#0a0a0a] border border-gray-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-gray-800 bg-gray-900/20 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2 font-serif">
                  <AlertTriangle className="text-amber-500" size={20} />
                  Strategic Remediation Trail
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  High-priority optimization opportunities detected by Mojo AI
                </p>
              </div>
              <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">{data.opportunities.length} Items</span>
            </div>
            
            {data.opportunities.length === 0 ? (
              <div className="p-12 text-center">
                <CheckCircle className="mx-auto mb-4 text-terminal opacity-20" size={48} />
                <h3 className="text-lg font-medium text-white mb-2">Structure Secure</h3>
                <p className="text-gray-500 text-sm">
                  No critical optimization opportunities found.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-800/50">
                {data.opportunities.map((opp) => (
                  <div key={opp.id} className="p-5 hover:bg-white/[0.02] transition-colors group">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-blue-400 font-bold font-mono text-xs px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20">
                            {opp.domain}
                          </span>
                          <span className="text-gray-400 font-mono text-xs truncate">
                            {opp.path}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {opp.issues.map((issue, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-tight bg-red-500/5 text-red-400 border border-red-500/10"
                            >
                              <ShieldCheck size={10} />
                              {issue}
                            </span>
                          ))}
                        </div>
                      </div>
                      <button 
                        onClick={() => window.location.href = `/dashboard/guardian?siteId=${siteId || ''}`}
                        className="opacity-0 group-hover:opacity-100 transition-all flex-shrink-0 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white/5 text-gray-400 border border-white/10 hover:text-white hover:bg-white/10"
                      >
                        Remediate
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="text-center text-[10px] font-bold uppercase tracking-widest text-gray-700 py-4 border-t border-gray-800/30">
            Mojo Guardian v1.3 • Generated: {new Date(data.generatedAt).toLocaleString()}
          </div>
        </div>
      ) : null}
    </main>
  );
}

export default function ReportsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-terminal" size={48} />
      </div>
    }>
      <ReportsContent />
    </Suspense>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string; }) {
  return (
    <div className="bg-[#0a0a0a] border border-gray-800 rounded-2xl p-6 shadow-sm group hover:border-gray-700 transition-colors relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
        <Icon size={80} style={{ color }} />
      </div>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}10` }}>
          <Icon size={20} style={{ color }} />
        </div>
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{label}</span>
      </div>
      <div className="text-4xl font-black text-white font-mono">{value}</div>
    </div>
  );
}

function InsightCard({ icon: Icon, title, description, color }: { icon: any; title: string; description: string; color: string; }) {
  return (
    <div className="bg-[#0a0a0a] border border-gray-800 rounded-2xl p-5 flex items-start gap-4 shadow-sm group hover:border-terminal/20 transition-all">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 border transition-all group-hover:scale-110" style={{ backgroundColor: `${color}05`, borderColor: `${color}20` }}>
        <Icon size={24} style={{ color }} />
      </div>
      <div>
        <h3 className="text-white font-bold mb-1 text-sm uppercase tracking-tight">{title}</h3>
        <p className="text-xs text-gray-500 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
