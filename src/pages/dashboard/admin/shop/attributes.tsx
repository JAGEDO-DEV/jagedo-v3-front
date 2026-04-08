/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable react-hooks/exhaustive-deps */
//@ts-ignore
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

const GROUP_SCOPE = "__group__";

const normalizeText = (value?: string | null) =>
    (value || "").trim().toLowerCase();

const getSubGroupNames = (group: any) => {
    if (!group) return [];
    
    const subGroup = group.subGroup;
    if (Array.isArray(subGroup)) {
        return subGroup.map((sub: any) => {
            if (typeof sub === "string") return sub.trim();
            try {
                if (typeof sub === "string" && sub.startsWith("{")) {
                   const parsed = JSON.parse(sub);
                   return (parsed.name || "").trim();
                }
            } catch(e) {}
            return (sub?.name || "").trim();
        }).filter(Boolean);
    }
    
    if (typeof subGroup === "string" && subGroup.trim() !== "") {
        return subGroup.split(",").map((s: string) => s.trim()).filter(Boolean);
    }
    
    return [];
};

export default function ShopAttributes() {
    const axiosInstance = useAxiosWithAuth(import.meta.env.VITE_SERVER_URL);
    const [attributes, setAttributes] = useState<Attribute[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedGroup, setSelectedGroup] = useState("HARDWARE");
    const [attributeToDelete, setAttributeToDelete] =
        useState<Attribute | null>(null);
    const [attributeToToggle, setAttributeToToggle] =
        useState<Attribute | null>(null);
    const [showAddAttribute, setShowAddAttribute] = useState(false);
    const [showEditAttribute, setShowEditAttribute] = useState(false);
    const [editingAttribute, setEditingAttribute] = useState<Attribute | null>(null);
    const [availableGroups, setAvailableGroups] = useState<any[]>([]);


    const groups = [
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

        
        const fetchGroups = async () => {
            try {
                const { getAllGroups } = await import("@/api/groups.api");
                const response = await getAllGroups(axiosInstance);
                if (response.success) {
                    setAvailableGroups(response.data || response.hashSet || []);
                }
            } catch (error) {
                console.error("Error fetching groups:", error);
            }
        };
        fetchGroups();
    }, []);

    const filteredAttributes = attributes?.filter(
        (attribute) => {
            const matchesSearch =
                attribute.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                attribute.values.toLowerCase().includes(searchTerm.toLowerCase()) ||
                attribute.attributeGroup
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase());
                
            const matchesGroup = attribute.productType === selectedGroup;

            return matchesSearch && matchesGroup;
        }
    );

    const renderAttributeValues = (values: string) => {
        const items = (values || "")
            .split(",")
            .map((value) => value.trim())
            .filter(Boolean);

        if (items.length === 0) {
            return <span className="text-sm text-muted-foreground">N/A</span>;
        }

        return (
            <div className="flex flex-wrap gap-1.5">
                {items.map((value, index) => (
                    <Badge
                        key={`${value}-${index}`}
                        variant="outline"
                        className="max-w-full whitespace-normal break-words rounded-md border-slate-200 bg-slate-50 text-slate-700"
                    >
                        {value}
                    </Badge>
                ))}
            </div>
        );
    };

    const handleEditAttribute = (attribute: Attribute) => {
        setEditingAttribute(attribute);
        setShowEditAttribute(true);
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

    if (showAddAttribute || (showEditAttribute && editingAttribute)) {
        return (
            <AddAttributeForm
                onBack={() => {
                    setShowAddAttribute(false);
                    setShowEditAttribute(false);
                    setEditingAttribute(null);
                }}
                onSuccess={() => {
                    setShowAddAttribute(false);
                    setShowEditAttribute(false);
                    setEditingAttribute(null);
                    fetchAttributes();
                }}
                defaultProductType={selectedGroup}
                attribute={editingAttribute}
                isEdit={showEditAttribute}
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
                {groups.map((group) => (
                    <button
                        key={group.type}
                        onClick={() => setSelectedGroup(group.type)}
                        className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${selectedGroup === group.type
                            ? "bg-[#00007A] text-white"
                            : "bg-transparent text-black hover:bg-blue-50"
                            }`}
                    >
                        {group.label}
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
                        {selectedGroup}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table className="min-w-[1180px] table-fixed">
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-14">No</TableHead>
                                <TableHead className="w-[200px]">Attribute Name</TableHead>
                                <TableHead className="w-[140px]">Input Type</TableHead>
                                <TableHead className="w-[220px]">Group</TableHead>
                                <TableHead className="w-[320px]">Attribute Values</TableHead>
                                <TableHead className="w-[120px]">Status</TableHead>
                                <TableHead className="w-[130px]">Filterable</TableHead>
                                <TableHead className="w-[150px]">Customer View</TableHead>
                                <TableHead className="w-[90px] text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={9}
                                        className="text-center py-8"
                                    >
                                        Loading attributes...
                                    </TableCell>
                                </TableRow>
                            ) : filteredAttributes?.length == 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={9}
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
                                        <TableCell className="align-top text-muted-foreground">
                                            {index + 1}
                                        </TableCell>
                                        <TableCell className="align-top font-medium whitespace-normal break-words">
                                            {attribute.type}
                                        </TableCell>
                                        <TableCell className="align-top">
                                            <span className="inline-flex rounded-md bg-slate-100 px-2 py-1 text-xs font-medium uppercase tracking-wide text-slate-700">
                                                {attribute.attributeType || "text"}
                                            </span>
                                        </TableCell>
                                        <TableCell className="align-top whitespace-normal break-words text-sm text-slate-700">
                                            {/* @ts-ignore */}
                                            {attribute.group?.name || attribute.attributeGroup || "N/A"}
                                        </TableCell>
                                        <TableCell className="align-top whitespace-normal">
                                            {renderAttributeValues(attribute.values)}
                                        </TableCell>
                                        <TableCell className="align-top">
                                            <Badge
                                                variant={
                                                    attribute.active
                                                        ? "default"
                                                        : "secondary"
                                                }
                                            >
                                                {attribute.active
                                                    ? "Active"
                                                    : "Inactive"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="align-top">
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
                                        <TableCell className="align-top">
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
                                        <TableCell className="align-top text-right">
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

        </div>
    );
}
