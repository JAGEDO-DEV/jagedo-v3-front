import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export default function Unauthorized() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-red-900 to-gray-900 flex items-center justify-center p-4">
            <div className="text-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="mb-8"
                >
                    <div className="w-24 h-24 mx-auto mb-4">
                        <svg
                            className="w-full h-full text-red-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 15v2m0 0v2m0-2h2m-2 0H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                >
                    <h1 className="text-7xl font-bold text-white mb-4">403</h1>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                >
                    <h2 className="text-3xl font-semibold text-gray-300 mb-8">
                        Access Denied
                    </h2>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.5 }}
                >
                    <p className="text-gray-400 mb-8 max-w-md mx-auto">
                        Sorry, but you don't have permission to access this
                        page. Please contact your administrator if you believe
                        this is a mistake.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8, duration: 0.5 }}
                    className="space-x-4"
                >
                    <Link
                        to="/dashboard/admin"
                        className="inline-block px-6 py-3 bg-red-600 text-white rounded-lg
                     hover:bg-red-700 transition-colors duration-200
                     transform hover:scale-105"
                    >
                        Return Home
                    </Link>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1, duration: 0.5 }}
                    className="mt-12"
                >
                    <div className="w-16 h-1 bg-red-500 mx-auto rounded-full animate-pulse"></div>
                </motion.div>
            </div>
        </div>
    );
}
