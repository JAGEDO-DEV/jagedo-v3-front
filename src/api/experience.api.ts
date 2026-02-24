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
