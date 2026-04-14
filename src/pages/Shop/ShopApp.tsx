/* eslint-disable @typescript-eslint/ban-ts-comment */
//@ts-nocheck
import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { Filter, X } from "lucide-react";
import { cn } from "@/lib/utils";
import ShopSlider from "@/components/shop/ShopSlider";
import HeroSection from "@/components/shop/HeroSection";
import GroupTabs from "@/components/shop/GroupTabs";
import LocationDropdown from "@/components/shop/LocationDropdown";
import Sidebar from "@/components/shop/SideBar";
import { DashboardHeader } from "@/components/DashboardHeader";
import ProductGrid from "@/components/shop/ProductGrid";
import ProductCard from "@/components/shop/ProductCard";
import Loader from "@/components/Loader";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";

import { useProducts, Product } from "@/hooks/useProducts";
import { useCart } from "@/context/CartContext";
import useAxiosWithAuth from "@/utils/axiosInterceptor";
import { getActiveFilterOptionsByType } from "@/api/groups.api";

const ITEMS_PER_PAGE = 12;
const INITIAL_FILTERS = ["All Products"];

const GROUPS_WITHOUT_LOCATION_FILTER: string[] = [];

const GROUP_MAPPINGS: Record<string, string[]> = {
    hardware: ["Cement", "Pipes and Fittings", "Reinforcement Bars", "Steel", "Aluminum", "Glass", "HARDWARE"],
    custom: ["Custom Products", "Windows", "Doors", "Gates", "FUNDI"],
    equipment: ["Equipment", "Machinery", "Tools", "CONTRACTOR"],
    designs: ["Plans", "Designs", "PROFESSIONAL"],
};

const LOCATION_GROUP_TYPES: Record<string, string[]> = {
    hardware: ["HARDWARE"],
    custom: ["FUNDI"],
    equipment: ["CONTRACTOR"],
    designs: ["PROFESSIONAL"],
};

