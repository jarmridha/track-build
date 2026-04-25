export type AppRole = "admin" | "engineer" | "supervisor";
export type ProjectStatus = "not_started" | "running" | "completed" | "delayed" | "on_hold";
export type UserStatus = "active" | "inactive";

export const STATUS_LABEL: Record<ProjectStatus, string> = {
  not_started: "Not Started",
  running: "Running",
  completed: "Completed",
  delayed: "Delayed",
  on_hold: "On Hold",
};

export const STATUS_TONE: Record<ProjectStatus, string> = {
  not_started: "bg-muted text-muted-foreground",
  running: "bg-info/15 text-info border border-info/30",
  completed: "bg-success/15 text-success border border-success/30",
  delayed: "bg-destructive/15 text-destructive border border-destructive/30",
  on_hold: "bg-warning/15 text-warning-foreground border border-warning/30",
};

export const ROLE_LABEL: Record<AppRole, string> = {
  admin: "Admin",
  engineer: "Engineer",
  supervisor: "Supervisor",
};
