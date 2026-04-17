//@ts-nocheck
import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { getBuilderSkillsByType, getSpecializationMappings } from "@/api/builderSkillsApi.api";
import { getMasterDataValues } from "@/api/masterData";
import { normalizeSkillName } from "@/utils/skillNameUtils";
import { kenyanLocations } from "@/data/kenyaLocations";
import { STATUS_LABELS } from "@/data/mockBuilders";
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

interface FiltersState {
  name: string;
  phone: string;
  county: string;
  verificationStatus: string;
  skill: string;
  specialization: string;
  search: string;
}

interface BuilderFiltersProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FiltersState;
  updateFilter: (key: string, value: string) => void;
  activeTab: string;
  axiosInstance?: any;
}

export function BuilderFilters({
  isOpen,
  onClose,
  filters,
  updateFilter,
  activeTab,
  axiosInstance,
}: BuilderFiltersProps) {
  const [skills, setSkills] = useState<any[]>([]);
  const [specializations, setSpecializations] = useState<any[]>([]);
  const [specMappings, setSpecMappings] = useState<Record<string, string>>({});
  const [skillsLoading, setSkillsLoading] = useState(false);
  const [specsLoading, setSpecsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || activeTab === "TRASH" || !axiosInstance) return;

    const loadSkills = async () => {
      try {
        setSkillsLoading(true);
        const skillsRes = await getBuilderSkillsByType(axiosInstance, activeTab);
        setSkills(skillsRes.filter((s: any) => s.isActive !== false));

        const mappingsRes = await getSpecializationMappings(axiosInstance, activeTab);
        setSpecMappings(mappingsRes);
      } catch (error) {
        console.error("Failed to load skills:", error);
      } finally {
        setSkillsLoading(false);
      }
    };
    loadSkills();
  }, [activeTab, axiosInstance, isOpen]);

  useEffect(() => {
    if (!isOpen || !axiosInstance) return;

    const loadSpecs = async () => {
      if (!filters.skill || activeTab === "TRASH" || activeTab === "HARDWARE") {
        setSpecializations([]);
        return;
      }
      try {
        setSpecsLoading(true);
        const normalizedField = normalizeSkillName(filters.skill);
        const specTypeCode = specMappings[normalizedField];
        
        if (!specTypeCode) {
          setSpecializations([]);
          return;
        }

        const selectedSkill = skills.find((s: any) => normalizeSkillName(s.skillName) === normalizedField);
        const assignedSpecCodes = Array.isArray(selectedSkill?.specializations) ? selectedSkill.specializations : [];

        const specsRes = await getMasterDataValues(axiosInstance, specTypeCode);
        const allSpecs = Array.isArray(specsRes) ? specsRes : (specsRes?.data || specsRes?.values || []);

        if (assignedSpecCodes.length > 0) {
          setSpecializations(allSpecs.filter((spec: any) => {
             const code = typeof spec === 'string' ? spec : (spec.code || spec.name);
             return assignedSpecCodes.includes(code);
          }));
        } else {
          setSpecializations(allSpecs);
        }
      } catch (error) {
        console.error("Failed to load specializations:", error);
        setSpecializations([]);
      } finally {
        setSpecsLoading(false);
      }
    };
    loadSpecs();
  }, [filters.skill, activeTab, specMappings, skills, axiosInstance, isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-foreground/20  z-40 transition-opacity"
        onClick={onClose}
      />
      <div className="fixed top-0 right-0 h-full w-full max-w-xs bg-card shadow-lg z-50 p-6 animate-slide-in-right border-l border-border">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-foreground">Filters</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="filter-name">Name</Label>
            <Input
              id="filter-name"
              type="text"
              value={filters.name}
              onChange={(e) => updateFilter("name", e.target.value)}
              placeholder="Search by name..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="filter-phone">Phone</Label>
            <Input
              id="filter-phone"
              type="text"
              value={filters.phone}
              onChange={(e) => updateFilter("phone", e.target.value)}
              placeholder="Search by phone..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="filter-county">County</Label>
            <Select
              value={filters.county || "all"}
              onValueChange={(value) =>
                updateFilter("county", value === "all" ? "" : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All Counties" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Counties</SelectItem>
                {kenyanLocations.map((location) => (
                  <SelectItem key={location.county} value={location.county}>
                    {location.county}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="filter-skill">
              {activeTab === "FUNDI"
                ? "Skill"
                : activeTab === "PROFESSIONAL"
                  ? "Profession"
                  : activeTab === "CONTRACTOR"
                    ? "Contractor Type"
                    : activeTab === "HARDWARE"
                      ? "Hardware Type"
                      : "Skill / Profession"}
            </Label>
            <Select
              value={filters.skill || "all"}
              onValueChange={(value) => {
                updateFilter("skill", value === "all" ? "" : value);
                updateFilter("specialization", "");
              }}
              disabled={skillsLoading || activeTab === "TRASH"}
            >
              <SelectTrigger>
                <SelectValue placeholder={skillsLoading ? "Loading..." : "All Skills"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  All {activeTab !== "HARDWARE" ? "Skills" : "Types"}
                </SelectItem>
                {skills.map((skill: any) => (
                  <SelectItem key={skill.id || skill.skillName} value={skill.skillName}>
                    {skill.skillName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {activeTab !== "HARDWARE" && (
            <div className="space-y-2">
              <Label htmlFor="filter-specialization">Specialization</Label>
              <Select
                value={filters.specialization || "all"}
                onValueChange={(value) =>
                  updateFilter("specialization", value === "all" ? "" : value)
                }
                disabled={specsLoading || !filters.skill || specializations.length === 0}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      specsLoading
                        ? "Loading..."
                        : !filters.skill
                          ? "Select a skill first"
                          : specializations.length === 0
                            ? "No specializations"
                            : "All Specializations"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Specializations</SelectItem>
                  {specializations.map((spec: any) => {
                    const name = typeof spec === "string" ? spec : spec.name || spec.code;
                    return (
                      <SelectItem key={name} value={name}>
                        {name}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="filter-status">Verification Status</Label>
            <Select
              value={filters.verificationStatus || "all"}
              onValueChange={(value) =>
                updateFilter("verificationStatus", value === "all" ? "" : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {Object.entries(STATUS_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {" "}
                    {/* ← was label, now key */}
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="outline"
            className="w-full mt-4"
            onClick={() => {
              updateFilter("name", "");
              updateFilter("phone", "");
              updateFilter("county", "");
              updateFilter("skill", "");
              updateFilter("specialization", "");
              updateFilter("verificationStatus", "");
            }}
          >
            Clear Filters
          </Button>
        </div>
      </div>
    </>
  );
}
