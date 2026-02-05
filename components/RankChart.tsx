'use client';

import React from 'react';

interface HistoryPoint {
  position: number;
  date: string;
}

export default function RankChart({ history }: { history: HistoryPoint[] }) {
  if (!history || history.length < 2) {
    return (
      <div className="h-48 flex items-center justify-center border border-gray-800 rounded-2xl bg-gray-900/20 text-gray-600 text-xs italic">
        Need at least 2 data points to generate growth chart.
      </div>
    );
  }

  // Chart Dimensions
  const width = 600;
  const height = 200;
  const padding = 40;

  // Find Min/Max for scaling
  // Note: Rank is inverted (1 is top, 100 is bottom)
  const maxRank = Math.max(...history.map(p => p.position), 10);
  const minRank = Math.min(...history.map(p => p.position), 1);

  // SVG Helper
  const getX = (index: number) => (index / (history.length - 1)) * (width - padding * 2) + padding;
  const getY = (rank: number) => {
    // Invert the rank scale: 1 is near top, 100 is bottom
    const range = maxRank - minRank || 1;
    const normalized = (rank - minRank) / range;
    return normalized * (height - padding * 2) + padding;
  };

  // Generate Path
  const points = history.map((p, i) => `${getX(i)},${getY(p.position)}`).join(' ');

  return (
    <div className="bg-[#0a0a0a] border border-gray-800 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xs font-black uppercase tracking-widest text-gray-500">Ranking Velocity</h3>
        <div className="flex items-center gap-4">
           <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-terminal shadow-[0_0_5px_#22c55e]" />
              <span className="text-[10px] text-gray-400 uppercase font-bold">Google Rank</span>
           </div>
        </div>
      </div>

      <div className="relative overflow-hidden">
        <svg 
          viewBox={`0 0 ${width} ${height}`} 
          className="w-full h-auto overflow-visible"
          preserveAspectRatio="none"
        >
          {/* Grid Lines */}
          {[0, 0.5, 1].map((v, i) => (
            <line 
              key={i}
              x1={padding} 
              y1={v * (height - padding * 2) + padding} 
              x2={width - padding} 
              y2={v * (height - padding * 2) + padding} 
              stroke="#1f2937" 
              strokeWidth="1"
              strokeDasharray="4 4"
            />
          ))}

          {/* Connection Line */}
          <polyline
            points={points}
            fill="none"
            stroke="#22c55e"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="drop-shadow-[0_0_8px_rgba(34,197,94,0.4)]"
          />

          {/* Points */}
          {history.map((p, i) => (
            <g key={i} className="group">
              <circle
                cx={getX(i)}
                cy={getY(p.position)}
                r="4"
                fill="#000"
                stroke="#22c55e"
                strokeWidth="2"
              />
              {/* Tooltip-like Text */}
              <text
                x={getX(i)}
                y={getY(p.position) - 12}
                textAnchor="middle"
                className="fill-white text-[10px] font-mono font-bold opacity-0 group-hover:opacity-100 transition-opacity"
              >
                #{p.position}
              </text>
              {/* Date labels */}
              { (i === 0 || i === history.length - 1) && (
                <text
                  x={getX(i)}
                  y={height - 5}
                  textAnchor="middle"
                  className="fill-gray-600 text-[9px] font-bold uppercase tracking-tighter"
                >
                  {p.date}
                </text>
              )}
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}
