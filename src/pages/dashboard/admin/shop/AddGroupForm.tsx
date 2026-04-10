import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, Loader2, X, Plus, ChevronDown, ChevronRight, Folder } from "lucide-react";
import { toast } from "react-hot-toast";
import { createGroup, updateGroup, Group, GroupCreateRequest, GroupUpdateRequest } from "@/api/groups.api";
import useAxiosWithAuth from "@/utils/axiosInterceptor";

interface SubGroupItem {
    id: string;
    name: string;
    urlKey: string;
    metaTitle: string;
    metaKeywords: string;
    active: boolean;
}

interface AddGroupFormProps {
    onBack: () => void;
    onSuccess: () => void;
    group?: Group | null;
    isEditMode?: boolean;
}

export default function AddGroupForm({
    onBack,
    onSuccess,
    group,
    isEditMode = false
}: AddGroupFormProps) {
    const axiosInstance = useAxiosWithAuth(import.meta.env.VITE_SERVER_URL);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        subGroup: [] as SubGroupItem[],
        urlKey: "",
        metaTitle: "",
        metaKeywords: "",
        type: "HARDWARE",
        active: true
    });
    const [newSubGroup, setNewSubGroup] = useState("");
    const [expandedSubGroups, setExpandedSubGroups] = useState<Set<string>>(new Set());
    const [editingSubGroupId, setEditingSubGroupId] = useState<string | null>(null);
    const [editingSubGroupData, setEditingSubGroupData] = useState<SubGroupItem | null>(null);

    const mainGroups = [
        { value: "HARDWARE", label: "Hardware" },
        { value: "FUNDI", label: "Custom Products" },
        { value: "PROFESSIONAL", label: "Designs" },
        { value: "CONTRACTOR", label: "Hire Machinery & Equipment" }
    ];

    useEffect(() => {
        if (group && isEditMode) {
            const subCats = Array.isArray(group.subGroup) 
                ? group.subGroup.map((sub: any) => typeof sub === "string" 
                    ? { id: Math.random().toString(), name: sub, urlKey: "", metaTitle: "", metaKeywords: "", active: true }
                    : { ...sub, active: sub.active !== undefined ? sub.active : true }
                )
                : [];
            
            setFormData({
                name: group.name,
                subGroup: subCats,
                urlKey: group.urlKey || "",
                metaTitle: group.metaTitle || "",
                metaKeywords: group.metaKeywords || "",
                type: group.type || "HARDWARE",
                active: group.active
            });
        }
    }, [group, isEditMode]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            toast.error("Group name is required");
            return;
        }

        try {
            setLoading(true);

            if (isEditMode && group) {
                const updateData: GroupUpdateRequest = {
                    id: group.id,
                    name: formData.name,
                    active: formData.active,
                    subGroup: formData.subGroup as any, 
                    urlKey: formData.urlKey,
                    metaTitle: formData.metaTitle,
                    metaKeywords: formData.metaKeywords,
                    type: formData.type
                };
                await updateGroup(axiosInstance, group.id, updateData);
                toast.success("Group updated successfully");
            } else {
                const createData: GroupCreateRequest = {
                    name: formData.name,
                    subGroup: formData.subGroup as any, 
                    urlKey: formData.urlKey,
                    metaTitle: formData.metaTitle,
                    metaKeywords: formData.metaKeywords,
                    type: formData.type
                };
                await createGroup(axiosInstance, createData);
                toast.success("Group created successfully");
            }

            onSuccess();
        } catch (error: unknown) {
            console.error("Error saving group:", error);
            const errorMessage = error instanceof Error ? error.message : "Failed to save group";
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const addSubGroup = () => {
        if (newSubGroup.trim()) {
            const newId = `sub-${Date.now()}`;
            setFormData(prev => ({
                ...prev,
                subGroup: [...prev.subGroup, {
                    id: newId,
                    name: newSubGroup.trim(),
                    urlKey: "",
                    metaTitle: "",
                    metaKeywords: "",
                    active: true
                }]
            }));
            setNewSubGroup("");
        }
    };

    const removeSubGroup = (id: string) => {
        setFormData(prev => ({
            ...prev,
            subGroup: prev.subGroup.filter((sub) => sub.id !== id)
        }));
    };

    const toggleSubGroupExpand = (id: string) => {
        const newExpanded = new Set(expandedSubGroups);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedSubGroups(newExpanded);
    };

    const startEditingSubGroup = (sub: SubGroupItem) => {
        setEditingSubGroupId(sub.id);
        setEditingSubGroupData({ ...sub });
    };

    const saveSubGroupEdit = () => {
        if (!editingSubGroupData) return;

        setFormData(prev => ({
            ...prev,
            subGroup: prev.subGroup.map(sub => 
                sub.id === editingSubGroupId ? editingSubGroupData : sub
            )
        }));
        setEditingSubGroupId(null);
        setEditingSubGroupData(null);
        toast.success("Sub-group updated");
    };

    const updateEditingSubGroup = (field: keyof SubGroupItem, value: string | boolean) => {
        if (editingSubGroupData) {
            setEditingSubGroupData(prev => ({
                ...prev!,
                [field]: value
            }));
        }
    };

    const handlePreview = () => {
        toast('Preview functionality coming soon');
    };

    const handleSaveChanges = () => {
        toast('Save as draft functionality coming soon');
    };

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8">
            {/* Header */}
            <div className="flex items-center space-x-4">
                <Button variant="ghost" onClick={onBack} className="p-2">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-3xl font-bold">{isEditMode ? 'Edit Group' : 'Add Group'}</h1>
            </div>

            <div className="space-y-8">
                {/* Group Information */}
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Main Group */}
                        <div className="space-y-2">
                            <Label htmlFor="type" className="font-semibold">Main Group</Label>
                            <Select value={formData.type} onValueChange={(value) => handleInputChange("type", value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select..." />
                                </SelectTrigger>
                                <SelectContent className='bg-white'>
                                    {mainGroups.map((group) => (
                                        <SelectItem key={group.value} value={group.value}>
                                            {group.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Group Name */}
                        <div className="space-y-2">
                            <Label htmlFor="name" className="font-semibold">Group Name *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => handleInputChange("name", e.target.value)}
                                placeholder="Enter group name"
                                required
                            />
                        </div>
                    </div>
                </div>



                {/* Sub Groups Tree View */}
                <div className="space-y-4">
                    <Label className="font-semibold">Sub Groups</Label>
                    <div className="flex space-x-2 mb-4">
                        <Input
                            value={newSubGroup}
                            onChange={(e) => setNewSubGroup(e.target.value)}
                            placeholder="Enter sub group name"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    addSubGroup();
                                }
                            }}
                        />
                        <Button 
                            type="button" 
                            onClick={addSubGroup}
                            style={{ backgroundColor: "#00007A", color: "white" }}
                        >
                            <Plus className="h-4 w-4 mr-1" />
                            Add
                        </Button>
                    </div>

                    {/* Tree View */}
                    {formData.subGroup.length > 0 && (
                        <div className="border rounded-lg bg-gray-50 p-4 space-y-2">
                            {formData.subGroup.map((sub) => (
                                <div key={sub.id} className="bg-white border rounded-lg overflow-hidden">
                                    {/* Sub Group Header */}
                                    <div className="flex items-center justify-between p-3 hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center space-x-2 flex-1">
                                            <button
                                                type="button"
                                                onClick={() => toggleSubGroupExpand(sub.id)}
                                                className="p-1 hover:bg-gray-200 rounded"
                                            >
                                                {expandedSubGroups.has(sub.id) ? (
                                                    <ChevronDown className="h-4 w-4" />
                                                ) : (
                                                    <ChevronRight className="h-4 w-4" />
                                                )}
                                            </button>
                                             <div className="flex-1 min-w-0">
                                                 <div className="flex items-center space-x-2">
                                                     <Folder className="h-4 w-4 text-blue-500 shrink-0" />
                                                     <span className="font-medium truncate">{sub.name}</span>
                                                     <Badge 
                                                        variant={sub.active ? "default" : "destructive"} 
                                                        className={`text-[10px] px-1.5 h-4 ${sub.active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}
                                                     >
                                                        {sub.active ? 'Active' : 'Inactive'}
                                                     </Badge>
                                                 </div>
                                                 <p className="text-xs text-gray-500 mt-0.5">{sub.urlKey || 'No URL key'}</p>
                                             </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Button 
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                onClick={() => startEditingSubGroup(sub)}
                                                className="text-xs"
                                            >
                                                Edit
                                            </Button>
                                            <button
                                                type="button"
                                                onClick={() => removeSubGroup(sub.id)}
                                                className="p-1 hover:bg-red-100 hover:text-red-600 rounded transition-colors"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Expanded Details */}
                                    {expandedSubGroups.has(sub.id) && (
                                        <div className="border-t bg-gray-50 p-4 space-y-4">
                                            {editingSubGroupId === sub.id && editingSubGroupData ? (
                                                <>
                                                    <div className="grid grid-cols-1 gap-4">
                                                        <div className="space-y-2">
                                                            <Label htmlFor={`sub-name-${sub.id}`} className="text-sm">Sub Group Name</Label>
                                                            <Input
                                                                id={`sub-name-${sub.id}`}
                                                                value={editingSubGroupData.name}
                                                                onChange={(e) => updateEditingSubGroup("name", e.target.value)}
                                                            />
                                                        </div>

                                                        <div className="space-y-2">
                                                            <Label htmlFor={`sub-url-${sub.id}`} className="text-sm">URL Key</Label>
                                                            <Input
                                                                id={`sub-url-${sub.id}`}
                                                                value={editingSubGroupData.urlKey}
                                                                onChange={(e) => updateEditingSubGroup("urlKey", e.target.value)}
                                                                placeholder="e.g., sub-group-url"
                                                            />
                                                        </div>

                                                        <div className="space-y-2">
                                                            <Label htmlFor={`sub-title-${sub.id}`} className="text-sm">Meta Title</Label>
                                                            <Input
                                                                id={`sub-title-${sub.id}`}
                                                                value={editingSubGroupData.metaTitle}
                                                                onChange={(e) => updateEditingSubGroup("metaTitle", e.target.value)}
                                                                placeholder="SEO Meta Title"
                                                            />
                                                        </div>

                                                        <div className="space-y-2">
                                                            <Label htmlFor={`sub-keywords-${sub.id}`} className="text-sm">Meta Keywords</Label>
                                                            <Textarea
                                                                id={`sub-keywords-${sub.id}`}
                                                                value={editingSubGroupData.metaKeywords}
                                                                onChange={(e) => updateEditingSubGroup("metaKeywords", e.target.value)}
                                                                placeholder="Comma separated keywords"
                                                                rows={2}
                                                            />
                                                        </div>
                                                    </div>

                                                     <div className="flex items-center justify-between p-3 border rounded bg-white">
                                                         <div className="space-y-0.5">
                                                             <Label className="text-sm">Active Status</Label>
                                                             <p className="text-xs text-muted-foreground">Enable/Disable sub-group</p>
                                                         </div>
                                                         <Switch 
                                                             checked={editingSubGroupData.active}
                                                             onCheckedChange={(checked) => updateEditingSubGroup("active", checked)}
                                                         />
                                                     </div>

                                                     <div className="flex justify-end space-x-2">
                                                         <Button
                                                             type="button"
                                                             variant="outline"
                                                             onClick={() => {
                                                                 setEditingSubGroupId(null);
                                                                 setEditingSubGroupData(null);
                                                             }}
                                                             className="text-xs"
                                                         >
                                                             Cancel
                                                         </Button>
                                                         <Button
                                                             type="button"
                                                             onClick={saveSubGroupEdit}
                                                             style={{ backgroundColor: "#00007A", color: "white" }}
                                                             className="text-xs"
                                                         >
                                                             Save Changes
                                                         </Button>
                                                     </div>
                                                </>
                                            ) : (
                                                <div className="grid grid-cols-1 gap-3 text-sm">
                                                    <div>
                                                        <p className="text-gray-600">URL Key:</p>
                                                        <p className="font-mono text-xs bg-gray-100 p-2 rounded">{sub.urlKey || '-'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-600">Meta Title:</p>
                                                        <p className="text-xs bg-gray-100 p-2 rounded">{sub.metaTitle || '-'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-600">Meta Keywords:</p>
                                                        <p className="text-xs bg-gray-100 p-2 rounded whitespace-pre-wrap">{sub.metaKeywords || '-'}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Status Settings */}
                <div className="space-y-4">
                    <Label className="font-semibold">Status Settings</Label>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-0.5">
                            <Label htmlFor="active" className="text-base">Active Status</Label>
                            <p className="text-sm text-muted-foreground">
                                Enable or disable this group
                            </p>
                        </div>
                        <Switch
                            id="active"
                            checked={formData.active}
                            onCheckedChange={(checked) => handleInputChange("active", checked)}
                        />
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end space-x-4 pt-6">
                    <Button
                        variant="outline"
                        onClick={handlePreview}
                        disabled={loading}
                        style={{ backgroundColor: '#f3f4f6', color: '#00007A', borderColor: '#00007A' }}
                    >
                        Preview
                    </Button>
                    <Button
                        variant="outline"
                        onClick={handleSaveChanges}
                        disabled={loading}
                        style={{ backgroundColor: '#f3f4f6', color: '#00007A', borderColor: '#00007A' }}
                    >
                        Save Changes
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={loading}
                        style={{ backgroundColor: "#00007A", color: "white" }}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                {isEditMode ? "Updating..." : "Creating..."}
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4 mr-2" />
                                {isEditMode ? "Update Group" : "Create Group"}
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
} 