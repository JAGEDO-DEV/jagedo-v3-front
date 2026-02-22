/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useGlobalContext } from "@/context/GlobalProvider";
import {
    initiateRegistraion,
    handleCompleteRegistration,
    resendOtp,
    completeProfile
} from "@/api/auth.api";
import { toast, Toaster } from "sonner";
import { ProviderSignupForm } from "@/components/provider-signup-form";
import GenericFooter from "@/components/generic-footer";
import { ProfileCompletionModal } from "@/components/profile 2.0/ProfileCompletionModal";

export default function ContractorSignup() {
    const navigate = useNavigate();
    const { setUser, setIsLoggedIn } = useGlobalContext();
    const [currentStep, setCurrentStep] = useState(1);
    const [showProfileCompletionModal, setShowProfileCompletionModal] = useState(false);
    const [registeredUser, setRegisteredUser] = useState<any>(null);
    const [formData, setFormData] = useState({
        accountType: "ORGANIZATION",
        skills: "",
        profession: "",
        contractorTypes: "",
        hardwareTypes: "",
        email: "",
        phone: "",
        otpMethod: "",
        otp: "",
        firstName: "",
        lastName: "",
        gender: "male",
        organizationName: "",
        contactfirstName: "",
        contactlastName: "",
        contactPhone: "",
        contactEmail: "",
        country: "Kenya",
        county: "",
        town: "",
        subCounty: "",
        estate: "",
        password: "",
        confirmPassword: "",
        agreeToTerms: false
    });


    //const totalSteps = formData.accountType === "ORGANIZATION" ? 6: 5;
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
            userType: "CONTRACTOR",
            accountType: formData.accountType,
            email: formData.email,
            phone: formData.phone,
            otpDeliveryMethod: formData.otpMethod.toUpperCase(),
            contractorTypes: formData.contractorTypes,
            profession: formData.profession,
            skills: formData.skills,
            hardwareTypes: formData.hardwareTypes,
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
        }
    };

    const handleResendProviderOtp = async () => {
        const data = {
            userType: "CONTRACTOR",
            accountType: formData.accountType,
            email: formData.email,
            phone: formData.phone,
            otpDeliveryMethod: formData.otpMethod.toUpperCase(),
            contractorTypes: formData.contractorTypes,
            profession: formData.profession,
            skills: formData.skills,
            hardwareTypes: formData.hardwareTypes,
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
        // 1. Prepare the registration payload
        const registrationPayload = {
            email: formData.email,
            password: formData.password,
        };

        try {
            // 2. Call the complete registration API
            const response = await handleCompleteRegistration(registrationPayload);

            if (response.data.success) {
                toast.success("Account created successfully. Please complete your profile.");

                // Store user data and token
                const userData = response.data.user;
                localStorage.setItem("token", response.data.accessToken || response.data.token);
                localStorage.setItem("otpDeliveryMethod", formData.otpMethod);

                // Set registered user and show profile completion modal
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
            // Prepare the complete profile payload
            const completeProfilePayload = {
                email: registeredUser.email,
                firstName: profileData.firstName || "",
                lastName: profileData.lastName || "",
                organizationName: profileData.organizationName || "",
                country: profileData.country || "Kenya",
                county: profileData.county || "",
                townCity: profileData.town || "",
                estateVillage: profileData.estate || "",
                referenceInfo: profileData.howDidYouHearAboutUs || "",
            };

            // Call the complete profile API
            const response = await completeProfile(completeProfilePayload);

            if (response.data.success) {
                // Use the user object returned from backend as source of truth
                const finalUser = response.data.user;

                // Sync with localStorage and Global Context
                localStorage.setItem("user", JSON.stringify(finalUser));
                setUser(finalUser);
                setIsLoggedIn(true);

                toast.success("Profile completed! Redirecting to dashboard...");
                setShowProfileCompletionModal(false);

                setTimeout(() => {
                    navigate("/dashboard/contractor");
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

                        <ProviderSignupForm
                            providerType="CONTRACTOR"
                            currentStep={currentStep}
                            formData={formData}
                            updateFormData={updateFormData}
                            nextStep={nextStep}
                            prevStep={prevStep}
                            handleInitiateRegistration={
                                handleInitiateRegistration
                            }
                            handleSubmit={handleSubmit}
                            handleResendOtp={handleResendProviderOtp}
                        />
                    </div>
                </div>
            </main>

            <ProfileCompletionModal
                isOpen={showProfileCompletionModal}
                user={registeredUser}
                accountType={"CONTRACTOR" as any}
                userType="CONTRACTOR"
                onComplete={handleProfileComplete}
                onClose={() => setShowProfileCompletionModal(false)}
            />

            <GenericFooter />
        </div>
    );
}
