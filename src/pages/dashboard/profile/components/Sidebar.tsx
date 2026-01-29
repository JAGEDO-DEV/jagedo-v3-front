import React from 'react';
import { User, Home, Upload, Briefcase, Package, ArrowLeft } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  userType: string;
}

// Base navigation items for all users
const baseNavigationItems = [
  { id: 'account-info', label: 'Account Info', icon: User, color: 'text-blue-600', status: 'complete' },
  { id: 'address', label: 'Address', icon: Home, color: 'text-green-600', status: 'complete' },
];

// Experience (only for builders except hardware)
const experienceItem = {
  id: 'experience',
  label: 'Experience',
  icon: Briefcase,
  color: 'text-orange-600',
  status: 'incomplete',
};

// Account uploads (all users)
const uploadsItem = {
  id: 'account-uploads',
  label: 'Account Uploads',
  icon: Upload,
  color: 'text-purple-600',
  status: 'incomplete',
};

// Products (builders & hardware)
const productsItem = {
  id: 'products',
  label: 'Products',
  icon: Package,
  color: 'text-indigo-600',
  status: 'incomplete',
};

const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, userType }) => {
  // Determine which navigation items to show based on user type
  const getNavigationItems = () => {
    // CUSTOMER: Account Info → Address → Account Uploads
    if (userType === 'CUSTOMER') {
      return [
        ...baseNavigationItems,
        uploadsItem,
      ];
    }

    // HARDWARE: Account Info → Address → Account Uploads → Products
    if (userType === 'HARDWARE') {
      return [
        ...baseNavigationItems,
        uploadsItem,
        productsItem,
      ];
    }

    // FUNDI / PROFESSIONAL / CONTRACTOR:
    // Account Info → Address → Experience → Account Uploads → Products
    return [
      ...baseNavigationItems,
      experienceItem,
      uploadsItem,
      productsItem,
    ];
  };

  const navigationItems = getNavigationItems();

  const getUserTypeLabel = () => {
    switch (userType) {
      case 'FUNDI':
        return 'Fundi Profile';
      case 'PROFESSIONAL':
        return 'Professional Profile';
      case 'CONTRACTOR':
        return 'Contractor Profile';
      case 'HARDWARE':
        return 'Hardware Provider Profile';
      case 'CUSTOMER':
        return 'Customer Profile';
      default:
        return 'User Profile';
    }
  };

  const handleBackToDashboard = () => {
    window.location.href = `/dashboard/admin`;
  };

  const renderStatus = (status: string) => {
    if (status === 'complete') {
      return (
        <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200">
         complete ✓
        </span>
      );
    }

    return (
      <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 border border-yellow-200">
       incomplete !
      </span>
    );
  };

  return (
    <div className="w-80 bg-white shadow-lg border-2 border-gray-200 rounded-2xl flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-semibold text-gray-900 mb-2">
          {getUserTypeLabel()}
        </h1>
        <p className="text-sm text-gray-600 leading-relaxed">
          Manage your account settings and preferences
        </p>
        <div className="mt-3">
          <span
            className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
              userType === 'CUSTOMER'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-green-100 text-green-800'
            }`}
          >
            {userType}
          </span>
        </div>
      </div>

      {/* Back to Dashboard */}
      <div className="p-4 border-b border-gray-200">
        <button
          onClick={handleBackToDashboard}
          className="w-full flex items-center px-4 py-3 rounded-lg text-left transition-all duration-200 hover:bg-gray-50 text-gray-700 border-2 border-transparent hover:border-gray-200"
        >
          <ArrowLeft className="w-5 h-5 mr-3 text-gray-600" />
          <span className="font-medium text-gray-700">
            Back to Dashboard
          </span>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <li key={item.id}>
                <button
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-50 border-2 border-blue-200 text-blue-700'
                      : 'hover:bg-gray-50 text-gray-700 border-2 border-transparent hover:border-gray-200'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 mr-3 ${
                      isActive ? 'text-blue-600' : item.color
                    }`}
                  />

                  <span
                    className={`font-medium ${
                      isActive ? 'text-blue-700' : 'text-gray-700'
                    }`}
                  >
                    {item.label}
                  </span>

                  {renderStatus(item.status)}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          {userType === 'CUSTOMER'
            ? 'Customer Dashboard'
            : 'Service Provider Dashboard'}
        </p>
      </div>
    </div>
  );
};

export default Sidebar;
