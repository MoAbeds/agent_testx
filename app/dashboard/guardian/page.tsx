import { prisma } from '@/lib/prisma';
import GuardianIssues from '@/components/GuardianIssues';
import AuditFeed from '@/components/AuditFeed';
import ResearchButton from '@/components/ResearchButton';
import { Shield, Target, Search, Sparkles } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function GuardianPage() {
  // We'll grab the first site for the demo/prototype
  const site = await prisma.site.findFirst({
    include: {
      events: {
        orderBy: { occurredAt: 'desc' },
        take: 20
      }
    }
  });

  if (!site) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-white mb-4">No Site Found</h1>
        <p className="text-gray-400">Please connect a site in the Overview first.</p>
      </div>
    );
  }

  // Find 404s and SEO Gaps
  const issues = await prisma.agentEvent.findMany({
    where: { 
      siteId: site.id,
      type: { in: ['404_DETECTED', 'SEO_GAP'] }
    },
    orderBy: { occurredAt: 'desc' }
  });

  // Extract keywords if present
  let keywords = { primary: site.domain, topRanking: [], suggestions: [] };
  if (site.targetKeywords) {
    try {
      keywords = JSON.parse(site.targetKeywords);
    } catch (e) {}
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-terminal/10 p-2 rounded-lg border border-terminal/20">
              <Shield className="text-terminal" size={24} />
            </div>
            <h1 className="text-4xl font-bold text-white font-serif tracking-tight">Mojo Guardian</h1>
          </div>
          <p className="text-gray-400 max-w-xl">
            Autonomous SEO infrastructure. Monitoring <span className="text-blue-400 font-mono">{site.domain}</span> for threats and opportunities.
          </p>
        </div>

        <div className="flex gap-3">
            <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl px-4 py-3 flex items-center gap-3">
                <Target className="text-gray-500" size={20} />
                <div>
                    <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold block">Authority</span>
                    <span className="text-lg font-bold text-white font-mono">82/100</span>
                </div>
            </div>
            <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl px-4 py-3 flex items-center gap-3">
                <Search className="text-gray-500" size={20} />
                <div>
                    <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold block">Visibility</span>
                    <span className="text-lg font-bold text-white font-mono">1.2k</span>
                </div>
            </div>
        </div>
      </header>

      {/* Keywords & AI Context Section */}
      <section className="mb-12">
        <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Sparkles size={120} className="text-terminal" />
          </div>
          
          <div className="relative z-10">
            <h2 className="text-lg font-bold text-gray-100 mb-6 flex items-center gap-2">
              <Sparkles className="text-terminal" size={18} />
              AI Search Context (via Serper.dev)
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 block">Primary Topic</span>
                <span className="text-2xl font-bold text-terminal capitalize">{keywords.primary}</span>
              </div>
              
              <div className="md:col-span-2">
                 <div className="flex items-center justify-between mb-3">
                   <span className="text-xs font-bold text-gray-500 uppercase tracking-widest block">High-Value Target Keywords</span>
                   <ResearchButton siteId={site.id} />
                 </div>
                 <div className="flex flex-wrap gap-2">
                    {keywords.suggestions.length > 0 ? (
                      keywords.suggestions.map((kw, i) => (
                        <span key={i} className="bg-gray-800/50 border border-gray-700 text-gray-300 px-3 py-1 rounded-full text-sm">
                          {kw}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-600 italic text-sm">No keyword data yet. Run "Research Site" to populate.</span>
                    )}
                 </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Issues List (2/3) */}
        <div className="lg:col-span-2">
          <GuardianIssues initialIssues={issues} siteId={site.id} />
        </div>

        {/* Audit Trail (1/3) */}
        <div>
          <AuditFeed initialEvents={site.events} siteId={site.id} />
        </div>
      </div>
    </div>
  );
}
