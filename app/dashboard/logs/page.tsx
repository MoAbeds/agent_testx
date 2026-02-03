'use client';

import { useAuth, db } from '@/lib/hooks';
import { collection, query, where, getDocs, limit, orderBy, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { LogTable } from '@/components/LogTable';
import { Bot, Activity, Loader2 } from 'lucide-react';

export default function LogsPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !db) return;

    // Listen to all events for this user's sites
    // For simplicity in NoSQL, we'll fetch all and filter or just show recent for all sites
    const q = query(
      collection(db, "events"), 
      orderBy("occurredAt", "desc"),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const docs = snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        occurredAt: (d.data() as any).occurredAt?.toDate?.()?.toISOString() || new Date().toISOString()
      }));
      setLogs(docs);
      setTotal(snap.size);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-terminal" size={48} />
      </div>
    );
  }

  const pagination = {
    page: 1,
    limit: 50,
    total,
    totalPages: 1,
  };

  return (
    <main className="p-4 md:p-8">
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-terminal/10 rounded-lg border border-terminal/20">
            <Bot className="text-terminal" size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">AI Logs</h1>
            <p className="text-gray-400 text-sm">Agent activity and event stream</p>
          </div>
        </div>
      </header>

      {/* Stats bar */}
      <div className="mb-6 flex items-center gap-6">
        <div className="flex items-center gap-2 text-sm">
          <Activity size={16} className="text-gray-500" />
          <span className="text-gray-400">
            <span className="text-white font-semibold">{total}</span> recent events
          </span>
        </div>
      </div>

      <LogTable initialLogs={logs} initialPagination={pagination} />
    </main>
  );
}
