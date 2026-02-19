import React from 'react';
import { User, Home, Upload, Briefcase, Package, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  userType: string;
  completionStatus?: { [key: string]: 'complete' | 'incomplete' };
  userData?: any;
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
  label: 'Uploads',
  icon: Upload,
  color: 'text-purple-600',
  status: 'incomplete',
};

// Products (builders & hardware) — ❌ NO STATUS
const productsItem = {
  id: 'products',
  label: 'Products',
  icon: Package,
  color: 'text-indigo-600',
};

const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, userType, completionStatus = {}, userData }) => {
  const isOrganization = userData?.accountType === "business" || userData?.accountType === "organization" ||
    userData?.userType === "CONTRACTOR" || userData?.userType === "HARDWARE";

  const displayName = isOrganization && userData?.organizationName
    ? userData.organizationName
    : `${userData?.firstName ?? ""} ${userData?.lastName ?? ""}`.trim() || "User Profile";

  const email = userData?.email || "No email provided";

  // Determine which navigation items to show based on user type
  const getNavigationItems = () => {
    if (userType === 'CUSTOMER') {
      return [...baseNavigationItems, uploadsItem];
    }

    if (userType === 'HARDWARE') {
      return [...baseNavigationItems, uploadsItem, productsItem];
    }

    return [...baseNavigationItems, experienceItem, uploadsItem, productsItem];
  };

  const navigationItems = getNavigationItems();

  const getUserTypeLabel = () => {
    switch (userType) {
      case 'FUNDI': return 'Fundi Profile';
      case 'PROFESSIONAL': return 'Professional Profile';
      case 'CONTRACTOR': return 'Contractor Profile';
      case 'HARDWARE': return 'Hardware Provider Profile';
      case 'CUSTOMER': return 'Customer Profile';
      default: return 'User Profile';
    }
  };

  const handleBackToDashboard = () => {
    window.location.href = `/dashboard/admin`;
  };

  return (
    <div className="w-80 bg-white shadow-lg border-2 border-gray-200 rounded-2xl flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-semibold text-gray-900 mb-1 truncate">
          {displayName}
        </h1>
        <p className="text-sm text-gray-500 mb-3 truncate">
          {email}
        </p>
        <div className="flex items-center justify-between">
          <span
            className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${userType === 'CUSTOMER'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-green-100 text-green-800'
              }`}
          >
            {userType}
          </span>
          <span className="text-[10px] text-gray-400 font-medium">
            ID: {userData?.id || 'N/A'}
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
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const status = completionStatus[item.id] || 'incomplete';
            const isComplete = status === 'complete';
            // Products section is optional - don't show status indicator
            const isOptional = item.id === 'products';

            return (
              <li key={item.id}>
                <button
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center px-4 py-3 rounded-lg text-left transition-all duration-200 ${isActive
                      ? 'bg-blue-50 border-2 border-blue-200 text-blue-700'
                      : 'hover:bg-gray-50 text-gray-700 border-2 border-transparent hover:border-gray-200'
                    }`}
                >
                  <Icon
                    className={`w-5 h-5 mr-3 ${isActive ? 'text-blue-600' : item.color
                      }`}
                  />

                  <span
                    className={`font-medium flex-1 ${isActive ? 'text-blue-700' : 'text-gray-700'
                      }`}
                  >
                    {item.label}
                    {isOptional && <span className="text-xs text-gray-400 ml-1">(Optional)</span>}
                  </span>

                  {!isOptional && (
                    isComplete ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                    )
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <p className="text-[10px] text-gray-400 text-center uppercase tracking-wider font-semibold">
          {userType === 'CUSTOMER'
            ? 'Customer Dashboard'
            : 'Service Provider Dashboard'}
        </p>
      </div>
    </div>
  );
};

export default Sidebar;
