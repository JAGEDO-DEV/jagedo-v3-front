/* eslint-disable @typescript-eslint/no-explicit-any */
import { getAuthHeaders } from "@/utils/auth";

// Order Request Types
export interface OrderRequestData {
    orderType: string;
    skill: string;
    description: string;
    location: string;
    managedBy: string;
    startDate: string;
    endDate?: string;
    agreeToTerms: boolean;
    attachments: string[];
    customerNotes?: string;
}

export interface OrderRequestResponse {
    id: string;
    orderType: string;
    skill: string;
    description: string;
    location: string;
    managedBy: string;
    startDate: string;
    endDate?: string;
    status: string;
    amount?: number;
    attachments: string[];
    customerNotes?: string;
    createdAt: string;
    updatedAt: string;
}

// Get all order requests for Admin
export const getAdminOrderRequests = async (axiosInstance: any): Promise<any> => {
    try {
        const response = await axiosInstance.get(`${import.meta.env.VITE_SERVER_URL}/api/orders`, {
            headers: {
                Authorization: getAuthHeaders()
            }
        });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "Failed to fetch order requests");
    }
};

export const makeOrders = async (axiosInstance: any, data: any): Promise<any> => {
    try {
        const response = await axiosInstance.post(`${import.meta.env.VITE_SERVER_URL}/api/orders`, data, {
            headers: {
                Authorization: getAuthHeaders()
            }
        });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "Failed to fetch order requests");
    }
};

export const getOrderRequests = async (axiosInstance: any): Promise<any> => {
    try {
        const response = await axiosInstance.get(`${import.meta.env.VITE_SERVER_URL}/api/orders/customer`, {
            headers: {
                Authorization: getAuthHeaders()
            }
        });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "Failed to fetch order requests");
    }
};

export const RecallOrder = async (axiosInstance: any, id: string) => {
    try {
        const response = await axiosInstance.post(
            `${import.meta.env.VITE_SERVER_URL}/api/orders/${id}/recall`
        );
        return response.data;
    } catch (error: any) {
        throw new Error(
            error.response?.data?.message || "Failed to close job request"
        );
    }
};

export const updateStage = async (
    axiosInstance: any,
    id: string,
    stage: string
) => {
    try {
        const response = await axiosInstance.post(
            `${import.meta.env.VITE_SERVER_URL}/api/orders/${id}/stage`,
            {
                stage: stage
            }
        );
        return response.data;
    } catch (error: any) {
        throw new Error(
            error.response?.data?.message || "Failed to update stage"
        );
    }
};

//Post order admin notes
export const PostOrderAdminNotesandAttachments = async (axiosInstance: any, data: any, id: any): Promise<any> => {
    try {
        const response = await axiosInstance.post(`${import.meta.env.VITE_SERVER_URL}/api/orders/${id}/admin/add-notes`, data, {
            headers: {
                Authorization: getAuthHeaders()
            }
        });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "Failed to fetch order requests");
    }
};

export const getProviderOrderRequests = async (axiosInstance: any): Promise<any> => {
    try {
        const response = await axiosInstance.get(`${import.meta.env.VITE_SERVER_URL}/api/orders/service-provider`, {
            headers: {
                Authorization: getAuthHeaders()
            }
        });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "Failed to fetch order requests");
    }
};

export const getOrderRequestsById = async (axiosInstance: any, id: any): Promise<any> => {
    try {
        const response = await axiosInstance.get(`${import.meta.env.VITE_SERVER_URL}/api/orders/${id}`, {
            headers: {
                Authorization: getAuthHeaders()
            }
        });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "Failed to fetch order requests");
    }
};

export const getProvierOrderRequestsById = async (axiosInstance: any, id: any): Promise<any> => {
    try {
        const response = await axiosInstance.get(`${import.meta.env.VITE_SERVER_URL}/api/orders/${id}/providers`, {
            headers: {
                Authorization: getAuthHeaders()
            }
        });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "Failed to fetch order requests");
    }
};

