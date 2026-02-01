'use client';

import { Search, Brain, Bot, Zap, Shield, BarChart3 } from 'lucide-react';

const features = [
  {
    icon: Search,
    title: 'The Scanner',
    description: 'Continuously crawls your site to detect broken links, missing meta tags, redirect chains, and orphaned pages before they hurt rankings.',
    accent: 'from-blue-500 to-cyan-500',
    glow: 'blue',
  },
  {
    icon: Brain,
    title: 'The Brain',
    description: 'Analyzes patterns across thousands of data points. Prioritizes fixes by revenue impact and predicts ranking changes before they happen.',
    accent: 'from-purple-500 to-pink-500',
    glow: 'purple',
  },
  {
    icon: Bot,
    title: 'The Agent',
    description: 'Automatically implements fixes—updates meta tags, creates redirects, and optimizes content. Ships changes while you sleep.',
    accent: 'from-terminal to-emerald-400',
    glow: 'green',
  },
];

export default function FeatureGrid() {
  return (
    <section id="features" className="relative py-32 px-6">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-[#0f0f0f] to-[#0a0a0a]" />
      
      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Three systems. <span className="text-terminal">One mission.</span>
          </h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            A fully autonomous SEO pipeline that works 24/7 to protect and grow your organic traffic.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} index={index} />
          ))}
        </div>

        {/* Bottom Stats */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6">
          <Stat value="50K+" label="Pages Scanned Daily" />
          <Stat value="12ms" label="Avg Detection Time" />
          <Stat value="99.9%" label="Uptime SLA" />
          <Stat value="3.2x" label="ROI Improvement" />
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ 
  icon: Icon, 
  title, 
  description, 
  accent,
  index 
}: { 
  icon: any; 
  title: string; 
  description: string;
  accent: string;
  glow: string;
  index: number;
}) {
  return (
    <div className="group relative">
      {/* Card */}
      <div className="relative h-full p-8 rounded-2xl border border-gray-800 bg-[#111111] hover:border-gray-700 transition-all duration-300 overflow-hidden">
        {/* Hover glow effect */}
        <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br ${accent} blur-3xl -z-10`} style={{ opacity: 0.05 }} />
        
        {/* Icon */}
        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${accent} p-[1px] mb-6`}>
          <div className="w-full h-full rounded-xl bg-[#111111] flex items-center justify-center">
            <Icon size={24} className="text-white" />
          </div>
        </div>

        {/* Content */}
        <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
        <p className="text-gray-500 leading-relaxed">{description}</p>

        {/* Number indicator */}
        <div className="absolute top-6 right-6 text-6xl font-bold text-gray-900 select-none">
          {String(index + 1).padStart(2, '0')}
        </div>
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center p-6 rounded-xl border border-gray-800/50 bg-[#0d0d0d]">
      <div className="text-2xl sm:text-3xl font-bold text-terminal mb-1">{value}</div>
      <div className="text-sm text-gray-600">{label}</div>
    </div>
  );
}
