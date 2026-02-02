'use client';

import { useEffect, useState } from 'react';
import { FileBarChart, AlertTriangle, CheckCircle, FileText, Download, RefreshCw, TrendingUp, Target } from 'lucide-react';

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
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/reports/summary');
      if (!res.ok) throw new Error('Failed to fetch report');
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

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
    <main className="p-8">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <FileBarChart className="text-terminal" size={32} />
            SEO Reports
          </h1>
          <p className="text-gray-400">
            Site health analysis and optimization opportunities
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchReport}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#111] border border-gray-800 text-gray-300 hover:bg-[#161616] hover:border-gray-700 transition-all disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={() => alert('PDF export coming soon!')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-terminal/10 border border-terminal/30 text-terminal hover:bg-terminal/20 transition-all"
          >
            <Download size={16} />
            Export PDF
          </button>
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
          <div className="flex items-center gap-3 text-gray-400">
            <RefreshCw className="animate-spin" size={24} />
            Generating report...
          </div>
        </div>
      ) : data ? (
        <div className="space-y-8">
          {/* Top Section: Health Gauge + Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Health Score Gauge */}
            <div className="lg:col-span-1 bg-[#0a0a0a] border border-gray-800 rounded-xl p-6 flex flex-col items-center justify-center">
              <h3 className="text-sm font-medium text-gray-400 mb-4">Site Health Score</h3>
              <div className="relative w-40 h-40">
                <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                  {/* Background circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="#1a1a1a"
                    strokeWidth="12"
                  />
                  {/* Progress circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke={getHealthColor(data.healthScore)}
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={`${(data.healthScore / 100) * 264} 264`}
                    style={{
                      filter: `drop-shadow(0 0 8px ${getHealthColor(data.healthScore)})`
                    }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span 
                    className="text-4xl font-bold"
                    style={{ color: getHealthColor(data.healthScore) }}
                  >
                    {data.healthScore}
                  </span>
                  <span className="text-xs text-gray-500 mt-1">/ 100</span>
                </div>
              </div>
              <div 
                className="mt-4 px-3 py-1 rounded-full text-xs font-medium"
                style={{ 
                  backgroundColor: `${getHealthColor(data.healthScore)}20`,
                  color: getHealthColor(data.healthScore)
                }}
              >
                {getHealthLabel(data.healthScore)}
              </div>
            </div>

            {/* Stats Grid */}
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
                label="Rules Active"
                value={data.optimizedCount}
                color="#22c55e"
              />
            </div>
          </div>

          {/* Quick Insights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InsightCard
              icon={TrendingUp}
              title="Optimization Rate"
              description={
                data.pagesScanned > 0
                  ? `${Math.round((data.optimizedCount / Math.max(data.issuesFound, 1)) * 100)}% of issues have active rules`
                  : 'No pages scanned yet'
              }
              color="#8b5cf6"
            />
            <InsightCard
              icon={Target}
              title="Coverage"
              description={
                data.pagesScanned > 0
                  ? `${data.pagesScanned} pages analyzed across your sites`
                  : 'Scan your sites to analyze pages'
              }
              color="#06b6d4"
            />
          </div>

          {/* Opportunities List */}
          <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl overflow-hidden">
            <div className="p-6 border-b border-gray-800">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <AlertTriangle className="text-amber-500" size={20} />
                Optimization Opportunities
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Pages that need attention to improve SEO performance
              </p>
            </div>
            
            {data.opportunities.length === 0 ? (
              <div className="p-12 text-center">
                <CheckCircle className="mx-auto mb-4 text-terminal" size={48} />
                <h3 className="text-lg font-medium text-white mb-2">All Clear!</h3>
                <p className="text-gray-500">
                  No optimization opportunities found. Your pages are well-optimized.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-800">
                {data.opportunities.map((opp) => (
                  <div key={opp.id} className="p-4 hover:bg-[#111] transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-gray-300 font-medium font-mono text-sm">
                            {opp.domain}
                          </span>
                          <span className="text-gray-600">/</span>
                          <span className="text-gray-400 font-mono text-sm truncate">
                            {opp.path}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {opp.issues.map((issue, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            >
                              <AlertTriangle size={12} />
                              {issue}
                            </span>
                          ))}
                        </div>
                      </div>
                      <button className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium bg-terminal/10 text-terminal border border-terminal/20 hover:bg-terminal/20 transition-colors">
                        Fix Now
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Report Generated Timestamp */}
          <div className="text-center text-xs text-gray-600">
            Report generated at {new Date(data.generatedAt).toLocaleString()}
          </div>
        </div>
      ) : null}
    </main>
  );
}

function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  color 
}: { 
  icon: any; 
  label: string; 
  value: number; 
  color: string;
}) {
  return (
    <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div 
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${color}15` }}
        >
          <Icon size={20} style={{ color }} />
        </div>
        <span className="text-sm text-gray-400">{label}</span>
      </div>
      <div className="text-3xl font-bold text-white">{value}</div>
    </div>
  );
}

function InsightCard({
  icon: Icon,
  title,
  description,
  color
}: {
  icon: any;
  title: string;
  description: string;
  color: string;
}) {
  return (
    <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-5 flex items-start gap-4">
      <div 
        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${color}15` }}
      >
        <Icon size={24} style={{ color }} />
      </div>
      <div>
        <h3 className="text-white font-medium mb-1">{title}</h3>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
    </div>
  );
}
