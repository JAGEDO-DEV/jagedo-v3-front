/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useGlobalContext } from "@/context/GlobalProvider";
import {
    initiateRegistraion,
    handleCompleteRegistration,
    resendOtp
} from "@/api/auth.api";
import { toast, Toaster } from "sonner";
import { ProviderSignupForm } from "@/components/provider-signup-form";
import GenericFooter from "@/components/generic-footer";

export default function ProfessionalSignup() {
    const navigate = useNavigate();
    const { setUser, setIsLoggedIn } = useGlobalContext();
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState({
        accountType: "INDIVIDUAL",
        skills: "",
        profession: "",
        contractorTypes: "",
        hardwareTypes: "",
        email: "",
        phone: "",
        nationalId: "",
        otpMethod: "",
        otp: "",
        firstName: "",
        lastName: "",
        gender: "male",
        organizationName: "",
        contactFirstName: "",
        contactLastName: "",
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

    //const totalSteps = formData.accountType === "ORGANIZATION" ? 6 : 5;
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
            userType: "PROFESSIONAL",
            accountType: formData.accountType,
            email: formData.email,
            phone: formData.phone,
            nationalId: formData.nationalId,
            otpDeliveryMethod: formData.otpMethod.toUpperCase(),
            contractorTypes: formData.contractorTypes,
            profession: formData.profession,
            skills: formData.skills,
            hardwareTypes: formData.hardwareTypes
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

    // const handleSubmit = async () => {
    //     const data = {
    //         email: formData.email,
    //         firstName: formData.firstName || "Pending",
    //         lastName: formData.lastName || "User",
    //         organizationName: formData.organizationName || "Pending",
    //         contactFirstName: formData.contactFirstName || "Pending",
    //         contactLastName: formData.contactLastName || "User",
    //         contactPhone: formData.contactPhone || formData.phone,
    //         contactEmail: formData.contactEmail || formData.email,
    //         country: formData.country || "Kenya",
    //         county: formData.county || "Pending",
    //         subCounty: formData.subCounty || "Pending",
    //         estate: formData.estate || "Pending",
    //         password: formData.password,
    //         gender: formData.gender || "male",
    //         state: formData.country
    //     };
    //     try {
    //         //const response = await handleCompleteRegistration(data);
    //         const response = {
    //             data: {
    //                 success: true,
    //                 message: "Account Created Successfully (Mock)",
    //                 user: { email: formData.email, role: "PROFESSIONAL" },
    //                 accessToken: "mock_token_123"
    //             }
    //          };
    //         if (response.data.success) {
    //             toast.success("Account Created Successfully. Redirecting to login...");
    //             localStorage.setItem(
    //                 "user",
    //                 JSON.stringify(response.data.user)
    //             );
    //             localStorage.setItem("token", response.data.accessToken);
    //             setUser(response.data.user);
    //             setIsLoggedIn(true);
    //             setTimeout(() => {
    //                 navigate("/login");
    //             }, 2000);
    //         } else {
    //             toast.error(
    //                 `Failed To Create Account: ${response.data.message}`
    //             );
    //         }
    //     } catch (error: any) {
    //         toast.error(`Error sending OTP: ${error.response.data.message}`);
    //     }
    // };
    const handleSubmit = async () => {
        // 1. Prepare the user object
        const newUser = {
            id: crypto.randomUUID(),
            email: formData.email,
            password: formData.password,
            userType: "PROFESSIONAL",
            firstName: formData.firstName || "Pending",
            lastName: formData.lastName || "User",
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
                    accessToken: "mock_access_token_" + newUser.id
                }
            };

            // 4. Login the user automatically
             if (response.data.success) {
                toast.success("Account created successfully. Redirecting...");

                localStorage.setItem("user", JSON.stringify(response.data.user));
                localStorage.setItem("token", response.data.accessToken);

                setUser(response.data.user);
                setIsLoggedIn(true);

                setTimeout(() => {
                    navigate("/dashboard/professional");
                }, 1500);
             }
           
           
        } catch (error: any) {
            toast.error("An error occurred during mock registration");
        }
    };

    const handleResendProviderOtp = async () => {
        const data = {
            userType: "PROFESSIONAL",
            accountType: formData.accountType,
            email: formData.email,
            phone: formData.phone,
            nationalId: formData.nationalId,
            otpDeliveryMethod: formData.otpMethod.toUpperCase(),
            contractorTypes: formData.contractorTypes,
            profession: formData.profession,
            skills: formData.skills,
            hardwareTypes: formData.hardwareTypes
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
                            providerType="PROFESSIONAL"
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

            <GenericFooter />
        </div>
    );
}
