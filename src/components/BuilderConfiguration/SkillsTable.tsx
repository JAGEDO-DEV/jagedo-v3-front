import { useState, useMemo, useEffect } from "react";
import axios from "axios";
import {
  Table, TableHeader, TableRow, TableHead, TableBody, TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Pencil, Trash2, Search, DivideSquareIcon, Wrench, MoreVertical, X, ChevronLeft, ChevronRight, Eye, EyeOff } from "lucide-react";
import { normalizeSkillName } from "@/utils/skillNameUtils";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { BuilderSkill, BuilderType } from "@/types/builder";
import { BuilderTypeBadge } from "./BuilderTypeBadge";
import { SkillDialog } from "./SkillDialog";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { ApproveConfirmDialog } from "./ApproveConfirmDialog";
import { AddSpecializationDialog } from "./AddSpecializationDialog";
import { BulkDeleteConfirmDialog } from "./BulkDeleteConfirmDialog";
import { SkillDetailView } from "./SkillDetailView";
import { useGlobalContext } from "@/context/GlobalProvider";
import { useMasterData } from "@/hooks/useMasterData";
import { invalidateSpecializationCache } from "@/hooks/useSpecializationMappings";
import { getAuthHeaders } from "@/utils/auth";
import { getSpecializationMappings, toggleSkillActive, deactivateSkill, activateSkill } from "@/api/builderSkillsApi.api";
import { getMasterDataValues } from "@/api/masterData";

interface Props {
  skills: BuilderSkill[];
  onAdd: (name: string, type: BuilderType, createdBy: string, specializations?: string[]) => void;
  onUpdate: (id: number, name: string, type: BuilderType, approvedBy?: string, specializations?: string[]) => void;
  onDelete: (id: number) => void;
  onAddSpecialization?: (skillId: number, code: string) => Promise<void>;
  onRemoveSpecialization?: (skillId: number, code: string) => Promise<void>;
  onDeleteByType?: (builderType: BuilderType) => Promise<void>;
  onDeleteByTypeAndName?: (builderType: BuilderType, skillName: string) => Promise<void>;
  permissions?: {
    canCreate?: boolean;
    canUpdate?: boolean;
    canDelete?: boolean;
  };
}

