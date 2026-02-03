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
  const [feed, setFeed] = useState<AgentLog[]>([]);
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

  // Helper to format the message
  const formatLog = (log: AgentLog) => {
    const time = new Date(log.occurredAt).toLocaleTimeString();
    let msg = `[${log.type}] ${log.path}`;
    
    try {
        if (log.details) {
            const det = JSON.parse(log.details);
            if (det.message) msg += ` - ${det.message}`;
        }
    } catch(e) {}

    const isSuccess = log.type === 'SUCCESS' || log.type === 'REWRITE_META' || log.type === 'AUTO_FIX';
    const isWarning = log.type === 'WARNING' || log.type === 'ERROR' || log.type === '404_DETECTED' || log.type === 'SEO_GAP';

    return (
      <div key={log.id} className="flex gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
        <span className="text-gray-600 shrink-0">[{time}]</span>
        <span className={`
          ${isSuccess ? 'text-terminal' : ''}
          ${isWarning ? 'text-yellow-500' : ''}
          ${!isSuccess && !isWarning ? 'text-gray-300' : ''}
        `}>
          {isSuccess && '✔ '}
          {isWarning && '⚠ '}
          {msg}
        </span>
      </div>
    );
  };

  return (
    <div className="bg-black border border-gray-800 rounded-lg overflow-hidden font-mono text-sm shadow-2xl shadow-green-900/10 h-[400px] flex flex-col">
      <div className="bg-gray-900 px-4 py-2 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal size={16} className="text-terminal" />
          <span className="text-gray-400">root@mojo-guardian:~</span>
        </div>
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
          <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
        </div>
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
