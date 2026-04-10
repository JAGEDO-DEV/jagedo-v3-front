import { useQuery } from "@tanstack/react-query";
import type { AxiosInstance } from "axios";
import { getAllProducts } from "@/api/products.api";
import useAxiosWithAuth from "@/utils/axiosInterceptor";
import axios from "axios";

const publicAxios = axios.create({
    baseURL: import.meta.env.VITE_SERVER_URL
});


interface ApiPriceEntry {
    regionId: number | string;
    regionName: string;
    price: number;
}

interface RawApiProduct {
    id: number | string;
    name: string;
    description: string | null;
    type: string;
    group: string;
    subGroup: string | null;
    images: string[] | null;
    prices: ApiPriceEntry[] | null;
    custom: boolean;
    customPrice: number | null;
    material: string | null;
    size: string | null;
    color: string | null;
    sku: string | null;
    bId: string | null;
    uom: string | null;
    active: boolean;
    basePrice: number | null;
}

export interface Product {
    id: string;
    productId: number | string;
    name: string;
    description?: string;
    type: string;
    group: string;
    subGroup?: string;
    price: number;
    isPriceSet: boolean;
    showFromPrice?: boolean;
    isAggregated?: boolean;
    custom: boolean;
    regionName?: string;
    images: string[];
    active: boolean;
    isLocationAgnostic?: boolean;
    specifications: {
        material?: string;
        size?: string;
        color?: string;
        sku?: string;
        bid?: string;
        uom?: string;
    };
}


const transformAndFlattenProducts = (rawProducts: RawApiProduct[]): Product[] => {
    return rawProducts.flatMap((rawProduct): Product[] => {
        const baseProductData = {
            productId: rawProduct.id,
            name: rawProduct.name,
            description: rawProduct.description ?? undefined,
            type: rawProduct.type,
            group: rawProduct.group,
            subGroup: rawProduct.subGroup ?? undefined,
            images: rawProduct.images || [],
            active: rawProduct.active,
            specifications: {
                material: rawProduct.material ?? undefined,
                size: rawProduct.size ?? undefined,
                color: rawProduct.color ?? undefined,
                sku: rawProduct.sku ?? undefined,
                bid: rawProduct.bId ?? undefined,
                uom: rawProduct.uom ?? undefined,
            },
        };

        
        if (rawProduct.prices && rawProduct.prices.length > 0) {
            return rawProduct.prices.map(priceEntry => ({
                ...baseProductData,
                id: `${rawProduct.id}-${priceEntry.regionId}`,
                price: priceEntry.price,
                isPriceSet: priceEntry.price > 0,
                custom: rawProduct.custom,
                regionName: priceEntry.regionName,
            }));
        }

        const fallbackPrice = rawProduct.customPrice ?? rawProduct.basePrice ?? 0;
        const isPriceSet = (rawProduct.customPrice !== null && rawProduct.customPrice > 0) || 
                          (rawProduct.basePrice !== null && rawProduct.basePrice > 0);

        return [{
            ...baseProductData,
            id: `${rawProduct.id}-base`,
            price: fallbackPrice,
            isPriceSet: isPriceSet,
            custom: rawProduct.custom,
            regionName: "Universal",
            isLocationAgnostic: true,
        }];
    });
};


const fetchProducts = async (): Promise<Product[]> => {
    try {
        const response = await getAllProducts(publicAxios);
        const data = response.data || response.hashSet;

        if (!response.success || !Array.isArray(data)) {
            throw new Error(response.message || "Failed to fetch products: Invalid API response format");
        }

        const rawProducts: RawApiProduct[] = data;
        return transformAndFlattenProducts(rawProducts);

    } catch (error) {
        console.error("Error fetching or transforming products:", error);
        throw error;
    }
};


export const useProducts = () => {
    return useQuery<Product[]>({
        queryKey: ["products"] as const,
        queryFn: () => fetchProducts(),
        staleTime: 5 * 60 * 1000,
    });
};
