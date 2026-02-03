'use client';

import { useState } from 'react';
import { auth, useAuth } from '@/lib/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { Plug, RefreshCw, MessageSquare } from 'lucide-react';

export default function IntegrationsPage() {
  const { user, loading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleConnect = async () => {
    setIsLoading(true);
    const provider = new GoogleAuthProvider();
    // Scope for Search Console
    provider.addScope('https://www.googleapis.com/auth/webmasters.readonly');
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Integrations</h1>
        <p className="text-gray-400">Connect external services and APIs</p>
      </header>

      <div className="grid gap-6 max-w-3xl">
        {/* Google Search Console */}
        <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between p-6">
            <div className="flex items-center gap-4">
              <div className="bg-white p-2.5 rounded-lg">
                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-100">Google Search Console</h3>
                <p className="text-sm text-gray-500">Required for keyword analysis & search performance</p>
              </div>
            </div>

            <div>
              {!loading && user ? (
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-2 text-sm text-terminal bg-terminal/10 px-3 py-1.5 rounded-full border border-terminal/20">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    Connected
                  </span>
                </div>
              ) : (
                <button
                  onClick={handleConnect}
                  disabled={isLoading || loading}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-black font-medium rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  {isLoading ? <RefreshCw className="animate-spin" size={18} /> : 'Connect'}
                </button>
              )}
            </div>
          </div>
          {!loading && user?.email && (
            <div className="px-6 pb-4 pt-0">
              <p className="text-xs text-gray-500">Signed in as {user.email}</p>
            </div>
          )}
        </div>

        {/* Slack - Coming Soon */}
        <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl overflow-hidden opacity-60">
          <div className="flex items-center justify-between p-6">
            <div className="flex items-center gap-4">
              <div className="bg-[#4A154B] p-2.5 rounded-lg">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-100">Slack</h3>
                <p className="text-sm text-gray-500">Get notified when the agent optimizes your pages</p>
              </div>
            </div>

            <span className="text-xs font-medium text-gray-500 bg-gray-800 px-3 py-1.5 rounded-full">
              Coming Soon
            </span>
          </div>
        </div>

        {/* Discord - Coming Soon */}
        <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl overflow-hidden opacity-60">
          <div className="flex items-center justify-between p-6">
            <div className="flex items-center gap-4">
              <div className="bg-[#5865F2] p-2.5 rounded-lg">
                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-100">Discord</h3>
                <p className="text-sm text-gray-500">Post optimization reports to your server</p>
              </div>
            </div>

            <span className="text-xs font-medium text-gray-500 bg-gray-800 px-3 py-1.5 rounded-full">
              Coming Soon
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
