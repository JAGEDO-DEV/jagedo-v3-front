/* eslint-disable react-hooks/exhaustive-deps */
//@ts-nocheck
import React, { useState, useEffect, useCallback, useRef } from "react";
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
    Save,
    Edit,
    Eye,
    Package
} from "lucide-react";
import { toast } from "react-hot-toast";
import {
    getActiveProducts
} from "@/api/products.api";
import {
    getAllRegions
} from "@/api/regions.api";
import useAxiosWithAuth from "@/utils/axiosInterceptor";

interface Region {
    id: number;
    name: string;
    country: string;
    type: string;
    active: boolean;
    filterable: boolean;
    customerView: boolean;
}

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

// --- EXTRACTED COMPONENTS (Fixes re-render/focus issues) ---

const PriceInput = React.memo(({ 
    regionId, 
    regionName, 
    initialValue, 
    onChange 
}: { 
    regionId: number; 
    regionName: string; 
    initialValue: string; 
    onChange: (id: number, val: string) => void 
}) => {
    // We use local state for the input to ensure smooth typing
    // but we sync with parent via onChange
    const [value, setValue] = useState(initialValue);

    // Update local state if initialValue changes (e.g. when opening modal for different product)
    useEffect(() => {
        setValue(initialValue);
    }, [initialValue]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        // Allow only numbers and decimal point
        if (/^\d*\.?\d*$/.test(newValue) || newValue === '') {
            setValue(newValue);
            onChange(regionId, newValue);
        }
    };

    return (
        <div className="flex items-center gap-3">
            <label className="w-32 font-medium text-sm text-gray-700">{regionName}</label>
            <div className="flex items-center gap-1 flex-1">
                <Input
                    type="text"
                    inputMode="decimal"
                    value={value}
                    onChange={handleChange}
                    className="flex-1 px-2 py-1 text-sm"
                    placeholder="0.00"
                />
                <span className="text-xs text-gray-500">KES</span>
            </div>
        </div>
    );
});

