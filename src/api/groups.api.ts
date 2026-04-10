/* eslint-disable @typescript-eslint/no-explicit-any */
import { getAuthHeaders } from "@/utils/auth";

const API_BASE_URL = `${import.meta.env.VITE_SERVER_URL}/api/product_groups`;

// Types
export interface Group {
    id: number | string;
    name: string;
    active: boolean;
    subGroup?: string | (string | { id: string; name: string; urlKey?: string; metaTitle?: string; metaKeywords?: string })[];
    urlKey?: string;
    metaTitle?: string;
    metaKeywords?: string;
    type?: string;
}

export interface GroupCreateRequest {
    name: string;
    subGroup?: string | (string | { id: string; name: string; urlKey?: string; metaTitle?: string; metaKeywords?: string })[];
    urlKey?: string;
    metaTitle?: string;
    metaKeywords?: string;
    type?: string;
}

export interface GroupUpdateRequest {
    id: number | string;
    name: string;
    active: boolean;
    subGroup?: string | (string | { id: string; name: string; urlKey?: string; metaTitle?: string; metaKeywords?: string })[];
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

// GET /api/product_groups
export const getAllGroups = async (axiosInstance: any): Promise<ApiResponse<Group[]>> => {
    try {
        const response = await axiosInstance.get(API_BASE_URL);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "Failed to fetch groups");
    }
};

// GET /api/product_groups/active
export const getActiveGroups = async (axiosInstance: any): Promise<ApiResponse<Group[]>> => {
    try {
        const response = await axiosInstance.get(`${API_BASE_URL}/active`);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "Failed to fetch active groups");
    }
};

// GET /api/product_groups/{id}
export const getGroupById = async (axiosInstance: any, id: string | number): Promise<ApiResponse<Group>> => {
    try {
        const response = await axiosInstance.get(`${API_BASE_URL}/${id}`, {
            headers: {
                Authorization: getAuthHeaders()
            }
        });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "Failed to fetch group");
    }
};

// POST /api/product_groups
export const createGroup = async (axiosInstance: any, groupData: GroupCreateRequest): Promise<ApiResponse<Group>> => {
    try {
        const response = await axiosInstance.post(API_BASE_URL, groupData, {
            headers: {
                Authorization: getAuthHeaders()
            }
        });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "Failed to create group");
    }
};

// PUT /api/product_groups/{id}
export const updateGroup = async (axiosInstance: any, id: string | number, groupData: GroupUpdateRequest): Promise<ApiResponse<Group>> => {
    try {
        const response = await axiosInstance.put(`${API_BASE_URL}/${id}`, groupData, {
            headers: {
                Authorization: getAuthHeaders()
            }
        });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "Failed to update group");
    }
};

// PUT /api/product_groups/{id}/enable
export const enableGroup = async (axiosInstance: any, id: string | number): Promise<ApiResponse<Group>> => {
    try {
        const response = await axiosInstance.put(`${API_BASE_URL}/${id}`, { active: true }, {
            headers: {
                Authorization: getAuthHeaders()
            }
        });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "Failed to enable group");
    }
};

// Disable group
export const disableGroup = async (axiosInstance: any, id: string | number): Promise<ApiResponse<Group>> => {
    try {
        const response = await axiosInstance.put(`${API_BASE_URL}/${id}`, { active: false }, {
            headers: {
                Authorization: getAuthHeaders()
            }
        });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "Failed to disable group");
    }
};

// Toggle group status (enable/disable)
export const toggleGroupStatus = async (axiosInstance: any, id: string | number, currentStatus: boolean): Promise<ApiResponse<Group>> => {
    try {
        const response = await axiosInstance.put(`${API_BASE_URL}/${id}`, { active: !currentStatus }, {
            headers: {
                Authorization: getAuthHeaders()
            }
        });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "Failed to toggle group status");
    }
};

// DELETE /api/product_groups/{id} (if available)
export const deleteGroup = async (axiosInstance: any, id: string | number): Promise<ApiResponse<any>> => {
    try {
        const response = await axiosInstance.delete(`${API_BASE_URL}/${id}`, {
            headers: {
                Authorization: getAuthHeaders()
            }
        });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "Failed to delete group");
    }
};

/**
 * Dynamically fetches and extracts group names for a specific group type (e.g., HARDWARE).
 * This drives the sidebar filters using top-level group names.
 */
export const getActiveFilterOptionsByType = async (axiosInstance: any, type: string): Promise<string[]> => {
    try {
        const response = await getActiveGroups(axiosInstance);
        const groups = (response.data || response.hashSet || []) as Group[];
        
        // Filter groups by the specified type (e.g., HARDWARE, FUNDI, etc.)
        const filteredGroups = groups.filter(g => g.type === type);
        
        const filterNames = new Set<string>();
        filterNames.add("All Products"); // Standard first option

        filteredGroups.forEach(group => {
            // Include only the group name for filtering
            if (group.name) filterNames.add(group.name);
        });

        return Array.from(filterNames);
    } catch (error) {
        console.error("Error fetching filter options for type:", type, error);
        return ["All Products"];
    }
}; 