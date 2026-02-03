'use client';

import { useState } from 'react';
import { Loader2, Search, CheckCircle, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ScanButtonProps {
  domain: string;
  apiKey?: string;
}

export default function ScanButton({ domain, apiKey }: ScanButtonProps) {
  const [status, setStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();

  const handleScan = async () => {
    setStatus('scanning');
    setErrorMessage(null);

    try {
      // Standard external crawler call (which now triggers the internal bridge server-side)
      const response = await fetch('/api/sites/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ domain }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Scan failed');
      }

      setStatus('success');
      alert(`Scan complete! Discovered and analyzed ${data.pagesCrawled} pages.`);
      router.refresh(); // Refresh the page to show new data
      
      // Reset to idle after 2 seconds
      setTimeout(() => setStatus('idle'), 2000);
    } catch (error) {
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Scan failed');
      
      // Reset to idle after 3 seconds
      setTimeout(() => {
        setStatus('idle');
        setErrorMessage(null);
      }, 3000);
    }
  };

  return (
    <div>
      <button
        onClick={handleScan}
        disabled={status === 'scanning'}
        className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
          status === 'scanning'
            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30 cursor-wait'
            : status === 'success'
            ? 'bg-terminal/10 text-terminal border border-terminal/30'
            : status === 'error'
            ? 'bg-red-500/10 text-red-400 border border-red-500/30'
            : 'bg-blue-500/10 text-blue-400 border border-blue-500/30 hover:bg-blue-500/20'
        }`}
      >
        {status === 'scanning' ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            Scanning...
          </>
        ) : status === 'success' ? (
          <>
            <CheckCircle size={14} />
            Scanned!
          </>
        ) : status === 'error' ? (
          <>
            <XCircle size={14} />
            Failed
          </>
        ) : (
          <>
            <Search size={14} />
            Scan Now
          </>
        )}
      </button>
      {errorMessage && (
        <p className="text-xs text-red-400 mt-1.5 text-center">{errorMessage}</p>
      )}
    </div>
  );
}
