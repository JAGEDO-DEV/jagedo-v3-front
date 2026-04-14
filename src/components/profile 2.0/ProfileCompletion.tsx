/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/ban-ts-comment */
//@ts-nocheck
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Loader2, User, MapPin, MessageSquare, ShieldCheck, Check,LogOut  } from "lucide-react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { getAllCountries } from "@/api/countries.api";
import { counties } from "@/pages/data/counties";
import { initiateSecondaryVerification, verifySecondaryVerification } from "@/api/auth.api";
import { BUILDER_TYPE_LABELS } from "@/types/builder";
import { useNavigate } from "react-router-dom";

interface ProfileCompletionProps {
    user: any;
    accountType: "INDIVIDUAL" | "ORGANIZATION" | "CONTRACTOR" | "HARDWARE";
    userType?: "CUSTOMER" | "CONTRACTOR" | "FUNDI" | "PROFESSIONAL" | "HARDWARE";
    onComplete: (profileData: any) => void;
    onCancel?: () => void;
    isModal?: boolean;
}

const CUSTOMER_SERVICE_TYPES = ["FUNDI", "PROFESSIONAL", "CONTRACTOR", "HARDWARE"];

export function ProfileCompletion({
    user,
    accountType,
    userType,
    onComplete,
    onCancel,
    isModal = false,
}: ProfileCompletionProps) {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);

    const [countries, setCountries] = useState<any[]>([]);
    const [isLoadingCountries, setIsLoadingCountries] = useState(true);

    const totalSteps = 4;

    const [personalInfo, setPersonalInfo] = useState({
        firstName: user?.firstName || "",
        lastName: user?.lastName || "",
        idNumber: user?.idNumber || "",
        idType: user?.idType || "NATIONAL_ID",
        organizationName: user?.organizationName || "",
        contactFullName: user?.contactFullName || "",
    });

    const [location, setLocation] = useState({
        country: user?.country || "Kenya",
        county: user?.county || "",
        subCounty: user?.subCounty || "",
        town: user?.townCity || user?.town || "",
        estate: user?.estateVillage || user?.estate || "",
    });

    const [reference, setReference] = useState({
        howDidYouHearAboutUs: user?.referenceInfo || user?.howDidYouHearAboutUs || "",
        referralDetail: user?.referralDetail || "",
        socialMediaOther: user?.socialMediaOther || "",
        interestedServices: user?.interestedServices || [],
        otherService: user?.otherService || "",
    });

    const [secondaryContact, setSecondaryContact] = useState({
        contact: "",
        contactType: "PHONE",
        otp: "",
        isOtpSent: false,
        isVerified: false,
        isLoading: false,
        resendTimer: 10,
        canResend: false,
    });

    const isCustomerProfile =
        userType === "CUSTOMER" ||
        (!userType && (accountType === "INDIVIDUAL" || accountType === "ORGANIZATION"));

    useEffect(() => {
        const fetchCountries = async () => {
            try {
                const data = await getAllCountries();

                setCountries(data.hashSet || []);
            } catch (error) {
                console.error("Failed to fetch countries:", error);
                toast.error("Could not load country list.");
            } finally {
                setIsLoadingCountries(false);
            }
        };
        fetchCountries();
    }, []);

    useEffect(() => {
        if (!user) return;
        const signupMethod = localStorage.getItem("otpDeliveryMethod");
        let secondaryMethod = "PHONE";
        if (signupMethod) {
            secondaryMethod = signupMethod.toUpperCase() === "EMAIL" ? "PHONE" : "EMAIL";
        } else {
            if (user.email && !user.phone) secondaryMethod = "PHONE";
            else if (user.phone && !user.email) secondaryMethod = "EMAIL";
        }
        const contactValue = secondaryMethod === "PHONE" ? user?.phone : user?.email;
        const isAlreadyVerified = secondaryMethod === "PHONE" ? user?.phoneVerified : user?.emailVerified;

        setSecondaryContact((prev) => ({
            ...prev,
            contactType: secondaryMethod,
            contact: contactValue || "",
            isVerified: !!isAlreadyVerified,
        }));
    }, [user]);

    useEffect(() => {

        if (currentStep === 4 && totalSteps === 4 && !secondaryContact.isOtpSent) {
            handleSendOtp();
        }

    }, [currentStep, secondaryContact.isOtpSent, totalSteps]);
    const lastAttemptedOtp = useRef("");

    useEffect(() => {
        if (secondaryContact.otp.length < 6) {
            lastAttemptedOtp.current = "";
        }

        if (
            currentStep === 4 &&
            totalSteps === 4 &&
            secondaryContact.otp.length === 6 &&
            !secondaryContact.isVerified &&
            !isVerifying &&
            lastAttemptedOtp.current !== secondaryContact.otp
        ) {
            lastAttemptedOtp.current = secondaryContact.otp;
            handleVerifyOtp();
        }

    }, [secondaryContact.otp, currentStep, secondaryContact.isVerified, isVerifying, totalSteps]);

    useEffect(() => {
        if (!secondaryContact.isOtpSent || secondaryContact.canResend) return;

        const timer = setInterval(() => {
            setSecondaryContact((prev) => {
                if (prev.resendTimer <= 1) {
                    return {
                        ...prev,
                        resendTimer: 0,
                        canResend: true,
                    };
                }

                return {
                    ...prev,
                    resendTimer: prev.resendTimer - 1,
                };
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [secondaryContact.isOtpSent, secondaryContact.canResend]);





    const countyList = Object.keys(counties).sort();
    const subCountyList = location.county
        ? (counties as any)[location.county] || []
        : [];

    const isOrganizationType = accountType === "ORGANIZATION" || userType === "CONTRACTOR" || userType === "HARDWARE";
    const customerServiceOptions = CUSTOMER_SERVICE_TYPES.map(
        (builderType) => BUILDER_TYPE_LABELS[builderType]
    );
    const selectedInterestedService = reference.interestedServices[0] || "";
    const selectedInterestedServiceValue =
        selectedInterestedService === "Other"
            ? "Other"
            : customerServiceOptions.find((option) => option === selectedInterestedService)
                || customerServiceOptions.find((option) => selectedInterestedService.startsWith(`${option}:`))
                || selectedInterestedService;


    const validateStep1 = (): boolean => {
        if (!isOrganizationType) {
            return (
                personalInfo.firstName.trim().length >= 2 &&
                personalInfo.lastName.trim().length >= 2
            );
        }
        else {
            return (
                personalInfo.organizationName.trim().length >= 3 &&
                personalInfo.contactFullName.trim().length >= 3
            );
        }
    };

    const validateStep2 = (): boolean => {
        if (location.country === "Kenya") {
            return (
                !!location.county &&
                !!location.subCounty &&
                location.town.trim().length >= 2 &&
                location.estate.trim().length >= 2
            );
        }
        return location.country.length > 0 && location.town.length > 0;
    };


    const validateStep3 = (): boolean => {
        if (!reference.howDidYouHearAboutUs) return false;

        if (["SOCIAL_MEDIA", "DIRECT_REFERRAL", "OTHER"].includes(reference.howDidYouHearAboutUs)) {
            if (reference.referralDetail.trim().length < 2) return false;
        }

        if (isCustomerProfile) {
            if (reference.interestedServices.length === 0) return false;


            if (reference.interestedServices.includes("Other")) {
                if (!reference.otherService?.trim()) return false;
            }
        }

        return true;
    };


    const validateStep4 = (): boolean => {
        return secondaryContact.isVerified;
    };

    const handleNextStep = () => {
        let isValid = false;
        switch (currentStep) {
            case 1: isValid = validateStep1(); break;
            case 2: isValid = validateStep2(); break;
            case 3: isValid = validateStep3(); break;
            case 4: isValid = validateStep4(); break;
        }
        if (!isValid) {
            toast.error("Please fill in all required fields correctly.");
            return;
        }
        if (currentStep < totalSteps) {
            setCurrentStep((prev) => prev + 1);
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    const handlePreviousStep = () => {
        if (currentStep > 1) {
            setCurrentStep((prev) => prev - 1);
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    const handleSendOtp = async () => {
        if (!secondaryContact.contact) {
            toast.error(`Please enter a valid ${secondaryContact.contactType.toLowerCase()}`);
            return;
        }
        setSecondaryContact((prev) => ({ ...prev, isLoading: true }));
        try {
            const payload: any = {
                otpDeliveryMethod: secondaryContact.contactType,
            };

            if (secondaryContact.contactType === "EMAIL") {
                payload.email = secondaryContact.contact;
                payload.phoneNumber = user.phone || "";
            } else {
                payload.email = user.email || "";
                payload.phoneNumber = secondaryContact.contact;
            }

            const response = await initiateSecondaryVerification(payload);

            if (response.data.success) {
                const message = secondaryContact.contactType === "EMAIL"
                    ? `OTP sent to ${secondaryContact.contact}. Please Also Check your email spam folder`
                    : `OTP sent to ${secondaryContact.contact}. Check SMS`;
                toast.success(message);
                setSecondaryContact((prev) => ({
                    ...prev,
                    isOtpSent: true,
                    isLoading: false,
                    otp: "",
                    resendTimer: 10,
                    canResend: false,
                }));
            } else {
                toast.error(response.data.message || "Failed to send OTP.");
                setSecondaryContact((prev) => ({ ...prev, isLoading: false }));
            }
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.message || "Failed to send OTP.");
            setSecondaryContact((prev) => ({ ...prev, isLoading: false }));
        }
    };

    const handleVerifyOtp = async () => {
        if (secondaryContact.otp.length !== 6) {
            toast.error("OTP must be 6 digits");
            return;
        }
        setIsVerifying(true);
        try {
            const payload: any = {
                otp: secondaryContact.otp,
            };

            if (secondaryContact.contactType === "EMAIL") {
                payload.email = secondaryContact.contact;
                payload.phoneNumber = user.phone || "";
            } else {
                payload.email = user.email || "";
                payload.phoneNumber = secondaryContact.contact;
            }

            const response = await verifySecondaryVerification(payload);

            if (response.data.success) {
                toast.success("Contact verified successfully!");
                setSecondaryContact((prev) => ({ ...prev, isVerified: true, isLoading: false }));
            } else {
                toast.error(response.data.message || "Invalid OTP");
            }
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.message || "OTP verification failed");
        } finally {
            setIsVerifying(false);
        }
    };

    const handleSubmit = async () => {
        if (totalSteps === 4 && !secondaryContact.isVerified) {
            toast.error("Please verify your contact first.");
            return;
        }
        setIsSubmitting(true);
        try {
            const { firstName, lastName, organizationName, contactFullName, ...restPersonalInfo } = personalInfo;
            const nameFields = isOrganizationType
                ? { organizationName, contactFullName }
                : { firstName, lastName };

            const profileData = {
                ...restPersonalInfo,
                ...nameFields,
                ...location,
                ...reference,
                redirectTo: "/profile"
            };

            console.log("FINAL PROFILE DATA IN MODAL SUBMIT:", profileData);

            await onComplete(profileData);
        } catch (error) {
            console.error(error);
            toast.error("Error completing profile");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        if (onCancel) {
            onCancel();
        }
        window.location.href = import.meta.env.VITE_APP_URL;
    };

    const baseStepInfo = [
        { icon: User, label: isOrganizationType ? "Organization" : "Personal" },
        { icon: MapPin, label: "Location" },
        { icon: MessageSquare, label: "Source" },
        { icon: ShieldCheck, label: "Verify" }
    ];

    const stepInfo = baseStepInfo;


    const socialPlatforms = [
        "Facebook",
        "Instagram",
        "Twitter / X",
        "TikTok",
        "WhatsApp",
        "YouTube",
        "LinkedIn",
        "Other",
    ];


    return (
        <div className={cn("w-full font-roboto", isModal ? "!bg-transparent p-0" : "min-h-screen w-screen !bg-white py-8")} style={isModal ? { backgroundColor: 'transparent' } : { backgroundColor: 'white' }}>
            <div className={cn("mx-auto", isModal ? "w-full p-6" : "max-w-2xl px-4")}>
                
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className={cn("font-bold text-gray-800", isModal ? "text-2xl" : "text-3xl")}>
                            Complete Your Profile
                        </h1>
                        <p className="text-gray-500 mt-1 text-sm font-medium">
                            Step {currentStep} of {totalSteps} • {stepInfo[currentStep - 1].label}
                        </p>
                    </div>
                    {onCancel && (
                        <button
                            onClick={() => navigate("/")}
                            className="p-2 rounded-md justify-between flex items-center bg-gray-200 hover:bg-gray-200 text-gray-700 hover:text-gray-700 transition-all duration-200"
                        >
                           <LogOut className="h-4 w-4 mr-3" /> Log out 
                        </button>
                    )}
                </div>

                
                <div className="flex items-center justify-between mb-6 px-2">
                    {stepInfo.map((step, index) => {
                        const StepIcon = step.icon;
                        const stepNumber = index + 1;
                        const isCompleted = currentStep > stepNumber;
                        const isCurrent = currentStep === stepNumber;
                        return (
                            <div key={index} className="flex items-center flex-1">
                                <div className="flex flex-col items-center">
                                    <div className={cn(
                                        "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
                                        isCompleted ? "bg-green-500 text-white" :
                                            isCurrent ? "bg-blue-600 text-white ring-4 ring-blue-100" :
                                                "bg-gray-100 text-gray-400"
                                    )}>
                                        {isCompleted ? <Check className="h-5 w-5" /> : <StepIcon className="h-5 w-5" />}
                                    </div>
                                    <span className={cn(
                                        "text-xs mt-1.5 font-medium transition-colors",
                                        isCurrent ? "text-blue-600" :
                                            isCompleted ? "text-green-600" : "text-gray-400"
                                    )}>
                                        {step.label}
                                    </span>
                                </div>
                                {index < stepInfo.length - 1 && (
                                    <div className={cn(
                                        "flex-1 h-0.5 mx-2 rounded transition-colors duration-300",
                                        currentStep > stepNumber ? "bg-green-400" : "bg-gray-200"
                                    )} />
                                )}
                            </div>
                        );
                    })}
                </div>

                
                <div className="w-full bg-gray-200 rounded-full h-1.5 mb-6 overflow-hidden">
                    <div
                        className="bg-blue-600 h-1.5 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                    />
                </div>

                <div className="bg-white rounded-xl shadow-md border border-gray-200 p-8 mb-6">
                    {currentStep === 1 && (
                        <div className="space-y-5 animate-fade-in">
                            <div className="text-center mb-6">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-50 mb-4">
                                    <User className="h-8 w-8 text-blue-600" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-800">
                                    {isOrganizationType ? "Organization Details" : "Personal Details"}
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">{isOrganizationType ? "Tell us about your organization" : "Tell us about yourself"}</p>
                            </div>
                            {!isOrganizationType ? (
                                <>
                                    <div className="space-y-2">
                                        <Label htmlFor="firstName">First Name *</Label>
                                        <Input
                                            id="firstName"
                                            value={personalInfo.firstName}
                                            onChange={(e) => setPersonalInfo({ ...personalInfo, firstName: e.target.value })}
                                            className="w-full border-gray-300"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="lastName">Last Name *</Label>
                                        <Input
                                            id="lastName"
                                            value={personalInfo.lastName}
                                            onChange={(e) => setPersonalInfo({ ...personalInfo, lastName: e.target.value })}
                                            className="w-full border-gray-300"
                                        />
                                    </div>
                                </>
                            ) : (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="orgName">Organization Name *</Label>
                                        <Input
                                            id="orgName"
                                            value={personalInfo.organizationName}
                                            onChange={(e) => setPersonalInfo({ ...personalInfo, organizationName: e.target.value })}
                                            className="w-full border-gray-300"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="contactFullName">Contact Person *</Label>
                                        <Input
                                            id="contactFullName"
                                            value={personalInfo.contactFullName}
                                            onChange={(e) => setPersonalInfo({ ...personalInfo, contactFullName: e.target.value })}
                                            className="w-full border-gray-300"
                                            placeholder="Enter full name"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {currentStep === 2 && (
                        <div className="space-y-5 animate-fade-in">
                            <div className="text-center mb-6">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-50 mb-4">
                                    <MapPin className="h-8 w-8 text-emerald-600" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-800">
                                    Location Information
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">Where are you based?</p>
                            </div>
                            <div className="space-y-2">
                                <Label>Country *</Label>
                                <div className="w-full border border-gray-300 py-3 px-3 rounded-md bg-gray-50 flex items-center gap-2">
                                    <div className="kenyanimg">
                                        <img
                                            src="/src/assets/kenyan flag.png"
                                            alt="Kenya Flag"
                                            height="10"
                                            width="30"
                                        />
                                    </div>
                                    <span className="text-gray-700 font-medium">Kenya</span>
                                </div>

                            </div>
                            {location.country === "Kenya" && (
                                <div className="space-y-2">
                                    <Label>County *</Label>
                                    <Select
                                        value={location.county}
                                        onValueChange={(value) => setLocation({ ...location, county: value, subCounty: "" })}
                                    >
                                        <SelectTrigger className="w-full border-gray-300 h-auto py-3">
                                            <SelectValue placeholder="Select County" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white h-60 scrollbar-hide">
                                            {countyList.map((c) => (
                                                <SelectItem key={c} value={c}>{c}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                            {location.country === "Kenya" && location.county && (
                                <div className="space-y-2">
                                    <Label>Sub-County *</Label>
                                    <Select
                                        value={location.subCounty}
                                        onValueChange={(value) => setLocation({ ...location, subCounty: value })}
                                    >
                                        <SelectTrigger className="w-full border-gray-300 h-auto py-3">
                                            <SelectValue placeholder="Select Sub-County" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white h-60 scrollbar-hide">
                                            {subCountyList.map((sc) => (
                                                <SelectItem key={sc} value={sc}>{sc}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                            <div className="space-y-2">
                                <Label>Town/City *</Label>
                                <Input
                                    value={location.town}
                                    onChange={(e) => setLocation({ ...location, town: e.target.value })}
                                    placeholder="Enter Town or City"
                                    className="w-full border-gray-300 py-3"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Estate/Village *</Label>
                                <Input
                                    value={location.estate}
                                    onChange={(e) => setLocation({ ...location, estate: e.target.value })}
                                    placeholder="Enter Estate or Village"
                                    className="w-full border-gray-300 py-3"
                                />
                            </div>
                        </div>
                    )}

                    {currentStep === 3 && (
                        <div className="space-y-5 animate-fade-in">
                            
                            <div className="text-center mb-6">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-purple-50 mb-4">
                                    <MessageSquare className="h-8 w-8 text-violet-600" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-800">Reference Information</h3>
                                <p className="text-sm text-gray-500 mt-1">How did you find us?</p>
                            </div>

                            
                            <div className="space-y-2">
                                <Label>How did you hear about us? *</Label>
                                <Select
                                    value={reference.howDidYouHearAboutUs}
                                    onValueChange={(value) =>
                                        setReference({ ...reference, howDidYouHearAboutUs: value, referralDetail: "" })
                                    }
                                >
                                    <SelectTrigger className="w-full border-gray-300 py-3 h-auto">
                                        <SelectValue placeholder="Select an option" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white scrollbar-hide">
                                        <SelectItem value="SEARCH_ENGINE">Search Engine (Google, Bing)</SelectItem>
                                        <SelectItem value="SOCIAL_MEDIA">Social Media</SelectItem>
                                        <SelectItem value="WORD_OF_MOUTH">Word of Mouth</SelectItem>
                                        <SelectItem value="ADVERTISEMENT">Advertisement</SelectItem>
                                        <SelectItem value="DIRECT_REFERRAL">Direct Referral</SelectItem>
                                        <SelectItem value="OTHER">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            
                            {["SOCIAL_MEDIA", "DIRECT_REFERRAL", "OTHER"].includes(reference.howDidYouHearAboutUs) && (
                                <div className="space-y-2 animate-fade-in">
                                    <Label>
                                        {reference.howDidYouHearAboutUs === "SOCIAL_MEDIA"
                                            ? "Which platform did you see us on?"
                                            : reference.howDidYouHearAboutUs === "DIRECT_REFERRAL"
                                                ? "Who referred you?"
                                                : "Please specify the platform you saw us on"} *
                                    </Label>

                                    {reference.howDidYouHearAboutUs === "SOCIAL_MEDIA" ? (
                                        <Select
                                            value={reference.referralDetail}
                                            onValueChange={(value) => setReference({ ...reference, referralDetail: value })}
                                        >
                                            <SelectTrigger className="w-full border-gray-300 py-3 h-auto">
                                                <SelectValue placeholder="Select social platform" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-white scrollbar-hide">
                                                {socialPlatforms.map((platform) => (
                                                    <SelectItem key={platform} value={platform}>
                                                        {platform}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <Input
                                            value={reference.referralDetail}
                                            onChange={(e) => setReference({ ...reference, referralDetail: e.target.value })}
                                            placeholder="Enter details..."
                                            className="w-full border-gray-300"
                                        />
                                    )}

                                    {reference.howDidYouHearAboutUs === "SOCIAL_MEDIA" &&
                                        reference.referralDetail === "Other" && (
                                            <div className="space-y-2 mt-2">
                                                <Label>Please specify *</Label>
                                                <Input
                                                    value={reference.socialMediaOther}
                                                    onChange={(e) =>
                                                        setReference({ ...reference, socialMediaOther: e.target.value })
                                                    }
                                                    placeholder="Please specify the social media platform"
                                                    className="w-full border-gray-300"
                                                />
                                            </div>
                                        )}
                                </div>
                            )}

                            
                            {isCustomerProfile && (

                                    <div className="space-y-2 mt-6 animate-fade-in">
                                        <Label>What services are you interested in? *</Label>
                                        <Select
                                            value={selectedInterestedServiceValue}
                                            onValueChange={(value) =>
                                                setReference({
                                                    ...reference,
                                                    interestedServices: [value],
                                                    otherService: value === "Other" ? reference.otherService : "",
                                                })
                                            }
                                        >
                                            <SelectTrigger className="w-full border-gray-300 py-3 h-auto">
                                                <SelectValue placeholder="Select a service type" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-white scrollbar-hide">
                                                {customerServiceOptions.map((serviceType) => (
                                                    <SelectItem key={serviceType} value={serviceType}>
                                                        {serviceType}
                                                    </SelectItem>
                                                ))}
                                                <SelectItem value="Other">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        
                                        {reference.interestedServices.includes("Other") && (
                                            <div className="mt-3 space-y-2">
                                                <Label>Please specify the other service *</Label>
                                                <Input
                                                    value={reference.otherService}
                                                    onChange={(e) =>
                                                        setReference({ ...reference, otherService: e.target.value })
                                                    }
                                                    placeholder="Enter the specific service you're looking for"
                                                    className="w-full border-gray-300"
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}
                        </div>
                    )}

                    {currentStep === 4 && (
                        <div className="space-y-5 animate-fade-in">
                            
                            <div className="text-center mb-6">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-50 mb-4">
                                    <ShieldCheck className="h-8 w-8 text-amber-600" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-800">
                                    Verify Your <strong className="font-semibold">{secondaryContact.contactType === "EMAIL" ? "Email " : "Phone number"}</strong>
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">One last step to secure your account</p>
                            </div>
                            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                                <p className="text-sm text-blue-700 text-center">
                                    Verify your <strong className="font-semibold">{secondaryContact.contactType === "EMAIL" ? "email address" : "phone number"}</strong> to complete profile setup.
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label>
                                    {secondaryContact.contactType === "EMAIL" ? "Email Address" : "Phone Number"}
                                </Label>
                                <Input
                                    value={secondaryContact.contact}
                                    onChange={(e) => setSecondaryContact({ ...secondaryContact, contact: e.target.value })}
                                    readOnly={!!(secondaryContact.contactType === "EMAIL" ? user?.email : user?.phone)}
                                    placeholder={`Your ${secondaryContact.contactType.toLowerCase()}`}
                                    className={`w-full border-gray-300 ${!!(secondaryContact.contactType === "EMAIL" ? user?.email : user?.phone) ? "bg-gray-100 cursor-not-allowed select-none" : ""}`}
                                />
                            </div>
                            {!secondaryContact.isOtpSent ? (
                                <Button
                                    onClick={handleSendOtp}
                                    disabled={secondaryContact.isLoading}
                                    className="w-full h-12 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-all duration-200"
                                >
                                    {secondaryContact.isLoading ? (
                                        <span className="flex items-center gap-2">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Sending...
                                        </span>
                                    ) : "Send Verification Code"}
                                </Button>
                            ) : (
                                <>
                                    <div className="space-y-2">
                                        <Label className="text-gray-700 font-medium">Enter OTP</Label>
                                        <Input
                                            value={secondaryContact.otp}
                                            onChange={(e) => setSecondaryContact({ ...secondaryContact, otp: e.target.value })}
                                            placeholder="• • • • • •"
                                            maxLength={6}
                                            className="text-center text-2xl tracking-[0.5em] border-gray-200 h-14 rounded-xl font-mono focus:border-blue-400 focus:ring-blue-100"
                                        />
                                    </div>
                                    {secondaryContact.isOtpSent && !secondaryContact.canResend && (
                                        <p className="text-center text-sm text-gray-500">
                                            Resend code in{" "}
                                            <span className="font-medium text-gray-700">
                                                {Math.floor(secondaryContact.resendTimer / 60)}:
                                                {String(secondaryContact.resendTimer % 60).padStart(2, "0")}
                                            </span>
                                        </p>
                                    )}
                                    {secondaryContact.canResend && (
                                        <div className="space-y-4 pt-2">
                                            <Button
                                                onClick={handleSendOtp}
                                                variant="outline"
                                                className="w-full h-12 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-all duration-200"
                                            >
                                                Resend Verification Code
                                            </Button>

                                            <div className="relative">
                                                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t border-gray-200" />
                                                <span className="relative z-10 mx-auto block w-max bg-white px-4 text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                    OR
                                                </span>
                                            </div>

                                            <Button
                                                variant="ghost"
                                                onClick={() => {
                                                    const newMethod = secondaryContact.contactType === "EMAIL" ? "PHONE" : "EMAIL";
                                                    const newContact = newMethod === "PHONE" ? user?.phone : user?.email;
                                                    if (!newContact) {
                                                        toast.error(`No ${newMethod.toLowerCase()} found in your profile to use as an alternative.`);
                                                        return;
                                                    }
                                                    setSecondaryContact(prev => ({
                                                        ...prev,
                                                        contactType: newMethod,
                                                        contact: newContact,
                                                        isOtpSent: false,
                                                        otp: "",
                                                        resendTimer: 10,
                                                        canResend: false
                                                    }));
                                                }}
                                                className="w-full text-blue-600 hover:text-blue-700 hover:bg-blue-50 text-sm font-semibold h-10 transition-all duration-200"
                                            >
                                                Try verifying using my {secondaryContact.contactType === "EMAIL" ? "phone number" : "email address"}
                                            </Button>
                                        </div>
                                    )}

                                    {secondaryContact.contactType === "EMAIL" && secondaryContact.isOtpSent && !secondaryContact.isVerified && (
                                        <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 animate-in fade-in slide-in-from-top-2 duration-500">
                                            <div className="flex gap-3">
                                                <ShieldCheck className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                                                <div className="space-y-1">
                                                    <p className="text-sm font-bold text-amber-900">Having trouble finding the code?</p>
                                                    <p className="text-xs text-amber-700 leading-relaxed">
                                                        Please check your <strong className="font-semibold underline">Spam</strong> or <strong className="font-semibold underline">Junk</strong> folder. Email providers sometimes flag automated codes erroneously.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}



                                    {isVerifying && (
                                        <div className="flex justify-center items-center gap-2 text-sm text-gray-500">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Verifying code...
                                        </div>
                                    )}

                                    {/* <Button
                                        onClick={handleVerifyOtp}
                                        disabled={secondaryContact.isVerified || isVerifying}
                                        className={cn(
                                            "w-full h-12 rounded-xl font-medium shadow-lg transition-all duration-200",
                                            secondaryContact.isVerified
                                                ? "bg-gradient-to-r from-green-500 to-emerald-600 shadow-green-500/25"
                                                : "bg-gradient-to-r from-[rgb(0,0,122)] to-blue-600 shadow-blue-500/25 hover:shadow-xl"
                                        )}
                                    >
                                        {secondaryContact.isVerified ? (
                                            <span className="flex items-center gap-2">
                                                <Check className="h-5 w-5" />
                                                Verified Successfully
                                            </span>
                                        ) : isVerifying ? (
                                            <span className="flex items-center gap-2">
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Verifying...
                                            </span>
                                        ) : "Verify OTP"}
                                    </Button> */}
                                </>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex gap-4">
                    <Button
                        onClick={handlePreviousStep}
                        disabled={currentStep === 1}
                        variant="outline"
                        className="flex-1 h-12 rounded-lg border border-gray-300 hover:border-gray-400 hover:bg-gray-50 font-medium transition-all duration-200 disabled:opacity-40"
                    >
                        Back
                    </Button>

                    {currentStep < totalSteps ? (
                        <Button
                            onClick={handleNextStep}
                            className="flex-1 h-12 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-all duration-200"
                        >
                            Continue
                        </Button>
                    ) : (
                        <Button
                            onClick={handleSubmit}
                            disabled={isSubmitting || !secondaryContact.isVerified}
                            className="flex-1 h-12 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 transition-all duration-200 disabled:opacity-50"
                        >
                            {isSubmitting ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Completing...
                                </span>
                            ) : "Complete Profile"}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ProfileCompletion;
