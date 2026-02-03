'use client';

import { auth } from '@/lib/firebase';
import { useAuth } from '@/lib/hooks';
import { signOut } from 'firebase/auth';
import { User, CreditCard, Mail, Shield, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const { user } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/');
  };

  return (
    <div className="p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-gray-400">Manage your account and preferences</p>
      </header>

      <div className="max-w-2xl space-y-6">
        {/* User Profile */}
        <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-gray-800 bg-gray-900/50 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-100 flex items-center gap-2">
              <User className="text-terminal" size={20} />
              Profile
            </h2>
            <button 
              onClick={handleSignOut}
              className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors"
            >
              <LogOut size={14} />
              Sign Out
            </button>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-terminal/30 to-terminal/10 border border-terminal/20 flex items-center justify-center">
                <User className="text-terminal" size={28} />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-100">
                  {user?.displayName || 'Admin User'}
                </h3>
                <p className="text-sm text-gray-500 flex items-center gap-1.5">
                  <Mail size={14} />
                  {user?.email || 'admin@example.com'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Subscription Plan */}
        <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-gray-800 bg-gray-900/50">
            <h2 className="text-lg font-semibold text-gray-100 flex items-center gap-2">
              <CreditCard className="text-terminal" size={20} />
              Subscription
            </h2>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-terminal bg-terminal/10 px-3 py-1.5 rounded-full border border-terminal/20">
                  <Shield size={14} />
                  Pro Plan
                </span>
              </div>
              <p className="text-gray-400 text-sm">$29/month</p>
            </div>
            <div className="space-y-2 text-sm text-gray-400">
              <p className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-terminal" />
                Unlimited sites
              </p>
              <p className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-terminal" />
                Priority AI optimization
              </p>
              <p className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-terminal" />
                Advanced analytics
              </p>
            </div>
            <button 
              onClick={() => window.location.href = '/pricing'}
              className="mt-4 w-full px-4 py-2.5 bg-[#111] hover:bg-[#161616] border border-gray-800 rounded-lg text-sm text-gray-300 transition-colors"
            >
              Manage Subscription
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
