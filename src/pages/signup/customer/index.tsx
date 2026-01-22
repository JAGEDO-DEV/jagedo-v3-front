/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useGlobalContext } from "@/context/GlobalProvider";
import GenericFooter from "@/components/generic-footer";

import { CustomerSignupForm } from "@/components/customer-signup-form";
import {
    initiateRegistraion,
    handleCompleteRegistration,
    resendOtp
} from "@/api/auth.api";
import { toast, Toaster } from "sonner";

export default function CustomerSignup() {
    const navigate = useNavigate();
    const { setUser, setIsLoggedIn } = useGlobalContext();
    const [currentStep, setCurrentStep] = useState(1);
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

    // const handleSubmit = async () => {
        // const data = {
        //     email: formData.email,
            // firstName: formData.firstName,
            // lastName: formData.lastName,
            // organizationName: formData.organizationName,
            // contactFirstName: formData.contactFirstName,
            // contactLastName: formData.contactLastName,
            // contactPhone: formData.contactPhone,
            // contactEmail: formData.contactEmail,
            // country: formData.country,
            // county: formData.county,
            // subCounty: formData.subCounty,
            // estate: formData.estate,
        //     password: formData.password
        // };

        // try {
            // commented out the API call for now to allow testing without backend
            //const response = await handleCompleteRegistration(data);
        //     const response = {
        //         data: {
        //             success: true,
        //             message: "Mock account created successfully",
        //             user: { email: formData.email, role: "CUSTOMER" },
        //             accessToken: "fake_token_for_testing"
        //         }
        //     };

        //     if (response.data.success) {
        //         toast.success("Account Created Successfully. Redirecting to login...");

        //         localStorage.setItem("user", JSON.stringify(response.data.user));
        //         localStorage.setItem("token", response.data.accessToken);
        //         setUser(response.data.user);
        //         setIsLoggedIn(true);

        //         setTimeout(() => {
        //             navigate("/login");
        //         }, 2000);
        //     } else {
        //         toast.error(`Failed To Create Account: ${response.data.message}`);
        //     }
        // } catch (error: any) {
        //     toast.error(`Error sending OTP: ${error.response?.data?.message || error.message}`);
        // }
    // };
    const handleSubmit = async () => {
        // 1. Prepare the user object
        const newUser = {
            id: crypto.randomUUID(),
            email: formData.email,
            password: formData.password,
            userType: "CUSTOMER",
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
                    accessToken: "mock_access_token" + newUser.id
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
                    navigate("/dashboard/customer");
                }, 2000);
             }
           

           

        } catch (error: any) {
            toast.error("An error occurred during mock registration");
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

            <GenericFooter />
        </div>
        
    );
}