/* eslint-disable @typescript-eslint/no-explicit-any */
import { getAuthHeaders } from "@/utils/auth";

export const updateProfilePhoneNumber = async (
    axiosInstance: any,
    payload: { phone: string; otp: string }
): Promise<any> => {
    try {
        const response = await axiosInstance.put(
            `${import.meta.env.VITE_SERVER_URL}/api/profiles/phoneNumber`,
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
            error.response?.data?.message || "Failed to update provider profile"
        );
    }
};

export const requestPhoneUpdateOtp = async (
    axiosInstance: any,
    phone: any
): Promise<any> => {
    try {
        const response = await axiosInstance.put(
            `${import.meta.env.VITE_SERVER_URL}/api/profiles/phoneNumber`,
            phone,
            {
                headers: {
                    Authorization: getAuthHeaders()
                }
            }
        );
        return response.data;
    } catch (error: any) {
        throw new Error(
            error.response?.data?.message || "Failed to update provider profile"
        );
    }
};

export const requestEmailUpdateOtp = async (
    axiosInstance: any,
    email: any
): Promise<any> => {
    try {
        const response = await axiosInstance.put(
            `${import.meta.env.VITE_SERVER_URL}/api/profiles/email`,
            email,
            {
                headers: {
                    Authorization: getAuthHeaders()
                }
            }
        );
        return response.data;
    } catch (error: any) {
        throw new Error(
            error.response?.data?.message || "Failed to update provider profile"
        );
    }
};

export const updateProfileEmail = async (
    axiosInstance: any,
    payload: { email: string; otp: string }
): Promise<any> => {
    try {
        const response = await axiosInstance.put(
            `${import.meta.env.VITE_SERVER_URL}/api/profiles/email`,
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
            error.response?.data?.message || "Failed to update provider profile"
        );
    }
};

export const updateProfileAddress = async (
    axiosInstance: any,
    data: any
): Promise<any> => {
    try {
        const response = await axiosInstance.put(
            `${import.meta.env.VITE_SERVER_URL}/api/profiles/address`,
            data,
            {
                headers: {
                    Authorization: getAuthHeaders()
                }
            }
        );
        return response.data.success;
    } catch (error: any) {
        throw new Error(
            error.response?.data?.message || "Failed to update provider profile"
        );
    }
};

export const getProviderProfile = async (
    axiosInstance: any,
    userId: string
) => {
    try {
        const response = await axiosInstance.get(
            `${import.meta.env.VITE_SERVER_URL}/api/profiles/${userId}`,
            {
                headers: {
                    Authorization: getAuthHeaders()
                }
            }
        );
        return response.data;
    } catch (error: any) {
        throw new Error(
            error.response?.data?.message || "Failed to get provider profile"
        );
    }
};


export const updateProfessionalExperienceProfile = async (
    axiosInstance: any,
    data: any
): Promise<any> => {
    try {
        const response = await axiosInstance.put(
            `${import.meta.env.VITE_SERVER_URL
            }/api/profiles/professional/experience`,
            data,
            {}
        );
        return response.data.success;
    } catch (error: any) {
        throw new Error(
            error.response?.data?.message || "Failed to update provider profile"
        );
    }
};

export const getAllProviders = async (axiosInstance: any) => {
    try {
        const response = await axiosInstance.get(
            `${import.meta.env.VITE_SERVER_URL}/api/users/builders`,
            {
                headers: {
                    Authorization: getAuthHeaders()
                }
            }
        );
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "Failed to get users");
    }
};

export const getAllCustomers = async (axiosInstance: any) => {
    try {
        const response = await axiosInstance.get(
            `${import.meta.env.VITE_SERVER_URL}/api/users/by-type/CUSTOMER`,
            {
                headers: {
                    Authorization: getAuthHeaders()
                }
            }
        );
        return response.data;
    } catch (error: any) {
        throw new Error(
            error.response?.data?.message || "Failed to update provider profile"
        );
    }
};

export const updateProfessionalDocumentsProfile = async (
    axiosInstance: any,
    data: any
): Promise<any> => {
    try {
        const response = await axiosInstance.put(
            `${import.meta.env.VITE_SERVER_URL
            }/api/profiles/professional/documents`,
            data,
            {
                headers: {
                    Authorization: getAuthHeaders()
                }
            }
        );
        return response.data.success;
    } catch (error: any) {
        throw new Error(
            error.response?.data?.message || "Failed to update provider profile"
        );
    }
};

export const assignJobToProviders = async (
    axiosInstance: any,
    jobId: string,
    providerIds: string[]
) => {
    try {
        const response = await axiosInstance.post(
            `${import.meta.env.VITE_SERVER_URL
            }/api/job-requests/${jobId}/assign-providers`,
            providerIds,
            {
                headers: {
                    Authorization: getAuthHeaders()
                }
            }
        );
        return response.data;
    } catch (error: any) {
        throw new Error(
            error.response?.data?.message || "Failed to update provider profile"
        );
    }
};

