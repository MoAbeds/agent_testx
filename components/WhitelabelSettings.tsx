'use client';

import { useState } from 'react';
import { Palette, Image as ImageIcon, Building, Save, Loader2, Check, Globe } from 'lucide-react';
import Toast from './Toast';

export default function WhitelabelSettings({ user }: { user: any }) {
  const [logoUrl, setLogoUrl] = useState(user?.whitelabel?.logoUrl || '');
  const [agencyName, setAgencyName] = useState(user?.whitelabel?.agencyName || '');
  const [primaryColor, setPrimaryColor] = useState(user?.whitelabel?.primaryColor || '#22c55e');
  const [customDomain, setCustomDomain] = useState(user?.whitelabel?.customDomain || '');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/settings/whitelabel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          logoUrl,
          agencyName,
          primaryColor,
          customDomain
        })
      });
      if (res.ok) {
        setNotification({ message: 'Whitelabel settings updated!', type: 'success' });
      } else {
        throw new Error('Failed to update');
      }
    } catch (e) {
      setNotification({ message: 'Update failed.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl overflow-hidden">
      <div className="p-6 border-b border-gray-800 bg-gray-900/50">
        <h2 className="text-lg font-semibold text-gray-100 flex items-center gap-2">
          <Palette className="text-terminal" size={20} />
          Whitelabel Branding
        </h2>
        <p className="text-xs text-gray-500 mt-1">Customize the dashboard and reports for your clients.</p>
      </div>
      
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-black tracking-widest text-gray-500 flex items-center gap-2">
              <Building size={12} /> Agency Name
            </label>
            <input
              type="text"
              value={agencyName}
              onChange={(e) => setAgencyName(e.target.value)}
              placeholder="e.g. Pharaoh Marketing"
              className="w-full bg-black border border-gray-800 rounded-lg px-4 py-2.5 text-sm text-white focus:border-terminal outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase font-black tracking-widest text-gray-500 flex items-center gap-2">
              <ImageIcon size={12} /> Logo URL
            </label>
            <input
              type="text"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://example.com/logo.svg"
              className="w-full bg-black border border-gray-800 rounded-lg px-4 py-2.5 text-sm text-white focus:border-terminal outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-black tracking-widest text-gray-500 flex items-center gap-2">
              <Globe size={12} /> Custom Domain
            </label>
            <input
              type="text"
              value={customDomain}
              onChange={(e) => setCustomDomain(e.target.value)}
              placeholder="seo.youragency.com"
              className="w-full bg-black border border-gray-800 rounded-lg px-4 py-2.5 text-sm text-white focus:border-terminal outline-none"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] uppercase font-black tracking-widest text-gray-500 flex items-center gap-2">
            <Palette size={12} /> Primary Theme Color
          </label>
          <div className="flex items-center gap-4">
            <input
              type="color"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="w-12 h-12 rounded-lg bg-black border border-gray-800 cursor-pointer overflow-hidden"
            />
            <code className="text-xs font-mono text-gray-400">{primaryColor}</code>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 bg-terminal hover:bg-green-400 text-black font-black uppercase tracking-widest text-xs rounded-xl transition-all"
        >
          {loading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
          Save Branding
        </button>
      </div>

      {notification && <Toast message={notification.message} type={notification.type} onClose={() => setNotification(null)} />}
    </div>
  );
}
