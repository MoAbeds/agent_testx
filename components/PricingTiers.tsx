'use client';

import { Check, Zap, Shield, Rocket, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/lib/hooks';
import PayPalButton from './PayPalButton';

const PLANS = [
  {
    id: 'P-STARTER',
    tier: 'Starter',
    price: '$39',
    description: 'Perfect for small business owners and niche blogs.',
    features: ['1 Website', '100 AI Optimizations / mo', 'Real-time 404 Guardian', 'Standard Email Support'],
    icon: Zap,
  },
  {
    id: 'P-PRO',
    tier: 'Professional',
    price: '$129',
    description: 'Our most popular plan for scaling SaaS and E-commerce.',
    features: ['Unlimited Websites', '2,000 AI Optimizations / mo', 'Full Market Intelligence', 'Priority 404 Fixing', 'Premium Support'],
    isPopular: true,
    icon: Rocket,
  },
  {
    id: 'P-AGENCY',
    tier: 'Agency',
    price: '$499',
    description: 'Deep SEO infrastructure for agencies and high-traffic networks.',
    features: ['Unlimited Websites', '10,000 AI Optimizations / mo', 'White-label Reports', 'API Access', 'Dedicated SEO Architect'],
    icon: Shield,
  }
];

export default function PricingTiers() {
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<any>(null);

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
          {plan.isPopular && (
            <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-terminal text-black text-[10px] font-black uppercase px-3 py-1 rounded-full tracking-widest">
              Most Popular
            </span>
          )}
          
          <div className="mb-8">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${plan.isPopular ? 'bg-terminal/20 text-terminal' : 'bg-gray-800 text-gray-400'}`}>
              <plan.icon size={24} />
            </div>
            <h3 className="text-xl font-bold mb-2">{plan.tier}</h3>
            <div className="flex items-baseline gap-1 mb-4">
              <span className="text-4xl font-black">{plan.price}</span>
              <span className="text-gray-500 text-sm">/mo</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">{plan.description}</p>
          </div>

          <ul className="space-y-4 mb-8">
            {plan.features.map((feature: string, i: number) => (
              <li key={i} className="flex items-start gap-3 text-sm text-gray-300">
                <Check size={16} className="text-terminal shrink-0 mt-0.5" />
                {feature}
              </li>
            ))}
          </ul>

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
                  onClick={() => setSelectedPlan(null)}
                  className="w-full mt-2 text-xs text-gray-500 hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setSelectedPlan(plan)}
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
