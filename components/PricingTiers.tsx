'use client';

import { Check, Zap, Shield, Rocket, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/lib/hooks';
import PayPalButton from './PayPalButton';

const PLANS = [
// ... rest of plans ...
];

export default function PricingTiers() {
  const { user } = useAuth();
  const [selectedPlan, setSelectedSite] = useState<any>(null);

  const handleSuccess = (data: any) => {
    alert(`Subscription successful! Your account is being upgraded.`);
    window.location.href = '/dashboard';
  };

  const handleError = (err: any) => {
    console.error(err);
    alert('Payment failed. Please try again.');
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
      {PLANS.map((plan) => (
        <div key={plan.tier} className={`relative p-8 rounded-2xl border transition-all hover:translate-y-[-4px] ${plan.isPopular ? 'bg-gradient-to-b from-gray-900 to-black border-terminal shadow-2xl shadow-terminal/10' : 'bg-[#0d0d0d] border-gray-800'}`}>
          {/* ... existing card UI ... */}

          <div className="mt-auto">
            {selectedPlan?.tier === plan.tier ? (
              <div className="animate-in fade-in zoom-in duration-300">
                {user ? (
                  <PayPalButton 
                    planId={plan.id} 
                    userId={user.uid}
                    onSuccess={handleSuccess} 
                    onError={handleError} 
                  />
                ) : (
                  <button 
                    onClick={() => window.location.href = '/login'}
                    className="w-full py-4 rounded-xl bg-white text-black font-bold"
                  >
                    Login to Subscribe
                  </button>
                )}
                <button 
                  onClick={() => setSelectedSite(null)}
                  className="w-full mt-2 text-xs text-gray-500 hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setSelectedSite(plan)}
                className={`block w-full py-4 rounded-xl text-center font-bold transition-all ${plan.isPopular ? 'bg-terminal text-black hover:bg-green-400' : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'}`}
              >
                Choose {plan.tier}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
