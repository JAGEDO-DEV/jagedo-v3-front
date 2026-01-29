import { type BuilderStatus, STATUS_LABELS, STATUS_STYLES } from "@/data/mockBuilders";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: BuilderStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border",
        STATUS_STYLES[status],
        className
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
