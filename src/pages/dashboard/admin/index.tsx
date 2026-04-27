import { useState } from 'react';
import Jobs from './jobs';
import Orders from './orders';
import ChatWidgetWrapper from "@/components/ChatWidget";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'jobs' | 'orders'>('jobs');

  return (
    <div className="min-h-screen bg-gray-100 p-10 rounded-lg">
      <ChatWidgetWrapper />
      <div className="max-w-7xl mx-auto px-4 pb-8">
        <div className="flex space-x-4 mb-8 mt-8">
          <button
            className={`px-6 py-2 rounded-lg font-semibold text-lg transition-all duration-150 shadow-sm border-b-4 ${activeTab === 'jobs' ? 'bg-blue-900 text-white border-blue-800' : 'bg-gray-100 text-gray-700 border-transparent hover:bg-blue-100'}`}
            onClick={() => setActiveTab('jobs')}
          >
            Jobs
          </button>
          <button
            className={`px-6 py-2 rounded-lg font-semibold text-lg transition-all duration-150 shadow-sm border-b-4 ${activeTab === 'orders' ? 'bg-blue-900 text-white border-blue-800' : 'bg-gray-100 text-gray-700 border-transparent hover:bg-blue-100'}`}
            onClick={() => setActiveTab('orders')}
          >
            Orders
          </button>
        </div>
        <div>
          {activeTab === 'jobs' ? <Jobs /> : <Orders />}
        </div>
      </div>
    </div>
  );
}
