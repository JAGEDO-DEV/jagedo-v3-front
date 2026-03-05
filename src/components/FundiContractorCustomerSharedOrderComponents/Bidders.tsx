import React from 'react';
import { FaGavel, FaUserCircle, FaCheckCircle } from 'react-icons/fa';
import { MdNotes } from "react-icons/md";


interface ServiceProvider {
  id: number;
  username: string;
  email: string;
}

interface Order {
  id: string;
  assignedServiceProvider: ServiceProvider | null;
  assignedServiceProviders: ServiceProvider[];
  serviceProviderNotes?: string;
}

interface BiddersProps {
  orderData: Order;
}


const Bidders: React.FC<BiddersProps> = ({ orderData }) => {
  const hasAcceptedBid = !!orderData.assignedServiceProvider;

  const providersToDisplay = hasAcceptedBid
    ? (orderData.assignedServiceProvider ? [orderData.assignedServiceProvider] : [])
    : orderData.assignedServiceProviders;

  const renderContent = () => {
    if (!providersToDisplay || providersToDisplay.length === 0) {
      return (
        <div className="text-center py-12">
          <FaGavel className="mx-auto text-5xl text-gray-300" />
          <h2 className="mt-4 text-xl font-semibold text-gray-600">No Bids Yet</h2>
          <p className="mt-2 text-gray-500">Bids from service providers will appear here once they are submitted.</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {providersToDisplay.map((provider) => {
          if (!provider) return null;

          return (
            <div
              key={provider.id}
              className={`bg-gray-50 border rounded-lg shadow-sm flex flex-col justify-between ${hasAcceptedBid ? 'border-green-400' : 'border-gray-200'}`}
            >
              <div className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <FaUserCircle className="text-3xl text-gray-400" />
                    <div>
                      <p className="font-semibold text-gray-800 capitalize">
                        {provider.username?.split('@')[0] || 'Unnamed Provider'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {provider.email || 'No email provided'}
                      </p>
                    </div>
                  </div>
                  {hasAcceptedBid && (
                    <span className="flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      <FaCheckCircle /> Accepted
                    </span>
                  )}
                </div>

                {orderData.serviceProviderNotes && (
                  <div className="mt-4 bg-white p-3 rounded-md border">
                    <div className="flex items-center gap-2 mb-1">
                      <MdNotes className="text-gray-500" />
                      <h4 className="text-sm font-semibold text-gray-700">Notes from provider:</h4>
                    </div>
                    <p className="text-sm text-gray-600 italic">"{orderData.serviceProviderNotes}"</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="bg-white shadow-lg rounded-xl p-6">
      <div className="flex items-center gap-4 mb-6 border-b border-gray-200 pb-4">
        <FaGavel className="text-3xl text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-800">
          {hasAcceptedBid ? 'Assigned Provider' : 'Bids Received'}
        </h1>
      </div>
      {renderContent()}
    </div>
  );
};

export default Bidders;