import { useState } from "react";

// Import all the components this page can display
import ProductUploadForm from "@/components/profile/ProductUploadForm.tsx";
import FileImportButton from "@/components/profile/FileImportButton.tsx";
import FileUploadPage from "@/components/profile/FileImportPreview.tsx";

const ShopAppPage = ({ userType, userData, data }: { userType?: string, userData?: any, data?: any }) => {
    const activeUser = userData || data;
    const activeType = userType || activeUser?.userType;
    // 1. Use a string to manage which view is active.
    const [currentView, setCurrentView] = useState("default");

    // Handlers to change the view
    const showCreateView = () => setCurrentView("create");
    const showImportView = () => setCurrentView("import");
    const showDefaultView = () => setCurrentView("default");

    // Helper object for dynamic titles
    const viewTitles = {
        default: "Products",
        create: "Add a New Product",
        import: "Import Products from File"
    };

    // Function to render the correct component based on the state
    const renderCurrentView = () => {
        switch (currentView) {
            case "create":
                // Pass the function to return to the default view
                return <ProductUploadForm onCancel={showDefaultView} initialType={activeType} targetUser={activeUser} />;

            case "import":
                // Also pass the function to return to the default view
                return <FileUploadPage onBack={showDefaultView} />;

            case "default":
            default:
                // The default view with the buttons
                return (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-8">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                                <div>
                                    <h2 className="text-2xl font-semibold text-gray-800 mb-3">
                                        Start Building Your Product Catalog
                                    </h2>
                                    <p className="text-gray-600 leading-relaxed mb-6">
                                        Create a compelling product collection
                                        that showcases your best items. Add
                                        detailed descriptions, high-quality
                                        images, and competitive pricing to
                                        attract more customers.
                                    </p>
                                    <div className="flex gap-4 mt-5">
                                        <button
                                            type="button"
                                            onClick={showCreateView} // Show the create form
                                            className="bg-[rgb(0,0,122)] text-white cursor-pointer hover:bg-blue-200 hover:text-black font-semibold text-white px-6 py-2.5 rounded-lg transition duration-500 inline-flex items-center gap-2 shadow-md"
                                        >
                                            <svg
                                                className="w-5 h-5"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="2"
                                                    d="M12 4v16m8-8H4"
                                                />
                                            </svg>
                                            Add Product
                                        </button>
                                        <div>
                                            {/* Pass the handler to the button component */}
                                            <FileImportButton
                                                onImportClick={showImportView}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="min-h-screen flex gap-4 bg-gray-50 p-8">
            {/* Sidebar Navigation (if any) */}
            <div className="hidden pr-8"></div>

            {/* Main Content Section */}
            <div className="w-full max-w-6xl">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">
                        {viewTitles[currentView]}
                    </h1>
                </div>

                {/* Render the view determined by our state */}
                {renderCurrentView()}
            </div>
        </div>
    );
};

export default ShopAppPage;
