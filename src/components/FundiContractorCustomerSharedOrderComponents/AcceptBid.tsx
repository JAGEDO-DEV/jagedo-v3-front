import React, { useState } from 'react';
import { acceptOrderBid } from '@/api/orderRequests.api';
import useAxiosWithAuth from "@/utils/axiosInterceptor";
import { FaUserCircle, FaMoneyBillWave } from 'react-icons/fa';
import { AxiosInstance } from 'axios';
import toast from 'react-hot-toast';

interface ServiceProvider {
    id: number;
    userName: string;
    email: string;
}

interface ProductBid {
    id: number;
    seller: ServiceProvider;
    bidAmount: number;
    createdAt: string;
    winningBid: boolean;
}

interface Order {
    id: number;
    orderId: number;
    assignedServiceProvider: ServiceProvider | null;
    productBids: ProductBid[];
}

interface AcceptBidProps {
    orderData: Order;
    onBidAccepted: () => void;
}


const AcceptBid: React.FC<AcceptBidProps> = ({ orderData, onBidAccepted }) => {
    const axiosInstance: AxiosInstance = useAxiosWithAuth(import.meta.env.VITE_SERVER_URL);
    const [acceptingBidId, setAcceptingBidId] = useState<number | null>(null);

    const handleAcceptBid = async (bidId: number) => {
        setAcceptingBidId(bidId);
        try {
            const response = await acceptOrderBid(axiosInstance, orderData.id, bidId);
            if (response && response.success) {
                toast.success("Bid accepted successfully!");
                onBidAccepted();
            } else {
                toast.error(response?.message || "Failed to accept bid.");
            }
        } catch (err) {
            console.error("Error accepting bid:", err);
            toast.error("An error occurred while accepting the bid.");
        } finally {
            setAcceptingBidId(null);
        }
    };

    if (!orderData || !orderData.productBids || orderData.productBids.length === 0) {
        return <div className="p-4 text-center text-gray-500">No bids have been submitted for this order yet.</div>;
    }

    const winningBidExists = !!orderData.assignedServiceProvider;

    return (
        <div className="space-y-4 p-4">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Manage Bids</h3>
            {orderData.productBids.map((bid) => (
                <div key={bid.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex-grow">
                        <div className="flex items-center gap-3 mb-2">
                            <FaUserCircle className="text-2xl text-gray-400" />
                            <div>
                                <p className="font-semibold text-gray-700">Bidder Id: {bid.id || 'N/A'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-6 mt-3">
                            <div className="flex items-center gap-2 text-gray-700">
                                <FaMoneyBillWave className="text-green-500" />
                                <span className="font-bold">KES {bid.bidAmount.toLocaleString()}</span>
                            </div>

                        </div>
                    </div>

                    <div className="w-full sm:w-auto flex-shrink-0">
                        {bid.winningBid ? (
                            <span className="block text-center w-full sm:w-auto px-4 py-2 text-sm font-bold text-green-800 bg-green-100 rounded-md">
                                Accepted
                            </span>
                        ) : (
                            <button
                                type="button"
                                onClick={() => handleAcceptBid(bid.id)}
                                disabled={acceptingBidId !== null || winningBidExists}
                                className={`w-full sm:w-auto font-bold py-2 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2
                                ${winningBidExists ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500'}
                                ${acceptingBidId === bid.id ? 'opacity-70 cursor-wait' : ''}`}
                            >
                                {acceptingBidId === bid.id ? 'Accepting...' : 'Accept Bid'}
                            </button>
                        )}
                    </div>
                </div>
            ))}
            {winningBidExists && (
                <p className="text-sm text-gray-600 mt-4 p-3 bg-blue-50 rounded-md">
                    A winning bid has already been accepted for this order. No further actions can be taken.
                </p>
            )}
        </div>
    );
};

export default AcceptBid;