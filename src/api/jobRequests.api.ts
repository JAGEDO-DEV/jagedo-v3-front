/* eslint-disable @typescript-eslint/no-explicit-any */
import { getAuthHeaders } from "@/utils/auth";

// Job Request Types
export interface JobRequestData {
    jobType: string;
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

export interface JobRequestResponse {
    id: string;
    jobType: string;
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

export interface CustomerData {
    profile: boolean;
    accountType: "INDIVIDUAL" | "ORGANIZATION";
    organizationName: string;
    contactfirstName: string;
    contactlastName: string;
    phoneNumber: string;
    email: string;
    firstName: string;
    lastName: string;
    imageUrl?: string | null; // Optional: for avatars if available
}

// Create a new job request
export const createJobRequest = async (
    axiosInstance: any,
    data: JobRequestData
): Promise<JobRequestResponse> => {
    try {
        const response = await axiosInstance.post(
            `${import.meta.env.VITE_SERVER_URL}/api/job-requests`,
            data,
            {
                headers: {
                    Authorization: getAuthHeaders()
                }
            }
        );
        return response.data;
    } catch (error: any) {
        throw new Error(
            error.response?.data?.message || "Failed to create job request"
        );
    }
};

// Get all job requests for customer
export const getCustomerJobRequests = async (
    axiosInstance: any
): Promise<JobRequestResponse[]> => {
    try {
        const response = await axiosInstance.get(
            `${import.meta.env.VITE_SERVER_URL}/api/job-requests/customer`,
            {
                headers: {
                    Authorization: getAuthHeaders()
                }
            }
        );
        return response.data;
    } catch (error: any) {
        throw new Error(
            error.response?.data?.message || "Failed to fetch job requests"
        );
    }
};

export const getServiceProviderJobRequests = async (
    axiosInstance: any
): Promise<JobRequestResponse[]> => {
    try {
        const response = await axiosInstance.get(
            `${
                import.meta.env.VITE_SERVER_URL
            }/api/job-requests/service-provider`,
            {
                headers: {
                    Authorization: getAuthHeaders()
                }
            }
        );
        return response.data;
    } catch (error: any) {
        throw new Error(
            error.response?.data?.message || "Failed to fetch job requests"
        );
    }
};

// Get all job requests for Admin
export const getAdminJobRequests = async (axiosInstance: any) => {
    try {
        const response = await axiosInstance.get(
            `${import.meta.env.VITE_SERVER_URL}/api/job-requests`,
            {
                headers: {
                    Authorization: getAuthHeaders()
                }
            }
        );
        return response.data;
    } catch (error: any) {
        throw new Error(
            error.response?.data?.message || "Failed to fetch job requests"
        );
    }
};

// Get a specific job request by ID
export const getJobRequestById = async (
    axiosInstance: any,
    id: string
): Promise<JobRequestResponse> => {
    try {
        const response = await axiosInstance.get(
            `${import.meta.env.VITE_SERVER_URL}/api/job-requests/${id}`,
            {
                headers: {
                    Authorization: getAuthHeaders()
                }
            }
        );
        return response.data;
    } catch (error: any) {
        throw new Error(
            error.response?.data?.message || "Failed to fetch job request"
        );
    }
};

export const getJobRequestCustomerDataById = async (
    axiosInstance: any,
    id: string
): Promise<{
    success: boolean;
    data: CustomerData | null;
    message?: string;
}> => {
    try {
        const response = await axiosInstance.get(
            `${import.meta.env.VITE_SERVER_URL}/api/job-requests/${id}`,
            {
                headers: {
                    Authorization: getAuthHeaders()
                }
            }
        );

        const { success, message, data } = response.data;

        if (!success || !data?.customer) {
            return {
                success: false,
                message: message || "Customer data not found",
                data: null
            };
        }

        return {
            success: true,
            data: data.customer
        };
    } catch (error: any) {
        throw new Error(
            error.response?.data?.message || "Failed to fetch customer data"
        );
    }
};
export const getJobRequestBuilderDataById = async (
    axiosInstance: any,
    id: string
): Promise<{
    success: boolean;
    data: CustomerData | null;
    message?: string;
}> => {
    try {
        const response = await axiosInstance.get(
            `${import.meta.env.VITE_SERVER_URL}/api/job-requests/${id}`,
            {
                headers: {
                    Authorization: getAuthHeaders()
                }
            }
        );

        const { success, message, data } = response.data;

        if (!success || !data?.customer) {
            return {
                success: false,
                message: message || "Builder data not found",
                data: null
            };
        }
        return {
            success: true,
            data: data.assignedServiceProvider
        };
    } catch (error: any) {
        throw new Error(
            error.response?.data?.message || "Failed to fetch Builder data"
        );
    }
};

// Submit a job request
export const submitJobRequest = async (
    axiosInstance: any,
    id: string
): Promise<JobRequestResponse> => {
    try {
        const response = await axiosInstance.post(
            `${import.meta.env.VITE_SERVER_URL}/api/job-requests/${id}/submit`,
            {
                headers: {
                    Authorization: getAuthHeaders()
                }
            }
        );
        return response.data;
    } catch (error: any) {
        throw new Error(
            error.response?.data?.message || "Failed to submit job request"
        );
    }
};

// Pay for a job request
export const payJobRequest = async (
    axiosInstance: any,
    id: string,
    paymentData: any
): Promise<JobRequestResponse> => {
    try {
        const response = await axiosInstance.post(
            `${import.meta.env.VITE_SERVER_URL}/api/job-requests/${id}/pay`,
            paymentData,
            {
                headers: {
                    Authorization: getAuthHeaders()
                }
            }
        );
        return response.data;
    } catch (error: any) {
        throw new Error(
            error.response?.data?.message || "Failed to process payment"
        );
    }
};

// Pay for a job request
export const payContractorProfessionalJobRequest = async (
    axiosInstance: any,
    id: string,
    payload: any
): Promise<any> => {
    try {
        const response = await axiosInstance.post(
            `${import.meta.env.VITE_SERVER_URL}/api/job-requests/${id}/payment`,
            payload,
            {
                headers: {
                    Authorization: getAuthHeaders()
                }
            }
        );
        return response.data;
    } catch (error: any) {
        throw new Error(
            error.response?.data?.message || "Failed to process payment"
        );
    }
};

// Complete a job
export const completeJob = async (
    axiosInstance: any,
    id: string
): Promise<JobRequestResponse> => {
    try {
        const response = await axiosInstance.post(
            `${
                import.meta.env.VITE_SERVER_URL
            }/api/job-requests/${id}/complete-job`,
            {
                headers: {
                    Authorization: getAuthHeaders()
                }
            }
        );
        return response.data;
    } catch (error: any) {
        throw new Error(
            error.response?.data?.message || "Failed to complete job"
        );
    }
};

// Approve job completion
export const approveJobCompletion = async (
    axiosInstance: any,
    id: string
): Promise<JobRequestResponse> => {
    try {
        const response = await axiosInstance.post(
            `${
                import.meta.env.VITE_SERVER_URL
            }/api/job-requests/${id}/approve-completion`,
            {
                headers: {
                    Authorization: getAuthHeaders()
                }
            }
        );
        return response.data;
    } catch (error: any) {
        throw new Error(
            error.response?.data?.message || "Failed to approve job completion"
        );
    }
};

// Accept assignment
export const acceptAssignment = async (
    axiosInstance: any,
    id: string,
    providerId: number
): Promise<JobRequestResponse> => {
    try {
        const response = await axiosInstance.post(
            `${
                import.meta.env.VITE_SERVER_URL
            }/api/job-requests/${id}/accept-assignment?providerId=${providerId}`,
            null, // No request body
            {
                headers: {
                    Authorization: getAuthHeaders()
                }
            }
        );
        return response.data;
    } catch (error: any) {
        throw new Error(
            error.response?.data?.message || "Failed to accept assignment"
        );
    }
};

// Accept a bid
export const acceptBid = async (
    axiosInstance: any,
    jobId: string,
    bidId: string
): Promise<JobRequestResponse> => {
    try {
        const response = await axiosInstance.post(
            `${
                import.meta.env.VITE_SERVER_URL
            }/api/customer/job-requests/${jobId}/bids/${bidId}/accept`,
            {
                headers: {
                    Authorization: getAuthHeaders()
                }
            }
        );
        return response.data;
    } catch (error: any) {
        throw new Error(
            error.response?.data?.message || "Failed to accept bid"
        );
    }
};

// Approve milestone
export const approveMilestone = async (
    axiosInstance: any,
    jobId: string,
    milestoneData: any
): Promise<JobRequestResponse> => {
    try {
        const response = await axiosInstance.post(
            `${
                import.meta.env.VITE_SERVER_URL
            }/api/job-requests/${jobId}/approve-milestone`,
            milestoneData,
            {
                headers: {
                    Authorization: getAuthHeaders()
                }
            }
        );
        return response.data;
    } catch (error: any) {
        throw new Error(
            error.response?.data?.message || "Failed to approve milestone"
        );
    }
};

// Add admin notes and attachments
export const addAdminNotes = async (
    axiosInstance: any,
    jobId: string,
    adminNotesData: { attachments: string[]; adminNotes: string }
): Promise<JobRequestResponse> => {
    try {
        const response = await axiosInstance.post(
            `${
                import.meta.env.VITE_SERVER_URL
            }/api/job-requests/${jobId}/admin/add-notes`,
            adminNotesData,
            {
                headers: {
                    Authorization: getAuthHeaders()
                }
            }
        );
        return response.data;
    } catch (error: any) {
        throw new Error(
            error.response?.data?.message || "Failed to add admin notes"
        );
    }
};

export const updateStage = async (
    axiosInstance: any,
    jobId: string,
    stage: string
) => {
    try {
        const response = await axiosInstance.post(
            `${
                import.meta.env.VITE_SERVER_URL
            }/api/job-requests/${jobId}/stage`,
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

export const addServiceProviderNotes = async (
    axiosInstance: any,
    jobId: string,
    serviceProviderNotesData: {
        attachments: string[];
        serviceProviderNotes: string;
    }
) => {
    try {
        const response = await axiosInstance.post(
            `${
                import.meta.env.VITE_SERVER_URL
            }/api/job-requests/${jobId}/service-provider/add-notes`,
            serviceProviderNotesData
        );
        return response.data;
    } catch (error: any) {
        throw new Error(
            error.response?.data?.message ||
                "Failed to add service provider notes"
        );
    }
};

export const addAdminJobNotes = async (
    axiosInstance: any,
    jobId: string,
    adminNotesData: { attachments: string[]; adminNotes: string }
) => {
    try {
        const response = await axiosInstance.post(
            `${
                import.meta.env.VITE_SERVER_URL
            }/api/job-requests/${jobId}/admin/add-notes`,
            adminNotesData
        );
        return response.data;
    } catch (error: any) {
        throw new Error(
            error.response?.data?.message ||
                "Failed to add service provider notes"
        );
    }
};

export const closeJobRequest = async (axiosInstance: any, jobId: string) => {
    try {
        const response = await axiosInstance.post(
            `${
                import.meta.env.VITE_SERVER_URL
            }/api/job-requests/${jobId}/close-job`
        );
        return response.data;
    } catch (error: any) {
        throw new Error(
            error.response?.data?.message || "Failed to close job request"
        );
    }
};

// Add admin active notes and attachments
export const addAdminActiveNotes = async (
    axiosInstance: any,
    jobId: string,
    adminActiveNotesData: { attachments: string[]; adminNotes: string }
) => {
    try {
        const response = await axiosInstance.post(
            `${
                import.meta.env.VITE_SERVER_URL
            }/api/job-requests/${jobId}/admin/add-active-notes`,
            adminActiveNotesData
        );
        return response.data;
    } catch (error: any) {
        throw new Error(
            error.response?.data?.message ||
                "Failed to add admin active notes"
        );
    }
};

// Add customer active notes and attachments
export const addCustomerActiveNotes = async (
    axiosInstance: any,
    jobId: string,
    customerActiveNotesData: { attachments: string[]; adminNotes: string }
) => {
    try {
        const response = await axiosInstance.post(
            `${
                import.meta.env.VITE_SERVER_URL
            }/api/job-requests/${jobId}/customer/add-active-job-notes`,
            customerActiveNotesData
        );
        return response.data;
    } catch (error: any) {
        throw new Error(
            error.response?.data?.message ||
                "Failed to add customer active notes"
        );
    }
};
