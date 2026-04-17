/* eslint-disable react-hooks/exhaustive-deps */
//@ts-nocheck
import React, { useState, useEffect } from "react";
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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import {
    Plus,
    Search,
    Edit,
    Trash2,
    Eye,
    X,
    Check,
    Package,
    FileUp,
    ChevronRight,
    ChevronLeft,
    MoreVertical,
    FileDown,
    Download,
    Filter,
    Upload,
    LogOut,
    Loader2,
    Power
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "react-hot-toast";
import * as XLSX from "xlsx";
import AddProductForm from "./AddProductForm";
import {
    getAllProducts,
    approveProduct,
    deleteProduct as deleteProductAPI,
    bulkCreateProducts
} from "@/api/products.api";
import { logProductView } from "@/api/analytics.api";
import useAxiosWithAuth from "@/utils/axiosInterceptor";

interface Price {
    regionId: number;
    regionName: string;
    price: number;
}

interface Product {
    id: number;
    name: string;
    description: string;
    type: string;
    group: string;
    subGroup: string | null;
    sku: string | null;
    productCode: string | null;
    basePrice: number | null;
    pricingReference: string | null;
    priceLastUpdated: string | null;
    images: string[] | null;
    specs: any | null;
    customPrice: number | null;
    custom: boolean;
    createdAt: string;
    updatedAt: string;
    active: boolean;
    prices: Price[];
    users: {
        firstName: string;
        lastName: string;
        organizationName: string | null;
    } | null;
}

export default function ShopProducts() {
    const axiosInstance = useAxiosWithAuth(import.meta.env.VITE_SERVER_URL);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedGroup, setSelectedGroup] = useState("HARDWARE");
    const [showAddProduct, setShowAddProduct] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [showProductModal, setShowProductModal] = useState(false);
    const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
    const [statusFilter, setStatusFilter] = useState("all");
    const [approvingId, setApprovingId] = useState<number | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [isBatchDeleting, setIsBatchDeleting] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [importing, setImporting] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setImporting(true);
        const reader = new FileReader();

        reader.onload = async (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: "binary" });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws) as any[];

                if (data.length === 0) {
                    toast.error("The file is empty");
                    setImporting(false);
                    return;
                }

                const loadingToast = toast.loading(`Importing ${data.length} products...`);

                // Map spreadsheet columns to product fields
                const formattedProducts = data.map((row) => ({
                    name: row["Name"] || row["name"],
                    description: row["Description"] || row["description"] || "",
                    type: row["Type"] || row["type"] || selectedGroupType,
                    group: row["Category"] || row["Category Name"] || row["group"] || "",
                    subGroup: row["Sub Category"] || row["Sub Category Name"] || row["subGroup"] || null,
                    sku: row["SKU"] || row["sku"] || null,
                    productCode: row["Product Code"] || row["productCode"] || null,
                    basePrice: Number(row["Base Price"] || row["basePrice"] || 0),
                    pricingReference: row["Pricing Reference"] || row["pricingReference"] || "",
                    active: String(row["Status"]).toLowerCase() === "active" || row["active"] === true,
                    // If there are specs, they might be in a JSON string or as individual columns
                    specs: row["Specs"] ? JSON.parse(row["Specs"]) : {}
                }));

                try {
                    const response = await bulkCreateProducts(axiosInstance, formattedProducts);
                    toast.dismiss(loadingToast);
                    if (response.success) {
                        toast.success(`Successfully imported ${formattedProducts.length} products`);
                        fetchProducts();
                    } else {
                        toast.error(response.message || "Failed to import products");
                    }
                } catch (error: any) {
                    toast.dismiss(loadingToast);
                    toast.error(error.message || "Bulk upload failed");
                }
            } catch (error) {
                console.error("Import error:", error);
                toast.error("Failed to parse file. Ensure it's a valid Excel or CSV.");
            } finally {
                setImporting(false);
                if (fileInputRef.current) fileInputRef.current.value = "";
            }
        };

        reader.readAsBinaryString(file);
    };

    const groups = [
        { id: "HARDWARE", label: "Hardware", type: "HARDWARE" },
        { id: "CUSTOM_PRODUCTS", label: "Custom Products", type: "FUNDI" },
        { id: "DESIGNS", label: "Designs", type: "PROFESSIONAL" },
        { id: "HIRE_MACHINERY", label: "Hire Machinery & Equipment", type: "CONTRACTOR" }
    ];

    const fetchProducts = async (showLoader = true) => {
        try {
            if (showLoader) setLoading(true);
            const response = await getAllProducts(axiosInstance);
            if (response.success) {
                setProducts(response.hashSet);
            } else {
                toast.error("Failed to fetch products");
            }
        } catch (error) {
            console.error("Error fetching products:", error);
            toast.error("Failed to fetch products");
        } finally {
            if (showLoader) setLoading(false);
        }
    };

    const handleEditProduct = (product: Product) => {
        setEditingProduct(product);
        setShowAddProduct(true);
    };

    const handleViewProduct = async (product: Product) => {
        setSelectedProduct(product);
        setShowProductModal(true);

        try {
            await logProductView(axiosInstance, product.id.toString());
        } catch (e) {
            console.warn('Failed to log product view', e);
        }
    };

    const deleteProduct = async (productId: number) => {
        try {
            setDeletingId(productId);
            await deleteProductAPI(axiosInstance, productId);
            toast.success("Product deleted successfully");
            fetchProducts(false);
        } catch (error) {
            console.error("Error deleting product:", error);
            toast.error("Failed to delete product");
        } finally {
            setDeletingId(null);
        }
    };

    const handleApproveProduct = async (productId: number) => {
        try {
            setApprovingId(productId);
            await approveProduct(axiosInstance, productId);
            toast.success("Product status updated successfully");
            setProducts(prevProducts =>
                prevProducts.map(p =>
                    p.id === productId ? { ...p, active: !p.active } : p
                )
            );
            fetchProducts(false);
        } catch (error) {
            console.error("Error updating product:", error);
            toast.error("Failed to update product status");
        } finally {
            setApprovingId(null);
        }
    };

    const toggleSelectRow = (productId: number) => {
        const newSelected = new Set(selectedRows);
        if (newSelected.has(productId)) {
            newSelected.delete(productId);
        } else {
            newSelected.add(productId);
        }
        setSelectedRows(newSelected);
    };

    const toggleSelectAll = (currentProducts: Product[]) => {
        if (selectedRows.size === currentProducts.length) {
            setSelectedRows(new Set());
        } else {
            setSelectedRows(new Set(currentProducts.map(p => p.id)));
        }
    };

    const handleDeleteBatch = async () => {
        if (selectedRows.size === 0) return;

        if (!window.confirm(`Are you sure you want to delete ${selectedRows.size} products?`)) return;

        try {
            setIsBatchDeleting(true);
            const deletePromises = Array.from(selectedRows).map(id => deleteProductAPI(axiosInstance, id));
            await Promise.all(deletePromises);
            toast.success(`${selectedRows.size} products deleted successfully`);
            setSelectedRows(new Set());
            await fetchProducts(false);
        } catch (error) {
            console.error("Error batch deleting:", error);
            toast.error("An error occurred during batch deletion");
        } finally {
            setIsBatchDeleting(false);
        }
    };

    const selectedGroupType = groups.find(g => g.id === selectedGroup)?.type || "HARDWARE";

    const filteredProducts = products?.filter((product) => {
        const matchesSearch =
            product?.name?.toLowerCase().includes(searchTerm?.toLowerCase()) ||
            (product?.basePrice?.toString() || "").includes(searchTerm) ||
            (product?.pricingReference?.toLowerCase() || "").includes(searchTerm?.toLowerCase()) ||
            (product.active ? "active" : "inactive").includes(searchTerm.toLowerCase());

        const matchesGroup = product.type === selectedGroupType;

        const matchesStatus = statusFilter === "all" ||
            (statusFilter === "active" && product.active) ||
            (statusFilter === "inactive" && !product.active);

        return matchesSearch && matchesGroup && matchesStatus;
    });

    const totalPages = Math.ceil((filteredProducts?.length || 0) / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentProducts = filteredProducts?.slice(indexOfFirstItem, indexOfLastItem) || [];

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedGroup]);

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleExportToXLSX = () => {
        try {
            const exportData = filteredProducts.map((product) => ({
                ID: product.id,
                Name: product.name,
                Description: product.description,
                Type: product.type,
                Category: product.group,
                ...product.specs,
                Custom: product.custom ? "Yes" : "No",
                "Image Count": product.images?.length || 0,
                "Custom Price": product.customPrice || "",
                "Created At": product.createdAt,
                "Updated At": product.updatedAt,
                Status: product.active ? "Active" : "Inactive"
            }));

            const worksheet = XLSX.utils.json_to_sheet(exportData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Products");

            const timestamp = new Date().toISOString().split("T")[0];
            const filename = `products_${selectedGroup}_${timestamp}.xlsx`;

            XLSX.writeFile(workbook, filename);
            toast.success("Products exported successfully!");
        } catch (error) {
            console.error("Error exporting to XLSX:", error);
            toast.error("Failed to export products");
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("en-KE", {
            style: "currency",
            currency: "KES"
        }).format(price);
    };

    const getLowestPrice = (product: Product) => {
        if (product.prices && product.prices.length > 0) {
            return Math.min(...product.prices.map(p => p.price));
        }
        return Number(product.customPrice) || Number(product.basePrice) || 0;
    };

    const getHighestPrice = (product: Product) => {
        if (product.prices && product.prices.length > 0) {
            return Math.max(...product.prices.map(p => p.price));
        }
        return Number(product.customPrice) || Number(product.basePrice) || 0;
    };

    if (showAddProduct) {
        return (
            <AddProductForm
                onBack={() => {
                    setShowAddProduct(false);
                    setEditingProduct(null);
                }}
                onSuccess={() => {
                    setShowAddProduct(false);
                    setEditingProduct(null);
                    fetchProducts();
                }}
                product={editingProduct}
                isEditMode={!!editingProduct}
                initialType={selectedGroupType}
            />
        );
    }

    const ProductDetailModal = ({
        product,
        isOpen,
        onClose
    }: {
        product: Product | null;
        isOpen: boolean;
        onClose: () => void;
    }) => {
        if (!product) return null;

        const DetailItem = ({ label, children }: { label: string; children: React.ReactNode }) => (
            <div>
                <dt className="text-sm font-medium text-gray-500">{label}</dt>
                <dd className="mt-1 text-gray-900">{children}</dd>
            </div>
        );

        return (
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="max-w-[1200px] sm:max-w-[1200px] md:max-w-[1200px] lg:max-w-[1200px] xl:max-w-[1200px] w-[95vw] max-h-[95vh] overflow-y-auto bg-white p-0 rounded-3xl scrollbar-hide border-none shadow-2xl">


                    <div className="px-8 sm:px-12 pt-8 sm:pt-10 pb-0">
                        <div className="flex justify-between items-start mb-6">
                            <div className="space-y-1">
                                <DialogTitle className="text-4xl font-black text-[#111827] tracking-tight">
                                    {product?.name?.toUpperCase() || ""}
                                </DialogTitle>
                                <p className="text-[11px] font-medium text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                    <span>SKU: <span className="text-gray-600 font-bold">{product.sku || 'N/A'}</span></span>
                                    <span className="text-gray-300">|</span>
                                    <span>BID: <span className="text-gray-600 font-bold">{product.productCode || 'N/A'}</span></span>
                                </p>
                            </div>
                            <div className="flex items-center gap-3 mt-1">
                                <Badge
                                    variant="secondary"
                                    className="bg-gray-100 text-gray-600 border-none rounded-full px-4 py-1.5 text-[10px] font-bold grayscale opacity-80"
                                >
                                    {product.group}
                                </Badge>
                                <Badge
                                    variant="secondary"
                                    className="bg-blue-50 text-blue-600 border-none rounded-full px-4 py-1.5 text-[10px] font-bold"
                                >
                                    {product.active ? "Approved" : "Pending"}
                                </Badge>
                            </div>
                        </div>


                        <div className="flex gap-3 pb-6 border-b border-gray-100">
                            <Button
                                onClick={() => { onClose(); handleEditProduct(product); }}
                                variant="outline"
                                className="h-10 px-6 rounded-xl border-gray-200 hover:bg-gray-50 flex items-center gap-2 text-sm font-bold shadow-sm"
                            >
                                <Edit className="h-4 w-4" />
                                Edit
                            </Button>
                        </div>
                    </div>


                    <div className="px-8 sm:px-12 pb-6">
                        <div className="grid grid-cols-1 lg:grid-cols-[320px,1fr] gap-10 mt-6 items-start">


                            <div className="space-y-10">

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-7">

                                    {product.images && product.images.length > 0 ? (
                                        <div className="grid grid-cols-6 gap-3">
                                            {product.images.map((img: string, i: number) => (
                                                <div
                                                    key={i}
                                                    className="aspect-square rounded-xl overflow-hidden border border-gray-100 bg-white p-2 cursor-pointer hover:border-black hover:shadow-md transition-all group"
                                                >
                                                    <img
                                                        src={img}
                                                        alt={`${product.name} ${i + 1}`}
                                                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="aspect-square rounded-3xl overflow-hidden border border-gray-100 bg-gray-50 flex items-center justify-center p-6">
                                            <Package className="h-16 w-16 text-gray-400" />
                                        </div>
                                    )}
                                    <div className="flex flex-col gap-2">
                                        <h3 className="text-[14px] font-bold text-black flex items-center gap-2">
                                            Description
                                        </h3>
                                        <p className="text-[15px] text-gray-700 leading-relaxed max-w-3xl">
                                            {product.description || "No description provided for this product."}
                                        </p>
                                    </div>
                                </div>


                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <section className="space-y-6">
                                        <h3 className="text-[14px] font-bold text-black flex items-center gap-2 text-nowrap">
                                            Attributes & Specifications
                                        </h3>
                                        <div className="grid grid-cols-1 gap-y-5">
                                            <div className="space-y-1">
                                                <p className="text-[11px] font-bold text-gray-500 uppercase">Classification</p>
                                                <p className="text-[14px] text-black">{product.group} {product.subGroup ? `— ${product.subGroup}` : ''}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[11px] font-bold text-gray-500 uppercase">Product Type</p>
                                                <p className="text-[14px] text-black">{product.type}</p>
                                            </div>
                                            {product.specs && Object.entries(product.specs).map(([key, value]) => (
                                                <div key={key} className="space-y-1">
                                                    <p className="text-[11px] font-bold text-gray-500 uppercase">
                                                        {key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim()}
                                                    </p>
                                                    <p className="text-[14px] text-black">
                                                        {Array.isArray(value) ? value.join(', ') : String(value)}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </section>

                                    <section className="space-y-6">
                                        <h3 className="text-[14px] font-bold text-black flex items-center gap-2">
                                            Seller Information
                                        </h3>
                                        <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 space-y-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-bold text-lg">
                                                    {product.users?.firstName?.[0] || 'S'}
                                                </div>
                                                <div>
                                                    <p className="text-[14px] font-bold text-black">
                                                        {product.users ? `${product.users.firstName} ${product.users.lastName}` : 'System Product'}
                                                    </p>
                                                    <p className="text-[11px] font-bold text-gray-500 uppercase">
                                                        {product.users?.organizationName || 'Verified Seller'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 gap-4 pt-4 border-t border-gray-200">
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-bold text-gray-500 uppercase">Pricing Reference</p>
                                                    <p className="text-[13px] text-black">{product.pricingReference || 'None'}</p>
                                                </div>
                                                {product.custom && (
                                                    <Badge className="bg-gray-200 text-gray-700 hover:bg-gray-200 border-none rounded-md px-3 py-1 font-bold text-[10px] uppercase w-fit">
                                                        Custom Quote
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </section>
                                </div>


                                <section className="space-y-6 pt-10 border-t border-gray-100">
                                    <h3 className="text-[14px] font-bold text-black flex items-center gap-2">
                                        Pricing Information
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                        <div className="bg-white rounded-2xl p-5 border border-gray-100">
                                            <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">Base Price</p>
                                            <p className="text-2xl font-bold text-black">
                                                {product.basePrice ? formatPrice(product.basePrice) : "—"}
                                            </p>
                                        </div>
                                        {(product.customPrice || product.custom) && (
                                            <div className="bg-white rounded-2xl p-5 border border-gray-100">
                                                <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">Seller Price</p>
                                                <p className="text-2xl font-bold text-black">
                                                    {product.customPrice ? formatPrice(Number(product.customPrice)) : "Request Quote"}
                                                </p>
                                            </div>
                                        )}
                                        <div className="bg-white rounded-2xl p-5 border border-gray-100">
                                            <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">Status</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge className="bg-gray-100 text-gray-700 border-none rounded px-2 py-0.5 text-[10px] font-bold uppercase">
                                                    {product.prices?.length > 0 ? 'Multi-Region' : 'Flat Rate'}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>


                                    {product.prices?.length > 0 && (
                                        <div className="space-y-4 rounded-2xl overflow-hidden border border-gray-100">
                                            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                                                <p className="text-[11px] font-bold text-gray-500 uppercase">
                                                    Regional Price Breakdown
                                                </p>
                                                <Badge className="bg-white text-gray-500 border-gray-200 text-[10px] font-bold">
                                                    {product.prices.length} Regions
                                                </Badge>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 divide-x divide-y divide-gray-100 bg-white">
                                                {product.prices.map((price: any, index: number) => (
                                                    <div
                                                        key={index}
                                                        className="flex justify-between items-center px-6 py-5"
                                                    >
                                                        <span className="text-[14px] text-gray-700">
                                                            {price.regionName}
                                                        </span>
                                                        <span className="text-[15px] font-bold text-black">
                                                            {formatPrice(price.price)}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </section>

                                <div className="space-y-4">



                                    <div className="pt-6 space-y-4 bg-gray-50/50 rounded-2xl p-5 border border-gray-100">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-gray-500 uppercase">Added On</p>
                                            <p className="text-[13px] text-black">
                                                {product.createdAt ? new Date(product.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-gray-500 uppercase">Last Updated</p>
                                            <p className="text-[13px] text-black">
                                                {product.updatedAt ? new Date(product.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
                                            </p>
                                        </div>
                                        {product.priceLastUpdated && (
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-bold text-gray-500 uppercase">Price Last Updated</p>
                                                <p className="text-[13px] text-black">
                                                    {new Date(product.priceLastUpdated).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                </p>
                                            </div>
                                        )}
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-gray-500 uppercase">Product ID</p>
                                            <p className="text-[13px] text-black">#{product.id}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="h-4" />
                            </div>
                        </div>
                    </div>


                    <div className="sticky bottom-0 bg-white/90 backdrop-blur-md px-8 sm:px-12 py-5 border-t border-gray-100 flex justify-end">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            className="h-10 px-10 rounded-xl border-gray-200 hover:bg-gray-100 transition-all font-bold text-gray-600 text-sm"
                        >
                            Close
                        </Button>
                    </div>

                </DialogContent>
            </Dialog>
        );
    };

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto">
            <div className="flex flex-col space-y-1">
                <h1 className="text-2xl font-bold tracking-tight text-[#111827]">
                    Products
                </h1>
                <p className="text-sm text-gray-500">
                    Manage all shop products, inventory, and pricing.
                </p>
            </div>

            <div className="flex space-x-2">
                {groups.map((group) => (
                    <button
                        key={group.id}
                        onClick={() => setSelectedGroup(group.id)}
                        className={`flex-1 px-6 py-3.5 text-sm font-bold rounded-lg transition-all duration-200 ${selectedGroup === group.id
                            ? "bg-[#00007A] text-white shadow-md shadow-blue-900/20"
                            : "bg-[#60A5FA] text-white hover:bg-blue-500"
                            }`}
                    >
                        {group.label}
                    </button>
                ))}
            </div>

            <div className="flex items-center justify-between pt-2">
                <div className="flex items-center space-x-3">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="h-10 px-4 rounded-lg flex items-center space-x-2 bg-white text-gray-700">
                                <Filter className="h-4 w-4" />
                                <span className="font-semibold">Status: {statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-white">
                            <DropdownMenuItem onClick={() => setStatusFilter("all")}>All</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setStatusFilter("active")}>Active</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setStatusFilter("inactive")}>Inactive</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <div className="flex items-center space-x-3">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImport}
                        accept=".xlsx, .xls, .csv"
                        className="hidden"
                    />
                    <Button
                        variant="outline"
                        onClick={handleImportClick}
                        disabled={importing}
                        className="h-10 bg-white border-gray-200 text-gray-700 rounded-lg"
                    >
                        {importing ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Upload className="mr-2 h-4 w-4" />
                        )}
                        {importing ? "Importing..." : "Import"}
                    </Button>
                    <Button
                        variant="outline"
                        onClick={handleExportToXLSX}
                        className="h-10 bg-white border-gray-200 text-gray-700 rounded-lg"
                    >
                        <Download className="mr-2 h-4 w-4" /> Export
                    </Button>
                    {selectedRows.size > 0 && (
                        <Button
                            variant="outline"
                            onClick={handleDeleteBatch}
                            disabled={isBatchDeleting}
                            className="h-10 text-red-600 border-red-200 bg-red-50/30 hover:bg-red-50 rounded-lg font-semibold"
                        >
                            {isBatchDeleting ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Trash2 className="mr-2 h-4 w-4" />
                            )}
                            {isBatchDeleting ? 'Deleting...' : `Delete Batch (${selectedRows.size})`}
                        </Button>
                    )}
                    <Button
                        onClick={() => setShowAddProduct(true)}
                        className="h-10 bg-[#00007A] hover:bg-blue-900 text-white rounded-lg px-6 font-semibold"
                    >
                        <Plus className="mr-2 h-4 w-4" /> Add Product
                    </Button>
                </div>
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                    placeholder="Search by Name, SKU, Product Code"
                    className="w-full pl-10 h-10 rounded-lg bg-white border-gray-200 text-sm focus-visible:ring-1 focus-visible:ring-blue-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden min-h-[400px]">
                <div className="px-6 py-4 border-b border-gray-100">
                    <h2 className="text-base font-bold text-gray-900">Products</h2>
                    <p className="text-xs text-gray-500 font-medium mt-0.5">{filteredProducts.length} products</p>
                </div>

                <div className="p-0">
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-pulse text-muted-foreground">
                                Loading products...
                            </div>
                        </div>
                    ) : filteredProducts?.length === 0 ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="text-muted-foreground">
                                No products found for this group.
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-gray-50/50">
                                    <TableRow className="border-b border-gray-100 hover:bg-transparent">
                                        <TableHead className="w-12 h-12">
                                            <Checkbox
                                                checked={selectedRows.size === currentProducts.length && currentProducts.length > 0}
                                                onCheckedChange={() => toggleSelectAll(currentProducts)}
                                                className="translate-y-0.5"
                                            />
                                        </TableHead>
                                        <TableHead className="text-xs font-bold text-gray-400 uppercase tracking-wider h-12">No</TableHead>
                                        <TableHead className="text-xs font-bold text-gray-400 uppercase tracking-wider h-12">Thumb</TableHead>
                                        <TableHead className="text-xs font-bold text-gray-400 uppercase tracking-wider h-12">Name</TableHead>
                                        <TableHead className="text-xs font-bold text-gray-400 uppercase tracking-wider h-12">Price (KES)</TableHead>
                                        <TableHead className="text-xs font-bold text-gray-400 uppercase tracking-wider h-12">SKU</TableHead>
                                        <TableHead className="text-xs font-bold text-gray-400 uppercase tracking-wider h-12">Product Code</TableHead>
                                        <TableHead className="text-xs font-bold text-gray-400 uppercase tracking-wider h-12">Status</TableHead>
                                        <TableHead className="text-xs font-bold text-gray-400 uppercase tracking-wider h-12 text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {currentProducts.map((product, index) => (
                                        <TableRow key={product.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors h-[72px]">
                                            <TableCell>
                                                <Checkbox
                                                    checked={selectedRows.has(product.id)}
                                                    onCheckedChange={() => toggleSelectRow(product.id)}
                                                    className="translate-y-0.5"
                                                />
                                            </TableCell>
                                            <TableCell className="font-bold text-gray-900 text-sm">
                                                {indexOfFirstItem + index + 1}
                                            </TableCell>
                                            <TableCell>
                                                <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center overflow-hidden border border-gray-100 shadow-sm">
                                                    {product.images && product.images.length > 0 ? (
                                                        <img
                                                            src={product.images[0]}
                                                            alt={product.name}
                                                            className="w-full h-full object-cover transform hover:scale-110 transition-transform duration-300"
                                                        />
                                                    ) : (
                                                        <Package className="h-5 w-5 text-gray-300" />
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="min-w-[200px]">
                                                <div>
                                                    <div className="font-bold text-gray-900 text-sm">{product.name}</div>
                                                    <div className="text-[11px] font-medium text-gray-400 mt-0.5">{product.group}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-bold text-gray-900 text-sm">
                                                    {product.prices && product.prices.length > 0 ? (
                                                        <span>
                                                            {formatPrice(getLowestPrice(product))} - {formatPrice(getHighestPrice(product))}
                                                        </span>
                                                    ) : product.customPrice ? (
                                                        formatPrice(Number(product.customPrice))
                                                    ) : product.basePrice ? (
                                                        formatPrice(Number(product.basePrice))
                                                    ) : (
                                                        "Not set"
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm font-medium text-gray-600">
                                                {product.sku || "-"}
                                            </TableCell>
                                            <TableCell className="text-sm font-medium text-gray-600">
                                                {product.productCode || "-"}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    className={`px-3 py-1 rounded-full text-[10px] font-bold border-none ${product.active
                                                        ? "bg-emerald-100 text-emerald-600 border-emerald-200"
                                                        : "bg-gray-100 text-gray-500"
                                                        }`}
                                                >
                                                    {product.active ? "Active" : "Inactive"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-gray-100 rounded-full">
                                                            <MoreVertical className="h-4 w-4 text-gray-400" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="bg-white w-48 p-1.5 shadow-xl rounded-xl border-gray-100">
                                                        <DropdownMenuItem onClick={() => handleViewProduct(product)} className="flex items-center space-x-2 p-2 cursor-pointer hover:bg-blue-50 rounded-lg">
                                                            <Eye className="h-4 w-4 text-blue-500" />
                                                            <span className="text-xs font-semibold">View Details</span>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleEditProduct(product)} className="flex items-center space-x-2 p-2 cursor-pointer hover:bg-emerald-50 rounded-lg">
                                                            <Edit className="h-4 w-4 text-emerald-500" />
                                                            <span className="text-xs font-semibold">Edit Product</span>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                if (approvingId === product.id) return;
                                                                const hasPrice = (product.basePrice && Number(product.basePrice) > 0) ||
                                                                    (product.customPrice && Number(product.customPrice) > 0) ||
                                                                    (product.prices && product.prices.some(p => p.price > 0));
                                                                if (hasPrice) {
                                                                    handleApproveProduct(product.id);
                                                                } else {
                                                                    toast.error("Please set a price before approving.");
                                                                }
                                                            }}
                                                            className={`flex items-center space-x-2 p-2 rounded-lg ${!((product.basePrice && Number(product.basePrice) > 0) ||
                                                                (product.customPrice && Number(product.customPrice) > 0) ||
                                                                (product.prices && product.prices.some(p => p.price > 0)))
                                                                ? "opacity-50 cursor-not-allowed grayscale"
                                                                : "cursor-pointer hover:bg-amber-50"
                                                                } ${approvingId === product.id ? "opacity-50 pointer-events-none" : ""}`}
                                                        >
                                                            {approvingId === product.id ? (
                                                                <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
                                                            ) : (
                                                                <Check className={`h-4 w-4 ${!((product.basePrice && Number(product.basePrice) > 0) ||
                                                                    (product.customPrice && Number(product.customPrice) > 0) ||
                                                                    (product.prices && product.prices.some(p => p.price > 0)))
                                                                    ? "text-gray-400"
                                                                    : "text-amber-500"
                                                                    }`} />
                                                            )}
                                                            <span className="text-xs font-semibold">{approvingId === product.id ? (product.active ? 'Disapproving...' : 'Approving...') : (product.active ? 'Disapprove' : 'Approve')}</span>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                if (deletingId === product.id) return;
                                                                deleteProduct(product.id);
                                                            }}
                                                            className={`flex items-center space-x-2 p-2 rounded-lg text-red-600 ${deletingId === product.id ? "opacity-50 pointer-events-none" : "cursor-pointer hover:bg-red-50"
                                                                }`}
                                                        >
                                                            {deletingId === product.id ? (
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                            ) : (
                                                                <Trash2 className="h-4 w-4" />
                                                            )}
                                                            <span className="text-xs font-semibold">{deletingId === product.id ? 'Deleting...' : 'Delete'}</span>
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex items-center justify-between pt-4">
                <div className="flex items-center space-x-2">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                        Rows per page
                    </span>
                    <select
                        className="bg-white border border-gray-100 rounded-lg px-2 py-1 text-xs font-bold text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all shadow-sm"
                        value={itemsPerPage}
                        onChange={(e) => {
                            setItemsPerPage(Number(e.target.value));
                            setCurrentPage(1);
                        }}
                    >
                        <option value="5">5</option>
                        <option value="10">10</option>
                        <option value="20">20</option>
                        <option value="50">50</option>
                    </select>
                </div>

                <div className="flex items-center space-x-6">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                        Page {currentPage} of {totalPages === 0 ? 1 : totalPages}
                    </span>
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1 || filteredProducts?.length === 0}
                            className="h-8 w-8 hover:bg-gray-100 text-gray-400 disabled:opacity-20"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages || filteredProducts?.length === 0}
                            className="h-8 w-8 hover:bg-gray-100 text-gray-400 disabled:opacity-20"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            <ProductDetailModal
                product={selectedProduct}
                isOpen={showProductModal}
                onClose={() => {
                    setShowProductModal(false);
                    setSelectedProduct(null);
                }}
            />
        </div>
    );
}