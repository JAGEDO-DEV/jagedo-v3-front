import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save, Loader2, X, Plus } from "lucide-react";
import { toast } from "react-hot-toast";
import { createCategory, updateCategory, Category, CategoryCreateRequest, CategoryUpdateRequest } from "@/api/categories.api";
import useAxiosWithAuth from "@/utils/axiosInterceptor";

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
        subCategory: [] as string[],
        urlKey: "",
        metaTitle: "",
        metaKeywords: "",
        type: "HARDWARE",
        active: true
    });
    const [newSubCategory, setNewSubCategory] = useState("");

    
    const mainCategories = [
        { value: "HARDWARE", label: "Hardware" },
        { value: "FUNDI", label: "Custom Products" },
        { value: "PROFESSIONAL", label: "Designs" },
        { value: "CONTRACTOR", label: "Hire Machinery & Equipment" }
    ];

    useEffect(() => {
        if (category && isEditMode) {
            setFormData({
                name: category.name,
                subCategory: Array.isArray(category.subCategory) ? category.subCategory : [],
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
                    subCategory: formData.subCategory,
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
                    subCategory: formData.subCategory,
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
        if (newSubCategory.trim() && !formData.subCategory.includes(newSubCategory.trim())) {
            setFormData(prev => ({
                ...prev,
                subCategory: [...prev.subCategory, newSubCategory.trim()]
            }));
            setNewSubCategory("");
        }
    };

    const removeSubCategory = (index: number) => {
        setFormData(prev => ({
            ...prev,
            subCategory: prev.subCategory.filter((_, i) => i !== index)
        }));
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

                        {/* Sub Category */}
                        <div className="space-y-2 col-span-1 md:col-span-3">
                            <Label htmlFor="subCategory" className="font-semibold">Sub Categories</Label>
                            <div className="flex space-x-2">
                                <Input
                                    id="subCategory"
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
                            
                            {formData.subCategory.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-3 p-3 border rounded-lg bg-gray-50">
                                    {formData.subCategory.map((sub, index) => (
                                        <div 
                                            key={index}
                                            className="flex items-center bg-white border border-[#00007A] text-[#00007A] px-3 py-1 rounded-full text-sm font-medium shadow-sm"
                                        >
                                            {sub}
                                            <button 
                                                type="button"
                                                onClick={() => removeSubCategory(index)}
                                                className="ml-2 hover:text-red-500 transition-colors"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* SEO Information */}
                <div className="space-y-4">
                    <Label className="font-semibold">SEO Information</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* URL Key */}
                        <div className="space-y-2">
                            <Label htmlFor="urlKey" className="text-sm">URL Key</Label>
                            <Input
                                id="urlKey"
                                value={formData.urlKey}
                                onChange={(e) => handleInputChange("urlKey", e.target.value)}
                                placeholder="Enter URL key"
                            />
                        </div>

                        {/* Meta Title */}
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

                    {/* Meta Keywords */}
                    <div className="space-y-2">
                        <Label htmlFor="metaKeywords" className="text-sm">Meta Keywords</Label>
                        <Textarea
                            id="metaKeywords"
                            value={formData.metaKeywords}
                            onChange={(e) => handleInputChange("metaKeywords", e.target.value)}
                            placeholder="Enter meta keywords (comma separated)"
                            rows={3}
                        />
                    </div>
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