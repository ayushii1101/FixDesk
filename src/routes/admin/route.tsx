import { useEffect, useState } from "react";
import { Link, Outlet, createFileRoute, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LayoutDashboard, Loader2, LogOut, Menu, Tags, UserCog, Users } from "lucide-react";

import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/admin")({
  ssr: false,
  component: AdminLayout,
});

type NavItem = { label: string; to: string; icon: typeof Users };

function AdminLayout() {
  const { loading, session, profile, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (loading) return;
    if (!session && !isLoginPage) {
      void navigate({ to: "/admin/login", replace: true });
    } else if (session && !isAdmin && !isLoginPage) {
      void navigate({ to: "/dashboard", replace: true });
    } else if (session && isAdmin && isLoginPage) {
      void navigate({ to: "/admin", replace: true });
    }
  }, [loading, session, isAdmin, isLoginPage, navigate]);

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Dedicated admin login page renders standalone, outside the admin chrome.
  if (isLoginPage) return <Outlet />;

  if (!session || !isAdmin) return null;

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await signOut();
    void navigate({ to: "/admin/login", replace: true });
  }

  const nav: NavItem[] = [{ label: "Dashboard", to: "/admin", icon: LayoutDashboard }];

  const managementNav: NavItem[] = [
    { label: "Users", to: "/admin/users", icon: Users },
    { label: "Managers", to: "/admin/managers", icon: UserCog },
    { label: "Categories", to: "/admin/categories", icon: Tags },
  ];

  function renderLinks(items: NavItem[], mobile: boolean) {
    const base = cn(
      "rounded-md px-3 py-2 text-sm font-medium transition-colors",
      mobile
        ? "text-sidebar-foreground/85 hover:bg-sidebar-accent"
        : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground",
    );
    return items.map((item) => {
      const active = pathname === item.to;
      return (
        <Link
          key={item.label}
          to={item.to}
          onClick={mobile ? () => setOpen(false) : undefined}
          className={cn(base, active && "bg-sidebar-accent text-sidebar-foreground")}
        >
          <item.icon className="mr-2 inline size-4" />
          {item.label}
        </Link>
      );
    });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-sidebar-border bg-sidebar text-sidebar-foreground">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4">
          <Link to="/admin" className="flex items-center gap-3">
            <span className="grid size-9 place-items-center overflow-hidden rounded-md bg-accent">
              <img src="/logo.jpg" alt="Indian Oil" className="size-full object-contain" />
            </span>
            <span className="leading-tight">
              <span className="block text-sm font-semibold">System Administration</span>
              <span className="block text-[11px] text-sidebar-foreground/60">
                Fix Desk · Admin Panel
              </span>
            </span>
          </Link>

          <nav className="ml-6 hidden items-center gap-1 lg:flex">
            {renderLinks(nav, false)}
            <span className="mx-2 text-[10px] font-semibold tracking-[0.2em] text-sidebar-foreground/40 uppercase">
              Management
            </span>
            {renderLinks(managementNav, false)}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium">{profile?.name || "Administrator"}</p>
              <p className="text-[11px] text-sidebar-foreground/60">Administrator</p>
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
            {renderLinks([...nav, ...managementNav], true)}
          </nav>
        )}
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        <Outlet />
      </main>

      <Toaster position="top-right" />
    </div>
  );
}
