import { useState, useEffect } from "react";
import axios from "axios";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Trash2, Edit2, RefreshCw, ChevronLeft, ChevronRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { getAuthHeaders } from "@/utils/auth";
import {
  getAllMappings,
  createSpecializationMapping,
  updateSpecializationMapping,
  deleteSpecializationMapping,
} from "@/api/builderSkillsApi.api";
import { useMasterData } from "@/hooks/useMasterData";
import { BuilderType } from "@/types/builder";
import {
  formatSkillCode,
  formatSpecTypeCode,
  isValidSkillCode,
  isValidSpecTypeCode,
  getSkillCodeHint,
  getSpecTypeCodeHint,
  getValidationError,
} from "@/utils/mappingFormatUtils";

interface Mapping {
  id?: number;
  builderType: string;
  skillCode: string;
  specializationTypeCode: string;
  isActive?: boolean;
}

const BUILDER_TYPES: BuilderType[] = ["FUNDI", "PROFESSIONAL", "CONTRACTOR", "HARDWARE"];

export function SpecializationMappingManager() {
  const [mappings, setMappings] = useState<Mapping[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMapping, setEditingMapping] = useState<Mapping | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState<Mapping>({
    builderType: BUILDER_TYPES[0],
    skillCode: "",
    specializationTypeCode: "",
  });
  const [validationError, setValidationError] = useState<string | null>(null);

  const ITEMS_PER_PAGE = 10;

  const { data: masterDataTypes } = useMasterData("MASTER_DATA_TYPES");

  const axiosInstance = axios.create({
    headers: { Authorization: getAuthHeaders() },
  });

  // ── Pagination calculations ────────────────────────────────────────────────
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedMappings = mappings.slice(startIndex, endIndex);
  const totalPages = Math.ceil(mappings.length / ITEMS_PER_PAGE);

  // ── Reset to page 1 when data loads ────────────────────────────────────────
  useEffect(() => {
    setCurrentPage(1);
  }, [mappings.length]);

  useEffect(() => {
    loadMappings();
  }, []);

  const loadMappings = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllMappings(axiosInstance);
      setMappings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load mappings:", err);
      setError("Failed to load mappings");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      // Validate and auto-format
      const validationErr = getValidationError(
        formData.builderType,
        formData.skillCode,
        formData.specializationTypeCode
      );
      
      if (validationErr) {
        setValidationError(validationErr);
        return;
      }

      // Auto-format before saving
      const cleanData: Mapping = {
        ...formData,
        skillCode: formatSkillCode(formData.skillCode),
        specializationTypeCode: formatSpecTypeCode(formData.specializationTypeCode),
      };

      if (editingMapping?.id) {
        await updateSpecializationMapping(axiosInstance, editingMapping.id, cleanData);
      } else {
        await createSpecializationMapping(axiosInstance, cleanData);
      }

      setDialogOpen(false);
      setFormData({
        builderType: BUILDER_TYPES[0],
        skillCode: "",
        specializationTypeCode: "",
      });
      setValidationError(null);
      setEditingMapping(null);
      await loadMappings();
    } catch (err: any) {
      const message =
        err?.response?.data?.message || err?.message || "Failed to save mapping";
      setError(message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this mapping?")) return;

    try {
      await deleteSpecializationMapping(axiosInstance, id);
      await loadMappings();
    } catch (err: any) {
      const message = err?.response?.data?.message || "Failed to delete mapping";
      setError(message);
    }
  };

  const openEdit = (mapping: Mapping) => {
    setEditingMapping(mapping);
    setFormData(mapping);
    setValidationError(null);
    setDialogOpen(true);
  };

  const openAdd = () => {
    setEditingMapping(null);
    setFormData({
      builderType: BUILDER_TYPES[0],
      skillCode: "",
      specializationTypeCode: "",
    });
    setValidationError(null);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
          Specialization Mappings
        </h2>
        <div className="flex gap-2">
          <Button
            onClick={loadMappings}
            variant="outline"
            className="text-blue-600"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            onClick={openAdd}
            className="bg-blue-800 hover:bg-blue-900 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Mapping
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-red-800 text-sm font-semibold">Error</p>
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

      <div className="rounded-md border shadow-sm bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-100 hover:bg-gray-50">
              <TableHead className="font-semibold text-gray-800">No.</TableHead>
              <TableHead className="font-semibold text-gray-800">Builder Type</TableHead>
              <TableHead className="font-semibold text-gray-800">Skill Code</TableHead>
              <TableHead className="font-semibold text-gray-800">
                Specialization Type Code
              </TableHead>
              <TableHead className="font-semibold text-gray-800">Status</TableHead>
              <TableHead className="font-semibold text-gray-800 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  Loading mappings...
                </TableCell>
              </TableRow>
            ) : mappings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  No mappings found. Create one to get started.
                </TableCell>
              </TableRow>
            ) : (
              paginatedMappings.map((mapping, index) => (
                <TableRow key={mapping.id} className="hover:bg-blue-50 transition-colors">
                  <TableCell className="font-medium text-gray-600">{startIndex + index + 1}</TableCell>
                  <TableCell className="font-medium">{mapping.builderType}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                      {mapping.skillCode}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-600 font-mono">
                      {mapping.specializationTypeCode}
                    </span>
                  </TableCell>
                  <TableCell>
                    {mapping.isActive !== false ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Inactive
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      onClick={() => openEdit(mapping)}
                      variant="ghost"
                      size="sm"
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => mapping.id && handleDelete(mapping.id)}
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      {mappings.length > 0 && (
        <div className="flex items-center justify-between rounded-md border bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-600">
            Showing <span className="font-semibold">{startIndex + 1}</span> to{" "}
            <span className="font-semibold">{Math.min(endIndex, mappings.length)}</span> of{" "}
            <span className="font-semibold">{mappings.length}</span> mappings
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
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
                  onClick={() => setCurrentPage(page)}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  className={currentPage === page ? "bg-blue-800 text-white" : ""}
                >
                  {page}
                </Button>
              ))}
            </div>
            <Button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingMapping ? "Edit Mapping" : "Add Mapping"}
            </DialogTitle>
          </DialogHeader>

          {validationError && (
            <div className="flex gap-2 p-3 rounded-md bg-red-50 border border-red-200">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">Validation Error</p>
                <p className="text-sm text-red-700 mt-0.5">{validationError}</p>
              </div>
            </div>
          )}

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Builder Type</Label>
              <Select
                value={formData.builderType}
                onValueChange={(value) => {
                  setFormData({ ...formData, builderType: value });
                  setValidationError(null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select builder type" />
                </SelectTrigger>
                <SelectContent>
                  {BUILDER_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Skill Code</Label>
                {formData.skillCode && isValidSkillCode(formatSkillCode(formData.skillCode)) && (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                )}
              </div>
              <Input
                placeholder="e.g., mason, electrician, plumber"
                value={formData.skillCode}
                onChange={(e) => {
                  setFormData({ ...formData, skillCode: e.target.value });
                  setValidationError(null);
                }}
                onBlur={(e) => {
                  const formatted = formatSkillCode(e.target.value);
                  if (formatted) {
                    setFormData({ ...formData, skillCode: formatted });
                  }
                }}
                className="border-blue-200 focus:border-blue-600"
              />
              <p className="text-xs text-gray-500">
                {getSkillCodeHint(formData.skillCode)}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Specialization Type Code</Label>
                {formData.specializationTypeCode && isValidSpecTypeCode(formatSpecTypeCode(formData.specializationTypeCode)) && (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                )}
              </div>
              <Input
                placeholder="e.g., FUNDI_MASON_SPECS"
                value={formData.specializationTypeCode}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    specializationTypeCode: e.target.value,
                  });
                  setValidationError(null);
                }}
                onBlur={(e) => {
                  const formatted = formatSpecTypeCode(e.target.value);
                  if (formatted) {
                    setFormData({
                      ...formData,
                      specializationTypeCode: formatted,
                    });
                  }
                }}
                className="border-blue-200 focus:border-blue-600"
              />
              <p className="text-xs text-gray-500">
                {getSpecTypeCodeHint(formData.specializationTypeCode)}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={handleSave}
              disabled={!!validationError}
            >
              {editingMapping ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
