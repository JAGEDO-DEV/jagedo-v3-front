
import React from 'react';


interface ServiceProvider {
    username: string;
    phoneNumber?: string;
}

interface OrderData {
    seller?: ServiceProvider;
    assignedServiceProvider?: ServiceProvider;
    assignedServiceProviders?: ServiceProvider[];
}

interface BuilderProps {
    orderData: OrderData | null;
}

const Builder: React.FC<BuilderProps> = ({ orderData }) => {

    const builder =
        orderData?.seller ||
        orderData?.assignedServiceProvider ||
        (orderData?.assignedServiceProviders && orderData?.assignedServiceProviders.length > 0
            ? orderData.assignedServiceProviders[0]
            : null);

    if (!builder) {
        return <div className="p-6 text-center text-gray-500">Builder information is not available.</div>;
    }


    const builderName = builder.username.split('@')[0].replace(/[0-9]/g, ' ').trim();

    return (
        <div className="p-8 bg-gray-50 flex justify-center items-center">
            <div className="bg-white shadow-lg rounded-xl p-8 w-full max-w-md">
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-semibold text-gray-800">Contact Person</h2>
                    <p className="text-lg text-green-600 font-medium capitalize mt-1">
                        {builderName}
                    </p>
                </div>

                <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Full Name</p>
                        <p className="text-gray-800 capitalize mt-1">{builderName}</p>
                    </div>

                    {/* Only render Phone if the API provides it. Removed dummy data. */}
                    {builder.phoneNumber && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone</p>
                            <p className="text-gray-800 mt-1">{builder.phoneNumber}</p>
                        </div>
                    )}

                    <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</p>
                        <p className="text-gray-800 mt-1">{builder.username}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Builder;