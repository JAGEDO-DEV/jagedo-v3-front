/* eslint-disable @typescript-eslint/no-explicit-any */
// In a file like @/api/profiles.api.ts

import { getAuthHeaders } from "@/utils/auth";


export interface ProfessionalProject {
    projectName: string;
    fileUrl: string;
}

export interface ProfessionalExperience {
    profession: string;
    specialization: string;
    level: string;
    yearsOfExperience: string;
    professionalProjects: ProfessionalProject[];
}

export const updateProfessionalExperience = async (
    axiosInstance: any,
    experienceData: ProfessionalExperience
): Promise<any> => {
    try {
        const response = await axiosInstance.put(
            `${import.meta.env.VITE_SERVER_URL}/api/profiles/professional/experience`,
            experienceData, // Sending the JS object directly
            {
                headers: {
                    Authorization: getAuthHeaders(),
                }
            }
        );
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "Failed to update professional experience");
    }
};


export const updateContractorExperience = async (
    axiosInstance: any,
    experienceFormData: any,
): Promise<any> => {
    try {
        const response = await axiosInstance.put(
            `${import.meta.env.VITE_SERVER_URL}/api/profiles/contractor/experience`,
            experienceFormData, // Sending the FormData object
            {
                headers: {
                    Authorization: getAuthHeaders(),
                }
            }
        );
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "Failed to update contractor experience");
    }
};

export const updateFundiExperience = async (
    axiosInstance: any,
    informationFormData: any,
): Promise<any> => {
    try {
        const response = await axiosInstance.put(
            `${import.meta.env.VITE_SERVER_URL}/api/profiles/fundi/information`,
            informationFormData, // Sending the FormData object
            {
                headers: {
                    Authorization: getAuthHeaders(),
                }
            }
        );
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "Failed to update contractor experience");
    }
};

// Admin API functions for updating user experience
export const adminUpdateFundiExperience = async (axiosInstance: any, userId: string, payload: any): Promise<any> => {
    try {
        const response = await axiosInstance.put(`/api/admin/profiles/${userId}/fundi/information`, payload, {
            headers: {
                Authorization: getAuthHeaders()
            }
        });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "Failed to update fundi experience");
    }
};

export const adminUpdateProfessionalExperience = async (axiosInstance: any, userId: string, payload: any): Promise<any> => {
    try {
        const response = await axiosInstance.put(`/api/admin/profiles/${userId}/professional/experience`, payload, {
            headers: {
                Authorization: getAuthHeaders()
            }
        });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "Failed to update professional experience");
    }
};

export const adminUpdateContractorExperience = async (axiosInstance: any, userId: string, payload: any): Promise<any> => {
    try {
        const response = await axiosInstance.put(`/api/admin/profiles/${userId}/contractor/experience`, payload, {
            headers: {
                Authorization: getAuthHeaders()
            }
        });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "Failed to update contractor experience");
    }
};

export const adminVerifyExperience = async (axiosInstance: any, userId: string): Promise<any> => {
    try {
        const response = await axiosInstance.put(`${import.meta.env.VITE_SERVER_URL}/api/admin/profiles/${userId}/experience/verify`, { status: "VERIFIED" }, {
            headers: { Authorization: getAuthHeaders() }
        });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "Failed to verify experience");
    }
};

export const adminRejectExperience = async (axiosInstance: any, userId: string, reason: string): Promise<any> => {
    try {
        const response = await axiosInstance.put(`${import.meta.env.VITE_SERVER_URL}/api/admin/profiles/${userId}/experience/reject`, { status: "REJECTED", reason }, {
            headers: { Authorization: getAuthHeaders() }
        });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "Failed to reject experience");
    }
};

export const adminResubmitExperience = async (axiosInstance: any, userId: string, reason: string): Promise<any> => {
    try {
        const response = await axiosInstance.put(`${import.meta.env.VITE_SERVER_URL}/api/admin/profiles/${userId}/experience/resubmit`, { status: "RESUBMIT", reason }, {
            headers: { Authorization: getAuthHeaders() }
        });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "Failed to request experience resubmission");
    }
};

// Evaluation Questions CRUD
export const getEvaluationQuestions = async (
    axiosInstance: any,
    filters?: {
        category?: string;
        userType?: string;
        skillName?: string;
        isActive?: boolean;
        isPreset?: boolean;
    }
): Promise<any> => {
    try {
        const params = new URLSearchParams();
        if (filters?.category) params.append('category', filters.category);
        if (filters?.userType) params.append('userType', filters.userType);
        if (filters?.skillName) params.append('skillName', filters.skillName);
        if (filters?.isActive !== undefined) params.append('isActive', String(filters.isActive));
        if (filters?.isPreset !== undefined) params.append('isPreset', String(filters.isPreset));
        
        const url = params.toString() ? `/api/questions?${params.toString()}` : "/api/questions";
        const response = await axiosInstance.get(url, {
            headers: { Authorization: getAuthHeaders() }
        });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "Failed to fetch evaluation questions");
    }
};

export const createEvaluationQuestion = async (axiosInstance: any, payload: any): Promise<any> => {
    try {
        const response = await axiosInstance.post("/api/questions", payload, {
            headers: { Authorization: getAuthHeaders() }
        });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "Failed to create evaluation question");
    }
};

export const updateEvaluationQuestion = async (axiosInstance: any, questionId: string | number, payload: any): Promise<any> => {
    try {
        const response = await axiosInstance.put(`/api/questions/${questionId}`, payload, {
            headers: { Authorization: getAuthHeaders() }
        });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "Failed to update evaluation question");
    }
};

export const deleteEvaluationQuestion = async (axiosInstance: any, questionId: string | number): Promise<any> => {
    try {
        const response = await axiosInstance.delete(`/api/questions/${questionId}`, {
            headers: { Authorization: getAuthHeaders() }
        });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "Failed to delete evaluation question");
    }
};

export const uploadEvaluationAudio = async (axiosInstance: any, audioFile: File): Promise<string> => {
    try {
        const formData = new FormData();
        formData.append("file", audioFile);
        
        const response = await axiosInstance.post("/api/files/upload-audio", formData, {
            headers: {
                "Content-Type": "multipart/form-data",
                Authorization: getAuthHeaders()
            }
        });
        
        // Return the URL from the response
        return response.data?.data || response.data?.url || response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "Failed to upload audio");
    }
};

export const updateEvaluation = async (
    axiosInstance: any,
    id: string,
    data: any
) => {
    try {
        const response = await axiosInstance.put(
            `${import.meta.env.VITE_SERVER_URL}/api/admin/profiles/${id}/fundi/evaluation/edit`,
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
            error.response?.data?.message || "Failed to edit evaluation"
        );
    }
};
