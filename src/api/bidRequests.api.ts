/* eslint-disable @typescript-eslint/no-explicit-any */
import { getAuthHeaders } from "@/utils/auth";

// Get all bid requests for a customer
export const getBids = async (axiosInstance: any): Promise<any> => {
    try {
        const response = await axiosInstance.get(`${import.meta.env.VITE_SERVER_URL}/api/bids`, {
            headers: {
                Authorization: getAuthHeaders()
            }
        });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "Failed to fetch bids");
    }
};

export const getBidById = async (axiosInstance: any, id: number): Promise<any> => {
    try {
        const response = await axiosInstance.get(`${import.meta.env.VITE_SERVER_URL}/api/bids/${id}`, {
            headers: {
                Authorization: getAuthHeaders()
            }
        });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "Failed to fetch bid");
    }
};

// Create a new bid request
export const createBid = async (axiosInstance: any, bidData: any): Promise<any> => {
    try {
        const response = await axiosInstance.post(`${import.meta.env.VITE_SERVER_URL}/api/bids`, bidData, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: getAuthHeaders()
            }
        });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "Failed to create bid");
    }
}

export const getContractorBids = async (axiosInstance: any): Promise<any> => {
    try {
        const response = await axiosInstance.get(`${import.meta.env.VITE_SERVER_URL}/api/bids/contractor`, {
            headers: {
                Authorization: getAuthHeaders()
            }
        });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "Failed to fetch bids");
    }
};

export const awardBid = async (axiosInstance: any, bidId: number, jobId: number, evaluationComments: string): Promise<any> => {
    try {
        const response = await axiosInstance.post(`${import.meta.env.VITE_SERVER_URL}/api/job-requests/${jobId}/bids`, {
            jobId,
            bidId,
            evaluationComments
        }, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: getAuthHeaders()
            }
        });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "Failed to award bid");
    }
}

export const updateBidWorkplan = async (axiosInstance: any, bidId: any, bidData: any): Promise<any> => {
    try {
        const response = await axiosInstance.put(`${import.meta.env.VITE_SERVER_URL}/api/bids/${bidId}/work-plans`, bidData, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: getAuthHeaders()
            }
        });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "Failed to create bid");
    }
}

export const updateBidMilestoneProgress = async (
    axiosInstance: any,
    selectedmilestoneId: number,
    progress: number
): Promise<any> => {
    try {
        const response = await axiosInstance.put(
            `${import.meta.env.VITE_SERVER_URL}/api/bids/${selectedmilestoneId}/progress`,
            null,
            {
                params: {
                    progress,
                    selectedmilestoneId
                },
                headers: {
                    "Content-Type": "application/json",
                    Authorization: getAuthHeaders(),
                },
            }
        );
        return response.data;
    } catch (error: any) {
        throw new Error(
            error.response?.data?.message || "Failed to update milestone progress"
        );
    }
};


export const approveMilestoneCompletion = async (
    axiosInstance: any,
    selectedmilestoneId: number,
): Promise<any> => {
    try {
        const response = await axiosInstance.put(
            `${import.meta.env.VITE_SERVER_URL}/api/bids/${selectedmilestoneId}/approve-milestone`,
            null,
            {
                params: {
                    selectedmilestoneId
                },
                headers: {
                    "Content-Type": "application/json",
                    Authorization: getAuthHeaders(),
                },
            }
        );
        return response.data;
    } catch (error: any) {
        
        throw new Error(
            error.response?.data?.message || "Failed to update milestone progress"
        );
    }
};


export const requestMilestonePayment = async (
    axiosInstance: any,
    selectedmilestoneId: number,
): Promise<any> => {
    try {
        const response = await axiosInstance.put(
            `${import.meta.env.VITE_SERVER_URL}/api/bids/${selectedmilestoneId}/milestone/request-payment`,
            null,
            {
                params: {
                    selectedmilestoneId
                },
                headers: {
                    "Content-Type": "application/json",
                    Authorization: getAuthHeaders(),
                },
            }
        );
        return response.data;
    } catch (error: any) {
        
        throw new Error(
            error.response?.data?.message || "Failed to update milestone progress"
        );
    }
};

export const approveMilestonePayment = async (
    axiosInstance: any,
    selectedmilestoneId: number,
): Promise<any> => {
    try {
        const response = await axiosInstance.put(
            `${import.meta.env.VITE_SERVER_URL}/api/bids/${selectedmilestoneId}/milestone/approve-payment`,
            null,
            {
                params: {
                    selectedmilestoneId
                },
                headers: {
                    "Content-Type": "application/json",
                    Authorization: getAuthHeaders(),
                },
            }
        );
        return response.data;
    } catch (error: any) {
        
        throw new Error(
            error.response?.data?.message || "Failed to update milestone progress"
        );
    }
};

