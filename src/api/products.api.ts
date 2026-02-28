/* eslint-disable @typescript-eslint/no-explicit-any */
import { getAuthHeaders } from "@/utils/auth";

const API_BASE_URL = `${import.meta.env.VITE_SERVER_URL}/api/products`;

// GET /api/products
export const getAllProducts = async (axiosInstance: any): Promise<any> => {
    try {
        const response = await axiosInstance.get(`${API_BASE_URL}`);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "Failed to fetch products");
    }
};

// POST /api/products
export const createProduct = async (axiosInstance: any, productData: any): Promise<any> => {
    try {
        const response = await axiosInstance.post(`${API_BASE_URL}/service-provider`, productData, {
            headers: {
                Authorization: getAuthHeaders()
            }
        });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "Failed to create product");
    }
};

export const createProductAdmin = async (axiosInstance: any, productData: any): Promise<any> => {
    try {
        const response = await axiosInstance.post(`${API_BASE_URL}/admin`, productData, {
            headers: {
                Authorization: getAuthHeaders()
            }
        });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "Failed to create product");
    }
};

// GET /api/products/seller
export const getProductsBySeller = async (axiosInstance: any): Promise<any> => {
    try {
        const response = await axiosInstance.get(`${API_BASE_URL}/seller`, {
            headers: {
                Authorization: getAuthHeaders()
            }
        });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "Failed to fetch seller products");
    }
};

// GET /api/products/active
export const getActiveProducts = async (axiosInstance: any): Promise<any> => {
    try {
        const response = await axiosInstance.get(`${API_BASE_URL}/active`);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "Failed to fetch active products");
    }
};

// GET /api/products/{id}
export const getProductById = async (axiosInstance: any, id: string | number): Promise<any> => {
    try {
        const response = await axiosInstance.get(`${API_BASE_URL}/${id}`);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "Failed to fetch product");
    }
};

// PUT /api/products/{id}
export const updateProduct = async (axiosInstance: any, id: string | number, productData: any): Promise<any> => {
    try {
        const response = await axiosInstance.put(`${API_BASE_URL}/${id}`, productData, {
            headers: {
                Authorization: getAuthHeaders()
            }
        });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "Failed to update product");
    }
};


export const getProductCategories = async (axiosInstance: any): Promise<any> => {
    try {
        const response = await axiosInstance.get(`${import.meta.env.VITE_SERVER_URL}/api/product_categories`, {
            headers: {
                Authorization: getAuthHeaders()
            }
        });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "Failed to fetch product categories");
    }
};

// DELETE /api/products/{id}
export const deleteProduct = async (axiosInstance: any, id: string | number): Promise<any> => {
    try {
        const response = await axiosInstance.delete(`${API_BASE_URL}/${id}`, {
            headers: {
                Authorization: getAuthHeaders()
            }
        });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "Failed to delete product");
    }
};

// PUT /api/products/{id}/approve
export const approveProduct = async (axiosInstance: any, id: string | number): Promise<any> => {
    try {
        const response = await axiosInstance.put(`${API_BASE_URL}/${id}/approve`, {}, {
            headers: {
                Authorization: getAuthHeaders()
            }
        });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "Failed to approve product");
    }
};