/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable react-hooks/exhaustive-deps */
//@ts-ignore
import React, { useState, useEffect, useCallback } from "react";
import { 
    getAllGroups, 
    updateGroup, 
    deleteGroup, 
    Group 
} from "@/api/groups.api.ts";
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
    Upload,
    X
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
    const [expandedSubGroups, setExpandedSubGroups] = useState<Record<string, boolean>>({});

    
    const [editingGroup, setEditingGroup] = useState<Group | null>(null);
    const [groupToDelete, setGroupToDelete] = useState<Group | null>(null);
    const [isGroupUpdating, setIsGroupUpdating] = useState(false);
    const [isGroupDeleting, setIsGroupDeleting] = useState(false);

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
        (acc: Record<string, Record<string, Attribute[]>>, attr) => {
            const groupName = attr.group?.name || "Ungrouped";
            const subGroupName = attr.attributeGroup || "General";
            
            if (!acc[groupName]) acc[groupName] = {};
            if (!acc[groupName][subGroupName]) acc[groupName][subGroupName] = [];
            
            acc[groupName][subGroupName].push(attr);
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

    const toggleSubGroupExpand = (groupName: string, subGroupName: string) => {
        const key = `${groupName}-${subGroupName}`;
        setExpandedSubGroups((prev) => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    const isSubGroupExpanded = (groupName: string, subGroupName: string) =>
        expandedSubGroups[`${groupName}-${subGroupName}`] !== false;

    const handleEditAttribute = (attribute: Attribute) => {
        setEditingAttribute(attribute);
        setShowEditModal(true);
    };

    const handleDeleteAttribute = (attribute: Attribute) => {
        setAttributeToDelete(attribute);
    };

    
    const handleEditGroupClick = (gName: string) => {
        
        const subGroups = groupedAttributes[gName] || {};
        const firstAttr = Object.values(subGroups)[0]?.[0];
        if (firstAttr?.group) {
            setEditingGroup(firstAttr.group as Group);
        }
    };

    const handleDeleteGroupClick = (gName: string) => {
        
        const subGroups = groupedAttributes[gName] || {};
        const firstAttr = Object.values(subGroups)[0]?.[0];
        if (firstAttr?.group) {
            setGroupToDelete(firstAttr.group as Group);
        }
    };

    const handleUpdateGroup = async (newName: string) => {
        if (!editingGroup) return;
        try {
            setIsGroupUpdating(true);
            await updateGroup(axiosInstance, editingGroup.id, {
                ...editingGroup,
                name: newName
            });
            toast.success("Group updated successfully");
            setEditingGroup(null);
            fetchAttributes();
        } catch (error: any) {
            toast.error(error.message || "Failed to update group");
        } finally {
            setIsGroupUpdating(false);
        }
    };

    const handleConfirmDeleteGroup = async () => {
        if (!groupToDelete) return;
        try {
            setIsGroupDeleting(true);
            await deleteGroup(axiosInstance, groupToDelete.id);
            toast.success("Group deleted successfully");
            setGroupToDelete(null);
            fetchAttributes();
        } catch (error: any) {
            toast.error(error.message || "Failed to delete group");
        } finally {
            setIsGroupDeleting(false);
        }
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
                            <Table className="min-w-[1200px]">
                                <TableHeader>
                                    <TableRow className="bg-gray-50 text-[11px] uppercase tracking-wider font-semibold text-gray-500">
                                        <TableHead className="w-12 pl-4">NO</TableHead>
                                        <TableHead className="w-[300px]">NAME</TableHead>
                                        <TableHead className="w-[200px]">ATTRIBUTE NAME</TableHead>
                                        <TableHead className="w-[120px]">TYPE</TableHead>
                                        <TableHead className="w-[150px]">VALUES</TableHead>
                                        <TableHead className="w-[100px] text-center">REQUIRED</TableHead>
                                        <TableHead className="w-[100px] text-center">FILTERABLE</TableHead>
                                        <TableHead className="w-[150px] text-center">SHOW TO CUSTOMER</TableHead>
                                        <TableHead className="w-[100px] text-center">ACTIONS</TableHead>
                                        <TableHead className="w-[80px] text-center">TOGGLE</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sortedGroupKeys.map((gName, gIdx) => {
                                        const subGroups = groupedAttributes[gName] || {};
                                        const expanded = isGroupExpanded(gName);
                                        const groupLetter = String.fromCharCode(65 + gIdx); 

                                        return (
                                            <React.Fragment key={`group-${gName}`}>
                                                {/* Group header row */}
                                                <TableRow
                                                    className="bg-white border-t border-gray-100 font-bold text-gray-900 group cursor-pointer hover:bg-gray-50 transition-colors"
                                                    onClick={() => toggleGroupExpand(gName)}
                                                >
                                                    <TableCell className="pl-4 py-4 text-sm">
                                                        {groupLetter}
                                                    </TableCell>
                                                    <TableCell
                                                        className="py-4 text-sm font-bold text-gray-900"
                                                    >
                                                        {gName}
                                                    </TableCell>
                                                    <TableCell className="text-gray-400">-</TableCell>
                                                    <TableCell className="text-gray-400">-</TableCell>
                                                    <TableCell className="text-gray-400">-</TableCell>
                                                    <TableCell className="text-gray-400 text-center">-</TableCell>
                                                    <TableCell className="text-gray-400 text-center">-</TableCell>
                                                    <TableCell className="text-gray-400 text-center">-</TableCell>
                                                    <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                                                        <div className="flex items-center justify-center gap-2">
                                                            <button 
                                                                onClick={() => handleEditGroupClick(gName)}
                                                                className="text-gray-400 hover:text-gray-600 transition-colors"
                                                            >
                                                                <Edit className="h-4 w-4" />
                                                            </button>
                                                            <button 
                                                                onClick={() => handleDeleteGroupClick(gName)}
                                                                className="text-red-300 hover:text-red-500 transition-colors"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <ChevronDown 
                                                            className={`h-4 w-4 text-gray-400 mx-auto transition-transform duration-300 ease-in-out ${expanded ? 'rotate-180' : 'rotate-0'}`} 
                                                        />
                                                    </TableCell>
                                                </TableRow>

                                                {expanded && Object.keys(subGroups).map((sgName, sgIdx) => {
                                                    const items = subGroups[sgName] || [];
                                                    const sgExpanded = isSubGroupExpanded(gName, sgName);
                                                    return (
                                                        <React.Fragment key={`sub-${gName}-${sgName}`}>
                                                            {/* Subgroup row */}
                                                            <TableRow 
                                                                className="bg-white hover:bg-gray-50/80 cursor-pointer border-b border-gray-50/50"
                                                                onClick={() => toggleSubGroupExpand(gName, sgName)}
                                                            >
                                                                <TableCell className="pl-8 py-3 text-xs text-gray-400 font-medium italic">
                                                                    {sgIdx + 1}
                                                                </TableCell>
                                                                <TableCell className="py-3 text-sm font-semibold text-gray-700 flex items-center gap-2">
                                                                    <div className="w-px h-10 bg-gray-100 -ml-2 mr-1" />
                                                                    {sgName}
                                                                </TableCell>
                                                                <TableCell className="text-xs text-gray-400 italic">
                                                                    {items.length} {items.length === 1 ? 'attribute' : 'attributes'}
                                                                </TableCell>
                                                                <TableCell className="text-gray-400">-</TableCell>
                                                                <TableCell className="text-gray-400">-</TableCell>
                                                                <TableCell className="text-gray-400 text-center">-</TableCell>
                                                                <TableCell className="text-gray-400 text-center">-</TableCell>
                                                                <TableCell className="text-gray-400 text-center">-</TableCell>
                                                                <TableCell className="text-gray-400 text-center">-</TableCell>
                                                                <TableCell className="text-center">
                                                                    <ChevronDown 
                                                                        className={`h-4 w-4 text-[#00007A]/40 mx-auto transition-transform duration-300 ease-in-out ${sgExpanded ? 'rotate-180' : 'rotate-0'}`} 
                                                                    />
                                                                </TableCell>
                                                            </TableRow>

                                                            {/* Actual Attribute rows */}
                                                            {sgExpanded && items.map((attr) => (
                                                                <TableRow
                                                                    key={attr.id}
                                                                    className={`text-sm ${
                                                                        !attr.active
                                                                            ? "opacity-50 grayscale"
                                                                            : ""
                                                                    } hover:bg-gray-50`}
                                                                >
                                                                    <TableCell className="pl-4 text-muted-foreground"></TableCell>
                                                                    <TableCell className="font-medium"></TableCell>
                                                                    <TableCell className="font-medium text-gray-700">
                                                                        {attr.type}
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-600 border border-slate-200">
                                                                            {attr.attributeType || "text"}
                                                                        </span>
                                                                    </TableCell>
                                                                    <TableCell className="text-xs text-gray-500">
                                                                        {attr.values || "-"}
                                                                    </TableCell>
                                                                    <TableCell className="text-center">
                                                                        <span className="text-[10px] font-bold px-2 py-1 bg-green-50 text-green-600 rounded uppercase">
                                                                            yes
                                                                        </span>
                                                                    </TableCell>
                                                                    <TableCell className="text-center">
                                                                         <span className="text-[10px] font-bold px-2 py-1 bg-green-50 text-green-600 rounded uppercase">
                                                                            {attr.filterable ? "yes" : "no"}
                                                                        </span>
                                                                    </TableCell>
                                                                    <TableCell className="text-center">
                                                                        <span className="text-[10px] font-bold px-2 py-1 bg-green-50 text-green-600 rounded uppercase">
                                                                            {attr.customerView ? "yes" : "no"}
                                                                        </span>
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
                                                                            className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors ${
                                                                                attr.active
                                                                                    ? "bg-[#00007A]"
                                                                                    : "bg-gray-200"
                                                                            }`}
                                                                            title={attr.active ? "Disable" : "Enable"}
                                                                        >
                                                                            <span
                                                                                className={`inline-block h-3 w-3 transform rounded-full bg-white shadow transition-transform ${
                                                                                    attr.active
                                                                                        ? "translate-x-4"
                                                                                        : "translate-x-1"
                                                                                }`}
                                                                            />
                                                                        </button>
                                                                    </TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </React.Fragment>
                                                    );
                                                })}
                                            </React.Fragment>
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

            {/* Edit Group Modal */}
            <GroupEditModal 
                open={!!editingGroup}
                groupName={editingGroup?.name || ""}
                onClose={() => setEditingGroup(null)}
                onSave={handleUpdateGroup}
                loading={isGroupUpdating}
            />

            {/* Delete Group Confirmation */}
            <DeleteConfirmModal 
                open={!!groupToDelete}
                title="Delete Group"
                message={`Are you sure you want to delete "${groupToDelete?.name}"? This action cannot be undone.`}
                onClose={() => setGroupToDelete(null)}
                onConfirm={handleConfirmDeleteGroup}
                loading={isGroupDeleting}
            />
        </div>
    );
}


const GroupEditModal = ({ open, groupName, onClose, onSave, loading }: any) => {
    const [name, setName] = useState(groupName);

    useEffect(() => {
        setName(groupName);
    }, [groupName]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <Card className="w-full max-w-md bg-white shadow-2xl border-0 overflow-hidden rounded-2xl animate-in fade-in zoom-in duration-200">
                <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-900">Edit Group Name</h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                    
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-gray-700">Group Name</label>
                        <Input 
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter new group name"
                            className="border-gray-200 rounded-xl h-11 focus:ring-[#00007A]/20"
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button 
                            variant="outline" 
                            className="flex-1 rounded-xl h-11 border-gray-200 text-gray-700 hover:bg-gray-50"
                            onClick={onClose}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button 
                            className="flex-1 rounded-xl h-11 bg-[#00007A] hover:bg-[#00005a] transition-all shadow-lg shadow-blue-900/10 text-white"
                            onClick={() => onSave(name)}
                            disabled={loading || !name.trim()}
                        >
                            {loading ? "Updating..." : "Save Changes"}
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
};

const DeleteConfirmModal = ({ open, title, message, onClose, onConfirm, loading }: any) => {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <Card className="w-full max-w-sm bg-white shadow-2xl border-0 overflow-hidden rounded-2xl animate-in fade-in zoom-in duration-200 text-center">
                <div className="p-8 space-y-6">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500">
                        <Trash2 className="h-8 w-8" />
                    </div>
                    
                    <div className="space-y-2">
                        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
                        <p className="text-sm text-gray-500 leading-relaxed px-2">
                            {message}
                        </p>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button 
                            variant="outline" 
                            className="flex-1 rounded-xl h-11 border-gray-200 text-gray-700 hover:bg-gray-50 font-medium"
                            onClick={onClose}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button 
                            variant="destructive"
                            className="flex-1 rounded-xl h-11 font-medium shadow-lg shadow-red-900/10"
                            onClick={onConfirm}
                            disabled={loading}
                        >
                            {loading ? "Deleting..." : "Confirm Delete"}
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
};

