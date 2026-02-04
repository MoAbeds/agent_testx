'use client';

import { useAuth } from '@/lib/hooks';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useEffect, useState, Suspense } from 'react';
import { Shield, Globe, Clock, CheckCircle, Loader2, Check, X, RefreshCw, Bot } from 'lucide-react';
import { db } from '@/lib/firebase';
import CreateRuleForm from '@/components/CreateRuleForm';

function RulesContent() {
  const { user } = useAuth();
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !db) return;

    const q = query(
      collection(db, "rules"), 
      where("siteId", "!=", "") 
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const allRules = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const sortedRules = allRules.sort((a: any, b: any) => {
        const tA = a.createdAt?.seconds || 0;
        const tB = b.createdAt?.seconds || 0;
        return tB - tA;
      });
      setRules(sortedRules);
      setLoading(false);
    }, (error) => {
      console.error("Rules fetch error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const toggleRuleStatus = async (ruleId: string, siteId: string, currentStatus: boolean) => {
    setUpdating(ruleId);
    try {
      const res = await fetch('/api/rules/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ruleId, siteId, isActive: !currentStatus })
      });
      if (!res.ok) throw new Error("Failed to update rule");
    } catch (e) {
      alert("Error updating rule status.");
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader2 className="animate-spin text-terminal" size={48} />
      </div>
    );
  }

  return (
    <main className="p-4 md:p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 font-serif">Rules Engine</h1>
        <p className="text-gray-400 text-sm md:text-base">Define manual overrides for specific paths.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-100 flex items-center gap-2 font-serif">
              <Shield className="text-gray-400" size={20} />
              Deployment Console
            </h2>
            <span className="text-xs text-gray-500 bg-gray-900 px-2 py-1 rounded border border-gray-800 font-mono">
              {rules.length} Total Rules
            </span>
          </div>

          <div className="space-y-4">
            {rules.length === 0 ? (
              <div className="p-8 border border-dashed border-gray-800 rounded-xl text-center bg-gray-900/10">
                <p className="text-gray-500 italic">No rules defined yet.</p>
              </div>
            ) : (
              rules.map((rule) => {
                let payload: any = { title: '', metaDescription: '' };
                try { payload = JSON.parse(rule.payload); } catch (e) {}

                return (
                  <div key={rule.id} className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-all group shadow-sm">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-900 rounded-lg text-gray-400 group-hover:text-terminal transition-colors">
                          <Globe size={18} />
                        </div>
                        <div>
                          <h3 className="font-mono text-sm text-terminal font-bold">{rule.targetPath}</h3>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${
                          rule.isActive 
                            ? 'bg-green-900/20 text-green-400 border-green-900/50' 
                            : 'bg-yellow-900/20 text-yellow-400 border-yellow-900/50'
                        }`}>
                          {rule.isActive ? 'Active' : 'Draft'}
                        </span>
                        
                        <button
                          onClick={() => toggleRuleStatus(rule.id, rule.siteId, rule.isActive)}
                          disabled={updating === rule.id}
                          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                            rule.isActive 
                              ? 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20' 
                              : 'bg-terminal/10 text-terminal border border-terminal/20 hover:bg-terminal/20'
                          }`}
                        >
                          {updating === rule.id ? <RefreshCw className="animate-spin" size={12} /> : rule.isActive ? <X size={12} /> : <Check size={12} />}
                          {rule.isActive ? 'Deactivate' : 'Approve'}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm bg-[#111] p-3 rounded-lg border border-gray-800/50">
                      <div>
                        <span className="text-gray-500 text-[10px] uppercase tracking-wider block mb-1">Title Override</span>
                        <p className="text-gray-300 line-clamp-1 font-medium">{payload.title || 'None'}</p>
                      </div>
                      <div>
                        <span className="text-gray-500 text-[10px] uppercase tracking-wider block mb-1">Meta Override</span>
                        <p className="text-gray-300 line-clamp-1">{payload.metaDescription || payload.metaDesc || 'None'}</p>
                      </div>
                    </div>

                    {payload.reasoning && (
                      <div className="mt-3 p-3 bg-blue-500/5 border border-blue-500/10 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <Bot size={12} className="text-blue-400" />
                          <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">AI Strategic Reasoning</span>
                        </div>
                        <p className="text-[11px] text-gray-400 leading-relaxed italic">
                          {payload.reasoning}
                        </p>
                      </div>
                    )}

                    <div className="mt-3 flex items-center gap-4 text-[10px] font-bold uppercase tracking-tighter text-gray-600">
                      <div className="flex items-center gap-1">
                        <Clock size={12} />
                        {rule.createdAt?.toDate?.() ? rule.createdAt.toDate().toLocaleDateString() : 'Just now'}
                      </div>
                      <div className="flex items-center gap-1">
                        <CheckCircle size={12} />
                        {(rule.confidence * 100).toFixed(0)}% AI Confidence
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="space-y-6">
           <CreateRuleForm />
        </div>
      </div>
    </main>
  );
}

export default function RulesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-terminal" size={48} />
      </div>
    }>
      <RulesContent />
    </Suspense>
  );
}
