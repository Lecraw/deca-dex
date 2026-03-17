import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden relative">
      {/* Background gradient orbs for the whole app */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-[200px] right-[10%] w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,oklch(0.50_0.22_260/0.07)_0%,transparent_70%)] animate-float-slow" />
        <div className="absolute bottom-[10%] -left-[100px] w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,oklch(0.50_0.20_240/0.06)_0%,transparent_70%)] animate-float-slower" />
      </div>
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
