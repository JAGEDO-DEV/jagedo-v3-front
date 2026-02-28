import { getAuthHeaders } from "@/utils/auth";

const API_BASE_URL = `${import.meta.env.VITE_SERVER_URL}/api/regions`;

// Types
export interface Region {
  id: number;
  country: string;
  name: string;
  active: boolean;
  customerView: boolean;
  filterable: boolean;
}

export interface RegionCreateRequest {
  country: string;
  name: string;
  active: boolean;
  customerView: boolean;
  filterable: boolean;
}

export interface RegionUpdateRequest {
  id: number;
  country: string;
  name: string;
  active: boolean;
  customerView: boolean;
  filterable: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  status: string;
  hashSet: unknown[];
}

// API Functions
export const getAllRegions = async (axiosInstance: any): Promise<ApiResponse<Region[]>> => {
  try {
    const response = await axiosInstance.get(API_BASE_URL);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to fetch regions");
  }
};

export const getActiveRegions = async (axiosInstance: any): Promise<ApiResponse<Region[]>> => {
  try {
    const response = await axiosInstance.get(`${API_BASE_URL}/customers`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to fetch active regions");
  }
};

export const getRegionById = async (axiosInstance: any, id: string | number): Promise<ApiResponse<Region>> => {
  try {
    const response = await axiosInstance.get(`${API_BASE_URL}/${id}`, {
      headers: {
        Authorization: getAuthHeaders()
      }
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to fetch region");
  }
};

export const createRegion = async (axiosInstance: any, data: RegionCreateRequest): Promise<ApiResponse<Region>> => {
  try {
    const response = await axiosInstance.post(API_BASE_URL, data, {
      headers: {
        Authorization: getAuthHeaders()
      }
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to create region");
  }
};

export const updateRegion = async (axiosInstance: any, id: string | number, data: RegionUpdateRequest): Promise<ApiResponse<Region>> => {
  try {
    const response = await axiosInstance.put(`${API_BASE_URL}/${id}`, data, {
      headers: {
        Authorization: getAuthHeaders()
      }
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to update region");
  }
};

export const deleteRegion = async (axiosInstance: any, id: string | number): Promise<ApiResponse<unknown>> => {
  try {
    const response = await axiosInstance.delete(`${API_BASE_URL}/${id}`, {
      headers: {
        Authorization: getAuthHeaders()
      }
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to delete region");
  }
};

export const enableRegion = async (axiosInstance: any, id: string | number): Promise<ApiResponse<Region>> => {
  try {
    const response = await axiosInstance.put(`${API_BASE_URL}/${id}/enable`, {}, {
      headers: {
        Authorization: getAuthHeaders()
      }
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to enable region");
  }
};

export const disableRegion = async (axiosInstance: any, id: string | number): Promise<ApiResponse<Region>> => {
  try {
    const response = await axiosInstance.put(`${API_BASE_URL}/${id}`, {
      id,
      country: '',
      name: '',
      active: false,
      customerView: false,
      filterable: false
    }, {
      headers: {
        Authorization: getAuthHeaders()
      }
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to disable region");
  }
};

export const toggleRegionStatus = async (axiosInstance: any, id: string | number, currentStatus: boolean): Promise<ApiResponse<Region>> => {
  if (currentStatus) {
    return disableRegion(axiosInstance, id);
  } else {
    return enableRegion(axiosInstance, id);
  }
}; 