// @ts-nocheck
import React from 'react';
import AccountInfo from './tabs/AccountInfo';
import Address from './tabs/Address';
import AccountUploads from './tabs/AccountUploads';
import Experience from './tabs/Experience';
import Products from './tabs/Products';

interface MainContentProps {
  activeTab: string;
  user_type: string;
  userData?: any;
}

const MainContent: React.FC<MainContentProps> = ({ activeTab, user_type, userData }) => {
  const renderContent = () => {
    switch (activeTab) {
      case 'account-info':
        return <AccountInfo userData={userData} />;
      case 'address':
        return <Address userData={userData}/>;
      case 'account-uploads':
        return <AccountUploads userData={userData}/>;
      case 'experience':
        // Only show for builders, not customers
        if (user_type === 'CUSTOMER') {
          return <AccountInfo userData={userData} />;
        }
        return <Experience userData={userData}/>;
      case 'products':
        // Only show for builders, not customers
        if (user_type === 'CUSTOMER') {
          return <AccountInfo userData={userData} />;
        }
        //@ts-nocheck
        return <Products userData={userData} user_type={user_type} />;
      default:
        return <AccountInfo userData={userData} />;
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
