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

  const isFreePlan = !user?.plan || user.plan === 'FREE';

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
                <span className={`inline-flex items-center gap-2 text-sm font-semibold px-3 py-1.5 rounded-full border ${
                  isFreePlan ? 'text-gray-400 bg-gray-800/50 border-gray-700' : 'text-terminal bg-terminal/10 border-terminal/20'
                }`}>
                  <Shield size={14} />
                  {user?.plan || 'FREE'} Plan
                </span>
              </div>
              <p className="text-gray-400 text-sm">
                {user?.plan === 'STARTER' ? '$39/mo' : user?.plan === 'PRO' ? '$129/mo' : user?.plan === 'AGENCY' ? '$499/mo' : '$0/mo'}
              </p>
            </div>
            
            {isFreePlan ? (
              <div className="p-4 bg-yellow-500/5 border border-yellow-500/10 rounded-lg mb-4">
                <p className="text-xs text-yellow-500/80 leading-relaxed">
                  Your account is currently on the Free plan. To unlock Mojo Brain, SERP tracking, and autonomous SEO fixes, please upgrade to a Professional tier.
                </p>
              </div>
            ) : (
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
            )}

            <button 
              onClick={() => window.location.href = '/pricing'}
              className="mt-4 w-full px-4 py-2.5 bg-terminal text-black hover:bg-green-400 rounded-lg text-sm font-bold transition-all"
            >
              {isFreePlan ? 'Upgrade Now' : 'Manage Subscription'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
