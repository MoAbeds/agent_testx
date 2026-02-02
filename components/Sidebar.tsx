'use client';

import { LayoutDashboard, FileText, Bot, Settings as SettingsIcon, Server, Plug, User, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Sidebar() {
  return (
    <aside className="w-64 border-r border-gray-800 bg-[#0a0a0a] flex flex-col fixed h-full z-10">
      <div className="p-6 border-b border-gray-800 flex items-center gap-3">
        <div className="w-8 h-8 bg-terminal rounded-lg flex items-center justify-center font-bold text-black shadow-[0_0_15px_rgba(34,197,94,0.4)]">M</div>
        <span className="font-bold text-xl tracking-tight text-white">Mojo</span>
      </div>
      
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        <NavItem href="/dashboard" icon={LayoutDashboard} label="Dashboard" />
        <NavItem href="/dashboard/guardian" icon={ShieldCheck} label="Guardian" />
        <NavItem href="/dashboard/reports" icon={FileText} label="Reports" />
        <NavItem href="/dashboard/logs" icon={Bot} label="AI Logs" />
        <NavItem href="/dashboard/rules" icon={SettingsIcon} label="Rules" />
        
        {/* System Section Separator */}
        <div className="pt-4 pb-2">
          <div className="border-t border-gray-800" />
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-4 px-3">System</p>
        </div>
        
        <NavItem href="/dashboard/status" icon={Server} label="Agent Status" />
        <NavItem href="/dashboard/integrations" icon={Plug} label="Integrations" />
        <NavItem href="/dashboard/settings" icon={User} label="Settings" />
      </nav>

      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gray-700" />
          <div>
            <p className="text-sm font-medium text-white">Admin User</p>
            <p className="text-xs text-gray-500">Pro Plan</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

function NavItem({ icon: Icon, label, href }: { icon: any, label: string, href: string }) {
  const pathname = usePathname();
  // Active if exact match or if it's a sub-path (except for root dashboard to avoid always active)
  const active = href === '/dashboard' ? pathname === href : pathname.startsWith(href);

  return (
    <Link 
      href={href}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      active 
        ? 'bg-terminal/10 text-terminal border border-terminal/20' 
        : 'text-gray-400 hover:text-white hover:bg-white/5'
    }`}>
      <Icon size={18} />
      {label}
    </Link>
  );
}
