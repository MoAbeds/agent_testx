import { Server, RefreshCw } from 'lucide-react';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function AgentStatusPage() {
  const sites = await prisma.site.findMany({
    include: {
      pages: {
        orderBy: { lastCrawled: 'desc' },
        take: 1
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Agent Status</h1>
        <p className="text-gray-400">Monitor connected Mojo agents across your sites</p>
      </header>

      <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-900/50">
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Hostname</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Version</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Last Sync</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {sites.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <Server className="mx-auto mb-3 text-gray-600" size={32} />
                    <p className="text-gray-500">No agents connected yet.</p>
                    <p className="text-sm text-gray-600 mt-1">Add a site to get started.</p>
                  </td>
                </tr>
              ) : (
                sites.map((site) => {
                  const lastSync = site.pages[0]?.lastCrawled;
                  const isOnline = lastSync && (Date.now() - new Date(lastSync).getTime()) < 24 * 60 * 60 * 1000;
                  
                  return (
                    <tr key={site.id} className="hover:bg-[#111] transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-100">{site.domain}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-2 text-sm font-medium ${
                          isOnline ? 'text-terminal' : 'text-gray-500'
                        }`}>
                          <span className={`w-2 h-2 rounded-full ${
                            isOnline 
                              ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' 
                              : 'bg-gray-600'
                          }`} />
                          {isOnline ? 'Online' : 'Offline'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-400 font-mono text-sm">v2.1.4</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-500 text-sm">
                          {lastSync 
                            ? new Date(lastSync).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            : 'Never'
                          }
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
