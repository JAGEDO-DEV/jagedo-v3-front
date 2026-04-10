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
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    Plus,
    Search,
    Edit,
    Trash2,
    ChevronDown,
    ChevronUp,
    Download,
    Upload
} from "lucide-react";

import toast from "react-hot-toast";
import {
    getAllAttributes,
    deleteAttribute,
    toggleAttributeStatus,
    Attribute
} from "@/api/attributes.api";
import useAxiosWithAuth from "@/utils/axiosInterceptor";
import AddAttributeForm from "./AddAttributeForm";

const groups = [
    { label: "Hardware", type: "HARDWARE" },
    { label: "Custom Products", type: "FUNDI" },
    { label: "Designs", type: "PROFESSIONAL" },
    { label: "Hire of Machinery & Equipment", type: "CONTRACTOR" }
];

export default function ShopAttributes() {
    const axiosInstance = useAxiosWithAuth(import.meta.env.VITE_SERVER_URL);
    const [attributes, setAttributes] = useState<Attribute[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedGroup, setSelectedGroup] = useState("HARDWARE");
    const [attributeToDelete, setAttributeToDelete] = useState<Attribute | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingAttribute, setEditingAttribute] = useState<Attribute | null>(null);
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

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
    }, []);

    const filteredAttributes = attributes?.filter((attr) => {
        
        const groupType = (attr.group?.type || attr.productType || "").toUpperCase();
        const matchesGroup = groupType === selectedGroup;
        if (!matchesGroup) return false;
        if (!searchTerm) return true;
        const q = searchTerm.toLowerCase();
        return (
            (attr.type || "").toLowerCase().includes(q) ||
            (attr.attributeGroup || "").toLowerCase().includes(q) ||
            (attr.group?.name || "").toLowerCase().includes(q)
        );
    });

    
    const groupedAttributes = filteredAttributes?.reduce(
        (acc: Record<string, Attribute[]>, attr) => {
            //@ts-ignore
            const groupName = attr.group?.name || attr.attributeGroup || "Ungrouped";
            if (!acc[groupName]) acc[groupName] = [];
            acc[groupName].push(attr);
            return acc;
        },
        {}
    );

    
    const sortedGroupKeys = Object.keys(groupedAttributes || {}).sort();

    
    const toggleGroupExpand = (groupName: string) => {
        setExpandedGroups((prev) => ({
            ...prev,
            [groupName]: !prev[groupName]
        }));
    };

    const isGroupExpanded = (groupName: string) =>
        expandedGroups[groupName] !== false; 

    const handleEditAttribute = (attribute: Attribute) => {
        setEditingAttribute(attribute);
        setShowEditModal(true);
    };

    const handleDeleteAttribute = (attribute: Attribute) => {
        setAttributeToDelete(attribute);
    };

    const deleteAttributeHandler = async () => {
        if (!attributeToDelete) return;
        try {
            const response = await deleteAttribute(axiosInstance, attributeToDelete.id);
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

    const handleToggleActive = async (attribute: Attribute) => {
        try {
            const response = await toggleAttributeStatus(
                axiosInstance,
                attribute.id,
                attribute.active
            );
            if (response.success) {
                toast.success(
                    `Attribute ${attribute.active ? "disabled" : "enabled"} successfully`
                );
                fetchAttributes();
            } else {
                toast.error(response.message || "Failed to toggle attribute status");
            }
        } catch (error) {
            console.error("Error toggling attribute status:", error);
            toast.error("Failed to toggle attribute status");
        }
    };

    return (
        <div className="space-y-5">
            {/* Page header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Attributes</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                    Manage product attributes and specifications.
                </p>
            </div>

            {/* Tab bar */}
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                {groups.map((group) => (
                    <button
                        key={group.type}
                        onClick={() => setSelectedGroup(group.type)}
                        className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                            selectedGroup === group.type
                                ? "bg-[#00007A] text-white"
                                : "bg-transparent text-black hover:bg-blue-50"
                        }`}
                    >
                        {group.label}
                    </button>
                ))}
            </div>

            {/* Toolbar: search + action buttons */}
            <div className="flex items-center justify-between gap-3">
                <div className="relative flex-1 max-w-xs">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search attributes..."
                        className="pl-8 h-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 text-gray-700 border-gray-300"
                    >
                        <Upload className="h-3.5 w-3.5" />
                        Import
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 text-gray-700 border-gray-300"
                    >
                        <Download className="h-3.5 w-3.5" />
                        Export
                    </Button>
                    <Button
                        size="sm"
                        onClick={() => setShowAddModal(true)}
                        className="gap-1.5 bg-[#00007A] hover:bg-[#00007A]/90 text-white"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        Add Attribute
                    </Button>
                </div>
            </div>

            {/* Main content card */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold">
                        Product Attributes
                    </CardTitle>
                    <CardDescription className="text-xs">
                        {filteredAttributes?.length ?? 0} attributes grouped by subgroup
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="py-16 text-center text-sm text-muted-foreground">
                            Loading attributes...
                        </div>
                    ) : sortedGroupKeys.length === 0 ? (
                        <div className="py-16 text-center text-sm text-muted-foreground">
                            No attributes found
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table className="min-w-[900px] table-fixed">
                                <TableHeader>
                                    <TableRow className="bg-gray-50 text-xs uppercase tracking-wide">
                                        <TableHead className="w-12 pl-4">NO</TableHead>
                                        <TableHead className="w-[260px]">NAME</TableHead>
                                        <TableHead className="w-[140px]">INPUT TYPE</TableHead>
                                        <TableHead className="w-[200px]">ATTRIBUTE VALUES</TableHead>
                                        <TableHead className="w-[140px]">SHOW TO CUSTOMER</TableHead>
                                        <TableHead className="w-[100px] text-center">ACTIONS</TableHead>
                                        <TableHead className="w-[90px] text-center">TOGGLE</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sortedGroupKeys.map((gName) => {
                                        const items = groupedAttributes[gName] || [];
                                        const expanded = isGroupExpanded(gName);
                                        const letter = gName.charAt(0).toUpperCase();

                                        return (
                                            <>
                                                {/* Group header row */}
                                                <TableRow
                                                    key={`group-${gName}`}
                                                    className="bg-white border-t cursor-pointer select-none hover:bg-gray-50"
                                                    onClick={() => toggleGroupExpand(gName)}
                                                >
                                                    <TableCell className="pl-4 py-3">
                                                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#00007A] text-white text-xs font-bold">
                                                            {letter}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell
                                                        colSpan={4}
                                                        className="py-3 font-semibold text-[#00007A]"
                                                    >
                                                        {gName}
                                                    </TableCell>
                                                    <TableCell />
                                                    <TableCell className="text-center py-3">
                                                        {expanded ? (
                                                            <ChevronUp className="h-4 w-4 text-gray-400 mx-auto" />
                                                        ) : (
                                                            <ChevronDown className="h-4 w-4 text-gray-400 mx-auto" />
                                                        )}
                                                    </TableCell>
                                                </TableRow>

                                                {/* Attribute rows */}
                                                {expanded &&
                                                    items.map((attr, idx) => (
                                                        <TableRow
                                                            key={attr.id}
                                                            className={`text-sm ${
                                                                !attr.active
                                                                    ? "opacity-50 grayscale"
                                                                    : ""
                                                            }`}
                                                        >
                                                            <TableCell className="pl-4 text-muted-foreground">
                                                                {idx + 1}
                                                            </TableCell>
                                                            <TableCell className="font-medium">
                                                                {attr.type}
                                                            </TableCell>
                                                            <TableCell>
                                                                <span className="inline-flex rounded bg-slate-100 px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-slate-700">
                                                                    {attr.attributeType || "text"}
                                                                </span>
                                                            </TableCell>
                                                            <TableCell className="text-sm text-gray-600 whitespace-normal break-words">
                                                                {attr.values
                                                                    ? attr.values
                                                                          .split(",")
                                                                          .slice(0, 3)
                                                                          .map((v) => v.trim())
                                                                          .join(", ") +
                                                                      (attr.values.split(",").length > 3
                                                                          ? ` +${attr.values.split(",").length - 3} more`
                                                                          : "")
                                                                    : <span className="text-gray-400">–</span>}
                                                            </TableCell>
                                                            <TableCell className="text-center">
                                                                {attr.customerView ? (
                                                                    <span className="text-green-600 font-medium text-xs">Yes</span>
                                                                ) : (
                                                                    <span className="text-gray-400 text-xs">–</span>
                                                                )}
                                                            </TableCell>
                                                            <TableCell className="text-center">
                                                                <div className="flex items-center justify-center gap-2">
                                                                    <button
                                                                        onClick={() => handleEditAttribute(attr)}
                                                                        className="text-gray-400 hover:text-gray-700 transition-colors"
                                                                        title="Edit"
                                                                    >
                                                                        <Edit className="h-4 w-4" />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDeleteAttribute(attr)}
                                                                        className="text-gray-400 hover:text-red-500 transition-colors"
                                                                        title="Delete"
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </button>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-center">
                                                                {/* Toggle switch */}
                                                                <button
                                                                    onClick={() => handleToggleActive(attr)}
                                                                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                                                                        attr.active
                                                                            ? "bg-[#00007A]"
                                                                            : "bg-gray-200"
                                                                    }`}
                                                                    title={attr.active ? "Disable" : "Enable"}
                                                                >
                                                                    <span
                                                                        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                                                                            attr.active
                                                                                ? "translate-x-4"
                                                                                : "translate-x-1"
                                                                        }`}
                                                                    />
                                                                </button>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                            </>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Add Attribute Modal */}
            <AddAttributeForm
                open={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSuccess={() => {
                    setShowAddModal(false);
                    fetchAttributes();
                }}
                defaultProductType={selectedGroup}
            />

            {/* Edit Attribute Modal */}
            <AddAttributeForm
                open={showEditModal && !!editingAttribute}
                onClose={() => {
                    setShowEditModal(false);
                    setEditingAttribute(null);
                }}
                onSuccess={() => {
                    setShowEditModal(false);
                    setEditingAttribute(null);
                    fetchAttributes();
                }}
                defaultProductType={selectedGroup}
                attribute={editingAttribute}
                isEdit
            />

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={!!attributeToDelete}
                onOpenChange={(open) => !open && setAttributeToDelete(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Attribute</DialogTitle>
                    </DialogHeader>
                    <p className="text-gray-600 text-sm">
                        Are you sure you want to delete "
                        <strong>{attributeToDelete?.type}</strong>"? This action cannot
                        be undone.
                    </p>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setAttributeToDelete(null)}
                        >
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={deleteAttributeHandler}>
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
