'use client';

import { 
  LayoutDashboard, 
  FileText, 
  Bot, 
  Settings as SettingsIcon, 
  Server, 
  Plug, 
  User, 
  ShieldCheck, 
  Menu, 
  X,
  Zap 
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks';

export function Sidebar() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Close sidebar on navigation (mobile)
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[#0a0a0a] border-b border-gray-800 z-20 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-terminal rounded-lg flex items-center justify-center font-bold text-black shadow-[0_0_10px_rgba(34,197,94,0.3)] text-xs">M</div>
          <span className="font-bold text-lg tracking-tight text-white">Mojo</span>
        </div>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 text-gray-400 hover:text-white transition-colors"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 border-r border-gray-800 bg-[#0a0a0a] flex flex-col transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:h-full
      `}>
        <div className="p-6 border-b border-gray-800 hidden lg:flex items-center gap-3">
          <div className="w-8 h-8 bg-terminal rounded-lg flex items-center justify-center font-bold text-black shadow-[0_0_15px_rgba(34,197,94,0.4)]">M</div>
          <span className="font-bold text-xl tracking-tight text-white">Mojo</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <NavItem href="/dashboard" icon={LayoutDashboard} label="Dashboard" />
          <NavItem href="/dashboard/guardian" icon={ShieldCheck} label="Guardian" />
          <NavItem href="/dashboard/install" icon={Zap} label="Deploy Agent" />
          <NavItem href="/dashboard/reports" icon={FileText} label="Reports" />
          <NavItem href="/dashboard/logs" icon={Bot} label="AI Logs" />
          <NavItem href="/dashboard/rules" icon={SettingsIcon} label="Rules" />
          
          <div className="pt-4 pb-2">
            <div className="border-t border-gray-800" />
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-4 px-3">System</p>
          </div>
          
          <NavItem href="/dashboard/status" icon={Server} label="Agent Status" />
          <NavItem href="/dashboard/integrations" icon={Plug} label="Integrations" />
          <NavItem href="/dashboard/settings" icon={User} label="Settings" />
        </nav>

        <div className="p-4 border-t border-gray-800 bg-black/20">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-700 flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-white uppercase">
              {user?.displayName?.substring(0, 2) || user?.email?.substring(0, 2) || 'AD'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.displayName || 'Active User'}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email || 'Pro Plan'}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

function NavItem({ icon: Icon, label, href }: { icon: any, label: string, href: string }) {
  const pathname = usePathname();
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
