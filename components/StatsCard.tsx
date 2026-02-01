import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string;
  change: string;
  icon: LucideIcon;
  trend: 'up' | 'down' | 'neutral';
}

export default function StatsCard({ title, value, change, icon: Icon, trend }: StatsCardProps) {
  return (
    <div className="bg-[#111] border border-gray-800 rounded-xl p-6 hover:border-terminal/50 transition-all duration-300 group hover:shadow-[0_0_15px_rgba(34,197,94,0.3)]">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-gray-900 rounded-lg group-hover:bg-terminal/10 transition-colors">
          <Icon className="text-gray-400 group-hover:text-terminal transition-colors" size={24} />
        </div>
        <span className={`text-xs px-2 py-1 rounded-full border ${
          trend === 'up' ? 'border-green-900 bg-green-900/20 text-green-400' : 
          trend === 'down' ? 'border-red-900 bg-red-900/20 text-red-400' :
          'border-gray-800 bg-gray-900 text-gray-400'
        }`}>
          {change}
        </span>
      </div>
      <h3 className="text-gray-400 text-sm font-medium mb-1">{title}</h3>
      <p className="text-3xl font-bold text-gray-100">{value}</p>
    </div>
  );
}
