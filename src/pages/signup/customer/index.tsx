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
    resendOtp,
    handleCompleteRegistration,
    completeProfile
} from "@/api/auth.api";
import { toast, Toaster } from "sonner";

export default function CustomerSignup() {
    const navigate = useNavigate();
    const { setUser, setIsLoggedIn } = useGlobalContext();
    const [currentStep, setCurrentStep] = useState(1);


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
        contactfirstName: "",
        contactlastName: "",
        contactPhone: "",
        contactEmail: "",
        country: "",
        county: "",
        town: "",
        subCounty: "",
        estate: "",
        password: "",
        confirmPassword: "",
        agreeToTerms: false
    });



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
            nationalId: "",
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

        const registrationPayload = {
            email: formData.email,
            password: formData.password,
        };

        try {

            const response = await handleCompleteRegistration(registrationPayload);

            if (response.data.success) {
                toast.success("Account created successfully. Please complete your profile.");


                const userData = response.data.user;
                localStorage.setItem("token", response.data.accessToken || response.data.token);
                localStorage.setItem("otpDeliveryMethod", formData.otpMethod);


                setRegisteredUser(userData);
                setShowProfileCompletionModal(true);
            } else {
                toast.error(response.data.message || "Registration failed");
            }

        } catch (error: any) {
            console.error("Registration error:", error);
            toast.error(error.response?.data?.message || "An error occurred during registration");
        }
    };

    const handleProfileComplete = async (profileData: any) => {
        try {

            const completeProfilePayload = {
                email: registeredUser.email,
                firstName: profileData.firstName || "",
                lastName: profileData.lastName || "",
                organizationName: profileData.organizationName || "",
                country: profileData.country || "Kenya",
                county: profileData.county || "",
                subCounty: profileData.subCounty || "",
                townCity: profileData.town || "",
                estateVillage: profileData.estate || "",
                referenceInfo: profileData.howDidYouHearAboutUs || "",
            };


            const response = await completeProfile(completeProfilePayload);

            if (response.data.success) {

                const finalUser = response.data.user;


                localStorage.setItem("user", JSON.stringify(finalUser));
                setUser(finalUser);
                setIsLoggedIn(true);

                toast.success("Profile completed! Redirecting to dashboard...");
                setShowProfileCompletionModal(false);

                setTimeout(() => {
                    navigate("/dashboard/customer");
                }, 1500);
            } else {
                toast.error(response.data.message || "Failed to complete profile");
            }

        } catch (error: any) {
            console.error("Profile completion error:", error);
            toast.error(error.response?.data?.message || "Error completing profile");
        }
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
                userType="CUSTOMER"
                onComplete={handleProfileComplete}
                onClose={() => setShowProfileCompletionModal(false)}
            />

            <GenericFooter />
        </div>

    );
}
