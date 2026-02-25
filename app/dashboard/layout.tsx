import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/ui/layout/app-sidebar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      {/* Sidebar sekarang warnanya sama dengan background */}
      <AppSidebar />

      <SidebarInset className="bg-background text-foreground border-l border-border">
        <header className="flex h-16 shrink-0 items-center gap-2 px-6 sticky top-0 z-10 bg-(--background)/90 backdrop-blur-xl border-b border-border">
          <SidebarTrigger />
          <div className="h-4 w-px bg-white/10 mx-2" />
          <span className="text-xs font-bold tracking-[0.2em] uppercase opacity-70">
            Dashboard
          </span>
        </header>

        <main className="p-6">
          <div className="max-w-7xl mx-auto space-y-6">{children}</div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
