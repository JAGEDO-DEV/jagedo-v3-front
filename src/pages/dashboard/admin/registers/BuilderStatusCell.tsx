// BuilderStatusCell.tsx

import { StatusBadge } from "./StatusBadge";
import { BuilderStatus, STATUS_LABELS } from "@/data/mockBuilders";
import {
  useProfileCompletion,
  CompletionStatus,
} from "@/hooks/useProfileCompletion";

export const BuilderStatusCell = ({ row }: { row: any }) => {
  const completionStatus = useProfileCompletion(row, row.userType);

  const getSmartStatusLabel = (
    status: BuilderStatus,
    completionStatus: Record<string, CompletionStatus>,
  ) => {
    if (status === "SIGNED_UP") {
      const sectionsToCheck = [
        "account-info",
        "address",
        "account-uploads",
        "experience",
      ];

      const hasIncomplete = sectionsToCheck.some(
        (key) => completionStatus[key] === "incomplete",
      );

      return hasIncomplete ? "Complete Your Profile" : "Pending Verification";
    }

    return STATUS_LABELS[status];
  };

  return (
    <StatusBadge
      status={(row.status as BuilderStatus) || "INCOMPLETE"}
      label={getSmartStatusLabel(row.status, completionStatus)}
    />
  );
};
