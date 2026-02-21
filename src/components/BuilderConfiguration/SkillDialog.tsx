import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BuilderSkill,
  BuilderType,
  BUILDER_TYPES,
  BUILDER_TYPE_LABELS,
} from "@/types/builder";
import { useGlobalContext } from "@/context/GlobalProvider";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  skill?: BuilderSkill | null;
  onSave: (
    skillName: string,
    builderType: BuilderType,
    createdBy: string,
    approvedBy: string | undefined,
  ) => void;
}

export function SkillDialog({ open, onOpenChange, skill, onSave }: Props) {
  const [skillName, setSkillName] = useState("");
  const [builderType, setBuilderType] = useState<BuilderType>("FUNDI");
  const [createdBy, setCreatedBy] = useState("");
  const [approvedBy, setApprovedBy] = useState("");
  const [error, setError] = useState("");
  const { user } = useGlobalContext();
  const name = user.firstName + " " + user.lastName;
  useEffect(() => {
    if (skill) {
      setSkillName(skill.skillName);
      setBuilderType(skill.builderType);
      setCreatedBy(name);
      setApprovedBy(name);
    } else {
      setSkillName("");
      setBuilderType("FUNDI");
      setCreatedBy(name);
      setApprovedBy("");
    }
    setError("");
  }, [skill, open]);

  const handleSave = () => {
    const trimmedName = skillName.trim();
    if (!trimmedName) return setError("Skill name is required");

    // if (!skill ) return setError("Created by is required");

    onSave(
      trimmedName,
      builderType,
      createdBy.trim(),
      approvedBy.trim() || undefined,
    );
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{skill ? "Edit Skill" : "Add Skill"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="skillName">Skill Name</Label>
            <Input
              id="skillName"
              value={skillName}
              onChange={(e) => setSkillName(e.target.value)}
              placeholder="e.g. Plumbing"
              maxLength={150}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="builderType">Builder Type</Label>
            <Select
              value={builderType}
              onValueChange={(v) => setBuilderType(v as BuilderType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BUILDER_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {BUILDER_TYPE_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleSave}>{skill ? "Update" : "Add"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
