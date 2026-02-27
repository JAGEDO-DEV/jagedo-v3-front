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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
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
    getAllRegions,
    deleteRegion,
    toggleRegionStatus,
    updateRegion,
    Region
} from "@/api/regions.api";
import { kenyanRegions, getCountiesForRegion } from "@/data/kenyanRegions";
import useAxiosWithAuth from "@/utils/axiosInterceptor";
import AddRegionForm from "./AddRegionForm";

export default function ShopRegions() {
    const axiosInstance = useAxiosWithAuth(import.meta.env.VITE_SERVER_URL);
    const [regions, setRegions] = useState<Region[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("HARDWARE");
    const [regionToDelete, setRegionToDelete] = useState<Region | null>(null);
    const [regionToToggle, setRegionToToggle] = useState<Region | null>(null);
    const [showAddRegion, setShowAddRegion] = useState(false);
    const [showEditRegion, setShowEditRegion] = useState(false);
    const [editingRegion, setEditingRegion] = useState<Region | null>(null);
    const [editSelectedRegion, setEditSelectedRegion] = useState("");
    const [editSelectedCounty, setEditSelectedCounty] = useState("");
    const [editFormData, setEditFormData] = useState({
        country: "",
        name: "",
        code: "",
        type: "HARDWARE",
        counties: "",
        filterable: false,
        customerView: false,
        active: true
    });

    const categories = [
        { id: "HARDWARE", label: "Hardware", type: "HARDWARE" },
        { id: "CUSTOM_PRODUCTS", label: "Custom Products", type: "FUNDI" },
        { id: "DESIGNS", label: "Designs", type: "PROFESSIONAL" },
        { id: "HIRE_MACHINERY", label: "Hire Machinery & E", type: "CONTRACTOR" }
    ];

    const fetchRegions = useCallback(async () => {
        try {
            setLoading(true);
            const response = await getAllRegions(axiosInstance);
            if (response.success) {
                //@ts-ignore
                setRegions(response.hashSet);
            }
        } catch (error) {
            console.error("Error fetching regions:", error);
            toast.error("Failed to fetch regions");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRegions();
    }, []);

    const selectedCategoryType = categories.find(cat => cat.id === selectedCategory)?.type || "HARDWARE";

    const filteredRegions = regions?.filter(
        (region) => {
            const matchesSearch =
                region.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                region.country.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesCategory = region.type === selectedCategoryType;

            return matchesSearch && matchesCategory;
        }
    );

    const handleEditRegion = (region: Region) => {
        setEditingRegion(region);
        const baseRegion = region.name.split(" - ")[0];
        setEditSelectedRegion(baseRegion);
        setEditSelectedCounty(region.counties || "");
        setEditFormData({
            country: region.country,
            name: region.name,
            code: "",
            type: region.type || "HARDWARE",
            counties: region.counties || "",
            filterable: region.filterable,
            customerView: region.customerView,
            active: region.active
        });
        setShowEditRegion(true);
    };

    const handleEditRegionSelect = (region: string) => {
        setEditSelectedRegion(region);
        setEditFormData({ ...editFormData, name: region });
    };

    const handleEditCountySelect = (county: string) => {
        setEditSelectedCounty(county);
        if (county && county !== editSelectedRegion) {
            setEditFormData({ ...editFormData, name: `${editSelectedRegion} - ${county}`, counties: county });
        } else {
            setEditFormData({ ...editFormData, name: editSelectedRegion, counties: '' });
        }
    };

    const handleSaveEditRegion = async () => {
        if (!editingRegion) return;

        try {
            const response = await updateRegion(axiosInstance, editingRegion.id, {
                country: editFormData.country,
                name: editFormData.name,
                type: editFormData.type,
                counties: editFormData.counties,
                filterable: editFormData.filterable,
                customerView: editFormData.customerView,
                active: editFormData.active
            } as any);
            if (response.success) {
                toast.success("Region updated successfully");
                setShowEditRegion(false);
                fetchRegions();
            } else {
                toast.error(response.message || "Failed to update region");
            }
        } catch (error) {
            console.error("Error updating region:", error);
            toast.error("Failed to update region");
        }
    };

    const handleDeleteRegion = (region: Region) => {
        setRegionToDelete(region);
    };

    const deleteRegionHandler = async () => {
        if (!regionToDelete) return;

        try {
            const response = await deleteRegion(
                axiosInstance,
                regionToDelete.id
            );
            if (response.success) {
                toast.success("Region deleted successfully");
                fetchRegions();
            } else {
                toast.error(response.message || "Failed to delete region");
            }
        } catch (error) {
            console.error("Error deleting region:", error);
            toast.error("Failed to delete region");
        } finally {
            setRegionToDelete(null);
        }
    };

    const handleToggleRegionStatus = (region: Region) => {
        setRegionToToggle(region);
    };

    const toggleRegionStatusHandler = async () => {
        if (!regionToToggle) return;

        try {
            const response = await toggleRegionStatus(
                axiosInstance,
                regionToToggle.id,
                regionToToggle.active
            );
            if (response.success) {
                toast.success(
                    `Region ${regionToToggle.active ? "disabled" : "enabled"
                    } successfully`
                );
                fetchRegions();
            } else {
                toast.error(
                    response.message || "Failed to toggle region status"
                );
            }
        } catch (error) {
            console.error("Error toggling region status:", error);
            toast.error("Failed to toggle region status");
        } finally {
            setRegionToToggle(null);
        }
    };

    const handleAddRegion = () => {
        setShowAddRegion(true);
    };

    if (showAddRegion) {
        return (
            <AddRegionForm
                onBack={() => {
                    setShowAddRegion(false);
                }}
                onSuccess={() => {
                    setShowAddRegion(false);
                    fetchRegions();
                }}
                predefinedType={selectedCategoryType}
            />
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Regions
                    </h1>
                    <p className="text-muted-foreground">
                        Manage regional availability and shipping zones.
                    </p>
                </div>
                <Button
                    onClick={handleAddRegion}
                    style={{ backgroundColor: "#00007A", color: "white" }}
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Region
                </Button>
            </div>

            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                {categories.map((category) => (
                    <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${selectedCategory === category.id
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
                        placeholder="Search regions..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Product Regions</CardTitle>
                    <CardDescription>
                        Manage regional availability and shipping zones for{" "}
                        {selectedCategory}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>No</TableHead>
                                <TableHead>Country</TableHead>
                                <TableHead>Region</TableHead>
                                <TableHead>Counties</TableHead>
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
                                        Loading regions...
                                    </TableCell>
                                </TableRow>
                            ) : filteredRegions?.length == 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={8}
                                        className="text-center py-8 text-muted-foreground"
                                    >
                                        No regions found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredRegions?.map((region, index) => (
                                    <TableRow
                                        key={region.id}
                                        className={!region.active ? "bg-gray-100 opacity-60 grayscale" : ""}
                                    >
                                        <TableCell>{index + 1}</TableCell>
                                        <TableCell>{region.country}</TableCell>
                                        <TableCell>{region.name}</TableCell>
                                        <TableCell>
                                            <div className="text-sm max-w-xs">
                                                {region.counties ? (
                                                    <Badge variant="outline" className="text-xs">
                                                        {region.counties}
                                                    </Badge>
                                                ) : (
                                                    <span className="text-gray-400">-</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={
                                                    region.active
                                                        ? "default"
                                                        : "secondary"
                                                }
                                            >
                                                {region.active ? "Yes" : "No"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={
                                                    region.filterable
                                                        ? "default"
                                                        : "secondary"
                                                }
                                            >
                                                {region.filterable ? "Yes" : "No"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={
                                                    region.customerView
                                                        ? "default"
                                                        : "secondary"
                                                }
                                            >
                                                {region.customerView ? "Yes" : "No"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <span className="sr-only">Open menu</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleEditRegion(region)}>
                                                        <Edit className="mr-2 h-4 w-4" />
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleToggleRegionStatus(region)}>
                                                        {region.active ? (
                                                            <XCircle className="mr-2 h-4 w-4" />
                                                        ) : (
                                                            <CheckCircle className="mr-2 h-4 w-4" />
                                                        )}
                                                        {region.active ? "Disable" : "Enable"}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => handleDeleteRegion(region)}
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

            <Dialog open={!!regionToDelete} onOpenChange={(open) => !open && setRegionToDelete(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Region</DialogTitle>
                    </DialogHeader>
                    <p className="text-gray-600">
                        Are you sure you want to delete "{regionToDelete?.name}"? This action cannot be undone.
                    </p>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setRegionToDelete(null)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={deleteRegionHandler}
                        >
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={!!regionToToggle} onOpenChange={(open) => !open && setRegionToToggle(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {regionToToggle?.active ? "Disable" : "Enable"} Region
                        </DialogTitle>
                    </DialogHeader>
                    <p className="text-gray-600">
                        Are you sure you want to {regionToToggle?.active ? "disable" : "enable"} "{regionToToggle?.name}"?
                    </p>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setRegionToToggle(null)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant={regionToToggle?.active ? "destructive" : "default"}
                            onClick={toggleRegionStatusHandler}
                        >
                            {regionToToggle?.active ? "Disable" : "Enable"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={showEditRegion} onOpenChange={setShowEditRegion}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Region</DialogTitle>
                        <DialogDescription>
                            Update the region details below.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-country">Country</Label>
                            <Input
                                id="edit-country"
                                value={editFormData.country}
                                onChange={(e) =>
                                    setEditFormData({
                                        ...editFormData,
                                        country: e.target.value
                                    })
                                }
                                placeholder="e.g., Kenya"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-region">Select Region</Label>
                            <Select value={editSelectedRegion} onValueChange={handleEditRegionSelect}>
                                <SelectTrigger id="edit-region">
                                    <SelectValue placeholder="Select a region" />
                                </SelectTrigger>
                                <SelectContent>
                                    {kenyanRegions.map((r) => (
                                        <SelectItem key={r.region} value={r.region}>
                                            {r.region}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {editSelectedRegion && (
                            <div className="space-y-2">
                                <Label htmlFor="edit-county">Select County (Optional)</Label>
                                <Select onValueChange={handleEditCountySelect}>
                                    <SelectTrigger id="edit-county">
                                        <SelectValue placeholder="Select a county" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {getCountiesForRegion(editSelectedRegion).map((county) => (
                                            <SelectItem key={county} value={county}>
                                                {county}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="edit-name">Region Name</Label>
                            <Input
                                id="edit-name"
                                value={editFormData.name}
                                onChange={(e) =>
                                    setEditFormData({
                                        ...editFormData,
                                        name: e.target.value
                                    })
                                }
                                placeholder="e.g., Nairobi"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-type">Type</Label>
                            <Select
                                value={editFormData.type || 'HARDWARE'}
                                onValueChange={(value) =>
                                    setEditFormData({
                                        ...editFormData,
                                        type: value
                                    })
                                }
                                disabled
                            >
                                <SelectTrigger id="edit-type" className="bg-gray-100 cursor-not-allowed">
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="HARDWARE">Hardware</SelectItem>
                                    <SelectItem value="FUNDI">Custom Products</SelectItem>
                                    <SelectItem value="PROFESSIONAL">Designs</SelectItem>
                                    <SelectItem value="CONTRACTOR">Hire Machinery & E</SelectItem>
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
                            onClick={() => setShowEditRegion(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSaveEditRegion}
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