/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/ban-ts-comment */
//@ts-nocheck
import React, { useState } from 'react';
import { payForOrder } from '@/api/orderRequests.api';
import useAxiosWithAuth from "@/utils/axiosInterceptor";
import { AxiosInstance } from 'axios';
import toast from 'react-hot-toast';
import { FaShoppingCart, FaCheckCircle, FaInfoCircle } from 'react-icons/fa';

interface OrderData {
    id: any;
    subTotal: number | null;
    deliveryFee: number | null;
    totalAmount: number | null;
    items: {
        product: {
            id: number;
            name: string;
            images: string[];
        };
        productName: string;
        quantity: number;
        price: number;
    }[];
    paid?: boolean;
}

interface OrderProps {
    orderData: OrderData;
}

const Pay: React.FC<OrderProps> = ({ orderData }) => {
    const axiosInstance: AxiosInstance = useAxiosWithAuth(import.meta.env.VITE_SERVER_URL);

    const [phoneNumber, setPhoneNumber] = useState('254');
    const [loading, setLoading] = useState(false);

    const orderId = orderData.id;
    const deliveryFee = orderData.deliveryFee || 0;
    const amountToPay = deliveryFee + (orderData.subTotal || 0);

    const isDeliveryFeePending = deliveryFee <= 0;

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        const numericValue = newValue.replace(/[^0-9]/g, '');

        if (!numericValue.startsWith('254')) {
            setPhoneNumber('254');
        } else {
            setPhoneNumber(numericValue);
        }
    };

    const handlePayment = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!phoneNumber || phoneNumber.length < 12) {
            toast.error("Please enter a valid 12-digit phone number (e.g., 2547XXXXXXXX).");
            return;
        }

        setLoading(true);

        const payload = {
            phone: phoneNumber,
            accountRef: `ORDER-${orderId}`,
            amount: amountToPay,
        };

        if (amountToPay <= 0) {
            toast.error("Invalid amount. Cannot process payment.");
            setLoading(false);
            return;
        }

        try {
            const response = await payForOrder(axiosInstance, orderId, payload);
            if (response && response.success) {
                toast.success("Payment initiated! Please check your phone to complete.");
                window.location.reload();
            } else {
                toast.error(response?.message || "Payment failed. Please try again.");
            }
        } catch (err) {
            console.error("Payment error:", err);
            toast.error("An error occurred while processing the payment.");
        } finally {
            setLoading(false);
        }
    };

    if (orderData.paid) {
        return (
            <div className="p-4 max-w-md mx-auto">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">Payment Status</h3>
                <div className="bg-green-50 p-6 rounded-lg border border-green-200 shadow-sm text-center">
                    <FaCheckCircle className="text-green-500 text-5xl mx-auto mb-3" />
                    <h4 className="text-xl font-bold text-green-800">Paid</h4>
                    <p className="text-gray-600 mt-2">
                        This order has been successfully paid for. Thank you!
                    </p>
                </div>
            </div>
        );
    }


    return (
        <div className="p-4 max-w-md mx-auto">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">Complete Your Payment</h3>
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">

                {/* Item Summary Section */}
                <div className="mb-4">
                    <h4 className="text-md font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <FaShoppingCart className="text-gray-500" />
                        Item Summary
                    </h4>
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-2 border-b pb-3">
                        {orderData.items.map((item, index) => (
                            <div key={item.product.id || index} className="flex justify-between items-center text-sm">
                                <div>
                                    <p className="font-medium text-gray-800">{item.product.name || item.productName}</p>
                                    <p className="text-gray-500">Qty: {item.quantity || 0}</p>
                                </div>
                                <p className="font-medium text-gray-700">
                                    KES {((item.quantity || 0) * (item.price || 0)).toLocaleString()}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Amount Summary Section */}
                <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600">
                        <span>Subtotal</span>
                        <span>KES {(orderData.subTotal || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                        <span>Delivery Fee</span>
                        {isDeliveryFeePending ? (
                            <span className="text-orange-500 font-medium italic">Pending...</span>
                        ) : (
                            <span>KES {deliveryFee.toLocaleString()}</span>
                        )}
                    </div>
                    <p className="text-sm text-gray-600">Total Amount to Pay:</p>
                    <p className="text-2xl font-bold text-gray-900">
                        KES {amountToPay.toLocaleString()}
                    </p>
                </div>

                {/* Warning for Missing Delivery Fee */}
                {isDeliveryFeePending && (
                    <div className="mb-4 bg-orange-50 border-l-4 border-orange-400 p-4 rounded">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <FaInfoCircle className="h-5 w-5 text-orange-400" aria-hidden="true" />
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-orange-700">
                                    Delivery fee has not been posted yet. Please wait for the fee to be updated before proceeding with payment.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Payment Form */}
                <form onSubmit={handlePayment}>
                    <div className="mb-4">
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                            M-Pesa Phone Number
                        </label>
                        <input
                            type="tel"
                            id="phone"
                            value={phoneNumber}
                            onChange={handlePhoneChange}
                            disabled={isDeliveryFeePending}
                            className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${isDeliveryFeePending ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                            required
                            maxLength={12}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading || amountToPay <= 0 || isDeliveryFeePending}
                        className={`w-full font-bold py-2 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2
              ${loading || amountToPay <= 0 || isDeliveryFeePending ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500'}`}
                    >
                        {loading ? 'Processing...' : isDeliveryFeePending ? 'Waiting for Delivery Fee' : `Pay KES ${amountToPay.toLocaleString()}`}
                    </button>
                </form>

                <p className="text-xs text-gray-500 mt-4 text-center">
                    You will receive an STK push on your phone to complete the payment.
                </p>
            </div>
        </div>
    );
}

export default Pay;