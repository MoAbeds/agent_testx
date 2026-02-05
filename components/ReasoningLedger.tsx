'use client';

import { Terminal, Shield, ArrowRight, BrainCircuit, Info } from 'lucide-react';

export default function ReasoningLedger({ rules }: { rules: any[] }) {
  if (!rules || rules.length === 0) return null;

  return (
    <div className="bg-[#0a0a0a] border border-gray-800 rounded-2xl overflow-hidden mt-10 shadow-sm">
      <div className="p-6 border-b border-gray-800 bg-gray-900/30 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2 font-serif">
            <BrainCircuit className="text-purple-400" size={24} />
            The Reasoning Ledger
          </h2>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black mt-1">First-Principles Logic for Every Deployment</p>
        </div>
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20">
          <Shield size={12} className="text-purple-400" />
          <span className="text-[10px] font-black text-purple-400 uppercase">Verification Active</span>
        </div>
      </div>

      <div className="divide-y divide-gray-800">
        {rules.map((rule, i) => (
          <div key={i} className="p-6 hover:bg-white/[0.01] transition-all group">
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="lg:w-1/3">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] font-mono text-terminal bg-terminal/10 px-2 py-0.5 rounded border border-terminal/20 uppercase font-black">
                    {rule.type || 'SEO_FIX'}
                  </span>
                  <span className="text-xs font-mono text-gray-500 truncate">{rule.targetPath}</span>
                </div>
                <div className="p-4 bg-black border border-gray-800 rounded-xl relative overflow-hidden group-hover:border-purple-500/30 transition-colors">
                  <div className="absolute top-0 right-0 p-2 opacity-20">
                    <Terminal size={40} className="text-gray-800" />
                  </div>
                  <p className="text-xs font-mono text-gray-400 leading-relaxed italic relative z-10">
                    "{rule.reasoning || 'Strategic optimization based on competitive density and keyword authority.'}"
                  </p>
                </div>
              </div>

              <div className="lg:w-2/3 flex flex-col justify-center">
                <div className="flex items-center gap-4 text-gray-600 mb-4">
                  <div className="h-px flex-1 bg-gray-800" />
                  <span className="text-[10px] uppercase font-black tracking-tighter">Optimization Payload</span>
                  <div className="h-px flex-1 bg-gray-800" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <PayloadItem label="Confidence" value={`${Math.round((rule.confidence || 0.95) * 100)}%`} />
                  <PayloadItem label="Deployment" value="Automatic" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PayloadItem({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-900/20 border border-gray-800/50 rounded-lg">
      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{label}</span>
      <span className="text-xs font-mono text-white font-bold">{value}</span>
    </div>
  );
}
