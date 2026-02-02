'use client';

import { useState } from 'react';
import { ChevronDown, Globe, Trash2, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Site {
  id: string;
  domain: string;
}

export default function SiteManager({ sites, currentSiteId }: { sites: Site[], currentSiteId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  const currentSite = sites.find(s => s.id === currentSiteId) || sites[0];

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to remove ${currentSite.domain}? This will delete all crawled pages, rules, and logs.`)) {
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch('/api/sites/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId: currentSiteId })
      });
      
      const data = await res.json();
      if (data.success) {
        router.push('/dashboard');
        router.refresh();
      } else {
        alert(data.error || "Delete failed");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      {/* Site Selector */}
      <div className="relative">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="bg-[#0a0a0a] border border-gray-800 rounded-xl px-4 py-3 flex items-center gap-3 hover:border-gray-700 transition-all min-w-[200px] justify-between"
        >
          <div className="flex items-center gap-2">
            <Globe size={18} className="text-blue-400" />
            <span className="text-sm font-bold text-white font-mono">{currentSite?.domain}</span>
          </div>
          <ChevronDown size={16} className={`text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute top-full mt-2 w-full bg-[#111] border border-gray-800 rounded-xl shadow-2xl z-50 overflow-hidden">
            {sites.map(site => (
              <button
                key={site.id}
                onClick={() => {
                  setIsOpen(false);
                  router.push(`/dashboard/guardian?siteId=${site.id}`);
                }}
                className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors hover:bg-white/5 flex items-center gap-2 ${site.id === currentSiteId ? 'text-terminal bg-terminal/5' : 'text-gray-400'}`}
              >
                <Globe size={14} />
                {site.domain}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Delete Button */}
      <button 
        onClick={handleDelete}
        disabled={deleting}
        className="p-3 bg-red-950/20 border border-red-900/30 text-red-500 rounded-xl hover:bg-red-900/40 transition-all group disabled:opacity-50"
        title="Remove Site"
      >
        {deleting ? <RefreshCw className="animate-spin" size={18} /> : <Trash2 size={18} />}
      </button>
    </div>
  );
}
