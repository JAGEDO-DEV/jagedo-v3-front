/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Folder,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  X,
} from "lucide-react";
import { toast } from "react-hot-toast";
import {
  getAllCategories,
  deleteCategory as deleteCategoryAPI,
  toggleCategoryStatus as toggleCategoryStatusAPI,
  createCategory,
  updateCategory,
  Category,
} from "@/api/categories.api";
import useAxiosWithAuth from "@/utils/axiosInterceptor";

export default function ShopCategories() {
  const axiosInstance = useAxiosWithAuth(import.meta.env.VITE_SERVER_URL);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedCategoryDetail, setSelectedCategoryDetail] =
    useState<Category | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showStatusConfirm, setShowStatusConfirm] = useState(false);
  const [showCreateCategoryModal, setShowCreateCategoryModal] = useState(false);
  const [showAddSubCategoryModal, setShowAddSubCategoryModal] = useState(false);
  const [showEditCategoryModal, setShowEditCategoryModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [categoryToToggle, setCategoryToToggle] = useState<Category | null>(null);
  const [parentCategoryForSub, setParentCategoryForSub] = useState<Category | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [selectedCategoryType, setSelectedCategoryType] = useState("HARDWARE");

  const [editCategoryData, setEditCategoryData] = useState<{
    id: number | string;
    name: string;
    subCategory: string[];
    urlKey: string;
    metaTitle: string;
    metaKeywords: string;
    type: string;
  }>({
    id: 0,
    name: "",
    subCategory: [],
    urlKey: "",
    metaTitle: "",
    metaKeywords: "",
    type: "",
  });

  // For edit modal — new subcategory input
  const [newSubCategoryInput, setNewSubCategoryInput] = useState("");

  const [subCategoryData, setSubCategoryData] = useState({
    name: "",
    urlKey: "",
    metaTitle: "",
    metaKeywords: "",
  });

  const statuses = [
    { id: "all", label: "All" },
    { id: "active", label: "Active" },
    { id: "inactive", label: "Inactive" },
  ];

  const categoryTypes = [
    { id: "HARDWARE", label: "Hardware", type: "HARDWARE" },
    { id: "CUSTOM_PRODUCTS", label: "Custom Products", type: "FUNDI" },
    { id: "DESIGNS", label: "Designs", type: "PROFESSIONAL" },
    { id: "HIRE_MACHINERY", label: "Hire Machinery & Equipment", type: "CONTRACTOR" },
  ];

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getAllCategories(axiosInstance);
      if (response.success) {
        setCategories(response.data || []);
      } else {
        toast.error("Failed to fetch categories");
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("Failed to fetch categories");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleEditCategory = (category: Category) => {
    setEditCategoryData({
      id: category.id,
      name: category.name,
      subCategory: Array.isArray(category.subCategory) ? category.subCategory : [],
      urlKey: category.urlKey || "",
      metaTitle: category.metaTitle || "",
      metaKeywords: category.metaKeywords || "",
      type: category.type || "",
    });
    setNewSubCategoryInput("");
    setShowEditCategoryModal(true);
  };

  // Add subcategory tag in edit modal
  const handleAddSubCategoryTag = () => {
    const val = newSubCategoryInput.trim();
    if (!val) return;
    if (editCategoryData.subCategory.map(s => s.toLowerCase()).includes(val.toLowerCase())) {
      toast.error(`"${val}" already exists`);
      return;
    }
    setEditCategoryData(prev => ({
      ...prev,
      subCategory: [...prev.subCategory, val],
    }));
    setNewSubCategoryInput("");
  };

  // Remove subcategory tag in edit modal
  const handleRemoveSubCategoryTag = (index: number) => {
    setEditCategoryData(prev => ({
      ...prev,
      subCategory: prev.subCategory.filter((_, i) => i !== index),
    }));
  };

  const handleUpdateCategory = async () => {
    if (!editCategoryData.name.trim()) {
      toast.error("Category name is required");
      return;
    }

    try {
      await updateCategory(axiosInstance, editCategoryData.id, {
        id: editCategoryData.id,
        name: editCategoryData.name.trim(),
        active: true,
        subCategory: editCategoryData.subCategory, // ✅ array
        urlKey: editCategoryData.urlKey.trim(),
        metaTitle: editCategoryData.metaTitle.trim(),
        metaKeywords: editCategoryData.metaKeywords.trim(),
        type: editCategoryData.type,
      });
      toast.success("Category updated successfully");
      setShowEditCategoryModal(false);
      fetchCategories();
    } catch (error) {
      console.error("Error updating category:", error);
      toast.error("Failed to update category");
    }
  };

  const handleAddSubCategory = (category: Category) => {
    setParentCategoryForSub(category);
    setShowAddSubCategoryModal(true);
  };

  const handleDeleteCategory = (category: Category) => {
    setCategoryToDelete(category);
    setShowDeleteConfirm(true);
  };

  const deleteCategory = async () => {
    if (!categoryToDelete) return;
    try {
      await deleteCategoryAPI(axiosInstance, categoryToDelete.id);
      toast.success("Category deleted successfully");
      fetchCategories();
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error("Failed to delete category");
    } finally {
      setShowDeleteConfirm(false);
      setCategoryToDelete(null);
    }
  };

  const handleToggleCategoryStatus = (category: Category) => {
    setCategoryToToggle(category);
    setShowStatusConfirm(true);
  };

  const toggleCategoryStatus = async () => {
    if (!categoryToToggle) return;
    try {
      await toggleCategoryStatusAPI(axiosInstance, categoryToToggle.id, categoryToToggle.active);
      toast.success(
        categoryToToggle.active ? "Category disabled successfully" : "Category enabled successfully",
      );
      fetchCategories();
    } catch (error) {
      console.error("Error toggling category status:", error);
      toast.error("Failed to update category status");
    } finally {
      setShowStatusConfirm(false);
      setCategoryToToggle(null);
    }
  };

  const handleCreateCategory = async () => {
    const trimmedName = newCategoryName.trim();
    if (!trimmedName) {
      toast.error("Category name is required");
      return;
    }
    const isDuplicate = categories.some(
      (category) => category.name.trim().toLowerCase() === trimmedName.toLowerCase(),
    );
    if (isDuplicate) {
      toast.error(`A category with the name "${trimmedName}" already exists.`);
      return;
    }
    try {
      await createCategory(axiosInstance, {
        name: trimmedName,
        type: selectedCategoryType,
      });
      toast.success("Category created successfully");
      setNewCategoryName("");
      setShowCreateCategoryModal(false);
      fetchCategories();
    } catch (error) {
      console.error("Error creating category:", error);
      toast.error("Failed to create category");
    }
  };

  const handleCreateSubCategory = async () => {
    if (!subCategoryData.name.trim()) {
      toast.error("Sub-category name is required");
      return;
    }
    if (!parentCategoryForSub) {
      toast.error("Parent category is required");
      return;
    }

    const existing = Array.isArray(parentCategoryForSub.subCategory)
      ? parentCategoryForSub.subCategory
      : [];

    if (existing.map((s) => s.toLowerCase()).includes(subCategoryData.name.trim().toLowerCase())) {
      toast.error(`"${subCategoryData.name.trim()}" already exists`);
      return;
    }

    try {
      await updateCategory(axiosInstance, parentCategoryForSub.id, {
        id: parentCategoryForSub.id,
        name: parentCategoryForSub.name,
        active: parentCategoryForSub.active,
        type: parentCategoryForSub.type || selectedCategoryType,
        subCategory: [...existing, subCategoryData.name.trim()], // ✅ append to array
        urlKey: subCategoryData.urlKey.trim() || parentCategoryForSub.urlKey,
        metaTitle: subCategoryData.metaTitle.trim() || parentCategoryForSub.metaTitle,
        metaKeywords: subCategoryData.metaKeywords.trim() || parentCategoryForSub.metaKeywords,
      });
      toast.success("Sub-category added successfully");
      setSubCategoryData({ name: "", urlKey: "", metaTitle: "", metaKeywords: "" });
      setShowAddSubCategoryModal(false);
      setParentCategoryForSub(null);
      fetchCategories();
    } catch (error) {
      console.error("Error creating sub-category:", error);
      toast.error("Failed to create sub-category");
    }
  };

  // ✅ Updated: search inside array
  const filteredCategories = categories?.filter((category) => {
    const matchesSearch =
      category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (Array.isArray(category.subCategory)
        ? category.subCategory.some((s) => s.toLowerCase().includes(searchTerm.toLowerCase()))
        : false) ||
      (category.urlKey || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (category.metaTitle || "").toLowerCase().includes(searchTerm.toLowerCase());

    let matchesStatus = true;
    if (selectedStatus === "active") matchesStatus = category.active;
    else if (selectedStatus === "inactive") matchesStatus = !category.active;

    let matchesType = true;
    if (selectedCategoryType) {
      matchesType =
        category.type === selectedCategoryType ||
        (selectedCategoryType === "HARDWARE" && !category.type);
    }

    return matchesSearch && matchesStatus && matchesType;
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  // ✅ Sub-category badge list renderer (reusable)
  const SubCategoryBadges = ({ subCategory }: { subCategory?: string[] }) => {
    if (!Array.isArray(subCategory) || subCategory.length === 0) {
      return <span className="text-sm text-muted-foreground">-</span>;
    }
    return (
      <div className="flex flex-wrap gap-1">
        {subCategory.map((sub, i) => (
          <span
            key={i}
            className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-200"
          >
            {sub}
          </span>
        ))}
      </div>
    );
  };

  const CategoryDetailModal = ({
    category,
    isOpen,
    onClose,
  }: {
    category: Category | null;
    isOpen: boolean;
    onClose: () => void;
  }) => {
    if (!category) return null;

    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Folder className="h-5 w-5" />
              Category Details
            </DialogTitle>
            <DialogDescription>Detailed information about {category.name}</DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Basic Information</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Category Name</label>
                  <p className="text-lg font-semibold">{category.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Category ID</label>
                  <p className="font-mono text-sm">{category.id}</p>
                </div>

                {/* ✅ Render subcategories as badges */}
                {Array.isArray(category.subCategory) && category.subCategory.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Sub Categories</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {category.subCategory.map((sub, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full border border-blue-200"
                        >
                          {sub}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {category.urlKey && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">URL Key</label>
                    <p className="font-mono text-sm">{category.urlKey}</p>
                  </div>
                )}
              </div>
            </div>

            {(category.metaTitle || category.metaKeywords) && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">SEO Information</h3>
                <div className="space-y-3">
                  {category.metaTitle && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Meta Title</label>
                      <p className="text-gray-700">{category.metaTitle}</p>
                    </div>
                  )}
                  {category.metaKeywords && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Meta Keywords</label>
                      <p className="text-gray-700">{category.metaKeywords}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Status Information</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={category.active ? "default" : "secondary"}>
                      {category.active ? "Active" : "Inactive"}
                    </Badge>
                    {category.active ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Statistics</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">0</div>
                  <div className="text-sm text-gray-500">Products</div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {Array.isArray(category.subCategory) ? category.subCategory.length : 0}
                  </div>
                  <div className="text-sm text-gray-500">Subcategories</div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button
              onClick={() => {
                onClose();
                handleEditCategory(category);
              }}
              style={{ backgroundColor: "#00007A", color: "white" }}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Category
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
          <p className="text-muted-foreground">
            Manage all product categories and their organization.
          </p>
        </div>
      </div>

      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {categoryTypes.map((categoryType) => (
          <button
            key={categoryType.id}
            onClick={() => setSelectedCategoryType(categoryType.type)}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
              selectedCategoryType === categoryType.type
                ? "bg-[#00007A] text-white shadow-sm"
                : "bg-transparent text-gray-600 hover:bg-gray-200 hover:text-gray-900"
            }`}
          >
            {categoryType.label}
          </button>
        ))}
      </div>

      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
        {statuses.map((status) => (
          <button
            key={status.id}
            onClick={() => setSelectedStatus(status.id)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              selectedStatus === status.id
                ? "bg-[#00007A] text-white"
                : "bg-transparent text-black hover:bg-blue-50"
            }`}
          >
            {status.label}
          </button>
        ))}
      </div>

      <div className="flex items-center space-x-2 bg-white border-none">
        <div className="relative flex-1 border-none">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search categories..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button
          onClick={() => setShowCreateCategoryModal(true)}
          style={{ backgroundColor: "#00007A", color: "white" }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add a Category
        </Button>
      </div>

      <Card className="bg-white border-none shadow-md">
        <CardHeader>
          <CardTitle>Categories</CardTitle>
          <CardDescription>Manage all product categories in the shop</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Loading categories...</div>
            </div>
          ) : filteredCategories?.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">No categories found.</div>
            </div>
          ) : (
            <div className="rounded-md border border-gray-200 shadow-md p-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">No.</TableHead>
                    <TableHead>Category Name</TableHead>
                    <TableHead>Sub Categories</TableHead>
                    <TableHead>URL Key</TableHead>
                    <TableHead>Meta Title</TableHead>
                    <TableHead>Meta Keywords</TableHead>
                    <TableHead className="w-32">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCategories?.map((category, index) => (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Folder className="h-5 w-5 text-blue-500" />
                          <div>
                            <div className="font-medium">{category.name}</div>
                            <div className="text-sm text-muted-foreground">ID: {category.id}</div>
                          </div>
                        </div>
                      </TableCell>

                      {/* ✅ Render subcategory array as badges */}
                      <TableCell>
                        <SubCategoryBadges subCategory={category.subCategory} />
                      </TableCell>

                      <TableCell>
                        <div className="text-sm text-muted-foreground">{category.urlKey || "-"}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">{category.metaTitle || "-"}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">{category.metaKeywords || "-"}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            onClick={() => handleAddSubCategory(category)}
                            style={{ backgroundColor: "#00007A", color: "white" }}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add Sub
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditCategory(category)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggleCategoryStatus(category)}>
                                {category.active ? (
                                  <XCircle className="mr-2 h-4 w-4" />
                                ) : (
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                )}
                                {category.active ? "Disable" : "Enable"}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteCategory(category)}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">Rows per page:</span>
          <select className="border rounded px-2 py-1 text-sm">
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
          </select>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" disabled>Prev</Button>
          <span className="text-sm text-muted-foreground">Page 1 of 0</span>
          <Button variant="outline" size="sm" disabled>Next</Button>
        </div>
      </div>

      <CategoryDetailModal
        category={selectedCategoryDetail}
        isOpen={showCategoryModal}
        onClose={() => {
          setShowCategoryModal(false);
          setSelectedCategoryDetail(null);
        }}
      />

      {/* Create Category Modal */}
      <Dialog open={showCreateCategoryModal} onOpenChange={setShowCreateCategoryModal}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Create New Category</DialogTitle>
            <DialogDescription>Enter the name for the new category</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label htmlFor="categoryName" className="block text-sm font-medium text-gray-700 mb-2">
                Category Name *
              </label>
              <Input
                id="categoryName"
                placeholder="Enter category name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyPress={(e) => { if (e.key === "Enter") handleCreateCategory(); }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateCategoryModal(false)}>Cancel</Button>
            <Button onClick={handleCreateCategory} style={{ backgroundColor: "#00007A", color: "white" }}>
              Create Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Sub-Category Modal */}
      <Dialog open={showAddSubCategoryModal} onOpenChange={setShowAddSubCategoryModal}>
        <DialogContent className="max-w-2xl bg-white">
          <DialogHeader>
            <DialogTitle>Add Sub-Category</DialogTitle>
            <DialogDescription>
              Add a sub-category to "{parentCategoryForSub?.name}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Parent Category</label>
              <Input value={parentCategoryForSub?.name || ""} disabled className="bg-gray-50" />
            </div>

            {/* Show existing subcategories */}
            {Array.isArray(parentCategoryForSub?.subCategory) && parentCategoryForSub.subCategory.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Existing Sub-Categories
                </label>
                <div className="flex flex-wrap gap-1 p-2 bg-gray-50 rounded-lg border">
                  {parentCategoryForSub.subCategory.map((sub, i) => (
                    <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-200">
                      {sub}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label htmlFor="subCategoryName" className="block text-sm font-medium text-gray-700 mb-2">
                New Sub-category Name *
              </label>
              <Input
                id="subCategoryName"
                placeholder="Enter sub-category name"
                value={subCategoryData.name}
                onChange={(e) => setSubCategoryData((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-700">Search Engine Optimize</h4>
              <div>
                <label htmlFor="urlKey" className="block text-sm font-medium text-gray-700 mb-2">URL Key</label>
                <Input
                  id="urlKey"
                  placeholder="Enter URL key"
                  value={subCategoryData.urlKey}
                  onChange={(e) => setSubCategoryData((prev) => ({ ...prev, urlKey: e.target.value }))}
                />
              </div>
              <div>
                <label htmlFor="metaTitle" className="block text-sm font-medium text-gray-700 mb-2">Meta Title</label>
                <Input
                  id="metaTitle"
                  placeholder="Enter meta title"
                  value={subCategoryData.metaTitle}
                  onChange={(e) => setSubCategoryData((prev) => ({ ...prev, metaTitle: e.target.value }))}
                />
              </div>
              <div>
                <label htmlFor="metaKeywords" className="block text-sm font-medium text-gray-700 mb-2">Meta Keywords</label>
                <Input
                  id="metaKeywords"
                  placeholder="Enter meta keywords (comma separated)"
                  value={subCategoryData.metaKeywords}
                  onChange={(e) => setSubCategoryData((prev) => ({ ...prev, metaKeywords: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddSubCategoryModal(false)}>Cancel</Button>
            <Button onClick={handleCreateSubCategory} style={{ backgroundColor: "#00007A", color: "white" }}>
              Add Sub-Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{categoryToDelete?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
            <Button onClick={deleteCategory} style={{ backgroundColor: "#dc2626", color: "white" }}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Toggle Confirm */}
      <Dialog open={showStatusConfirm} onOpenChange={setShowStatusConfirm}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>{categoryToToggle?.active ? "Disable" : "Enable"} Category</DialogTitle>
            <DialogDescription>
              Are you sure you want to {categoryToToggle?.active ? "disable" : "enable"} "{categoryToToggle?.name}"?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatusConfirm(false)}>Cancel</Button>
            <Button onClick={toggleCategoryStatus} style={{ backgroundColor: "#00007A", color: "white" }}>
              {categoryToToggle?.active ? "Disable" : "Enable"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Category Modal */}
      <Dialog open={showEditCategoryModal} onOpenChange={setShowEditCategoryModal}>
        <DialogContent className="max-w-2xl bg-white">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>Update category information for "{editCategoryData.name}"</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label htmlFor="editCategoryName" className="block text-sm font-medium text-gray-700 mb-2">
                Category Name *
              </label>
              <Input
                id="editCategoryName"
                placeholder="Enter category name"
                value={editCategoryData.name}
                onChange={(e) => setEditCategoryData((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>

            {/* ✅ Sub-categories as tag input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sub Categories</label>

              {/* Existing tags */}
              {editCategoryData.subCategory.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2 p-2 bg-gray-50 rounded-lg border">
                  {editCategoryData.subCategory.map((sub, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-200"
                    >
                      {sub}
                      <button
                        type="button"
                        onClick={() => handleRemoveSubCategoryTag(i)}
                        className="hover:text-red-600 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Add new tag */}
              <div className="flex gap-2">
                <Input
                  placeholder="Type a sub-category and press Add"
                  value={newSubCategoryInput}
                  onChange={(e) => setNewSubCategoryInput(e.target.value)}
                  onKeyPress={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddSubCategoryTag(); } }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddSubCategoryTag}
                  className="shrink-0"
                >
                  Add
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-700">Search Engine Optimize</h4>
              <div>
                <label htmlFor="editUrlKey" className="block text-sm font-medium text-gray-700 mb-2">URL Key</label>
                <Input
                  id="editUrlKey"
                  placeholder="Enter URL key"
                  value={editCategoryData.urlKey}
                  onChange={(e) => setEditCategoryData((prev) => ({ ...prev, urlKey: e.target.value }))}
                />
              </div>
              <div>
                <label htmlFor="editMetaTitle" className="block text-sm font-medium text-gray-700 mb-2">Meta Title</label>
                <Input
                  id="editMetaTitle"
                  placeholder="Enter meta title"
                  value={editCategoryData.metaTitle}
                  onChange={(e) => setEditCategoryData((prev) => ({ ...prev, metaTitle: e.target.value }))}
                />
              </div>
              <div>
                <label htmlFor="editMetaKeywords" className="block text-sm font-medium text-gray-700 mb-2">Meta Keywords</label>
                <Input
                  id="editMetaKeywords"
                  placeholder="Enter meta keywords (comma separated)"
                  value={editCategoryData.metaKeywords}
                  onChange={(e) => setEditCategoryData((prev) => ({ ...prev, metaKeywords: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditCategoryModal(false)}>Cancel</Button>
            <Button onClick={handleUpdateCategory} style={{ backgroundColor: "#00007A", color: "white" }}>
              Update Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}