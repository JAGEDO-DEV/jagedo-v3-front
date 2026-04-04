import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "skills-by-type" | "skill-by-name";
  builderType?: string;
  skillName?: string;
  affectedCount?: number;
  onConfirm: () => void;
}

export function BulkDeleteConfirmDialog({
  open,
  onOpenChange,
  type,
  builderType,
  skillName,
  affectedCount,
  onConfirm,
}: Props) {
  const isDeleteType = type === "skills-by-type";
  const title = isDeleteType
    ? `Delete All Skills for ${builderType}?`
    : `Delete Skill: ${skillName}?`;

  const description = isDeleteType
    ? `This will permanently delete ${affectedCount || 0} skill(s) for builder type "${builderType}". This action cannot be undone.`
    : `This will permanently delete the skill "${skillName}" from builder type "${builderType}". This action cannot be undone.`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <DialogTitle className="text-red-600">{title}</DialogTitle>
          </div>
          <DialogDescription className="text-gray-700 mt-2">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="bg-red-50 border border-red-200 rounded p-3">
          <p className="text-sm text-red-800 font-semibold">⚠️ Warning</p>
          <p className="text-sm text-red-700 mt-1">This delete operation is permanent and cannot be reversed.</p>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Delete Permanently
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
