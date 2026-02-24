/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import axios from "axios";
import { getAuthHeaders } from "@/utils/auth";

export const loginUser = async (data: {
    username: string;
    password: string;
    firebaseToken: string;
}) => {
    //@ts-ignore
    const response = await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/api/auth/login`,
        data
    );
    return { ...response.data, user: response.data.user };

};

export const getUserDetails = async () => {
    const response = await axios.get(
        `${import.meta.env.VITE_STAGING_API}/auth/get/account`,
        {
            headers: { Authorization: getAuthHeaders() }
        }
    );
    return response;
};

export const initiateRegistraion = async (data: any) => {
    const response = await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/api/auth/initiate-registration`,
        data
    );
    return response;
}

//Verify email
export const verifyEmail = async (data: any) => {
    const response = await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/api/auth/email`,
        data
    );
    return response;
}

export const handleCompleteRegistration = async (data: any) => {
    const response = await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/api/auth/complete-registration`,
        data
    );
    return response;
}

export const verifyOtp = async (data: any) => {
    const response = await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/api/auth/verify-otp`,
        data
    );
    return response;
}

export const resendOtp = async (data: any) => {
    const response = await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/api/auth/resend-otp`,
        data
    );
    return response;
}

export const forgotPassword = async (data: any) => {
    const response = await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/api/auth/forgot-password`,
        data
    );
    return response;
};

export const resetPassword = async (data: any) => {
    const response = await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/api/auth/reset-password`,
        data
    );
    return response;
};

export const verifyOtpLogin = async (data: any) => {
    const response = await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/api/auth/login-with-otp`,
        data
    );
    return { ...response.data, user: response.data.user };
};

export const phoneLogin = async (data: any) => {
    const response = await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/api/auth/initiate-otp-login`,
        data
    );
    return { ...response.data, user: response.data.user };
};

//initiate secondary verification 
export const initiateSecondaryVerification = async (data: any) => {
    const response = await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/api/auth/secondary-verification/initiate`,
        null,
        {
            params: data
        }
    );
    return response;
};


//verify secondary verification 
export const verifySecondaryVerification = async (data: any) => {
    const response = await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/api/auth/secondary-verification/verify`,
        data
    );
    return response;
}

//Complete Profile
export const completeProfile = async (data: any) => {
    const response = await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/api/auth/complete-profile`,
        data
    );
    return response;
}

export const forgotPasswordLink = async (email: string) => {
    const response = await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/api/auth/forgot-password-link`,
        null,
        {
            params: { email }
        }
    );
    return response.data;
};

export const resetPasswordToken = async (data: any) => {
    const response = await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/api/auth/reset-password-token`,
        data
    );
    return response.data;
};
