import { cn } from "@/lib/utils";
import type { Role } from "@/lib/omcms";

const styles: Record<Role, string> = {
  ADMIN: "bg-primary/10 text-primary border-primary/30",
  MANAGER: "bg-info/12 text-info border-info/40",
  EMPLOYEE: "bg-muted text-muted-foreground border-border",
};

export function RoleBadge({ role }: { role: Role }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold whitespace-nowrap",
        styles[role],
      )}
    >
      {role}
      {role === "ADMIN" ? " · System" : ""}
    </span>
  );
}
