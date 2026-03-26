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
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import useAxiosWithAuth from "@/utils/axiosInterceptor";
import { getProviderProfile } from "@/api/provider.api";

function ProfilePage() {
  const [activeComponent, setActiveComponent] = useState("Account Info");
  const { user, logout } = useGlobalContext();
  const [rerender, setRerender] = useState(0);
  const [providerData, setProviderData] = useState(null);
  const [loadingData, setLoadingData] = useState(true);

  const axiosInstance = useAxiosWithAuth(import.meta.env.VITE_SERVER_URL);

  useEffect(() => {
    const fetchProviderProfile = async () => {
      if (!user?.id) {
        setLoadingData(false);
        return;
      }

      try {
        setLoadingData(true);
        const response = await getProviderProfile(axiosInstance, user.id);
        if (response.success) {
          setProviderData(response.data);
        }
      } catch (error) {
        console.error("Error fetching provider profile:", error);
      } finally {
        setLoadingData(false);
      }
    };

    fetchProviderProfile();
  }, [user?.id, rerender]);

  useEffect(() => {
    const handleStorageChange = () => {
      setRerender((prev) => prev + 1);
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  useEffect(() => {
    if (!user) return;
    const userType = user?.userType?.toUpperCase();
    const serviceProviderTypes = [
      "FUNDI",
      "CONTRACTOR",
      "PROFESSIONAL",
      "HARDWARE",
    ];

    if (serviceProviderTypes.includes(userType) && !user?.profileComplete) {
      setActiveComponent("Account Info");
    }
  }, [user]);

  const isFilled = (val) => val !== null && val !== undefined && val !== "";

  const isArrayFilled = (arr) => Array.isArray(arr) && arr.length > 0;

  const getAccountInfoFields = (userType, accountType) => {
    const isOrgType =
      accountType === "organization" ||
      accountType === "business" ||
      userType === "contractor" ||
      userType === "hardware";

    if (isOrgType) {

      const showsContactName =
        userType === "customer" ||
        userType === "contractor" ||
        userType === "hardware";

      return showsContactName
        ? ["organizationName", "contactFullName", "phone", "email"]
        : ["organizationName", "phone", "email"];
    }


    return ["firstName", "lastName", "phone", "email"];
  };

  const getAddressFields = () => {
    return ["country", "county", "subCounty", "city", "estate"];
  };

  const isSectionComplete = (data, fields) => {
    return fields.every((field) => isFilled(data?.[field]));
  };

  const completionStatus = useMemo(() => {

    const up = providerData || user;


    const userType = (up?.userType || "").toLowerCase();
    const accountType = (up?.accountType || "").toLowerCase();

    const getRequiredDocuments = () => {
      const accountType = user?.accountType?.toLowerCase() || "";

      if (userType === "customer" && accountType === "individual") {
        return ["idFrontUrl", "idBackUrl", "krapin"];
      }

      const docMap: Record<string, string[]> = {
        customer: ["businessPermit", "certificateOfIncorporation", "krapin"],
        fundi: ["idFrontUrl", "idBackUrl", "certificateUrl", "krapin"],
        professional: [
          "idFrontUrl",
          "idBackUrl",
          "academicCertificateUrl",
          "cvUrl",
          "krapin",
          "practiceLicense",
        ],
        contractor: [
          "businessRegistration",
          "businessPermit",
          "krapin",
          "companyProfile",
        ],
        hardware: [
          "businessRegistration",
          "businessPermit",
          "krapin",
          "idFrontUrl",
          "idBackUrl",
        ],
      };
      return docMap[userType] || [];
    };

    let uploadsComplete = false;

    if (providerData?.documentStatus === "VERIFIED") {
      uploadsComplete = true;
    } else if (
      providerData?.documentStatus === "REJECTED" ||
      providerData?.documentStatus === "RESUBMIT"
    ) {
      uploadsComplete = false;
    } else {


      if (userType === "contractor") {

        const hasBusinessReg =
          up?.businessRegistration || up?.certificateOfIncorporation;
        const hasPermit = up?.businessPermit;
        const hasKrapin = up?.krapin;
        const hasCompanyProfile = up?.companyProfile;

        const baseDocsComplete = !!(
          hasBusinessReg &&
          hasPermit &&
          hasKrapin &&
          hasCompanyProfile
        );

        let categoryDocsComplete = true;
        const contractorCategories =
          up?.contractorCategories || up?.contractorExperiences || [];

        if (
          Array.isArray(contractorCategories) &&
          contractorCategories.length > 0
        ) {

          categoryDocsComplete = contractorCategories.every((cat: any) => {
            const categoryName = cat.category || "";
            if (!categoryName) return true;

            const categoryKey = categoryName.toUpperCase().replace(/\s+/g, "_");
            const certKey = `${categoryKey}_CERTIFICATE`;
            const licenseKey = `${categoryKey}_LICENSE`;

            const hasCert = cat.certificate || up?.[certKey];
            const hasLicense = cat.license || up?.[licenseKey];

            return !!(hasCert && hasLicense);
          });
        }

        uploadsComplete = baseDocsComplete && categoryDocsComplete;
      } else if (userType === "professional") {
        if (providerData?.documentStatus === "REJECTED") {
          uploadsComplete = false;
        } else {
          const hasIdFront = !!up?.idFrontUrl;
          const hasIdBack = !!up?.idBackUrl;
          const hasAcademicCert = !!up?.academicCertificateUrl;
          const hasCv = !!up?.cvUrl;
          const hasKrapin = !!up?.krapin;

          uploadsComplete =
            hasIdFront && hasIdBack && hasAcademicCert && hasCv && hasKrapin;
        }
      } else if (userType === "fundi") {
        // Fundi need: ID front/back + certificate + KRA PIN
        // Check with fallback field names
        const hasIdFront = !!up?.idFrontUrl;
        const hasIdBack = !!up?.idBackUrl;
        const hasCertificate = !!up?.certificateUrl;
        const hasKrapin = !!up?.krapin;

        uploadsComplete =
          hasIdFront && hasIdBack && hasCertificate && hasKrapin;
      } else {
        const requiredDocs = getRequiredDocuments();
        uploadsComplete =
          requiredDocs.length > 0 &&
          requiredDocs.every((key) => {
            const value = up?.[key];
            return value !== null && value !== undefined && value !== "";
          });
      }
    }

    let experienceComplete =
      providerData?.experienceStatus == "VERIFIED" ||
      providerData?.experienceStatus == "PENDING";

    const accountFields = getAccountInfoFields(userType, accountType);
    const accountComplete = isSectionComplete(up, accountFields);


    const addressFields = getAddressFields();
    const addressComplete = up ? isSectionComplete(up, addressFields) : false;

    return {
      "Account Info": accountComplete ? "complete" : "incomplete",
      Address: addressComplete ? "complete" : "incomplete",
      "Account Uploads": uploadsComplete ? "complete" : "incomplete",
      Experience: experienceComplete ? "complete" : "incomplete",

      Activities: "complete",
    };
  }, [
    user?.id,
    user?.accountType,
    user?.userType,
    user?.profileComplete,
    providerData,
    rerender,
  ]);

  const progressPercentage = useMemo(() => {
    const relevantKeys = Object.keys(completionStatus).filter(
      (key) => key !== "Activities",
    );

    const userType = user?.userType?.toLowerCase();
    const finalKeys = relevantKeys.filter((key) => {
      if (key === "Products") return false;
      if (
        key === "Experience" &&
        (userType === "customer" || userType === "hardware")
      )
        return false;
      return true;
    });

    const completedCount = finalKeys.filter(
      (key) => completionStatus[key] === "complete",
    ).length;
    return Math.round((completedCount / finalKeys.length) * 100);
  }, [completionStatus, user]);


  const renderContent = () => {
    const userType = (user?.userType || "").toLowerCase();


    const props = {
      data: providerData,
      refreshData: () => setRerender((prev) => prev + 1),
    };

    switch (activeComponent) {
      case "Account Info":
        return <AccountInfo {...props} />;
      case "Address":
        return <Address {...props} />;
      case "Account Uploads":
        return <AccountUploads {...props} />;
      case "Experience":
        if (userType === "fundi") return <FundiExperience {...props} />;
        if (userType === "professional") return <ProffExperience {...props} />;
        if (userType === "contractor")
          return <ContractorExperience {...props} />;
        return <AccountInfo {...props} />;
      case "Products":
        if (userType === "customer") return <AccountInfo {...props} />;
        return <ShopAppPage {...props} />;
      case "Activities":
        return <Activity {...props} />;
      default:
        return <AccountInfo {...props} />;
    }
  };

  if (loadingData && !providerData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <Loader2 className="h-10 w-10 text-indigo-600 animate-spin mb-4" />
        <p className="text-gray-600 font-medium">Loading Profile...</p>
      </div>
    );
  }

  const isServiceProvider =
    user?.userType === "FUNDI" ||
    user?.userType === "CONTRACTOR" ||
    user?.userType === "PROFESSIONAL" ||
    user?.userType === "HARDWARE";

  return (
    <div className="min-h-screen bg-gray-50">
      {isServiceProvider &&
        ((providerData?.status == "VERIFIED") === false ||
          (user?.status == "VERIFIED") === false) && (
          <div className="fixed top-12 w-full px-4 sm:px-6 pointer-events-none z-50">
            <div className="w-[70%] sm:max-w-md mx-auto flex items-start gap-2 bg-yellow-100 rounded-md p-2 sm:p-4 shadow-md">
              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 mt-0.5 sm:mt-1 text-yellow-500 flex-shrink-0" />
              <span className="text-xs sm:text-sm text-yellow-700 leading-tight sm:leading-snug">
                {providerData?.profileComplete || user?.profileComplete
                  ? "Your profile is complete and awaiting admin approval."
                  : "Please complete your profile for your account to be approved."}
              </span>
            </div>
          </div>
        )}

      <div className="flex">
        <ProfileSide
          activeComponent={activeComponent}
          setActiveComponent={setActiveComponent}
          user={user}
          completionStatus={completionStatus}
        />

        <div className="flex-1 ml-16 sm:ml-64 lg:ml-80 transition-all duration-500 flex flex-col min-h-screen">
          <header className="sticky top-0 z-30 w-full bg-white py-4 shadow-sm px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold pl-4 text-gray-800 sm:text-2xl md:text-3xl truncate">
                Welcome,{" "}
                {providerData?.organizationName ||
                  providerData?.firstName ||
                  user?.firstName ||
                  "User"}
                !
              </h1>
              <button
                onClick={logout}
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
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
                  <span
                    className={`text-sm font-bold ${progressPercentage === 100 ? "text-green-600" : "text-blue-600"}`}
                  >
                    {progressPercentage}%
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-2.5 rounded-full transition-all duration-1000 ease-out ${progressPercentage === 100
                        ? "bg-green-500"
                        : "bg-blue-600"
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
