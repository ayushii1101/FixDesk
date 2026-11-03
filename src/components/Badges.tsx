import { AlertTriangle, ArrowDown, ArrowUp } from "lucide-react";

import { cn } from "@/lib/utils";
import { PRIORITY_LABEL, STATUS_LABEL, type Priority, type Status } from "@/lib/omcms";

export function StatusBadge({ status }: { status: Status }) {
  const styles: Record<Status, string> = {
    PENDING: "bg-warning/15 text-warning-foreground border-warning/40",
    IN_PROGRESS: "bg-info/12 text-info border-info/40",
    RESOLVED: "bg-success/12 text-success border-success/40",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
        styles[status],
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          status === "PENDING" && "bg-warning",
          status === "IN_PROGRESS" && "bg-info",
          status === "RESOLVED" && "bg-success",
        )}
      />
      {STATUS_LABEL[status]}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const styles: Record<Priority, string> = {
    LOW: "bg-muted text-muted-foreground border-border",
    MEDIUM: "bg-info/10 text-info border-info/30",
    HIGH: "bg-destructive/10 text-destructive border-destructive/40",
  };
  const Icon = priority === "HIGH" ? AlertTriangle : priority === "MEDIUM" ? ArrowUp : ArrowDown;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-semibold whitespace-nowrap",
        styles[priority],
      )}
    >
      <Icon className="size-3" />
      {PRIORITY_LABEL[priority]}
    </span>
  );
}
