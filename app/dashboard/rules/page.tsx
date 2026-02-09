'use client';

import { useAuth } from '@/lib/hooks';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { useEffect, useState, Suspense } from 'react';
import { Shield, Globe, Clock, CheckCircle, Loader2, Check, X, RefreshCw, Bot, Edit, Save } from 'lucide-react';
import { db } from '@/lib/firebase';
import CreateRuleForm from '@/components/CreateRuleForm';

function RulesContent() {
  const { user } = useAuth();
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ title: string, metaDesc: string }>({ title: '', metaDesc: '' });
  const [userSiteIds, setUserSiteIds] = useState<string[]>([]);

  // 1. Fetch sites belonging ONLY to this user first
  useEffect(() => {
    if (!user) return;
    const fetchUserSites = async () => {
      const q = query(collection(db, "sites"), where("userId", "==", user.uid));
      const snap = await getDocs(q);
      const ids = snap.docs.map(d => d.id);
      setUserSiteIds(ids);
    };
    fetchUserSites();
  }, [user]);

  // 2. Fetch rules only for the user's sites
  useEffect(() => {
    if (!user || !db || userSiteIds.length === 0) {
      if (userSiteIds.length === 0) setLoading(false);
      return;
    }

    // SECURITY: Use 'in' operator to filter rules by user's specific site IDs
    // This prevents global data leakage.
    const q = query(
      collection(db, "rules"), 
      where("siteId", "in", userSiteIds.slice(0, 10)) 
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const filteredRules = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const sortedRules = filteredRules.sort((a: any, b: any) => {
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
  }, [user, userSiteIds]);

  const toggleRuleStatus = async (ruleId: string, siteId: string, currentStatus: boolean) => {
    setUpdating(ruleId);
    try {
      const res = await fetch('/api/rules/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ruleId, siteId, isActive: !currentStatus, userId: user?.uid })
      });
      if (!res.ok) throw new Error("Failed to update rule");
    } catch (e) {
      alert("Error updating rule status.");
    } finally {
      setUpdating(null);
    }
  };

  const startEditing = (rule: any) => {
    let payload: any = {};
    try { payload = JSON.parse(rule.payload); } catch (e) {}
    setEditForm({
      title: payload.title || '',
      metaDesc: payload.metaDescription || payload.metaDesc || ''
    });
    setEditingId(rule.id);
  };

  const saveRule = async (rule: any) => {
    setUpdating(rule.id);
    try {
      let currentPayload: any = {};
      try { currentPayload = JSON.parse(rule.payload); } catch (e) {}
      
      const newPayload = {
        ...currentPayload,
        title: editForm.title,
        metaDesc: editForm.metaDesc, // Standardize on metaDesc
        metaDescription: editForm.metaDesc // Legacy support
      };

      const res = await fetch('/api/rules/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ruleId: rule.id, 
          siteId: rule.siteId, 
          userId: user?.uid,
          payload: newPayload
        })
      });
      if (!res.ok) throw new Error("Failed to save");
      setEditingId(null);
    } catch (e) {
      alert("Error saving rule.");
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
    <main className="p-4 md:p-8 max-w-7xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 font-serif">Rules Engine</h1>
        <p className="text-gray-400 text-sm md:text-base">Manage autonomous redirects and SEO injections.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-100 flex items-center gap-2 font-serif">
              <Shield className="text-gray-400" size={20} />
              Deployment Console
            </h2>
            <span className="text-xs text-gray-500 bg-gray-900 px-2 py-1 rounded border border-gray-800 font-mono">
              {rules.length} Active Rules
            </span>
          </div>

          <div className="space-y-4">
            {rules.length === 0 ? (
              <div className="p-12 border border-dashed border-gray-800 rounded-2xl text-center bg-gray-900/10">
                <Clock className="mx-auto text-gray-700 mb-4" size={40} />
                <p className="text-gray-500 italic">No rules discovered for your sites.</p>
              </div>
            ) : (
              rules.map((rule) => {
                let payload: any = { title: '', metaDescription: '' };
                try { payload = JSON.parse(rule.payload); } catch (e) {}
                const isEditing = editingId === rule.id;

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
                        {!isEditing && (
                          <>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${
                              rule.isActive 
                                ? 'bg-green-900/20 text-green-400 border-green-900/50' 
                                : 'bg-yellow-900/20 text-yellow-400 border-yellow-900/50'
                            }`}>
                              {rule.isActive ? 'Active' : 'Draft'}
                            </span>
                            
                            <button
                              onClick={() => startEditing(rule)}
                              className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-gray-800 transition-colors"
                              title="Edit Rule"
                            >
                              <Edit size={14} />
                            </button>

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
                          </>
                        )}
                        {isEditing && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-1.5 rounded-lg text-red-400 hover:bg-red-900/20 transition-colors"
                              title="Cancel"
                            >
                              <X size={14} />
                            </button>
                            <button
                              onClick={() => saveRule(rule)}
                              disabled={updating === rule.id}
                              className="flex items-center gap-1.5 px-3 py-1 bg-terminal text-black rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-green-400 transition-colors"
                            >
                              {updating === rule.id ? <RefreshCw className="animate-spin" size={12} /> : <Save size={12} />}
                              Save
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm bg-[#111] p-3 rounded-lg border border-gray-800/50">
                      <div>
                        <span className="text-gray-500 text-[10px] uppercase tracking-wider block mb-1">Title Override</span>
                        {isEditing ? (
                          <input 
                            type="text" 
                            className="w-full bg-black border border-gray-800 rounded px-2 py-1 text-white text-xs focus:border-terminal outline-none"
                            value={editForm.title}
                            onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                          />
                        ) : (
                          <p className="text-gray-300 line-clamp-1 font-medium">{payload.title || 'None'}</p>
                        )}
                      </div>
                      <div>
                        <span className="text-gray-500 text-[10px] uppercase tracking-wider block mb-1">Meta Override</span>
                        {isEditing ? (
                          <textarea 
                            className="w-full bg-black border border-gray-800 rounded px-2 py-1 text-white text-xs focus:border-terminal outline-none"
                            rows={2}
                            value={editForm.metaDesc}
                            onChange={(e) => setEditForm({...editForm, metaDesc: e.target.value})}
                          />
                        ) : (
                          <p className="text-gray-300 line-clamp-2">{payload.metaDescription || payload.metaDesc || 'None'}</p>
                        )}
                      </div>
                    </div>

                    {!isEditing && payload.reasoning && (
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
                        {(rule.confidence * 100 || 95).toFixed(0)}% AI Confidence
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
