/* eslint-disable */
//@ts-nocheck
import { Download, FileText, Upload, Eye, Image, Loader2 } from "lucide-react";
import { useGlobalContext } from "@/context/GlobalProvider";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import useAxiosWithAuth from "@/utils/axiosInterceptor";
import {
  uploadContractorDocuments,
  uploadFundiDocuments,
  uploadProfessionalDocuments,
  uploadHardwareDocuments,
  uploadIndividualCustomerDocuments,
  uploadOrganizationCustomerDocuments
} from "@/api/uploads.api";
import { uploadFile } from "@/utils/fileUpload";

const DocumentCard = ({ label, url, onReplace, isUploading }) => {
  const fileName = url?.split("/").pop();

  if (!url && !isUploading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
            <Image className="w-5 h-5 text-gray-400" />
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-gray-900 text-sm">{label}</h4>
            <p className="text-xs text-gray-500">Not uploaded</p>
          </div>
        </div>
        <div className="flex gap-2">
          <label className="flex-1 cursor-pointer">
            <div className="flex items-center justify-center gap-2 py-2 px-4 border border-dashed border-blue-300 rounded-lg bg-blue-50 text-blue-600 text-sm font-medium hover:bg-blue-100 transition">
              <Upload className="w-4 h-4" />
              Upload
            </div>
            <input
              type="file"
              className="hidden"
              accept="image/*,.pdf"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onReplace(file);
              }}
            />
          </label>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
          {isUploading ? (
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
          ) : (
            <FileText className="w-5 h-5 text-green-600" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900 text-sm">{label}</h4>
          <p className="text-xs text-gray-500 truncate">{isUploading ? "Uploading..." : fileName}</p>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {!isUploading && url && (
          <>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1 py-2 px-2 border border-gray-200 rounded-lg text-gray-700 text-xs font-medium hover:bg-gray-50 transition"
            >
              <Eye className="w-3.5 h-3.5" />
              View
            </a>
            <a
              href={url}
              download={fileName}
              className="flex-1 flex items-center justify-center gap-1 py-2 px-2 border border-gray-200 rounded-lg text-gray-700 text-xs font-medium hover:bg-gray-50 transition"
            >
              <Download className="w-3.5 h-3.5" />
              Download
            </a>
          </>
        )}
        <label className={`flex-1 cursor-pointer ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className="flex items-center justify-center gap-1 py-2 px-2 border border-blue-200 rounded-lg text-blue-600 text-xs font-medium hover:bg-blue-50 transition">
            <Upload className="w-3.5 h-3.5" />
            {url ? "Replace" : "Upload"}
          </div>
          <input
            type="file"
            className="hidden"
            accept="image/*,.pdf"
            disabled={isUploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onReplace(file);
            }}
          />
        </label>
      </div>
    </div>
  );
};

const AccountUploads = ({ data, refreshData }) => {
  const { user } = useGlobalContext();
  const userType = (user?.userType || '').toLowerCase();
  const accountType = (user?.accountType || '').toLowerCase();
  const axiosInstance = useAxiosWithAuth(import.meta.env.VITE_SERVER_URL);

  const [documents, setDocuments] = useState({});
  const [pendingFiles, setPendingFiles] = useState({}); // Stores File objects pending upload
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState([]);

  /* ---------- LOAD FROM PROP ---------- */
  useEffect(() => {
    if (data?.userProfile) {
      setDocuments(data.userProfile);

      if (userType === 'contractor' && data.userProfile.contractorExperiences) {
        const catNames = data.userProfile.contractorExperiences.map(exp => exp.category);
        setCategories(catNames);
      }
    }
  }, [data, userType]);

  const replaceDocument = (file, key) => {
    // Generate a temporary preview URL
    const previewUrl = URL.createObjectURL(file);
    setDocuments(prev => ({ ...prev, [key]: previewUrl }));
    setPendingFiles(prev => ({ ...prev, [key]: file }));
  };

  const handleSaveDocuments = async () => {
    setIsSubmitting(true);
    const uploadToast = toast.loading("Processing your documents...");

    try {
      const updatedUrls = { ...documents };
      const filesToUpload = Object.keys(pendingFiles);

      // 1. Upload all pending files
      for (const key of filesToUpload) {
        const file = pendingFiles[key];
        try {
          const uploaded = await uploadFile(file);
          updatedUrls[key] = uploaded.url;
        } catch (err) {
          toast.error(`Failed to upload ${key}. Please try again.`);
          throw err;
        }
      }

      // 2. Prepare payload based on user type
      let response;
      if (userType === 'customer') {
        if (accountType === 'individual') {
          const payload = {
            idFrontUrl: updatedUrls.idFrontUrl || null,
            idBackUrl: updatedUrls.idBackUrl || null,
            kraPIN: updatedUrls.kraPIN || null
          };
          response = await uploadIndividualCustomerDocuments(axiosInstance, payload);
        } else {
          const payload = {
            businessPermit: updatedUrls.businessPermit || null,
            certificateOfIncorporation: updatedUrls.certificateOfIncorporation || null,
            kraPIN: updatedUrls.kraPIN || null
          };
          response = await uploadOrganizationCustomerDocuments(axiosInstance, payload);
        }
      } else if (userType === 'fundi') {
        const payload = {
          idFront: updatedUrls.idFrontUrl || null,
          idBack: updatedUrls.idBackUrl || null,
          certificate: updatedUrls.certificateUrl || null,
          kraPIN: updatedUrls.kraPIN || null
        };
        response = await uploadFundiDocuments(axiosInstance, payload);
      } else if (userType === 'professional') {
        const payload = {
          idFront: updatedUrls.idFrontUrl || null,
          idBack: updatedUrls.idBackUrl || null,
          academicCertificate: updatedUrls.academicCertificateUrl || null,
          cvUrl: updatedUrls.cvUrl || null,
          kraPIN: updatedUrls.kraPIN || null,
          practiceLicense: updatedUrls.practiceLicense || null
        };
        response = await uploadProfessionalDocuments(axiosInstance, payload);
      } else if (userType === 'contractor') {
        const payload = {
          businessRegistration: updatedUrls.businessRegistration || null,
          businessPermit: updatedUrls.businessPermit || null,
          kraPIN: updatedUrls.kraPIN || null,
          companyProfile: updatedUrls.companyProfile || null
        };
        response = await uploadContractorDocuments(axiosInstance, payload);
      } else if (userType === 'hardware') {
        const payload = {
          businessRegistration: updatedUrls.businessRegistration || null,
          kraPIN: updatedUrls.kraPIN || null,
          singleBusinessPermit: updatedUrls.singleBusinessPermit || null,
          companyProfile: updatedUrls.companyProfile || null
        };
        response = await uploadHardwareDocuments(axiosInstance, payload);
      }

      toast.success("All documents saved successfully!", { id: uploadToast });
      setPendingFiles({}); // Clear pending files
      if (refreshData) refreshData();
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(error.message || "An error occurred while saving documents", { id: uploadToast });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (userType !== "contractor") {
    const defaultFields = {
      customer: accountType === 'individual'
        ? [
          { label: "ID Front", key: "idFrontUrl" },
          { label: "ID Back", key: "idBackUrl" },
          { label: "KRA PIN", key: "kraPIN" },
        ]
        : [
          { label: "Business Permit", key: "businessPermit" },
          { label: "Certificate of Incorporation", key: "certificateOfIncorporation" },
          { label: "KRA PIN", key: "kraPIN" },
        ],
      fundi: [
        { label: "ID Front", key: "idFrontUrl" },
        { label: "ID Back", key: "idBackUrl" },
        { label: "Certificate", key: "certificateUrl" },
        { label: "KRA PIN", key: "kraPIN" },
      ],
      professional: [
        { label: "ID Front", key: "idFrontUrl" },
        { label: "ID Back", key: "idBackUrl" },
        { label: "Academics Certificate", key: "academicCertificateUrl" },
        { label: "CV", key: "cvUrl" },
        { label: "Practice License", key: "practiceLicense" },
        { label: "KRA PIN", key: "kraPIN" },
      ],
      hardware: [
        { label: "Business Registration", key: "businessRegistration" },
        { label: "KRA PIN", key: "kraPIN" },
        { label: "Single Business Permit", key: "singleBusinessPermit" },
        { label: "Company Profile", key: "companyProfile" },
      ],
    };

    const fields = defaultFields[userType] || [];

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Uploaded Documents</h1>
              <p className="text-sm text-gray-500 mt-1">
                ID documents, certificates, and business registration files
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {fields.map(f => (
                <DocumentCard
                  key={f.key}
                  label={f.label}
                  url={documents[f.key]}
                  onReplace={file => replaceDocument(file, f.key)}
                  isUploading={isSubmitting && !!pendingFiles[f.key]}
                />
              ))}
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleSaveDocuments}
                disabled={isSubmitting || Object.keys(pendingFiles).length === 0}
                className="bg-blue-800 text-white px-8 py-3 rounded-md hover:bg-blue-900 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Uploads"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const generalFields = [
    { label: "Business Registration", key: "businessRegistration" },
    { label: "Business Permit", key: "businessPermit" },
    { label: "KRA PIN", key: "kraPIN" },
    { label: "Company Profile", key: "companyProfile" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Contractor Documents</h1>
            <p className="text-sm text-gray-500 mt-1">
              Company documents, certificates, and licenses
            </p>
          </div>

          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-600 mb-4">Company Documents</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {generalFields.map(f => (
                <DocumentCard
                  key={f.key}
                  label={f.label}
                  url={documents[f.key]}
                  onReplace={file => replaceDocument(file, f.key)}
                  isUploading={isSubmitting && !!pendingFiles[f.key]}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSaveDocuments}
              disabled={isSubmitting || Object.keys(pendingFiles).length === 0}
              className="bg-blue-800 text-white px-8 py-3 rounded-md hover:bg-blue-900 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Uploads"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountUploads;
