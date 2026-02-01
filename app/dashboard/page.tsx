import TerminalFeed from '@/components/TerminalFeed';
import StatsCard from '@/components/StatsCard';
import DiffViewer from '@/components/DiffViewer';
import { Activity, ShieldCheck, DollarSign, Bot, Globe, FileSearch, ExternalLink } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import ScanButton from '@/components/ScanButton';

// Force dynamic rendering so we get fresh DB stats on refresh
export const dynamic = 'force-dynamic';

export default async function Dashboard() {
  // Fetch real stats from DB
  const siteCount = await prisma.site.count();
  const rulesCount = await prisma.optimizationRule.count({
    where: { isActive: true }
  });
  // In a real app, ROI would be calculated from analytics events
  const roiValue = "$1,240"; 

  // Fetch sites and discovered pages
  const sites = await prisma.site.findMany({
    include: {
      pages: {
        orderBy: { lastCrawled: 'desc' }
      }
    }
  });

  const allPages = await prisma.page.findMany({
    include: {
      site: {
        select: { domain: true }
      }
    },
    orderBy: { lastCrawled: 'desc' }
  });

  return (
    <main className="p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Overview</h1>
        <p className="text-gray-400">Real-time infrastructure monitoring</p>
        
        <div className="mt-6 flex items-center gap-2 text-xs text-terminal bg-terminal/5 border border-terminal/20 w-fit px-3 py-1.5 rounded-full">
          <div className="w-2 h-2 rounded-full bg-terminal animate-pulse shadow-[0_0_8px_#22c55e]" />
          Live Connection
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatsCard 
          title="Sites Connected"
          value={siteCount.toString()}
          change="+1"
          trend="up"
          icon={Activity}
        />
        <StatsCard 
          title="Active Rules"
          value={rulesCount.toString()}
          change="+100%"
          trend="up"
          icon={ShieldCheck}
        />
        <StatsCard 
          title="Revenue Optimized"
          value={roiValue}
          change="+8.1%"
          trend="up"
          icon={DollarSign}
        />
      </div>

      {/* Dashboard Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Column (2/3) */}
        <div className="lg:col-span-2 space-y-8">
          <div>
            <h2 className="text-xl font-bold text-gray-100 mb-4 flex items-center gap-2 font-serif">
              <Bot className="text-gray-400" size={20} />
              Live Agent Feed
            </h2>
            <TerminalFeed />
          </div>
          
          <div>
              <h2 className="text-xl font-bold text-gray-100 mb-4 font-serif">SEO Optimization Log</h2>
              <DiffViewer />
          </div>

          {/* Discovered Pages Section */}
          <div>
            <h2 className="text-xl font-bold text-gray-100 mb-4 flex items-center gap-2 font-serif">
              <FileSearch className="text-gray-400" size={20} />
              Discovered Pages
            </h2>
            <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl overflow-hidden">
              {allPages.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <FileSearch className="mx-auto mb-3 opacity-50" size={32} />
                  <p>No pages discovered yet.</p>
                  <p className="text-sm mt-1">Use "Scan Now" on a site to discover pages.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-800">
                  {allPages.map((page) => (
                    <div key={page.id} className="p-4 hover:bg-[#111] transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded ${
                              page.status === 200 
                                ? 'bg-terminal/10 text-terminal' 
                                : 'bg-red-500/10 text-red-400'
                            }`}>
                              {page.status}
                            </span>
                            <span className="text-gray-400 text-sm font-mono truncate">
                              {page.site.domain}{page.path}
                            </span>
                          </div>
                          <h4 className="text-gray-100 font-medium truncate">
                            {page.title || <span className="text-gray-500 italic">No title</span>}
                          </h4>
                          <p className="text-gray-500 text-sm truncate mt-0.5">
                            {page.metaDesc || <span className="italic">No meta description</span>}
                          </p>
                        </div>
                        <div className="text-right text-xs text-gray-500 whitespace-nowrap">
                          {page.lastCrawled 
                            ? new Date(page.lastCrawled).toLocaleDateString() 
                            : 'Never'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (1/3) */}
        <div className="space-y-6">
          <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-100 mb-4 flex items-center gap-2 font-serif">
              <Activity className="text-gray-400" size={20} />
              System Health
            </h3>
            <div className="space-y-6">
              <HealthBar label="API Latency" value={92} color="bg-terminal" />
              <HealthBar label="Error Rate" value={4} color="bg-red-500" />
              <HealthBar label="Cache Hit Ratio" value={88} color="bg-blue-500" />
            </div>
          </div>

          {/* Sites Card with Scan Button */}
          <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-100 mb-4 flex items-center gap-2 font-serif">
              <Globe className="text-gray-400" size={20} />
              Sites
            </h3>
            {sites.length === 0 ? (
              <p className="text-gray-500 text-sm">No sites configured yet.</p>
            ) : (
              <div className="space-y-3">
                {sites.map((site) => (
                  <div key={site.id} className="p-3 rounded-lg bg-[#111] border border-gray-800">
                    <div className="flex items-center justify-between mb-2">
                      <a 
                        href={`https://${site.domain}`}
                        target="_blank"
                        rel="noopener noreferrer" 
                        className="text-gray-200 hover:text-terminal transition-colors flex items-center gap-1.5 text-sm font-medium"
                      >
                        {site.domain}
                        <ExternalLink size={12} className="opacity-50" />
                      </a>
                      <span className="text-xs text-gray-500">
                        {site.pages.length} page{site.pages.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <ScanButton domain={site.domain} />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-100 mb-4 font-serif">Quick Actions</h3>
            <div className="space-y-3">
              <ActionButton label="Purge Cache" />
              <ActionButton label="Generate Report" />
              <Link href="/dashboard/rules" className="block w-full text-left px-4 py-3 rounded-lg bg-[#111] hover:bg-[#161616] border border-gray-800 text-sm text-gray-300 transition-all hover:border-gray-700">
                Configure Rules
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
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

function ActionButton({ label }: { label: string }) {
  return (
    <button className="w-full text-left px-4 py-3 rounded-lg bg-[#111] hover:bg-[#161616] border border-gray-800 text-sm text-gray-300 transition-all hover:border-gray-700">
      {label}
    </button>
  );
}
