/* eslint-disable react-hooks/exhaustive-deps */
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
    ChevronLeft,
    ChevronRight
} from "lucide-react";
import { toast } from "react-hot-toast";
import * as XLSX from "xlsx";
import AddProductForm from "./AddProductForm";
import {
    getAllProducts,
    approveProduct,
    deleteProduct as deleteProductAPI
} from "@/api/products.api";
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
    category: string;
    subcategory: string | null;
    basePrice: number | null;
    pricingReference: string | null;
    lastUpdated: string | null;
    bId: string | null;
    sku: string | null;
    material: string | null;
    size: string | null;
    color: string | null;
    uom: string | null;
    custom: boolean;
    images: string[] | null;
    customPrice: number | null;
    createdAt: string;
    updatedAt: string;
    active: boolean;
    prices: Price[];
}

export default function ShopProducts() {
    const axiosInstance = useAxiosWithAuth(import.meta.env.VITE_SERVER_URL);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("HARDWARE");
    const [showAddProduct, setShowAddProduct] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [showProductModal, setShowProductModal] = useState(false);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const categories = [
        { id: "HARDWARE", label: "Hardware", type: "HARDWARE" },
        { id: "CUSTOM_PRODUCTS", label: "Custom Products", type: "FUNDI" },
        { id: "DESIGNS", label: "Designs", type: "PROFESSIONAL" },
        { id: "HIRE_MACHINERY", label: "Hire Machinery & Equipment", type: "CONTRACTOR" }
    ];

    const fetchProducts = async () => {
        try {
            setLoading(true);
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
            setLoading(false);
        }
    };

    const handleEditProduct = (product: Product) => {
        setEditingProduct(product);
        setShowAddProduct(true);
    };

    const handleViewProduct = (product: Product) => {
        setSelectedProduct(product);
        setShowProductModal(true);
    };

    const deleteProduct = async (productId: number) => {
        try {
            await deleteProductAPI(axiosInstance, productId);
            toast.success("Product deleted successfully");
            fetchProducts();
        } catch (error) {
            console.error("Error deleting product:", error);
            toast.error("Failed to delete product");
        }
    };

    const handleApproveProduct = async (productId: number) => {
        try {
            await approveProduct(axiosInstance, productId);
            toast.success("Product status updated successfully");
            fetchProducts();
        } catch (error) {
            console.error("Error updating product:", error);
            toast.error("Failed to update product status");
        }
    };

    const selectedCategoryType = categories.find(cat => cat.id === selectedCategory)?.type || "HARDWARE";

    const filteredProducts = products?.filter((product) => {
        const matchesSearch =
            product?.name?.toLowerCase().includes(searchTerm?.toLowerCase()) ||
            (product?.sku?.toLowerCase() || "").includes(searchTerm?.toLowerCase()) ||
            (product?.bId?.toLowerCase() || "").includes(searchTerm?.toLowerCase()) ||
            (product?.basePrice?.toString() || "").includes(searchTerm) ||
            (product?.pricingReference?.toLowerCase() || "").includes(searchTerm?.toLowerCase()) ||
            (product.active ? "active" : "inactive").includes(searchTerm.toLowerCase());

        const matchesCategory = product.type === selectedCategoryType;

        return matchesSearch && matchesCategory;
    });

    // Pagination Logic
    const totalPages = Math.ceil((filteredProducts?.length || 0) / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentProducts = filteredProducts?.slice(indexOfFirstItem, indexOfLastItem) || [];

    // Reset pagination when filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedCategory]);

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
                Category: product.category,
                "BID": product.bId || "",
                "SKU": product.sku || "",
                Material: product.material || "",
                Size: product.size || "",
                Color: product.color || "",
                UOM: product.uom || "",
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
            const filename = `products_${selectedCategory}_${timestamp}.xlsx`;

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
        return product.basePrice || 0;
    };

    const getHighestPrice = (product: Product) => {
        if (product.prices && product.prices.length > 0) {
            return Math.max(...product.prices.map(p => p.price));
        }
        return product.basePrice || 0;
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
                initialType={selectedCategoryType}
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
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white p-6 sm:p-8 rounded-lg hide-scrollbar">
                    <DialogHeader>
                        <DialogTitle className="text-3xl font-bold text-gray-900">
                            {product.name}
                        </DialogTitle>
                        <DialogDescription className="pt-1">
                            SKU: {product.sku || 'N/A'} | BID: {product.bId || 'N/A'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-6 mt-6">
                        <div className="md:col-span-1 space-y-4">
                            {product.images && product.images.length > 0 ? (
                                <>
                                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border">
                                        <img
                                            src={product.images[0]}
                                            alt={`${product.name} - Primary`}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    {product.images.length > 1 && (
                                        <div className="grid grid-cols-4 gap-2">
                                            {product.images.slice(1).map((image, index) => (
                                                <div key={index} className="aspect-square bg-gray-100 rounded-md overflow-hidden border">
                                                    <img
                                                        src={image}
                                                        alt={`${product.name} - Thumbnail ${index + 1}`}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="aspect-square bg-gray-100 rounded-lg flex flex-col items-center justify-center text-center p-4">
                                    <Package className="h-10 w-10 text-gray-400 mb-2" />
                                    <p className="text-sm text-gray-500">No Images</p>
                                </div>
                            )}
                        </div>

                        <div className="md:col-span-2 space-y-6">
                            <section>
                                <p className="text-gray-700">{product.description || "No description available."}</p>
                            </section>

                            <div className="border-t"></div>

                            <section>
                                <h3 className="text-base font-semibold text-gray-800 mb-3">Product Details</h3>
                                <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
                                    <DetailItem label="Category">{product.category}</DetailItem>
                                    <DetailItem label="Subcategory">{product.subcategory || '-'}</DetailItem>
                                    <DetailItem label="Type">{product.type}</DetailItem>
                                    {product.material && <DetailItem label="Material">{product.material}</DetailItem>}
                                    {product.size && <DetailItem label="Size">{product.size}</DetailItem>}
                                    {product.color && <DetailItem label="Color">{product.color}</DetailItem>}
                                    {product.uom && <DetailItem label="Unit of Measure">{product.uom}</DetailItem>}
                                </dl>
                            </section>

                            <div className="border-t"></div>

                            <section>
                                <h3 className="text-base font-semibold text-gray-800 mb-3">Pricing Information</h3>
                                <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
                                    <DetailItem label="Base Price">
                                        <span className="font-semibold text-lg">{product.basePrice ? formatPrice(product.basePrice) : "Not set"}</span>
                                    </DetailItem>
                                    <DetailItem label="Pricing Reference">{product.pricingReference || "Not set"}</DetailItem>
                                    {product.customPrice && (
                                        <DetailItem label="Custom Price">
                                            <span className="font-semibold text-lg text-blue-600">{formatPrice(product.customPrice)}</span>
                                        </DetailItem>
                                    )}
                                </dl>
                                {product.prices && product.prices.length > 0 && (
                                    <div className="mt-4">
                                        <h4 className="text-sm font-medium text-gray-500 mb-2">Regional Prices</h4>
                                        <div className="space-y-2 max-h-32 overflow-y-auto pr-2 border rounded-md p-2 bg-gray-50/50 hide-scrollbar">
                                            {product.prices.map((price, index) => (
                                                <div key={index} className="flex justify-between items-center text-sm">
                                                    <span className="font-medium text-gray-700">{price.regionName}</span>
                                                    <span className="font-semibold">{formatPrice(price.price)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </section>

                            <div className="border-t"></div>

                            <section>
                                <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
                                    <DetailItem label="Status">
                                        <div className="flex flex-wrap gap-2">
                                            <Badge variant={product.active ? "default" : "secondary"}>{product.active ? "Active" : "Inactive"}</Badge>
                                            <Badge variant={product.custom ? "default" : "outline"}>{product.custom ? "Custom" : "Standard"}</Badge>
                                        </div>
                                    </DetailItem>
                                    <DetailItem label="Timestamps">
                                        <div className="text-sm">Created: {new Date(product.createdAt).toLocaleDateString('en-GB')}</div>
                                        <div className="text-sm">Updated: {new Date(product.updatedAt).toLocaleDateString('en-GB')}</div>
                                    </DetailItem>
                                </dl>
                            </section>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t mt-6">
                        <Button variant="outline" onClick={onClose} className="hover:bg-gray-100 transition-colors">
                            Close
                        </Button>
                        <Button
                            onClick={() => {
                                onClose();
                                handleEditProduct(product);
                            }}
                            className="bg-[#00007A] hover:bg-[#00007A]/90 text-white transition-colors"
                        >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Product
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
                    <h1 className="text-3xl font-bold tracking-tight">
                        Products
                    </h1>
                    <p className="text-muted-foreground">
                        Manage all shop products, inventory, and pricing.
                    </p>
                </div>
            </div>

            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                {categories.map((category) => (
                    <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${selectedCategory === category.id
                            ? "bg-[#00007A] text-white shadow-sm"
                            : "bg-transparent text-gray-600 hover:bg-gray-200 hover:text-gray-900"
                            }`}
                    >
                        {category.label}
                    </button>
                ))}
            </div>

            <div className="flex items-center space-x-2 bg-white border-none">
                <div className="relative flex-1 border-none">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by Name, SKU, BID, Price, Status"
                        className="pl-8 transition-shadow focus:ring-1 focus:ring-[#00007A]"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Button
                    variant="outline"
                    onClick={handleExportToXLSX}
                    className="hover:bg-gray-100 hover:border-gray-300 transition-colors"
                >
                    <FileUp className="mr-2 h-4 w-4" />
                    Export File
                </Button>
                <Button
                    onClick={() => setShowAddProduct(true)}
                    className="bg-[#00007A] hover:bg-[#00007A]/90 text-white transition-colors"
                >
                    <Plus className="mr-2 h-4 w-4" />Add Product
                </Button>
            </div>

            <Card className="bg-white border-none shadow-md">
                <CardHeader>
                    <CardTitle>Products</CardTitle>
                    <CardDescription>
                        Manage all products in the shop app
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-pulse text-muted-foreground">
                                Loading products...
                            </div>
                        </div>
                    ) : filteredProducts?.length === 0 ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="text-muted-foreground">
                                No products found for this category.
                            </div>
                        </div>
                    ) : (
                        <div className="rounded-md border border-gray-200 shadow-md p-6">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-12">No</TableHead>
                                        <TableHead className="w-20">Thumbnail</TableHead>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Price Range (KES)</TableHead>
                                        <TableHead>SKU</TableHead>
                                        <TableHead>BID</TableHead>
                                        <TableHead className="w-32">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {currentProducts.map((product, index) => (
                                        <TableRow key={product.id} className="hover:bg-gray-50 transition-colors">
                                            <TableCell className="font-medium">
                                                {indexOfFirstItem + index + 1}
                                            </TableCell>
                                            <TableCell>
                                                <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                                                    {product.images && product.images.length > 0 ? (
                                                        <img
                                                            src={product.images[0]}
                                                            alt={product.name}
                                                            className="w-full h-full object-cover transform hover:scale-110 transition-transform duration-300"
                                                        />
                                                    ) : (
                                                        <div className="text-gray-400 text-xs">No img</div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div>
                                                    <div className="font-medium">{product.name}</div>
                                                    <div className="text-sm text-muted-foreground">{product.category}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-medium">
                                                    {product.prices && product.prices.length > 0 ? (
                                                        <div>
                                                            <div>{formatPrice(getLowestPrice(product))}</div>
                                                            {getLowestPrice(product) !== getHighestPrice(product) && (
                                                                <div className="text-sm text-muted-foreground">
                                                                    - {formatPrice(getHighestPrice(product))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : product.basePrice ? (
                                                        formatPrice(product.basePrice)
                                                    ) : (
                                                        "Not set"
                                                    )}
                                                </div>
                                                {product.customPrice && (
                                                    <div className="text-sm text-muted-foreground">
                                                        Custom: {formatPrice(product.customPrice)}
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell className="font-mono text-sm">{product.sku || "Not set"}</TableCell>
                                            <TableCell className="font-mono text-sm">{product.bId || "Not set"}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center space-x-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleViewProduct(product)}
                                                        className="hover:bg-gray-100 hover:text-blue-600 border-gray-200"
                                                    >
                                                        <Eye className="h-3 w-3 mr-1" />
                                                        View
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleEditProduct(product)}
                                                        className="bg-[#00007A] hover:bg-[#00007A]/90 text-white transition-colors"
                                                    >
                                                        <Edit className="h-3 w-3 mr-1" />
                                                        Edit
                                                    </Button>

                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleApproveProduct(product.id)}
                                                        className={`transition-colors text-white ${product.active
                                                            ? "bg-amber-500 hover:bg-amber-600"
                                                            : "bg-emerald-500 hover:bg-emerald-600"
                                                            }`}
                                                    >
                                                        {product.active ? (
                                                            <>
                                                                <X className="h-3 w-3 mr-1" />
                                                                Disapprove
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Check className="h-3 w-3 mr-1" />
                                                                Approve
                                                            </>
                                                        )}
                                                    </Button>

                                                    <Button
                                                        size="sm"
                                                        onClick={() => deleteProduct(product.id)}
                                                        className="bg-red-600 hover:bg-red-700 text-white transition-colors"
                                                    >
                                                        <Trash2 className="h-3 w-3 mr-1" />
                                                        Delete
                                                    </Button>
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

            {/* Pagination */}
            <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">
                        Rows per page:
                    </span>
                    <select
                        className="border rounded px-2 py-1 text-sm bg-white hover:border-gray-400 focus:outline-none focus:ring-1 focus:ring-[#00007A] transition-colors"
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
                <div className="flex items-center space-x-4">
                    <span className="text-sm text-muted-foreground">
                        Page {currentPage} of {totalPages === 0 ? 1 : totalPages}
                    </span>
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1 || filteredProducts?.length === 0}
                            className="hover:bg-gray-100 disabled:opacity-50 transition-colors"
                        >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Prev
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages || filteredProducts?.length === 0}
                            className="hover:bg-gray-100 disabled:opacity-50 transition-colors"
                        >
                            Next
                            <ChevronRight className="h-4 w-4 ml-1" />
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