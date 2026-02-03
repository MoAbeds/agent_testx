'use client';

import { Terminal, ShieldCheck, Zap } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

// Define the Event shape matching our API
interface AgentLog {
  id: string;
  type: string;
  path: string;
  details: string | null;
  occurredAt: string;
}

export default function TerminalFeed() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/agent/events');
      const data = await res.json();
      if (Array.isArray(data)) {
        setFeed(data.reverse()); 
      }
    } catch (e) {
      console.error("Failed to fetch logs", e);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [feed]);

  // ... (formatLog helper remains the same)

  return (
    <div className="bg-black border border-gray-800 rounded-lg overflow-hidden font-mono text-sm shadow-2xl shadow-green-900/10 h-[400px] flex flex-col">
      <div className="bg-gray-900 px-4 py-2 border-b border-gray-800 flex items-center justify-between">
        {/* ... header content remains the same ... */}
      </div>
      
      <div 
        ref={scrollRef}
        className="p-4 overflow-y-auto flex-1 space-y-2 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent"
      >
        {feed.length === 0 && <div className="text-gray-500 italic">Waiting for agent connection...</div>}
        {feed.map(formatLog)}
        <div className="animate-pulse text-terminal">_</div>
      </div>
    </div>
  );
}
