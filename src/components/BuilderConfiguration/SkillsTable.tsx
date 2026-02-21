import { useState, useMemo } from "react";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Pencil, Trash2, Search, DivideSquareIcon, Wrench, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  BuilderSkill,
  BuilderType,
  BUILDER_TYPES,
  BUILDER_TYPE_LABELS,
} from "@/types/builder";
import { BuilderTypeBadge } from "./BuilderTypeBadge";
import { SkillDialog } from "./SkillDialog";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { ApproveConfirmDialog } from "./ApproveConfirmDialog";
import { useGlobalContext } from "@/context/GlobalProvider";

interface Props {
  skills: BuilderSkill[];
  onAdd: (name: string, type: BuilderType, createdBy: string) => void;
  onUpdate: (
    id: number,
    name: string,
    type: BuilderType,
    approvedBy?: string,
  ) => void;
  onDelete: (id: number) => void;
  permissions?: {
    canCreate?: boolean;
    canUpdate?: boolean;
    canDelete?: boolean;
  };
}

export function SkillsTable({ skills, onAdd, onUpdate, onDelete, permissions = {} }: Props) {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<BuilderSkill | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BuilderSkill | null>(null);
  const [approveTarget, setApproveTarget] = useState<BuilderSkill | null>(null);
  const { user } = useGlobalContext();
  
  // Default permissions to true if not provided (backward compatibility)
  const { canCreate = true, canUpdate = true, canDelete = true } = permissions;

  const filtered = useMemo(
    () =>
      skills.filter((s) => {
        const matchesSearch = (s.skillName ?? "")
          .toLowerCase()
          .includes(search.toLowerCase());
        const matchesType =
          activeTab === "ALL" || s.builderType === activeTab;
        return matchesSearch && matchesType;
      }),
    [skills, search, activeTab],
  );

  const counts = useMemo(() => {
    const map: Record<string, number> = { ALL: skills.length };
    BUILDER_TYPES.forEach(
      (t) => (map[t] = skills.filter((s) => s.builderType === t).length),
    );
    return map;
  }, [skills]);

  const tabs = useMemo(
    () => [
      { key: "ALL", label: "All", count: counts.ALL },
      ...BUILDER_TYPES.map((t) => ({
        key: t,
        label: BUILDER_TYPE_LABELS[t],
        count: counts[t],
      })),
    ],
    [counts],
  );

  const handleSave = (
    name: string,
    type: BuilderType,
    createdBy: string,
    approvedBy?: string,
  ) => {
    if (editingSkill) {
      onUpdate(editingSkill.id, name, type, approvedBy);
    } else {
      onAdd(name, type, createdBy);
    }
    setEditingSkill(null);
    setDialogOpen(false);
  };

  const openEdit = (skill: BuilderSkill) => {
    setEditingSkill(skill);
    setDialogOpen(true);
  };

  const openAdd = () => {
    setEditingSkill(null);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <Wrench className="h-9 w-9 text-gray-800" />
          Builder Skills
        </h1>
        <Button
          onClick={openAdd}
          disabled={!canCreate}
          title={!canCreate ? "You don't have permission to create skills" : "Add a new skill"}
          className={`shadow-md ${
            canCreate 
              ? "bg-blue-800 hover:bg-blue-900 text-white" 
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          <Plus className="mr-2 h-5 w-5" />
          Add Skill
        </Button>
      </div>

      {/* Custom grid-based tabs */}
      <div className="mb-6">
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
      </div>

      <div className="relative max-w-md mx-auto">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-600" />
        <Input
          placeholder="Search skills..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-11 border-blue-200 focus:border-blue-600 shadow-sm"
        />
      </div>

      {!canCreate && !canUpdate && !canDelete && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800 text-sm">
            📖 <strong>Read-only access:</strong> You can view skills but cannot create, edit, or delete them. 
            Contact an administrator to request write permissions.
          </p>
        </div>
      )}

      <div className="rounded-md border shadow-sm  bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-100 hover:bg-gray-50">
              <TableHead className="font-semibold text-gray-800">ID</TableHead>
              <TableHead className="font-semibold text-gray-800">Skill Name</TableHead>
              <TableHead className="font-semibold text-gray-800">Builder Type</TableHead>
              <TableHead className="font-semibold text-gray-800">Created By</TableHead>
              <TableHead className="font-semibold text-gray-800">Created At</TableHead>
              <TableHead className="font-semibold text-gray-800">Approved By</TableHead>
              <TableHead className="font-semibold text-gray-800 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                  No skills found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((s) => (
                <TableRow key={s.id} className="hover:bg-blue-50 transition-colors">
                  <TableCell>{s.id}</TableCell>
                  <TableCell className="font-medium">{s.skillName}</TableCell>
                  <TableCell>
                    <BuilderTypeBadge type={s.builderType} />
                  </TableCell>
                  <TableCell>{s.createdBy}</TableCell>
                  <TableCell>{new Date(s.createdAt).toLocaleDateString("en-US",
                    {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  )}</TableCell>
                  <TableCell className={!s.approvedBy ? "text-yellow-600 font-bold " : "text-gray-600 font-bold "}>
                    {s.approvedBy ?? "Pending"}
                  </TableCell>
                  <TableCell className="text-right relative">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          type="button"
                          onClick={(e) => e.stopPropagation()}
                        >
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
                          {s.approvedBy ? 'Approved' : 'Approve'}
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={(e) => { e.stopPropagation(); setDeleteTarget(s); }}
                          disabled={!canDelete}
                          className={`${!canDelete ? "opacity-50 cursor-not-allowed" : "cursor-pointer"} text-destructive`}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                          {!canDelete && <span className="ml-2 text-xs text-gray-400">(denied)</span>}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

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
              `${user.firstName} ${user.lastName}`
            );
            setApproveTarget(null);
          }
        }}
      />
    </div>
  );
}