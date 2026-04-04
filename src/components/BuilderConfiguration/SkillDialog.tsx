import { useState, useEffect } from "react";
import axios from "axios";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { BuilderSkill, BuilderType } from "@/types/builder";
import { useGlobalContext } from "@/context/GlobalProvider";
import { useMasterData } from "@/hooks/useMasterData";
import { getAuthHeaders } from "@/utils/auth";
import { getSpecializationMappings } from "@/api/builderSkillsApi.api";
import { getMasterDataValues } from "@/api/masterData";
import { normalizeSkillName } from "@/utils/skillNameUtils";

// Maps each builder type to its skill/type master data code
const SKILL_TYPE_CODE: Record<string, string> = {
  FUNDI:        'FUNDI_SKILLS',
  PROFESSIONAL: 'PROFESSIONAL_TYPES',
  CONTRACTOR:   'CONTRACTOR_TYPES',
  HARDWARE:     'HARDWARE_TYPES',
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  skill?: BuilderSkill | null;
  onSave: (
    skillName: string,
    builderType: BuilderType,
    createdBy: string,
    approvedBy: string | undefined,
    specializations: string[],
  ) => void;
}

export function SkillDialog({ open, onOpenChange, skill, onSave }: Props) {
  const [skillName, setSkillName]     = useState("");
  const [builderType, setBuilderType] = useState<string>("");
  const [error, setError]             = useState("");
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [availableSpecs, setAvailableSpecs] = useState<any[]>([]);
  const [specsLoading, setSpecsLoading] = useState(false);

  const { user } = useGlobalContext();
  const fullName = `${user.firstName} ${user.lastName}`;

  // Builder types always loaded
  const { data: builderTypes, loading: typesLoading } = useMasterData("BUILDER_TYPES");

  // Skills re-fetched whenever builderType changes
  const skillTypeCode = SKILL_TYPE_CODE[builderType] ?? "";
  const { data: skillOptions, loading: skillsLoading } = useMasterData(skillTypeCode);

  // Load specializations when skill name changes
  useEffect(() => {
    if (skillName && builderType) {
      loadSpecializationOptions();
    } else {
      setAvailableSpecs([]);
      setSpecializations([]);
    }
  }, [skillName, builderType]);

  const loadSpecializationOptions = async () => {
    setSpecsLoading(true);
    try {
      const axiosInstance = axios.create({
        headers: { Authorization: getAuthHeaders() },
      });

      // Get specialization mappings for this builder type
      const mappingsForType = await getSpecializationMappings(
        axiosInstance,
        builderType as BuilderType
      );

      const normalizedSkillName = normalizeSkillName(skillName);
      const specTypeCode = mappingsForType[normalizedSkillName];

      if (specTypeCode) {
        const response = await getMasterDataValues(axiosInstance, specTypeCode);
        const specs = Array.isArray(response) ? response : (response?.data || response?.values || []);
        setAvailableSpecs(specs);
      } else {
        setAvailableSpecs([]);
      }
    } catch (err) {
      console.warn("Failed to load specializations:", err);
      setAvailableSpecs([]);
    }
    setSpecsLoading(false);
  };

  // Populate form when editing an existing skill or reset when adding
  useEffect(() => {
    if (skill) {
      setBuilderType(skill.builderType);
      setSkillName(skill.skillName);
      setSpecializations(skill.specializations || []);
    } else {
      setBuilderType(builderTypes[0]?.code ?? "");
      setSkillName("");
      setSpecializations([]);
    }
    setError("");
  }, [skill, open, builderTypes]);

  // Clear skill selection when builder type changes
  useEffect(() => {
    if (!skill) setSkillName("");
  }, [builderType]);

  const handleSave = () => {
    if (!builderType) return setError("Builder type is required");
    if (!skillName.trim()) return setError("Skill name is required");

    onSave(
      skillName.trim(),
      builderType as BuilderType,
      fullName,
      skill ? fullName : undefined,
      specializations,
    );
    onOpenChange(false);
  };

  const isLoading = typesLoading || skillsLoading || specsLoading;
  const hasSkillOptions = skillOptions && skillOptions.length > 0;

  const toggleSpecialization = (specCode: string) => {
    setSpecializations((prev) =>
      prev.includes(specCode)
        ? prev.filter((s) => s !== specCode)
        : [...prev, specCode]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{skill ? "Edit Skill" : "Add Skill"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">

          {/* Step 1: pick builder type */}
          <div className="space-y-2">
            <Label>Builder Type</Label>
            <Select
              value={builderType}
              onValueChange={setBuilderType}
              disabled={typesLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder={typesLoading ? "Loading…" : "Select a type"} />
              </SelectTrigger>
              <SelectContent>
                {builderTypes.map((t) => (
                  <SelectItem key={t.id} value={t.code ?? t.name}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Step 2: pick skill — options depend on selected builder type */}
          <div className="space-y-2">
            <Label>Skill Name</Label>
            {!hasSkillOptions && builderType && !skillsLoading && (
              <p className="text-sm text-yellow-600">
                ⚠️ No skills available for this builder type. Please configure master data first.
              </p>
            )}
            <Select
              value={skillName}
              onValueChange={setSkillName}
              disabled={!builderType || skillsLoading || !hasSkillOptions}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    !builderType   ? "Select a builder type first" :
                    skillsLoading  ? "Loading…" :
                    !hasSkillOptions ? "No skills available" :
                    "Select a skill"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {skillOptions.map((s) => (
                  <SelectItem key={s.id} value={s.name}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          {/* Step 3: pick specializations — options depend on selected skill */}
          {skillName && availableSpecs.length > 0 && (
            <div className="space-y-3">
              <Label>Specializations</Label>
              {specsLoading ? (
                <p className="text-xs text-gray-500">Loading specializations...</p>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-md p-2">
                  {availableSpecs.map((spec) => (
                    <div key={spec.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`spec-${spec.id}`}
                        checked={specializations.includes(spec.code)}
                        onCheckedChange={() => toggleSpecialization(spec.code)}
                      />
                      <label
                        htmlFor={`spec-${spec.id}`}
                        className="text-sm cursor-pointer flex-1"
                      >
                        {spec.name}
                      </label>
                    </div>
                  ))}
                </div>
              )}
              {!specsLoading && availableSpecs.length === 0 && (
                <p className="text-xs text-yellow-600">No specializations available for this skill.</p>
              )}
            </div>
          )}

        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="bg-blue-600 hover:bg-blue-700"
            onClick={handleSave}
            disabled={isLoading || !hasSkillOptions}
          >
            {skill ? "Update" : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}