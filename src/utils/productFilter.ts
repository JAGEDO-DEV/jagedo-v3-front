import { Product } from "@/hooks/useProducts";

interface ProductFilters {
    activeCategory: string;
    selectedLocationName: string | null;
    selectedSidebarFilters: string[];
    categoryMappings: Record<string, string[]>;
    categoriesWithoutLocationFilter: string[];
}

export const filterProducts = ({
    allProducts,
    filters,
}: {
    allProducts: Product[];
    filters: ProductFilters;
}): Product[] => {
    const {
        activeCategory,
        selectedLocationName,
        selectedSidebarFilters,
        categoryMappings,
        categoriesWithoutLocationFilter,
    } = filters;

    if (!allProducts.length) {
        return [];
    }

    // Filter for active products only (Redundant if useProducts handles it, but safe to keep)
    const activeProducts = allProducts.filter(product => product.active === true);

    const shouldApplyLocationFilter = !categoriesWithoutLocationFilter.includes(activeCategory);
    // These are now strictly Types (e.g., ["HARDWARE"])
    const allowedTypesForTab = categoryMappings[activeCategory] || [];

    const categoryFilteredProducts = activeProducts.filter(product => {
        // Strict check: The product TYPE must match one of the allowed types for this tab.
        const isCorrectType = allowedTypesForTab.some(type => 
            product.type.toLowerCase() === type.toLowerCase()
        );

        if (!isCorrectType) return false;

        // Only apply location filter if a specific region is selected (not "All Regions")
        if (shouldApplyLocationFilter && selectedLocationName && selectedLocationName !== "All Regions") {
            return product.isLocationAgnostic || product.regionName === selectedLocationName;
        }

        return true;
    });


    const activeSidebarFilters = selectedSidebarFilters.filter(f => f !== "All Products");

    if (activeSidebarFilters.length > 0) {
        return categoryFilteredProducts.filter(product =>
            activeSidebarFilters.every(filter =>
                product.category?.toLowerCase() === filter.toLowerCase() ||
                product.name.toLowerCase().includes(filter.toLowerCase())
            )
        );
    }

    return categoryFilteredProducts;
};