export const assignOrderToProviders = async (axiosInstance: any, orderId: string, payload: any): Promise<any> => {
    try {
        const response = await axiosInstance.post(
            `${import.meta.env.VITE_SERVER_URL}/api/orders/${orderId}/assign`,
            payload,
            {
                headers: {
                    Authorization: getAuthHeaders()
                }
            }
        );
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "Failed to assign order to providers");
    }
};

export const addProviderNotes = async (axiosInstance: any, orderId: string, payload: any): Promise<any> => {
    try {
        const response = await axiosInstance.post(
            `${import.meta.env.VITE_SERVER_URL}/api/orders/${orderId}/service-provider/add-notes`,
            payload,
            {
                headers: {
                    Authorization: getAuthHeaders()
                }
            }
        );
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "Failed to assign order to providers");
    }
};

//Add Provider Fee
export const addProviderFee = async (axiosInstance: any, orderId: string, payload: any): Promise<any> => {
    try {
        const response = await axiosInstance.post(
            `${import.meta.env.VITE_SERVER_URL}/api/orders/${orderId}/add-fee`,
            payload,
            {
                headers: {
                    Authorization: getAuthHeaders()
                }
            }
        );
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "Failed to assign order to providers");
    }
};

//Get Bidders for an order 
export const getBiddersForOrder = async (axiosInstance: any, orderId: string): Promise<any> => {
    try {
        const response = await axiosInstance.get(
            `${import.meta.env.VITE_SERVER_URL}/api/orders/${orderId}/bids`,
            {
                headers: {
                    Authorization: getAuthHeaders()
                }
            }
        );
        return response.data;
    }
    catch (error: any) {
        throw new Error(error.response?.data?.message || "Failed to fetch bidders for the order");
    }
};

//accept order bid
export const acceptOrderBid = async (axiosInstance: any, orderId: number, bidId: number): Promise<any> => {
    try {
        const response = await axiosInstance.post(
            `${import.meta.env.VITE_SERVER_URL}/api/orders/${orderId}/accept-bid`,
            null,
            {
                params: {
                    bidId: bidId 
                },
                headers: {
                    Authorization: getAuthHeaders()
                }
            }
        );
        return response.data;
    }
    catch (error: any) {
        throw new Error(error.response?.data?.message || "Failed to accept the bid for the order");
    }
};

//Pay for order
export const payForOrder = async (axiosInstance: any, orderId: string, payload: any): Promise<any> => {
    try {
        const response = await axiosInstance.post(
            `${import.meta.env.VITE_SERVER_URL}/api/orders/${orderId}/pay`,
            payload,
            {
                headers: {
                    Authorization: getAuthHeaders()
                }
            }
        );
        return response.data;
    }
    catch (error: any) {
        throw new Error(error.response?.data?.message || "Failed to process payment for the order");
    }
};

//Deliver order
export const deliverOrder = async (axiosInstance: any, orderId: string): Promise<any> => {
    try {
        const response = await axiosInstance.post(
            `${import.meta.env.VITE_SERVER_URL}/api/orders/${orderId}/deliver-order`,
            {
                headers: {
                    Authorization: getAuthHeaders()
                }
            }
        );
        return response.data;
    }
    catch (error: any) {
        throw new Error(error.response?.data?.message || "Failed to deliver the order");
    }
};

//Ship order
export const shipOrder = async (axiosInstance: any, orderId: string): Promise<any> => {
    try {
        const response = await axiosInstance.post(
            `${import.meta.env.VITE_SERVER_URL}/api/orders/${orderId}/ship-order`,
            {
                headers: {
                    Authorization: getAuthHeaders()
                }
            }
        );
        return response.data;
    }
    catch (error: any) {
        throw new Error(error.response?.data?.message || "Failed to ship the order");
    }
};

//Confirm order delivery
export const confirmOrderDelivery = async (axiosInstance: any, orderId: string): Promise<any> => {
    try {
        const response = await axiosInstance.post(
            `${import.meta.env.VITE_SERVER_URL}/api/orders/${orderId}/confirm-order-delivery`,
            null,
            {
                headers: {
                    Authorization: getAuthHeaders()
                }
            }
        );
        return response.data;
    }
    catch (error: any) {
        throw new Error(error.response?.data?.message || "Failed to confirm order delivery");
    }
};