/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";
import FormData from "form-data";

// Create a default axios instance for file uploads
const createFileUploadAxios = () => {
    const axiosInstance = axios.create({
        baseURL: import.meta.env.VITE_SERVER_URL || import.meta.env.VITE_STAGING_API
    });

    // Add request interceptor to include token
    axiosInstance.interceptors.request.use(
        (config) => {
            const token = localStorage.getItem("token");
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        },
        (error) => Promise.reject(error)
    );

    // Add response interceptor to handle token expiration
    axiosInstance.interceptors.response.use(
        (response) => response,
        async (error) => {
            const originalRequest = error.config;
            if (error.response?.status === 401 && !originalRequest._retry) {
                originalRequest._retry = true;
                const refreshToken = localStorage.getItem("refreshToken");
                const token = localStorage.getItem("token");

                if (refreshToken) {
                    try {
                        const response = await axios.post(
                            `${import.meta.env.VITE_STAGING_API}/auth/refresh/token`,
                            {
                                refreshToken: refreshToken,
                                token: token
                            }
                        );
                        const res = await response.data;
                        const newAccessToken = res.token;
                        const newRefreshToken = res.refreshToken;
                        localStorage.setItem("token", newAccessToken);
                        localStorage.setItem("refreshToken", newRefreshToken);
                        return axiosInstance(originalRequest);
                    } catch (error) {
                        console.error("Error refreshing token:", error);
                        // Clear tokens on refresh failure
                        localStorage.removeItem("token");
                        localStorage.removeItem("refreshToken");
                        window.location.href = "/";
                    }
                } else {
                    // Token is invalid or expired
                    localStorage.removeItem("token");
                    localStorage.removeItem("refreshToken");
                    window.location.href = "/";
                }
            }
            return Promise.reject(error);
        }
    );

    return axiosInstance;
};

export interface UploadedFile {
    id: string;
    originalName: string;
    displayName: string;
    url: string;
    type: string;
    size: number;
    uploadedAt: Date;
}


// Enhanced file upload function that handles different file types (with axios instance)
export async function uploadFileWithAxios(
    axiosInstance: any,
    file: File,
    customName?: string
): Promise<UploadedFile> {
    try {
        // Validate file size (10MB limit)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            throw new Error("File size exceeds 10MB limit");
        }

        // Validate file type
        const allowedTypes = [
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/gif",
            "image/webp",
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ];

        if (!allowedTypes.includes(file.type)) {
            throw new Error(
                "File type not supported. Please upload images (JPEG, PNG, GIF, WebP), PDF, or Word documents."
            );
        }

        // Create FormData for multipart upload
        const formData = new FormData();
        formData.append('file', file);
        
        let response;
        let uploadedUrl: string;

        // Use different endpoints based on whether customName is provided
        if (customName) {
            // Use DTO endpoint when fileName is provided
            formData.append('fileName', customName);
            response = await axiosInstance.post('/api/files/upload-with-dto', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            uploadedUrl = response.data.data;
        } else {
            // Use simple endpoint when no fileName is provided
            response = await axiosInstance.post('/api/files/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            uploadedUrl = response.data.data;
        }

        if (!uploadedUrl || typeof uploadedUrl !== "string") {
            throw new Error("Failed to upload file to server");
        }

        // Create uploaded file object
        const uploadedFile: UploadedFile = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            originalName: file.name,
            displayName: customName || file.name,
            url: uploadedUrl,
            type: file.type,
            size: file.size,
            uploadedAt: new Date()
        };

        return uploadedFile;
    } catch (error: any) {
        console.error("Error uploading file:", error);
        throw new Error(error.response?.data?.message || error.message || 'Failed to upload file');
    }
}

// Backward compatible wrapper function that automatically creates axios instance
export async function uploadFile(
    file: File,
    customName?: string
): Promise<UploadedFile> {
    const axiosInstance = createFileUploadAxios();
    return uploadFileWithAxios(axiosInstance, file, customName);
}

// Function to validate file before upload
export function validateFile(file: File): { isValid: boolean; error?: string } {
    // Check file size
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
        return { isValid: false, error: "File size exceeds 10MB limit" };
    }

    // Check file type
    const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ];

    if (!allowedTypes.includes(file.type)) {
        return {
            isValid: false,
            error: "File type not supported. Please upload images (JPEG, PNG, GIF, WebP), PDF, or Word documents."
        };
    }

    return { isValid: true };
}

// Function to get file icon based on type
export function getFileIcon(fileType: string): string {
    if (fileType.startsWith("image/")) {
        return "🖼️";
    } else if (fileType === "application/pdf") {
        return "📄";
    } else if (fileType.includes("word")) {
        return "📝";
    } else {
        return "📎";
    }
}

// Function to format file size
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export const uploadAudioToCloudinary = async (
    audioFile: any,
    cloudName = "munyite",
    uploadPreset: string = "munyite"
) => {
    if (!audioFile) {
        throw new Error("No audio file provided");
    }

    // Validate file type
    if (!audioFile.type.startsWith("audio/")) {
        throw new Error("Invalid file type. Please upload a valid audio file.");
    }

    const formData = new FormData();
    formData.append("file", audioFile);
    formData.append("upload_preset", uploadPreset);
    formData.append("resource_type", "video");

    try {
        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudName}/upload`,
            {
                method: "POST",
                body: formData as any
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Audio upload failed");
        }

        const data = await response.json();
        return data.secure_url;
    } catch (error) {
        console.error("Error uploading audio:", error);
        throw error;
    }
};