export const updateProfilesPhoneNumber = async (
    axiosInstance: any,
    data: any
): Promise<any> => {
    try {
        const response = await axiosInstance.put(
            `${import.meta.env.VITE_SERVER_URL}/api/profiles/phoneNumber`,
            data,
            {
                headers: {
                    Authorization: getAuthHeaders()
                }
            }
        );
        return response.data.success;
    } catch (error: any) {
        throw new Error(
            error.response?.data?.message || "Failed to update provider profile"
        );
    }
};

export const handleVerifyUser = async (axiosInstance: any, userId: any) => {
    try {
        const response = await axiosInstance.put(
            `${import.meta.env.VITE_SERVER_URL}/api/admin/profiles/${userId}/approve`,
            {},
            {
                headers: {
                    Authorization: getAuthHeaders()
                }
            }
        );
        return response.data;
    } catch (error: any) {
        throw new Error(
            error.response?.data?.message || "Failed to update provider profile"
        );
    }
};

export const updateProfilesHardware = async (
    axiosInstance: any,
    data: any
): Promise<any> => {
    try {
        const response = await axiosInstance.put(
            `${import.meta.env.VITE_SERVER_URL}/api/profiles/hardware`,
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
            error.response?.data?.message || "Failed to update provider profile"
        );
    }
};

export const getCountries = async (axiosInstance: any): Promise<any> => {
    try {
        const response = await axiosInstance.get(
            `${import.meta.env.VITE_SERVER_URL}/api/countries`,
            {
                headers: {
                    Authorization: getAuthHeaders()
                }
            }
        );
        return response.data;
    } catch (error: any) {
        throw new Error(
            error.response?.data?.message || "Failed to update provider profile"
        );
    }
};

export const updateAddress = async (axiosInstance: any, data) => {
    const response = await axiosInstance.put(
        `${import.meta.env.VITE_SERVER_URL}/api/profiles/address`,
        data,
        {
            headers: {
                Authorization: getAuthHeaders()
            }
        }
    );

    return response.data;
};

export const adminUpdateAddress = async (axiosInstance: any, data: any, id: any) => {
    const response = await axiosInstance.put(
        `${import.meta.env.VITE_SERVER_URL}/api/admin/profiles/${id}/address`,
        data,
        {
            headers: {
                Authorization: getAuthHeaders()
            }
        }
    );

    return response.data;
};

// Upload profile image
export const updateProfileImage = async (
    axiosInstance: any,
    imageUrl: string
): Promise<any> => {
    try {
        const response = await axiosInstance.put(
            `${import.meta.env.VITE_SERVER_URL}/api/profiles/profileImage`,
            { profileImage: imageUrl },
            {
                headers: {
                    Authorization: getAuthHeaders()
                }
            }
        );
        return response.data;
    } catch (error: any) {
        throw new Error(
            error.response?.data?.message || "Failed to update profile image"
        );
    }
};

export const updateProfileImageAdmin = async (
    axiosInstance: any,
    imageUrl: string,
    id: any
): Promise<any> => {
    try {
        const response = await axiosInstance.put(
            `${import.meta.env.VITE_SERVER_URL
            }/api/admin/profiles/${id}/profileImage`,
            { profileImage: imageUrl },
            {}
        );
        return response.data;
    } catch (error: any) {
        throw new Error(
            error.response?.data?.message || "Failed to update profile image"
        );
    }
};

export const updateProfilePhoneNumberAdmin = async (
    axiosInstance: any,
    id: string,
    phone: any
): Promise<any> => {
    try {
        const response = await axiosInstance.put(
            `${import.meta.env.VITE_SERVER_URL
            }/api/admin/profiles/${id}/phoneNumber`,
            phone,
            {
                headers: {
                    Authorization: getAuthHeaders()
                }
            }
        );
        return response.data.success;
    } catch (error: any) {
        throw new Error(
            error.response?.data?.message ||
            "Failed to update provider phone number (admin)"
        );
    }
};

export const updateProfileEmailAdmin = async (
    axiosInstance: any,
    id: string,
    email: any
): Promise<any> => {
    try {
        const response = await axiosInstance.put(
            `${import.meta.env.VITE_SERVER_URL}/api/admin/profiles/${id}/email`,
            email,
            {
                headers: {
                    Authorization: getAuthHeaders()
                }
            }
        );
        return response.data.success;
    } catch (error: any) {
        throw new Error(
            error.response?.data?.message ||
            "Failed to update provider email (admin)"
        );
    }
};

export const updateProfileNameAdmin = async (
    axiosInstance: any,
    id: string,
    name: any
): Promise<any> => {
    try {
        const response = await axiosInstance.put(
            `${import.meta.env.VITE_SERVER_URL}/api/admin/profiles/${id}/name`,
            name,
            {
                headers: {
                    Authorization: getAuthHeaders()
                }
            }
        );
        return response.data.success;
    } catch (error: any) {
        throw new Error(
            error.response?.data?.message ||
            "Failed to update provider name (admin)"
        );
    }
};

