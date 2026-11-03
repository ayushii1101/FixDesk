export type Status = "PENDING" | "IN_PROGRESS" | "RESOLVED";
export type Priority = "LOW" | "MEDIUM" | "HIGH";
export type Role = "EMPLOYEE" | "MANAGER" | "ADMIN";

export const STATUSES: Status[] = ["PENDING", "IN_PROGRESS", "RESOLVED"];
export const PRIORITIES: Priority[] = ["LOW", "MEDIUM", "HIGH"];

export const STATUS_LABEL: Record<Status, string> = {
  PENDING: "Pending",
  IN_PROGRESS: "In Progress",
  RESOLVED: "Resolved",
};

export const PRIORITY_LABEL: Record<Priority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
};

export const CATEGORY_PROBLEMS: Record<string, string[]> = {
  Furniture: ["Broken Chair", "Broken Table", "Cabinet Problem", "Drawer Problem"],
  "Computer / IT": [
    "Computer Not Working",
    "Monitor Problem",
    "Keyboard / Mouse",
    "Printer Problem",
    "Internet Problem",
  ],
  Electrical: ["Light Problem", "Fan Problem", "AC Problem", "Switch / Socket Problem"],
  Plumbing: ["Water Leakage", "Tap Problem", "Washroom Problem"],
  Cleaning: ["Room Cleaning", "Washroom Cleaning", "Garbage Disposal"],
  Other: ["Other Issue"],
};

export const DEPARTMENTS = [
  "IT",
  "Finance",
  "Human Resources",
  "Operations",
  "Marketing",
  "Administration",
  "Engineering",
];

export function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function complaintCode(no: number) {
  return `CMP-${String(no).padStart(4, "0")}`;
}
