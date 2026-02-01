import TerminalFeed from '@/components/TerminalFeed';
import StatsCard from '@/components/StatsCard';
import DiffViewer from '@/components/DiffViewer';
import { Activity, ShieldCheck, DollarSign, LayoutDashboard, FileText, Bot, Settings as SettingsIcon } from 'lucide-react';
import { prisma } from '@/lib/prisma';

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

  return (
    <div className="min-h-screen bg-[#050505] flex font-sans text-gray-100">
      {/* Sidebar */}
      <aside className="w-64 border-r border-gray-800 bg-[#0a0a0a] flex flex-col fixed h-full z-10">
        <div className="p-6 border-b border-gray-800 flex items-center gap-3">
          <div className="w-8 h-8 bg-terminal rounded-lg flex items-center justify-center font-bold text-black shadow-[0_0_15px_rgba(34,197,94,0.4)]">M</div>
          <span className="font-bold text-xl tracking-tight">Mojo</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <NavItem icon={LayoutDashboard} label="Dashboard" active />
          <NavItem icon={FileText} label="Reports" />
          <NavItem icon={Bot} label="AI Logs" />
          <NavItem icon={SettingsIcon} label="Settings" />
        </nav>

        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-700" />
            <div>
              <p className="text-sm font-medium">Admin User</p>
              <p className="text-xs text-gray-500">Pro Plan</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8">
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
      </main>
    </div>
  );
}

function NavItem({ icon: Icon, label, active }: { icon: any, label: string, active?: boolean }) {
  return (
    <button className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      active 
        ? 'bg-terminal/10 text-terminal border border-terminal/20' 
        : 'text-gray-400 hover:text-white hover:bg-white/5'
    }`}>
      <Icon size={18} />
      {label}
    </button>
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
