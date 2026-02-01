import { prisma } from '@/lib/prisma';
import { LogTable } from '@/components/LogTable';
import { Bot, Activity } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function LogsPage() {
  const limit = 50;

  const [logs, total] = await Promise.all([
    prisma.agentEvent.findMany({
      take: limit,
      orderBy: { occurredAt: 'desc' },
      include: { site: { select: { domain: true } } },
    }),
    prisma.agentEvent.count(),
  ]);

  // Serialize dates for client component
  const serializedLogs = logs.map((log) => ({
    ...log,
    occurredAt: log.occurredAt.toISOString(),
  }));

  const pagination = {
    page: 1,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };

  return (
    <main className="p-8">
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
            <span className="text-white font-semibold">{total}</span> total events
          </span>
        </div>
      </div>

      <LogTable initialLogs={serializedLogs} initialPagination={pagination} />
    </main>
  );
}
