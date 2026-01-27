/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { FiDownload, FiUpload, FiTrash2 } from "react-icons/fi";
import { UploadCloud } from "lucide-react";
// import { uploadFile } from "@/utils/fileUpload";
// import { adminDynamicUpdateAccountUploads } from "@/api/uploads.api";
// import useAxiosWithAuth from "@/utils/axiosInterceptor";
import { toast, Toaster } from "sonner";
// import { handleVerifyUser } from "@/api/provider.api";

// --- Helper: update a user in localStorage "users" array ---
const updateUserInLocalStorage = (userId: string, updates: Record<string, any>) => {
    try {
        const storedUsers = JSON.parse(localStorage.getItem('users') || '[]');
        const idx = storedUsers.findIndex((u: any) => u.id === userId);
        if (idx !== -1) {
            storedUsers[idx] = { ...storedUsers[idx], ...updates };
            localStorage.setItem('users', JSON.stringify(storedUsers));
        }
        const singleUser = JSON.parse(localStorage.getItem('user') || 'null');
        if (singleUser && singleUser.id === userId) {
            localStorage.setItem('user', JSON.stringify({ ...singleUser, ...updates }));
        }
    } catch (err) {
        console.error('Failed to update user in localStorage:', err);
    }
};

const Uploads2 = ({ userData }: { userData: any }) => {
    // const axiosInstance = useAxiosWithAuth(import.meta.env.VITE_SERVER_URL);
    const [showVerificationMessage, setShowVerificationMessage] = useState(false);

    // --- ORIGINAL API-based document update (commented out) ---
    // const handleUpdateUserDocuments = async (key: any, updatedUrl: any) => {
    //     try {
    //         const userType = userData?.userType?.toLowerCase();
    //         const accountType = userData?.accountType?.toLowerCase();
    //         const profile = userData?.userProfile || {};
    //
    //         let data: any = {};
    //
    //         const isIndividualCustomer = accountType === "individual" && userType === "customer";
    //
    //         if (isIndividualCustomer) {
    //             data = {
    //                 idFrontUrl: key === 'idFrontUrl' ? updatedUrl : (profile.idFrontUrl || ''),
    //                 idBackUrl: key === 'idBackUrl' ? updatedUrl : (profile.idBackUrl || ''),
    //                 kraPIN: key === 'kraPIN' ? updatedUrl : (profile.kraPIN || '')
    //             };
    //         } else {
    //             switch (userType) {
    //                 case 'customer':
    //                     data = {
    //                         businessPermit: key === 'businessPermit' ? updatedUrl : (profile.businessPermit || ''),
    //                         certificateOfIncorporation: key === 'certificateOfIncorporation' ? updatedUrl : (profile.certificateOfIncorporation || ''),
    //                         kraPIN: key === 'kraPIN' ? updatedUrl : (profile.kraPIN || '')
    //                     };
    //                     break;
    //                 case 'fundi':
    //                     data = {
    //                         idFront: key === 'idFront' ? updatedUrl : (profile.idFrontUrl || ''),
    //                         idBack: key === 'idBack' ? updatedUrl : (profile.idBackUrl || ''),
    //                         certificate: key === 'certificate' ? updatedUrl : (profile.certificateUrl || ''),
    //                         kraPIN: key === 'kraPIN' ? updatedUrl : (profile.kraPIN || '')
    //                     };
    //                     break;
    //                 case 'professional':
    //                     data = {
    //                         idFront: key === 'idFront' ? updatedUrl : (profile.idFrontUrl || ''),
    //                         idBack: key === 'idBack' ? updatedUrl : (profile.idBackUrl || ''),
    //                         academicCertificate: key === 'academicCertificate' ? updatedUrl : (profile.academicCertificateUrl || ''),
    //                         cvUrl: key === 'cv' ? updatedUrl : (profile.cvUrl || ''),
    //                         kraPIN: key === 'kraPIN' ? updatedUrl : (profile.kraPIN || ''),
    //                         practiceLicense: key === 'practiceLicense' ? updatedUrl : (profile.practiceLicense || '')
    //                     };
    //                     break;
    //                 case 'contractor':
    //                     data = {
    //                         businessRegistration: key === 'businessRegistration' ? updatedUrl : (profile.businessRegistration || ''),
    //                         businessPermit: key === 'businessPermit' ? updatedUrl : (profile.businessPermit || ''),
    //                         kraPIN: key === 'kraPIN' ? updatedUrl : (profile.kraPIN || ''),
    //                         companyProfile: key === 'companyProfile' ? updatedUrl : (profile.companyProfile || '')
    //                     };
    //                     break;
    //                 case 'hardware':
    //                     data = {
    //                         certificateOfIncorporation: key === 'certificateOfIncorporation' ? updatedUrl : (profile.certificateOfIncorporation || ''),
    //                         kraPIN: key === 'kraPIN' ? updatedUrl : (profile.kraPIN || ''),
    //                         singleBusinessPermit: key === 'singleBusinessPermit' ? updatedUrl : (profile.singleBusinessPermit || ''),
    //                         companyProfile: key === 'companyProfile' ? updatedUrl : (profile.companyProfile || '')
    //                     };
    //                     break;
    //                 default:
    //                     throw new Error(`Unsupported user type: ${userType}`);
    //             }
    //         }
    //
    //         console.log('Sending complete document payload to API:', data);
    //         console.log('User type:', userData);
    //         console.log('User ID:', userData.id);
    //
    //         const response = await adminDynamicUpdateAccountUploads(axiosInstance, data, userData.userType, userData.id, userData.accountType);
    //         console.log('API response:', response);
    //
    //         if (response && (response.success || response.message)) {
    //             return response;
    //         } else {
    //             throw new Error("Invalid response from server");
    //         }
    //     } catch (error: any) {
    //         console.error('API update error:', error);
    //         throw new Error(error.message || "Failed to update documents");
    //     }
    // }
    // --- END ORIGINAL ---

    // --- localStorage-based document update ---
    const handleUpdateUserDocuments = (key: any, updatedUrl: any) => {
        const profile = userData?.userProfile || {};
        const updatedProfile = { ...profile, [key]: updatedUrl };

        // Also update the key with "Url" suffix if applicable
        const keyMap: Record<string, string> = {
            idFront: 'idFrontUrl',
            idBack: 'idBackUrl',
            certificate: 'certificateUrl',
            academicCertificate: 'academicCertificateUrl',
            cv: 'cvUrl',
            ncaRegCard: 'ncaRegCardUrl',
            registrationCertificate: 'registrationCertificateUrl',
        };
        if (keyMap[key]) {
            updatedProfile[keyMap[key]] = updatedUrl;
        }

        userData.userProfile = updatedProfile;
        updateUserInLocalStorage(userData.id, { userProfile: updatedProfile });
        console.log('Updated user documents in localStorage:', updatedProfile);
        return { success: true, message: "Documents updated in localStorage" };
    };

    // Extract documents from userData.userProfile
    const getDocumentsFromProfile = () => {
        if (!userData?.userProfile) return {};

        const profile = userData.userProfile;
        const documents: any = {};

        // Add documents that exist in the profile
        if (profile.idFrontUrl) {
            documents.idFront = {
                name: "ID Front",
                url: profile.idFrontUrl,
                type: "idFront"
            };
        }

        if (profile.idBackUrl) {
            documents.idBack = {
                name: "ID Back",
                url: profile.idBackUrl,
                type: "idBack"
            };
        }

        if (profile.certificateUrl) {
            documents.certificate = {
                name: "Certificate",
                url: profile.certificateUrl,
                type: "certificate"
            };
        }

        if (profile.kraPIN) {
            documents.kraPIN = {
                name: "KRA PIN",
                url: profile.kraPIN,
                type: "kraPIN"
            };
        }

        if (profile.cvUrl) {
            documents.cv = {
                name: "CV",
                url: profile.cvUrl,
                type: "cv"
            };
        }

        if (profile.academicCertificateUrl) {
            documents.academicCertificate = {
                name: "Academic Certificate",
                url: profile.academicCertificateUrl,
                type: "academicCertificate"
            };
        }

        if (profile.registrationCertificateUrl) {
            documents.registrationCertificate = {
                name: "Registration Certificate",
                url: profile.registrationCertificateUrl,
                type: "registrationCertificate"
            };
        }

        if (profile.businessPermit) {
            documents.businessPermit = {
                name: "Business Permit",
                url: profile.businessPermit,
                type: "businessPermit"
            };
        }

        if (profile.businessRegistration) {
            documents.businessRegistration = {
                name: "Business Registration",
                url: profile.businessRegistration,
                type: "businessRegistration"
            };
        }

        if (profile.companyProfile) {
            documents.companyProfile = {
                name: "Company Profile",
                url: profile.companyProfile,
                type: "companyProfile"
            };
        }

        if (profile.practiceLicense) {
            documents.practiceLicense = {
                name: "Practice License",
                url: profile.practiceLicense,
                type: "practiceLicense"
            };
        }

        if (profile.ncaRegCardUrl) {
            documents.ncaRegCard = {
                name: "NCA Registration Card",
                url: profile.ncaRegCardUrl,
                type: "ncaRegCard"
            };
        }

        if (profile.certificateOfIncorporation) {
            documents.certificateOfIncorporation = {
                name: "Certificate of Incorporation",
                url: profile.certificateOfIncorporation,
                type: "certificateOfIncorporation"
            };
        }

        if (profile.singleBusinessPermit) {
            documents.singleBusinessPermit = {
                name: "Single Business Permit",
                url: profile.singleBusinessPermit,
                type: "singleBusinessPermit"
            };
        }

        return documents;
    };

    const [documents, setDocuments] = useState(getDocumentsFromProfile());
    const [uploadingFiles, setUploadingFiles] = useState<{[key: string]: boolean}>({});

    // --- ORIGINAL API-based verify (commented out) ---
    // const handleVerify = async () => {
    //     try {
    //         const userId = userData.id;
    //         if (!userId) {
    //             alert("User ID not found.");
    //             return;
    //         }
    //         const response = await handleVerifyUser(axiosInstance, userId);
    //         console.log("Response: ", response)
    //         setShowVerificationMessage(true);
    //     } catch (error) {
    //         alert("Verification failed. Please try again.");
    //         console.error(error);
    //     }
    // };
    // --- END ORIGINAL ---

    // --- localStorage-based verify ---
    const handleVerify = () => {
        const userId = userData.id;
        if (!userId) {
            alert("User ID not found.");
            return;
        }
        updateUserInLocalStorage(userId, { adminApproved: true, approved: true });
        Object.assign(userData, { adminApproved: true, approved: true });
        console.log("User verified in localStorage");
        setShowVerificationMessage(true);
    };

    const handleClose = () => {
        setShowVerificationMessage(false);
    };

    // --- ORIGINAL API-based file replace (commented out) ---
    // const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, key: string) => {
    //     const file = e.target.files?.[0];
    //     if (file) {
    //         try {
    //             const uploadedFile = await uploadFile(file);
    //             const newDoc = {
    //                 name: file.name,
    //                 url: uploadedFile.url,
    //                 type: key
    //             };
    //             setDocuments((prev: any) => ({
    //                 ...prev,
    //                 [key]: newDoc
    //             }));
    //             await handleUpdateUserDocuments(key, uploadedFile.url);
    //             toast.success(`${getDocumentDisplayName(key)} replaced successfully!`);
    //         } catch (error: any) {
    //             console.error('Replace file error:', error);
    //             toast.error(`Failed to replace ${getDocumentDisplayName(key)}: ${error.message || 'Unknown error'}`);
    //         }
    //     }
    // };
    // --- END ORIGINAL ---

    // --- localStorage-based file replace (using local object URL) ---
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, key: string) => {
        const file = e.target.files?.[0];
        if (file) {
            const localUrl = URL.createObjectURL(file);
            const newDoc = {
                name: file.name,
                url: localUrl,
                type: key
            };
            setDocuments((prev: any) => ({
                ...prev,
                [key]: newDoc
            }));
            handleUpdateUserDocuments(key, localUrl);
            toast.success(`${getDocumentDisplayName(key)} replaced successfully!`);
        }
    };

    // --- ORIGINAL API-based delete (commented out) ---
    // const handleDelete = async (key: string) => {
    //     try {
    //         const updated = { ...documents };
    //         delete updated[key];
    //         setDocuments(updated);
    //         await handleUpdateUserDocuments(key, "");
    //         toast.success("Document deleted successfully!");
    //     } catch (error: any) {
    //         console.error('Delete error:', error);
    //         toast.error("Failed to delete document");
    //     }
    // };
    // --- END ORIGINAL ---

    // --- localStorage-based delete ---
    const handleDelete = (key: string) => {
        const updated = { ...documents };
        delete updated[key];
        setDocuments(updated);
        handleUpdateUserDocuments(key, "");
        toast.success("Document deleted successfully!");
    };

    const getDocumentDisplayName = (key: string) => {
        const displayNames: { [key: string]: string } = {
            idFront: "ID Front",
            idBack: "ID Back",
            certificate: "Certificate",
            kraPIN: "KRA PIN",
            cv: "CV",
            academicCertificate: "Academic Certificate",
            registrationCertificate: "Registration Certificate",
            businessPermit: "Business Permit",
            businessRegistration: "Business Registration",
            companyProfile: "Company Profile",
            practiceLicense: "Practice License",
            ncaRegCard: "NCA Registration Card",
            certificateOfIncorporation: "Certificate of Incorporation",
            singleBusinessPermit: "Single Business Permit"
        };

        return displayNames[key] || key.replace(/([A-Z])/g, " $1").trim();
    };

    // Get required documents based on user type
    const getRequiredDocuments = () => {
        const userType = userData?.userType?.toLowerCase();
        const accountType = userData?.accountType?.toLowerCase();
        const isIndividualCustomer = accountType === "individual" && userType === "customer";

        if (isIndividualCustomer) {
            return [
                { key: "idFront", name: "ID Front", profileKey: "idFrontUrl" },
                { key: "idBack", name: "ID Back", profileKey: "idBackUrl" },
                { key: "kraPIN", name: "KRA PIN", profileKey: "kraPIN" },
            ];
        }

        const documentMappings: { [key: string]: any[] } = {
            customer: [
                { key: "businessPermit", name: "Business Permit", profileKey: "businessPermit" },
                { key: "certificateOfIncorporation", name: "Certificate of Incorporation", profileKey: "certificateOfIncorporation" },
                { key: "kraPIN", name: "KRA PIN", profileKey: "kraPIN" },
            ],
            contractor: [
                { key: "businessRegistration", name: "Business Registration", profileKey: "businessRegistration" },
                { key: "businessPermit", name: "Business Permit", profileKey: "businessPermit" },
                { key: "kraPIN", name: "KRA PIN", profileKey: "kraPIN" },
                { key: "companyProfile", name: "Company Profile", profileKey: "companyProfile" },
            ],
            fundi: [
                { key: "idFront", name: "ID Front", profileKey: "idFrontUrl" },
                { key: "idBack", name: "ID Back", profileKey: "idBackUrl" },
                { key: "certificate", name: "Certificate", profileKey: "certificateUrl" },
                { key: "kraPIN", name: "KRA PIN", profileKey: "kraPIN" },
            ],
            professional: [
                { key: "idFront", name: "ID Front", profileKey: "idFrontUrl" },
                { key: "idBack", name: "ID Back", profileKey: "idBackUrl" },
                { key: "academicCertificate", name: "Academic Certificate", profileKey: "academicCertificateUrl" },
                { key: "cv", name: "CV", profileKey: "cvUrl" },
                { key: "kraPIN", name: "KRA PIN", profileKey: "kraPIN" },
                { key: "practiceLicense", name: "Practice License", profileKey: "practiceLicense" },
            ],
            hardware: [
                { key: "certificateOfIncorporation", name: "Certificate of Incorporation", profileKey: "certificateOfIncorporation" },
                { key: "kraPIN", name: "KRA PIN", profileKey: "kraPIN" },
                { key: "singleBusinessPermit", name: "Single Business Permit", profileKey: "singleBusinessPermit" },
                { key: "companyProfile", name: "Company Profile", profileKey: "companyProfile" },
            ]
        };

        return documentMappings[userType] || [];
    };

    const requiredDocuments = getRequiredDocuments();
    const missingDocuments = requiredDocuments.filter(doc => !documents[doc.key]);

    // --- ORIGINAL API-based new document upload (commented out) ---
    // const handleUploadNewDocument = async (e: React.ChangeEvent<HTMLInputElement>, docKey: string) => {
    //     const file = e.target.files?.[0];
    //     if (file) {
    //         setUploadingFiles(prev => ({ ...prev, [docKey]: true }));
    //         try {
    //             const uploadedFile = await uploadFile(file);
    //             const newDoc = {
    //                 name: file.name,
    //                 url: uploadedFile.url,
    //                 type: docKey
    //             };
    //             setDocuments((prev: any) => ({
    //                 ...prev,
    //                 [docKey]: newDoc
    //             }));
    //             await handleUpdateUserDocuments(docKey, uploadedFile.url);
    //             toast.success(`${getDocumentDisplayName(docKey)} uploaded and saved successfully!`);
    //         } catch (error: any) {
    //             console.error('Upload error:', error);
    //             toast.error(`Failed to upload ${getDocumentDisplayName(docKey)}: ${error.message || 'Unknown error'}`);
    //             setDocuments((prev: any) => {
    //                 const updated = { ...prev };
    //                 delete updated[docKey];
    //                 return updated;
    //             });
    //         } finally {
    //             setUploadingFiles(prev => ({ ...prev, [docKey]: false }));
    //         }
    //     }
    // };
    // --- END ORIGINAL ---

    // --- localStorage-based new document upload (using local object URL) ---
    const handleUploadNewDocument = (e: React.ChangeEvent<HTMLInputElement>, docKey: string) => {
        const file = e.target.files?.[0];
        if (file) {
            setUploadingFiles(prev => ({ ...prev, [docKey]: true }));
            const localUrl = URL.createObjectURL(file);
            const newDoc = {
                name: file.name,
                url: localUrl,
                type: docKey
            };
            setDocuments((prev: any) => ({
                ...prev,
                [docKey]: newDoc
            }));
            handleUpdateUserDocuments(docKey, localUrl);
            toast.success(`${getDocumentDisplayName(docKey)} uploaded and saved successfully!`);
            setUploadingFiles(prev => ({ ...prev, [docKey]: false }));
        }
    };

    return (
        <div className="flex min-h-screen bg-white">
            <Toaster position="top-center" />
            <div className="flex-grow p-8">
                <div className="max-w-3xl mx-auto bg-white rounded-xl">
                    <div className="flex items-center justify-between mb-8 border-b pb-4">
                        <h2 className="text-2xl font-bold text-gray-800">
                            Uploaded Documents
                        </h2>

                        {/* Verify Button for HARDWARE users only */}
                        {userData?.userType === "HARDWARE"  || userData?.userType === "CUSTOMER" && (
                            <div className="relative inline-block">
                                {/* Single Verify Button */}
                                {!userData?.approved && (
                                    <button
                                        type="button"
                                        onClick={handleVerify}
                                        className="bg-blue-800 text-white px-6 py-2 rounded hover:bg-blue-700 transition"
                                    >
                                        Verify
                                    </button>
                                )}
                                {userData?.approved && (
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 ml-4">
                                        Verified
                                    </span>
                                )}

                                {/* Verified Message */}
                                {showVerificationMessage && (
                                    <div className="absolute top-full right-0 mt-2 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50 flex items-center justify-between gap-4 min-w-[200px]">
                                        <span>Verified</span>
                                        <button
                                            type="button"
                                            onClick={handleClose}
                                            className="text-sm underline hover:text-gray-100"
                                        >
                                            Close
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {Object.keys(documents).length === 0 && missingDocuments.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-gray-500 text-lg">No documents required for this user type.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Existing Documents */}
                            {Object.keys(documents).length > 0 && (
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Uploaded Documents</h3>
                                    {Object.entries(documents).map(([key, doc]: [string, any]) => (
                                        <div
                                            key={key}
                                            className="flex items-center justify-between bg-gray-100 px-6 py-5 rounded-lg shadow-sm border border-gray-300"
                                        >
                                            <div>
                                                <p className="text-lg font-semibold text-blue-800">
                                                    {getDocumentDisplayName(key)}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    {doc.name}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <a
                                                    href={doc.url}
                                                    download
                                                    className="text-blue-800 hover:text-blue-700"
                                                    title="Download"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    <FiDownload className="w-5 h-5" />
                                                </a>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(key)}
                                                    className="text-red-600 hover:text-red-800"
                                                    title="Delete"
                                                >
                                                    <FiTrash2 className="w-5 h-5" />
                                                </button>
                                                <label
                                                    title="Replace"
                                                    className="cursor-pointer text-green-600 hover:text-green-800"
                                                >
                                                    <FiUpload className="w-5 h-5" />
                                                    <input
                                                        type="file"
                                                        onChange={(e) =>
                                                            handleFileChange(e, key)
                                                        }
                                                        className="hidden"
                                                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                                    />
                                                </label>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Missing Documents - Upload Areas */}
                            {missingDocuments.length > 0 && (
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                                        {Object.keys(documents).length > 0 ? 'Missing Documents' : 'Required Documents'}
                                    </h3>
                                    <p className="text-sm text-gray-600 mb-4">
                                        Upload the following documents on behalf of the user:
                                    </p>
                                    {missingDocuments.map((doc) => (
                                        <div
                                            key={doc.key}
                                            className="border-2 border-dashed border-blue-300 rounded-lg p-6 bg-blue-50"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-lg font-semibold text-blue-800 mb-1">
                                                        {doc.name}
                                                    </p>
                                                    <p className="text-sm text-gray-600">
                                                        Required document not yet uploaded
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    {uploadingFiles[doc.key] ? (
                                                        <div className="flex items-center gap-2 text-blue-600">
                                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                                            <span className="text-sm">Uploading...</span>
                                                        </div>
                                                    ) : (
                                                        <label
                                                            title={`Upload ${doc.name}`}
                                                            className="cursor-pointer flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                                                        >
                                                            <UploadCloud className="w-4 h-4" />
                                                            <span className="text-sm font-medium">Upload</span>
                                                            <input
                                                                type="file"
                                                                onChange={(e) => handleUploadNewDocument(e, doc.key)}
                                                                className="hidden"
                                                                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                                            />
                                                        </label>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Uploads2;
