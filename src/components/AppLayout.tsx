// UPDATED with OfflineStatus banner
import { ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, FolderKanban, ClipboardList, Activity, FileBarChart, Users, LogOut, HardHat, Menu } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { ROLE_LABEL } from "@/lib/types";
import { OfflineStatus } from "@/components/OfflineStatus";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "engineer", "supervisor"] },
  { to: "/projects", label: "Projects", icon: FolderKanban, roles: ["admin", "engineer", "supervisor"] },
  { to: "/daily-updates", label: "Daily Updates", icon: ClipboardList, roles: ["admin", "engineer", "supervisor"] },
  { to: "/activity", label: "Activity Log", icon: Activity, roles: ["admin", "engineer", "supervisor"] },
  { to: "/reports", label: "Reports", icon: FileBarChart, roles: ["admin", "engineer", "supervisor"] },
  { to: "/users", label: "Users", icon: Users, roles: ["admin", "supervisor"] },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className="hidden lg:flex flex-col w-64 bg-sidebar border-r">
        <div className="p-4 font-bold">SiteTrack</div>
        <nav className="flex flex-col gap-2 p-3">
          {NAV.map(n => (
            <NavLink key={n.to} to={n.to} className="text-sm">{n.label}</NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col">
        <OfflineStatus />
        <main className="p-4">{children}</main>
      </div>
    </div>
  );
}
