/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/ban-ts-comment */
//@ts-nocheck
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { Eye, EyeOff, Mail, Phone, Loader2, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { toast, Toaster } from "sonner";
import { verifyOtp } from "@/api/auth.api";
import { counties } from "@/pages/data/counties"
import GoogleSignIn from "@/components/GoogleSignIn";
import { getPasswordStrength } from "./PasswordStrength";
interface ProviderSignupFormProps {
    currentStep: number;
    formData: any;
    providerType: string;
    updateFormData: (data: any) => void;
    nextStep: () => void;
    prevStep: () => void;
    handleSubmit: () => void;
    handleResendOtp: () => Promise<void>
    handleInitiateRegistration: () => void;
}

export function ProviderSignupForm({
    currentStep,
    formData,
    providerType,
    updateFormData,
    nextStep,
    handleResendOtp,
    prevStep,
    handleSubmit,
    handleInitiateRegistration
}: ProviderSignupFormProps) {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [isOtpVerified, setIsOtpVerified] = useState(false);
    const [otpTimer, setOtpTimer] = useState(0); // seconds remaining
    const [timerActive, setTimerActive] = useState(false);
    const [hasInitialOtpBeenSent, setHasInitialOtpBeenSent] = useState(false);
    const [emailStatus, setEmailStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
    const [countryCode, setCountryCode] = useState("+254");
    const [professionSearch, setProfessionSearch] = useState("");
    
    const professions = [
        "Architect",
        "Construction Manager",
        "Electrical Engineer",
        "Environment Officer",
        "Geotechnical Engineer",
        "Geologist",
        "Hydrologist",
        "Interior Designer",
        "Land Surveyor",
        "Landscape Architect",
        "Mechanical Engineer",
        "Project Manager",
        "Quantity Surveyor",
        "Roads Engineer",
        "Safety Officer",
        "Structural Engineer",
        "Topo Surveyor",
        "Water Engineer"
    ];
    const COUNTRY_CODES = [
        { code: "+254", flag: "🇰🇪", country: "Kenya" },
        { code: "+256", flag: "🇺🇬", country: "Uganda" },
        { code: "+255", flag: "🇹🇿", country: "Tanzania" },
        { code: "+250", flag: "🇷🇼", country: "Rwanda" }
    ];

    // const countyList = Object.keys(counties);

    // const subCountyList = counties[formData.county as keyof typeof counties]

    // Check email availability (debounced)
    useEffect(() => {
        if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) {
            setEmailStatus('idle');
            return;
        }
        setEmailStatus('checking');
        const timer = setTimeout(() => {
            const existingUsers = JSON.parse(localStorage.getItem("mock_users_db") || "[]");
            const emailExists = existingUsers.some((u: any) => u.email === formData.email);
            setEmailStatus(emailExists ? 'taken' : 'available');
        }, 500);
        return () => clearTimeout(timer);
    }, [formData.email]);

    const validateStep = () => {
        switch (currentStep) {
            case 1:
                if (providerType === "FUNDI" && !formData.skills) {
                    toast.error("Please select your skills");
                    return false;
                } else if (providerType === "PROFESSIONAL" && !formData.profession) {
                    toast.error("Please select your profession");
                    return false;
                } else if (providerType === "CONTRACTOR" && (!formData.contractorTypes || formData.contractorTypes.trim() === "")) {
                    toast.error("Please select at least one contractor type");
                    return false;
                } else if (providerType === "HARDWARE" && (!formData.hardwareTypes || formData.hardwareTypes.trim() === "")) {
                    toast.error("Please select at least one hardware type");
                    return false;
                }
                break;
            case 2:
                if (!formData.email) {
                    toast.error("Email is required");
                    return false;
                } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
                    toast.error("Please enter a valid email address");
                    return false;
                }
                break;
            case 3:
                if (!formData.phone) {
                    toast.error("Phone number is required");
                    return false;
                } else if (!/^[17][0-9]{8}$/.test(formData.phone.replace(/\s/g, ""))) {
                    toast.error("Please enter a valid phone number starting with 7 or 1 and 9 digits long");
                    return false;
                }
                // if (formData?.skills || formData?.profession) {
                //     if (!formData.nationalId) {
                //         toast.error("National ID is required");
                //         return false;
                //     }
                //      else if (formData.nationalId.length > 8) {
                //         toast.error("National ID must be 8 characters or less");
                //         return false;
                //     }
                // }
                break;
            case 4:
                if (!formData.otpMethod) {
                    toast.error("Please select a verification method");
                    return false;
                }
                break;
            case 5:
                if (!formData.otp) {
                    toast.error("Please enter the verification code");
                    return false;
                } else if (
                    formData.otp.length !== 6 ||
                    !/^\d+$/.test(formData.otp)
                ) {
                    toast.error("Please enter a valid 6-digit code");
                    return false;
                }
                break;
            // case 6:
            //     if (providerType === "HARDWARE") {
            //         if (!formData.organizationName) {
            //             toast.error("Hardware name is required");
            //             return false;
            //         }
            //         if (!formData.contactFirstName) {
            //             toast.error("Contact person first name is required");
            //             return false;
            //         }
            //         if (!formData.contactLastName) {
            //             toast.error("Contact person last name is required");
            //             return false;
            //         }
            //     } else {
            //         if (!formData.firstName) {
            //             toast.error("First name is required");
            //             return false;
            //         }
            //         if (!formData.lastName) {
            //             toast.error("Last name is required");
            //             return false;
            //         }
            //         if (!formData.gender) {
            //             toast.error("Please select your gender");
            //             return false;
            //         }
            //     }
            //     break;
            // case 7:
            //     if (!formData.county) {
            //         toast.error("County is required");
            //         return false;
            //     }
            //     if (!formData.town) {
            //         toast.error("Town is required");
            //         return false;
            //     }
            //     break;
            case 6:
                if (!formData.password) {
                    toast.error("Password is required");
                    return false;
                } else if (formData.password.length < 8) {
                    toast.error("Password must be at least 8 characters");
                    return false;
                }
                if (!formData.confirmPassword) {
                    toast.error("Please confirm your password");
                    return false;
                } else if (formData.password !== formData.confirmPassword) {
                    toast.error("Passwords do not match");
                    return false;
                }
                if (!formData.agreeToTerms) {
                    toast.error("Please agree to the Terms of Service");
                    return false;
                }
                break;
        }

        return true;
    };

    const handleContinue = async () => {
        if (validateStep()) {
            // Auto-send OTP when moving from step 4 to step 5
            // TODO: Replace placeholder with actual handleInitiateRegistration() call when backend OTP service is ready
            if (currentStep === 4) {
                toast.success("OTP sent successfully (placeholder)");
                setOtpTimer(120);
                setTimerActive(true);
                setHasInitialOtpBeenSent(true);
                nextStep();
                return;
            }
            // Block advancing from step 2 if email is already taken
            if (currentStep === 2 && emailStatus === 'taken') {
                toast.error("This email is already registered");
                return;
            }
            nextStep();
        }
    };

    const handleFormSubmit = () => {
        if (validateStep()) {
            setIsSubmitting(true);
            // Simulate API call
            setTimeout(() => {
                handleSubmit();
                setIsSubmitting(false);
            }, 1500);
        }
    };

    const handleGoogleSignIn = () => {
        setIsGoogleLoading(true);
        // Simulate Google auth
        setTimeout(() => {
            updateFormData({
                email: "user@example.com",
                firstName: "John",
                lastName: "Doe"
            });
            nextStep();
            setIsGoogleLoading(false);
        }, 1500);
    };

    const handleSendOTP = async () => {
        setIsSubmitting(true);
        setOtpTimer(120); // 2 minutes
        setTimerActive(true);
        if (!formData.accountType) {
            toast.error("Please select an account type");
            setIsSubmitting(false);
            return;
        }
        if (!formData.otpMethod) {
            toast.error("Please select a verification method");
            setIsSubmitting(false);
            return;
        }
        if (!formData.email && !formData.phone) {
            toast.error("Please enter your email or phone number");
            setIsSubmitting(false);
            return;
        }
        try {
            handleInitiateRegistration();
            setHasInitialOtpBeenSent(true);
        } catch (error: any) {
            toast.error(error.response.data.message);
            setTimerActive(false);
            setOtpTimer(0);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleResendOTP = async () => {
        setIsSubmitting(true);
        setOtpTimer(120); // 2 minutes
        setTimerActive(true);
        try {
            await handleResendOtp();
        } catch (error) {
            console.error("Resend OTP failed", error);
        } finally {
            setIsSubmitting(false);
        }
    }

    // const handleVerifyOTP = async () => {
    //     setIsSubmitting(true);
    //     try {
    //         const data = {
    //             email: formData.email,
    //             phoneNumber: formData.phone,
    //             otp: formData.otp
    //         };
    //         const res = await verifyOtp(data);
    //         if (res.data.success) {
    //             toast.success("OTP verified successfully!");
    //             setIsOtpVerified(true);
    //             handleContinue()
    //         } else {
    //             toast.error(`Failed To Verify OTP: ${res.data.message}`);
    //         }
    //     } catch (error: any) {
    //         console.log(error);
    //         toast.error(error.response?.data?.message || error.message || "Verification failed");
    //         setIsOtpVerified(false);
    //     } finally {
    //         setIsSubmitting(false);
    //     }
    // };
    const handleVerifyOTP = async () => {
        setIsSubmitting(true)
        //TEMPORARY BYPASS: Directly verify without API
        setIsOtpVerified(true);
        toast.success("Bypassed verification for testing!");
        setIsSubmitting(false);
        nextStep(); // Auto-advance to next step after verification
    }

    // OTP timer countdown effect
    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;

        if (timerActive) {
            interval = setInterval(() => {
                setOtpTimer((prev) => {
                    if (prev <= 1) {
                        setTimerActive(false);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [timerActive]);

    // Reset OTP verification if OTP or method changes
    useEffect(() => {
        setIsOtpVerified(false);
    }, [formData.otp, formData.otpMethod]);

    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                if (providerType === "FUNDI") {
                    return (
                        <div className="space-y-6 animate-fade-in">
                            <div className="space-y-4">
                                {/* Logo and Title */}
                                <div className="flex flex-col items-center justify-center text-center">
                                    <img
                                        src="/jagedologo.png"
                                        alt="JaGedo Logo"
                                        className="h-12 mb-4"
                                    />
                                    <h2 className="text-2xl font-semibold text-[rgb(0,0,122)] mb-2">
                                        Fundi Sign Up
                                    </h2>
                                </div>
                                <div className="space-y-2 flex flex-col items-center justify-center text-center">
                                    <Label htmlFor="skill">
                                        Select your skill
                                    </Label>
                                    <Select
                                        value={formData.skills || ""}
                                        onValueChange={(value) =>
                                            updateFormData({ skills: value })
                                        }
                                    >
                                        <SelectTrigger id="skill">
                                            <SelectValue placeholder="Choose your skill" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white">
                                            <SelectItem value="carpenter">Carpenter</SelectItem>
                                            <SelectItem value="electrician">Electrician</SelectItem>
                                            <SelectItem value="fitter">Fitter</SelectItem>
                                            <SelectItem value="foreman">Foreman</SelectItem>
                                            <SelectItem value="glass-aluminium-fitter">Glass/Aluminium Fitter</SelectItem>
                                            <SelectItem value="interior-skimmer">Interior Skimmer</SelectItem>
                                            <SelectItem value="mason">Mason</SelectItem>
                                            <SelectItem value="painter">Painter</SelectItem>
                                            <SelectItem value="plumber">Plumber</SelectItem>
                                            <SelectItem value="roofer">Roofer</SelectItem>
                                            <SelectItem value="steel-fixer">Steel Fixer</SelectItem>
                                            <SelectItem value="tile-fixer">Tile Fixer</SelectItem>
                                            <SelectItem value="welder">Welder</SelectItem>
                                        </SelectContent>
                                    </Select>

                                </div>
                            </div>
                        </div>
                    );
                } else if (providerType === "PROFESSIONAL") {
                    return (
                        <div className="space-y-6 animate-fade-in">
                            <div className="space-y-4">
                                {/* Logo and Title */}
                                <div className="flex flex-col items-center justify-center text-center">
                                    <img
                                        src="/jagedologo.png"
                                        alt="JaGedo Logo"
                                        className="h-12 mb-4"
                                    />
                                    <h2 className="text-2xl font-semibold text-[rgb(0,0,122)] mb-2">
                                        Professional Sign Up
                                    </h2>
                                </div>

                                <div className="space-y-2 flex flex-col items-center justify-center text-center">
                                    <Label htmlFor="profession">
                                        Select your profession
                                    </Label>
                                    <Select
                                        value={formData.profession}
                                        onValueChange={(value) =>
                                            updateFormData({
                                                profession: value
                                            })
                                        }
                                    >
                                        <SelectTrigger id="profession">
                                            <SelectValue placeholder="Choose your profession" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white">
                                            {/* Search input */}
                                            <div className="p-2">
                                                <input
                                                    type="text"
                                                    placeholder="Search profession..."
                                                    value={professionSearch}
                                                    onChange={(e) => setProfessionSearch(e.target.value)}
                                                    className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                                />
                                            </div>

                                            {/* Scrollable list */}
                                            <div className="max-h-60 overflow-y-auto">
                                                {professions
                                                    .filter((profession) =>
                                                        profession.toLowerCase().includes(professionSearch.toLowerCase())
                                                    )
                                                    .map((profession) => (
                                                        <SelectItem key={profession} value={profession}>
                                                            {profession}
                                                        </SelectItem>
                                                    ))}
                                            </div>
                                        </SelectContent>

                                    </Select>

                                </div>
                            </div>
                        </div>
                    );
                } else if (providerType === "CONTRACTOR") {
                    const contractorTypeOptions = [
                        { value: "building-works", label: "Building Works" },
                        { value: "mechanical-works", label: "Mechanical Works" },
                        { value: "electrical-works", label: "Electrical Works" },
                        { value: "water-works", label: "Water Works" },
                        { value: "road-works", label: "Road and other Civil Works" }
                    ];

                    const selectedContractorTypes = formData.contractorTypes ? formData.contractorTypes.split(',').filter(Boolean) : [];

                    const handleContractorTypeToggle = (value: string) => {
                        const currentTypes = formData.contractorTypes ? formData.contractorTypes.split(',').filter(Boolean) : [];
                        let updatedTypes;

                        if (currentTypes.includes(value)) {
                            updatedTypes = currentTypes.filter(type => type !== value);
                        } else {
                            updatedTypes = [...currentTypes, value];
                        }

                        updateFormData({
                            contractorTypes: updatedTypes.join(',')
                        });
                    };

                    return (
                        <div className="space-y-6 animate-fade-in">
                            <div className="space-y-4">
                                {/* Logo and Title */}
                                <div className="flex flex-col items-center justify-center text-center">
                                    <img
                                        src="/jagedologo.png"
                                        alt="JaGedo Logo"
                                        className="h-12 mb-4"
                                    />

                                    <h2 className="text-2xl font-semibold text-[rgb(0,0,122)] mb-2">
                                        Contractor Sign Up
                                    </h2>
                                </div>

                                <div className="space-y-4 flex flex-col items-center justify-center text-center">
                                    <Label htmlFor="contractorType">
                                        Select contractor types (you can select multiple)
                                    </Label>

                                    <div className="w-full max-w-md space-y-2">
                                        {contractorTypeOptions.map((option) => (
                                            <div
                                                key={option.value}
                                                className={`border rounded-lg p-3 cursor-pointer transition-all ${selectedContractorTypes.includes(option.value)
                                                    ? "border-[rgb(0,0,122)] bg-[rgb(0,0,122)]/5 shadow-md"
                                                    : "border-gray-200 hover:border-gray-300"
                                                    }`}
                                                onClick={() => handleContractorTypeToggle(option.value)}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className={`font-medium ${selectedContractorTypes.includes(option.value)
                                                        ? "text-[rgb(0,0,122)]"
                                                        : "text-gray-700"
                                                        }`}>
                                                        {option.label}
                                                    </span>
                                                    {selectedContractorTypes.includes(option.value) && (
                                                        <span className="text-[rgb(0,0,122)] font-bold">✓</span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {selectedContractorTypes.length > 0 && (
                                        <div className="mt-4 p-3 bg-gray-50 rounded-lg w-full max-w-md">
                                            <p className="text-sm text-gray-700 font-medium mb-2">
                                                Selected types:
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {selectedContractorTypes.map((type) => {
                                                    const option = contractorTypeOptions.find(opt => opt.value === type);
                                                    return (
                                                        <span
                                                            key={type}
                                                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-[rgb(0,0,122)] text-white"
                                                        >
                                                            {option?.label}
                                                            <button
                                                                type="button"
                                                                className="ml-1 text-white hover:text-gray-200"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleContractorTypeToggle(type);
                                                                }}
                                                            >
                                                                ×
                                                            </button>
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                } else if (providerType === "HARDWARE") {
                    const hardwareTypeOptions = [
                        { value: "electronics", label: "Electronics Hardware" },
                        { value: "mechanical", label: "Mechanical Hardware" },
                        { value: "industrial", label: "Industrial Hardware" },
                        { value: "general", label: "General Hardware" },
                        { value: "aggregate", label: "Aggregate Supplier" },

                    ];

                    const selectedHardwareTypes = formData.hardwareTypes ? formData.hardwareTypes.split(',').filter(Boolean) : [];

                    const handleHardwareTypeToggle = (value: string) => {
                        const currentTypes = formData.hardwareTypes ? formData.hardwareTypes.split(',').filter(Boolean) : [];
                        let updatedTypes;

                        if (currentTypes.includes(value)) {
                            updatedTypes = currentTypes.filter(type => type !== value);
                        } else {
                            updatedTypes = [...currentTypes, value];
                        }

                        updateFormData({
                            hardwareTypes: updatedTypes.join(',')
                        });
                    };

                    return (
                        <div className="space-y-6 animate-fade-in">
                            <div className="space-y-4">
                                {/* Logo and Title */}
                                <div className="flex flex-col items-center justify-center text-center">
                                    <img
                                        src="/jagedologo.png"
                                        alt="JaGedo Logo"
                                        className="h-12 mb-4"
                                    />
                                    <h2 className="text-2xl font-semibold text-[rgb(0,0,122)] mb-2">
                                        Hardware Sign Up
                                    </h2>
                                </div>

                                <div className="space-y-4 flex flex-col items-center justify-center text-center">
                                    <Label htmlFor="hardwareType">
                                        Select hardware types (you can select multiple)
                                    </Label>

                                    <div className="w-full max-w-md space-y-2 max-h-64 overflow-y-auto">
                                        {hardwareTypeOptions.map((option) => (
                                            <div
                                                key={option.value}
                                                className={`border rounded-lg p-3 cursor-pointer transition-all ${selectedHardwareTypes.includes(option.value)
                                                    ? "border-[rgb(0,0,122)] bg-[rgb(0,0,122)]/5 shadow-md"
                                                    : "border-gray-200 hover:border-gray-300"
                                                    }`}
                                                onClick={() => handleHardwareTypeToggle(option.value)}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className={`font-medium ${selectedHardwareTypes.includes(option.value)
                                                        ? "text-[rgb(0,0,122)]"
                                                        : "text-gray-700"
                                                        }`}>
                                                        {option.label}
                                                    </span>
                                                    {selectedHardwareTypes.includes(option.value) && (
                                                        <span className="text-[rgb(0,0,122)] font-bold">✓</span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {selectedHardwareTypes.length > 0 && (
                                        <div className="mt-4 p-3 bg-gray-50 rounded-lg w-full max-w-md">
                                            <p className="text-sm text-gray-700 font-medium mb-2">
                                                Selected types:
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {selectedHardwareTypes.map((type) => {
                                                    const option = hardwareTypeOptions.find(opt => opt.value === type);
                                                    return (
                                                        <span
                                                            key={type}
                                                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-[rgb(0,0,122)] text-white"
                                                        >
                                                            {option?.label}
                                                            <button
                                                                type="button"
                                                                className="ml-1 text-white hover:text-gray-200"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleHardwareTypeToggle(type);
                                                                }}
                                                            >
                                                                ×
                                                            </button>
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                }
                break;
            case 2:
                return (
                    <div className="space-y-6 animate-fade-in">
                        {/* Logo */}
                        <div className="flex flex-col items-center justify-center text-center">
                            <img
                                src="/jagedologo.png"
                                alt="JaGedo Logo"
                                className="h-12 mb-6"
                            />
                            <h2 className="text-2xl font-semibold text-[rgb(0,0,122)] mb-2">
                                    Sign Up
                            </h2>
                        </div>
                        <div className="space-y-4">
                            <div className="flex flex-col items-center justify-center text-center">
                                <h2 className="text-2xl font-semibold">
                                    Enter Your Email
                                </h2>
                            </div>
                            <div className="space-y-2">
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 h-5 w-5" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="Enter your email"
                                        className="pl-10"
                                        value={formData.email}
                                        onChange={(e) =>
                                            updateFormData({
                                                email: e.target.value
                                            })
                                        }
                                    />
                                </div>
                                {emailStatus === 'checking' && (
                                    <p className="text-gray-500 text-sm flex items-center gap-1">
                                        <Loader2 className="h-3 w-3 animate-spin" /> Checking email...
                                    </p>
                                )}
                                {emailStatus === 'available' && (
                                    <p className="text-green-600 text-sm flex items-center gap-1">
                                        <Check className="h-3 w-3" /> Email is available
                                    </p>
                                )}
                                {emailStatus === 'taken' && (
                                    <p className="text-red-500 text-sm flex items-center gap-1">
                                        Email already registered
                                    </p>
                                )}
                            </div>
                            <div className="relative flex items-center my-8">
                                <div className="flex-grow border-t border-gray-300"></div>
                                <span className="mx-4 flex-shrink text-gray-400 text-sm">or</span>
                                <div className="flex-grow border-t border-gray-300"></div>
                            </div>
                            <GoogleSignIn />

                            {/* <div className="relative flex items-center my-8">
                                <div className="flex-grow border-t border-gray-300"></div>
                                <span className="mx-4 flex-shrink text-gray-400 text-sm">
                                    or
                                </span>
                                <div className="flex-grow border-t border-gray-300"></div>
                            </div> */}
                            {/* <Button
                                type="button"
                                variant="outline"
                                className="w-full flex items-center justify-center gap-2 h-11"
                                onClick={handleGoogleSignIn}
                                disabled={isGoogleLoading}
                            >
                                {isGoogleLoading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <img
                                        src="/images/google.png"
                                        alt="Google"
                                        width={20}
                                        height={20}
                                    />
                                )}
                                Continue with Google
                            </Button> */}
                            <p className="text-gray-500">
                                By proceeding, you consent to receive calls,
                                WhatsApp, or SMS messages, including automated
                                means, from JaGedo and its affiliates to the
                                provided number.
                            </p>
                        </div>
                    </div>
                );

            case 3:
                return (
                    <div className="xs:w-full xs:max-w-md xs:p-8 bg-white rounded-lg mx-auto p-0">
                        {/* Logo */}
                        <div className="flex justify-center mb-6">
                            <img
                                src="/jagedologo.png"
                                alt="JaGedo Logo"
                                className="h-12"
                            />
                        </div>

                        {/* Title */}
                        <h2 className="text-2xl font-semibold text-[rgb(0,0,122)] text-center mb-2">
                            Enter Your Phone Number
                        </h2>
                        <p className="text-gray-500 text-center mb-6">
                            We'll use this for verification and important
                            updates
                        </p>

                        {/* Phone Input Section */}
                        <div className="space-y-2">
                            <Label htmlFor="phone" className="text-gray-700">
                                Phone number
                            </Label>
                            <div className="flex items-center border border-gray-500 rounded-lg overflow-hidden shadow-sm focus-within:ring-2 focus-within:ring-[rgb(0,0,122)]">
                                {/* Country Code Dropdown */}
                                <select
                                    className="p-3 bg-gray-100 text-gray-700 border-r outline-none focus:bg-gray-200 pr-1 pl-1"
                                    value={countryCode}
                                    onChange={(e) =>
                                        setCountryCode(e.target.value)
                                    }
                                >
                                    {COUNTRY_CODES?.map((country) => (
                                        <option
                                            key={country.code}
                                            value={country.code}
                                        >
                                            {country.flag} {country.code}
                                        </option>
                                    ))}
                                </select>

                                {/* Phone Number Input */}
                                <Input
                                    id="phone"
                                    type="tel"
                                    placeholder={
                                        countryCode === "+254"
                                            ? "7XXXXXXXX or 1XXXXXXXX"
                                            : "Phone number"
                                    }
                                    className="p-6 w-full outline-none focus:ring-0 border-0"
                                    value={formData.phone}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        // For Kenya (+254), apply special validation
                                        if (countryCode) {
                                            // Only allow digits and limit to 9 characters (7 or 1 + 8 digits)
                                            const cleanValue = value
                                                .replace(/\D/g, "")
                                                .slice(0, 9);
                                            // Ensure it starts with 7 or 1
                                            if (
                                                cleanValue &&
                                                !/^[17]/.test(cleanValue)
                                            ) {
                                                return;
                                            }
                                            updateFormData({
                                                phone: cleanValue,
                                                fullPhoneNumber: `${countryCode}${cleanValue}` // Concatenate here
                                            });
                                        } else {
                                            // For other countries, just allow digits
                                            const cleanValue = value.replace(
                                                /\D/g,
                                                ""
                                            );
                                            updateFormData({
                                                phone: cleanValue,
                                                fullPhoneNumber: `${countryCode}${cleanValue}` // Concatenate here
                                            });
                                        }
                                    }}
                                />
                            </div>

                            {countryCode === "+254" && (
                                <p className="text-xs text-gray-500">
                                    Enter your 9-digit phone number starting
                                    with 7 or 1
                                </p>
                            )}
                        </div>
                        {/*
                        {(formData?.skills || formData?.profession) && (<div className="space-y-2 my-2">
                            <Label htmlFor="nationalId">National ID</Label>
                            <Input
                                id="nationalId"
                                type="number"
                                placeholder="Enter your national ID"
                                maxLength={8}
                                value={formData.nationalId}
                                onChange={(e) =>
                                    updateFormData({
                                        nationalId: e.target.value.slice(0, 8)
                                    })
                                }
                            />
                        </div>)}
                        */}
                        {/* Display concatenated number (optional) */}
                        {formData.fullPhoneNumber && (
                            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-700">
                                    Full phone number:
                                </p>
                                <p className="font-medium">
                                    {formData.fullPhoneNumber}
                                </p>
                            </div>
                        )}
                    </div>
                )
                
                

            case 4:
                return (
                    <div className="space-y-6 animate-fade-in">
                        <div className="space-y-4">
                            {/* Logo */}
                            <div className="flex justify-center">
                                <img
                                    src="/jagedologo.png"
                                    alt="JaGedo Logo"
                                    className="h-12 mb-6"
                                />
                            </div>
                            <h2 className="text-2xl font-semibold">
                                Choose OTP Delivery Method
                            </h2>
                            <div className="space-y-4">
                                <RadioGroup
                                    value={formData.otpMethod}
                                    onValueChange={(value) => updateFormData({ otpMethod: value })}
                                    className="flex flex-col items-center justify-center text-center"
                                >
                                    {/* Email Option */}
                                    <label
                                        htmlFor="email-otp"
                                        className={`w-full max-w-xs sm:max-w-md border rounded-lg px-4 sm:px-6 md:px-10 py-3 cursor-pointer transition-all ${formData.otpMethod === "email"
                                            ? "border-[#00a63e] bg-[#00a63e]/5 shadow-md"
                                            : "border-gray-200 hover:border-gray-300"
                                            }`}
                                    >
                                        <RadioGroupItem value="email" id="email-otp" className="sr-only" />
                                        <div className="flex items-center gap-4">
                                            <div
                                                className={`rounded-full p-2 ${formData.otpMethod === "email" ? "bg-[#00a63e]/10" : "bg-gray-100"
                                                    }`}
                                            >
                                                <Mail
                                                    className={`h-5 w-5 sm:w-4 sm:h-4 ${formData.otpMethod === "email"
                                                        ? "text-[#00a63e]"
                                                        : "text-gray-500"
                                                        }`}
                                                />
                                            </div>
                                            <div>
                                                <span
                                                    className={`block font-medium ${formData.otpMethod === "email" ? "text-[#00a63e]" : ""
                                                        }`}
                                                >
                                                    Email
                                                </span>
                                            </div>
                                        </div>
                                    </label>

                                    {/* Phone Option */}
                                    <label
                                        htmlFor="phone-otp"
                                        className={`w-full max-w-xs sm:max-w-md border rounded-lg px-4 sm:px-6 md:px-10 py-3 cursor-pointer transition-all ${formData.otpMethod === "phone"
                                            ? "border-[#00a63e] bg-[#00a63e]/5 shadow-md"
                                            : "border-gray-200 hover:border-gray-300"
                                            }`}
                                    >
                                        <RadioGroupItem value="phone" id="phone-otp" className="sr-only" />
                                        <div className="flex items-center gap-4">
                                            <div
                                                className={`rounded-full p-2 ${formData.otpMethod === "phone" ? "bg-[#00a63e]/10" : "bg-gray-100"
                                                    }`}
                                            >
                                                <Phone
                                                    className={`h-5 w-5 sm:w-4 sm:h-4 ${formData.otpMethod === "phone"
                                                        ? "text-[#00a63e]"
                                                        : "text-gray-500"
                                                        }`}
                                                />
                                            </div>
                                            <div>
                                                <span
                                                    className={`block font-medium ${formData.otpMethod === "phone" ? "text-[#00a63e]" : ""
                                                        }`}
                                                >
                                                    Phone
                                                </span>
                                            </div>
                                        </div>
                                    </label>
                                </RadioGroup>
                            </div>
                        </div>
                    </div>
                );

            case 5:
                return (
                    <div className="space-y-6 animate-fade-in">
                        <div className="space-y-4">
                            {/* Logo */}
                            <div className="flex justify-center">
                                <img
                                    src="/jagedologo.png"
                                    alt="JaGedo Logo"
                                    className="h-12 mb-6"
                                />
                            </div>
                            <h2 className="text-xl font-semibold">
                                Enter verification code
                            </h2>
                            <p className="text-gray-500">
                                We've sent a 6-digit code to your{" "}
                                {formData.otpMethod === "email"
                                    ? "email"
                                    : "phone"}
                            </p>

                            <div className="space-y-2">
                                <div className="flex gap-2">
                                    <Input
                                        id="otp"
                                        type="text"
                                        placeholder="6-digit code"
                                        maxLength={6}
                                        className="text-center text-lg tracking-widest"
                                        value={formData.otp}
                                        onChange={(e) =>
                                            updateFormData({
                                                otp: e.target.value.replace(
                                                    /\D/g,
                                                    ""
                                                )
                                            })
                                        }
                                    />
                                    <Button
                                        type="button"
                                        className="bg-[#00a63e] text-white"
                                        onClick={handleVerifyOTP}
                                        disabled={
                                            formData.otp.length !== 6 ||
                                            isSubmitting
                                        }
                                    >
                                        {isSubmitting
                                            ? "Verifying..."
                                            : "Verify"}
                                    </Button>
                                </div>


                                {/* Timer and resend logic */}
                                {timerActive && otpTimer > 0 ? (
                                    <div className="flex items-center justify-between mt-2">
                                        <span className="text-sm text-gray-500">Resend available in {Math.floor(otpTimer / 60)}:{(otpTimer % 60).toString().padStart(2, '0')}</span>
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500 mt-2">
                                        Didn't receive a verification code?{' '}
                                        <button
                                            type="button"
                                            className="text-[#00a63e] hover:underline disabled:text-gray-500 disabled:cursor-not-allowed"
                                            onClick={handleResendOTP}
                                            disabled={isSubmitting}
                                        >
                                            Resend
                                        </button>
                                    </p>
                                )}

                                {/* Send verification code button removed - OTP is auto-sent when entering this step */}
                            </div>
                        </div>
                    </div>
                );

            // case 6:
            //     if (providerType === "HARDWARE") {
            //         return (
            //             <div className="space-y-6 animate-fade-in">
            //                 <div className="space-y-4">
            //                     {/* Logo */}
            //                     <div className="flex justify-center">
            //                         <img
            //                             src="/jagedologo.png"
            //                             alt="JaGedo Logo"
            //                             className="h-12 mb-6"
            //                         />
            //                     </div>
            //                     <div className="rounded-lg p-10 border border-gray-300 overflow-hidden max-w-[30rem]">
            //                         <div className="flex justify-center pb-7">
            //                             <h2 className="text-xl font-semibold">
            //                                 Hardware Information
            //                             </h2>
            //                         </div>

            //                         {/* Hardware Name */}
            //                         <div className="space-y-2 mb-6">
            //                             <Label htmlFor="organizationName">
            //                                 Hardware Name
            //                             </Label>
            //                             <Input
            //                                 id="organizationName"
            //                                 placeholder="Enter your hardware business name"
            //                                 value={formData.organizationName}
            //                                 onChange={(e) =>
            //                                     updateFormData({
            //                                         organizationName: e.target.value
            //                                     })
            //                                 }
            //                             />
            //                         </div>

            //                         {/* Contact Person Section */}
            //                         <div className="border-t pt-6">
            //                             <h3 className="text-lg font-medium mb-4 text-center text-gray-700">
            //                                 Contact Person Details
            //                             </h3>

            //                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            //                                 <div className="space-y-2">
            //                                     <Label htmlFor="contactFirstName">
            //                                         First name
            //                                     </Label>
            //                                     <Input
            //                                         id="contactFirstName"
            //                                         placeholder="Contact person first name"
            //                                         value={formData.contactFirstName}
            //                                         onChange={(e) =>
            //                                             updateFormData({
            //                                                 contactFirstName: e.target.value
            //                                             })
            //                                         }
            //                                     />
            //                                 </div>

            //                                 <div className="space-y-2">
            //                                     <Label htmlFor="contactLastName">
            //                                         Last name
            //                                     </Label>
            //                                     <Input
            //                                         id="contactLastName"
            //                                         placeholder="Contact person last name"
            //                                         value={formData.contactLastName}
            //                                         onChange={(e) =>
            //                                             updateFormData({
            //                                                 contactLastName: e.target.value
            //                                             })
            //                                         }
            //                                     />
            //                                 </div>

            //                                 <div className="space-y-2">
            //                                     <Label htmlFor="contactPhone">
            //                                         Contact
            //                                     </Label>
            //                                     <Input
            //                                         id="contactPhone"
            //                                         placeholder="Contact person phone number"
            //                                         value={formData.contactPhone}
            //                                         onChange={(e) =>
            //                                             updateFormData({
            //                                                 contactPhone: e.target.value
            //                                             })
            //                                         }
            //                                     />
            //                                 </div>

            //                                 <div className="space-y-2">
            //                                     <Label htmlFor="contactEmail">
            //                                         Email
            //                                     </Label>
            //                                     <Input
            //                                         id="contactEmail"
            //                                         type="email"
            //                                         placeholder="Contact person email"
            //                                         value={formData.contactEmail}
            //                                         onChange={(e) =>
            //                                             updateFormData({
            //                                                 contactEmail: e.target.value
            //                                             })
            //                                         }
            //                                     />
            //                                 </div>
            //                             </div>
            //                         </div>
            //                     </div>
            //                 </div>
            //             </div>
            //         );
            //     } else {
            //         return (
            //             <div className="space-y-6 animate-fade-in">
            //                 <div className="space-y-4">
            //                     {/* Logo */}
            //                     <div className="flex justify-center">
            //                         <img
            //                             src="/jagedologo.png"
            //                             alt="JaGedo Logo"
            //                             className="h-12 mb-6"
            //                         />
            //                     </div>
            //                     <div className="rounded-lg p-10 border border-gray-300 overflow-hidden max-w-[30rem]">
            //                         <div className="flex justify-center pb-7">
            //                             {providerType === "HARDWARE" ? (
            //                                 <h2 className="text-xl font-semibold">Hardware information</h2>
            //                             ) : (
            //                                 <h2 className="text-xl font-semibold">Personal information</h2>
            //                             )}
            //                         </div>

            //                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            //                             <div className="space-y-2">
            //                                 <Label htmlFor="firstName">
            //                                     First name
            //                                 </Label>
            //                                 <Input
            //                                     id="firstName"
            //                                     placeholder="Enter your first name"
            //                                     value={formData.firstName}
            //                                     onChange={(e) =>
            //                                         updateFormData({
            //                                             firstName: e.target.value
            //                                         })
            //                                     }
            //                                 />
            //                             </div>

            //                             <div className="space-y-2">
            //                                 <Label htmlFor="lastName">
            //                                     Last name
            //                                 </Label>
            //                                 <Input
            //                                     id="lastName"
            //                                     placeholder="Enter your last name"
            //                                     value={formData.lastName}
            //                                     onChange={(e) =>
            //                                         updateFormData({
            //                                             lastName: e.target.value
            //                                         })
            //                                     }
            //                                 />
            //                             </div>
            //                         </div>

            //                         <div className="space-y-2 mt-8">
            //                             <Label htmlFor="gender">Gender</Label>
            //                             <Select
            //                                 value={formData.gender}
            //                                 onValueChange={(value) =>
            //                                     updateFormData({ gender: value })
            //                                 }
            //                             >
            //                                 <SelectTrigger id="gender">
            //                                     <SelectValue placeholder="Select your gender" />
            //                                 </SelectTrigger>
            //                                 <SelectContent className="bg-white">
            //                                     <SelectItem value="male">
            //                                         Male
            //                                     </SelectItem>
            //                                     <SelectItem value="female">
            //                                         Female
            //                                     </SelectItem>
            //                                 </SelectContent>
            //                             </Select>
            //                         </div>
            //                     </div>
            //                 </div>
            //             </div>
            //         );
            //     }

            // case 7:
            //     return (
            //         <div className="font-roboto px-0 xs:p-8 bg-white mt-10 rounded-2xl w-full max-w-lg mx-auto">
            //             {/* Section Title */}
            //             {/* Logo */}
            //             <div className="flex justify-center">
            //                 <img
            //                     src="/jagedologo.png"
            //                     alt="JaGedo Logo"
            //                     className="h-12 mb-6"
            //                 />
            //             </div>
            //             <h3 className="text-2xl font-semibold text-[rgb(0,0,122)] mt-10 xs:mt-0 mb-6 text-center">
            //                 Location Information
            //             </h3>

            //             {/* Country Dropdown with value Kenya only */}
            //             {/* <div className="mb-4">
            //                 <Label htmlFor="country" className="mb-2">Country</Label>
            //                 <select
            //                     id="country"
            //                     value={formData.country || "Kenya"}
            //                     onChange={e => updateFormData({ country: e.target.value })}
            //                     className="w-full border border-gray-300 p-2 h-auto rounded-lg focus:ring-2 focus:ring-[rgb(0,0,122)] bg-white"
            //                 >
            //                     <option value="Kenya">Kenya</option>
            //                 </select>
            //             </div> */}


            //             {/* County Input */}
            //             <div className="mb-4">
            //                 <Select
            //                     value={formData.county || ""}
            //                     onValueChange={(value) =>
            //                         updateFormData({ county: value, subCounty: "" })
            //                     }
            //                 >
            //                     <SelectTrigger className="w-full border border-gray-300 p-3 h-auto rounded-lg focus:ring-2 focus:ring-[rgb(0,0,122)]">
            //                         <SelectValue placeholder="Select your county" />
            //                     </SelectTrigger>
            //                     <SelectContent className="bg-white">
            //                         {countyList?.map((countyName) => (
            //                             <SelectItem key={countyName} value={countyName}>
            //                                 {countyName}
            //                             </SelectItem>
            //                         ))}
            //                     </SelectContent>
            //                 </Select>
            //             </div>

            //             {/* Sub-county Input */}
            //             <div className="mb-4">
            //                 <Select
            //                     value={formData.subCounty || ""}
            //                     onValueChange={(value) => updateFormData({ subCounty: value })}
            //                 >
            //                     <SelectTrigger className="w-full border border-gray-300 p-3 h-auto rounded-lg focus:ring-2 focus:ring-[rgb(0,0,122)]">
            //                         <SelectValue placeholder="Select your sub-county" />
            //                     </SelectTrigger>
            //                     <SelectContent className="bg-white">
            //                         {subCountyList?.map((sub) => (
            //                             <SelectItem key={sub} value={sub}>
            //                                 {sub}
            //                             </SelectItem>
            //                         ))}
            //                     </SelectContent>
            //                 </Select>
            //             </div>

            //             {/* Town Input */}
            //             <div className="mb-4">
            //                 <input
            //                     type="text"
            //                     placeholder="Town/City"
            //                     value={formData.town}
            //                     onChange={(e) =>
            //                         updateFormData({ town: e.target.value })
            //                     }
            //                     className="border border-gray-300 p-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-[rgb(0,0,122)]"
            //                 />
            //             </div>

            //             {/* Estate Input */}
            //             <div className="mb-6">
            //                 <input
            //                     type="text"
            //                     placeholder="Estate/Village"
            //                     value={formData.estate}
            //                     onChange={(e) =>
            //                         updateFormData({ estate: e.target.value })
            //                     }
            //                     className="border border-gray-300 p-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-[rgb(0,0,122)]"
            //                 />
            //             </div>
            //         </div>
            //     );
            case 6:
                return (
                    <div className="space-y-6 animate-fade-in max-w-md mx-auto">
                        {/* Logo and Title */}
                        <div className="flex flex-col items-center justify-center text-center">
                            <img
                                src="/jagedologo.png"
                                alt="JaGedo Logo"
                                className="h-12 mb-4"
                            />
                            <h2 className="text-2xl font-semibold text-[rgb(0,0,122)] mb-2">
                                Security
                            </h2>
                        </div>

                        {/* Password Fields */}
                        <div className="space-y-4">
                            {/* Password Input */}
                            <div className="space-y-1">
                                <Label
                                    htmlFor="password"
                                    className="text-sm font-medium"
                                >
                                    Password
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={
                                            showPassword ? "text" : "password"
                                        }
                                        className="pr-10"
                                        value={formData.password}
                                        onChange={(e) =>
                                            updateFormData({
                                                password: e.target.value
                                            })
                                        }
                                    />
                                    {formData.password &&
                                        formData.password.length >= 8 && (
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">
                                                ✅
                                            </span>
                                        )}
                                    <button
                                        type="button"
                                        className="absolute right-10 top-1/2 -translate-y-1/2 text-gray-500"
                                        onClick={() =>
                                            setShowPassword(!showPassword)
                                        }
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-5 w-5" />
                                        ) : (
                                            <Eye className="h-5 w-5" />
                                        )}
                                    </button>
                                </div>
                            </div>
                            {/* Password Requirements Checklist */}
                            <div className="mt-2 space-y-1.5">
                                <p className={`text-sm flex items-center gap-2 transition-colors ${formData.password && formData.password.length >= 8 ? 'text-green-600' : 'text-red-500'}`}>
                                    {formData.password && formData.password.length >= 8 ? <Check className="h-4 w-4 flex-shrink-0" /> : <span className="h-4 w-4 flex-shrink-0 text-center">&#x2022;</span>} At least 8 characters
                                </p>
                                <p className={`text-sm flex items-center gap-2 transition-colors ${formData.password && /[A-Z]/.test(formData.password) ? 'text-green-600' : 'text-red-500'}`}>
                                    {formData.password && /[A-Z]/.test(formData.password) ? <Check className="h-4 w-4 flex-shrink-0" /> : <span className="h-4 w-4 flex-shrink-0 text-center">&#x2022;</span>} One uppercase letter
                                </p>
                                <p className={`text-sm flex items-center gap-2 transition-colors ${formData.password && /[a-z]/.test(formData.password) ? 'text-green-600' : 'text-red-500'}`}>
                                    {formData.password && /[a-z]/.test(formData.password) ? <Check className="h-4 w-4 flex-shrink-0" /> : <span className="h-4 w-4 flex-shrink-0 text-center">&#x2022;</span>} One lowercase letter
                                </p>
                                <p className={`text-sm flex items-center gap-2 transition-colors ${formData.password && /[^A-Za-z0-9]/.test(formData.password) ? 'text-green-600' : 'text-red-500'}`}>
                                    {formData.password && /[^A-Za-z0-9]/.test(formData.password) ? <Check className="h-4 w-4 flex-shrink-0" /> : <span className="h-4 w-4 flex-shrink-0 text-center">&#x2022;</span>} One special character
                                </p>
                            </div>

                            {/* Confirm Password Input */}
                            <div className="space-y-1">
                                <Label
                                    htmlFor="confirmPassword"
                                    className="text-sm font-medium"
                                >
                                    Confirm Password
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="confirmPassword"
                                        type={
                                            showConfirmPassword
                                                ? "text"
                                                : "password"
                                        }
                                        className="pr-10"
                                        value={formData.confirmPassword}
                                        onChange={(e) =>
                                            updateFormData({
                                                confirmPassword: e.target.value
                                            })
                                        }
                                    />
                                    {formData.confirmPassword &&
                                        formData.password ===
                                        formData.confirmPassword && (
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">
                                                ✅
                                            </span>
                                        )}
                                    <button
                                        type="button"
                                        className="absolute right-10 top-1/2 -translate-y-1/2 text-gray-500"
                                        onClick={() =>
                                            setShowConfirmPassword(
                                                !showConfirmPassword
                                            )
                                        }
                                    >
                                        {showConfirmPassword ? (
                                            <EyeOff className="h-5 w-5" />
                                        ) : (
                                            <Eye className="h-5 w-5" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Terms Checkbox */}
                        <div className="flex items-center space-x-4 mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
                            <input
                                type="checkbox"
                                id="terms"
                                checked={formData.agreeToTerms}
                                onChange={(e) =>
                                    updateFormData({
                                        agreeToTerms: e.target.checked
                                    })
                                }
                                className="h-5 w-5 text-blue-800 focus:ring-blue-800 border-gray-300 rounded cursor-pointer transition-colors duration-200 hover:border-blue-400"
                            />
                            <label
                                htmlFor="terms"
                                className="text-sm text-gray-700 leading-relaxed cursor-pointer select-none"
                            >
                                I agree to the{" "}
                                <a
                                    href="https://jagedo.s3.us-east-1.amazonaws.com/legal/Jagedo%20Terms%20of%20Service.pdf"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-medium text-blue-800 underline hover:text-blue-900 hover:no-underline transition-colors duration-200"
                                >
                                    Terms Of Service
                                </a>
                                {" "}and{" "}
                                <a
                                    href="https://jagedo.s3.us-east-1.amazonaws.com/legal/Jagedo%20Data%20Protection%20Policy.pdf"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-medium text-blue-800 underline hover:text-blue-900 hover:no-underline transition-colors duration-200"
                                >
                                    Data Privacy and Confidentiality Policy
                                </a>
                                .
                            </label>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    const isLastStep = currentStep === 6;

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                if (isLastStep) {
                    handleFormSubmit();
                } else {
                    handleContinue();
                }
            }}
            className="space-y-8"
        >
            <Toaster position="top-center" richColors />
            {renderStepContent()}

            <div className="flex justify-between pt-4">
                {currentStep > 1 ? (
                    <Button type="button" variant="outline" onClick={prevStep}>
                        Back
                    </Button>
                ) : (
                    <div></div>
                )}

                {/* Hide Next/Continue button on step 5 - Verify button handles advancement */}
                {currentStep !== 5 && (
                    <Button
                        type="submit"
                        className={`${isLastStep ? "bg-[#00a63e]" : "bg-[#00007a]"
                            } hover:bg-opacity-90 min-w-[120px] text-white`}
                        disabled={isSubmitting ||
                            (currentStep === 2 && emailStatus === 'taken') ||
                            (currentStep === 3 && (!formData.phone)) ||
                            (isLastStep && (!formData.password || !formData.agreeToTerms))}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                                {isLastStep ? "Creating account..." : "Processing..."}
                            </>
                        ) : isLastStep ? (
                            "Create account"
                        ) : (
                            "Continue"
                        )}
                    </Button>
                )}
            </div>
        </form>
    );
}