export const submitEvaluation = async (
    axiosInstance: any,
    id: string,
    data: any
) => {
    try {
        const response = await axiosInstance.put(
            `${import.meta.env.VITE_SERVER_URL
            }/api/admin/profiles/${id}/fundi/evaluation`,
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
            error.response?.data?.message || "Failed to submit evaluation"
        );
    }
};

export const updateBuilderLevel = async (
    axiosInstance: any,
    id: any,
    userType: string,
    editedFields: any,
    userData: any
) => {
    const url =
        userType === "FUNDI"
            ? `${import.meta.env.VITE_SERVER_URL
            }/api/admin/profiles/${id}/fundi/information`
            : userType === "PROFESSIONAL"
                ? `${import.meta.env.VITE_SERVER_URL
                }/api/admin/profiles/${id}/professional/experience`
                : userType === "CONTRACTOR"
                    ? `${import.meta.env.VITE_SERVER_URL
                    }/api/admin/profiles/${id}/contractor/experience`
                    : userType === "HARDWARE"
                        ? `${import.meta.env.VITE_SERVER_URL
                        }/api/profiles/hardware`
                        : "";
    try {
        console.log("EDITING FIELDS: ", editedFields);
        console.log("USER DATA: ", userData);

        const data =
            userType === "FUNDI"
                ? {
                    skill: editedFields.skill || userData.skill,
                    specialization: editedFields.specialization || userData.specialization,
                    grade: editedFields.grade || userData.grade,
                    experience:
                        editedFields.experience || userData.experience,
                    previousJobPhotoUrls: userData.previousJobPhotoUrls || []
                }
                : userType === "PROFESSIONAL"
                    ? {
                        professionalProjects: userData.professionalProjects || [],
                        level: editedFields.professionalLevel || userData.levelOrClass || userData.level,
                        yearsOfExperience:
                            editedFields.yearsOfExperience ||
                            userData.yearsOfExperience,
                        profession: editedFields.profession || userData.profession,
                        specialization: editedFields.specialization || userData.specialization
                    }
                    : userType === "CONTRACTOR"
                        ? {
                            categories: userData.categories || userData.contractorCategories || [],
                            projects: userData.projects || userData.contractorProjects || [],
                            contractorType: editedFields.category || userData.contractorType || userData.category,
                            specialization: editedFields.specialization || userData.specialization,
                            licenseLevel: editedFields.class || userData.licenseLevel || userData.class,
                            yearsOfExperience: editedFields.yearsOfExperience || userData.yearsOfExperience
                        }
                        : userType === "HARDWARE"
                            ? {
                                hardwareType: editedFields.hardwareType || userData.hardwareType,
                                specialization: editedFields.specialization || userData.specialization,
                                businessType: editedFields.businessType || userData.businessType,
                                experience: editedFields.experience || userData.experience,
                                projects: userData.hardwareProjects || userData.projects || []
                            }
                            : null;

        const response = await axiosInstance.put(url, data, {
            headers: {
                Authorization: getAuthHeaders()
            }
        });
        return response.data;
    } catch (error: any) {
        throw new Error(
            error.response?.data?.message || "Failed to update builder level"
        );
    }
};

export const whiteListUser = async (axiosInstance: any, userId: string): Promise<any> => {
    try {
        const response = await axiosInstance.post(
            `${import.meta.env.VITE_SERVER_URL}/api/admin/profiles/${userId}/whitelist`,
            {},
            {
                headers: {
                    Authorization: getAuthHeaders()
                }
            }
        );
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "Failed to whitelist user");
    }
};

export const blackListUser = async (axiosInstance: any, userId: string): Promise<any> => {
    try {
        const response = await axiosInstance.post(
            `${import.meta.env.VITE_SERVER_URL}/api/admin/profiles/${userId}/blackList`,
            {},
            {
                headers: {
                    Authorization: getAuthHeaders()
                }
            }
        );
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "Failed to blacklist user");
    }
};

export const suspendUser = async (axiosInstance: any, userId: string): Promise<any> => {
    try {
        const response = await axiosInstance.post(
            `${import.meta.env.VITE_SERVER_URL}/api/admin/profiles/${userId}/suspend`,
            {},
            {
                headers: {
                    Authorization: getAuthHeaders()
                }
            }
        );
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "Failed to suspend user");
    }
};
export const unverifyUser = async (axiosInstance: any, userId: string): Promise<any> => {
    try {
        const response = await axiosInstance.post(
            `${import.meta.env.VITE_SERVER_URL}/api/admin/profiles/${userId}/unverify`,
            {},
            {
                headers: {
                    Authorization: getAuthHeaders()
                }
            }
        );
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "Failed to suspend user");
    }
};