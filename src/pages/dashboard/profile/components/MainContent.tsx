// @ts-nocheck
import React from 'react';
import AccountInfo from './tabs/AccountInfo';
import Address from './tabs/Address';
import Marketing from './tabs/Marketing';
import AccountUploads from './tabs/AccountUploads';
import Experience from './tabs/Experience';
import Products from './tabs/Products';

interface MainContentProps {
  activeTab: string;
  userType: string;
  userData?: any;
  isAdmin?: boolean;
  refetch?: () => void;
    completionStatus?: Record<string, string>; // ← add

}

const MainContent: React.FC<MainContentProps> = ({ activeTab, userType, userData, isAdmin, refetch, completionStatus = {} }) => {
  // Navigation order for locking logic (must match Sidebar.tsx)
  const getNavigationOrder = () => {
    if (userType === 'CUSTOMER') {
      return ['account-info', 'address', 'account-uploads', 'marketing'];
    }
    return ['account-info', 'address', 'experience', 'account-uploads', 'products'];
  };

  const isTabLocked = () => {
    const order = getNavigationOrder();
    const currentIndex = order.indexOf(activeTab);
    if (currentIndex <= 0) return false;

    const prevTab = order[currentIndex - 1];
    
    // Marketing and Products exceptions
    if (activeTab === 'marketing') return false;
    if (activeTab === 'products') return userData?.status !== 'VERIFIED';
    
    return (completionStatus[prevTab] || 'incomplete') !== 'complete';
  };

  if (isTabLocked()) {
    return (
      <div className="flex-1 overflow-auto bg-gray-50 flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">Section Locked</h3>
          <p className="text-sm text-gray-500">
            This section will become available once the previous profile sections are completed and submitted.
          </p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'account-info':
          return <AccountInfo userData={userData} completionStatus={completionStatus} isAdmin={isAdmin} />;
      case 'address':
        return <Address userData={userData} />;
      case 'marketing':
        if (userType === 'CUSTOMER') {
          return <Marketing userData={userData} onUpdate={refetch} />;
        }
        return <AccountInfo userData={userData} isAdmin={isAdmin} />;
      case 'account-uploads':
        return <AccountUploads userData={userData} isAdmin={isAdmin} />;
      case 'experience':
        if (userType === 'CUSTOMER') {
          return <AccountInfo userData={userData} isAdmin={isAdmin} />;
        }
        return <Experience userData={userData} isAdmin={isAdmin} refetch={refetch} />;
      case 'products':
        if (userType === 'CUSTOMER') {
          return <AccountInfo userData={userData} isAdmin={isAdmin} />;
        }
        return <Products userData={userData} userType={userType} />;
      default:
        return <AccountInfo userData={userData} completionStatus={completionStatus} isAdmin={isAdmin}/>;
    }
  };

  return (
    <div className="flex-1 overflow-auto bg-white">
      <div className="p-8">
        {renderContent()}
      </div>
    </div>
  );
};

export default MainContent;
