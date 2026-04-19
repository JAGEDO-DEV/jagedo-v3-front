//@ts-nocheck
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  createAttribute,
  updateAttribute,
  getAllAttributes,
} from '@/api/attributes.api';
import { getAllGroups } from '@/api/groups.api';
import useAxiosWithAuth from '@/utils/axiosInterceptor';

interface AddAttributeFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultProductType: string;
  attribute?: any;
  isEdit?: boolean;
}

const normalizeText = (value?: string | null) =>
  (value || '').trim().toLowerCase();

const parseSubGroupEntry = (sub: any) => {
  if (typeof sub === 'string') {
    const trimmed = sub.trim();
    if (!trimmed) return null;

    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === 'object') {
        return {
          name: (parsed.name || '').trim(),
          active: parsed.active ?? true,
        };
      }
    } catch {
      return { name: trimmed, active: true };
    }
  }

  if (sub && typeof sub === 'object') {
    return {
      name: (sub.name || '').trim(),
      active: sub.active ?? true,
    };
  }

  return null;
};

const getSubGroupNames = (group: any): string[] => {
  if (!group) return [];
  const subGroup = group.subGroup;
  if (Array.isArray(subGroup)) {
    return subGroup
      .map(parseSubGroupEntry)
      .filter((entry) => entry && entry.name && entry.active)
      .map((entry) => entry!.name);
  }
  if (typeof subGroup === 'string' && subGroup.trim() !== '') {
    return subGroup
      .split(',')
      .map((s: string) => s.trim())
      .filter(Boolean);
  }
  return [];
};

const generateCode = (name: string) =>
  name
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');

