/* eslint-disable @typescript-eslint/ban-ts-comment */
//@ts-nocheck
import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { Filter, X } from "lucide-react";
import { cn } from "@/lib/utils";

import HeroSection from "@/components/shop/HeroSection";
import CategoryTabs from "@/components/shop/CategoryTabs";
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

const ITEMS_PER_PAGE = 12;
const INITIAL_FILTERS = ["All Products"];

const CATEGORIES_WITHOUT_LOCATION_FILTER = ['custom', 'designs'];

const CATEGORY_MAPPINGS: Record<string, string[]> = {
    hardware: ["Cement", "Pipes and Fittings", "Reinforcement Bars", "Steel", "Aluminum", "Glass", "HARDWARE"],
    custom: ["Custom Products", "Windows", "Doors", "Gates", "FUNDI"],
    equipment: ["Equipment", "Machinery", "Tools", "CONTRACTOR"],
    designs: ["Plans", "Designs", "PROFESSIONAL"],
};

const ShopApp = () => {
    const [activeCategory, setActiveCategory] = useState("hardware");
    const [selectedFilters, setSelectedFilters] = useState<string[]>(INITIAL_FILTERS);
    const [selectedLocationName, setSelectedLocationName] = useState<string | null>(null);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const navigate = useNavigate();
    const { data: products = [], isLoading, error } = useProducts();
    const { addToCart } = useCart();

    useEffect(() => {
        setSelectedFilters(INITIAL_FILTERS);
        setCurrentPage(1);
        if (!CATEGORIES_WITHOUT_LOCATION_FILTER.includes(activeCategory)) {
            setSelectedLocationName(null);
        }
    }, [activeCategory]);

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

    const handleLocationSelect = useCallback((locationName: string) => {
        setSelectedLocationName(locationName);
    }, []);

    const filteredProducts = useMemo(() => {
        if (!products.length) {
            return [];
        }

        const shouldApplyLocationFilter = !CATEGORIES_WITHOUT_LOCATION_FILTER.includes(activeCategory);

        if (shouldApplyLocationFilter && !selectedLocationName) {
            return [];
        }

        let baseProductList = products;

        if (shouldApplyLocationFilter) {
            baseProductList = products.filter(product => product.regionName === selectedLocationName);
        }

        const primaryCategoryFilters = CATEGORY_MAPPINGS[activeCategory] || [];
        const categoryFilteredProducts = baseProductList.filter(product => {
            const isCustom = product.custom;
            const matchesCategoryMapping = primaryCategoryFilters.some(cat =>
                product.type?.toLowerCase().includes(cat.toLowerCase())
            );

            // In the "custom" tab, show anything explicitly marked custom OR matching the "custom" mapping (like FUNDI)
            if (activeCategory === 'custom') {
                return isCustom || matchesCategoryMapping;
            }

            // For other tabs (hardware, equipment, designs), only show non-custom items that match the category type mapping
            if (shouldApplyLocationFilter) {
                return !isCustom && matchesCategoryMapping;
            }

            return matchesCategoryMapping;
        });

        const activeSidebarFilters = selectedFilters.filter(f => f !== "All Products");
        if (activeSidebarFilters.length > 0) {
            return categoryFilteredProducts.filter(product =>
                activeSidebarFilters.some(filter =>
                    product.type.toLowerCase().includes(filter.toLowerCase()) ||
                    product.name.toLowerCase().includes(filter.toLowerCase())
                )
            );
        }

        return categoryFilteredProducts;
    }, [products, activeCategory, selectedFilters, selectedLocationName]);

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

    const handleAddToCartAndNavigate = (product: Product) => {
        const result = addToCart(product);
        if (result.success) {
            toast.success(`${product.name} added to cart!`);
            navigate("/customer/cart");
        } else {
            toast.error(result.message);
        }
    };

    const handleGridAddToCartAndNavigate = (product: Product) => {
        const result = addToCart(product);
        if (result.success) {
            toast.success(`${product.name} added to cart!`);
        } else {
            toast.error(result.message);
        }
    };

    const handleBuyNow = (product: Product) => {
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
                    onClick={() => navigate(-1)}
                    className="text-jagedo-blue hover:underline flex items-center gap-1"
                >
                    ← Back
                </button>

            </div>
            <HeroSection />
            <div className="px-4">
                <CategoryTabs activeCategory={activeCategory} onCategoryChange={setActiveCategory} />
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
                    {!CATEGORIES_WITHOUT_LOCATION_FILTER.includes(activeCategory) && (
                        <LocationDropdown
                            selectedLocationName={selectedLocationName}
                            onSelectLocation={handleLocationSelect}
                        />
                    )}
                    <Sidebar
                        category={activeCategory}
                        filters={selectedFilters}
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