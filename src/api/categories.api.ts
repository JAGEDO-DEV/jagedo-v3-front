/* eslint-disable @typescript-eslint/no-explicit-any */
import { getAuthHeaders } from "@/utils/auth";

const API_BASE_URL = `${import.meta.env.VITE_SERVER_URL}/api/product_categories`;

// Types
export interface Category {
    id: number | string;
    name: string;
    active: boolean;
    subCategory?: string;
    urlKey?: string;
    metaTitle?: string;
    metaKeywords?: string;
    type?: string;
}

export interface CategoryCreateRequest {
    name: string;
    subCategory?: string;
    urlKey?: string;
    metaTitle?: string;
    metaKeywords?: string;
    type?: string;
}

export interface CategoryUpdateRequest {
    id: number | string;
    name: string;
    active: boolean;
    subCategory?: string;
    urlKey?: string;
    metaTitle?: string;
    metaKeywords?: string;
    type?: string;
}

export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
    status: string;
    hashSet?: any[];
}

// GET /api/product_categories
export const getAllCategories = async (axiosInstance: any): Promise<ApiResponse<Category[]>> => {
    try {
        const response = await axiosInstance.get(API_BASE_URL);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "Failed to fetch categories");
    }
};

// GET /api/product_categories/active
export const getActiveCategories = async (axiosInstance: any): Promise<ApiResponse<Category[]>> => {
    try {
        const response = await axiosInstance.get(`${API_BASE_URL}/active`);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "Failed to fetch active categories");
    }
};

// GET /api/product_categories/{id}
export const getCategoryById = async (axiosInstance: any, id: string | number): Promise<ApiResponse<Category>> => {
    try {
        const response = await axiosInstance.get(`${API_BASE_URL}/${id}`, {
            headers: {
                Authorization: getAuthHeaders()
            }
        });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "Failed to fetch category");
    }
};

// POST /api/product_categories
export const createCategory = async (axiosInstance: any, categoryData: CategoryCreateRequest): Promise<ApiResponse<Category>> => {
    try {
        const response = await axiosInstance.post(API_BASE_URL, categoryData, {
            headers: {
                Authorization: getAuthHeaders()
            }
        });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "Failed to create category");
    }
};

// PUT /api/product_categories/{id}
export const updateCategory = async (axiosInstance: any, id: string | number, categoryData: CategoryUpdateRequest): Promise<ApiResponse<Category>> => {
    try {
        const response = await axiosInstance.put(`${API_BASE_URL}/${id}`, categoryData, {
            headers: {
                Authorization: getAuthHeaders()
            }
        });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "Failed to update category");
    }
};

// PUT /api/product_categories/{id}/enable
export const enableCategory = async (axiosInstance: any, id: string | number): Promise<ApiResponse<Category>> => {
    try {
        const response = await axiosInstance.put(`${API_BASE_URL}/${id}`, { active: true }, {
            headers: {
                Authorization: getAuthHeaders()
            }
        });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "Failed to enable category");
    }
};

// Disable category
export const disableCategory = async (axiosInstance: any, id: string | number): Promise<ApiResponse<Category>> => {
    try {
        const response = await axiosInstance.put(`${API_BASE_URL}/${id}`, { active: false }, {
            headers: {
                Authorization: getAuthHeaders()
            }
        });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "Failed to disable category");
    }
};

// Toggle category status (enable/disable)
export const toggleCategoryStatus = async (axiosInstance: any, id: string | number, currentStatus: boolean): Promise<ApiResponse<Category>> => {
    try {
        const response = await axiosInstance.put(`${API_BASE_URL}/${id}`, { active: !currentStatus }, {
            headers: {
                Authorization: getAuthHeaders()
            }
        });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "Failed to toggle category status");
    }
};

// DELETE /api/product_categories/{id} (if available)
export const deleteCategory = async (axiosInstance: any, id: string | number): Promise<ApiResponse<any>> => {
    try {
        const response = await axiosInstance.delete(`${API_BASE_URL}/${id}`, {
            headers: {
                Authorization: getAuthHeaders()
            }
        });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "Failed to delete category");
    }
}; 