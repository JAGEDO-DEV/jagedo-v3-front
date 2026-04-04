import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save, Loader2, X, Plus, ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "react-hot-toast";
import { createCategory, updateCategory, Category, CategoryCreateRequest, CategoryUpdateRequest } from "@/api/categories.api";
import useAxiosWithAuth from "@/utils/axiosInterceptor";

interface SubCategoryItem {
    id: string;
    name: string;
    urlKey: string;
    metaTitle: string;
    metaKeywords: string;
}

interface AddCategoryFormProps {
    onBack: () => void;
    onSuccess: () => void;
    category?: Category | null;
    isEditMode?: boolean;
}

export default function AddCategoryForm({
    onBack,
    onSuccess,
    category,
    isEditMode = false
}: AddCategoryFormProps) {
    const axiosInstance = useAxiosWithAuth(import.meta.env.VITE_SERVER_URL);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        subCategory: [] as SubCategoryItem[],
        urlKey: "",
        metaTitle: "",
        metaKeywords: "",
        type: "HARDWARE",
        active: true
    });
    const [newSubCategory, setNewSubCategory] = useState("");
    const [expandedSubCategories, setExpandedSubCategories] = useState<Set<string>>(new Set());
    const [editingSubCategoryId, setEditingSubCategoryId] = useState<string | null>(null);
    const [editingSubCategoryData, setEditingSubCategoryData] = useState<SubCategoryItem | null>(null);

    const mainCategories = [
        { value: "HARDWARE", label: "Hardware" },
        { value: "FUNDI", label: "Custom Products" },
        { value: "PROFESSIONAL", label: "Designs" },
        { value: "CONTRACTOR", label: "Hire Machinery & Equipment" }
    ];

    useEffect(() => {
        if (category && isEditMode) {
            const subCats = Array.isArray(category.subCategory) 
                ? category.subCategory.map((sub: any) => typeof sub === "string" 
                    ? { id: Math.random().toString(), name: sub, urlKey: "", metaTitle: "", metaKeywords: "" }
                    : sub
                )
                : [];
            
            setFormData({
                name: category.name,
                subCategory: subCats,
                urlKey: category.urlKey || "",
                metaTitle: category.metaTitle || "",
                metaKeywords: category.metaKeywords || "",
                type: category.type || "HARDWARE",
                active: category.active
            });
        }
    }, [category, isEditMode]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            toast.error("Category name is required");
            return;
        }

        try {
            setLoading(true);

            if (isEditMode && category) {
                const updateData: CategoryUpdateRequest = {
                    id: category.id,
                    name: formData.name,
                    active: formData.active,
                    subCategory: formData.subCategory as any, // Cast to any since API expects string[] but we're using SubCategoryItem[]
                    urlKey: formData.urlKey,
                    metaTitle: formData.metaTitle,
                    metaKeywords: formData.metaKeywords,
                    type: formData.type
                };
                await updateCategory(axiosInstance, category.id, updateData);
                toast.success("Category updated successfully");
            } else {
                const createData: CategoryCreateRequest = {
                    name: formData.name,
                    subCategory: formData.subCategory as any, // Cast to any since API expects string[] but we're using SubCategoryItem[]
                    urlKey: formData.urlKey,
                    metaTitle: formData.metaTitle,
                    metaKeywords: formData.metaKeywords,
                    type: formData.type
                };
                await createCategory(axiosInstance, createData);
                toast.success("Category created successfully");
            }

            onSuccess();
        } catch (error: unknown) {
            console.error("Error saving category:", error);
            const errorMessage = error instanceof Error ? error.message : "Failed to save category";
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

    const addSubCategory = () => {
        if (newSubCategory.trim()) {
            const newId = `sub-${Date.now()}`;
            setFormData(prev => ({
                ...prev,
                subCategory: [...prev.subCategory, {
                    id: newId,
                    name: newSubCategory.trim(),
                    urlKey: "",
                    metaTitle: "",
                    metaKeywords: ""
                }]
            }));
            setNewSubCategory("");
        }
    };

    const removeSubCategory = (id: string) => {
        setFormData(prev => ({
            ...prev,
            subCategory: prev.subCategory.filter((sub) => sub.id !== id)
        }));
    };

    const toggleSubCategoryExpand = (id: string) => {
        const newExpanded = new Set(expandedSubCategories);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedSubCategories(newExpanded);
    };

    const startEditingSubCategory = (sub: SubCategoryItem) => {
        setEditingSubCategoryId(sub.id);
        setEditingSubCategoryData({ ...sub });
    };

    const saveSubCategoryEdit = () => {
        if (!editingSubCategoryData) return;

        setFormData(prev => ({
            ...prev,
            subCategory: prev.subCategory.map(sub => 
                sub.id === editingSubCategoryId ? editingSubCategoryData : sub
            )
        }));
        setEditingSubCategoryId(null);
        setEditingSubCategoryData(null);
        toast.success("Sub-category updated");
    };

    const updateEditingSubCategory = (field: keyof SubCategoryItem, value: string) => {
        if (editingSubCategoryData) {
            setEditingSubCategoryData(prev => ({
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
                <h1 className="text-3xl font-bold">{isEditMode ? 'Edit Category' : 'Add Category'}</h1>
            </div>

            <div className="space-y-8">
                {/* Category Information */}
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Main Category */}
                        <div className="space-y-2">
                            <Label htmlFor="type" className="font-semibold">Main Category</Label>
                            <Select value={formData.type} onValueChange={(value) => handleInputChange("type", value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select..." />
                                </SelectTrigger>
                                <SelectContent className='bg-white'>
                                    {mainCategories.map((category) => (
                                        <SelectItem key={category.value} value={category.value}>
                                            {category.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Category Name */}
                        <div className="space-y-2">
                            <Label htmlFor="name" className="font-semibold">Category Name *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => handleInputChange("name", e.target.value)}
                                placeholder="Enter category name"
                                required
                            />
                        </div>
                    </div>
                </div>

                {/* Parent Category SEO */}
                <div className="space-y-4">
                    <Label className="font-semibold">Category SEO Information</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="urlKey" className="text-sm">URL Key</Label>
                            <Input
                                id="urlKey"
                                value={formData.urlKey}
                                onChange={(e) => handleInputChange("urlKey", e.target.value)}
                                placeholder="Enter URL key"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="metaTitle" className="text-sm">Meta Title</Label>
                            <Input
                                id="metaTitle"
                                value={formData.metaTitle}
                                onChange={(e) => handleInputChange("metaTitle", e.target.value)}
                                placeholder="Enter meta title"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="metaKeywords" className="text-sm">Meta Keywords</Label>
                        <Textarea
                            id="metaKeywords"
                            value={formData.metaKeywords}
                            onChange={(e) => handleInputChange("metaKeywords", e.target.value)}
                            placeholder="Enter meta keywords (comma separated)"
                            rows={2}
                        />
                    </div>
                </div>

                {/* Sub Categories Tree View */}
                <div className="space-y-4">
                    <Label className="font-semibold">Sub Categories</Label>
                    <div className="flex space-x-2 mb-4">
                        <Input
                            value={newSubCategory}
                            onChange={(e) => setNewSubCategory(e.target.value)}
                            placeholder="Enter sub category name"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    addSubCategory();
                                }
                            }}
                        />
                        <Button 
                            type="button" 
                            onClick={addSubCategory}
                            style={{ backgroundColor: "#00007A", color: "white" }}
                        >
                            <Plus className="h-4 w-4 mr-1" />
                            Add
                        </Button>
                    </div>

                    {/* Tree View */}
                    {formData.subCategory.length > 0 && (
                        <div className="border rounded-lg bg-gray-50 p-4 space-y-2">
                            {formData.subCategory.map((sub) => (
                                <div key={sub.id} className="bg-white border rounded-lg overflow-hidden">
                                    {/* Sub Category Header */}
                                    <div className="flex items-center justify-between p-3 hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center space-x-2 flex-1">
                                            <button
                                                type="button"
                                                onClick={() => toggleSubCategoryExpand(sub.id)}
                                                className="p-1 hover:bg-gray-200 rounded"
                                            >
                                                {expandedSubCategories.has(sub.id) ? (
                                                    <ChevronDown className="h-4 w-4" />
                                                ) : (
                                                    <ChevronRight className="h-4 w-4" />
                                                )}
                                            </button>
                                            <div className="flex-1">
                                                <p className="font-medium text-sm">{sub.name}</p>
                                                <p className="text-xs text-gray-500">{sub.urlKey || 'No URL key'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Button 
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                onClick={() => startEditingSubCategory(sub)}
                                                className="text-xs"
                                            >
                                                Edit
                                            </Button>
                                            <button
                                                type="button"
                                                onClick={() => removeSubCategory(sub.id)}
                                                className="p-1 hover:bg-red-100 hover:text-red-600 rounded transition-colors"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Expanded Details */}
                                    {expandedSubCategories.has(sub.id) && (
                                        <div className="border-t bg-gray-50 p-4 space-y-4">
                                            {editingSubCategoryId === sub.id && editingSubCategoryData ? (
                                                <>
                                                    <div className="grid grid-cols-1 gap-4">
                                                        <div className="space-y-2">
                                                            <Label htmlFor={`sub-name-${sub.id}`} className="text-sm">Sub Category Name</Label>
                                                            <Input
                                                                id={`sub-name-${sub.id}`}
                                                                value={editingSubCategoryData.name}
                                                                onChange={(e) => updateEditingSubCategory("name", e.target.value)}
                                                            />
                                                        </div>

                                                        <div className="space-y-2">
                                                            <Label htmlFor={`sub-url-${sub.id}`} className="text-sm">URL Key</Label>
                                                            <Input
                                                                id={`sub-url-${sub.id}`}
                                                                value={editingSubCategoryData.urlKey}
                                                                onChange={(e) => updateEditingSubCategory("urlKey", e.target.value)}
                                                                placeholder="e.g., sub-category-url"
                                                            />
                                                        </div>

                                                        <div className="space-y-2">
                                                            <Label htmlFor={`sub-title-${sub.id}`} className="text-sm">Meta Title</Label>
                                                            <Input
                                                                id={`sub-title-${sub.id}`}
                                                                value={editingSubCategoryData.metaTitle}
                                                                onChange={(e) => updateEditingSubCategory("metaTitle", e.target.value)}
                                                                placeholder="SEO Meta Title"
                                                            />
                                                        </div>

                                                        <div className="space-y-2">
                                                            <Label htmlFor={`sub-keywords-${sub.id}`} className="text-sm">Meta Keywords</Label>
                                                            <Textarea
                                                                id={`sub-keywords-${sub.id}`}
                                                                value={editingSubCategoryData.metaKeywords}
                                                                onChange={(e) => updateEditingSubCategory("metaKeywords", e.target.value)}
                                                                placeholder="Comma separated keywords"
                                                                rows={2}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="flex justify-end space-x-2">
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            onClick={() => {
                                                                setEditingSubCategoryId(null);
                                                                setEditingSubCategoryData(null);
                                                            }}
                                                            className="text-xs"
                                                        >
                                                            Cancel
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            onClick={saveSubCategoryEdit}
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
                                Enable or disable this category
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
                                {isEditMode ? "Update Category" : "Create Category"}
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
} 