export default function AddAttributeForm({
  open,
  onClose,
  onSuccess,
  defaultProductType,
  attribute,
  isEdit = false,
}: AddAttributeFormProps) {
  const axiosInstance = useAxiosWithAuth(import.meta.env.VITE_SERVER_URL);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [existingAttributes, setExistingAttributes] = useState<any[]>([]);
  const [availableGroups, setAvailableGroups] = useState<any[]>([]);

  
  const [selectedGroupId, setSelectedGroupId] = useState<string>(
    attribute?.groupId?.toString() || attribute?.categoryId?.toString() || ''
  );
  const [selectedSubGroup, setSelectedSubGroup] = useState<string>(
    attribute?.attributeGroup || ''
  );

  
    
    const [attributeName, setAttributeName] = useState(attribute?.type || '');
    const [attributeCode, setAttributeCode] = useState(attribute?.code || '');
    const [attributeType, setAttributeType] = useState(attribute?.attributeType || 'text');
    const [unit, setUnit] = useState(attribute?.unit || '');
    const [isRequired, setIsRequired] = useState(attribute?.isRequired ?? false);
    const [filterable, setFilterable] = useState(attribute?.filterable ?? false);
    const [customerView, setCustomerView] = useState(attribute?.customerView ?? false);
    const [active, setActive] = useState(attribute?.active ?? true);
    const [attributeValues, setAttributeValues] = useState<string[]>([]);
    const [newValue, setNewValue] = useState("");

  const selectedGroup = availableGroups.find(
    (g) => g.id.toString() === selectedGroupId
  );
  const subGroupOptions = getSubGroupNames(selectedGroup);

  
  useEffect(() => {
    if (!isEdit) {
      setAttributeCode(generateCode(attributeName));
    }
  }, [attributeName, isEdit]);

  
  useEffect(() => {
    if (open) {
      setStep(isEdit ? 2 : 1);
      setSelectedGroupId(
        attribute?.groupId?.toString() ||
          attribute?.categoryId?.toString() ||
          ''
      );
      setSelectedSubGroup(attribute?.attributeGroup || '');
      setAttributeName(attribute?.type || '');
      setAttributeCode(attribute?.code || '');
      setAttributeType(attribute?.attributeType || 'text');
      setUnit(attribute?.unit || '');
      setIsRequired(attribute?.isRequired ?? false);
      setFilterable(attribute?.filterable ?? false);
      setCustomerView(attribute?.customerView ?? false);
      setActive(attribute?.active ?? true);
      if (attribute?.values) {
        setAttributeValues(attribute.values.split(",").map((v: string) => v.trim()).filter(Boolean));
      } else {
        setAttributeValues([]);
      }
      setNewValue("");
    }
  }, [open, attribute, isEdit]);

  
  useEffect(() => {
    if (!open) return;
    const fetchData = async () => {
      try {
        const [attrsRes, groupsRes] = await Promise.all([
          getAllAttributes(axiosInstance),
          getAllGroups(axiosInstance),
        ]);

        if (attrsRes.success) {
          const data = attrsRes.data || attrsRes.hashSet;
          if (Array.isArray(data)) setExistingAttributes(data);
        }

        if (groupsRes.success) {
          const groupsData = groupsRes.data || groupsRes.hashSet;
          if (Array.isArray(groupsData)) {
            const defaultTypeUpper = (defaultProductType || '').trim().toUpperCase();
            const filtered = groupsData.filter((g: any) => {
              if (!g.active) return false;
              const gType = (g.type || '').trim().toUpperCase();
              return (
                gType === defaultTypeUpper ||
                (defaultTypeUpper === 'HARDWARE' && !gType)
              );
            });
            setAvailableGroups(filtered);
          }
        }
      } catch (err) {
        console.error('Failed to load form data', err);
      }
    };
    fetchData();
  }, [open, defaultProductType]);

  const handleNext = () => {
    if (step === 1) {
      if (!selectedGroupId) {
        toast.error('Please select a group');
        return;
      }
      setStep(2);
    }
  };

  const handleBack = () => {
    if (step === 2) setStep(1);
  };

  const handleSubmit = async () => {
    if (!attributeName.trim()) {
      toast.error('Attribute name is required');
      return;
    }

    
    
    const resolvedAttributeGroup =
      selectedSubGroup && selectedSubGroup !== '__group__'
        ? selectedSubGroup
        : selectedGroup?.name || '';

    const isDuplicate =
      !isEdit &&
      existingAttributes.some((attr) => {
        const existingName = normalizeText(attr.type);
        const newName = normalizeText(attributeName);
        const existingGroupId = attr.groupId?.toString() || attr.categoryId?.toString();
        return existingName === newName && existingGroupId === selectedGroupId;
      });

    if (isDuplicate) {
      toast.error(
        `An attribute named "${attributeName}" already exists in this group.`
      );
      return;
    }

    try {
      setLoading(true);

      const submitData = {
        type: attributeName.trim(),
        attributeType,
        filterable,
        active,
        customerView,
        isRequired,
        unit,
        code: attributeCode,
        groupId: selectedGroupId,
        attributeGroup: resolvedAttributeGroup,
        values: attributeType === "multiselect" 
          ? attributeValues.join(",")
          : attributeType === "select"
          ? (attributeValues[0] || null)
          : null
      };

      const response = isEdit
        ? await updateAttribute(axiosInstance, attribute.id, submitData)
        : await createAttribute(axiosInstance, submitData);

      if (response.success) {
        toast.success(
          isEdit ? 'Attribute updated successfully' : 'Attribute created successfully'
        );
        onSuccess();
      } else {
        toast.error(
          response.message ||
            (isEdit ? 'Failed to update attribute' : 'Failed to create attribute')
        );
      }
    } catch (error) {
      console.error('Error saving attribute:', error);
      toast.error('Failed to save attribute');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[540px] p-0 overflow-hidden rounded-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-lg font-semibold text-gray-900">
            {isEdit ? 'Edit Attribute' : 'Create New Attribute'}
          </DialogTitle>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {step === 1 && (
            <>
              <p className="text-sm font-medium text-gray-500">
                Step 1: Assign To Group
              </p>

              {/* Group */}
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-gray-700">
                  Group <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={selectedGroupId}
                  onValueChange={(val) => {
                    setSelectedGroupId(val);
                    setSelectedSubGroup('');
                  }}
                >
                  <SelectTrigger className="w-full border-gray-300 rounded-lg">
                    <SelectValue placeholder="Select group..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {availableGroups.length > 0 ? (
                      availableGroups.map((g) => (
                        <SelectItem key={g.id.toString()} value={g.id.toString()}>
                          {g.name}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-2 text-sm text-gray-400 text-center">
                        No active groups found
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Subgroup */}
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-gray-700">
                  Subgroup <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={selectedSubGroup}
                  onValueChange={setSelectedSubGroup}
                  disabled={!selectedGroup || subGroupOptions.length === 0}
                >
                  <SelectTrigger className="w-full border-gray-300 rounded-lg">
                    <SelectValue
                      placeholder={
                        selectedGroup
                          ? subGroupOptions.length === 0
                            ? 'No subgroups available'
                            : 'Select subgroup...'
                          : 'Select a group first'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {subGroupOptions.map((sub) => (
                      <SelectItem key={sub} value={sub}>
                        {sub}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="grid grid-cols-2 gap-4">
                {/* Attribute Name */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold text-gray-700">
                    Attribute Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    placeholder="e.g. Size"
                    value={attributeName}
                    onChange={(e) => setAttributeName(e.target.value)}
                    className="border-gray-200 rounded-xl h-11"
                  />
                </div>

                {/* Attribute Code */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold text-gray-700">
                    Attribute Code
                  </Label>
                  <Input
                    placeholder="size"
                    value={attributeCode}
                    onChange={(e) => setAttributeCode(e.target.value)}
                    className="border-gray-200 rounded-xl h-11"
                  />
                </div>

                {/* Type */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold text-gray-700">Type {isEdit && "(Locked)"}</Label>
                  <Select value={attributeType} onValueChange={setAttributeType}>
                    <SelectTrigger className="w-full border-gray-200 rounded-xl h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="number">Number</SelectItem>
                      <SelectItem value="date">Date</SelectItem>
                      <SelectItem value="select">Select</SelectItem>
                      <SelectItem value="multiselect">Multiselect</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Unit */}
                {attributeType === 'number' && (
                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold text-gray-700">Unit</Label>
                    <Input
                      placeholder="e.g. 1''"
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      className="border-gray-200 rounded-xl h-11"
                    />
                  </div>
                )}
              </div>

              {/* Toggles */}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-4 pt-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActive(!active)}
                    className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${active ? "bg-green-500" : "bg-gray-200"}`}
                  >
                    <span className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform ${active ? "translate-x-3.5" : "translate-x-1"}`} />
                  </button>
                  <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded uppercase">Active</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsRequired(!isRequired)}
                    className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${isRequired ? "bg-green-500" : "bg-gray-200"}`}
                  >
                    <span className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform ${isRequired ? "translate-x-3.5" : "translate-x-1"}`} />
                  </button>
                  <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded uppercase">Required</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setFilterable(!filterable)}
                    className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${filterable ? "bg-green-500" : "bg-gray-200"}`}
                  >
                    <span className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform ${filterable ? "translate-x-3.5" : "translate-x-1"}`} />
                  </button>
                  <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded uppercase">filterable</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCustomerView(!customerView)}
                    className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${customerView ? "bg-green-500" : "bg-gray-200"}`}
                  >
                    <span className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform ${customerView ? "translate-x-3.5" : "translate-x-1"}`} />
                  </button>
                  <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded uppercase">show to customer</span>
                </div>
              </div>

              {/* Values Management */}
              {attributeType === "multiselect" ? (
                <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                  <Label className="text-sm font-semibold text-gray-700">
                    Attribute Values (Multiple)
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add value..."
                      value={newValue}
                      onChange={(e) => setNewValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (newValue.trim()) {
                            if (!attributeValues.includes(newValue.trim())) {
                              setAttributeValues([...attributeValues, newValue.trim()]);
                            }
                            setNewValue("");
                          }
                        }
                      }}
                      className="border-gray-300 rounded-lg"
                    />
                    <Button 
                      type="button"
                      variant="outline"
                      onClick={() => {
                        if (newValue.trim()) {
                          if (!attributeValues.includes(newValue.trim())) {
                            setAttributeValues([...attributeValues, newValue.trim()]);
                          }
                          setNewValue("");
                        }
                      }}
                    >
                      Add
                    </Button>
                  </div>
                  
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {attributeValues.length > 0 ? (
                      attributeValues.map((v, i) => (
                        <span 
                          key={i} 
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-[#00007A] text-xs font-medium rounded-full border border-blue-100"
                        >
                          {v}
                          <button 
                            type="button"
                            onClick={() => setAttributeValues(attributeValues.filter((_, idx) => idx !== i))}
                            className="hover:text-red-500 transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))
                    ) : (
                      <p className="text-xs text-gray-400 italic">No values added yet.</p>
                    )}
                  </div>
                </div>
              ) : attributeType === "select" ? (
                <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                  <Label className="text-sm font-semibold text-gray-700">
                    Attribute Value (Single)
                  </Label>
                  <Input
                    placeholder="Enter value..."
                    value={attributeValues[0] || ""}
                    onChange={(e) => setAttributeValues([e.target.value])}
                    className="border-gray-300 rounded-lg"
                  />
                  <p className="text-[10px] text-gray-400">
                    This type only supports a single predefined value.
                  </p>
                </div>
              ) : null}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 pb-6 pt-2">
          <Button
            variant="outline"
            onClick={step === 1 ? onClose : handleBack}
            className="border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg"
          >
            {step === 1 ? 'Cancel' : 'Back'}
          </Button>

          {step === 1 ? (
            <Button
              onClick={handleNext}
              className="rounded-lg px-6 bg-[#00007A] hover:bg-[#00007A]/90 text-white"
            >
              Next
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="rounded-lg px-6 bg-[#00007A] hover:bg-[#00007A]/90 text-white"
            >
              {loading
                ? isEdit
                  ? 'Updating...'
                  : 'Saving...'
                : isEdit
                ? 'Update'
                : 'Create Attribute'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
