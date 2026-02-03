'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, ExternalLink } from 'lucide-react';

interface Log {
  id: string;
  type: string;
  path: string;
  details: string | null;
  occurredAt: string;
  siteId?: string;
  domain?: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface LogTableProps {
  initialLogs: Log[];
  initialPagination: Pagination;
}

const TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  INTERCEPT: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
  ERROR: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30' },
  LATENCY: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/30' },
  INFO: { bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/30' },
  SUCCESS: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/30' },
  WARNING: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30' },
};

function getTypeStyle(type: string) {
  return TYPE_COLORS[type.toUpperCase()] || TYPE_COLORS.INFO;
}

function formatTime(isoString: string) {
  const d = new Date(isoString);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

function truncateJson(jsonStr: string | null, maxLen = 80): string {
  if (!jsonStr) return '—';
  try {
    const parsed = JSON.parse(jsonStr);
    const pretty = JSON.stringify(parsed);
    return pretty.length > maxLen ? pretty.slice(0, maxLen) + '…' : pretty;
  } catch {
    return jsonStr.length > maxLen ? jsonStr.slice(0, maxLen) + '…' : jsonStr;
  }
}

export function LogTable({ initialLogs, initialPagination }: LogTableProps) {
  const [logs, setLogs] = useState(initialLogs);
  const [pagination, setPagination] = useState(initialPagination);
  const [loading, setLoading] = useState(false);

  async function fetchPage(page: number) {
    if (page < 1 || page > pagination.totalPages) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/agent/logs?page=${page}`);
      const data = await res.json();
      setLogs(data.logs);
      setPagination(data.pagination);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-800 bg-[#0a0a0a]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-left">
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Time</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Type</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Path</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Details</th>
            </tr>
          </thead>
          <tbody className={loading ? 'opacity-50' : ''}>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center text-gray-600">
                  No logs recorded yet.
                </td>
              </tr>
            ) : (
              logs.map((log) => {
                const style = getTypeStyle(log.type);
                return (
                  <tr
                    key={log.id}
                    className="border-b border-gray-800/50 hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-gray-400">
                        <Clock size={14} className="text-gray-600" />
                        <span className="font-mono text-xs">{formatTime(log.occurredAt)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${style.bg} ${style.text} ${style.border}`}
                      >
                        {log.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <code className="font-mono text-xs text-terminal bg-terminal/5 px-2 py-0.5 rounded">
                          {log.path}
                        </code>
                        {log.domain && (
                          <span className="text-[10px] text-gray-600 flex items-center gap-1">
                            <ExternalLink size={10} />
                            {log.domain}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <code className="font-mono text-xs text-gray-500 block truncate" title={log.details || ''}>
                        {truncateJson(log.details)}
                      </code>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-1">
          <span className="text-xs text-gray-600">
            Showing {(pagination.page - 1) * pagination.limit + 1}–
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchPage(pagination.page - 1)}
              disabled={pagination.page <= 1 || loading}
              className="p-1.5 rounded-lg border border-gray-800 text-gray-400 hover:bg-white/5 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs text-gray-500 min-w-[60px] text-center">
              Page {pagination.page} / {pagination.totalPages}
            </span>
            <button
              onClick={() => fetchPage(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages || loading}
              className="p-1.5 rounded-lg border border-gray-800 text-gray-400 hover:bg-white/5 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
