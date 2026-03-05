// Customer.tsx
import React from 'react';

interface OrderData {
    customer?: {
        username: string;
        estate?: string;
    };
}

interface CustomerProps {
    orderData: OrderData | null;
}

const Customer: React.FC<CustomerProps> = ({ orderData }) => {
    if (!orderData || !orderData.customer) {
        return <div className="p-6 text-center text-gray-500">Customer information is not available.</div>;
    }

    const { customer } = orderData;
    const customerName = customer.username.split('@')[0].replace(/[0-9]/g, ' ').trim();


    return (
        <div className="p-8 bg-gray-50 flex justify-center items-center">
            <div className="bg-white shadow-lg rounded-xl p-8 w-full max-w-md">
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-semibold text-gray-800">Customer Information</h2>
                    <p className="text-lg text-green-600 font-medium capitalize mt-1">
                        {customerName}
                    </p>
                </div>

                <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Full Name</p>
                        <p className="text-gray-800 capitalize mt-1">{customerName}</p>
                    </div>

                    {customer.estate && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone</p>
                            <p className="text-gray-800 mt-1">{customer.estate}</p>
                        </div>
                    )}

                    <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</p>
                        <p className="text-gray-800 mt-1">{customer.username}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Customer;