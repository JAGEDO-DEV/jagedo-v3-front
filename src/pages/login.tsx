/* eslint-disable */
// @ts-nocheck
import React, { useState, useEffect } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast, Toaster } from "sonner";
import { useNavigate } from "react-router-dom";
import { loginUser, verifyOtpLogin, phoneLogin } from "@/api/auth.api";
import { useGlobalContext } from "@/context/GlobalProvider";
import GoogleSignIn from "@/components/GoogleSignIn";

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isValidPhone = (phone) => /^\d{10}$/.test(phone);


const Button = ({ children, disabled, ...props }) => (
  <button
    disabled={disabled}
    className={`w-full h-12 rounded-lg bg-[#00007a] text-white font-medium ${disabled ? "opacity-50" : "hover:bg-[#00007a]/90"
      }`}
    {...props}
  >
    {children}
  </button>
);

const Input = (props) => (
  <input
    {...props}
    className="w-full h-12 px-4 border rounded-lg focus:ring-2 focus:ring-[#00007a]/50"
  />
);


export default function Login() {
  const navigate = useNavigate();
  const { setUser, setIsLoggedIn } = useGlobalContext();

  const [isOtpFlow, setIsOtpFlow] = useState(true);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpTimer, setOtpTimer] = useState(0);

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  useEffect(() => {
    if (!otpSent) return;
    if (otpTimer === 0) return;

    const interval = setInterval(() => {
      setOtpTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [otpSent, otpTimer]);



  const validateForm = () => {
    const errs = {};
    const phone = formData.email.replace(/\D/g, "");
    const email = formData.email.trim();

    if (!formData.email) {
      errs.email = isOtpFlow ? "Phone number is required" : "Phone number or email is required";
    }

    if (isOtpFlow) {
      if (!isValidPhone(phone)) {
        errs.email = "Enter a valid 10-digit phone number";
      }
      if (otpSent && !/^\d{6}$/.test(otp)) {
        errs.otp = "OTP must be 6 digits";
      }
    } else {
      if (!formData.password) {
        errs.password = "Password is required";
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };


  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    if (isOtpFlow) {


      if (!otpSent) {
        setIsLoading(true);
        const phoneNumber = formData.email.replace(/\D/g, "");

        try {

          const moddedPhoneNumber = phoneNumber.startsWith("254") ? phoneNumber : phoneNumber.startsWith('0') ? phoneNumber.replace("0", "254") : `254${phoneNumber}`

          await phoneLogin({ phoneNumber: moddedPhoneNumber });

          setOtpSent(true);
          setOtpTimer(120);
          toast.success("OTP sent to your phone");
        } catch (error) {
          console.error("Phone login error:", error);
          toast.error(error?.response?.data?.message || "Failed to send OTP");
        } finally {
          setIsLoading(false);
        }
        return;
      }


      if (otp.length !== 6) {
        toast.error("Enter 6-digit OTP");
        return;
      }

      setIsLoading(true);
      try {
        const phoneNumber = formData.email.replace(/\D/g, "");

        const moddedPhoneNumber = phoneNumber.startsWith("254") ? phoneNumber : phoneNumber.startsWith('0') ? phoneNumber.replace("0", "254") : `254${phoneNumber}`

        const response = await verifyOtpLogin({ phoneNumber: moddedPhoneNumber, otp });

        completeLoginWithApiResponse(response);
      } catch (error) {
        console.error("OTP verification error:", error);
        toast.error(error?.response?.data?.message || "Invalid OTP");
        setIsLoading(false);
      }
      return;
    }




    setIsLoading(true);
    try {
      const username = formData.email.trim();
      const password = formData.password;


      const response = await loginUser({
        username,
        password,
        firebaseToken: ""
      });


      completeLoginWithApiResponse(response);
    } catch (error) {
      console.error("Login error:", error);
      toast.error(error?.response?.data?.message || "Invalid credentials");
      setIsLoading(false);
    }
  };


  const handleGoogleSuccess = (googleUser) => {
    setIsGoogleLoading(true);

    /**
     * Expected googleUser shape:
     * {
     *   email,
     *   name,
     *   picture,
     *   sub (google id)
     * }
     */

    const user = {
      userType: "customer",
      email: googleUser.email,
      name: googleUser.name,
      avatar: googleUser.picture,
      googleId: googleUser.sub,
      authType: "google",
    };

    setTimeout(() => {
      completeLogin(user);
      setIsGoogleLoading(false);
    }, 800);
  };

  const completeLogin = (username, password) => {
    const user = MOCK_USERS.find(
      (u) => u.username === username && u.password === password
    );

    if (!user) {
      toast.error("Invalid credentials");
      return;
    }

    const key = username.split("@")[0];
    const profile = MOCK_PROFILES[key];

    localStorage.setItem("user", JSON.stringify(user));
    if (profile) {
      localStorage.setItem("profile", JSON.stringify(profile));
    }
    localStorage.setItem("token", "mock-token");

    setUser({ ...user, profile });
    setIsLoggedIn(true);

    redirectUser(user);
  };


  const completeLoginWithApiResponse = (response) => {
    const { user, accessToken } = response;

    if (!user || !accessToken) {
      toast.error("Invalid response from server");
      setIsLoading(false);
      return;
    }


    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("token", accessToken);


    setUser(user);
    setIsLoggedIn(true);

    toast.success("Login successful!");


    redirectUser(user);
  };

  const redirectUser = (user) => {
    const role = user.userType.toLowerCase();

    let path = "/dashboard/customer";

    switch (role) {
      case "admin":
        path = "/dashboard/admin";
        break;

      case "customer":
        path =
          user.profileType === "organization"
            ? "/dashboard/customer/organization"
            : "/dashboard/customer";
        break;

      case "fundi":
        path = "/dashboard/fundi";
        break;

      case "professional":
        path = "/dashboard/professional";
        break;

      case "contractor":
        path = "/dashboard/contractor";
        break;

      case "hardware":
        path = "/dashboard/hardware";
        break;

      default:
        path = "/dashboard";
    }

    navigate(path);
  };


  const toggleOtpFlow = () => {
    setIsOtpFlow(!isOtpFlow);
    setOtpSent(false);
    setOtp("");
    setErrors({});
    setFormData({ email: "", password: "" });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <Toaster position="top-center" richColors />

      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8 flex flex-col items-center">
        <img src="/jagedologo.png" alt="JaGedo Logo" className="h-12 mb-6" />

        <h1 className="text-2xl font-semibold text-center mb-4">
          User Login
        </h1>

        <p className="text-gray-600 mb-6 text-center">
          {isOtpFlow
            ? "Enter your phone number to receive OTP"
            : "What is your phone number or email?"}
        </p>

        <form className="space-y-5 w-full" onSubmit={handleSubmit}>
          <Input
            placeholder={isOtpFlow ? "Phone number" : "Phone number or email"}
            value={formData.email}
            disabled={isOtpFlow && otpSent}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
          />
          {errors.email && (
            <p className="text-red-500 text-sm">{errors.email}</p>
          )}

          {isOtpFlow && otpSent && (
            <>
              <Input
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
              />
              {errors.otp && (
                <p className="text-red-500 text-sm">{errors.otp}</p>
              )}
            </>
          )}
          {isOtpFlow && otpSent && otpTimer > 0 && (
            <p className="text-sm text-gray-500">
              Didn’t receive OTP? You can resend in{" "}
              {Math.floor(otpTimer / 60)}:
              {(otpTimer % 60).toString().padStart(2, "0")}
            </p>
          )}
          {isOtpFlow && otpSent && otpTimer === 0 && (
            <button
              type="button"
              className="text-blue-600 text-sm"
              onClick={async () => {
                try {
                  const phoneNumber = formData.email.replace(/\D/g, "");
                  const moddedPhoneNumber = phoneNumber.startsWith("254") ? phoneNumber : phoneNumber.startsWith('0') ? phoneNumber.replace("0", "254") : `254${phoneNumber}`
                  await phoneLogin({ phoneNumber: moddedPhoneNumber });
                  setOtp("");
                  setOtpTimer(120);
                  toast.success("OTP resent successfully");
                } catch (error) {
                  console.error("Resend OTP error:", error);
                  toast.error(error?.response?.data?.message || "Failed to resend OTP");
                }
              }}
            >
              Resend OTP
            </button>
          )}



          {!isOtpFlow && (
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff /> : <Eye />}
              </button>
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.password}
                </p>
              )}
              <div className="flex justify-end mt-2">
                <button
                  type="button"
                  className="text-[#00007a] text-sm hover:underline"
                  onClick={() => navigate("/forgot-password")}
                >
                  Forgot Password?
                </button>
              </div>
            </div>
          )}

          <div className="text-center">
            <button
              type="button"
              className="text-blue-600 text-sm"
              onClick={toggleOtpFlow}
            >
              {isOtpFlow
                ? "Login with password instead"
                : "Login with OTP instead"}
            </button>
          </div>

          <Button disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="mx-auto animate-spin" />
            ) : isOtpFlow ? (
              otpSent ? "Verify OTP" : "Send OTP"
            ) : (
              "Login"
            )}
          </Button>

          {!isOtpFlow && (
            <GoogleSignIn
              loading={isGoogleLoading}
              onSuccess={handleGoogleSuccess}
              onError={() => toast.error("Google sign-in failed")}
            />
          )}
        </form>

        <div className="text-center mt-6">
          <p className="text-gray-700">
            Don't have an account?{" "}
            <a
              href="/"
              className="text-blue-500 hover:text-blue-700 font-medium"
            >
              Sign Up
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}




