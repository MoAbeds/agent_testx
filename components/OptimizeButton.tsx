'use client';

import { useState } from 'react';
import { Loader2, Wand2, CheckCircle, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface OptimizeButtonProps {
  pageId: string;
}

export default function OptimizeButton({ pageId }: OptimizeButtonProps) {
  const [status, setStatus] = useState<'idle' | 'optimizing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();

  const handleOptimize = async () => {
    setStatus('optimizing');
    setErrorMessage(null);

    try {
      const response = await fetch('/api/optimize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pageId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Optimization failed');
      }

      setStatus('success');
      
      // Wait briefly, then redirect (No browser popup)
      setTimeout(() => {
        router.push('/dashboard/rules');
      }, 800);
    } catch (error) {
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Optimization failed');
      
      // Reset to idle after 3 seconds
      setTimeout(() => {
        setStatus('idle');
        setErrorMessage(null);
      }, 3000);
    }
  };

  return (
    <div className="inline-flex flex-col items-center">
      <button
        onClick={handleOptimize}
        disabled={status === 'optimizing'}
        title="AI Auto-Optimize"
        className={`flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
          status === 'optimizing'
            ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30 cursor-wait'
            : status === 'success'
            ? 'bg-terminal/10 text-terminal border border-terminal/30'
            : status === 'error'
            ? 'bg-red-500/10 text-red-400 border border-red-500/30'
            : 'bg-purple-500/10 text-purple-400 border border-purple-500/30 hover:bg-purple-500/20 hover:border-purple-400/50'
        }`}
      >
        {status === 'optimizing' ? (
          <>
            <Loader2 size={12} className="animate-spin" />
            <span className="hidden sm:inline">Optimizing...</span>
          </>
        ) : status === 'success' ? (
          <>
            <CheckCircle size={12} />
            <span className="hidden sm:inline">Drafted!</span>
          </>
        ) : status === 'error' ? (
          <>
            <XCircle size={12} />
            <span className="hidden sm:inline">Failed</span>
          </>
        ) : (
          <>
            <Wand2 size={12} />
            <span className="hidden sm:inline">Optimize</span>
          </>
        )}
      </button>
      {errorMessage && (
        <p className="text-[10px] text-red-400 mt-1 text-center max-w-[100px] truncate" title={errorMessage}>
          {errorMessage}
        </p>
      )}
    </div>
  );
}
