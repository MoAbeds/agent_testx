'use client';

import { useState, useEffect } from 'react';
import { CheckCircle2, Circle, ArrowRight, Zap, Shield, BrainCircuit, Globe, Loader2 } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

export default function OnboardingChecklist({ user, sites }: { user: any, sites: any[] }) {
  const router = useRouter();
  const [completedSteps, setCompletedCompletedSteps] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // 1. Calculate progress based on real data
  const hasSite = sites.length > 0;
  const hasAgent = sites.some(s => s.lastAgentHandshake); // We should track this in the site doc
  const hasDeepDive = sites.some(s => s.industryDeepDive);
  const hasRules = sites.some(s => s.hasActiveRules); // We should track this too

  const steps = [
    {
      id: 'site',
      title: 'Connect Your First Domain',
      description: 'Add the website you want Mojo to protect.',
      completed: hasSite,
      action: () => {
        const event = new CustomEvent('mojo:open-add-site');
        window.dispatchEvent(event);
      },
      icon: Globe
    },
    {
      id: 'agent',
      title: 'Deploy Mojo Agent',
      description: 'Install the WP plugin or NPM library to bridge your site.',
      completed: hasAgent,
      action: () => router.push('/dashboard/install'),
      icon: Zap
    },
    {
      id: 'deep-dive',
      title: 'Run Industry Deep Dive',
      description: 'Tell Mojo about your business to build a strategy.',
      completed: hasDeepDive,
      action: () => router.push('/dashboard/guardian'),
      icon: Shield
    },
    {
      id: 'brain',
      title: 'Activate Mojo Brain',
      description: 'Deploy your first AI-powered SEO optimizations.',
      completed: !!(hasDeepDive && hasSite), // Simplified for now
      action: () => router.push('/dashboard/guardian'),
      icon: BrainCircuit
    }
  ];

  const progress = Math.round((steps.filter(s => s.completed).length / steps.length) * 100);

  if (progress === 100) return null;

  const handleDismiss = async () => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, "users", user.uid), { onboardingDismissed: true });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#0a0a0a] border border-terminal/20 rounded-2xl overflow-hidden shadow-2xl shadow-terminal/5 animate-in fade-in slide-in-from-top-4 duration-700">
      <div className="p-6 border-b border-gray-800 bg-terminal/[0.02] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2 font-serif">
            <Zap className="text-terminal" size={20} />
            Getting Started with Mojo
          </h2>
          <p className="text-gray-500 text-xs mt-1">Complete these steps to unlock full autonomous SEO protection.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex-1 md:w-48">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1.5">
              <span>Setup Progress</span>
              <span className="text-terminal">{progress}%</span>
            </div>
            <div className="h-1.5 w-full bg-gray-900 rounded-full overflow-hidden">
              <div 
                className="h-full bg-terminal transition-all duration-1000 shadow-[0_0_10px_#22c55e]" 
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          {progress === 100 && (
            <button 
              onClick={handleDismiss}
              disabled={loading}
              className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white transition-colors"
            >
              {loading ? <Loader2 className="animate-spin" size={12} /> : 'Dismiss'}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-gray-800">
        {steps.map((step, i) => (
          <div 
            key={step.id}
            onClick={step.action}
            className={`p-6 cursor-pointer transition-all hover:bg-white/[0.02] group relative ${step.completed ? 'opacity-60' : ''}`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-2 rounded-lg border ${step.completed ? 'bg-terminal/10 border-terminal/30 text-terminal' : 'bg-gray-900 border-gray-800 text-gray-500 group-hover:border-gray-700'}`}>
                <step.icon size={18} />
              </div>
              {step.completed ? (
                <CheckCircle2 className="text-terminal" size={18} />
              ) : (
                <Circle className="text-gray-800" size={18} />
              )}
            </div>
            <h3 className={`text-sm font-bold mb-1 ${step.completed ? 'text-gray-400' : 'text-white'}`}>{step.title}</h3>
            <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{step.description}</p>
            {!step.completed && (
              <div className="mt-4 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-terminal opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-10px] group-hover:translate-x-0">
                Setup Now <ArrowRight size={12} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