export function SkillsTable({
  skills,
  onAdd,
  onUpdate,
  onDelete,
  onAddSpecialization,
  onRemoveSpecialization,
  onDeleteByType,
  onDeleteByTypeAndName,
  permissions = {},
}: Props) {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<BuilderSkill | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BuilderSkill | null>(null);
  const [approveTarget, setApproveTarget] = useState<BuilderSkill | null>(null);
  const [addSpecDialogOpen, setAddSpecDialogOpen] = useState(false);
  const [specTargetSkill, setSpecTargetSkill] = useState<BuilderSkill | null>(null);
  const [bulkDeleteDialog, setBulkDeleteDialog] = useState<{ open: boolean; type: "skills-by-type" | "skill-by-name"; builderType?: string; skillName?: string } | null>(null);
  const [specializationsBySkill, setSpecializationsBySkill] = useState<Record<number, any[]>>({});
  const [specsLoading, setSpecsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewingSkill, setViewingSkill] = useState<BuilderSkill | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [pagesByTab, setPagesByTab] = useState<Record<string, number>>({ ALL: 1 });
  
  const ITEMS_PER_PAGE = 10;

  const { user } = useGlobalContext();
  const { canCreate = true, canUpdate = true, canDelete = true } = permissions;

  // ── Dynamic builder types ──────────────────────────────────────────────────
  const { data: builderTypes, loading: typesLoading } = useMasterData("BUILDER_TYPES");

  // ── Tabs built from master data ────────────────────────────────────────────
  const tabs = useMemo(() => {
    const allTab = { key: "ALL", label: "All", count: skills.length };
    const typeTabs = builderTypes.map((t) => ({
      key:   t.code ?? t.name,
      label: t.name,
      count: skills.filter((s) => s.builderType === (t.code ?? t.name)).length,
    }));
    return [allTab, ...typeTabs];
  }, [builderTypes, skills]);

  // ── Reset to page 1 when tab or search changes ─────────────────────────────
  useEffect(() => {
    setPagesByTab((prev) => ({
      ...prev,
      [activeTab]: 1,
    }));
  }, [activeTab, search, statusFilter]);

  // ── Filtered rows ──────────────────────────────────────────────────────────
  const filtered = useMemo(
    () =>
      skills.filter((s) => {
        const matchesSearch = (s.skillName ?? "")
          .toLowerCase()
          .includes(search.toLowerCase());
        const matchesType = activeTab === "ALL" || s.builderType === activeTab;
        const matchesStatus =
          statusFilter === "ALL" ||
          (statusFilter === "ACTIVE" && s.isActive !== false) ||
          (statusFilter === "INACTIVE" && s.isActive === false);
        return matchesSearch && matchesType && matchesStatus;
      }),
    [skills, search, activeTab, statusFilter],
  );

  // ── Paginated rows ──────────────────────────────────────────────────────────
  const currentPage = pagesByTab[activeTab] || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedFiltered = useMemo(
    () => filtered.slice(startIndex, endIndex),
    [filtered, startIndex, endIndex],
  );
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);

  // ── Load specializations for all skills ────────────────────────────────────
  useEffect(() => {
    loadSpecializations();
  }, [filtered]);

  const loadSpecializations = async () => {
    setSpecsLoading(true);
    const axiosInstance = axios.create({
      headers: { Authorization: getAuthHeaders() },
    });
    const specsMap: Record<number, any[]> = {};

    // Get specialization mappings for each builder type in filtered skills
    const builderTypesInList = [...new Set(filtered.map((s) => s.builderType))];
    console.log('🔄 Loading specializations for builder types:', builderTypesInList);

    for (const builderTypeValue of builderTypesInList) {
      try {
        // Fetch mappings for this builder type
        console.log(`📍 Fetching mappings for: ${builderTypeValue}`);
        const mappingsForType = await getSpecializationMappings(
          axiosInstance,
          builderTypeValue as BuilderType
        );
        console.log(`✅ Mappings for ${builderTypeValue}:`, mappingsForType);

        // For each skill of this type, load its specializations
        const skillsOfType = filtered.filter((s) => s.builderType === builderTypeValue);
        console.log(`📦 Found ${skillsOfType.length} skills of type ${builderTypeValue}`);

        for (const skill of skillsOfType) {
          const normalizedSkillName = normalizeSkillName(skill.skillName);
          const specTypeCode = mappingsForType[normalizedSkillName];
          const currentSpecCodes = Array.isArray(skill.specializations) ? skill.specializations : [];

          console.log(`\n  📚 Skill: "${skill.skillName}" (normalized: "${normalizedSkillName}")`);
          console.log(`     Codes in DB: [${currentSpecCodes.join(', ')}]`);
          console.log(`     Spec Type Code: ${specTypeCode}`);

          if (specTypeCode) {
            try {
              const response = await getMasterDataValues(axiosInstance, specTypeCode);
              
              // Handle both array and wrapped responses
              const specs = Array.isArray(response) ? response : (response?.data || response?.values || []);
              
              console.log(`     Master data values returned: ${specs.length} total`);
              console.log(`     Available specs:`, specs.map((s: any) => `${s.code}=${s.name}`).join(', '));

              if (Array.isArray(specs)) {
                // Filter to only specializations that are in this skill
                const matchedSpecs = specs.filter((s: any) => currentSpecCodes.includes(s.code));
                specsMap[skill.id] = matchedSpecs;
                
                console.log(`     ✓ Matched ${matchedSpecs.length} specs:`, matchedSpecs.map((s: any) => s.name).join(', '));
              }
            } catch (err) {
              console.error(`❌ Failed to load specs for ${specTypeCode}:`, err);
              specsMap[skill.id] = [];
            }
          } else {
            console.warn(`❌ No specialization mapping for: "${normalizedSkillName}" (from "${skill.skillName}")`);
            specsMap[skill.id] = [];
          }
        }
      } catch (err) {
        console.error(`❌ Failed to load mappings for ${builderTypeValue}:`, err);
      }
    }

    console.log('🎯 Final specializations map:', specsMap);
    setSpecializationsBySkill(specsMap);
    setSpecsLoading(false);
  };

  const handleSave = async (
    name: string,
    type: BuilderType,
    createdBy: string,
    approvedBy?: string,
    specializations: string[] = [],
  ) => {
    try {
      if (editingSkill) {
        onUpdate(editingSkill.id, name, type, approvedBy, specializations);
      } else {
        await onAdd(name, type, createdBy, specializations);
      }
      setEditingSkill(null);
      setDialogOpen(false);
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || 
                       err?.message || 
                       'Failed to save skill';
      setError(errorMsg);
    }
  };

  const openEdit = (skill: BuilderSkill) => { setEditingSkill(skill); setDialogOpen(true); };
  const openAdd  = ()                      => { setEditingSkill(null); setDialogOpen(true); };

  const handleRemoveSpecialization = async (skillId: number, code: string) => {
    if (!onRemoveSpecialization) return;
    try {
      await onRemoveSpecialization(skillId, code);
      // Invalidate cache so provider dropdowns refresh with updated specializations
      invalidateSpecializationCache();
      setError(null);
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err?.message || "Failed to remove specialization";
      setError(errorMsg);
    }
  };

  const handleAddSpecialization = async (code: string) => {
    if (!specTargetSkill || !onAddSpecialization) return;
    try {
      await onAddSpecialization(specTargetSkill.id, code);
      setSpecTargetSkill(null);
      setAddSpecDialogOpen(false);
      loadSpecializations();
      setError(null);
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err?.message || "Failed to add specialization";
      setError(errorMsg);
    }
  };

  const handleBulkDelete = async () => {
    if (!bulkDeleteDialog) return;

    try {
      if (bulkDeleteDialog.type === "skill-by-name" && onDeleteByTypeAndName) {
        await onDeleteByTypeAndName(
          bulkDeleteDialog.builderType as BuilderType,
          bulkDeleteDialog.skillName!
        );
      } else if (bulkDeleteDialog.type === "skills-by-type" && onDeleteByType) {
        await onDeleteByType(bulkDeleteDialog.builderType as BuilderType);
      }
      setBulkDeleteDialog(null);
      setError(null);
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err?.message || "Failed to delete";
      setError(errorMsg);
    }
  };

  const handleToggleSkillActive = async (skillId: number, currentIsActive: boolean) => {
    try {
      const axiosInstance = axios.create({
        headers: { Authorization: getAuthHeaders() },
      });
      await toggleSkillActive(axiosInstance, skillId, !currentIsActive);
      setError(null);
      // Reload skills to see the updated status
      window.location.reload();
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err?.message || "Failed to toggle skill visibility";
      setError(errorMsg);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-end items-center">
       
        <div className="flex  gap-2">
          {canDelete && onDeleteByType && activeTab !== "ALL" && (
            <Button
              onClick={() => {
                setBulkDeleteDialog({
                  open: true,
                  type: "skills-by-type",
                  builderType: activeTab,
                });
              }}
              title={`Delete all skills for ${activeTab}`}
              className="bg-red-600 hover:bg-red-700 text-white shadow-md"
            >
              <Trash2 className="mr-2 h-5 w-5" />
              Delete All for {activeTab}
            </Button>
          )}
          <Button
            onClick={openAdd}
            disabled={!canCreate}
            title={!canCreate ? "You don't have permission to create skills" : "Add a new skill"}
            className={`shadow-md ${canCreate ? "bg-blue-800 hover:bg-blue-900 text-white" : "bg-gray-300 text-gray-500 cursor-not-allowed"}`}
          >
            <Plus className="mr-2 h-5 w-5" />
            Add Skill
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-red-800 text-sm font-semibold">Error adding skill</p>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-700 text-xl"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Dynamic tabs from master data */}
      <div className="mb-6">
        {typesLoading ? (
          <div className="h-14 rounded-lg border bg-white animate-pulse" />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-4 rounded-lg p-2 sm:p-4 shadow-sm border bg-white">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex justify-center items-center w-full px-2 py-2 sm:py-1 rounded-md font-medium transition-all duration-200 space-x-2 text-sm sm:text-base ${
                  activeTab === tab.key
                    ? "bg-blue-800 text-white shadow-md"
                    : "bg-blue-100 text-blue-900 hover:bg-blue-200"
                }`}
              >
                <span>{tab.label}</span>
                <span className="font-semibold">({tab.count})</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="relative max-w-md mx-auto mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-600" />
        <Input
          placeholder="Search skills..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-11 border-blue-200 focus:border-blue-600 shadow-sm"
        />
      </div>

      {/* Status Filter */}
      <div className="flex justify-center gap-3 mb-6">
        <button
          onClick={() => setStatusFilter("ALL")}
          className={`px-4 py-2 rounded-md font-medium transition-all duration-200 ${
            statusFilter === "ALL"
              ? "bg-blue-800 text-white shadow-md"
              : "bg-blue-100 text-blue-900 hover:bg-blue-200"
          }`}
        >
          All Skills
        </button>
        <button
          onClick={() => setStatusFilter("ACTIVE")}
          className={`px-4 py-2 rounded-md font-medium transition-all duration-200 ${
            statusFilter === "ACTIVE"
              ? "bg-green-600 text-white shadow-md"
              : "bg-green-100 text-green-900 hover:bg-green-200"
          }`}
        >
          Active Only
        </button>
        <button
          onClick={() => setStatusFilter("INACTIVE")}
          className={`px-4 py-2 rounded-md font-medium transition-all duration-200 ${
            statusFilter === "INACTIVE"
              ? "bg-gray-600 text-white shadow-md"
              : "bg-gray-100 text-gray-900 hover:bg-gray-200"
          }`}
        >
          Inactive Only
        </button>
      </div>

      {!canCreate && !canUpdate && !canDelete && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800 text-sm">
            📖 <strong>Read-only access:</strong> You can view skills but cannot create, edit, or delete them.
            Contact an administrator to request write permissions.
          </p>
        </div>
      )}

      <div className="rounded-md border shadow-sm bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-100 hover:bg-gray-50">
              <TableHead className="font-semibold text-gray-800">ID</TableHead>
              <TableHead className="font-semibold text-gray-800">Skill Name</TableHead>
              <TableHead className="font-semibold text-gray-800">Builder Type</TableHead>
              <TableHead className="font-semibold text-gray-800">Specializations</TableHead>
              <TableHead className="font-semibold text-gray-800">Created By</TableHead>
              <TableHead className="font-semibold text-gray-800">Approved By</TableHead>
              <TableHead className="font-semibold text-gray-800 text-center">Status</TableHead>
              <TableHead className="font-semibold text-gray-800 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                  No skills found.
                </TableCell>
              </TableRow>
            ) : (
              paginatedFiltered.map((s, index) => (
                <TableRow 
                  key={s.id} 
                  className="hover:bg-blue-50 transition-colors cursor-pointer"
                  onClick={() => setViewingSkill(s)}
                >
                  <TableCell className="font-medium text-gray-600">{startIndex + index + 1}</TableCell>
                  <TableCell className="font-medium">{s.skillName}</TableCell>
                  <TableCell>
                    <BuilderTypeBadge type={s.builderType} />
                  </TableCell>
                  
                  {/* New Specializations Column */}
                  <TableCell>
                    {specsLoading ? (
                      <span className="text-xs text-gray-500">Loading specs...</span>
                    ) : (
                      <div>
                        {specializationsBySkill[s.id]?.length > 0 ? (
                          <div className="flex flex-wrap gap-1 items-center">
                            {specializationsBySkill[s.id].slice(0, 3).map((spec: any) => (
                              <div
                                key={spec.code}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 group hover:bg-blue-200 transition-colors"
                              >
                                <span>{spec.name}</span>
                                {canDelete && onRemoveSpecialization && (
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleRemoveSpecialization(s.id, spec.code);
                                    }}
                                    className="ml-0.5 p-1 hover:bg-red-300 rounded-full transition-colors opacity-60 group-hover:opacity-100 shrink-0"
                                    title="Remove this specialization"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            ))}
                            {specializationsBySkill[s.id]?.length > 3 && (
                              <button
                                onClick={() => setViewingSkill(s)}
                                className="inline-flex items-center justify-center px-2.5 py-1.5 rounded-full text-xs font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors cursor-pointer"
                                title={`View all ${specializationsBySkill[s.id]?.length} specializations`}
                              >
                                +{specializationsBySkill[s.id]?.length - 3} more
                              </button>
                            )}
                            {canUpdate && onAddSpecialization && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setSpecTargetSkill(s);
                                  setAddSpecDialogOpen(true);
                                }}
                                className="h-7 px-2 text-xs"
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">—</span>
                            {canUpdate && onAddSpecialization && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSpecTargetSkill(s);
                                  setAddSpecDialogOpen(true);
                                }}
                                className="h-7 px-2 text-xs text-blue-600 border-blue-200 hover:bg-blue-50"
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Add
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </TableCell>

                  <TableCell>{s.createdBy}</TableCell>
                  <TableCell className={!s.approvedBy ? "text-yellow-600 font-bold" : "text-gray-600 font-bold"}>
                    {s.approvedBy ?? "Pending"}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center items-center gap-1">
                      {s.isActive ? (
                        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <Eye className="h-3 w-3" />
                          Active
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          <EyeOff className="h-3 w-3" />
                          Inactive
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right relative">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" type="button"
                          onClick={(e) => e.stopPropagation()}>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem
                          onClick={(e) => { e.stopPropagation(); openEdit(s); }}
                          disabled={!canUpdate}
                          className={!canUpdate ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                        >
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                          {!canUpdate && <span className="ml-2 text-xs text-gray-400">(read-only)</span>}
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={(e) => { e.stopPropagation(); setApproveTarget(s); }}
                          disabled={
                            !canUpdate ||
                            s.createdBy === `${user?.firstName} ${user?.lastName}` ||
                            !!s.approvedBy 
                          }
                          className="cursor-pointer"
                        >
                          <DivideSquareIcon className="h-4 w-4 mr-2" />
                          {s.approvedBy ? "Approved" : "Approve"}
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={(e) => { e.stopPropagation(); handleToggleSkillActive(s.id, s.isActive ?? true); }}
                          disabled={!canUpdate}
                          className={!canUpdate ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                        >
                          {s.isActive ? (
                            <>
                              <EyeOff className="h-4 w-4 mr-2" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <Eye className="h-4 w-4 mr-2" />
                              Activate
                            </>
                          )}
                          {!canUpdate && <span className="ml-2 text-xs text-gray-400">(read-only)</span>}
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={(e) => { e.stopPropagation(); setDeleteTarget(s); }}
                          disabled={!canDelete}
                          className={`${!canDelete ? "opacity-50 cursor-not-allowed" : "cursor-pointer"} text-destructive`}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Skill
                          {!canDelete && <span className="ml-2 text-xs text-gray-400">(denied)</span>}
                        </DropdownMenuItem>

                        {canDelete && onDeleteByTypeAndName && (
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              setBulkDeleteDialog({
                                open: true,
                                type: "skill-by-name",
                                builderType: s.builderType,
                                skillName: s.skillName,
                              });
                            }}
                            className="cursor-pointer text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete by Name
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      {filtered.length > 0 && (
        <div className="flex items-center justify-between rounded-md border bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-600">
            Showing <span className="font-semibold">{startIndex + 1}</span> to{" "}
            <span className="font-semibold">{Math.min(endIndex, filtered.length)}</span> of{" "}
            <span className="font-semibold">{filtered.length}</span> skills
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() =>
                setPagesByTab((prev) => ({
                  ...prev,
                  [activeTab]: Math.max(1, currentPage - 1),
                }))
              }
              disabled={currentPage === 1}
              variant="outline"
              size="sm"
              className="gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  onClick={() =>
                    setPagesByTab((prev) => ({
                      ...prev,
                      [activeTab]: page,
                    }))
                  }
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  className={currentPage === page ? "bg-blue-800 text-white" : ""}
                >
                  {page}
                </Button>
              ))}
            </div>
            <Button
              onClick={() =>
                setPagesByTab((prev) => ({
                  ...prev,
                  [activeTab]: Math.min(totalPages, currentPage + 1),
                }))
              }
              disabled={currentPage === totalPages}
              variant="outline"
              size="sm"
              className="gap-1"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <SkillDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        skill={editingSkill}
        onSave={handleSave}
      />
      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        skillName={deleteTarget?.skillName ?? ""}
        onConfirm={() => deleteTarget && onDelete(deleteTarget.id)}
      />
      <ApproveConfirmDialog
        open={!!approveTarget}
        onOpenChange={(open) => !open && setApproveTarget(null)}
        skillName={approveTarget?.skillName ?? ""}
        onConfirm={() => {
          if (approveTarget && user) {
            onUpdate(
              approveTarget.id,
              approveTarget.skillName,
              approveTarget.builderType,
              `${user.firstName} ${user.lastName}`,
            );
            setApproveTarget(null);
          }
        }}
      />
      <SkillDetailView
        open={!!viewingSkill}
        onOpenChange={(open) => !open && setViewingSkill(null)}
        skill={viewingSkill}
        specializations={viewingSkill ? (specializationsBySkill[viewingSkill.id] || []) : []}
        onDelete={(skillId) => {
          setIsDeleting(true);
          try {
            onDelete(skillId);
          } finally {
            setIsDeleting(false);
          }
        }}
        onRemoveSpecialization={onRemoveSpecialization}
        isDeleting={isDeleting}
      />

      {specTargetSkill && (
        <AddSpecializationDialog
          open={addSpecDialogOpen}
          onOpenChange={setAddSpecDialogOpen}
          skill={specTargetSkill}
          onAdd={handleAddSpecialization}
        />
      )}

      {bulkDeleteDialog && (
        <BulkDeleteConfirmDialog
          open={bulkDeleteDialog.open}
          onOpenChange={(open) => !open && setBulkDeleteDialog(null)}
          type={bulkDeleteDialog.type}
          builderType={bulkDeleteDialog.builderType}
          skillName={bulkDeleteDialog.skillName}
          affectedCount={
            bulkDeleteDialog.type === "skills-by-type"
              ? skills.filter((s) => s.builderType === bulkDeleteDialog.builderType).length
              : 1
          }
          onConfirm={handleBulkDelete}
        />
      )}
    </div>
  );
}