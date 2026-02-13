/* eslint-disable @typescript-eslint/no-explicit-any */
import { getAuthHeaders } from "@/utils/auth";

interface OrganizationCustomerUploads {
    businessPermit: string;
    certificateOfIncorporation: string;
    kraPIN: string;
}

interface IndividualCustomerUploads {
    idFrontUrl: string;
    idBackUrl: string;
    kraPIN: string;
}

interface ContractorDocuments {
    businessRegistration: string;
    businessPermit: string;
    kraPIN: string;
    companyProfile: string;
}

interface FundiUploads {
    idFront: string;
    idBack: string;
    certificate: string;
    kraPIN: string;
}

interface ProfessionalDocuments {
    idFront: string;
    idBack: string;
    academicCertificate: string;
    cvUrl: string;
    kraPIN: string;
    practiceLicense: string;
}

// Customer uploads API
export const uploadOrganizationCustomerDocuments = async (axiosInstance: any, documents: OrganizationCustomerUploads): Promise<any> => {
    try {
        const response = await axiosInstance.put(`${import.meta.env.VITE_SERVER_URL}/api/profiles/organization-customer/uploads`, documents, {
            headers: {
                Authorization: getAuthHeaders()
            }
        });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "Failed to upload customer documents");
    }
};

export const uploadIndividualCustomerDocuments = async (axiosInstance: any, documents: IndividualCustomerUploads): Promise<any> => {
    try {
        const response = await axiosInstance.put(`${import.meta.env.VITE_SERVER_URL}/api/profiles/individual-customer/uploads`, documents, {
            headers: {
                Authorization: getAuthHeaders()
            }
        });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "Failed to upload customer documents");
    }
};

// Contractor documents API
export const uploadContractorDocuments = async (axiosInstance: any, documents: ContractorDocuments): Promise<any> => {
    try {
        const response = await axiosInstance.put(`${import.meta.env.VITE_SERVER_URL}/api/profiles/contractor/documents`, documents, {
            headers: {
                Authorization: getAuthHeaders()
            }
        });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "Failed to upload contractor documents");
    }
};

// Fundi uploads API
export const uploadFundiDocuments = async (axiosInstance: any, documents: FundiUploads): Promise<any> => {
    try {
        const response = await axiosInstance.put(`${import.meta.env.VITE_SERVER_URL}/api/profiles/fundi/uploads`, documents, {
            headers: {
                Authorization: getAuthHeaders()
            }
        });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "Failed to upload fundi documents");
    }
};

export const uploadProfessionalDocuments = async (axiosInstance: any, documents: ProfessionalDocuments): Promise<any> => {
    try {
        // Assuming the endpoint follows a similar pattern
        const response = await axiosInstance.put(
            `${import.meta.env.VITE_SERVER_URL}/api/profiles/professional/documents`,
            documents, // Sending FormData is crucial for file uploads
            {
                headers: {
                    Authorization: getAuthHeaders()
                }
            }
        );
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "Failed to upload professional documents");
    }
};

// Hardware uploads API
export const uploadHardwareDocuments = async (axiosInstance: any, documents: any): Promise<any> => {
    try {
        const response = await axiosInstance.put(`${import.meta.env.VITE_SERVER_URL}/api/profiles/hardware/documents`, documents, {
            headers: {
                Authorization: getAuthHeaders()
            }
        });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "Failed to upload hardware documents");
    }
};

export const adminDynamicUpdateAccountUploads = async (axiosInstance: any, documents: any, userType: string, id: any, accountType: any): Promise<any> => {
    try {
        let url;

        switch (userType.toLowerCase()) {
            case 'customer':
                if (accountType.toLowerCase() === 'individual') {
                    url = `${import.meta.env.VITE_SERVER_URL}/api/admin/profiles/${id}/individual-customer/uploads`;
                } else {
                    url = `${import.meta.env.VITE_SERVER_URL}/api/admin/profiles/${id}/organization-customer/uploads`;
                }
                break;
            case 'fundi':
                url = `${import.meta.env.VITE_SERVER_URL}/api/admin/profiles/${id}/fundi/uploads`;
                break;
            case 'contractor':
                url = `${import.meta.env.VITE_SERVER_URL}/api/admin/profiles/${id}/contractor/documents`;
                break;
            case 'professional':
                url = `${import.meta.env.VITE_SERVER_URL}/api/admin/profiles/${id}/professional/documents`;
                break;
            case 'hardware':
                url = `${import.meta.env.VITE_SERVER_URL}/api/admin/profiles/${id}/hardware/documents`;
                break;
            default:
                throw new Error("Invalid user type");
        }

        const response = await axiosInstance.put(url, documents, {
            headers: {
                Authorization: getAuthHeaders()
            }
        });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "Failed to upload admin documents");
    }
};