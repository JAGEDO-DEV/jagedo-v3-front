import { useState } from "react";
import toast from "react-hot-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2, AlertTriangle, X } from "lucide-react";
import { BuilderSkill, BuilderType } from "@/types/builder";
import { BuilderTypeBadge } from "./BuilderTypeBadge";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  skill: BuilderSkill | null;
  specializations: { code: string; name: string }[];
  onDelete: (skillId: number) => void;
  onRemoveSpecialization?: (skillId: number, code: string) => Promise<void>;
  isDeleting?: boolean;
}

export function SkillDetailView({
  open,
  onOpenChange,
  skill,
  specializations,
  onDelete,
  onRemoveSpecialization,
  isDeleting = false,
}: Props) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [removingSpecCode, setRemovingSpecCode] = useState<string | null>(null);

  if (!skill) return null;

  const handleDelete = () => {
    onDelete(skill.id);
    setShowDeleteConfirm(false);
    onOpenChange(false);
  };

  const handleRemoveSpec = async (code: string) => {
    if (!onRemoveSpecialization) return;
    try {
      setRemovingSpecCode(code);
      await onRemoveSpecialization(skill.id, code);
      toast.success("Specialization removed");
      setRemovingSpecCode(null);
    } catch (error: any) {
      toast.error(error?.message || "Failed to remove specialization");
      setRemovingSpecCode(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{skill.skillName}</DialogTitle>
        </DialogHeader>

        {!showDeleteConfirm ? (
          <div className="space-y-6 py-4">
            {/* Builder Type */}
            <div className="border-b pb-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Builder Type</p>
              <BuilderTypeBadge type={skill.builderType} />
            </div>

            {/* Created By */}
            <div className="border-b pb-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Created By</p>
              <p className="text-sm text-gray-700">{skill.createdBy || "—"}</p>
            </div>

            {/* Approval Status */}
            <div className="border-b pb-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Approval Status</p>
              <div className="flex items-center gap-2">
                <div
                  className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                    skill.approvedBy
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {skill.approvedBy ? "Approved" : "Pending"}
                </div>
                {skill.approvedBy && (
                  <p className="text-xs text-gray-600">by {skill.approvedBy}</p>
                )}
              </div>
            </div>

            {/* Specializations */}
            <div className="border-b pb-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Specializations ({specializations.length})
              </p>
              {specializations.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                  {specializations.map((spec) => (
                    <div
                      key={spec.code}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors group"
                    >
                      <div>
                        <span>{spec.name}</span>
                        <span className="ml-1 text-blue-600 font-semibold">({spec.code})</span>
                      </div>
                      <button
                        onClick={() => handleRemoveSpec(spec.code)}
                        disabled={removingSpecCode === spec.code}
                        title="Remove specialization"
                        className="ml-1 p-1 rounded-full hover:bg-blue-300 transition-colors disabled:opacity-50"
                      >
                        <X className="h-4 w-4 text-blue-700" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400">No specializations assigned</p>
              )}
            </div>

            {/* Metadata */}
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">
                <strong>ID:</strong> {skill.id}
              </p>
              {skill.createdAt && (
                <p className="text-xs text-gray-500 mt-1">
                  <strong>Created:</strong> {new Date(skill.createdAt).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        ) : (
          // Delete Confirmation
          <div className="space-y-4 py-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900">Delete this skill?</p>
                <p className="text-sm text-red-800 mt-1">
                  This will permanently delete <strong>{skill.skillName}</strong> and all its specializations.
                  This action cannot be undone.
                </p>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          {!showDeleteConfirm ? (
            <>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>
              <Button
                variant="destructive"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Skill
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Confirm Delete"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
