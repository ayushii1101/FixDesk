import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Loader2, Search } from "lucide-react";

import { useAuth } from "@/lib/auth";
import { useComplaints, useStaff } from "@/lib/queries";
import {
  PRIORITIES,
  PRIORITY_LABEL,
  STATUSES,
  STATUS_LABEL,
  complaintCode,
  formatDate,
} from "@/lib/omcms";
import { PriorityBadge, StatusBadge } from "@/components/Badges";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type SearchParams = { status?: string | undefined };

export const Route = createFileRoute("/_app/complaints/")({
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    status: typeof search["status"] === "string" ? search["status"] : undefined,
  }),

  head: () => ({
    meta: [
      { title: "Complaints | OMCMS Indian Oil" },
      {
        name: "description",
        content:
          "Browse, filter and search office maintenance complaints by status, priority, category and assigned maintenance staff.",
      },
      { property: "og:title", content: "Complaints | OMCMS Indian Oil" },
      {
        property: "og:description",
        content: "Browse, filter and search office maintenance complaints.",
      },
    ],
  }),
  component: ComplaintsPage,
});

const ALL = "ALL";

function ComplaintsPage() {
  const { isManager } = useAuth();
  const { status: statusParam } = Route.useSearch();
  const { data, isLoading, error } = useComplaints();
  const { data: staff = [] } = useStaff();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(statusParam ?? ALL);
  const [priority, setPriority] = useState(ALL);
  const [category, setCategory] = useState(ALL);
  const [assignee, setAssignee] = useState(ALL);
  const [fromDate, setFromDate] = useState("");

  const effectiveStatus = statusParam ?? status;

  const rows = data ?? [];
  const categories = useMemo(
    () => Array.from(new Set(rows.map((r) => r.categories?.name ?? "Other"))).sort(),
    [rows],
  );

  const filtered = rows.filter((r) => {
    const term = search.trim().toLowerCase();
    if (
      term &&
      !complaintCode(r.complaint_no).toLowerCase().includes(term) &&
      !String(r.complaint_no).includes(term) &&
      !r.problem_type.toLowerCase().includes(term) &&
      !(r.profiles?.name ?? "").toLowerCase().includes(term) &&
      !r.location.toLowerCase().includes(term)
    ) {
      return false;
    }
    if (effectiveStatus !== ALL && r.status !== effectiveStatus) return false;
    if (priority !== ALL && r.priority !== priority) return false;
    if (category !== ALL && (r.categories?.name ?? "Other") !== category) return false;
    if (assignee !== ALL) {
      if (assignee === "UNASSIGNED" ? r.assigned_staff_id !== null : String(r.assigned_staff_id) !== assignee)
        return false;
    }
    if (fromDate && new Date(r.created_at) < new Date(fromDate)) return false;
    return true;
  });

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

  const title = isManager
    ? statusParam
      ? `${STATUS_LABEL[statusParam as keyof typeof STATUS_LABEL] ?? "All"} Complaints`
      : "All Complaints"
    : "My Complaints";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {filtered.length} of {rows.length} complaint{rows.length === 1 ? "" : "s"} shown.
          </p>
        </div>
        {!isManager && (
          <Button asChild>
            <Link to="/report">Report a Problem</Link>
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="grid gap-4 py-5 sm:grid-cols-2 lg:grid-cols-6">
          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-xs">Search</Label>
            <div className="relative">
              <Search className="absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
              <Input
                className="pl-8"
                placeholder="Complaint ID, problem, location"
                value={search}
                maxLength={80}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Status</Label>
            <Select value={effectiveStatus} onValueChange={setStatus} disabled={!!statusParam}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All statuses</SelectItem>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Priority</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All priorities</SelectItem>
                {PRIORITIES.map((p) => (
                  <SelectItem key={p} value={p}>
                    {PRIORITY_LABEL[p]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {isManager && (
            <>
              <div className="space-y-1.5">
                <Label className="text-xs">Assigned Staff</Label>
                <Select value={assignee} onValueChange={setAssignee}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>Anyone</SelectItem>
                    <SelectItem value="UNASSIGNED">Unassigned</SelectItem>
                    {staff.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Submitted from</Label>
                <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="px-0 py-0">
          {filtered.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">No complaints match these filters.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    {isManager && <TableHead>Employee</TableHead>}
                    <TableHead>Category</TableHead>
                    <TableHead>Problem</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Assigned Staff</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r) => (
                    <TableRow key={r.id} className={r.priority === "HIGH" && r.status !== "RESOLVED" ? "bg-destructive/5" : ""}>
                      <TableCell className="font-medium whitespace-nowrap">
                        {complaintCode(r.complaint_no)}
                      </TableCell>
                      {isManager && (
                        <TableCell>
                          <span className="block">{r.profiles?.name ?? "—"}</span>
                          <span className="block text-xs text-muted-foreground">
                            {r.profiles?.department}
                          </span>
                        </TableCell>
                      )}
                      <TableCell>{r.categories?.name ?? "—"}</TableCell>
                      <TableCell>{r.problem_type}</TableCell>
                      <TableCell className="text-muted-foreground">{r.location}</TableCell>
                      <TableCell>
                        <PriorityBadge priority={r.priority} />
                      </TableCell>
                      <TableCell>{r.maintenance_staff?.name ?? "Not assigned"}</TableCell>
                      <TableCell>
                        <StatusBadge status={r.status} />
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {formatDate(r.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="outline" size="sm">
                          <Link to="/complaints/$id" params={{ id: r.id }}>
                            {isManager ? "Manage" : "View Details"}
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
