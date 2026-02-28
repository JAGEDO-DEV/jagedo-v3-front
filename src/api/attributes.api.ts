import { getAuthHeaders } from "@/utils/auth";

const API_BASE_URL = `${import.meta.env.VITE_SERVER_URL}/api/product_attributes`;

// Types
export interface Attribute {
  id: number | string;
  type: string;
  values: string;
  attributeGroup: string;
  categoryId?: number | string;
  filterable: boolean;
  active: boolean;
  customerView: boolean;
}

export interface AttributeCreateRequest {
  type: string;
  values: string;
  attributeGroup: string;
  productType?: string;
  categoryId?: number | string;
  filterable: boolean;
  active: boolean;
  customerView: boolean;
}

export interface AttributeUpdateRequest {
  id: number | string;
  type: string;
  values: string;
  attributeGroup: string;
  productType?: string;
  categoryId?: number | string;
  filterable: boolean;
  active: boolean;
  customerView: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  status: string;
  hashSet: unknown[];
}

// API Functions
export const getAllAttributes = async (axiosInstance: any): Promise<ApiResponse<Attribute[]>> => {
  try {
    const response = await axiosInstance.get(API_BASE_URL, {
      headers: {
        Authorization: getAuthHeaders()
      }
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to fetch attributes");
  }
};

export const getActiveAttributes = async (axiosInstance: any): Promise<ApiResponse<Attribute[]>> => {
  try {
    const response = await axiosInstance.get(`${API_BASE_URL}/active`, {
      headers: {
        Authorization: getAuthHeaders()
      }
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to fetch active attributes");
  }
};

export const getAttributeById = async (axiosInstance: any, id: string | number): Promise<ApiResponse<Attribute>> => {
  try {
    const response = await axiosInstance.get(`${API_BASE_URL}/${id}`, {
      headers: {
        Authorization: getAuthHeaders()
      }
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to fetch attribute");
  }
};

export const createAttribute = async (axiosInstance: any, data: AttributeCreateRequest): Promise<ApiResponse<Attribute>> => {
  try {
    const response = await axiosInstance.post(API_BASE_URL, data, {
      headers: {
        Authorization: getAuthHeaders()
      }
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to create attribute");
  }
};

export const updateAttribute = async (axiosInstance: any, id: string | number, data: AttributeUpdateRequest): Promise<ApiResponse<Attribute>> => {
  try {
    const response = await axiosInstance.put(`${API_BASE_URL}/${id}`, data, {
      headers: {
        Authorization: getAuthHeaders()
      }
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to update attribute");
  }
};

export const deleteAttribute = async (axiosInstance: any, id: string | number): Promise<ApiResponse<unknown>> => {
  try {
    const response = await axiosInstance.delete(`${API_BASE_URL}/${id}`, {
      headers: {
        Authorization: getAuthHeaders()
      }
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to delete attribute");
  }
};

export const enableAttribute = async (axiosInstance: any, id: string | number): Promise<ApiResponse<Attribute>> => {
  try {
    const response = await axiosInstance.put(`${API_BASE_URL}/${id}`, { active: true }, {
      headers: {
        Authorization: getAuthHeaders()
      }
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to enable attribute");
  }
};

export const disableAttribute = async (axiosInstance: any, id: string | number): Promise<ApiResponse<Attribute>> => {
  try {
    const response = await axiosInstance.put(`${API_BASE_URL}/${id}`, { active: false }, {
      headers: {
        Authorization: getAuthHeaders()
      }
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to disable attribute");
  }
};

export const toggleAttributeStatus = async (axiosInstance: any, id: string | number, currentStatus: boolean): Promise<ApiResponse<Attribute>> => {
  try {
    const response = await axiosInstance.put(`${API_BASE_URL}/${id}`, { active: !currentStatus }, {
      headers: {
        Authorization: getAuthHeaders()
      }
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to toggle attribute status");
  }
}; 