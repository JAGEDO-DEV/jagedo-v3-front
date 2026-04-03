import { getAuthHeaders } from "@/utils/auth";

const BASE_URL = `${import.meta.env.VITE_SERVER_URL}/api/master-data`;

export const getMasterDataValues = async (axiosInstance: any, typeCode: string) => {
  const response = await axiosInstance.get(`${BASE_URL}/values/${typeCode}`, {
    headers: { Authorization: getAuthHeaders() },
  });
  return response.data;
};

export const getMasterDataTypes = async (axiosInstance: any) => {
  const response = await axiosInstance.get(`${BASE_URL}/types`, {
    headers: { Authorization: getAuthHeaders() },
  });
  return response.data;
};

export const createMasterDataType = async (axiosInstance: any, data: { code: string; name: string; description?: string }) => {
  const response = await axiosInstance.post(`${BASE_URL}/types`, data, {
    headers: { Authorization: getAuthHeaders() },
  });
  return response.data;
};

export const updateMasterDataType = async (axiosInstance: any, id: number, data: { name?: string; description?: string; isActive?: boolean }) => {
  const response = await axiosInstance.patch(`${BASE_URL}/types/${id}`, data, {
    headers: { Authorization: getAuthHeaders() },
  });
  return response.data;
};

export const createMasterDataValue = async (
  axiosInstance: any,
  data: { typeCode: string; code?: string; name: string; description?: string; sortOrder?: number; metadata?: any }
) => {
  const response = await axiosInstance.post(`${BASE_URL}/values`, data, {
    headers: { Authorization: getAuthHeaders() },
  });
  return response.data;
};

export const updateMasterDataValue = async (
  axiosInstance: any,
  id: number,
  data: { name?: string; code?: string; description?: string; sortOrder?: number; isActive?: boolean; metadata?: any }
) => {
  const response = await axiosInstance.patch(`${BASE_URL}/values/${id}`, data, {
    headers: { Authorization: getAuthHeaders() },
  });
  return response.data;
};

export const deleteMasterDataValue = async (axiosInstance: any, id: number) => {
  const response = await axiosInstance.delete(`${BASE_URL}/values/${id}`, {
    headers: { Authorization: getAuthHeaders() },
  });
  return response.data;
};