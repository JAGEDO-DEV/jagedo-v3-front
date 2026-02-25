/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/ban-ts-comment */
//@ts-nocheck
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from "react"
import { Eye, EyeOff, Mail, Phone, Loader2, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { toast, Toaster } from "sonner"
import { verifyOtp, verifyEmail } from "@/api/auth.api"
import GoogleSignIn from "@/components/GoogleSignIn";
import { cn } from "@/lib/utils";
import { startupSnapshot } from "node:v8"
interface CustomerSignupFormProps {
  currentStep: number
  formData: any
  updateFormData: (data: any) => void
  nextStep: () => void
  prevStep: () => void
  handleSubmit: () => void
  handleInitiateRegistration: () => Promise<void>
  handleResendOtp: () => Promise<void>
}

export function CustomerSignupForm({
  currentStep,
  formData,
  updateFormData,
  nextStep,
  prevStep,
  handleSubmit,
  handleInitiateRegistration,
  handleResendOtp,
}: CustomerSignupFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [isOtpVerified, setIsOtpVerified] = useState(false)
  const [otpTimer, setOtpTimer] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [hasInitialOtpBeenSent, setHasInitialOtpBeenSent] = useState(false);
  const [emailStatus, setEmailStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const lastVerifiedOtp = useRef<string>("");


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
    let interval: NodeJS.Timeout | null = null;

    if (timerActive && otpTimer > 0) {
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



  const validateStep = () => {
    const newErrors: Record<string, string> = {}

    switch (currentStep) {
      case 1:
        if (!formData.accountType) {
          newErrors.accountType = "Please select an account type"
        }
        break;

      case 2:
        if (!formData.email) {
          newErrors.email = "Email is required"
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
          newErrors.email = "Please enter a valid email address"
        }
        break
      case 3:
        if (!formData.phone) {
          newErrors.phone = "Phone number is required"
        } else if (!/^\+?[0-9]{9}$/.test(formData.phone.replace(/\s/g, ""))) {
          newErrors.phone = "Please enter a valid phone number"
        }
        break
      case 4:
        if (!formData.otpMethod) {
          newErrors.otpMethod = "Please select a verification method"
        }
        break
      case 5:
        if (!formData.otp) {
          newErrors.otp = "Please enter the verification code"
        } else if (formData.otp.length !== 6 || !/^\d+$/.test(formData.otp)) {
          newErrors.otp = "Please enter a valid 6-digit code"
        }
        break
      case 6:
        if (!formData.password) {
          newErrors.password = "Password is required"
        } else if (formData.password.length < 8) {
          newErrors.password = "Password must be at least 8 characters"
        }
        if (!formData.confirmPassword) {
          newErrors.confirmPassword = "Please confirm your password"
        } else if (formData.password !== formData.confirmPassword) {
          newErrors.confirmPassword = "Passwords do not match"
        }
        break;
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

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
    } else {
      toast.error("Please complete all required fields");
    }
  };

  const handleFormSubmit = () => {
    if (validateStep()) {
      setIsSubmitting(true)


      handleSubmit()






    }
  }

  const handleGoogleSignIn = () => {
    setIsGoogleLoading(true)

    setTimeout(() => {
      updateFormData({
        email: "user@example.com",
        firstName: "John",
        lastName: "Doe",
      })
      nextStep()
      setIsGoogleLoading(false)
    }, 1500)
  }

  const handleSendOTP = async () => {
    setIsSubmitting(true)

    if (!formData.accountType) {
      toast.error("Please select an account type")
      setIsSubmitting(false)
      return
    }
    if (!formData.otpMethod) {
      toast.error("Please select a verification method")
      setIsSubmitting(false)
      return
    }
    if (!formData.email && !formData.phone) {
      toast.error("Please enter your email or phone number")
      setIsSubmitting(false)
      return
    }

    try {
      await handleInitiateRegistration()

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
      setIsSubmitting(false)
    }
  }


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
    setIsSubmitting(true)
    const otpToVerify = otpValue || formData.otp;

    if (otpToVerify.length !== 6) {
      toast.error("Invalid OTP length");
      setIsSubmitting(false);
      setIsVerifyingOtp(false);
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
        setIsSubmitting(false);
        setIsVerifyingOtp(false);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error verifying OTP");
      setIsVerifyingOtp(false);
    } finally {
      setIsSubmitting(false);
    }
  }


  useEffect(() => {
    setIsOtpVerified(false)
  }, [formData.otp, formData.otpMethod])

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="w-full">
            <div className="text-center mb-8 w-full">
              {/* Logo */}
              <div className="flex justify-center">
                <img
                  src="/jagedologo.png"
                  alt="JaGedo Logo"
                  className="h-12 mb-6"
                />
              </div>
              <h1 className="text-3xl font-bold text-center text-gray-800">Customer Sign Up</h1>
              <p className="text-lg my-4 font-semibold">Select Account Type</p>

              <div className="w-full mb-6">
                <div className="flex justify-between gap-2 sm:gap-4">
                  <button
                    type="button"
                    className={`py-2 px-6 w-1/2 text-black rounded-lg transition cursor-pointer ${formData.accountType === "INDIVIDUAL" ? "bg-[rgb(0,0,122)] text-white" : "bg-gray-300 opacity-75"
                      }`}
                    onClick={() => updateFormData({ accountType: "INDIVIDUAL" })}
                  >
                    Individual
                  </button>
                  <button
                    type="button"
                    className={`py-2 px-6 w-1/2 text-black rounded-lg transition cursor-pointer ${formData.accountType === "ORGANIZATION" ? "bg-[rgb(0,0,122)] text-white" : "bg-gray-300 opacity-75"
                      }`}
                    onClick={() => updateFormData({ accountType: "ORGANIZATION" })}
                  >
                    Organization
                  </button>
                </div>

                {/* Explanatory Text */}
                <div className="mt-4 text-gray-700 text-sm">
                  {formData.accountType === "INDIVIDUAL" && (
                    <p className="p-3 bg-gray-100 rounded-lg">
                      These are <span className="font-medium">Individuals</span> seeking construction services for personal projects e.g home renovations, repairs or new construction
                    </p>
                  )}
                  {formData.accountType === "ORGANIZATION" && (
                    <p className="p-3 bg-gray-100 rounded-lg">
                      Register as a <span className="font-medium"> group,business, corporation or institution</span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6 animate-fade-in">
            {/* Logo */}
            <div className="flex justify-center">
              <img
                src="/jagedologo.png"
                alt="JaGedo Logo"
                className="h-12 mb-6"
              />
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
                {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
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
              <p className="text-gray-500">By proceeding, you consent to receive calls, WhatsApp, or SMS messages, including automated means, from JaGedo and its affiliates to the provided number.</p>

            </div>
          </div>
        )

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
            <p className="text-gray-500 text-center mb-6">We'll use this for verification and important updates</p>

            {/* Phone Input Section */}
            <div className="space-y-4">
              <div className="space-y-2 flex flex-col items-center">
                <Label htmlFor="phone" className="text-sm font-medium text-gray-700 text-center">
                  Phone number
                </Label>

                <div
                  className={cn(
                    "flex h-10 items-center w-[70%] mx-auto rounded-md border bg-white px-3 shadow-sm transition-all duration-200",
                    "focus-within:border-[rgb(0,0,122)] focus-within:ring-2 focus-within:ring-[rgb(0,0,122)]/20",
                    errors.phone ? "border-red-500 focus-within:ring-red-500/20" : "border-gray-300"
                  )}
                >
                  {/* Country Code */}
                  <div className="flex items-center gap-2 pr-3 border-r border-gray-200 mr-3 select-none">
                    <span className="text-lg">🇰🇪</span>
                    <span className="text-sm font-medium text-gray-500">+254</span>
                  </div>

                  {/* Phone Number Input */}
                  <input
                    id="phone"
                    type="tel"
                    placeholder="7XX XXX XXX"
                    className="flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
                    value={formData.phone}
                    onChange={(e) => {
                      const value = e.target.value;
                      const cleanValue = value.replace(/\D/g, '').slice(0, 9);
                      if (cleanValue.length > 0 && !/^[17]/.test(cleanValue)) {
                        return;
                      }
                      updateFormData({
                        phone: cleanValue,
                        fullPhoneNumber: `+254${cleanValue}`
                      });
                    }}
                  />
                </div>

                {/* Error & Helper Text */}
                {errors.phone ? (
                  <p className="text-xs text-red-500 font-medium animate-in slide-in-from-top-1 text-center">
                    {errors.phone}
                  </p>
                ) : (
                  <p className="text-[11px] text-gray-500 text-center">
                    Format: 7XX... or 1XX... (do not include the first 0)
                  </p>
                )}
              </div>

              {formData.fullPhoneNumber && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg w-[70%] mx-auto text-center">
                  <p className="text-sm text-gray-700">Full phone number:</p>
                  <p className="font-medium">{formData.fullPhoneNumber}</p>
                </div>
              )}
            </div>
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
              <h2 className="text-2xl font-semibold">Choose OTP Delivery Method</h2>
              <div className="space-y-4">
                <RadioGroup
                  value={formData.otpMethod}
                  onValueChange={(value) => updateFormData({ otpMethod: value })}
                  className="flex flex-col items-center justify-center text-center w-full"
                >
                  {/* Email Option */}
                  <label
                    htmlFor="email-otp"
                    className={`w-full max-w-xs sm:max-w-md md:max-w-lg border rounded-lg px-6 py-3 cursor-pointer transition-all
        ${formData.otpMethod === "email"
                        ? "border-[#00a63e] bg-[#00a63e]/5 shadow-md"
                        : "border-gray-200 hover:border-gray-300"
                      }`}
                  >
                    <RadioGroupItem value="email" id="email-otp" className="sr-only" />
                    <div className="flex items-center gap-4">
                      <div
                        className={`rounded-full p-2 ${formData.otpMethod === "email" ? "bg-[#00a63e]/10" : "bg-gray-100"}`}
                      >
                        <Mail
                          className={`h-5 w-5 ${formData.otpMethod === "email" ? "text-[#00a63e]" : "text-gray-500"}`}
                        />
                      </div>
                      <div>
                        <span
                          className={`block font-medium ${formData.otpMethod === "email" ? "text-[#00a63e]" : ""}`}
                        >
                          Email
                        </span>
                      </div>
                    </div>
                  </label>

                  {/* Phone Option */}
                  <label
                    htmlFor="phone-otp"
                    className={`w-full max-w-xs sm:max-w-md md:max-w-lg border rounded-lg px-6 py-3 cursor-pointer transition-all
        ${formData.otpMethod === "phone"
                        ? "border-[#00a63e] bg-[#00a63e]/5 shadow-md"
                        : "border-gray-200 hover:border-gray-300"
                      }`}
                  >
                    <RadioGroupItem value="phone" id="phone-otp" className="sr-only" />
                    <div className="flex items-center gap-4">
                      <div
                        className={`rounded-full p-2 ${formData.otpMethod === "phone" ? "bg-[#00a63e]/10" : "bg-gray-100"}`}
                      >
                        <Phone
                          className={`h-5 w-5 ${formData.otpMethod === "phone" ? "text-[#00a63e]" : "text-gray-500"}`}
                        />
                      </div>
                      <div>
                        <span
                          className={`block font-medium ${formData.otpMethod === "phone" ? "text-[#00a63e]" : ""}`}
                        >
                          Phone
                        </span>
                      </div>
                    </div>
                  </label>
                </RadioGroup>

                {errors.otpMethod && (
                  <p className="text-red-500 text-sm">{errors.otpMethod}</p>
                )}
              </div>

            </div>
          </div>
        )

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
              <h2 className="text-xl font-semibold">Enter verification code</h2>
              <p className="text-gray-500">We've sent a 6-digit code to your {formData.otpMethod === "email" ? "email" : "phone"}</p>

              <div className="space-y-2">
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

                    if (value.length < 6) {
                      lastVerifiedOtp.current = "";
                    }

                    if (value.length === 6 && !isVerifyingOtp && lastVerifiedOtp.current !== value) {
                      setIsVerifyingOtp(true);
                      lastVerifiedOtp.current = value;
                      setTimeout(() => handleVerifyOTP(value), 0);
                    }
                  }}
                />

                {errors.otp && <p className="text-red-500 text-sm">{errors.otp}</p>}

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

              </div>
            </div>
          </div>
        )
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
              <h2 className="text-2xl font-semibold text-[rgb(0,0,122)] mb-2">Security</h2>
            </div>

            {/* Password Fields */}
            <div className="space-y-4">
              {/* Password Input */}
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
                {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}




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
                {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <p className="text-red-500 text-sm mt-1">Passwords do not match</p>
                )}
                {(errors.confirmPassword) && (<p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>)}
              </div>
            </div>

            {/* Terms Checkbox */}
            <div className="flex items-center space-x-4 mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
              <input
                type="checkbox"
                id="terms"
                checked={formData.agreeToTerms}
                onChange={(e) => updateFormData({ agreeToTerms: e.target.checked })}
                className="h-5 w-5 text-blue-800 focus:ring-blue-800 border-gray-300 rounded cursor-pointer transition-colors duration-200 hover:border-blue-400"
              />
              <label
                htmlFor="terms"
                className="text-sm text-gray-700 leading-relaxed cursor-pointer select-none"
              >
                I agree to the{" "}
                <a
                  href="/termsOfService"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-blue-800 underline hover:text-blue-900 hover:no-underline transition-colors duration-200"
                >
                  Terms Of Service
                </a>
                {" "}and{" "}
                <a
                  href="/privacyPolicy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-blue-800 underline hover:text-blue-900 hover:no-underline transition-colors duration-200"
                >
                  Data Privacy and Confidentiality Policy
                </a>
                .
              </label>
            </div >
          </div >
        )
      default:
        return null
    }
  }


  const isLastStep = currentStep === 6;


  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (isLastStep) {
          handleFormSubmit()
        } else {
          handleContinue()
        }
      }}
      className="space-y-8 max-w-[20rem] mx-auto"
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
            className={`${isLastStep ? "bg-[#00a63e]" : "bg-[#00007a]"} hover:bg-opacity-90 min-w-[120px] text-white`}
            disabled={isSubmitting || (currentStep === 2 && emailStatus === 'checking') || (currentStep === 2 && emailStatus === 'taken') || (currentStep === 3 && (!formData.phone)) || (isLastStep && (!formData.password || !formData.agreeToTerms))}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {isLastStep ? "Creating account..." : "Processing..."}
              </>
            ) : isLastStep ? (
              "Create account"
            ) : (
              "Next"
            )} <span>→</span>
          </Button>
        )}
      </div>
    </form>
  )
}