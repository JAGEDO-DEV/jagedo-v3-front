/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useGlobalContext } from "@/context/GlobalProvider";
import GenericFooter from "@/components/generic-footer";

import { CustomerSignupForm } from "@/components/customer-signup-form";
import { ProfileCompletionModal } from "@/components/profile 2.0/ProfileCompletionModal";
import {
    initiateRegistraion,
    resendOtp
} from "@/api/auth.api";
import { toast, Toaster } from "sonner";

export default function CustomerSignup() {
    const navigate = useNavigate();
    const { setUser, setIsLoggedIn } = useGlobalContext();
    const [currentStep, setCurrentStep] = useState(1);
    
    // New States for Profile Completion
    const [showProfileCompletionModal, setShowProfileCompletionModal] = useState(false);
    const [registeredUser, setRegisteredUser] = useState<any>(null);

    const [formData, setFormData] = useState({
        accountType: "",
        email: "",
        phone: "",
        nationalId: "",
        otpMethod: "",
        otp: "",
        firstName: "",
        lastName: "",
        gender: "",
        organizationName: "",
        contactFirstName: "",
        contactLastName: "",
        contactPhone: "",
        contactEmail: "",
        country: "",
        county: "",
        town: "",
        subCounty: "",
        estate: "",
        password: "",
        confirmPassword: "",
        agreeToTerms: false //mock for testing. Can be removed afterwards
    });


    //const totalSteps = formData.accountType === "ORGANIZATION" ? 9 : 8;
    const totalSteps = 6;

    const updateFormData = (data: Partial<typeof formData>) => {
        setFormData((prev) => ({ ...prev, ...data }));
    };

    const nextStep = () => {
        setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
    };

    const prevStep = () => {
        setCurrentStep((prev) => Math.max(prev - 1, 1));
    };

    const handleInitiateRegistration = async () => {
        const data = {
            userType: "CUSTOMER",
            accountType: formData.accountType,
            email: formData.email,
            phone: formData.phone,
            nationalId: formData.nationalId,
            otpDeliveryMethod: formData.otpMethod.toUpperCase(),
            contractorTypes: "",
            profession: "",
            skills: "",
            hardwareTypes: ""
        };
        try {
            const response = await initiateRegistraion(data);
            if (response.data.success) {
                toast.success("OTP sent Successfully");
            } else {
                toast.error(`Failed To Send OTP: ${response.data.message}`);
            }
        } catch (error: any) {
            toast.error(`Error sending OTP: ${error.response.data.message}`);
            throw error;
        }
    };

    const handleResendCustomerOtp = async () => {
        const data = {
            userType: "CUSTOMER",
            accountType: formData.accountType,
            email: formData.email,
            phone: formData.phone,
            nationalId: formData.nationalId,
            otpDeliveryMethod: formData.otpMethod.toUpperCase(),
            contractorTypes: "",
            profession: "",
            skills: "",
            hardwareTypes: ""
        };
        try {
            const response = await resendOtp(data);
            if (response.data.success) {
                toast.success("OTP sent Successfully");
            } else {
                toast.error(`Failed To Send OTP: ${response.data.message}`);
            }
        } catch (error: any) {
            toast.error(`Error sending OTP: ${error.response.data.message}`);
            throw error;
        }
    };

    const handleSubmit = async () => {
        // 1. Prepare the user object
        const newUser = {
            id: crypto.randomUUID(),
            email: formData.email,
            password: formData.password,
            userType: "CUSTOMER",
            // firstName: formData.firstName || "Pending",
            // lastName: formData.lastName || "User",
            accountType: formData.accountType,
            phone: formData.phone,
            profileCompleted: false
        }
        try {
            // 2. mock db save
            const exisitingUsers = JSON.parse(localStorage.getItem("mock_users_db") || "[]");

            if (exisitingUsers.find((u: any) => u.email === newUser.email)) {
                toast.error("User with this email already exists!");
                return;
            }
            exisitingUsers.push(newUser);
            localStorage.setItem("mock_users_db", JSON.stringify(exisitingUsers));
            localStorage.setItem("otpDeliveryMethod", formData.otpMethod);

           // 3. successs message and redirect
            const response = {
                data: {
                    success: true,
                    user: newUser,
                    accessToken: "mock_access_token" + newUser.id
                }
            };

            // 4. Show Profile Completion Modal instead of immediate redirect
             if (response.data.success) {
                toast.success("Account created successfully. Please complete your profile.");
                setRegisteredUser(newUser);
                setShowProfileCompletionModal(true);
             }
           
        } catch (error: any) {
            toast.error("An error occurred during mock registration");
        }
    };

    const handleProfileComplete = (profileData: any) => {
        // Here we would normally save the profile data to the backend
        // For now, we update the mock user and local storage

        const updatedUser = {
            ...registeredUser,
            ...profileData,
            profileCompleted: true
        };

        // Update in mock DB
        const exisitingUsers = JSON.parse(localStorage.getItem("mock_users_db") || "[]");
        const userIndex = exisitingUsers.findIndex((u: any) => u.email === updatedUser.email);
        if (userIndex !== -1) {
            exisitingUsers[userIndex] = updatedUser;
            localStorage.setItem("mock_users_db", JSON.stringify(exisitingUsers));
        }

        // Login
        localStorage.setItem("user", JSON.stringify(updatedUser));
        localStorage.setItem("token", "mock_access_token" + updatedUser.id);
        setUser(updatedUser);
        setIsLoggedIn(true);

        toast.success("Profile completed! Redirecting to dashboard...");
        setShowProfileCompletionModal(false);
        
        setTimeout(() => {
            navigate("/customer/dashboard");
        }, 1500);
    };


    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Toaster position="top-center" richColors />

            <main className="flex-1 py-8 md:py-12">
                <div className="max-w-[30rem] mx-auto">
                    <div className="mb-8">
                        <button
                            onClick={() =>
                                currentStep > 1 ? prevStep() : navigate("/")
                            }
                            className="flex items-center text-gray-600 hover:text-[#00007a] transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            {currentStep > 1 ? "Back" : "Back to Home"}
                        </button>
                    </div>

                    <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 mb-8">

                        <CustomerSignupForm
                            currentStep={currentStep}
                            formData={formData}
                            updateFormData={updateFormData}
                            nextStep={nextStep}
                            prevStep={prevStep}
                            handleInitiateRegistration={
                                handleInitiateRegistration
                            }
                            handleResendOtp={handleResendCustomerOtp}
                            handleSubmit={handleSubmit}
                        />
                    </div>

                </div>
            </main>

            <ProfileCompletionModal 
                isOpen={showProfileCompletionModal}
                user={registeredUser}
                accountType={formData.accountType as any}
                onComplete={handleProfileComplete}
                onClose={() => setShowProfileCompletionModal(false)}
            />

            <GenericFooter />
        </div>
        
    );
}
