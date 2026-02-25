/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/ban-ts-comment */
//@ts-nocheck
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from "react";
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
import { verifyOtp, verifyEmail } from "@/api/auth.api";
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
    const [otpTimer, setOtpTimer] = useState(0);
    const [timerActive, setTimerActive] = useState(false);
    const [hasInitialOtpBeenSent, setHasInitialOtpBeenSent] = useState(false);
    const [emailStatus, setEmailStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
    const [isAutoVerifying, setIsAutoVerifying] = useState(false);
    const lastVerifiedOtp = useRef<string>("");
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

    useEffect(() => {
        if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) {
            setEmailStatus('idle');
            return;
        }

        const checkTimeout = setTimeout(async () => {
            setEmailStatus('checking');
            try {
                const response = await verifyEmail({ email: formData.email });
                const available = response.data.available
                const message = response.data.message
                if (available || message === "User not found") {
                    setEmailStatus('available');
                } else {
                    setEmailStatus('taken');
                }

            } catch (error: any) {
                console.error(error)
                if (error.response?.data?.message === "User not found") {
                    setEmailStatus('available');
                } else {
                    setEmailStatus('idle');
                }
            }
        }, 800);

        return () => clearTimeout(checkTimeout);
    }, [formData.email]);

    useEffect(() => {
        if (currentStep !== 5) return;
        if (!formData.otp || formData.otp.length !== 6 || !/^\d{6}$/.test(formData.otp)) {
            if (formData.otp && formData.otp.length < 6) {
                lastVerifiedOtp.current = "";
            }
            return;
        }
        if (isOtpVerified || isAutoVerifying || lastVerifiedOtp.current === formData.otp) return;

        const autoVerify = async () => {
            setIsAutoVerifying(true);
            lastVerifiedOtp.current = formData.otp;
            try {
                const response = await verifyOtp({
                    email: formData.email,
                    phoneNumber: formData.phone,
                    otp: formData.otp,
                });

                if (response.data.success) {
                    setIsOtpVerified(true);
                    toast.success("OTP Verified Successfully");
                    setIsAutoVerifying(false);
                    nextStep();
                } else {
                    toast.error(response.data.message || "Invalid OTP");
                    setIsAutoVerifying(false);
                }
            } catch (error: any) {
                toast.error(error.response?.data?.message || "Error verifying OTP");
                setIsAutoVerifying(false);
            }
        };

        autoVerify();
    }, [formData.otp, currentStep, nextStep, isOtpVerified]);

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
            if (currentStep === 4) {
                await handleSendOTP();
                return;
            }

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
            setTimeout(() => {
                handleSubmit();
                setIsSubmitting(false);
            }, 1500);
        }
    };

    const handleGoogleSignIn = () => {
        setIsGoogleLoading(true);
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
            await handleInitiateRegistration();

            setOtpTimer(120);
            setTimerActive(true);
            setHasInitialOtpBeenSent(true);

            nextStep();

        } catch (error: any) {
            console.error(error);
            setTimerActive(false);
            setOtpTimer(0);

            toast.error(error.response?.data?.message || "Failed to send OTP");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleResendOTP = async () => {
        setIsSubmitting(true);
        setOtpTimer(120);
        setTimerActive(true);
        try {
            await handleResendOtp();
        } catch (error) {
            console.error("Resend OTP failed", error);
        } finally {
            setIsSubmitting(false);
        }
    }

    const handleVerifyOTP = async (otpValue?: string) => {
        setIsSubmitting(true);
        const otpToVerify = otpValue || formData.otp;

        if (otpToVerify.length !== 6) {
            toast.error("Invalid OTP length");
            setIsSubmitting(false);
            return;
        }

        try {
            const response = await verifyOtp({
                email: formData.email,
                phoneNumber: formData.phone,
                otp: otpToVerify,
            });

            if (response.data.success) {
                setIsOtpVerified(true);
                toast.success("OTP Verified Successfully");
                nextStep();
            } else {
                toast.error(response.data.message || "Invalid OTP");
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Error verifying OTP");
        } finally {
            setIsSubmitting(false);
        }
    }

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
                                <div className="flex flex-col items-center justify-center text-center">
                                    <img src="/jagedologo.png" alt="JaGedo Logo" className="h-12 mb-4" />
                                    <h2 className="text-2xl font-semibold text-[rgb(0,0,122)] mb-2">Fundi Sign Up</h2>
                                </div>
                                <div className="space-y-2 flex flex-col items-center justify-center text-center">
                                    <Label htmlFor="skill">Select your skill</Label>
                                    <Select value={formData.skills || ""} onValueChange={(value) => updateFormData({ skills: value })}>
                                        <SelectTrigger id="skill"><SelectValue placeholder="Choose your skill" /></SelectTrigger>
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
                                <div className="flex flex-col items-center justify-center text-center">
                                    <img src="/jagedologo.png" alt="JaGedo Logo" className="h-12 mb-4" />
                                    <h2 className="text-2xl font-semibold text-[rgb(0,0,122)] mb-2">Professional Sign Up</h2>
                                </div>
                                <div className="space-y-2 flex flex-col items-center justify-center text-center">
                                    <Label htmlFor="profession">Select your profession</Label>
                                    <Select value={formData.profession} onValueChange={(value) => updateFormData({ profession: value })}>
                                        <SelectTrigger id="profession"><SelectValue placeholder="Choose your profession" /></SelectTrigger>
                                        <SelectContent className="bg-white">
                                            <div className="p-2">
                                                <input
                                                    type="text"
                                                    placeholder="Search profession..."
                                                    value={professionSearch}
                                                    onChange={(e) => setProfessionSearch(e.target.value)}
                                                    className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                                />
                                            </div>
                                            <div className="max-h-60 overflow-y-auto">
                                                {professions
                                                    .filter((profession) => profession.toLowerCase().includes(professionSearch.toLowerCase()))
                                                    .map((profession) => (
                                                        <SelectItem key={profession} value={profession}>{profession}</SelectItem>
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
                        updateFormData({ contractorTypes: updatedTypes.join(',') });
                    };
                    return (
                        <div className="space-y-6 animate-fade-in">
                            <div className="space-y-4">
                                <div className="flex flex-col items-center justify-center text-center">
                                    <img src="/jagedologo.png" alt="JaGedo Logo" className="h-12 mb-4" />
                                    <h2 className="text-2xl font-semibold text-[rgb(0,0,122)] mb-2">Contractor Sign Up</h2>
                                </div>
                                <div className="space-y-4 flex flex-col items-center justify-center text-center">
                                    <Label htmlFor="contractorType">Select contractor types (you can select multiple)</Label>
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
                                                    <span className={`font-medium ${selectedContractorTypes.includes(option.value) ? "text-[rgb(0,0,122)]" : "text-gray-700"}`}>
                                                        {option.label}
                                                    </span>
                                                    {selectedContractorTypes.includes(option.value) && <span className="text-[rgb(0,0,122)] font-bold">✓</span>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {selectedContractorTypes.length > 0 && (
                                        <div className="mt-4 p-3 bg-gray-50 rounded-lg w-full max-w-md">
                                            <p className="text-sm text-gray-700 font-medium mb-2">Selected types:</p>
                                            <div className="flex flex-wrap gap-2">
                                                {selectedContractorTypes.map((type) => {
                                                    const option = contractorTypeOptions.find(opt => opt.value === type);
                                                    return (
                                                        <span key={type} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-[rgb(0,0,122)] text-white">
                                                            {option?.label}
                                                            <button type="button" className="ml-1 text-white hover:text-gray-200" onClick={(e) => { e.stopPropagation(); handleContractorTypeToggle(type); }}>×</button>
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
                        updateFormData({ hardwareTypes: updatedTypes.join(',') });
                    };
                    return (
                        <div className="space-y-6 animate-fade-in">
                            <div className="space-y-4">
                                <div className="flex flex-col items-center justify-center text-center">
                                    <img src="/jagedologo.png" alt="JaGedo Logo" className="h-12 mb-4" />
                                    <h2 className="text-2xl font-semibold text-[rgb(0,0,122)] mb-2">Hardware Sign Up</h2>
                                </div>
                                <div className="space-y-4 flex flex-col items-center justify-center text-center">
                                    <Label htmlFor="hardwareType">Select hardware types (you can select multiple)</Label>
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
                                                    <span className={`font-medium ${selectedHardwareTypes.includes(option.value) ? "text-[rgb(0,0,122)]" : "text-gray-700"}`}>
                                                        {option.label}
                                                    </span>
                                                    {selectedHardwareTypes.includes(option.value) && <span className="text-[rgb(0,0,122)] font-bold">✓</span>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {selectedHardwareTypes.length > 0 && (
                                        <div className="mt-4 p-3 bg-gray-50 rounded-lg w-full max-w-md">
                                            <p className="text-sm text-gray-700 font-medium mb-2">Selected types:</p>
                                            <div className="flex flex-wrap gap-2">
                                                {selectedHardwareTypes.map((type) => {
                                                    const option = hardwareTypeOptions.find(opt => opt.value === type);
                                                    return (
                                                        <span key={type} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-[rgb(0,0,122)] text-white">
                                                            {option?.label}
                                                            <button type="button" className="ml-1 text-white hover:text-gray-200" onClick={(e) => { e.stopPropagation(); handleHardwareTypeToggle(type); }}>×</button>
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
                        <div className="flex flex-col items-center justify-center text-center">
                            <img src="/jagedologo.png" alt="JaGedo Logo" className="h-12 mb-6" />
                            <h2 className="text-2xl font-semibold text-[rgb(0,0,122)] mb-2">Sign Up</h2>
                        </div>
                        <div className="space-y-4">
                            <div className="flex flex-col items-center justify-center text-center">
                                <h2 className="text-2xl font-semibold">Enter Your Email</h2>
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
                                        onChange={(e) => updateFormData({ email: e.target.value })}
                                    />
                                </div>
                                {emailStatus === 'checking' && <p className="text-gray-500 text-sm flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Checking email...</p>}
                                {emailStatus === 'available' && <p className="text-green-600 text-sm flex items-center gap-1"><Check className="h-3 w-3" /> Email is available</p>}
                                {emailStatus === 'taken' && <p className="text-red-500 text-sm flex items-center gap-1">Email already registered</p>}
                            </div>
                            <div className="relative flex items-center my-8">
                                <div className="flex-grow border-t border-gray-300"></div>
                                <span className="mx-4 flex-shrink text-gray-400 text-sm">or</span>
                                <div className="flex-grow border-t border-gray-300"></div>
                            </div>
                            <GoogleSignIn />
                            <p className="text-gray-500">
                                By proceeding, you consent to receive calls, WhatsApp, or SMS messages, including automated means, from JaGedo and its affiliates to the provided number.
                            </p>
                        </div>
                    </div>
                );
            case 3:
                return (
                    <div className="xs:w-full xs:max-w-md xs:p-8 bg-white rounded-lg mx-auto p-0">
                        <div className="flex justify-center mb-6">
                            <img src="/jagedologo.png" alt="JaGedo Logo" className="h-12" />
                        </div>
                        <h2 className="text-2xl font-semibold text-[rgb(0,0,122)] text-center mb-2">Enter Your Phone Number</h2>
                        <p className="text-gray-500 text-center mb-6">We'll use this for verification and important updates</p>
                        <div className="space-y-4">
                            <div className="space-y-2 flex flex-col items-center">
                                <Label htmlFor="phone" className="text-gray-700 font-medium text-center">Phone number</Label>
                                <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden shadow-sm transition-all duration-200 focus-within:border-[rgb(0,0,122)] focus-within:ring-2 focus-within:ring-[rgb(0,0,122)]/20 focus-within:shadow-md w-[70%] mx-auto">
                                    <div className="px-3 py-3 bg-gray-50 text-gray-700 border-r border-gray-200 text-sm font-medium whitespace-nowrap">🇰🇪 +254</div>
                                    <input
                                        id="phone"
                                        type="tel"
                                        placeholder="7XX XXX XXX"
                                        className="flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none px-4 py-3"
                                        value={formData.phone}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            const cleanValue = value.replace(/\D/g, '').slice(0, 9);
                                            if (cleanValue.length > 0 && !/^[17]/.test(cleanValue)) { return; }
                                            updateFormData({ phone: cleanValue, fullPhoneNumber: `+254${cleanValue}` });
                                        }}
                                    />
                                </div>
                                <p className="text-xs text-gray-500 text-center">Enter your 9-digit phone number starting with 7 or 1</p>
                            </div>
                            {formData.fullPhoneNumber && (
                                <div className="mt-4 p-3 bg-gray-50 rounded-lg w-[70%] mx-auto text-center">
                                    <p className="text-sm text-gray-700">Full phone number:</p>
                                    <p className="font-medium">{formData.fullPhoneNumber}</p>
                                </div>
                            )}
                        </div>
                    </div>
                );
            case 4:
                return (
                    <div className="space-y-6 animate-fade-in">
                        <div className="space-y-4">
                            <div className="flex justify-center">
                                <img src="/jagedologo.png" alt="JaGedo Logo" className="h-12 mb-6" />
                            </div>
                            <h2 className="text-2xl font-semibold">Choose OTP Delivery Method</h2>
                            <div className="space-y-4">
                                <RadioGroup
                                    value={formData.otpMethod}
                                    onValueChange={(value) => updateFormData({ otpMethod: value })}
                                    className="flex flex-col items-center justify-center text-center"
                                >
                                    <label htmlFor="email-otp" className={`w-full max-w-xs sm:max-w-md border rounded-lg px-4 sm:px-6 md:px-10 py-3 cursor-pointer transition-all ${formData.otpMethod === "email" ? "border-[#00a63e] bg-[#00a63e]/5 shadow-md" : "border-gray-200 hover:border-gray-300"}`}>
                                        <RadioGroupItem value="email" id="email-otp" className="sr-only" />
                                        <div className="flex items-center gap-4">
                                            <div className={`rounded-full p-2 ${formData.otpMethod === "email" ? "bg-[#00a63e]/10" : "bg-gray-100"}`}>
                                                <Mail className={`h-5 w-5 sm:w-4 sm:h-4 ${formData.otpMethod === "email" ? "text-[#00a63e]" : "text-gray-500"}`} />
                                            </div>
                                            <div><span className={`block font-medium ${formData.otpMethod === "email" ? "text-[#00a63e]" : ""}`}>Email</span></div>
                                        </div>
                                    </label>
                                    <label htmlFor="phone-otp" className={`w-full max-w-xs sm:max-w-md border rounded-lg px-4 sm:px-6 md:px-10 py-3 cursor-pointer transition-all ${formData.otpMethod === "phone" ? "border-[#00a63e] bg-[#00a63e]/5 shadow-md" : "border-gray-200 hover:border-gray-300"}`}>
                                        <RadioGroupItem value="phone" id="phone-otp" className="sr-only" />
                                        <div className="flex items-center gap-4">
                                            <div className={`rounded-full p-2 ${formData.otpMethod === "phone" ? "bg-[#00a63e]/10" : "bg-gray-100"}`}>
                                                <Phone className={`h-5 w-5 sm:w-4 sm:h-4 ${formData.otpMethod === "phone" ? "text-[#00a63e]" : "text-gray-500"}`} />
                                            </div>
                                            <div><span className={`block font-medium ${formData.otpMethod === "phone" ? "text-[#00a63e]" : ""}`}>Phone</span></div>
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
                            <div className="flex justify-center">
                                <img src="/jagedologo.png" alt="JaGedo Logo" className="h-12 mb-6" />
                            </div>
                            <h2 className="text-xl font-semibold">Enter verification code</h2>
                            <p className="text-gray-500">We've sent a 6-digit code to your {formData.otpMethod === "email" ? "email" : "phone"}</p>
                            <div className="space-y-2">
                                <div className="relative">
                                    <Input
                                        id="otp"
                                        type="text"
                                        placeholder="6-digit code"
                                        maxLength={6}
                                        className="text-center text-lg tracking-widest"
                                        value={formData.otp}
                                        onChange={(e) => {
                                            const value = e.target.value.replace(/\D/g, "");
                                            updateFormData({ otp: value });
                                        }}
                                        disabled={isAutoVerifying}
                                    />
                                    {isAutoVerifying && (
                                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                            <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
                                        </div>
                                    )}
                                </div>
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
                                            disabled={isSubmitting || isAutoVerifying}
                                        >
                                            Resend
                                        </button>
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                );
            case 6:
                return (
                    <div className="space-y-6 animate-fade-in max-w-md mx-auto">
                        <div className="flex flex-col items-center justify-center text-center">
                            <img src="/jagedologo.png" alt="JaGedo Logo" className="h-12 mb-4" />
                            <h2 className="text-2xl font-semibold text-[rgb(0,0,122)] mb-2">Security</h2>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        className="pr-10"
                                        value={formData.password}
                                        onChange={(e) => updateFormData({ password: e.target.value })}
                                    />
                                    {formData.password && formData.password.length >= 8 && (
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">✅</span>
                                    )}
                                    <button
                                        type="button"
                                        className="absolute right-10 top-1/2 -translate-y-1/2 text-gray-500"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>
                            </div>
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
                            <div className="space-y-1">
                                <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</Label>
                                <div className="relative">
                                    <Input
                                        id="confirmPassword"
                                        type={showConfirmPassword ? "text" : "password"}
                                        className="pr-10"
                                        value={formData.confirmPassword}
                                        onChange={(e) => updateFormData({ confirmPassword: e.target.value })}
                                    />
                                    {formData.confirmPassword && formData.password === formData.confirmPassword && (
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">✅</span>
                                    )}
                                    <button
                                        type="button"
                                        className="absolute right-10 top-1/2 -translate-y-1/2 text-gray-500"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    >
                                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4 mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
                            <input
                                type="checkbox"
                                id="terms"
                                checked={formData.agreeToTerms}
                                onChange={(e) => updateFormData({ agreeToTerms: e.target.checked })}
                                className="h-5 w-5 text-blue-800 focus:ring-blue-800 border-gray-300 rounded cursor-pointer transition-colors duration-200 hover:border-blue-400"
                            />
                            <label htmlFor="terms" className="text-sm text-gray-700 leading-relaxed cursor-pointer select-none">
                                I agree to the{" "}
                                <a
                                    href="#"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-medium text-blue-800 underline hover:text-blue-900 hover:no-underline transition-colors duration-200"
                                >
                                    Terms Of Service
                                </a>
                                {" "}and{" "}
                                <a
                                    href="#"
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
                {currentStep !== 5 && (
                    <Button
                        type="submit"
                        className={`${isLastStep ? "bg-[#00a63e]" : "bg-[#00007a]"} hover:bg-opacity-90 min-w-[120px] text-white`}
                        disabled={isSubmitting ||
                            (currentStep === 2 && emailStatus === 'checking') ||
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