export const rejectMilestonePayment = async (
    axiosInstance: any,
    selectedmilestoneId: number,
): Promise<any> => {
    try {
        const response = await axiosInstance.put(
            `${import.meta.env.VITE_SERVER_URL}/api/bids/${selectedmilestoneId}/milestone/reject-payment`,
            null,
            {
                params: {
                    selectedmilestoneId
                },
                headers: {
                    "Content-Type": "application/json",
                    Authorization: getAuthHeaders(),
                },
            }
        );
        return response.data;
    } catch (error: any) {
        
        throw new Error(
            error.response?.data?.message || "Failed to update milestone progress"
        );
    }
};

export const updateProgressWorkPlan = async (
    axiosInstance: any,
    selectedBidId: number,
    selectedWorkPlanId: number,
): Promise<any> => {
    try {
        const response = await axiosInstance.put(
            `${import.meta.env.VITE_SERVER_URL}/api/bids/${selectedBidId}/work-plans/${selectedWorkPlanId}/progress`,
            null,
            {
                params: {
                    selectedBidId,
                    selectedWorkPlanId
                },
                headers: {
                    "Content-Type": "application/json",
                    Authorization: getAuthHeaders(),
                },
            }
        );
        return response.data;
    } catch (error: any) {
        
        throw new Error(
            error.response?.data?.message || "Failed to update milestone progress"
        );
    }
};

export const startProgressWorkPlan = async (
    axiosInstance: any,
    selectedBidId: number,
    selectedWorkPlanId: number,
): Promise<any> => {
    try {
        const response = await axiosInstance.put(
            `${import.meta.env.VITE_SERVER_URL}/api/bids/${selectedBidId}/work-plans/${selectedWorkPlanId}/start`,
            null,
            {
                params: {
                    selectedBidId,
                    selectedWorkPlanId
                },
                headers: {
                    "Content-Type": "application/json",
                    Authorization: getAuthHeaders(),
                },
            }
        );
        return response.data;
    } catch (error: any) {
        
        throw new Error(
            error.response?.data?.message || "Failed to update milestone progress"
        );
    }
};

export const completeProgressWorkPlan = async (
    axiosInstance: any,
    selectedBidId: number,
    selectedWorkPlanId: number,
): Promise<any> => {
    try {
        const response = await axiosInstance.put(
            `${import.meta.env.VITE_SERVER_URL}/api/bids/${selectedBidId}/work-plans/${selectedWorkPlanId}/complete`,
            null,
            {
                params: {
                    selectedBidId,
                    selectedWorkPlanId
                },
                headers: {
                    "Content-Type": "application/json",
                    Authorization: getAuthHeaders(),
                },
            }
        );
        return response.data;
    } catch (error: any) {
        
        throw new Error(
            error.response?.data?.message || "Failed to update milestone progress"
        );
    }
};


export const approveProgressWorkPlan = async (
    axiosInstance: any,
    selectedBidId: number,
    selectedWorkPlanId: number,
): Promise<any> => {
    try {
        const response = await axiosInstance.put(
            `${import.meta.env.VITE_SERVER_URL}/api/bids/${selectedBidId}/work-plans/${selectedWorkPlanId}/approve`,
            null,
            {
                params: {
                    selectedBidId,
                    selectedWorkPlanId
                },
                headers: {
                    "Content-Type": "application/json",
                    Authorization: getAuthHeaders(),
                },
            }
        );
        return response.data;
    } catch (error: any) {
        
        throw new Error(
            error.response?.data?.message || "Failed to update milestone progress"
        );
    }
};
// Add this function to your API service file
export const updateWorkPlanItem = async (axiosInstance: any, bidId: any, workPlanId: any, itemData: any) => {
    try {
        const response = await axiosInstance.put(
            `${import.meta.env.VITE_SERVER_URL}/api/bids/${bidId}/bill-items/${workPlanId}/items`,
            itemData
        );
        return response.data;
    } catch (error) {
        console.error('Error updating work plan item:', error);
        throw error;
    }
};


export const updateWorkPlanRemarks = async (axiosInstance: any, workPlanId: any, remarks: string) => {
    try {
        const response = await axiosInstance.put(
            `${import.meta.env.VITE_SERVER_URL}/api/bids/${workPlanId}/work-plans/${workPlanId}/remarks`,
            null,
            {
                params: {
                    remarks: remarks
                },
                headers: {
                    "Content-Type": "application/json",
                    Authorization: getAuthHeaders(),
                },
            }
        );
        return response.data;
    } catch (error) {
        console.error('Error updating work plan item:', error);
        throw error;
    }
};