const ShopApp = () => {
    const [activeGroup, setActiveGroup] = useState("hardware");
    const [selectedFilters, setSelectedFilters] = useState<string[]>(INITIAL_FILTERS);
    const [selectedLocationName, setSelectedLocationName] = useState<string | null>(null);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const navigate = useNavigate();
    const axiosInstance = useAxiosWithAuth(import.meta.env.VITE_SERVER_URL);
    const { data: products = [], isLoading, error } = useProducts();
    const { addToCart } = useCart();

    const [filterOptions, setFilterOptions] = useState<string[]>(INITIAL_FILTERS);

    const locationGroupTypes = useMemo(
        () => LOCATION_GROUP_TYPES[activeGroup] || [],
        [activeGroup]
    );

    useEffect(() => {
        setSelectedFilters(INITIAL_FILTERS);
        setCurrentPage(1);
        if (!GROUPS_WITHOUT_LOCATION_FILTER.includes(activeGroup)) {
            setSelectedLocationName(null);
        }
    }, [activeGroup]);

    useEffect(() => {
        setCurrentPage(1);
    }, [selectedFilters, selectedLocationName]);

    useEffect(() => {
        if (isSidebarOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [isSidebarOpen]);

    useEffect(() => {
        if (!selectedProduct?.isAggregated || !selectedLocationName) return;
        const match = products.find(
            product => product.productId === selectedProduct.productId && product.regionName === selectedLocationName
        );
        if (match) {
            setSelectedProduct(match);
        }
    }, [selectedLocationName, products, selectedProduct]);

    const handleLocationSelect = useCallback((locationName: string | null) => {
        setSelectedLocationName(locationName);
    }, []);

    useEffect(() => {
        const fetchDynamicFilters = async () => {
            try {
                const type = LOCATION_GROUP_TYPES[activeGroup]?.[0] || "HARDWARE";
                const options = await getActiveFilterOptionsByType(axiosInstance, type);
                setFilterOptions(options);
            } catch (err) {
                console.error("Failed to load dynamic filters:", err);
                setFilterOptions(INITIAL_FILTERS);
            }
        };
        fetchDynamicFilters();
    }, [activeGroup, axiosInstance]);

    const filteredProducts = useMemo(() => {
        if (!products.length) {
            return [];
        }

        const shouldApplyLocationFilter = !GROUPS_WITHOUT_LOCATION_FILTER.includes(activeGroup);
        const hasSelectedLocation = !!selectedLocationName;

        let baseProductList = products;

        if (shouldApplyLocationFilter && selectedLocationName) {
            baseProductList = products.filter(product => product.regionName === selectedLocationName);
        }

        const primaryGroupFilters = GROUP_MAPPINGS[activeGroup] || [];
        const groupFilteredProducts = baseProductList.filter(product => {
            const isCustom = product.custom;
            const matchesGroupMapping = primaryGroupFilters.some(cat =>
                product.type?.toLowerCase().includes(cat.toLowerCase())
            );

            
            if (activeGroup === 'custom') {
                return isCustom || matchesGroupMapping;
            }

            
            if (shouldApplyLocationFilter) {
                return !isCustom && matchesGroupMapping;
            }

            return matchesGroupMapping;
        });

        const activeSidebarFilters = selectedFilters.filter(f => f !== "All Products");
        const sidebarFilteredProducts = activeSidebarFilters.length > 0
            ? groupFilteredProducts.filter(product =>
                activeSidebarFilters.some(filter =>
                    product.type.toLowerCase().includes(filter.toLowerCase()) ||
                    product.name.toLowerCase().includes(filter.toLowerCase())
                )
            )
            : groupFilteredProducts;

        if (!hasSelectedLocation) {
            const grouped = new Map<string, { base: Product; minPrice: number; count: number }>();
            sidebarFilteredProducts.forEach((product) => {
                const key = String(product.productId ?? product.id);
                const entry = grouped.get(key);
                if (!entry) {
                    grouped.set(key, { base: product, minPrice: product.price, count: 1 });
                } else {
                    entry.minPrice = Math.min(entry.minPrice, product.price);
                    entry.count += 1;
                }
            });

            return Array.from(grouped.values()).map(({ base, minPrice, count }) => {
                if (count === 1) {
                    return base;
                }
                return {
                    ...base,
                    id: `${base.productId}-all`,
                    price: minPrice,
                    showFromPrice: true,
                    isAggregated: true,
                    regionName: undefined,
                };
            });
        }

        return sidebarFilteredProducts;
    }, [products, activeGroup, selectedFilters, selectedLocationName]);

    const paginatedProducts = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredProducts, currentPage]);

    const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);

    const handleFilterChange = (filter: string, isChecked: boolean) => {
        if (filter === "All Products" && isChecked) {
            setSelectedFilters(INITIAL_FILTERS);
            return;
        }

        setSelectedFilters(currentFilters => {
            const otherFilters = currentFilters.filter(f => f !== "All Products");
            const newFilters = isChecked
                ? [...otherFilters, filter]
                : otherFilters.filter(f => f !== filter);

            return newFilters.length === 0 ? INITIAL_FILTERS : newFilters;
        });
    };

    const handlePageChange = (e: React.MouseEvent, page: number) => {
        e.preventDefault();
        setCurrentPage(page);
    };

    const handleProductClick = (product: Product) => setSelectedProduct(product);
    const handleBackToGrid = () => setSelectedProduct(null);

    const ensureCanPurchase = (product: Product) => {
        if (!product.isPriceSet) {
            toast.error("Price not set for this product.");
            return false;
        }
        if (!selectedLocationName && product.isAggregated) {
            toast.error("Please select a location to see the exact price.");
            return false;
        }
        return true;
    };

    const handleAddToCartAndNavigate = (product: Product) => {
        if (!ensureCanPurchase(product)) return;
        const result = addToCart(product);
        if (result.success) {
            toast.success(`${product.name} added to cart!`);
            navigate("/customer/cart");
        } else {
            toast.error(result.message);
        }
    };

    const handleGridAddToCartAndNavigate = (product: Product) => {
        if (!ensureCanPurchase(product)) return;
        const result = addToCart(product);
        if (result.success) {
            toast.success(`${product.name} added to cart!`);
            navigate("/customer/cart");
        } else {
            toast.error(result.message);
        }
    };

    const handleBuyNow = (product: Product) => {
        if (!ensureCanPurchase(product)) return;

        const token = localStorage.getItem("token");
        const userStr = localStorage.getItem("user");
        let user = null;
        try {
            user = userStr ? JSON.parse(userStr) : null;
        } catch {
            user = null;
        }

        if (!token || !user) {
            navigate("/login", { state: { from: "/customer/checkout" } });
            return;
        }

        const role = (user.userType || user.role || "").toString().toUpperCase();
        if (role !== "CUSTOMER") {
            navigate("/login", { state: { from: "/customer/checkout" } });
            return;
        }

        const result = addToCart(product);
        if (result.success) {
            toast.success(`Proceeding to checkout for ${product.name}`);
            navigate("/customer/checkout");
        } else {
            toast.error(result.message);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center text-center">
                <div>
                    <h2 className="text-2xl font-bold text-destructive mb-2">Error Loading Products</h2>
                    <p className="text-muted-foreground">We couldn't load the products. Please try again later.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            <DashboardHeader />
            <div className="p-4">
                <button
                    onClick={() => {
                        const token = localStorage.getItem("token");
                        if (token) {
                            navigate('/dashboard/customer');
                        } else {
                            navigate(-1);
                        }
                    }}
                    className="text-jagedo-blue hover:underline flex items-center gap-1"
                >
                    ← Back
                </button>

            </div>
            <HeroSection />
            <div className="py-4">
                <ShopSlider />
            </div>
            <div className="px-4">
                <GroupTabs activeGroup={activeGroup} onGroupChange={setActiveGroup} />
            </div>

            <div className="px-4 pt-4 md:hidden">
                <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 border rounded-md text-sm font-medium hover:bg-gray-50"
                >
                    <Filter className="h-4 w-4" />
                    <span>Filters & Location</span>
                </button>
            </div>

            <div className="flex">
                {isSidebarOpen && (
                    <div
                        onClick={() => setIsSidebarOpen(false)}
                        className="fixed inset-0 bg-black/60 z-30 md:hidden"
                        aria-hidden="true"
                    />
                )}

                <aside className={cn(
                    "fixed top-0 left-0 h-full w-80 bg-white p-6 border-r z-40 transform transition-transform duration-300 ease-in-out",
                    "md:sticky md:top-0 md:translate-x-0 md:border-none md:z-auto",
                    isSidebarOpen ? "translate-x-0" : "-translate-x-full"
                )}>
                    <div className="flex justify-end md:hidden mb-4">
                        <button onClick={() => setIsSidebarOpen(false)} className="p-2 -mr-2">
                            <X className="h-6 w-6" />
                        </button>
                    </div>
                    {!GROUPS_WITHOUT_LOCATION_FILTER.includes(activeGroup) && (
                        <LocationDropdown
                            selectedLocationName={selectedLocationName}
                            onSelectLocation={handleLocationSelect}
                            groupTypes={locationGroupTypes}
                        />
                    )}
                    <Sidebar
                        group={activeGroup}
                        filters={selectedFilters}
                        filterOptions={filterOptions}
                        onFilterChange={handleFilterChange}
                    />
                </aside>

                <main className="flex-1 bg-white p-6">
                    {selectedProduct ? (
                        <div>
                            <button onClick={handleBackToGrid} className="mb-6 text-jagedo-blue hover:underline">
                                ← Back to products
                            </button>
                            <ProductCard
                                product={selectedProduct}
                                isDetailView={true}
                                onProductClick={() => { }}
                                onAddToCart={() => handleAddToCartAndNavigate(selectedProduct!)}
                                onBuyNow={() => handleBuyNow(selectedProduct!)}
                            />
                        </div>
                    ) : (
                        <>
                            <ProductGrid
                                products={paginatedProducts}
                                onProductClick={handleProductClick}
                                onAddToCart={handleGridAddToCartAndNavigate}
                            />

                            {paginatedProducts.length === 0 && (
                                <div className="text-center py-12">
                                    <p className="text-muted-foreground">No products found for the selected filters.</p>
                                </div>
                            )}

                            {totalPages > 1 && (
                                <div className="flex justify-center py-8">
                                    <Pagination>
                                        <PaginationContent>
                                            <PaginationItem>
                                                <PaginationPrevious
                                                    href="#"
                                                    onClick={(e) => handlePageChange(e, Math.max(currentPage - 1, 1))}
                                                    className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                                                />
                                            </PaginationItem>
                                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                                <PaginationItem key={page}>
                                                    <PaginationLink
                                                        href="#"
                                                        onClick={(e) => handlePageChange(e, page)}
                                                        isActive={currentPage === page}
                                                    >
                                                        {page}
                                                    </PaginationLink>
                                                </PaginationItem>
                                            ))}
                                            <PaginationItem>
                                                <PaginationNext
                                                    href="#"
                                                    onClick={(e) => handlePageChange(e, Math.min(currentPage + 1, totalPages))}
                                                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                                                />
                                            </PaginationItem>
                                        </PaginationContent>
                                    </Pagination>
                                </div>
                            )}
                        </>
                    )}
                </main>
            </div>
        </div>
    );
};

export default ShopApp;
