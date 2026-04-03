import { useState, useEffect } from "react";
import axios from "axios";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { BuilderSkill, BuilderType } from "@/types/builder";
import { getAuthHeaders } from "@/utils/auth";
import { getSpecializationMappings } from "@/api/builderSkillsApi.api";
import { getMasterDataValues } from "@/api/masterData";
import { normalizeSkillName } from "@/utils/skillNameUtils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  skill: BuilderSkill;
  onAdd: (specializationCode: string) => void;
}

export function AddSpecializationDialog({ open, onOpenChange, skill, onAdd }: Props) {
  const [mode, setMode] = useState<"select" | "create">("select");
  const [selectedSpec, setSelectedSpec] = useState<string>("");
  const [newSpecName, setNewSpecName] = useState<string>("");
  const [availableSpecs, setAvailableSpecs] = useState<any[]>([]);
  const [specsLoading, setSpecsLoading] = useState(false);
  const [error, setError] = useState("");

  // Load available specializations when dialog opens
  useEffect(() => {
    if (open && skill) {
      loadAvailableSpecializations();
    }
  }, [open, skill]);

  const loadAvailableSpecializations = async () => {
    setSpecsLoading(true);
    setError("");
    setMode("select");
    setSelectedSpec("");
    setNewSpecName("");
    try {
      const axiosInstance = axios.create({
        headers: { Authorization: getAuthHeaders() },
      });

      // Get specialization mappings for this builder type
      const mappingsForType = await getSpecializationMappings(
        axiosInstance,
        skill.builderType as BuilderType
      );

      const normalizedSkillName = normalizeSkillName(skill.skillName);
      const specTypeCode = mappingsForType[normalizedSkillName];

      if (specTypeCode) {
        const response = await getMasterDataValues(axiosInstance, specTypeCode);
        const specs = Array.isArray(response) ? response : (response?.data || response?.values || []);
        
        // Filter out already added specializations
        const currentSpecs = Array.isArray(skill.specializations) ? skill.specializations : [];
        const filtered = specs.filter((s: any) => !currentSpecs.includes(s.code));
        
        setAvailableSpecs(filtered);
        if (filtered.length === 0 && specs.length > 0) {
          console.info(`All specializations for ${skill.skillName} are already added`);
        }
      } else {
        console.warn(`No specialization mapping found for skill: ${normalizedSkillName}, available mappings:`, Object.keys(mappingsForType));
        setAvailableSpecs([]);
      }
    } catch (err) {
      console.error("Failed to load specializations:", err);
      setAvailableSpecs([]);
    }
    setSpecsLoading(false);
  };

  const handleAdd = async () => {
    if (mode === "select") {
      if (!selectedSpec) {
        setError("Please select a specialization");
        return;
      }
      try {
        await onAdd(selectedSpec);
        setSelectedSpec("");
        onOpenChange(false);
      } catch (err: any) {
        const errorMsg = err?.response?.data?.message || err?.message || "Failed to add specialization";
        setError(errorMsg);
      }
    } else {
      // Create mode
      if (!newSpecName.trim()) {
        setError("Please enter a specialization name");
        return;
      }
      
      // Use the name as code (convert to lowercase with hyphens)
      const code = newSpecName
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");

      if (!code) {
        setError("Invalid specialization name");
        return;
      }

      try {
        await onAdd(code);
        setNewSpecName("");
        onOpenChange(false);
      } catch (err: any) {
        const errorMsg = err?.response?.data?.message || err?.message || "Failed to add specialization";
        setError(errorMsg);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Specialization to {skill?.skillName}</DialogTitle>
        </DialogHeader>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded p-3 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Mode Toggle */}
        <div className="flex gap-2 border-b pb-4">
          <Button
            variant={mode === "select" ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setMode("select");
              setError("");
            }}
            disabled={specsLoading || availableSpecs.length === 0}
          >
            Select Existing
          </Button>
          <Button
            variant={mode === "create" ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setMode("create");
              setError("");
            }}
          >
            Create New
          </Button>
        </div>

        {/* Select Mode */}
        {mode === "select" && (
          <div className="space-y-4">
            {availableSpecs.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-gray-500 text-sm mb-3">No predefined specializations available for this skill</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setMode("create")}
                  className="text-blue-600 hover:text-blue-700"
                >
                  Create one instead →
                </Button>
              </div>
            ) : (
              <div>
                <Label htmlFor="spec-select" className="text-gray-700 font-semibold">
                  Specialization
                </Label>
                <Select value={selectedSpec} onValueChange={setSelectedSpec} disabled={specsLoading}>
                  <SelectTrigger id="spec-select" className="mt-2">
                    <SelectValue placeholder={specsLoading ? "Loading..." : "Select specialization..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSpecs.map((spec: any) => (
                      <SelectItem key={spec.code} value={spec.code}>
                        {spec.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )}

        {/* Create Mode */}
        {mode === "create" && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="spec-name" className="text-gray-700 font-semibold">
                Specialization Name
              </Label>
              <Input
                id="spec-name"
                placeholder="e.g., Residential, Commercial, Industrial"
                value={newSpecName}
                onChange={(e) => {
                  setNewSpecName(e.target.value);
                  setError("");
                }}
                className="mt-2"
              />
              <p className="text-xs text-gray-500 mt-2">
                Will be converted to code: <span className="font-mono">{newSpecName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-").replace(/^-|-$/g, "") || "(enter a name)"}</span>
              </p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded p-3">
              <p className="text-sm text-blue-800">
                💡 <strong>Tip:</strong> This creates and adds a custom specialization directly to this skill.
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAdd}
            disabled={
              specsLoading ||
              (mode === "select" && !selectedSpec) ||
              (mode === "create" && !newSpecName.trim())
            }
            className="bg-blue-800 hover:bg-blue-900 text-white"
          >
            Add Specialization
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
