import { cn } from "@/lib/utils";
import { STATUS_LABEL, STATUS_TONE, type ProjectStatus } from "@/lib/types";

export function StatusBadge({ status, className }: { status: ProjectStatus; className?: string }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
      STATUS_TONE[status],
      className
    )}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {STATUS_LABEL[status]}
    </span>
  );
}
