'use client';

import { Sidebar } from '@/components/Sidebar';
import { useAuth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="animate-spin text-terminal" size={48} />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col lg:flex-row font-sans text-gray-100">
      <Sidebar />
      <div className="flex-1 pt-16 lg:pt-0 overflow-x-hidden">
        {children}
      </div>
    </div>
  );
}
