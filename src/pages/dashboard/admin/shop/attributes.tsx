/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useCallback } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
    Plus,
    Search,
    Edit,
    Trash2,
    MoreHorizontal,
    CheckCircle,
    XCircle
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

import toast from "react-hot-toast";
import {
    getAllAttributes,
    deleteAttribute,
    toggleAttributeStatus,
    updateAttribute,
    Attribute
} from "@/api/attributes.api";
import useAxiosWithAuth from "@/utils/axiosInterceptor";
import AddAttributeForm from "./AddAttributeForm";

export default function ShopAttributes() {
    const axiosInstance = useAxiosWithAuth(import.meta.env.VITE_SERVER_URL);
    const [attributes, setAttributes] = useState<Attribute[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("HARDWARE");
    const [attributeToDelete, setAttributeToDelete] =
        useState<Attribute | null>(null);
    const [attributeToToggle, setAttributeToToggle] =
        useState<Attribute | null>(null);
    const [showAddAttribute, setShowAddAttribute] = useState(false);
    const [showEditAttribute, setShowEditAttribute] = useState(false);
    const [editingAttribute, setEditingAttribute] = useState<Attribute | null>(null);
    const [editFormData, setEditFormData] = useState({
        type: "",
        productType: "",
        values: "",
        attributeGroup: "",
        categoryId: "",
        filterable: false,
        active: true,
        customerView: false
    });
    const [availableCategories, setAvailableCategories] = useState<any[]>([]);

    const categories = [
        { label: "Hardware", type: "HARDWARE" },
        { label: "Custom Products", type: "FUNDI" },
        { label: "Designs", type: "PROFESSIONAL" },
        { label: "Machinery & Equipment", type: "CONTRACTOR" }
    ];

    const fetchAttributes = useCallback(async () => {
        try {
            setLoading(true);
            const response = await getAllAttributes(axiosInstance);
            if (response.success) {
                const data = (response.data || response.hashSet) as Attribute[];
                if (Array.isArray(data)) {
                    setAttributes(data);
                }
            }
        } catch (error) {
            console.error("Error fetching attributes:", error);
            toast.error("Failed to fetch attributes");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAttributes();

        // Fetch categories for the edit form
        const fetchCategories = async () => {
            try {
                const { getAllCategories } = await import("@/api/categories.api");
                const response = await getAllCategories(axiosInstance);
                if (response.success) {
                    setAvailableCategories(response.data || response.hashSet || []);
                }
            } catch (error) {
                console.error("Error fetching categories:", error);
            }
        };
        fetchCategories();
    }, []);

    const filteredAttributes = attributes?.filter(
        (attribute) => {
            const matchesSearch =
                attribute.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                attribute.values.toLowerCase().includes(searchTerm.toLowerCase()) ||
                attribute.attributeGroup
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase());

            const matchesCategory = attribute.productType === selectedCategory;

            return matchesSearch && matchesCategory;
        }
    );

    const handleEditAttribute = (attribute: Attribute) => {
        setEditingAttribute(attribute);
        setEditFormData({
            type: attribute.type,
            productType: attribute.productType,
            values: attribute.values,
            attributeGroup: attribute.attributeGroup,
            //@ts-ignore
            categoryId: attribute.categoryId?.toString() || "",
            filterable: attribute.filterable,
            active: attribute.active,
            customerView: attribute.customerView
        });
        setShowEditAttribute(true);
    };

    const handleSaveEditAttribute = async () => {
        if (!editingAttribute) return;

        const isDuplicate = attributes.some((attr) =>
            attr.id !== editingAttribute.id &&
            attr.type.toLowerCase().trim() === editFormData.type.toLowerCase().trim() &&
            attr.productType === editFormData.productType
        );

        if (isDuplicate) {
            toast.error("An attribute with this name already exists for the selected product type.");
            return;
        }

        try {
            const response = await updateAttribute(axiosInstance, editingAttribute.id, {
                id: editingAttribute.id,
                ...editFormData
            });
            if (response.success) {
                toast.success("Attribute updated successfully");
                setShowEditAttribute(false);
                fetchAttributes();
            } else {
                toast.error(response.message || "Failed to update attribute");
            }
        } catch (error) {
            console.error("Error updating attribute:", error);
            toast.error("Failed to update attribute");
        }
    };

    const handleDeleteAttribute = (attribute: Attribute) => {
        setAttributeToDelete(attribute);
    };

    const deleteAttributeHandler = async () => {
        if (!attributeToDelete) return;

        try {
            const response = await deleteAttribute(
                axiosInstance,
                attributeToDelete.id
            );
            if (response.success) {
                toast.success("Attribute deleted successfully");
                fetchAttributes();
            } else {
                toast.error(response.message || "Failed to delete attribute");
            }
        } catch (error) {
            console.error("Error deleting attribute:", error);
            toast.error("Failed to delete attribute");
        } finally {
            setAttributeToDelete(null);
        }
    };

    const handleToggleAttributeStatus = (attribute: Attribute) => {
        setAttributeToToggle(attribute);
    };

    const toggleAttributeStatusHandler = async () => {
        if (!attributeToToggle) return;

        try {
            const response = await toggleAttributeStatus(
                axiosInstance,
                attributeToToggle.id,
                attributeToToggle.active
            );
            if (response.success) {
                toast.success(
                    `Attribute ${attributeToToggle.active ? "disabled" : "enabled"
                    } successfully`
                );
                fetchAttributes();
            } else {
                toast.error(
                    response.message || "Failed to toggle attribute status"
                );
            }
        } catch (error) {
            console.error("Error toggling attribute status:", error);
            toast.error("Failed to toggle attribute status");
        } finally {
            setAttributeToToggle(null);
        }
    };

    const handleAddAttribute = () => {
        setShowAddAttribute(true);
    };

    if (showAddAttribute) {
        return (
            <AddAttributeForm
                onBack={() => {
                    setShowAddAttribute(false);
                }}
                onSuccess={() => {
                    setShowAddAttribute(false);
                    fetchAttributes();
                }}
                defaultProductType={selectedCategory}
            />
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Attributes
                    </h1>
                    <p className="text-muted-foreground">
                        Manage product attributes and specifications.
                    </p>
                </div>
                <Button
                    onClick={handleAddAttribute}
                    style={{ backgroundColor: "#00007A", color: "white" }}
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Attribute
                </Button>
            </div>

            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                {categories.map((category) => (
                    <button
                        key={category.type}
                        onClick={() => setSelectedCategory(category.type)}
                        className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${selectedCategory === category.type
                            ? "bg-[#00007A] text-white"
                            : "bg-transparent text-black hover:bg-blue-50"
                            }`}
                    >
                        {category.label}
                    </button>
                ))}
            </div>

            <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search attributes..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Product Attributes</CardTitle>
                    <CardDescription>
                        Manage product specifications and features for{" "}
                        {selectedCategory}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>No</TableHead>
                                <TableHead>Attribute Name</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Attribute Values</TableHead>
                                <TableHead>Is Required</TableHead>
                                <TableHead>Is Filterable</TableHead>
                                <TableHead>Show To Customers</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={8}
                                        className="text-center py-8"
                                    >
                                        Loading attributes...
                                    </TableCell>
                                </TableRow>
                            ) : filteredAttributes?.length == 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={8}
                                        className="text-center py-8 text-muted-foreground"
                                    >
                                        No attributes found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredAttributes?.map((attribute, index) => (
                                    <TableRow
                                        key={attribute.id}
                                        className={!attribute.active ? "bg-gray-100 opacity-60 grayscale" : ""}
                                    >
                                        <TableCell>{index + 1}</TableCell>
                                        <TableCell className="font-medium">
                                            {attribute.type}
                                        </TableCell>
                                        <TableCell>
                                            {/* @ts-ignore */}
                                            {attribute.category?.name || attribute.attributeGroup || "N/A"}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">
                                                {attribute.type}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {attribute.values}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={
                                                    attribute.active
                                                        ? "default"
                                                        : "secondary"
                                                }
                                            >
                                                {attribute.active
                                                    ? "Yes"
                                                    : "Inactive"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={
                                                    attribute.filterable
                                                        ? "default"
                                                        : "secondary"
                                                }
                                            >
                                                {attribute.filterable
                                                    ? "Yes"
                                                    : "No"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={
                                                    attribute.customerView
                                                        ? "default"
                                                        : "secondary"
                                                }
                                            >
                                                {attribute.customerView
                                                    ? "Yes"
                                                    : "No"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        className="h-8 w-8 p-0"
                                                    >
                                                        <span className="sr-only">
                                                            Open menu
                                                        </span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem
                                                        onClick={() =>
                                                            handleEditAttribute(attribute)
                                                        }
                                                    >
                                                        <Edit className="mr-2 h-4 w-4" />
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() =>
                                                            handleToggleAttributeStatus(
                                                                attribute
                                                            )
                                                        }
                                                    >
                                                        {attribute.active ? (
                                                            <XCircle className="mr-2 h-4 w-4" />
                                                        ) : (
                                                            <CheckCircle className="mr-2 h-4 w-4" />
                                                        )}
                                                        {attribute.active
                                                            ? "Disable"
                                                            : "Enable"}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() =>
                                                            handleDeleteAttribute(
                                                                attribute
                                                            )
                                                        }
                                                        className="text-red-600"
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={!!attributeToDelete} onOpenChange={(open) => !open && setAttributeToDelete(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Attribute</DialogTitle>
                    </DialogHeader>
                    <p className="text-gray-600">
                        Are you sure you want to delete "{attributeToDelete?.type}"? This action cannot be undone.
                    </p>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setAttributeToDelete(null)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={deleteAttributeHandler}
                        >
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={!!attributeToToggle} onOpenChange={(open) => !open && setAttributeToToggle(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {attributeToToggle?.active ? "Disable" : "Enable"} Attribute
                        </DialogTitle>
                    </DialogHeader>
                    <p className="text-gray-600">
                        Are you sure you want to{" "}
                        {attributeToToggle?.active ? "disable" : "enable"} "{attributeToToggle?.type}"?
                    </p>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setAttributeToToggle(null)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant={attributeToToggle?.active ? "destructive" : "default"}
                            onClick={toggleAttributeStatusHandler}
                        >
                            {attributeToToggle?.active ? "Disable" : "Enable"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={showEditAttribute} onOpenChange={setShowEditAttribute}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Attribute</DialogTitle>
                        <DialogDescription>
                            Update the attribute details below.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-type">Attribute Name</Label>
                            <Input
                                id="edit-type"
                                value={editFormData.type}
                                onChange={(e) =>
                                    setEditFormData({
                                        ...editFormData,
                                        type: e.target.value
                                    })
                                }
                                placeholder="e.g., Color, Size"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-product-type">Product Type</Label>
                            <Select
                                value={editFormData.productType}
                                onValueChange={(value) =>
                                    setEditFormData({
                                        ...editFormData,
                                        productType: value
                                    })
                                }
                            >
                                <SelectTrigger id="edit-product-type">
                                    <SelectValue placeholder="Select product type" />
                                </SelectTrigger>
                                <SelectContent className='bg-white'>
                                    <SelectItem value="HARDWARE">Hardware</SelectItem>
                                    <SelectItem value="FUNDI">Custom Products</SelectItem>
                                    <SelectItem value="PROFESSIONAL">Designs</SelectItem>
                                    <SelectItem value="CONTRACTOR">Hire Machinery & E</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-values">Values</Label>
                            <Input
                                id="edit-values"
                                value={editFormData.values}
                                onChange={(e) =>
                                    setEditFormData({
                                        ...editFormData,
                                        values: e.target.value
                                    })
                                }
                                placeholder="e.g., Red, Blue, Green"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-group">Category (Attribute Group)</Label>
                            <Select
                                value={editFormData.categoryId}
                                onValueChange={(value) => {
                                    const selectedCat = availableCategories.find(c => c.id.toString() === value);
                                    setEditFormData({
                                        ...editFormData,
                                        //@ts-ignore
                                        categoryId: value,
                                        attributeGroup: selectedCat ? selectedCat.name : ""
                                    });
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent className='bg-white'>
                                    {availableCategories
                                        .filter(cat =>
                                            cat.active &&
                                            ((cat.type || "").trim().toUpperCase() === editFormData.productType ||
                                                (editFormData.productType === "HARDWARE" && !cat.type))
                                        )
                                        .map((cat) => (
                                            <SelectItem key={cat.id.toString()} value={cat.id.toString()}>
                                                {cat.name}
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="edit-filterable"
                                    checked={editFormData.filterable}
                                    onCheckedChange={(checked) =>
                                        setEditFormData({
                                            ...editFormData,
                                            filterable: checked as boolean
                                        })
                                    }
                                />
                                <Label htmlFor="edit-filterable" className="cursor-pointer">
                                    Is Filterable
                                </Label>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="edit-customer-view"
                                    checked={editFormData.customerView}
                                    onCheckedChange={(checked) =>
                                        setEditFormData({
                                            ...editFormData,
                                            customerView: checked as boolean
                                        })
                                    }
                                />
                                <Label htmlFor="edit-customer-view" className="cursor-pointer">
                                    Show To Customers
                                </Label>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="edit-active"
                                    checked={editFormData.active}
                                    onCheckedChange={(checked) =>
                                        setEditFormData({
                                            ...editFormData,
                                            active: checked as boolean
                                        })
                                    }
                                />
                                <Label htmlFor="edit-active" className="cursor-pointer">
                                    Active
                                </Label>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowEditAttribute(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSaveEditAttribute}
                            style={{ backgroundColor: "#00007A", color: "white" }}
                        >
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}