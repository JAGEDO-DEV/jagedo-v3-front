import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { resetPasswordToken } from '@/api/auth.api';
import { Eye, EyeOff } from "lucide-react";

// This component is where the user enters their Token and new password.
const ResetPassword = () => {
    // State for the form inputs
    const [token, setToken] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    // State for the component's logic
    const [isLoading, setIsLoading] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();

    // This effect runs when the component loads to get the token from the URL if present.
    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const tokenFromUrl = queryParams.get('token');
        if (tokenFromUrl) {
            setToken(tokenFromUrl);
        }
    }, [location]);

    const toggleVisibility = () => setIsVisible((prevState) => !prevState);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        // --- Validation ---
        if (!token || !newPassword || !confirmPassword) {
            return toast.error("Please fill in all required fields.");
        }
        if (newPassword.trim().length < 8) {
            return toast.error("Password must be at least 8 characters long.");
        }
        if (newPassword.trim() !== confirmPassword.trim()) {
            return toast.error("Passwords do not match. Please try again.");
        }

        setIsLoading(true);

        // --- Payload Creation ---
        const payload = {
            token,
            newPassword,
        };

        // --- API Call ---
        try {
            await resetPasswordToken(payload);

            toast.success("Password has been reset successfully!");

            // Navigate to the login page after success
            navigate("/login");

        } catch (error: any) {
            console.error("Reset Password Error:", error);
            const errorMessage = error.response?.data?.message || "Invalid token or an error occurred. Please try again.";
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
            <div className="bg-white rounded-xl p-8 shadow-md w-[90%] sm:w-full max-w-xl">
                <div className="flex flex-col items-center justify-center">
                    <img src="/jagedologo.png" alt="JaGedo Logo" className="h-12 mb-6" />
                    <h2 className="text-2xl font-bold mb-6 text-center">Set New Password</h2>
                </div>
                {/* Use the form's onSubmit handler */}
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="token" className="block text-sm sm:text-lg font-medium text-gray-700 mb-1">
                            Reset Token
                            <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={token}
                            onChange={(e) => setToken(e.target.value)}
                            id="token"
                            className="w-full p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter the reset token from your email"
                            required
                        />
                    </div>

                    <div className="relative my-6">
                        <label htmlFor="new-password" className="block text-sm sm:text-lg font-medium text-gray-700 mb-1">
                            New Password
                            <span className="text-red-500">*</span>
                        </label>
                        <input
                            type={isVisible ? "text" : "password"}
                            id="new-password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter your new password"
                            required
                        />
                        <button
                            className="absolute inset-y-0 end-2 top-8 flex items-center z-20 px-2.5 cursor-pointer text-gray-400"
                            type="button"
                            onClick={toggleVisibility}
                            aria-label={isVisible ? "Hide password" : "Show password"}
                        >
                            {isVisible ? <Eye size={20} /> : <EyeOff size={20} />}
                        </button>
                    </div>

                    <div className="relative mb-6">
                        <label htmlFor="confirm-password" className="block text-sm sm:text-lg font-medium text-gray-700 mb-1">
                            Confirm New Password
                            <span className="text-red-500">*</span>
                        </label>
                        <input
                            type={isVisible ? "text" : "password"}
                            id="confirm-password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Confirm your new password"
                            required
                        />
                        <button
                            className="absolute inset-y-0 end-2 top-8 flex items-center z-20 px-2.5 cursor-pointer text-gray-400"
                            type="button"
                            onClick={toggleVisibility}
                            aria-label={isVisible ? "Hide password" : "Show password"}
                        >
                            {isVisible ? <Eye size={20} /> : <EyeOff size={20} />}
                        </button>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-4 my-4 hover:bg-blue-600 text-white rounded-md bg-[rgb(0,0,112)] transition duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? "Resetting..." : "Reset Password"}
                    </button>
                </form>

                <div className="flex gap-2 items-center justify-center mt-4">
                    <p className="text-sm sm:text-lg text-gray-700">
                        Suddenly remembered?
                    </p>
                    <Link to="/login" className="text-blue-500 hover:underline text-sm sm:text-lg">
                        Login
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;