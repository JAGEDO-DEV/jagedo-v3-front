import React, { useState } from 'react';
import { addProviderFee } from '@/api/orderRequests.api';
import useAxiosWithAuth from "@/utils/axiosInterceptor";
import { useGlobalContext } from "@/context/GlobalProvider";

const Fee = ({ orderData }) => {
    const axiosInstance = useAxiosWithAuth(import.meta.env.VITE_SERVER_URL);
    const { user } = useGlobalContext();
    const [bidAmount, setBidAmount] = useState<number | ''>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!bidAmount || bidAmount <= 0) {
            setError("Please enter a valid fee amount.");
            return;
        }

        const payload = {
            orderId: orderData.id,
            bidderId: user.id,
            bidAmount: Number(bidAmount)
        };

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const response = await addProviderFee(axiosInstance, orderData.id, payload);

            if (response && response.success) {
                setSuccess("Your fee has been submitted successfully!");
                window.location.reload();
            } else {
                throw new Error(response.message || "Failed to submit fee. Please try again.");
            }
        } catch (err: any) {
            setError(err.message || "An unexpected error occurred while submitting your fee.");
            console.error("Error submitting fee:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-2xl mx-auto bg-white rounded-lg shadow-md mt-10">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Submit Your Service Fee</h2>
            <p className="mb-6 text-gray-600">
                Review the order details and enter the total fee you will charge for the requested products and services. This will be submitted as your bid for this order.
            </p>
            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label htmlFor="fee-amount" className="block text-sm font-medium text-gray-700 mb-2">
                        Your Bid Amount
                    </label>
                    <div className="relative">
                        <input
                            type="number"
                            id="fee-amount"
                            value={bidAmount}
                            onChange={(e) => setBidAmount(e.target.value === '' ? '' : Number(e.target.value))}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="e.g., 15000"
                            min="0"
                            required
                            disabled={loading}
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[rgb(0,0,122)] text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                    {loading ? 'Submitting...' : 'Submit Fee'}
                </button>
            </form>
            {error && <p className="mt-4 text-sm text-center text-red-600 bg-red-100 p-3 rounded-md">{error}</p>}
            {success && <p className="mt-4 text-sm text-center text-green-800 bg-green-100 p-3 rounded-md">{success}</p>}
        </div>
    );
}

export default Fee;