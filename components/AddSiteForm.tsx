'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Loader2, Check, Copy, X, Shield } from 'lucide-react';
import { useAuth } from '@/lib/hooks';

export default function AddSiteForm() {
  const router = useRouter();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{ domain: string; apiKey: string; platform?: string; sslActive?: boolean } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return setError('You must be logged in');
    
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/sites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain, userId: user.uid }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error('[AddSite] API Error:', data.error);
        throw new Error(data.error || 'Failed to create site');
      }

      setSuccess({ 
        domain: data.site.domain, 
        apiKey: data.apiKey,
        platform: data.site.platform,
        sslActive: data.site.sslActive
      });
      setDomain('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyApiKey = async () => {
    if (success?.apiKey) {
      await navigator.clipboard.writeText(success.apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setDomain('');
    setError('');
    if (success) {
      setSuccess(null);
      router.refresh();
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-terminal/10 hover:bg-terminal/20 border border-terminal/30 text-terminal text-sm font-medium transition-all hover:border-terminal/50"
      >
        <Plus size={16} />
        Add Site
      </button>
    );
  }

  if (success) {
    return (
      <div className="p-4 rounded-lg bg-[#111] border border-terminal/30 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-terminal">
            <Check size={16} />
            <span className="font-medium">Site Created!</span>
          </div>
          <button onClick={handleClose} className="text-gray-500 hover:text-gray-300">
            <X size={16} />
          </button>
        </div>
        
        <div className="space-y-2">
          <p className="text-gray-400 text-sm">
            <span className="text-gray-300 font-medium">{success.domain}</span> has been added.
          </p>

          <div className={`p-3 rounded-lg border ${success.sslActive ? 'bg-green-900/10 border-green-500/20' : 'bg-red-900/10 border-red-500/20'}`}>
            <p className={`text-xs font-medium flex items-center gap-2 ${success.sslActive ? 'text-terminal' : 'text-red-400'}`}>
              <Shield size={14} />
              SSL Status: {success.sslActive ? 'Active & Secure' : 'Inactive (Action Required)'}
            </p>
          </div>

          {success.platform === 'wordpress' && (
            <div className="p-3 bg-blue-900/10 border border-blue-500/20 rounded-lg space-y-3">
              <p className="text-xs text-blue-400 font-medium flex items-center gap-2">
                <Plus size={14} />
                WordPress Detected: Please setup the Mojo Guardian WordPress plugin.
              </p>
              <button 
                onClick={() => router.push('/dashboard/install')}
                className="w-full py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 text-[10px] font-black uppercase tracking-widest rounded border border-blue-500/30 transition-all"
              >
                Go to Setup Guide
              </button>
            </div>
          )}

          {success.platform === 'nextjs' && (
            <div className="p-3 bg-terminal/5 border border-terminal/20 rounded-lg space-y-3">
              <p className="text-xs text-terminal font-medium flex items-center gap-2">
                <Plus size={14} />
                Next.js Detected: Please setup our Next.js library.
              </p>
              <button 
                onClick={() => router.push('/dashboard/install')}
                className="w-full py-1.5 bg-terminal/10 hover:bg-terminal/20 text-terminal text-[10px] font-black uppercase tracking-widest rounded border border-terminal/30 transition-all"
              >
                Go to Setup Guide
              </button>
            </div>
          )}
          
          <div className="space-y-1">
            <label className="text-xs text-gray-500">API Key (save this - shown only once)</label>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 bg-[#0a0a0a] border border-gray-800 rounded text-xs text-terminal font-mono truncate">
                {success.apiKey}
              </code>
              <button
                onClick={handleCopyApiKey}
                className="p-2 rounded bg-[#0a0a0a] border border-gray-800 hover:border-gray-700 text-gray-400 hover:text-gray-200 transition-colors"
                title="Copy API Key"
              >
                {copied ? <Check size={14} className="text-terminal" /> : <Copy size={14} />}
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={handleClose}
          className="w-full px-4 py-2 rounded-lg bg-terminal/10 hover:bg-terminal/20 border border-terminal/30 text-terminal text-sm font-medium transition-all"
        >
          Done
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 rounded-lg bg-[#111] border border-gray-800 space-y-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-300">Add New Site</span>
        <button 
          type="button" 
          onClick={handleClose} 
          className="text-gray-500 hover:text-gray-300"
        >
          <X size={16} />
        </button>
      </div>
      
      <div>
        <input
          type="text"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          placeholder="example.com"
          className="w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-gray-800 text-gray-200 placeholder-gray-600 text-sm focus:outline-none focus:border-terminal/50 focus:ring-1 focus:ring-terminal/20 transition-colors"
          disabled={loading}
          autoFocus
        />
      </div>

      {error && (
        <p className="text-red-400 text-xs">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading || !domain.trim()}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-terminal hover:bg-terminal/90 text-black text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            Creating...
          </>
        ) : (
          'Create Site'
        )}
      </button>
    </form>
  );
}
