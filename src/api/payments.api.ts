import { getAuthHeaders } from "@/utils/auth";

export const approvePayment = async (axiosInstance: any, jobId: any, bidId: any) => {
    try {
        const response = await axiosInstance.post(`${import.meta.env.VITE_SERVER_URL}/api/job-requests/${jobId}/payment/${bidId}/approve`, {}, {
            headers: {
                Authorization: getAuthHeaders()
            }
        });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || "Failed to approve payment");
    }
}