const PriceModal = ({
    product,
    isOpen,
    onClose,
    categoryType,
    regions,
    onSave,
    isSaving
}: {
    product: Product | null;
    isOpen: boolean;
    onClose: () => void;
    categoryType: string;
    regions: Region[];
    onSave: (prices: { regionId: number; regionName: string; price: number }[]) => void;
    isSaving: boolean;
}) => {
    // Store price edits in a simple object: { [regionId]: "100.00" }
    const [priceMap, setPriceMap] = useState<Record<number, string>>({});

    // Filter regions by type
    const modalFilteredRegions = regions.filter(region => region.type === categoryType);

    // Initialize prices when modal opens or product changes
    useEffect(() => {
        if (isOpen && product) {
            const initialMap: Record<number, string> = {};
            modalFilteredRegions.forEach(region => {
                const existingPrice = product.prices?.find(p => p.regionId === region.id);
                initialMap[region.id] = existingPrice ? String(existingPrice.price) : "";
            });
            setPriceMap(initialMap);
        }
    }, [isOpen, product, regions, categoryType]); // Added dependencies

    const handleInputChange = useCallback((regionId: number, val: string) => {
        setPriceMap(prev => ({ ...prev, [regionId]: val }));
    }, []);

    const handleSave = () => {
        const priceArray = modalFilteredRegions.map(region => {
            const priceStr = priceMap[region.id];
            return {
                regionId: region.id,
                regionName: region.name,
                price: priceStr ? parseFloat(priceStr) : 0
            };
        });
        onSave(priceArray);
    };

    if (!product) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && !isSaving && onClose()}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        Manage Regional Prices
                    </DialogTitle>
                    <DialogDescription>
                        Set prices for {product.name} across different regions
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Product Info */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="font-semibold text-lg">{product.name}</h3>
                        <p className="text-gray-600">{product.category} • {product.type}</p>
                        {product.sku && <p className="text-sm text-gray-500">SKU: {product.sku}</p>}
                    </div>

                    {/* Regional Prices */}
                    <div className="space-y-3">
                        <h3 className="text-base font-semibold">Regional Prices</h3>
                        <div className="space-y-2">
                            {modalFilteredRegions.map((region) => (
                                <PriceInput 
                                    key={region.id} 
                                    regionId={region.id} 
                                    regionName={region.name} 
                                    initialValue={priceMap[region.id] || ""}
                                    onChange={handleInputChange}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button variant="outline" onClick={onClose} disabled={isSaving}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        style={{
                            backgroundColor: "#00007A",
                            color: "white"
                        }}
                    >
                        <Save className="h-4 w-4 mr-2" />
                        {isSaving ? 'Saving...' : 'Save Prices'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

// --- MAIN COMPONENT ---

export default function ShopPrices() {
    const axiosInstance = useAxiosWithAuth(import.meta.env.VITE_SERVER_URL);
    const [products, setProducts] = useState<Product[]>([]);
    const [regions, setRegions] = useState<Region[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("HARDWARE");
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [showPriceModal, setShowPriceModal] = useState(false);
    const [savingPrices, setSavingPrices] = useState(false);

    // Main category tabs with correct mapping
    const categories = [
        { id: "HARDWARE", label: "Hardware", type: "HARDWARE" },
        { id: "CUSTOM_PRODUCTS", label: "Custom Products", type: "FUNDI" },
        { id: "DESIGNS", label: "Designs", type: "PROFESSIONAL" },
        { id: "HIRE_MACHINERY", label: "Hire Machinery & E", type: "CONTRACTOR" }
    ];

    // Fetch products and regions from API
    const fetchData = async () => {
        try {
            setLoading(true);
            const [productsResponse, regionsResponse] = await Promise.all([
                getActiveProducts(axiosInstance),
                getAllRegions(axiosInstance)
            ]);
            
            if (productsResponse.success) {
                setProducts(productsResponse.hashSet);
            } else {
                toast.error("Failed to fetch products");
            }

            if (regionsResponse.success) {
                setRegions(regionsResponse.hashSet);
            } else {
                toast.error("Failed to fetch regions");
            }
        } catch (error) {
            console.error("Error fetching data:", error);
            toast.error("Failed to fetch data");
        } finally {
            setLoading(false);
        }
    };

    // Get the selected category type
    const selectedCategoryType = categories.find(cat => cat.id === selectedCategory)?.type || "HARDWARE";

    // Filter regions based on selected category type
    const filteredRegions = regions?.filter((region) => region.type === selectedCategoryType);

    // Filter products based on search term and category
    const filteredProducts = products?.filter((product) => {
        const matchesSearch =
            product?.name?.toLowerCase().includes(searchTerm?.toLowerCase()) ||
            (product?.sku?.toLowerCase() || "").includes(searchTerm?.toLowerCase()) ||
            (product?.bId?.toLowerCase() || "").includes(searchTerm?.toLowerCase()) ||
            (product?.category?.toLowerCase() || "").includes(searchTerm?.toLowerCase());

        const matchesCategory = product.type === selectedCategoryType;

        return matchesSearch && matchesCategory;
    });

    useEffect(() => {
        fetchData();
    }, []);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("en-KE", {
            style: "currency",
            currency: "KES"
        }).format(price);
    };

    // Handle edit prices
    const handleEditPrices = (product: Product) => {
        setSelectedProduct(product);
        setShowPriceModal(true);
    };

    // Save prices
    const handleSavePrices = async (priceData: Price[]) => {
        if (!selectedProduct) return;

        try {
            setSavingPrices(true);
            
            const payload = {
                productId: selectedProduct.id,
                prices: priceData.filter(price => price.price > 0) // Only save prices > 0
            };

            const response = await axiosInstance.put(
                `/api/products/${selectedProduct.id}`,
                payload
            );

            if (response.data.success) {
                toast.success("Prices updated successfully");
                setShowPriceModal(false);
                setSelectedProduct(null);
                setTimeout(() => {
                    fetchData();
                }, 300);
            } else {
                toast.error(response.data.message || "Failed to update prices");
            }
        } catch (error) {
            console.error("Error saving prices:", error);
            toast.error("Failed to save prices");
        } finally {
            setSavingPrices(false);
        }
    };

    // Get price for a specific region
    const getPriceForRegion = (product: Product, regionId: number) => {
        const price = product.prices?.find(p => p.regionId === regionId);
        return price ? formatPrice(price.price) : "-";
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Product Prices
                    </h1>
                    <p className="text-muted-foreground">
                        Manage regional pricing for all products.
                    </p>
                </div>
            </div>

            {/* Main Category Tabs */}
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                {categories.map((category) => (
                    <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                            selectedCategory === category.id
                                ? "bg-[#00007A] text-white"
                                : "bg-transparent text-black hover:bg-blue-50"
                        }`}
                    >
                        {category.label}
                    </button>
                ))}
            </div>

            {/* Search */}
            <div className="flex items-center space-x-2 bg-white border-none">
                <div className="relative flex-1 border-none">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by Name, SKU, BID, Category"
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Products Table */}
            <Card className="bg-white border-none shadow-md">
                <CardHeader>
                    <CardTitle>Product Pricing</CardTitle>
                    <CardDescription>
                        Manage regional pricing for {selectedCategory.toLowerCase()} products
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="text-muted-foreground">
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
                        <div className="rounded-md border border-gray-200 shadow-md p-6 overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-12">No</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead>Product Name</TableHead>
                                        {filteredRegions.map((region) => (
                                            <TableHead key={region.id}>{region.name}</TableHead>
                                        ))}
                                        <TableHead className="w-32">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredProducts?.map((product, index) => (
                                        <TableRow key={product.id}>
                                            <TableCell className="font-medium">
                                                {index + 1}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">
                                                    {product.category}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div>
                                                    <div className="font-medium">
                                                        {product.name}
                                                    </div>
                                                    {product.sku && (
                                                        <div className="text-sm text-muted-foreground">
                                                            SKU: {product.sku}
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            {filteredRegions.map((region) => (
                                                <TableCell key={region.id}>
                                                    <div className="text-sm">
                                                        {getPriceForRegion(product, region.id)}
                                                    </div>
                                                </TableCell>
                                            ))}
                                            <TableCell>
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleEditPrices(product)}
                                                    style={{
                                                        backgroundColor: "#00007A",
                                                        color: "white"
                                                    }}
                                                >
                                                    <Edit className="h-3 w-3 mr-1" />
                                                    Set Prices
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Price Management Modal */}
            <PriceModal
                product={selectedProduct}
                isOpen={showPriceModal}
                onClose={() => {
                    setShowPriceModal(false);
                    setSelectedProduct(null);
                }}
                categoryType={selectedCategoryType}
                regions={regions}
                onSave={handleSavePrices}
                isSaving={savingPrices}
            />
        </div>
    );
}