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

const MainContent: React.FC<MainContentProps> = ({ activeTab, userType, userData, isAdmin, refetch , completionStatus}) => {
  const renderContent = () => {
    switch (activeTab) {
      case 'account-info':
          return <AccountInfo userData={userData} completionStatus={completionStatus} isAdmin={isAdmin} />;
      case 'address':
        return <Address userData={userData} />;
      case 'marketing':
        // Only show for customers
        if (userType === 'CUSTOMER') {
          return <Marketing userData={userData} onUpdate={refetch} />;
        }
        return <AccountInfo userData={userData} isAdmin={isAdmin} />;
      case 'account-uploads':
        return <AccountUploads userData={userData} isAdmin={isAdmin} />;
      case 'experience':
        // Only show for builders, not customers
        if (userType === 'CUSTOMER') {
          return <AccountInfo userData={userData} isAdmin={isAdmin} />;
        }
        return <Experience userData={userData} isAdmin={isAdmin} refetch={refetch} />;
      case 'products':
        // Only show for builders, not customers
        if (userType === 'CUSTOMER') {
          return <AccountInfo userData={userData} isAdmin={isAdmin} />;
        }
        //@ts-nocheck
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
