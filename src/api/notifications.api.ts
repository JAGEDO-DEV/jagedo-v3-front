import { getAuthHeaders } from "@/utils/auth";

export const getNotifications = async (axiosInstance: any): Promise<any> => {
    try {
        const response = await axiosInstance.get(`${import.meta.env.VITE_SERVER_URL}/api/notifications`, {
            headers: {
                Authorization: getAuthHeaders()
            }
        });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "Failed to fetch notifications");
    }
};

export const markAsRead = async (axiosInstance: any, id: string | number): Promise<any> => {
    try {
        const response = await axiosInstance.post(`${import.meta.env.VITE_SERVER_URL}/api/notifications/${id}/read`, {}, {
            headers: { Authorization: getAuthHeaders() }
        });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "Failed to mark as read");
    }
};

export const markAllAsRead = async (axiosInstance: any): Promise<any> => {
    try {
        const response = await axiosInstance.post(`${import.meta.env.VITE_SERVER_URL}/api/notifications/read-all`, {}, {
            headers: { Authorization: getAuthHeaders() }
        });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "Failed to mark all as read");
    }
};

export const deleteNotification = async (axiosInstance: any, id: string | number): Promise<any> => {
    try {
        const response = await axiosInstance.delete(`${import.meta.env.VITE_SERVER_URL}/api/notifications/${id}`, {
            headers: { Authorization: getAuthHeaders() }
        });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "Failed to delete notification");
    }
};

export const deleteAllNotifications = async (axiosInstance: any): Promise<any> => {
    try {
        const response = await axiosInstance.delete(`${import.meta.env.VITE_SERVER_URL}/api/notifications`, {
            headers: { Authorization: getAuthHeaders() }
        });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "Failed to delete all notifications");
    }
};