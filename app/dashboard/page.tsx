import TerminalFeed from '@/components/TerminalFeed';
import StatsCard from '@/components/StatsCard';
import DiffViewer from '@/components/DiffViewer';
import { Activity, ShieldCheck, DollarSign, LayoutDashboard, FileText, Bot, Settings as SettingsIcon } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import AddSiteForm from '@/components/AddSiteForm';
import ScanButton from '@/components/ScanButton';
import OptimizeButton from '@/components/OptimizeButton';

// Force dynamic rendering so we get fresh DB stats on refresh
export const dynamic = 'force-dynamic';

export default async function Dashboard() {
  // Fetch real stats from DB
  const siteCount = await prisma.site.count();
  const pageCount = await prisma.page.count();
  const rulesCount = await prisma.optimizationRule.count({
    where: { isActive: true }
  });
  
  // Fetch the latest optimization rule for the Diff Viewer
  const latestRule = await prisma.optimizationRule.findFirst({
    orderBy: { createdAt: 'desc' },
    take: 1
  });

  let diffData = null;
  if (latestRule) {
    try {
        const payload = JSON.parse(latestRule.payload as string);
        diffData = {
            oldTitle: "Original Title (Not tracked yet)", // We need to track original title in Page model to show here
            newTitle: payload.title,
            oldMeta: "Original Meta (Not tracked yet)",
            newMeta: payload.metaDesc
        };
    } catch (e) {}
  }

  // Fetch discovered pages
  const pages = await prisma.page.findMany({
    orderBy: { lastCrawled: 'desc' },
    take: 5,
    include: { site: true }
  });

  // In a real app, ROI would be calculated from analytics events
  const roiValue = "$1,240"; 

  return (
    <div className="p-8">
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
            title="Pages Scanned"
            value={pageCount.toString()}
            change={pageCount > 0 ? "+100%" : "0%"}
            trend="up"
            icon={FileText}
          />
          <StatsCard 
            title="Active Rules"
            value={rulesCount.toString()}
            change="+100%"
            trend="up"
            icon={ShieldCheck}
          />
        </div>

        {/* Sites & Scanning */}
        <div className="mb-8">
            <AddSiteForm />
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
               <h2 className="text-xl font-bold text-gray-100 mb-4 font-serif">Recent Optimizations</h2>
               {diffData ? (
                   <DiffViewer 
                        oldTitle={diffData.oldTitle} 
                        newTitle={diffData.newTitle}
                        oldMeta={diffData.oldMeta}
                        newMeta={diffData.newMeta}
                   />
               ) : (
                   <div className="p-6 border border-gray-800 rounded-xl bg-gray-900/50 text-gray-500 text-center">
                       No optimizations found yet. Scan a site and click the wand!
                   </div>
               )}
            </div>

            <div>
                <h2 className="text-xl font-bold text-gray-100 mb-4 font-serif">Discovered Pages</h2>
                <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-sm text-gray-400">
                        <thead className="bg-gray-900/50 text-gray-200 font-medium">
                            <tr>
                                <th className="p-4">Path</th>
                                <th className="p-4">Title</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {pages.map(page => (
                                <tr key={page.id} className="hover:bg-white/5 transition-colors">
                                    <td className="p-4 font-mono text-xs text-blue-400">{page.path}</td>
                                    <td className="p-4 max-w-xs truncate" title={page.title || ''}>{page.title || '-'}</td>
                                    <td className="p-4">
                                        <span className="px-2 py-1 rounded-full bg-green-900/20 text-green-400 text-xs border border-green-900/50">
                                            {page.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <OptimizeButton pageId={page.id} />
                                    </td>
                                </tr>
                            ))}
                            {pages.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-gray-500">
                                        No pages found. Click "Scan" above.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
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

            <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-100 mb-4 font-serif">Quick Actions</h3>
              <div className="space-y-3">
                <ActionButton label="Purge Cache" />
                <ActionButton label="Generate Report" />
                <ActionButton label="Configure Agents" />
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
