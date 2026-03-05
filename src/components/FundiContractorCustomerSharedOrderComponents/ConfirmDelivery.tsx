/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
//@ts-nocheck
import React, { useState } from 'react';
import { confirmOrderDelivery } from '@/api/orderRequests.api';
import useAxiosWithAuth from "@/utils/axiosInterceptor";
import { AxiosInstance } from 'axios';
import toast from 'react-hot-toast';
import { FaCheckCircle, FaExclamationCircle, FaClipboardList, FaStore, FaBoxOpen } from 'react-icons/fa';

interface OrderData {
    id: string;
    deliveryConfirmedAt?: string | null;
    customerConfirmedAt?: string | null;
    subTotal: number;
    deliveryFee: number;
    seller?: {
        username: string;
    };
    items: {
        product: {
            name: string;
        };
        productName: string;
        quantity: number;
        price: number;
    }[];
}

interface ConfirmDeliveryProps {
    orderData: OrderData;
}

const ConfirmDelivery: React.FC<ConfirmDeliveryProps> = ({ orderData }) => {
    const axiosInstance: AxiosInstance = useAxiosWithAuth(import.meta.env.VITE_SERVER_URL);
    const [loading, setLoading] = useState(false);

    const hasCustomerConfirmed = !!orderData.customerConfirmedAt;

    const handleConfirm = async () => {
        if (hasCustomerConfirmed) {
            toast.error("You have already confirmed this delivery.");
            return;
        }

        if (!orderData.id) {
            toast.error("Order ID is missing.");
            return;
        }

        if (!window.confirm("Are you sure you want to confirm the receipt of this order? This helps us release payment to the seller.")) {
            return;
        }

        setLoading(true);
        try {
            const response = await confirmOrderDelivery(axiosInstance, orderData.id);
            if (response && response.success) {
                toast.success("Thank you for confirming your delivery!");
                window.location.reload();
            } else {
                throw new Error(response.message || "Failed to confirm delivery.");
            }
        } catch (error: any) {
            console.error("Confirmation failed:", error);
            toast.error(error.message || "An error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const StatusBox = ({ icon, title, children }: { icon: React.ReactNode, title: string, children: React.ReactNode }) => (
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 text-center">
            <div className="text-5xl mx-auto mb-4 w-fit">{icon}</div>
            <h3 className="text-xl font-bold text-gray-800">{title}</h3>
            <div className="text-gray-600 mt-2">{children}</div>
        </div>
    );

    // Main render logic
    const renderContent = () => {
        if (hasCustomerConfirmed) {
            return (
                <StatusBox
                    icon={<FaCheckCircle className="text-green-500" />}
                    title="Delivery Confirmed"
                >
                    <p>You confirmed the receipt of this order on:</p>
                    <p className="font-semibold text-gray-800 mt-1">
                        {new Date(orderData.customerConfirmedAt!).toLocaleString()}
                    </p>
                </StatusBox>
            );
        }

        if (!orderData.deliveryConfirmedAt) {
            return (
                <StatusBox
                    icon={<FaExclamationCircle className="text-yellow-500" />}
                    title="Awaiting Shipment"
                >
                    <p>The seller has not yet marked this order as shipped.</p>
                    <p>You will be able to confirm its receipt once it is on its way.</p>
                </StatusBox>
            );
        }

        return (
            <div className="text-center">
                <h3 className="text-xl font-semibold text-gray-800">Confirm Your Order Receipt</h3>
                <p className="text-gray-600 my-4">
                    The seller has marked this order as shipped. Please confirm that you have received your items in good condition.
                </p>
                <button
                    onClick={handleConfirm}
                    disabled={loading || hasCustomerConfirmed}
                    className={`w-full sm:w-auto font-bold py-3 px-8 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2
                        ${loading || hasCustomerConfirmed
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500'
                        }`}
                >
                    {hasCustomerConfirmed ? 'Already Confirmed' : loading ? 'Confirming...' : 'I Have Received My Order'}
                </button>
            </div>
        );
    };

    return (
        <div className="p-4 sm:p-6 max-w-3xl mx-auto mt-8">
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-lg">
                <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2"><FaStore />Seller Information</h3>
                    <div className="bg-gray-50 p-4 rounded-md border">
                        <p className="font-medium text-gray-800">{orderData.seller?.username || 'N/A'}</p>
                    </div>
                </div>

                <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2"><FaClipboardList />Order Summary</h3>
                    <div className="border rounded-md">
                        <ul className="divide-y divide-gray-200">
                            {orderData.items && orderData.items.length > 0 ? (
                                orderData.items.map((item, index) => (
                                    <li key={index} className="flex justify-between items-center p-4">
                                        <div>
                                            <p className="font-semibold text-gray-800">{item.product?.name || item.productName}</p>
                                            <p className="text-sm text-gray-500">
                                                {item.quantity} x KES {item.price.toLocaleString()}
                                            </p>
                                        </div>
                                        <p className="font-bold text-gray-900">
                                            KES {(item.quantity * item.price).toLocaleString()}
                                        </p>
                                    </li>
                                ))
                            ) : (
                                <li className="p-4 text-center text-gray-500">
                                    <FaBoxOpen className="mx-auto text-3xl mb-2" />
                                    No items found in this order.
                                </li>
                            )}
                        </ul>
                        <div className="flex justify-between items-center bg-gray-50 p-4 font-bold text-lg border-t">
                            <span className="text-gray-800">Total Amount</span>
                            <span className="text-blue-600">KES {((orderData.deliveryFee || 0) + (orderData.subTotal || 0)).toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {renderContent()}
            </div>
        </div>
    );
};

export default ConfirmDelivery;