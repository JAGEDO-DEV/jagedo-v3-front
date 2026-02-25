/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import ProductUploadForm from "./ProductUploadForm";
import FileImportButton from "./FileImportButton";
import FileUploadPage from "./FileImportPreview.tsx";
import { ShoppingBagIcon, LockClosedIcon } from '@heroicons/react/24/outline';

const ShopAppPage = ({ data: profileData }) => {
  const [currentView, setCurrentView] = useState('default');

  // Handlers to change the view
  const showCreateView = () => setCurrentView('create');
  const showImportView = () => setCurrentView('import');
  const showDefaultView = () => setCurrentView('default');

  const viewTitles = {
    default: 'Manage Product Catalog',
    create: 'Add a New Product',
    import: 'Batch Import Products'
  };

  const isApproved = profileData?.status == 'VERIFIED' === true;

  const renderCurrentView = () => {
    switch (currentView) {
      case 'create':
        return <ProductUploadForm onCancel={showDefaultView} />;

      case 'import':
        return <FileUploadPage onBack={showDefaultView} />;

      case 'default':
      default:
        return (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-8 md:p-12">
              <div className="flex flex-col lg:flex-row items-center gap-12 text-center lg:text-left">
                {isApproved ? (
                  <>
                    <div className="lg:w-1/2 space-y-6">
                      <div className="inline-flex p-3 bg-indigo-50 rounded-2xl">
                        <ShoppingBagIcon className="w-8 h-8 text-indigo-600" />
                      </div>
                      <h2 className="text-3xl font-black text-gray-900 leading-tight">
                        Build Your Professional Marketplace
                      </h2>
                      <p className="text-gray-500 text-sm leading-relaxed font-medium">
                        Create a compelling product collection that showcases your best inventory.
                        Add high-resolution photos and competitive pricing to win more bids on the Jagedo platform.
                      </p>
                      <div className="flex flex-col sm:flex-row items-center lg:items-start gap-4 pt-4">
                        <button
                          type='button'
                          onClick={showCreateView}
                          className="bg-indigo-600 text-white font-bold px-8 py-3.5 rounded-xl transition shadow-lg shadow-indigo-100 hover:bg-indigo-700 flex items-center gap-2 transform active:scale-95"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                          </svg>
                          Create Listing
                        </button>
                        <FileImportButton onImportClick={showImportView} />
                      </div>
                    </div>
                    <div className="lg:w-1/2 hidden lg:block">
                      <div className="bg-gray-50 aspect-video rounded-3xl border border-gray-100 flex items-center justify-center p-8">
                        <div className="text-center space-y-2 opacity-40">
                          <ShoppingBagIcon className="w-16 h-16 mx-auto text-gray-300" />
                          <p className="text-sm font-bold text-gray-400">Empty Catalog Preview</p>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="max-w-xl mx-auto space-y-6">
                    <div className="inline-flex p-4 bg-yellow-50 rounded-2xl border border-yellow-100">
                      <LockClosedIcon className="w-10 h-10 text-yellow-600" />
                    </div>
                    <h2 className="text-3xl font-black text-gray-900 leading-tight">
                      Verify Your Account to Start Selling
                    </h2>
                    <p className="text-gray-500 text-sm font-medium leading-relaxed">
                      Your store functionality is currently restricted. Once our team approves your profile and professional experience,
                      you will be able to upload products and manage your digital storefront.
                    </p>
                    <div className="pt-4">
                      <div className="inline-block px-4 py-1.5 bg-gray-100 rounded-full text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                        Awaiting Documentation Approval
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 sm:p-8">
      <div className="mb-10 text-center lg:text-left">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight font-inter">
          {viewTitles[currentView]}
        </h1>
      </div>
      {renderCurrentView()}
    </div>
  );
}

export default ShopAppPage;