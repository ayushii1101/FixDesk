import { useEffect, useState } from "react";
import { Link, Outlet, createFileRoute, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard,
  ListChecks,
  Loader2,
  LogOut,
  Menu,
  PlusCircle,
  Users,
} from "lucide-react";

import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app")({
  ssr: false,
  component: AppLayout,
});

type NavItem = { label: string; to: string; search?: Record<string, string>; icon: typeof Users };

function AppLayout() {
  const { loading, session, profile, role, isManager, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!loading && !session) {
      void navigate({ to: "/", replace: true });
    }
  }, [loading, session, navigate]);

  useEffect(() => {
    if (!loading && session && role === "ADMIN") {
      void navigate({ to: "/admin", replace: true });
    }
  }, [loading, session, role, navigate]);

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!session) return null;

  const employeeNav: NavItem[] = [
    { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
    { label: "Report Problem", to: "/report", icon: PlusCircle },
    { label: "My Complaints", to: "/complaints", icon: ListChecks },
  ];

  const managerNav: NavItem[] = [
    { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
    { label: "All Complaints", to: "/complaints", icon: ListChecks },
    { label: "Pending", to: "/complaints", search: { status: "PENDING" }, icon: ListChecks },
    {
      label: "In Progress",
      to: "/complaints",
      search: { status: "IN_PROGRESS" },
      icon: ListChecks,
    },
    { label: "Resolved", to: "/complaints", search: { status: "RESOLVED" }, icon: ListChecks },
    { label: "Maintenance Staff", to: "/staff", icon: Users },
  ];

  const nav = isManager ? managerNav : employeeNav;

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await signOut();
    void navigate({ to: "/", replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-sidebar-border bg-sidebar text-sidebar-foreground">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4">
          <Link to="/dashboard" className="flex items-center gap-3">
            <span className="grid size-9 place-items-center overflow-hidden rounded-md bg-accent">
              <img src="/logo.jpg" alt="Indian Oil" className="size-full object-contain" />
            </span>
            <span className="leading-tight">
              <span className="block text-sm font-semibold">Office Maintenance System</span>
              <span className="block text-[11px] text-sidebar-foreground/60">Fix Desk</span>
            </span>
          </Link>

          <nav className="ml-6 hidden items-center gap-1 lg:flex">
            {nav.map((item) => {
              const active = pathname === item.to && !item.search;

              return (
                <Link
                  key={item.label}
                  to={item.to}
                  search={item.search as never}
                  className={cn(
                    "rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground",
                    active && "bg-sidebar-accent text-sidebar-foreground",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium">{profile?.name || "User"}</p>
              <p className="text-[11px] text-sidebar-foreground/60">
                {role === "MANAGER" ? "Manager" : "Employee"}
                {profile?.department ? ` · ${profile.department}` : ""}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="border-sidebar-border bg-transparent text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
            >
              <LogOut className="size-4" />
              Logout
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-sidebar-foreground hover:bg-sidebar-accent lg:hidden"
              onClick={() => setOpen((v) => !v)}
              aria-label="Toggle navigation"
            >
              <Menu className="size-5" />
            </Button>
          </div>
        </div>

        {open && (
          <nav className="border-t border-sidebar-border px-4 pb-3 lg:hidden">
            {nav.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                search={item.search as never}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-sidebar-foreground/85 hover:bg-sidebar-accent"
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        )}
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
