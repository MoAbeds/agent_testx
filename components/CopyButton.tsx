'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export default function CopyButton({ text, size = 16 }: { text: string, size?: number }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className={`flex items-center gap-2 ${copied ? 'text-terminal' : 'text-gray-400 hover:text-white'} transition-colors`}
    >
      {copied ? <Check size={size} /> : <Copy size={size} />}
      <span className="text-[10px] font-bold uppercase tracking-widest">{copied ? 'Copied' : 'Copy Code'}</span>
    </button>
  );
}
