/* eslint-disable @typescript-eslint/ban-ts-comment */
//@ts-nocheck
import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { Filter, X, ChevronLeft, ChevronRight } from "lucide-react"; // Added icons
import { cn } from "@/lib/utils";
import { filterProducts } from "@/utils/productFilter";

import HeroSection from "@/components/shop/HeroSection";
import CategoryTabs from "@/components/shop/CategoryTabs";
import LocationDropdown from "@/components/shop/LocationDropdown";
import Sidebar from "@/components/shop/SideBar";
import ProductGrid from "@/components/shop/ProductGrid";
import ProductCard from "@/components/shop/ProductCard";
import Loader from "@/components/Loader";

import { useProducts, Product } from "@/hooks/useProducts";
import { useCart } from "@/context/CartContext";

const INITIAL_FILTERS = ["All Products"];
const CATEGORIES_WITHOUT_LOCATION_FILTER: string[] = [];

const CATEGORY_MAPPINGS: Record<string, string[]> = {
    hardware: ["HARDWARE"],
    custom: ["FUNDI"],
    equipment: ["CONTRACTOR"],
    designs: ["PROFESSIONAL"],
};

const ShopApp = () => {
    const [activeCategory, setActiveCategory] = useState("hardware");
    const [selectedFilters, setSelectedFilters] = useState<string[]>(INITIAL_FILTERS);
    const [selectedLocationName, setSelectedLocationName] = useState<string | null>(null);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // PAGINATION STATES
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(12); // Moved to state to allow changing

    const navigate = useNavigate();
    const { data: products = [], isLoading, error } = useProducts();
    const { addToCart } = useCart();

    const categoryTypes = useMemo(() => CATEGORY_MAPPINGS[activeCategory] || [], [activeCategory]);

    useEffect(() => {
        setSelectedFilters(INITIAL_FILTERS);
        setCurrentPage(1);
        setSelectedProduct(null);
        if (!CATEGORIES_WITHOUT_LOCATION_FILTER.includes(activeCategory)) {
            setSelectedLocationName(null);
        }
    }, [activeCategory]);

    useEffect(() => {
        setCurrentPage(1);
    }, [selectedFilters, selectedLocationName, itemsPerPage]);

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

    const filteredProducts = useMemo(() => {
        return filterProducts({
            allProducts: products,
            filters: {
                activeCategory,
                selectedLocationName,
                selectedSidebarFilters: selectedFilters,
                categoryMappings: CATEGORY_MAPPINGS,
                categoriesWithoutLocationFilter: CATEGORIES_WITHOUT_LOCATION_FILTER,
            },
        });
    }, [products, activeCategory, selectedFilters, selectedLocationName]);

    const paginatedProducts = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredProducts.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredProducts, currentPage, itemsPerPage]);

    const totalPages = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage));

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleFilterChange = (filter: string, isChecked: boolean) => {
        if (filter === "All Products" && isChecked) {
            setSelectedFilters(INITIAL_FILTERS);
            return;
        }
        setSelectedFilters(currentFilters => {
            const otherFilters = currentFilters.filter(f => f !== "All Products");
            const newFilters = isChecked ? [...otherFilters, filter] : otherFilters.filter(f => f !== filter);
            return newFilters.length === 0 ? INITIAL_FILTERS : newFilters;
        });
    };

    const handleProductClick = (product: Product) => setSelectedProduct(product);
    const handleBackToGrid = () => setSelectedProduct(null);

    const ensureLocationSelected = (product: Product) => {
        if (!selectedLocationName && product.isAggregated) {
            toast.error("Please select a location to see the exact price.");
            return false;
        }
        return true;
    };

    const handleAddToCartAndNavigate = (product: Product) => {
        if (!ensureLocationSelected(product)) return;
        const result = addToCart(product);
        if (result.success) {
            toast.success(`${product.name} added to cart!`);
            navigate("/customer/cart");
        } else {
            toast.error(result.message);
        }
    };

    const handleGridAddToCartAndNavigate = (product: Product) => {
        if (!ensureLocationSelected(product)) return;
        const result = addToCart(product);
        if (result.success) toast.success(`${product.name} added to cart!`);
        else toast.error(result.message);
    };

    const handleBuyNow = (product: Product) => {
        if (!ensureLocationSelected(product)) return;
        const result = addToCart(product);
        if (result.success) {
            toast.success(`Proceeding to checkout for ${product.name}`);
            navigate("/customer/checkout");
        } else {
            toast.error(result.message);
        }
    };

    if (isLoading) return <div className="flex justify-center items-center h-screen"><Loader /></div>;
    if (error) return <div className="min-h-screen flex items-center justify-center">Error loading products.</div>;

    return (
        <div className="min-h-screen">
            <HeroSection />
            <div className="px-4">
                <CategoryTabs activeCategory={activeCategory} onCategoryChange={setActiveCategory} />
            </div>

            <div className="flex flex-col md:flex-row min-h-screen">
                <aside className={cn(
                    "fixed top-0 left-0 h-full w-80 bg-white p-6 border-r z-40 transform transition-transform duration-300 md:sticky md:top-0 md:translate-x-0 md:border-none",
                    isSidebarOpen ? "translate-x-0" : "-translate-x-full"
                )}>
                    <div className="flex justify-end md:hidden mb-4">
                        <button onClick={() => setIsSidebarOpen(false)}><X className="h-6 w-6" /></button>
                    </div>
                    {!CATEGORIES_WITHOUT_LOCATION_FILTER.includes(activeCategory) && (
                        <LocationDropdown
                            selectedLocationName={selectedLocationName}
                            onSelectLocation={handleLocationSelect}
                            categoryTypes={categoryTypes}
                        />
                    )}
                    <Sidebar category={activeCategory} filters={selectedFilters} onFilterChange={handleFilterChange} products={products} />
                </aside>

                <main className="flex-1 bg-white p-6 flex flex-col">
                    {selectedProduct ? (
                        <div>
                            <button onClick={handleBackToGrid} className="mb-6 text-jagedo-blue hover:underline">← Back to products</button>
                            <ProductCard product={selectedProduct} isDetailView={true} onProductClick={() => { }} onAddToCart={() => handleAddToCartAndNavigate(selectedProduct!)} onBuyNow={() => handleBuyNow(selectedProduct!)} />
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col">
                            <ProductGrid products={paginatedProducts} onProductClick={handleProductClick} onAddToCart={handleGridAddToCartAndNavigate} />

                            {paginatedProducts.length === 0 && (
                                <div className="text-center py-12 text-muted-foreground">No products found.</div>
                            )}

                            {/* CUSTOM PAGINATION UI (MIMICKING YOUR IMAGE) */}
                            <div className="mt-12 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">

                                {/* Left Side: Products per page */}
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-medium text-[#2F2F2F]">
                                        Products per page:
                                    </span>

                                    <select
                                        value={itemsPerPage}
                                        onChange={(e) => setItemsPerPage(Number(e.target.value))}
                                        className="border border-[#C9D6FF] rounded-md px-2 py-1 text-sm bg-white
                 focus:outline-none focus:ring-1 focus:ring-[#3B0A8F]"
                                    >
                                        <option value={8}>8</option>
                                        <option value={12}>12</option>
                                        <option value={24}>24</option>
                                        <option value={48}>48</option>
                                    </select>
                                </div>

                                {/* Right Side: Navigation */}
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className={cn(
                                            "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                                            currentPage === 1
                                                ? "bg-[#F1F3FF] text-[#9CA3AF] cursor-not-allowed"
                                                : "bg-[#D6E0FF] text-[#2F2F2F] hover:bg-[#C9D6FF]"
                                        )}
                                    >
                                        Prev
                                    </button>

                                    <span className="text-sm font-medium text-[#2F2F2F]">
                                        Page {currentPage} of {totalPages}
                                    </span>

                                    <button
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className={cn(
                                            "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                                            currentPage === totalPages
                                                ? "bg-[#E5E7EB] text-[#9CA3AF] cursor-not-allowed"
                                                : "bg-[#3B0A8F] text-white hover:opacity-90"
                                        )}
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default ShopApp;
