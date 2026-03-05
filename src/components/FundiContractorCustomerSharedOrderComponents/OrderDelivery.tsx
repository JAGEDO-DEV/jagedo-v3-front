
import React, { useState } from 'react';
import { shipOrder } from '@/api/orderRequests.api';
import useAxiosWithAuth from "@/utils/axiosInterceptor";
import { AxiosInstance } from 'axios';
import toast from 'react-hot-toast';
import { FaCheckCircle, FaTruck, FaUser, FaMapMarkerAlt, FaClipboardList, FaBoxOpen } from 'react-icons/fa';

interface OrderData {
    id: string;
    shipped: boolean;
    deliveryConfirmedAt?: string | null;
    subTotal: number;
    deliveryFee: number;
    productBids?: { bidAmount: number }[]; 
    customer?: {
        username: string;
        estate?: string;
    };
    items: {
        product: {
            name: string;
            customPrice?: number; 
        };
        productName: string;
        quantity: number;
        price: number;
    }[];
}

interface OrderDeliveryProps {
    orderData: OrderData;
}

const OrderDelivery: React.FC<OrderDeliveryProps> = ({ orderData }) => {
    const axiosInstance: AxiosInstance = useAxiosWithAuth(import.meta.env.VITE_SERVER_URL);
    const [loading, setLoading] = useState(false);

    const isShipped = orderData.shipped;

    

    
    const processedItems = (orderData.items || []).map((item) => {
        let price = Number(item.price || 0);
        if (price === 0 && item.product?.customPrice) {
            price = Number(item.product.customPrice);
        }
        return {
            ...item,
            price: price
        };
    });

    
    let effectiveDeliveryFee = Number(orderData.deliveryFee || 0);
    if (effectiveDeliveryFee === 0 && orderData.productBids && orderData.productBids.length > 0) {
        effectiveDeliveryFee = Number(orderData.productBids[0].bidAmount || 0);
    }

    
    const effectiveSubTotal = processedItems.reduce((acc, item) => acc + (item.quantity * item.price), 0);

    
    const effectiveTotalAmount = effectiveSubTotal + effectiveDeliveryFee;


    const handleShipOrder = async () => {
        if (!window.confirm("Are you sure you want to mark this order as shipped? This will complete the fulfillment process.")) {
            return;
        }

        setLoading(true);
        try {
            const response = await shipOrder(axiosInstance, orderData.id);
            if (response && response.success) {
                toast.success("Order successfully marked as shipped!");
                window.location.reload();
            } else {
                throw new Error(response.message || "Failed to ship order.");
            }
        } catch (error: any) {
            console.error("Shipping failed:", error);
            toast.error(error.message || "An error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };


    const renderStatusBadge = () => {
        if (isShipped) {
            return (
                <div className="flex items-center gap-2 bg-green-100 text-green-800 font-semibold px-3 py-1 rounded-full text-sm">
                    <FaCheckCircle />
                    <span>Shipped</span>
                </div>
            );
        }
        return (
            <div className="flex items-center gap-2 bg-yellow-100 text-yellow-800 font-semibold px-3 py-1 rounded-full text-sm">
                <FaTruck />
                <span>Ready to Ship</span>
            </div>
        );
    };


    const renderActionSection = () => {
        if (isShipped) {
            return (
                <div className="bg-green-50 p-4 rounded-md border border-green-200 text-center">
                    <p className="font-semibold text-green-800">This order was successfully shipped on:</p>
                    {orderData.deliveryConfirmedAt && (
                        <p className="text-gray-700 mt-1">{new Date(orderData.deliveryConfirmedAt).toLocaleString()}</p>
                    )}
                </div>
            );
        }
        return (
            <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200 text-center">
                <h3 className="text-xl font-semibold text-gray-800">Ship This Order</h3>
                <p className="text-gray-600 my-3">Click the button below to mark the order as shipped and complete the fulfillment process.</p>
                <button
                    onClick={handleShipOrder}
                    disabled={loading}
                    className="w-full sm:w-auto font-bold py-3 px-8 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 bg-yellow-500 text-white hover:bg-yellow-600 focus:ring-yellow-400 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    {loading ? 'Processing...' : 'Ship Order'}
                </button>
            </div>
        );
    };

    return (
        <div className="p-4 sm:p-6 max-w-3xl mx-auto mt-8">
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-lg">
                <div className="flex justify-between items-start mb-6 border-b pb-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Order Fulfillment</h2>
                        <p className="text-sm text-gray-500">Order ID: #{orderData.id}</p>
                    </div>
                    {renderStatusBadge()}
                </div>

                <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2"><FaUser />Customer Information</h3>
                    <div className="bg-gray-50 p-4 rounded-md border">
                        <p className="font-medium text-gray-800">{orderData.customer?.username || 'N/A'}</p>
                        {orderData.customer?.estate && (
                            <p className="text-sm text-gray-600 flex items-center gap-2 mt-1"><FaMapMarkerAlt /> {orderData.customer.estate}</p>
                        )}
                    </div>
                </div>

                <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2"><FaClipboardList />Order Summary</h3>
                    <div className="border rounded-md">
                        <ul className="divide-y divide-gray-200">
                            {processedItems.length > 0 ? (
                                processedItems.map((item, index) => (
                                    <li key={index} className="flex justify-between items-center p-4">
                                        <div>
                                            <p className="font-semibold text-gray-800">{item.product?.name || item.productName}</p>
                                            <p className="text-sm text-gray-500">{item.quantity} x KES {item.price.toLocaleString()}</p>
                                        </div>
                                        <p className="font-bold text-gray-900">KES {(item.quantity * item.price).toLocaleString()}</p>
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
                            <span className="text-blue-600">
                                KES {effectiveTotalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                    </div>
                </div>

                {renderActionSection()}
            </div>
        </div>
    );
}

export default OrderDelivery;