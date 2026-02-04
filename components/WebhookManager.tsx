'use client';

import { useState, useEffect } from 'react';
import { Webhook, Plus, Trash2, CheckCircle, RefreshCw, Globe, Loader2 } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

export default function WebhookManager({ siteId }: { siteId: string }) {
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!siteId || !db) return;
    const q = query(collection(db, "webhooks"), where("siteId", "==", siteId));
    return onSnapshot(q, (snap) => {
      setWebhooks(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
  }, [siteId]);

  const addWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.startsWith('http')) return alert("Please enter a valid URL (starting with http/https)");
    setAdding(true);
    try {
      await fetch('/api/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId, url, events: ['AUTO_FIX', '404_DETECTED', 'SEO_GAP'] })
      });
      setUrl('');
    } catch (e) {
      alert("Failed to add webhook.");
    } finally {
      setAdding(false);
    }
  };

  const deleteWebhook = async (id: string) => {
    if (!confirm("Remove this webhook?")) return;
    try {
      await fetch('/api/webhooks', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhookId: id })
      });
    } catch (e) {
      alert("Failed to delete.");
    }
  };

  return (
    <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl overflow-hidden shadow-sm">
      <div className="p-6 border-b border-gray-800 bg-gray-900/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400 border border-purple-500/20">
            <Webhook size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-100 uppercase text-xs tracking-widest">Outbound Webhooks</h3>
            <p className="text-[10px] text-gray-500">Push real-time events to external platforms (Zapier, Slack, Make)</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Form */}
        <form onSubmit={addWebhook} className="flex gap-2">
          <input 
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://your-endpoint.com/webhook"
            className="flex-1 bg-black border border-gray-800 rounded-lg px-4 py-2 text-xs text-white focus:border-terminal outline-none transition-all"
            required
          />
          <button 
            type="submit" 
            disabled={adding}
            className="bg-terminal hover:bg-green-400 text-black px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2"
          >
            {adding ? <Loader2 className="animate-spin" size={14} /> : <Plus size={14} />}
            Add
          </button>
        </form>

        {/* List */}
        <div className="space-y-3">
          {loading ? (
            <div className="py-4 flex justify-center"><Loader2 className="animate-spin text-terminal" size={20} /></div>
          ) : webhooks.length === 0 ? (
            <p className="text-center py-4 text-xs text-gray-600 italic">No webhooks configured.</p>
          ) : (
            webhooks.map((wh) => (
              <div key={wh.id} className="flex items-center justify-between p-3 bg-black border border-gray-800 rounded-lg group hover:border-gray-700 transition-all">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-2 h-2 rounded-full bg-terminal animate-pulse shadow-[0_0_5px_#22c55e]" />
                  <span className="text-[11px] font-mono text-gray-300 truncate">{wh.url}</span>
                </div>
                <button 
                  onClick={() => deleteWebhook(wh.id)}
                  className="text-gray-600 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
