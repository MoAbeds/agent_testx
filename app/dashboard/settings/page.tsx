'use client';

import { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { ShieldCheck, LogOut, ExternalLink, RefreshCw } from 'lucide-react';

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);

  const handleConnect = () => {
    setIsLoading(true);
    // Trigger Google Sign In with Search Console scope
    signIn('google', { callbackUrl: '/dashboard/settings' });
  };

  return (
    <div className="p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-gray-400">Manage integrations and agent configuration</p>
      </header>

      <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl overflow-hidden max-w-2xl">
        <div className="p-6 border-b border-gray-800 bg-gray-900/50">
          <h2 className="text-xl font-semibold text-gray-100 flex items-center gap-2">
            <ShieldCheck className="text-terminal" size={24} />
            Integrations
          </h2>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between p-4 bg-[#111] rounded-lg border border-gray-800">
            <div className="flex items-center gap-4">
              <div className="bg-white p-2 rounded-lg">
                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-medium text-gray-200">Google Search Console</h3>
                <p className="text-sm text-gray-500">Required for keyword analysis</p>
              </div>
            </div>

            <div>
              {status === 'authenticated' ? (
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-2 text-sm text-terminal bg-terminal/10 px-3 py-1.5 rounded-full border border-terminal/20">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    Connected as {session.user?.email}
                  </span>
                </div>
              ) : (
                <button
                  onClick={handleConnect}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-black font-medium rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  {isLoading ? <RefreshCw className="animate-spin" size={18} /> : 'Connect'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
