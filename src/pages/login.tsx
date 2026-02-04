/* eslint-disable */
// @ts-nocheck

import React, { useState, useEffect } from "react";

import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast, Toaster } from "sonner";
import { useNavigate } from "react-router-dom";
import { loginUser, verifyOtpLogin, phoneLogin } from "@/api/auth.api";
import { useGlobalContext } from "@/context/GlobalProvider";
import GoogleSignIn from "@/components/GoogleSignIn";
import { MOCK_USERS } from "@/pages/mockusers"; // Make sure path is correct
import { MOCK_PROFILES } from "@/pages/mockProfiles";



/* =====================
   VALIDATORS
===================== */
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isValidPhone = (phone) => /^\d{10}$/.test(phone);

/* =====================
   UI COMPONENTS
===================== */
const Button = ({ children, disabled, ...props }) => (
  <button
    disabled={disabled}
    className={`w-full h-12 rounded-lg bg-[#00007a] text-white font-medium ${
      disabled ? "opacity-50" : "hover:bg-[#00007a]/90"
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

/* =====================
   MAIN COMPONENT
===================== */
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


  /* =====================
     VALIDATION
  ===================== */
  const validateForm = () => {
    const errs = {};
    const phone = formData.email.replace(/\D/g, "");
    const email = formData.email.trim();

    if (!formData.email) {
      errs.email = "Phone number or email is required";
    }

    if (isOtpFlow) {
      if (!isValidPhone(phone) && !isValidEmail(email)) {
        errs.email = "Enter a valid phone number or email";
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

  /* =====================
     SUBMIT HANDLER
  ===================== */
//   const handleSubmit = (e) => {
//   e.preventDefault();
//   if (!validateForm()) return;

//   setIsLoading(true);

//   setTimeout(() => {
//     const username = formData.email.trim();
//     const password = formData.password;

//     completeLogin(username, password);
//     setIsLoading(false);
//   }, 800);
// };

const handleSubmit = (e) => {
  e.preventDefault();

  if (!validateForm()) return;

  // =====================
  // OTP LOGIN FLOW
  // =====================
  if (isOtpFlow) {

    // STEP 1: SEND OTP
    if (!otpSent) {
  setOtpSent(true);      // show OTP input
  setOtpTimer(120);      // start 2-minute timer
  toast.success("OTP sent");
  return;
}

    // STEP 2: VERIFY OTP
    if (otp.length !== 6) {
      toast.error("Enter 6-digit OTP");
      return;
    }

    // OTP is correct (mock)
    // OTP verified (mock)

// 1. Find user by email / username
const username = formData.email.trim();

const user = MOCK_USERS.find(
  (u) => u.username === username
);

if (!user) {
  toast.error("User not found");
  return;
}

// 2. Login using real user data
completeLogin(user.username, user.password);
return;

  }

  // =====================
  // PASSWORD LOGIN FLOW
  // =====================
  setIsLoading(true);
  setTimeout(() => {
    completeLogin(
      formData.email.trim(),
      formData.password
    );
    setIsLoading(false);
  }, 800);
};

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     if (!validateForm()) return;

//     setIsLoading(true);

//     setTimeout(() => {
//       const phone = formData.email.replace(/\D/g, "");
//       const email = formData.email.trim();

//       if (isOtpFlow) {
//         if (!otpSent) {
//           setOtpSent(true);
//           toast.success("OTP sent successfully");
//           setIsLoading(false);
//           return;
//         }

//         const mockUser = {
//           userType: "customer",
//           phone: isValidPhone(phone) ? phone : null,
//           email: isValidEmail(email) ? email : null,
//           name: "Mock OTP User",
//           authType: "otp",
//         };

//         completeLogin(mockUser);
//       } else {
//         const mockUser = {
//           userType: "customer",
//           email,
//           name: "Mock Password User",
//           authType: "password",
//         };

//         completeLogin(mockUser);
//       }
//     }, 800);
//   };

  /* =====================
     GOOGLE LOGIN HANDLER
  ===================== */
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

  /* =====================
     COMPLETE LOGIN
  ===================== */
//   const completeLogin = (user) => {
//     localStorage.setItem("user", JSON.stringify(user));
//     localStorage.setItem("token", "mock-token");

//     setUser(user);
//     setIsLoggedIn(true);

//     toast.success("Login successful!");
//     redirectUser(user.userType);
//   };
// const completeLogin = (username, password) => {
//   const user = MOCK_USERS.find(
//     (u) => u.username === username && u.password === password
//   );

//   if (!user) {
//     toast.error("Invalid credentials");
//     setIsLoading(false);
//     return;
//   }

//   // Store user in localStorage
//   localStorage.setItem("user", JSON.stringify(user));
//   localStorage.setItem("token", "mock-token");

//   setUser(user);
//   setIsLoggedIn(true);

//   toast.success("Login successful!");

//   // Redirect based on userType
// //   redirectUser(user);
// navigate("/profile");
// };

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
  localStorage.setItem("token", "mock-token"); // 🔥 REQUIRED

  setUser({ ...user, profile });
  setIsLoggedIn(true);

  redirectUser(user);
};

  /* =====================
     REDIRECT
  ===================== */
//   const redirectUser = () => {
//     setTimeout(() => {
//       navigate("/dashboard/customer");
//     }, 800);
//   };
const redirectUser = (user) => {
  const role = user.userType.toLowerCase(); // 🔥 THIS LINE

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

  /* =====================
     UI
  ===================== */
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
            ? "Enter your phone number or email to receive OTP"
            : "What is your phone number or email?"}
        </p>

        <form className="space-y-5 w-full" onSubmit={handleSubmit}>
          <Input
            placeholder="Phone number or email"
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
    onClick={() => {
      setOtp("");
      setOtpTimer(120); // restart wait time
      toast.success("OTP resent");
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




