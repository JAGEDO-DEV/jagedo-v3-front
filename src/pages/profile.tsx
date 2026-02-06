import { useState, useEffect, useMemo } from "react";
import ProfileSide from "@/components/profile/ProfileSideBar";
import AccountInfo from "@/components/profile/Account";
import Address from "@/components/profile/Address";
import AccountUploads from "@/components/profile/AccountUploads";
import FundiExperience from "@/components/profile/FundiExperience";
import { useGlobalContext } from "@/context/GlobalProvider";
import Activity from "@/components/profile/Activity";
import ProffExperience from "@/components/profile/ProffExperience";
import ShopAppPage from "@/components/profile/FundiShopApp";
import ContractorExperience from "@/components/profile/ContractorExperience";
import { AlertCircle, CheckCircle } from "lucide-react";

function ProfilePage() {
    const [activeComponent, setActiveComponent] = useState("Account Info");
    const { user, logout } = useGlobalContext();
    const [rerender, setRerender] = useState(0);

    useEffect(() => {
        const handleStorageChange = () => {
            setRerender(prev => prev + 1);
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    useEffect(() => {
        if (!user) {
            return;
        }
        const userType = user?.userType?.toUpperCase();
        const serviceProviderTypes = ["FUNDI", "CONTRACTOR", "PROFESSIONAL", "HARDWARE"];

        if (
            serviceProviderTypes.includes(userType) &&
            !user?.userProfile?.complete
        ) {
            setActiveComponent("Account Info");
        }
    }, [user]);

    const completionStatus = useMemo((): { [key: string]: 'complete' | 'incomplete' } => {
        const userType = user?.userType?.toLowerCase() || '';

        const getRequiredDocuments = () => {
            const accountType = user?.accountType?.toLowerCase() || '';
            if (accountType === 'individual' && userType === 'customer') {
                return ['idFront', 'idBack', 'kraPIN'];
            }
            const docMap: any = {
                customer: ['businessPermit', 'certificateOfIncorporation', 'kraPIN'],
                fundi: ['idFrontUrl', 'idBackUrl', 'certificateUrl', 'kraPIN'],
                professional: ['idFrontUrl', 'idBackUrl', 'academicCertificateUrl', 'cvUrl', 'kraPIN'],
                contractor: ['businessRegistration', 'businessPermit', 'kraPIN', 'companyProfile'],
                hardware: ['businessRegistration', 'kraPIN', 'singleBusinessPermit', 'companyProfile'],
            };
            return docMap[userType] || [];
        };

        const uploadedDocs = JSON.parse(localStorage.getItem(`uploads_demo_${user?.id}`) || '{}');
        const requiredDocs = getRequiredDocuments();
        const uploadsComplete = requiredDocs.length === 0 || requiredDocs.every(doc => uploadedDocs[doc]);

        let experienceComplete = false;
        if (userType !== 'customer' && userType !== 'hardware') {
            const hasGrade = user?.userProfile?.grade;
            const hasExperience = user?.userProfile?.experience;
            const hasProjects = user?.userProfile?.previousJobPhotoUrls && user.userProfile.previousJobPhotoUrls.length > 0;
            experienceComplete = hasGrade && hasExperience && hasProjects;
        } else {
            experienceComplete = true;
        }

        return {
            'Account Info': 'complete',
            'Address': 'complete',
            'Account Uploads': uploadsComplete ? 'complete' : 'incomplete',
            'Experience': experienceComplete ? 'complete' : 'incomplete',
            'Products': 'incomplete',
            'Activities': 'complete',
        };
    }, [user?.id, user?.accountType, user?.userType, user?.userProfile, rerender]);

    const progressPercentage = useMemo(() => {
        const relevantKeys = Object.keys(completionStatus).filter(key => key !== 'Activities');

        const userType = user?.userType?.toLowerCase();
        const finalKeys = relevantKeys.filter(key => {
            if (key === 'Products' && (userType === 'customer' || userType === 'contractor' || userType === 'hardware')) return false;
            return true;
        });

        const completedCount = finalKeys.filter(key => completionStatus[key] === 'complete').length;
        return Math.round((completedCount / finalKeys.length) * 100);
    }, [completionStatus, user]);


    const renderContent = () => {
        const userType = (user?.userType || '').toLowerCase();

        switch (activeComponent) {
            case "Account Info":
                return <AccountInfo />;
            case "Address":
                return <Address />;
            case "Account Uploads":
                return <AccountUploads />;
            case "Experience":
                if (userType === 'fundi') {
                    return <FundiExperience />;
                }
                if (userType === 'professional') {
                    return <ProffExperience />;
                }
                if (userType === 'contractor') {
                    return <ContractorExperience />;
                }
                return <AccountInfo />;
            case "Products":
                if (userType === 'customer') {
                    return <AccountInfo />;
                }
                return <ShopAppPage />;
            case "Activities":
                return <Activity />;
            default:
                return <AccountInfo />;
        }
    };

    const isServiceProvider =
        user?.userType === "FUNDI" ||
        user?.userType === "CONTRACTOR" ||
        user?.userType === "PROFESSIONAL" ||
        user?.userType === "HARDWARE";

    return (
        <div className="min-h-screen bg-gray-50">
            {isServiceProvider && user.adminApproved === false && (
                <div className="fixed top-12 w-full px-4 sm:px-6 pointer-events-none z-50">
                    <div className="w-[70%] sm:max-w-md mx-auto flex items-start gap-2 bg-yellow-100 rounded-md p-2 sm:p-4 shadow-md">
                        <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 mt-0.5 sm:mt-1 text-yellow-500 flex-shrink-0" />
                        <span className="text-xs sm:text-sm text-yellow-700 leading-tight sm:leading-snug">
                            {user?.userProfile?.complete
                                ? "Your profile is complete and awaiting admin approval."
                                : "Please complete your profile for your account to be approved."
                            }
                        </span>
                    </div>
                </div>
            )}

            <div className="flex">
                {/* Sidebar */}
                <ProfileSide
                    activeComponent={activeComponent}
                    setActiveComponent={setActiveComponent}
                    user={user}
                    completionStatus={completionStatus}
                />

                <div className="flex-1 ml-16 sm:ml-64 lg:ml-80 transition-all duration-500 flex flex-col min-h-screen">

                    <header className="sticky top-0 z-30 w-full bg-white py-4 shadow-sm px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between">
                            {/* Welcome Message */}
                            <h1 className="text-xl font-bold text-gray-800 sm:text-2xl md:text-3xl truncate">
                                Welcome, {user?.organizationName || user?.firstName || user?.contactFullName || "User"}!
                            </h1>

                            {/* Logout Button */}
                            <button
                                onClick={logout}
                                className="
                                    rounded-md bg-indigo-600 px-4 py-2 
                                    text-sm font-semibold text-white 
                                    shadow-sm transition-colors duration-200 
                                    hover:bg-indigo-500 
                                    focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
                                    whitespace-nowrap flex-shrink-0
                                "
                            >
                                Logout
                            </button>
                        </div>
                    </header>

                    <main className="flex-1 p-3 sm:p-4 lg:p-6">
                        <div className="max-w-6xl mx-auto space-y-6">

                            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                        Profile Completion
                                        {progressPercentage === 100 && (
                                            <CheckCircle className="h-4 w-4 text-green-500" />
                                        )}
                                    </h3>
                                    <span className={`text-sm font-bold ${progressPercentage === 100 ? 'text-green-600' : 'text-blue-600'}`}>
                                        {progressPercentage}%
                                    </span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                                    <div
                                        className={`h-2.5 rounded-full transition-all duration-1000 ease-out ${progressPercentage === 100 ? 'bg-green-500' : 'bg-blue-600'
                                            }`}
                                        style={{ width: `${progressPercentage}%` }}
                                    ></div>
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                    {progressPercentage === 100
                                        ? "Great job! Your profile is fully complete."
                                        : "Complete all sections to verify your account."}
                                </p>
                            </div>

                            {renderContent()}
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}

export default ProfilePage;