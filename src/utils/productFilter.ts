import { Product } from "@/hooks/useProducts";

interface ProductFilters {
    activeGroup: string;
    selectedLocationName: string | null;
    selectedSidebarFilters: string[];
    groupMappings: Record<string, string[]>;
    groupsWithoutLocationFilter: string[];
}

export const filterProducts = ({
    allProducts,
    filters,
}: {
    allProducts: Product[];
    filters: ProductFilters;
}): Product[] => {
    const {
        activeGroup,
        selectedLocationName,
        selectedSidebarFilters,
        groupMappings,
        groupsWithoutLocationFilter,
    } = filters;

    if (!allProducts.length) {
        return [];
    }

    
    const activeProducts = allProducts.filter(product => product.active === true);

    const shouldApplyLocationFilter = !groupsWithoutLocationFilter.includes(activeGroup);
    
    const allowedTypesForTab = groupMappings[activeGroup] || [];

    const groupFilteredProducts = activeProducts.filter(product => {
        
        const isCorrectType = allowedTypesForTab.some(type => 
            product.type?.trim().toLowerCase() === type.trim().toLowerCase()
        );

        if (!isCorrectType) return false;

        
        if (shouldApplyLocationFilter && selectedLocationName && selectedLocationName !== "All Regions") {
            return product.isLocationAgnostic || product.regionName === selectedLocationName;
        }

        return true;
    });


    const activeSidebarFilters = selectedSidebarFilters.filter(f => f.trim().toLowerCase() !== "all products");

    const sidebarFilteredProducts = activeSidebarFilters.length > 0
        ? groupFilteredProducts.filter(product =>
            activeSidebarFilters.some(filter =>
                product.group?.trim().toLowerCase() === filter.trim().toLowerCase() ||
                product.subGroup?.trim().toLowerCase() === filter.trim().toLowerCase() ||
                product.name?.trim().toLowerCase().includes(filter.trim().toLowerCase())
            )
        )
        : groupFilteredProducts;

    const hasSelectedLocation = !!selectedLocationName && selectedLocationName !== "All Regions";
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
                isPriceSet: minPrice > 0,
                showFromPrice: true,
                isAggregated: true,
                regionName: undefined,
            };
        });
    }

    return sidebarFilteredProducts;
};
