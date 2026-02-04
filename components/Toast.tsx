'use client';

import { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  duration?: number;
  onClose: () => void;
}

export default function Toast({ message, type, duration = 5000, onClose }: ToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300); // Wait for fade-out animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const bgColor = type === 'success' ? 'bg-green-900/90' : type === 'error' ? 'bg-red-900/90' : 'bg-blue-900/90';
  const borderColor = type === 'success' ? 'border-green-500/50' : type === 'error' ? 'border-red-500/50' : 'border-blue-500/50';
  const Icon = type === 'success' ? CheckCircle : type === 'error' ? AlertCircle : Info;

  return (
    <div className={`fixed bottom-8 right-8 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-xl transition-all duration-300 ${bgColor} ${borderColor} ${visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
      <Icon size={18} className={type === 'success' ? 'text-green-400' : type === 'error' ? 'text-red-400' : 'text-blue-400'} />
      <span className="text-sm font-medium text-white">{message}</span>
      <button onClick={() => setVisible(false)} className="ml-2 text-white/50 hover:text-white transition-colors">
        <X size={14} />
      </button>
    </div>
  );
}
