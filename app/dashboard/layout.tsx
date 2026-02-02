import { Sidebar } from '@/components/Sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#050505] flex flex-col lg:flex-row font-sans text-gray-100">
      <Sidebar />
      <div className="flex-1 pt-16 lg:pt-0 overflow-x-hidden">
        {children}
      </div>
    </div>
  );
}
