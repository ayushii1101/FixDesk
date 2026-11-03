import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertTriangle, CheckCircle2, Clock, FileText, Loader2, Wrench } from "lucide-react";

import { useAuth } from "@/lib/auth";
import { useComplaints } from "@/lib/queries";
import { complaintCode, formatDate } from "@/lib/omcms";
import { PriorityBadge, StatusBadge } from "@/components/Badges";
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

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard | OMCMS Indian Oil" },
      {
        name: "description",
        content:
          "Complaint summary dashboard for Indian Oil office maintenance — pending, in progress and resolved counts with recent activity.",
      },
      { property: "og:title", content: "Dashboard | OMCMS Indian Oil" },
      {
        property: "og:description",
        content: "Complaint summary dashboard for Indian Oil office maintenance.",
      },
    ],
  }),
  component: DashboardPage,
});

function SummaryCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: typeof Clock;
  tone: string;
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
        <span className={`grid size-11 place-items-center rounded-md ${tone}`}>
          <Icon className="size-5" />
        </span>
      </CardContent>
    </Card>
  );
}

function DashboardPage() {
  const { profile, isManager } = useAuth();
  const { data, isLoading, error } = useComplaints();

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
        <AlertDescription>Failed to load complaints. {error.message}</AlertDescription>
      </Alert>
    );
  }

  const rows = data ?? [];
  const count = (fn: (r: (typeof rows)[number]) => boolean) => rows.filter(fn).length;
  const recent = rows.slice(0, 8);

  const categoryData = Object.entries(
    rows.reduce<Record<string, number>>((acc, r) => {
      const key = r.categories?.name ?? "Other";
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {}),
  ).map(([name, total]) => ({ name, total }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{isManager ? "Manager Dashboard" : "Dashboard"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Welcome{profile?.name ? `, ${profile.name}` : ""}. Here is the current complaint
            summary.
          </p>
        </div>
        {!isManager && (
          <Button asChild>
            <Link to="/report">Report a Problem</Link>
          </Button>
        )}
      </div>

      <div
        className={`grid gap-4 sm:grid-cols-2 ${isManager ? "lg:grid-cols-5" : "lg:grid-cols-4"}`}
      >
        <SummaryCard
          label="Total Complaints"
          value={rows.length}
          icon={FileText}
          tone="bg-primary/10 text-primary"
        />
        <SummaryCard
          label="Pending"
          value={count((r) => r.status === "PENDING")}
          icon={Clock}
          tone="bg-warning/15 text-warning-foreground"
        />
        <SummaryCard
          label="In Progress"
          value={count((r) => r.status === "IN_PROGRESS")}
          icon={Wrench}
          tone="bg-info/12 text-info"
        />
        <SummaryCard
          label="Resolved"
          value={count((r) => r.status === "RESOLVED")}
          icon={CheckCircle2}
          tone="bg-success/12 text-success"
        />
        {isManager && (
          <SummaryCard
            label="High Priority"
            value={count((r) => r.priority === "HIGH" && r.status !== "RESOLVED")}
            icon={AlertTriangle}
            tone="bg-destructive/10 text-destructive"
          />
        )}
      </div>

      {isManager && categoryData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Complaints by Category</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} margin={{ left: -20, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  interval={0}
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                <ChartTooltip
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="total" fill="var(--chart-1)" radius={[4, 4, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Recent Complaints</CardTitle>
          <Button asChild variant="outline" size="sm">
            <Link to="/complaints">View all</Link>
          </Button>
        </CardHeader>
        <CardContent className="px-0">
          {recent.length === 0 ? (
            <p className="px-6 pb-2 text-sm text-muted-foreground">No complaints yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Complaint ID</TableHead>
                    {isManager && <TableHead>Employee</TableHead>}
                    <TableHead>Category</TableHead>
                    <TableHead>Problem</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">View</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recent.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{complaintCode(r.complaint_no)}</TableCell>
                      {isManager && <TableCell>{r.profiles?.name ?? "—"}</TableCell>}
                      <TableCell>{r.categories?.name ?? "—"}</TableCell>
                      <TableCell>{r.problem_type}</TableCell>
                      <TableCell className="text-muted-foreground">{r.location}</TableCell>
                      <TableCell>
                        <PriorityBadge priority={r.priority} />
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={r.status} />
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {formatDate(r.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="ghost" size="sm">
                          <Link to="/complaints/$id" params={{ id: r.id }}>
                            Details
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
