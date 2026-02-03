'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Send, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/hooks';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export default function CreateRuleForm() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [siteId, setSiteId] = useState('');
  const [formData, setFormData] = useState({
    path: '',
    title: '',
    metaDescription: '',
  });

  useEffect(() => {
    if (!user || !db) return;
    // Get first site available for this user to associate the rule
    getDocs(query(collection(db, "sites"), where("userId", "==", user.uid)))
      .then(snap => {
        if (!snap.empty) setSiteId(snap.docs[0].id);
      });
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteId) return alert("Please add a site in the Overview page first.");
    setLoading(true);

    try {
      const res = await fetch('/api/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, siteId }),
      });

      if (!res.ok) throw new Error('Failed to create rule');

      setFormData({ path: '', title: '', metaDescription: '' });
      alert("Manual rule deployed successfully!");
    } catch (error) {
      console.error(error);
      alert('Failed to create rule');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-[#0a0a0a] border border-gray-800 p-6 rounded-xl">
      <div>
        <h2 className="text-xl font-bold text-gray-100 mb-1 font-serif">New Rule</h2>
        <p className="text-sm text-gray-400 mb-4">Override metadata for a specific path.</p>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Target Path</label>
        <input
          type="text"
          placeholder="/about"
          className="w-full bg-[#111] border border-gray-800 rounded-lg px-4 py-2 text-gray-200 focus:outline-none focus:border-terminal/50 focus:ring-1 focus:ring-terminal/50 transition-all placeholder:text-gray-600"
          value={formData.path}
          onChange={(e) => setFormData({ ...formData, path: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">New Title</label>
        <input
          type="text"
          placeholder="About Us | My Awesome Site"
          className="w-full bg-[#111] border border-gray-800 rounded-lg px-4 py-2 text-gray-200 focus:outline-none focus:border-terminal/50 focus:ring-1 focus:ring-terminal/50 transition-all placeholder:text-gray-600"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">New Meta Description</label>
        <textarea
          placeholder="Learn more about our team and mission..."
          className="w-full bg-[#111] border border-gray-800 rounded-lg px-4 py-2 text-gray-200 focus:outline-none focus:border-terminal/50 focus:ring-1 focus:ring-terminal/50 transition-all placeholder:text-gray-600 h-24 resize-none"
          value={formData.metaDescription}
          onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
          required
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-terminal hover:bg-green-400 text-black font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
        Deploy Rule
      </button>
    </form>
  );
}
