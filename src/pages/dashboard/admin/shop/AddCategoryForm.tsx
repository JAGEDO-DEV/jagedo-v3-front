import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
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
        subCategory: "",
        urlKey: "",
        metaTitle: "",
        metaKeywords: "",
        type: "HARDWARE",
        active: true
    });

    // Main category options
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
                subCategory: category.subCategory || "",
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

    const handleInputChange = (field: string, value: string | boolean) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handlePreview = () => {
        // Implement preview functionality
        toast('Preview functionality coming soon');
    };

    const handleSaveChanges = () => {
        // Implement save as draft functionality
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
                        <div className="space-y-2">
                            <Label htmlFor="subCategory" className="font-semibold">Sub Category</Label>
                            <Input
                                id="subCategory"
                                value={formData.subCategory}
                                onChange={(e) => handleInputChange("subCategory", e.target.value)}
                                placeholder="Enter sub category"
                            />
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