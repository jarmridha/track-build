import { ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, FolderKanban, ClipboardList, Activity, FileBarChart,
  Users, LogOut, HardHat, Menu
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { ROLE_LABEL } from "@/lib/types";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "engineer", "supervisor"] },
  { to: "/projects", label: "Projects", icon: FolderKanban, roles: ["admin", "engineer", "supervisor"] },
  { to: "/daily-updates", label: "Daily Updates", icon: ClipboardList, roles: ["admin", "engineer", "supervisor"] },
  { to: "/activity", label: "Activity Log", icon: Activity, roles: ["admin", "engineer", "supervisor"] },
  { to: "/reports", label: "Reports", icon: FileBarChart, roles: ["admin", "engineer", "supervisor"] },
  { to: "/users", label: "Users", icon: Users, roles: ["admin", "supervisor"] },
] as const;

function NavItems({ role, onClick }: { role: string | null; onClick?: () => void }) {
  return (
    <nav className="flex flex-col gap-1 px-3">
      {NAV.filter(n => !role || n.roles.includes(role as any)).map(item => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === "/"}
          onClick={onClick}
          className={({ isActive }) => cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
            isActive
              ? "bg-sidebar-primary text-sidebar-primary-foreground"
              : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          )}
        >
          <item.icon className="h-4 w-4" />
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}

export function AppLayout({ children }: { children: ReactNode }) {
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();

  const sidebarHeader = (
    <div className="flex items-center gap-2 px-5 py-5 border-b border-sidebar-border">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary">
        <HardHat className="h-5 w-5 text-sidebar-primary-foreground" />
      </div>
      <div>
        <div className="text-sm font-semibold text-sidebar-foreground">SiteTrack</div>
        <div className="text-[10px] uppercase tracking-wider text-sidebar-foreground/60">Project Manager</div>
      </div>
    </div>
  );

  const sidebarFooter = (
    <div className="border-t border-sidebar-border p-3 mt-auto">
      <div className="px-2 pb-3">
        <div className="text-sm font-medium text-sidebar-foreground truncate">{user?.email}</div>
        <div className="text-xs text-sidebar-foreground/60">{role ? ROLE_LABEL[role] : ""}</div>
      </div>
      <Button
        variant="ghost"
        className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        onClick={async () => { await signOut(); navigate("/auth"); }}
      >
        <LogOut className="mr-2 h-4 w-4" /> Sign out
      </Button>
    </div>
  );

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-sidebar border-r border-sidebar-border sticky top-0 h-screen">
        {sidebarHeader}
        <div className="flex-1 overflow-y-auto py-4">
          <NavItems role={role} />
        </div>
        {sidebarFooter}
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border bg-card px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
              <HardHat className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold">SiteTrack</span>
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon"><Menu className="h-5 w-5" /></Button>
            </SheetTrigger>
            <SheetContent side="left" className="bg-sidebar p-0 w-72 flex flex-col">
              {sidebarHeader}
              <div className="flex-1 overflow-y-auto py-4">
                <NavItems role={role} />
              </div>
              {sidebarFooter}
            </SheetContent>
          </Sheet>
        </header>

        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8 max-w-[1400px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
