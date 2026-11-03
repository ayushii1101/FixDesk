import { createFileRoute, Link } from "@tanstack/react-router";
import { FileText, Loader2, Tags, UserCog, Users, User2 } from "lucide-react";

import { useAuth } from "@/lib/auth";
import { useAdminUsers, useCategories } from "@/lib/queries";
import { RoleBadge } from "@/components/RoleBadge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard | Fix Desk" },
      {
        name: "description",
        content:
          "Fix Desk system administration - manage users, managers and complaint categories.",
      },
    ],
  }),
  component: AdminDashboardPage,
});

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof Users;
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between py-5">
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {label}
          </p>
          <p className="mt-1 text-3xl font-bold tabular-nums">{value}</p>
        </div>
        <span className="grid size-11 place-items-center rounded-md bg-primary/10 text-primary">
          <Icon className="size-5" />
        </span>
      </CardContent>
    </Card>
  );
}

function ManagementCard({
  title,
  description,
  count,
  to,
  icon: Icon,
}: {
  title: string;
  description: string;
  count: number;
  to: "/admin/users" | "/admin/managers" | "/admin/categories";
  icon: typeof Users;
}) {
  return (
    <Card className="flex flex-col justify-between">
      <CardContent className="py-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold">{title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          </div>
          <span className="grid size-10 shrink-0 place-items-center rounded-md bg-info/12 text-info">
            <Icon className="size-5" />
          </span>
        </div>
        <p className="mt-4 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {count} total
        </p>
        <Button asChild variant="outline" size="sm" className="mt-3 w-full">
          <Link to={to}>Open</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function AdminDashboardPage() {
  const { profile } = useAuth();
  const { rows, isLoading, error } = useAdminUsers();
  const { data: categories = [] } = useCategories();

  if (isLoading) {
    return (
      <div className="grid place-items-center py-24">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Failed to load admin data. {error.message}</AlertDescription>
      </Alert>
    );
  }

  const totalUsers = rows.length;
  const employees = rows.filter((r) => r.role === "EMPLOYEE").length;
  const managers = rows.filter((r) => r.role === "MANAGER").length;
  const categoriesCount = categories.length;
  const recentUsers = rows.slice(0, 6);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Welcome{profile?.name ? `, ${profile.name}` : ""}. System overview and user management at
          a glance.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Users" value={totalUsers} icon={Users} />
        <StatCard label="Employees" value={employees} icon={User2} />
        <StatCard label="Managers" value={managers} icon={UserCog} />
        <StatCard label="Categories" value={categoriesCount} icon={Tags} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Management</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <ManagementCard
            title="User Management"
            description="Search, edit, promote and remove accounts."
            count={totalUsers}
            to="/admin/users"
            icon={Users}
          />
          <ManagementCard
            title="Manager Management"
            description="Add, edit, demote or delete managers."
            count={managers}
            to="/admin/managers"
            icon={UserCog}
          />
          <ManagementCard
            title="Category Management"
            description="Organise complaint categories."
            count={categoriesCount}
            to="/admin/categories"
            icon={Tags}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Recent Users</CardTitle>
          <Button asChild variant="outline" size="sm">
            <Link to="/admin/users">View all</Link>
          </Button>
        </CardHeader>
        <CardContent className="px-0">
          {recentUsers.length === 0 ? (
            <p className="px-6 pb-2 text-sm text-muted-foreground">No users have registered yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Registered</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentUsers.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell className="text-muted-foreground">{u.email}</TableCell>
                      <TableCell>{u.department || "—"}</TableCell>
                      <TableCell>
                        <RoleBadge role={u.role} />
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {new Date(u.created_at).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <p className="flex items-start gap-2 text-xs text-muted-foreground">
        <FileText className="mt-0.5 size-4 shrink-0" />
        <span>
          System management only. Complaint assignment, priority, status and resolution remain with
          the facility manager.
        </span>
      </p>
    </div>
  );
}
