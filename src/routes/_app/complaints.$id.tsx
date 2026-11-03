import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, Loader2, Save } from "lucide-react";

import { useAuth } from "@/lib/auth";
import { useComplaint, useComplaintHistory, useStaff, useUpdateComplaint } from "@/lib/queries";
import {
  PRIORITIES,
  PRIORITY_LABEL,
  STATUSES,
  STATUS_LABEL,
  complaintCode,
  formatDateTime,
} from "@/lib/omcms";
import type { Priority, Status } from "@/lib/omcms";
import { PriorityBadge, StatusBadge } from "@/components/Badges";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_app/complaints/$id")({
  head: () => ({
    meta: [
      { title: "Complaint Details | OMCMS Indian Oil" },
      {
        name: "description",
        content:
          "View full complaint details — problem description, location, priority, assigned maintenance staff, activity history and resolution remarks.",
      },
      { property: "og:title", content: "Complaint Details | OMCMS Indian Oil" },
      {
        property: "og:description",
        content: "View full complaint details, activity history and resolution remarks.",
      },
    ],
  }),
  component: ComplaintDetailsPage,
});

const UNASSIGNED = "UNASSIGNED";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
      <div className="mt-1 text-sm">{children}</div>
    </div>
  );
}

function ComplaintDetailsPage() {
  const { id } = Route.useParams();
  const { isManager } = useAuth();
  const { data: complaint, isLoading, error } = useComplaint(id);
  const { data: history = [] } = useComplaintHistory(id);
  const { data: staff = [] } = useStaff();
  const update = useUpdateComplaint();

  const [priority, setPriority] = useState<Priority>("MEDIUM");
  const [status, setStatus] = useState<Status>("PENDING");
  const [assigned, setAssigned] = useState<string>(UNASSIGNED);
  const [remarks, setRemarks] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!complaint) return;
    setPriority(complaint.priority);
    setStatus(complaint.status);
    setAssigned(complaint.assigned_staff_id ? String(complaint.assigned_staff_id) : UNASSIGNED);
    setRemarks(complaint.resolution_remarks ?? "");
  }, [complaint]);

  if (isLoading) {
    return (
      <div className="grid place-items-center py-24">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !complaint) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertDescription>{error?.message ?? "Complaint not found."}</AlertDescription>
        </Alert>
        <Button asChild variant="outline">
          <Link to="/complaints">Back to complaints</Link>
        </Button>
      </div>
    );
  }

  async function save(markResolved: boolean) {
    setMessage(null);
    setFormError(null);
    const nextStatus: Status = markResolved ? "RESOLVED" : status;
    if (nextStatus === "RESOLVED" && !remarks.trim()) {
      setFormError("Please add resolution remarks before resolving the complaint.");
      return;
    }
    if (nextStatus === "IN_PROGRESS" && assigned === UNASSIGNED) {
      setFormError("Assign a maintenance staff member before moving to In Progress.");
      return;
    }
    try {
      await update.mutateAsync({
        id,
        priority,
        status: nextStatus,
        assigned_staff_id: assigned === UNASSIGNED ? null : Number(assigned),
        resolution_remarks: remarks.trim() ? remarks.trim().slice(0, 1000) : null,
      });
      setStatus(nextStatus);
      setMessage(
        markResolved ? "Complaint marked as resolved." : "Complaint updated successfully.",
      );
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not update the complaint.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon">
            <Link to="/complaints">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Complaint {complaintCode(complaint.complaint_no)}</h1>
            <p className="text-sm text-muted-foreground">
              {complaint.categories?.name} · {complaint.problem_type}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <PriorityBadge priority={complaint.priority} />
          <StatusBadge status={complaint.status} />
        </div>
      </div>

      {message && (
        <Alert className="border-success/40 bg-success/10">
          <AlertDescription className="text-success">{message}</AlertDescription>
        </Alert>
      )}
      {formError && (
        <Alert variant="destructive">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Complaint Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Employee Name">{complaint.profiles?.name ?? "—"}</Field>
              <Field label="Department">{complaint.profiles?.department || "—"}</Field>
              <Field label="Category">{complaint.categories?.name ?? "—"}</Field>
              <Field label="Problem Type">{complaint.problem_type}</Field>
              <Field label="Location">{complaint.location}</Field>
              <Field label="Assigned Maintenance Staff">
                {complaint.maintenance_staff
                  ? `${complaint.maintenance_staff.name} (${complaint.maintenance_staff.department})`
                  : "Not assigned"}
              </Field>
              <Field label="Submitted Date">{formatDateTime(complaint.created_at)}</Field>
              <Field label="Last Updated">{formatDateTime(complaint.updated_at)}</Field>
              <Field label="Resolved Date">{formatDateTime(complaint.resolved_at)}</Field>
              <Field label="Status">
                <StatusBadge status={complaint.status} />
              </Field>
            </div>

            <Separator />

            <Field label="Description">
              <p className="whitespace-pre-wrap text-sm">{complaint.description || "—"}</p>
            </Field>

            <Field label="Resolution Remarks">
              <p className="whitespace-pre-wrap text-sm">
                {complaint.resolution_remarks || "No remarks added yet."}
              </p>
            </Field>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {isManager && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Manage Complaint</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITIES.map((p) => (
                        <SelectItem key={p} value={p}>
                          {PRIORITY_LABEL[p]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Assigned Maintenance Staff</Label>
                  <Select value={assigned} onValueChange={setAssigned}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={UNASSIGNED}>Not assigned</SelectItem>
                      {staff.map((s) => (
                        <SelectItem key={s.id} value={String(s.id)}>
                          {s.name} · {s.department}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={status} onValueChange={(v) => setStatus(v as Status)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {STATUS_LABEL[s]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="remarks">Resolution Remarks</Label>
                  <Textarea
                    id="remarks"
                    rows={4}
                    maxLength={1000}
                    placeholder="Enter resolution details here"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Button onClick={() => save(false)} disabled={update.isPending}>
                    {update.isPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Save className="size-4" />
                    )}
                    Update Complaint
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => save(true)}
                    disabled={update.isPending || complaint.status === "RESOLVED"}
                  >
                    <CheckCircle2 className="size-4" />
                    Mark as Resolved
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Complaint History</CardTitle>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
              ) : (
                <ol className="space-y-4">
                  {history.map((h) => (
                    <li key={h.id} className="relative pl-5">
                      <span className="absolute top-1.5 left-0 size-2 rounded-full bg-accent" />
                      <p className="text-sm font-medium">{h.action}</p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(h.created_at)}</p>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>

          {!isManager && (
            <p className="text-xs text-muted-foreground">
              Priority, assigned staff, status and resolution remarks are managed by the facility
              manager.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
