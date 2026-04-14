/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
//@ts-nocheck
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
import { Label } from "@/components/ui/label";
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
  X, ChevronRight, ChevronDown, Eye
} from "lucide-react";
import { toast } from "react-hot-toast";
import {
  getAllGroups,
  deleteGroup as deleteGroupAPI,
  toggleGroupStatus as toggleGroupStatusAPI,
  createGroup,
  updateGroup,
  Group,
} from "@/api/groups.api";
import useAxiosWithAuth from "@/utils/axiosInterceptor";


interface SubGroupItem {
  id: string;
  name: string;
  urlKey: string;
  metaTitle: string;
  metaKeywords: string;
  active: boolean;
}


interface EditGroupData {
  id: number | string;
  name: string;
  subGroup: SubGroupItem[];
  urlKey: string;
  metaTitle: string;
  metaKeywords: string;
  type: string;
}

export default function ShopGroups() {
  const axiosInstance = useAxiosWithAuth(import.meta.env.VITE_SERVER_URL);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedGroupDetail, setSelectedGroupDetail] =
    useState<Group | null>(null);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showStatusConfirm, setShowStatusConfirm] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showAddSubGroupModal, setShowAddSubGroupModal] = useState(false);
  const [showEditGroupModal, setShowEditGroupModal] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<Group | null>(
    null,
  );
  const [groupToToggle, setGroupToToggle] = useState<Group | null>(
    null,
  );
  const [parentGroupForSub, setParentGroupForSub] =
    useState<Group | null>(null);
  const [newGroupName, setNewGroupName] = useState("");
  const [selectedGroupType, setSelectedGroupType] = useState("HARDWARE");

  const [editGroupData, setEditGroupData] = useState<EditGroupData>({
    id: 0,
    name: "",
    subGroup: [],
    urlKey: "",
    metaTitle: "",
    metaKeywords: "",
    type: "",
  });

  
  const [subGroupData, setSubGroupData] = useState({
    name: "",
    urlKey: "",
    metaTitle: "",
    metaKeywords: "",
    active: true,
  });

  const [isEditingSubGroup, setIsEditingSubGroup] = useState(false);
  const [editSubGroupOriginal, setEditSubGroupOriginal] = useState<any>(null);

  const [newSubGroupInput, setNewSubGroupInput] = useState("");

  const getSubGroupDetails = (sub: any) => {
    try {
      if (typeof sub === 'string' && sub.startsWith('{')) {
        return JSON.parse(sub);
      }
      if (typeof sub === 'object' && sub !== null) {
        return {
          ...sub,
          active: sub.active !== undefined ? sub.active : true
        };
      }
    } catch (e) {
      console.error("Error parsing sub-group:", e);
    }
    return { name: String(sub), urlKey: "", metaTitle: "", metaKeywords: "", active: true };
  };

  const statuses = [
    { id: "all", label: "All" },
    { id: "active", label: "Active" },
    { id: "inactive", label: "Inactive" },
  ];

  const groupTypes = [
    { id: "HARDWARE", label: "Hardware", type: "HARDWARE" },
    { id: "CUSTOM_PRODUCTS", label: "Custom Products", type: "FUNDI" },
    { id: "DESIGNS", label: "Designs", type: "PROFESSIONAL" },
    {
      id: "HIRE_MACHINERY",
      label: "Hire Machinery & Equipment",
      type: "CONTRACTOR",
    },
  ];

  const fetchGroups = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getAllGroups(axiosInstance);
      if (response.success) {
        const groupData = (response.data || []) as Group[];
        setGroups(groupData);
      } else {
        toast.error("Failed to fetch groups");
      }
    } catch (error) {
      console.error("Error fetching groups:", error);
      toast.error("Failed to fetch groups");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleViewGroup = (group: Group) => {
    setSelectedGroupDetail(group);
    setShowGroupModal(true);
  };

  const handleEditGroup = (group: Group) => {
    let existingSub: SubGroupItem[] = [];
    if (Array.isArray(group.subGroup)) {
      existingSub = group.subGroup.map((sub: any) => {
        const details = getSubGroupDetails(sub);
        return {
          id: details.id || `sub-${Date.now()}-${Math.random()}`,
          name: details.name,
          urlKey: details.urlKey || "",
          metaTitle: details.metaTitle || "",
          metaKeywords: details.metaKeywords || "",
        } as SubGroupItem;
      });
    } else if (typeof group.subGroup === "string" && (group.subGroup as string).trim() !== "") {
      existingSub = (group.subGroup as string).split(",").map((s, i) => ({
        id: `sub-${i}-${Date.now()}`,
        name: s.trim(),
        urlKey: "",
        metaTitle: "",
        metaKeywords: "",
      }));
    }

    setEditGroupData({
      id: group.id,
      name: group.name,
      subGroup: existingSub,
      urlKey: group.urlKey || "",
      metaTitle: group.metaTitle || "",
      metaKeywords: group.metaKeywords || "",
      type: group.type || "",
    });
    setNewSubGroupInput("");
    setShowEditGroupModal(true);
  };

  const handleAddSubGroupTag = () => {
    const val = newSubGroupInput.trim();
    if (!val) return;
    const existingNames = editGroupData.subGroup.map((s) => s.name);
    if (existingNames.map((s) => s.toLowerCase()).includes(val.toLowerCase())) {
      toast.error(`"${val}" already exists`);
      return;
    }
    const newSubGroupObj: SubGroupItem = {
      id: `sub-${Date.now()}`,
      name: val,
      urlKey: "",
      metaTitle: "",
      metaKeywords: "",
    };
    setEditGroupData((prev) => ({
      ...prev,
      subGroup: [...prev.subGroup, newSubGroupObj],
    }));
    setNewSubGroupInput("");
  };

  const handleRemoveSubGroupTag = (index: number) => {
    setEditGroupData((prev) => ({
      ...prev,
      subGroup: prev.subGroup.filter((_, i) => i !== index),
    }));
  };

  const handleUpdateGroup = async () => {
    if (!editGroupData.name.trim()) {
      toast.error("Group name is required");
      return;
    }
    const updatePayload = {
      id: editGroupData.id,
      name: editGroupData.name.trim(),
      active: true,
      subGroup: editGroupData.subGroup, 
      urlKey: editGroupData.urlKey.trim(),
      metaTitle: editGroupData.metaTitle.trim(),
      metaKeywords: editGroupData.metaKeywords.trim(),
      type: editGroupData.type,
    };
    try {
      await updateGroup(axiosInstance, editGroupData.id, updatePayload as any);
      toast.success("Group updated successfully");
      setShowEditGroupModal(false);
      fetchGroups();
    } catch (error) {
      console.error("❌ Error updating group:", error);
      toast.error("Failed to update group");
    }
  };

  const handleAddSubGroup = (group: Group) => {
    setParentGroupForSub(group);
    setShowAddSubGroupModal(true);
  };

  const handleDeleteGroup = (group: Group) => {
    setGroupToDelete(group);
    setShowDeleteConfirm(true);
  };

  const deleteGroup = async () => {
    if (!groupToDelete) return;
    try {
      await deleteGroupAPI(axiosInstance, groupToDelete.id);
      toast.success("Group deleted successfully");
      fetchGroups();
    } catch (error) {
      console.error("Error deleting group:", error);
      toast.error("Failed to delete group");
    } finally {
      setShowDeleteConfirm(false);
      setGroupToDelete(null);
    }
  };

  const handleToggleGroupStatus = (group: Group) => {
    setGroupToToggle(group);
    setShowStatusConfirm(true);
  };

  const toggleGroupStatus = async () => {
    if (!groupToToggle) return;
    try {
      await toggleGroupStatusAPI(
        axiosInstance,
        groupToToggle.id,
        groupToToggle.active,
      );
      toast.success(
        groupToToggle.active
          ? "Group disabled successfully"
          : "Group enabled successfully",
      );
      fetchGroups();
    } catch (error) {
      console.error("Error toggling group status:", error);
      toast.error("Failed to update group status");
    } finally {
      setShowStatusConfirm(false);
      setGroupToToggle(null);
    }
  };

  const handleCreateGroup = async () => {
    const trimmedName = newGroupName.trim();
    if (!trimmedName) {
      toast.error("Group name is required");
      return;
    }
    const isDuplicate = groups.some(
      (group) =>
        group.name.trim().toLowerCase() === trimmedName.toLowerCase(),
    );
    if (isDuplicate) {
      toast.error(`A group with the name "${trimmedName}" already exists.`);
      return;
    }
    try {
      await createGroup(axiosInstance, {
        name: trimmedName,
        type: selectedGroupType,
      });
      toast.success("Group created successfully");
      setShowCreateGroupModal(false);
      setNewGroupName("");
      fetchGroups();
    } catch (error) {
      console.error("Error creating group:", error);
      toast.error("Failed to create group");
    }
  };

  const handleAddSubGroupSubmit = async () => {
    if (!subGroupData.name.trim()) {
      toast.error("Sub-group name is required");
      return;
    }
    if (!parentGroupForSub) {
      toast.error("Parent group is required");
      return;
    }

    let existing: any[] = [];
    const rawSub = parentGroupForSub.subGroup;
    if (Array.isArray(rawSub)) {
      existing = rawSub.map((sub) => {
        if (typeof sub === "string") {
          return { id: Math.random().toString(), name: sub, urlKey: "", metaTitle: "", metaKeywords: "" };
        }
        return sub;
      });
    } else if (typeof rawSub === "string" && rawSub.trim() !== "") {
      existing = rawSub.split(",").map((s) => ({
        id: Math.random().toString(),
        name: s.trim(),
        urlKey: "",
        metaTitle: "",
        metaKeywords: "",
      }));
    }

    const originalDetails = isEditingSubGroup && editSubGroupOriginal ? getSubGroupDetails(editSubGroupOriginal) : null;
    const isNameChanged = isEditingSubGroup && originalDetails 
        ? subGroupData.name.trim().toLowerCase() !== originalDetails.name?.toLowerCase() 
        : true;

    if (isNameChanged && existing.some((sub) => (sub.name || "").toLowerCase() === subGroupData.name.trim().toLowerCase())) {
      toast.error(`"${subGroupData.name.trim()}" already exists`);
      return;
    }

    try {
      let updatedSubGroups;
      if (isEditingSubGroup && originalDetails) {
        updatedSubGroups = existing.map(sub => {
          const subDetails = getSubGroupDetails(sub);
          const isMatch = subDetails.id === originalDetails.id || subDetails.name === originalDetails.name;
          if (isMatch) {
            return {
              ...subDetails,
              name: subGroupData.name.trim(),
              urlKey: subGroupData.urlKey.trim(),
              metaTitle: subGroupData.metaTitle.trim(),
              metaKeywords: subGroupData.metaKeywords.trim(),
              active: subGroupData.active,
            };
          }
          return sub;
        });
      } else {
        const newSubGroupObj = {
          id: `sub-${Date.now()}`,
          name: subGroupData.name.trim(),
          urlKey: subGroupData.urlKey.trim(),
          metaTitle: subGroupData.metaTitle.trim(),
          metaKeywords: subGroupData.metaKeywords.trim(),
          active: subGroupData.active,
        };
        updatedSubGroups = [...existing, newSubGroupObj];
      }

      await updateGroup(axiosInstance, parentGroupForSub.id, {
        ...parentGroupForSub,
        subGroup: updatedSubGroups,
      });
      
      toast.success(isEditingSubGroup ? "Sub-group updated successfully" : "Sub-group added successfully");
      setSubGroupData({ name: "", urlKey: "", metaTitle: "", metaKeywords: "", active: true });
      setShowAddSubGroupModal(false);
      setParentGroupForSub(null);
      setIsEditingSubGroup(false);
      setEditSubGroupOriginal(null);
      fetchGroups();
    } catch (error) {
      console.error("Error saving sub-group:", error);
      toast.error("Failed to save sub-group");
    }
  };

  const handleToggleSubGroupStatus = async (group: Group, subGroup: any) => {
    try {
      const details = getSubGroupDetails(subGroup);
      const newSubGroups = group.subGroup ? (Array.isArray(group.subGroup) ? group.subGroup : [group.subGroup]) : [];
      
      const updatedSubGroups = newSubGroups.map(s => {
        const sDetails = getSubGroupDetails(s);
        if (sDetails.id === details.id) {
          return { ...sDetails, active: !sDetails.active };
        }
        return s;
      });

      await updateGroup(axiosInstance, group.id, {
        ...group,
        subGroup: updatedSubGroups,
      });
      
      toast.success(`Sub-group ${!details.active ? "enabled" : "disabled"}`);
      fetchGroups();
    } catch (error) {
      console.error("Error toggling sub-group status:", error);
      toast.error("Failed to update status");
    }
  };

  const handleEditSubGroupOpen = (parentGroup: Group, sub: any) => {
    setParentGroupForSub(parentGroup);
    const details = getSubGroupDetails(sub);
    setSubGroupData({
      name: details.name || "",
      urlKey: details.urlKey || "",
      metaTitle: details.metaTitle || "",
      metaKeywords: details.metaKeywords || "",
      active: details.active !== undefined ? details.active : true,
    });
    setEditSubGroupOriginal(sub);
    setIsEditingSubGroup(true);
    setShowAddSubGroupModal(true);
  };

  const filteredGroups = groups?.filter((group) => {
    const matchesSearch =
      group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (Array.isArray(group.subGroup)
        ? group.subGroup.some((s: string | SubGroupItem) => {
            const subName = typeof s === "string" ? s : (s?.name || "");
            return subName.toLowerCase().includes(searchTerm.toLowerCase());
          })
        : false);
    let matchesStatus = true;
    if (selectedStatus === "active") matchesStatus = group.active;
    else if (selectedStatus === "inactive") matchesStatus = !group.active;
    let matchesType = true;
    if (selectedGroupType) {
      matchesType = group.type === selectedGroupType || (selectedGroupType === "HARDWARE" && !group.type);
    }
    return matchesSearch && matchesStatus && matchesType;
  });

  const SubGroupTreeView = ({ subGroup }: { subGroup?: any[] | string }) => {
    const [expandedIds, setExpandedIds] = React.useState<Set<string>>(new Set());
    let subGroupList: any[] = [];
    if (Array.isArray(subGroup)) {
      subGroupList = subGroup.map((sub) => getSubGroupDetails(sub)).filter(sub => sub?.name);
    } else if (typeof subGroup === "string" && subGroup.trim() !== "") {
      subGroupList = subGroup.split(",").map((name, i) => ({ id: `legacy-${i}`, name: name.trim(), urlKey: "", metaTitle: "", metaKeywords: "" }));
    }
    if (subGroupList.length === 0) return <span className="text-sm text-muted-foreground">-</span>;
    const toggleExpand = (id: string) => {
      const newSet = new Set(expandedIds);
      if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
      setExpandedIds(newSet);
    };
    return (
      <div className="space-y-2">
        {subGroupList.map((sub) => (
          <div key={sub.id} className="border rounded-lg bg-white overflow-hidden">
            <div className="flex items-center gap-2 p-2 hover:bg-gray-50 transition-colors">
              <button type="button" onClick={() => toggleExpand(sub.id)} className="p-0.5 hover:bg-gray-200 rounded transition-colors">
                {expandedIds.has(sub.id) ? <ChevronDown className="h-4 w-4 text-gray-600" /> : <ChevronRight className="h-4 w-4 text-gray-600" />}
              </button>
              <span className="font-medium text-sm flex-1">{sub.name}</span>
            </div>
            {expandedIds.has(sub.id) && (
              <div className="border-t bg-gray-50 p-3 space-y-3 text-sm">
                {sub.urlKey && (
                  <div>
                    <span className="text-gray-600 font-semibold text-xs tracking-wider uppercase">URL Key:</span>
                    <p className="text-gray-800 text-xs font-mono bg-white p-1.5 rounded border border-gray-100 mt-1">{sub.urlKey}</p>
                  </div>
                )}
                {sub.metaTitle && (
                  <div>
                    <span className="text-gray-600 font-semibold text-xs tracking-wider uppercase">Meta Title:</span>
                    <p className="text-gray-800 text-xs bg-white p-1.5 rounded border border-gray-100 mt-1">{sub.metaTitle}</p>
                  </div>
                )}
                {sub.metaKeywords && (
                  <div>
                    <span className="text-gray-600 font-semibold text-xs tracking-wider uppercase">Meta Keywords:</span>
                    <p className="text-gray-800 text-xs bg-white p-1.5 rounded border border-gray-100 mt-1">{sub.metaKeywords}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const GroupDetailModal = ({
    group,
    isOpen,
    onClose,
  }: {
    group: Group | null;
    isOpen: boolean;
    onClose: () => void;
  }) => {
    if (!group) return null;

    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl bg-white p-6 rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">{group.name}</DialogTitle>
            <DialogDescription>
              Group Details and Sub-organization
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500">Group Name</h4>
                <p className="text-base font-semibold">{group.name}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Type</h4>
                <Badge variant="outline" className="mt-1">
                  {group.type || "HARDWARE"}
                </Badge>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Status</h4>
                <div className="mt-1">
                  <Badge
                    variant={group.active ? "default" : "destructive"}
                    className={
                      group.active
                        ? "bg-emerald-500 hover:bg-emerald-600"
                        : "bg-red-500 hover:bg-red-600"
                    }
                  >
                    {group.active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
            </div>

          </div>

          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-500 mb-2">Sub Groups</h4>
            <div className="border rounded-lg p-4 bg-gray-50 max-h-[300px] overflow-y-auto">
              <SubGroupTreeView subGroup={group.subGroup} />
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
            <Button
              onClick={() => {
                onClose();
                handleEditGroup(group);
              }}
              style={{ backgroundColor: "#00007A", color: "white" }}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Group
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Groups</h1>
          <p className="text-muted-foreground">Manage all product groups and their organization.</p>
        </div>
      </div>

      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {groupTypes.map((groupType) => (
          <button
            key={groupType.id}
            onClick={() => setSelectedGroupType(groupType.type)}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
              selectedGroupType === groupType.type
                ? "bg-[#00007A] text-white shadow-sm"
                : "bg-transparent text-gray-600 hover:bg-gray-200 hover:text-gray-900"
            }`}
          >
            {groupType.label}
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
            placeholder="Search groups..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button
          onClick={() => setShowCreateGroupModal(true)}
          style={{ backgroundColor: "#00007A", color: "white" }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add a Group
        </Button>
      </div>

      <Card className="bg-white border-none shadow-md">
        <CardHeader>
          <CardTitle>Groups</CardTitle>
          <CardDescription>Manage all product groups in the shop</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Loading groups...</div>
            </div>
          ) : filteredGroups?.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">No groups found.</div>
            </div>
          ) : (
            <div className="rounded-md border border-gray-200 shadow-md p-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">No.</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>URL Key</TableHead>
                    <TableHead>Meta Title</TableHead>
                    <TableHead>Meta Keywords</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-32">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGroups?.map((group, groupIndex) => {
                    let subGroupList: any[] = [];
                    if (Array.isArray(group.subGroup)) {
                      subGroupList = group.subGroup.map((sub: string | SubGroupItem) => getSubGroupDetails(sub)).filter(sub => sub?.name);
                    } else if (typeof (group.subGroup as any) === "string" && (group.subGroup as any).trim() !== "") {
                      subGroupList = ((group.subGroup as any) as string).split(",").map((name, i) => ({ id: `legacy-${i}`, name: name.trim(), urlKey: "", metaTitle: "", metaKeywords: "" }));
                    }

                    return (
                      <React.Fragment key={group.id}>
                        <TableRow className="bg-blue-50 hover:bg-blue-100 border-b-2 border-blue-200">
                          <TableCell className="font-bold text-lg">{String.fromCharCode(65 + groupIndex)}</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <Folder className="h-5 w-5 text-blue-500" />
                              <div>
                                <div className="font-bold">{group.name}</div>
                                <div className="text-xs text-muted-foreground">ID: {group.id}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell><div className="text-sm text-muted-foreground">{group.urlKey || "-"}</div></TableCell>
                          <TableCell><div className="text-sm text-muted-foreground">{group.metaTitle || "-"}</div></TableCell>
                          <TableCell><div className="text-sm text-muted-foreground">{group.metaKeywords || "-"}</div></TableCell>
                          <TableCell>
                            <Badge
                              variant={group.active ? "default" : "destructive"}
                              className={
                                group.active
                                  ? "bg-emerald-500 hover:bg-emerald-600"
                                  : "bg-red-500 hover:bg-red-600"
                              }
                            >
                              {group.active ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button size="sm" onClick={() => handleAddSubGroup(group)} style={{ backgroundColor: "#00007A", color: "white" }}>
                                <Plus className="h-3 w-3 mr-1" /> Add Sub
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleViewGroup(group)}>
                                    <Eye className="mr-2 h-4 w-4" /> View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleEditGroup(group)}>
                                    <Edit className="mr-2 h-4 w-4" /> Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleToggleGroupStatus(group)}>
                                    {group.active ? <XCircle className="mr-2 h-4 w-4" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                                    {group.active ? "Disable" : "Enable"}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleDeleteGroup(group)} className="text-red-600">
                                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                        {subGroupList.map((subGroup, subIndex) => (
                          <TableRow key={`${group.id}-${subGroup.id}`} className="bg-gray-50 hover:bg-gray-100">
                            <TableCell className="text-center font-semibold text-gray-600">{subIndex + 1}</TableCell>
                            <TableCell><div className="flex items-center space-x-3 ml-8"><div className="h-4 w-4 rounded border border-gray-300 flex items-center justify-center text-xs">•</div><span className="text-sm">{subGroup.name}</span></div></TableCell>
                             <TableCell><div className="text-sm text-gray-600">{subGroup.urlKey || "-"}</div></TableCell>
                             <TableCell><div className="text-sm text-gray-600">{subGroup.metaTitle || "-"}</div></TableCell>
                             <TableCell><div className="text-sm text-gray-600">{subGroup.metaKeywords || "-"}</div></TableCell>
                             <TableCell>
                               <Badge
                                 variant={subGroup.active ? "default" : "destructive"}
                                 className={`cursor-pointer ${
                                   subGroup.active
                                     ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200"
                                     : "bg-red-50 text-red-700 hover:bg-red-100 border-red-200"
                                 }`}
                                 onClick={() => handleToggleSubGroupStatus(group, subGroup)}
                               >
                                 {subGroup.active ? "Active" : "Inactive"}
                               </Badge>
                             </TableCell>
                             <TableCell>
                              <div className="flex items-center space-x-1">
                                <Button size="sm" variant="outline" onClick={() => handleEditSubGroupOpen(group, subGroup)} className="text-xs"><Edit className="h-3 w-3 mr-1" /> Edit</Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    const newSubGroups = group.subGroup ? (Array.isArray(group.subGroup) ? group.subGroup : [group.subGroup]) : [];
                                    const index = newSubGroups.findIndex((s: string | SubGroupItem) => {
                                      if (typeof s === "string") return s === subGroup.name;
                                      return s?.id === subGroup.id;
                                    });
                                    if (index > -1) {
                                      const updated = newSubGroups.filter((_, i) => i !== index);
                                      updateGroup(axiosInstance, group.id, { ...group, subGroup: updated }).then(() => {
                                        toast.success("Sub-group deleted");
                                        fetchGroups();
                                      }).catch(err => {
                                        toast.error("Failed to delete sub-group");
                                      });
                                    }
                                  }}
                                  className="text-xs text-red-600"
                                >
                                  <Trash2 className="h-3 w-3 mr-1" /> Delete
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </React.Fragment>
                    );
                  })}
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
          <Button variant="outline" size="sm" disabled>
            Prev
          </Button>
          <span className="text-sm text-muted-foreground">Page 1 of 0</span>
          <Button variant="outline" size="sm" disabled>
            Next
          </Button>
        </div>
      </div>

      <GroupDetailModal
        group={selectedGroupDetail}
        isOpen={showGroupModal}
        onClose={() => {
          setShowGroupModal(false);
          setSelectedGroupDetail(null);
        }}
      />

      {/* Create Group Modal */}
      <Dialog
        open={showCreateGroupModal}
        onOpenChange={setShowCreateGroupModal}
      >
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Create New Group</DialogTitle>
            <DialogDescription>
              Enter the name for the new group
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="groupName"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Group Name *
              </label>
              <Input
                id="groupName"
                placeholder="Enter group name"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") handleCreateGroup();
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateGroupModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateGroup}
              style={{ backgroundColor: "#00007A", color: "white" }}
            >
              Create Group
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Sub-Group Modal */}
      <Dialog
        open={showAddSubGroupModal}
        onOpenChange={(open) => {
          setShowAddSubGroupModal(open);
          if (!open) {
            setIsEditingSubGroup(false);
            setEditSubGroupOriginal(null);
            setSubGroupData({ name: "", urlKey: "", metaTitle: "", metaKeywords: "" });
          }
        }}
      >
        <DialogContent className="max-w-2xl bg-white">
          <DialogHeader>
            <DialogTitle>{isEditingSubGroup ? "Edit Sub-Group" : "Add Sub-Group"}</DialogTitle>
            <DialogDescription>
              {isEditingSubGroup 
                ? `Update details for "${subGroupData.name}"`
                : `Add a sub-group to "${parentGroupForSub?.name}"`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Parent Group
              </label>
              <Input
                value={parentGroupForSub?.name || ""}
                disabled
                className="bg-gray-50"
              />
            </div>

            {Array.isArray(parentGroupForSub?.subGroup) &&
              parentGroupForSub.subGroup.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Existing Sub-Groups
                  </label>
                  <div className="flex flex-wrap gap-1 p-2 bg-gray-50 rounded-lg border">
                    {parentGroupForSub.subGroup.map((sub: any, i) => {
                      const details = getSubGroupDetails(sub);
                      return (
                        <span
                          key={i}
                          className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-200"
                        >
                          {details.name}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

            <div>
              <label
                htmlFor="subGroupName"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                {isEditingSubGroup ? "Sub-group Name *" : "New Sub-group Name *"}
              </label>
              <Input
                id="subGroupName"
                placeholder="Enter sub-group name"
                value={subGroupData.name}
                onChange={(e) =>
                  setSubGroupData((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-700 font-bold border-b pb-1">
                SEO Information
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="urlKey">URL Key</Label>
                  <Input
                    id="urlKey"
                    placeholder="e.g. electrical-cables"
                    value={subGroupData.urlKey}
                    onChange={(e) =>
                      setSubGroupData((prev) => ({
                        ...prev,
                        urlKey: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="metaTitle">Meta Title</Label>
                  <Input
                    id="metaTitle"
                    placeholder="SEO Title"
                    value={subGroupData.metaTitle}
                    onChange={(e) =>
                      setSubGroupData((prev) => ({
                        ...prev,
                        metaTitle: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="metaKeywords">Meta Keywords</Label>
                <Input
                  id="metaKeywords"
                  placeholder="Keywords separated by comma"
                  value={subGroupData.metaKeywords}
                  onChange={(e) =>
                    setSubGroupData((prev) => ({
                      ...prev,
                      metaKeywords: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <div className="flex items-center space-x-2 pt-1">
                  <Badge
                    variant={subGroupData.active ? "default" : "destructive"}
                    className={`cursor-pointer px-3 py-1 text-xs ${
                      subGroupData.active
                        ? "bg-emerald-500 hover:bg-emerald-600"
                        : "bg-red-500 hover:bg-red-600"
                    }`}
                    onClick={() =>
                      setSubGroupData((prev) => ({
                        ...prev,
                        active: !prev.active,
                      }))
                    }
                  >
                    {subGroupData.active ? "Active" : "Inactive"}
                  </Badge>
                  <span className="text-xs text-muted-foreground italic">
                    (Maintains visibility for products)
                  </span>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddSubGroupModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddSubGroupSubmit}
              style={{ backgroundColor: "#00007A", color: "white" }}
            >
              {isEditingSubGroup ? "Update Sub-Group" : "Add Sub-Group"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Delete Group</DialogTitle>
            <DialogDescription>
              You are about to delete the group{" "}
              <strong>{groupToDelete?.name}</strong>.
              <br />
              <span style={{ color: "red", fontWeight: "bold" }}>
                Warning: This action cannot be undone.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={deleteGroup}
              style={{ backgroundColor: "#dc2626", color: "white" }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Toggle Confirm */}
      <Dialog open={showStatusConfirm} onOpenChange={setShowStatusConfirm}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>
              {groupToToggle?.active ? "Disable" : "Enable"} Group
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to{" "}
              {groupToToggle?.active ? "disable" : "enable"} "
              {groupToToggle?.name}"?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowStatusConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={toggleGroupStatus}
              style={{ backgroundColor: "#00007A", color: "white" }}
            >
              {groupToToggle?.active ? "Disable" : "Enable"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Group Modal */}
      <Dialog
        open={showEditGroupModal}
        onOpenChange={setShowEditGroupModal}
      >
        <DialogContent className="max-w-2xl bg-white">
          <DialogHeader>
            <DialogTitle>Edit Group</DialogTitle>
            <DialogDescription>
              Update group information for "{editGroupData.name}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="editGroupName"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Group Name *
              </label>
              <Input
                id="editGroupName"
                placeholder="Enter group name"
                value={editGroupData.name}
                onChange={(e) =>
                  setEditGroupData((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sub Groups
              </label>

              {editGroupData.subGroup.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2 p-2 bg-gray-50 rounded-lg border">
                  {editGroupData.subGroup.map((sub, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-200"
                    >
                      {sub.name}
                      <button
                        type="button"
                        onClick={() => handleRemoveSubGroupTag(i)}
                        className="hover:text-red-600 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <Input
                  placeholder="Type a sub-group and press Add"
                  value={newSubGroupInput}
                  onChange={(e) => setNewSubGroupInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddSubGroupTag();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddSubGroupTag}
                  className="shrink-0"
                >
                  Add
                </Button>
              </div>
            </div>

            </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditGroupModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateGroup}
              style={{ backgroundColor: "#00007A", color: "white" }}
            >
              Update Group
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
