import { prisma } from '@/lib/prisma';
import CreateRuleForm from '@/components/CreateRuleForm';
import { Shield, Globe, Clock, CheckCircle } from 'lucide-react';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default async function RulesPage() {
  const rules = await prisma.optimizationRule.findMany({
    orderBy: { createdAt: 'desc' },
    include: { site: true },
  });

  return (
    <main className="p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Rules Engine</h1>
        <p className="text-gray-400">Define manual overrides for specific paths.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Rules List (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-100 flex items-center gap-2 font-serif">
              <Shield className="text-gray-400" size={20} />
              Active Rules
            </h2>
            <span className="text-xs text-gray-500 bg-gray-900 px-2 py-1 rounded border border-gray-800">
              {rules.length} Total
            </span>
          </div>

          <div className="space-y-4">
            {rules.length === 0 ? (
              <div className="p-8 border border-dashed border-gray-800 rounded-xl text-center">
                <p className="text-gray-500">No rules defined yet.</p>
              </div>
            ) : (
              rules.map((rule) => {
                let payload = { title: '', metaDescription: '' };
                try {
                  payload = JSON.parse(rule.payload);
                } catch (e) {
                  // ignore
                }

                return (
                  <div key={rule.id} className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors group">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-900 rounded-lg text-gray-400 group-hover:text-terminal transition-colors">
                          <Globe size={18} />
                        </div>
                        <div>
                          <h3 className="font-mono text-sm text-terminal font-bold">{rule.targetPath}</h3>
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                             via {rule.site.domain}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${
                          rule.isActive 
                            ? 'bg-green-900/20 text-green-400 border-green-900/50' 
                            : 'bg-yellow-900/20 text-yellow-400 border-yellow-900/50'
                        }`}>
                          {rule.isActive ? 'Active' : 'Draft'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm bg-[#111] p-3 rounded-lg border border-gray-800/50">
                      <div>
                        <span className="text-gray-500 text-xs uppercase tracking-wider block mb-1">Title Override</span>
                        <p className="text-gray-300 line-clamp-1" title={payload.title || 'N/A'}>
                          {payload.title || <span className="text-gray-600 italic">None</span>}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500 text-xs uppercase tracking-wider block mb-1">Meta Desc Override</span>
                        <p className="text-gray-300 line-clamp-1" title={payload.metaDescription || 'N/A'}>
                          {payload.metaDescription || <span className="text-gray-600 italic">None</span>}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-4 text-xs text-gray-600">
                      <div className="flex items-center gap-1">
                        <Clock size={12} />
                        {new Date(rule.createdAt).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <CheckCircle size={12} />
                        {(rule.confidence * 100).toFixed(0)}% Confidence
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Create Form (1/3) */}
        <div className="space-y-6">
           <CreateRuleForm />
        </div>
      </div>
    </main>
  );
}
