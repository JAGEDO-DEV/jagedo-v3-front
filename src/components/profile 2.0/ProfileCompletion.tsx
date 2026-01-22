/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Import your data/API hooks
import { getAllCountries } from "@/api/countries.api";
import { counties } from "@/pages/data/counties"; 

// Interfaces
interface ProfileCompletionProps {
    user: any;
    accountType: "INDIVIDUAL" | "ORGANIZATION";
    onComplete: (profileData: any) => void;
    onCancel?: () => void;
}

export function ProfileCompletion({
    user,
    accountType,
    onComplete,
    onCancel,
}: ProfileCompletionProps) {
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);

    // --- DATA LOADING STATES ---
    const [countries, setCountries] = useState<any[]>([]);
    const [isLoadingCountries, setIsLoadingCountries] = useState(true);

    // --- FORM STATES ---
    const [personalInfo, setPersonalInfo] = useState({
        firstName: user?.firstName || "",
        lastName: user?.lastName || "",
        idNumber: "",
        idType: "NATIONAL_ID",
        organizationName: user?.organizationName || "",
        contactFullName: "",
    });

    const [location, setLocation] = useState({
        country: "Kenya",
        county: "",
        subCounty: "",
        town: "", 
        estate: "",
    });

    const [reference, setReference] = useState({
        howDidYouHearAboutUs: "",
        referralDetail: "",
    });

    const [secondaryContact, setSecondaryContact] = useState({
        contact: "",
        contactType: "PHONE",
        otp: "",
        isOtpSent: false,
        isVerified: false,
        isLoading: false,
    });

    // --- EFFECTS ---

    // 1. Fetch Countries on Mount
    useEffect(() => {
        const fetchCountries = async () => {
            try {
                const data = await getAllCountries();
                // @ts-ignore
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

    // 2. Determine Secondary Contact Method
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

        setSecondaryContact((prev) => ({
            ...prev,
            contactType: secondaryMethod,
            contact: contactValue || "",
        }));
    }, [user]);

    // --- HELPERS ---
    const countyList = location.country === "Kenya" ? Object.keys(counties) : [];
    const subCountyList = (location.country === "Kenya" && location.county) 
        ? counties[location.county as keyof typeof counties] || [] 
        : [];

    // --- VALIDATION ---
    const validateStep1 = (): boolean => {
        if (accountType === "INDIVIDUAL") {
            return (
                personalInfo.firstName.trim().length >= 2 &&
                personalInfo.lastName.trim().length >= 2 &&
                personalInfo.idNumber.trim().length >= 5
            );
        } else {
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
        const needsDetail = ["SOCIAL_MEDIA", "DIRECT_REFERRAL", "OTHER"].includes(reference.howDidYouHearAboutUs);
        if (needsDetail) {
            return reference.howDidYouHearAboutUs.length > 0 && reference.referralDetail.trim().length >= 2;
        }
        return reference.howDidYouHearAboutUs.length > 0;
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

        if (currentStep < 4) {
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
            setTimeout(() => {
                toast.success(`OTP sent to ${secondaryContact.contact}`);
                setSecondaryContact((prev) => ({ ...prev, isOtpSent: true, isLoading: false }));
            }, 1000);
        } catch (error: any) {
            toast.error("Failed to send OTP.");
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
            setTimeout(() => {
                toast.success("Contact verified successfully!");
                setSecondaryContact((prev) => ({ ...prev, isVerified: true, isLoading: false }));
            }, 1000);
        } catch (error: any) {
            toast.error("OTP verification failed");
        } finally {
            setIsVerifying(false);
        }
    };

    const handleSubmit = async () => {
        if (!validateStep4()) {
            toast.error("Please verify your contact first.");
            return;
        }

        setIsSubmitting(true);
        try {
            const profileData = {
                ...personalInfo,
                ...location,
                ...reference,
                secondaryContactVerification: {
                    contact: secondaryContact.contact,
                    contactType: secondaryContact.contactType,
                    otp: secondaryContact.otp,
                },
            };
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
    };

    return (
        <div className="w-full min-h-screen bg-gray-50 py-8 font-roboto">
            <div className="max-w-2xl mx-auto px-4">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Complete Your Profile</h1>
                        <p className="text-gray-600 mt-2 text-sm">
                            Step {currentStep} of 4 • {
                                currentStep === 1 ? "Personal Information" :
                                currentStep === 2 ? "Location" :
                                currentStep === 3 ? "Source" :
                                "Verification"
                            }
                        </p>
                    </div>
                    {onCancel && (
                        <button onClick={handleCancel} className="text-gray-500 hover:text-gray-700">
                            <ArrowLeft className="h-6 w-6" />
                        </button>
                    )}
                </div>

                <div className="w-full bg-gray-200 rounded-full h-2 mb-8">
                    <div
                        className="bg-[rgb(0,0,122)] h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(currentStep / 4) * 100}%` }}
                    />
                </div>

                <div className="bg-white rounded-lg shadow-md p-8 mb-8">
                    {currentStep === 1 && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="flex justify-center mb-4">
                                <img src="/jagedologo.png" alt="JaGedo Logo" className="h-12" />
                            </div>
                            <h3 className="text-xl font-semibold text-[rgb(0,0,122)] text-center mb-4">
                                Personal Details
                            </h3>
                            {accountType === "INDIVIDUAL" ? (
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
                                    <div className="space-y-2">
                                        <Label htmlFor="idType">ID Type *</Label>
                                        <Select
                                            value={personalInfo.idType}
                                            onValueChange={(value) => setPersonalInfo({ ...personalInfo, idType: value })}
                                        >
                                            <SelectTrigger className="w-full border-gray-300">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-white">
                                                <SelectItem value="NATIONAL_ID">National ID</SelectItem>
                                                <SelectItem value="PASSPORT">Passport</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="idNumber">ID Number *</Label>
                                        <Input
                                            id="idNumber"
                                            value={personalInfo.idNumber}
                                            onChange={(e) => setPersonalInfo({ ...personalInfo, idNumber: e.target.value.replace(/\D/g, "") })}
                                            placeholder="Enter ID Number"
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
                                        <Label htmlFor="contactFullName">Contact Person Full Name *</Label>
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
                        <div className="space-y-6 animate-fade-in">
                            <div className="flex justify-center mb-4">
                                <img src="/jagedologo.png" alt="JaGedo Logo" className="h-12" />
                            </div>
                            <h3 className="text-xl font-semibold text-[rgb(0,0,122)] text-center mb-4">
                                Location Information
                            </h3>

                            <div className="space-y-2">
                                <Label>Country *</Label>
                                <Select
                                    value={location.country}
                                    onValueChange={(value) => setLocation({ ...location, country: value, county: "", subCounty: "" })}
                                    disabled={isLoadingCountries}
                                >
                                    <SelectTrigger className="w-full border-gray-300 h-auto py-3">
                                        <SelectValue placeholder={isLoadingCountries ? "Loading..." : "Select Country"} />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white">
                                        {Array.from(new Set(countries.map((c: any) => c.name))).map((countryName: any) => (
                                            <SelectItem key={countryName} value={countryName}>{countryName}</SelectItem>
                                        ))}
                                        {!countries.length && <SelectItem value="Kenya">Kenya</SelectItem>}
                                    </SelectContent>
                                </Select>
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
                                        <SelectContent className="bg-white h-60">
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
                                        <SelectContent className="bg-white h-60">
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
                        <div className="space-y-6 animate-fade-in">
                            <div className="flex justify-center mb-4">
                                <img src="/jagedologo.png" alt="JaGedo Logo" className="h-12" />
                            </div>
                            <h3 className="text-xl font-semibold text-[rgb(0,0,122)] text-center mb-4">
                                Reference Information
                            </h3>
                            <div className="space-y-2">
                                <Label>How did you hear about us? *</Label>
                                <Select
                                    value={reference.howDidYouHearAboutUs}
                                    onValueChange={(value) => setReference({ howDidYouHearAboutUs: value })}
                                >
                                    <SelectTrigger className="w-full border-gray-300 py-3 h-auto">
                                        <SelectValue placeholder="Select an option" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white">
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
                                        {reference.howDidYouHearAboutUs === "SOCIAL_MEDIA" ? "Which platform?" :
                                         reference.howDidYouHearAboutUs === "DIRECT_REFERRAL" ? "Who referred you?" :
                                         "Please specify"} *
                                    </Label>
                                    <Input
                                        value={reference.referralDetail}
                                        onChange={(e) => setReference({ ...reference, referralDetail: e.target.value })}
                                        placeholder="Enter details..."
                                        className="w-full border-gray-300"
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {currentStep === 4 && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="flex justify-center mb-4">
                                <img src="/jagedologo.png" alt="JaGedo Logo" className="h-12" />
                            </div>
                            <h3 className="text-xl font-semibold text-[rgb(0,0,122)] text-center mb-4">
                                Verify Secondary Contact
                            </h3>
                            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <p className="text-sm text-blue-800">
                                    Verify your <strong>{secondaryContact.contactType}</strong> to complete profile setup.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label>
                                    {secondaryContact.contactType === "EMAIL" ? "Email Address" : "Phone Number"}
                                </Label>
                                <Input
                                    value={secondaryContact.contact}
                                    onChange={(e) => setSecondaryContact({...secondaryContact, contact: e.target.value})}
                                    placeholder={`Enter your ${secondaryContact.contactType.toLowerCase()}`}
                                    className="w-full border-gray-300"
                                />
                            </div>

                            {!secondaryContact.isOtpSent ? (
                                <Button onClick={handleSendOtp} disabled={secondaryContact.isLoading} className="w-full bg-[rgb(0,0,122)] text-white">
                                    {secondaryContact.isLoading ? "Sending..." : "Send OTP"}
                                </Button>
                            ) : (
                                <>
                                    <div className="space-y-2">
                                        <Label>Enter OTP</Label>
                                        <Input
                                            value={secondaryContact.otp}
                                            onChange={(e) => setSecondaryContact({ ...secondaryContact, otp: e.target.value })}
                                            placeholder="6-digit code"
                                            maxLength={6}
                                            className="text-center text-lg tracking-widest border-gray-300"
                                        />
                                    </div>
                                    <Button 
                                        onClick={handleVerifyOtp} 
                                        disabled={secondaryContact.isVerified || isVerifying}
                                        className={`w-full ${secondaryContact.isVerified ? "bg-green-600" : "bg-[rgb(0,0,122)]"} text-white`}
                                    >
                                        {secondaryContact.isVerified ? "Verified ✓" : (isVerifying ? "Verifying..." : "Verify OTP")}
                                    </Button>
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
                        className="flex-1"
                    >
                        Back
                    </Button>
                    {currentStep < 4 ? (
                        <Button onClick={handleNextStep} className="flex-1 bg-[rgb(0,0,122)] text-white hover:bg-opacity-90">
                            Next
                        </Button>
                    ) : (
                        <Button 
                            onClick={handleSubmit} 
                            disabled={isSubmitting || !secondaryContact.isVerified}
                            className="flex-1 bg-green-600 text-white hover:bg-green-700"
                        >
                            {isSubmitting ? "Completing..." : "Complete Profile"}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ProfileCompletion;