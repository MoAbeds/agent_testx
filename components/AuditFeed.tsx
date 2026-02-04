'use client';

import { useState, useEffect } from 'react';
import { History, RotateCcw, Check, RefreshCw } from 'lucide-react';
import { useAuth } from '@/lib/hooks';

interface Event {
  id: string;
  type: string;
  path: string;
  details: string | null;
  occurredAt: any;
  siteId: string;
}

export default function AuditFeed({ initialEvents, siteId }: { initialEvents: Event[], siteId: string }) {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [undoing, setUndoing] = useState<string | null>(null);

  // Sync state when props change
  useEffect(() => {
    // 🔒 THE ULTIMATE GUARD: Never allow data into state if it doesn't match the current siteId
    // This stops "ghost" data from appearing during transitions.
    if (initialEvents && initialEvents.length > 0 && siteId) {
      const filtered = initialEvents.filter(e => e.siteId === siteId);
      setEvents(filtered);
    } else {
      setEvents([]);
    }
  }, [initialEvents, siteId]);

  const undoAction = async (eventId: string, details: string | null) => {
    if (!details) return;
    try {
      const parsed = JSON.parse(details);
      const ruleId = parsed.ruleId;
      if (!ruleId) return;

      setUndoing(eventId);
      const res = await fetch('/api/agent/undo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId, ruleId })
      });
      
      const data = await res.json();
      if (data.success) {
        setEvents(prev => prev.map(e => e.id === eventId ? { ...e, type: 'UNDO_ACTION' } : e));
      }
    } catch (e) {
    } finally {
      setUndoing(null);
    }
  };

  return (
    <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl overflow-hidden shadow-sm">
      <div className="bg-gray-900/50 p-4 border-b border-gray-800 flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-200 flex items-center gap-2">
          <History size={16} className="text-gray-400" />
          Audit Trail
        </h3>
        <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Secure Feed</span>
      </div>

      <div className="divide-y divide-gray-800/50 max-h-[500px] overflow-y-auto">
        {events.length === 0 ? (
          <div className="p-8 text-center text-gray-600 text-sm italic">
            No events discovered for this site.
          </div>
        ) : (
          events.map((event) => {
            const isAutoFix = event.type === 'AUTO_FIX';
            const isUndo = event.type === 'UNDO_ACTION';
            
            let time = '--:--';
            try {
              const date = event.occurredAt?.toDate ? event.occurredAt.toDate() : new Date(event.occurredAt);
              time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            } catch(e) {}

            return (
              <div key={event.id} className="p-4 hover:bg-white/[0.02] transition-colors flex items-center justify-between group">
                <div className="flex gap-4">
                  <div className="text-[10px] font-mono text-gray-600 mt-1 w-12">{time}</div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                        isUndo ? 'bg-gray-900 text-gray-500 border-gray-800' :
                        isAutoFix ? 'bg-green-900/10 text-green-400 border-green-900/30' : 
                        'bg-blue-900/10 text-blue-400 border-blue-900/30'
                      }`}>
                        {event.type.replace('_', ' ')}
                      </span>
                      <span className="text-xs font-mono text-gray-400 truncate max-w-[100px]">{event.path}</span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {event.details ? (JSON.parse(typeof event.details === 'string' ? event.details : JSON.stringify(event.details)).message || 'Processed') : 'Action processed'}
                    </p>
                  </div>
                </div>

                {isAutoFix && !isUndo && (
                  <button 
                    onClick={() => undoAction(event.id, event.details)}
                    disabled={undoing === event.id}
                    className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-gray-500 hover:text-red-400 transition-colors bg-gray-900 px-2 py-1 rounded border border-gray-800 opacity-0 group-hover:opacity-100"
                  >
                    {undoing === event.id ? <RefreshCw className="animate-spin" size={12} /> : <RotateCcw size={12} />}
                    Undo
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
