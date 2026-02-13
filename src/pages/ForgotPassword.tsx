import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { forgotPasswordLink } from "@/api/auth.api";

// This component's purpose is to request a password reset, so ForgotPassword is a more fitting name.
const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); // Use the form's onSubmit for better accessibility and standards

    if (!email) {
      return toast.error("Please enter your email address.");
    }

    setIsLoading(true);

    try {
      // Call the API function with the correct payload
      await forgotPasswordLink(email);

      // Show a success message
      toast.success("A password reset link has been sent to your email address.");

      // Navigate to the next step, passing the email so the next page can use it
      // Note: User will click the link in their email, but we can redirect to a check email page or just stay here.
      // For now, let's redirect to reset page if they want to enter token manually, or just inform them.
      // navigate("/reset-password", { state: { email: email } });

    } catch (error: any) {
      // Log the full error for debugging purposes
      console.error("Forgot Password Error:", error);

      // Show a user-friendly error from the API, or a generic one
      const errorMessage =
        error.response?.data?.message || "Failed to send reset link. Please try again.";
      toast.error(errorMessage);
    } finally {
      // This block will run whether the request succeeded or failed
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <div className="bg-white rounded-xl p-8 shadow-md w-[90%] sm:w-full max-w-2xl">
        <div className="flex flex-col items-center justify-center">
          <img src="/jagedologo.png" alt="JaGedo Logo" className="h-12 mb-6" />
          <h2 className="text-2xl font-bold mb-6 text-center">Forgot Password</h2>
        </div>
        <p className="text-center text-gray-600 mb-6">
          Enter your email address and we'll send you a link to reset your password.
        </p>

        {/* Use the form's onSubmit event handler */}
        <form className="flex flex-col" onSubmit={handleSubmit}>
          <div className="mb-2">
            <label htmlFor="email" className="block text-sm sm:text-lg font-medium text-gray-700 mb-1">
              Email
              <span className="text-red-500" aria-hidden="true">*</span>
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your email address"
              required // Add HTML5 validation
            />
          </div>

          <button
            type="submit" // Use type="submit" for forms
            disabled={isLoading} // Disable button while loading
            className="w-full py-4 my-4 hover:bg-blue-600 text-white rounded-md bg-[rgb(0,0,112)] transition duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        <div className="flex gap-2 items-center justify-center mt-4">
          <p className="text-sm sm:text-lg text-gray-700 text-center">
            Remembered your password?
          </p>
          <Link to="/login" className="text-blue-500 hover:underline hover:text-gray-700 text-sm sm:text-lg">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;