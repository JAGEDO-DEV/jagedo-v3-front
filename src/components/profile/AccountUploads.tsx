/* eslint-disable */
//@ts-nocheck
import { Download, FileText, Upload, Eye, Image, Loader2, CheckCircle, Clock, AlertCircle } from "lucide-react";
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
  uploadOrganizationCustomerDocuments,  
} from "@/api/uploads.api";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";
import { uploadFile } from "@/utils/fileUpload";

const StatusBadge = ({ status }) => {
  if (status === "approved") {
    return (
      <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
        <CheckCircle className="w-3.5 h-3.5" />
        Approved
      </div>
    );
  }
  if (status === "pending") {
    return (
      <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold">
        <Clock className="w-3.5 h-3.5" />
        Pending Review
      </div>
    );
  }
  if (status === "rejected") {
    return (
      <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-100 text-red-700 text-xs font-semibold">
        <AlertCircle className="w-3.5 h-3.5" />
        Rejected
      </div>
    );
  }
  return null;
};

const DocumentCard = ({ label, url, onReplace, isUploading, disabled, status = "pending" }) => {
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
          {!disabled && (
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
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
            status === "approved" ? "bg-green-50" : status === "rejected" ? "bg-red-50" : "bg-amber-50"
          }`}>
            {isUploading ? (
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
            ) : (
              <FileText className={`w-5 h-5 ${
                status === "approved" ? "text-green-600" : status === "rejected" ? "text-red-600" : "text-amber-600"
              }`} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-gray-900 text-sm">{label}</h4>
            <p className="text-xs text-gray-500 truncate">
              {isUploading ? "Uploading..." : fileName}
            </p>
          </div>
        </div>
        <div className="ml-2 flex-shrink-0">
          <StatusBadge status={status} />
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
        {!disabled && (
          <label
            className={`flex-1 cursor-pointer ${isUploading ? "opacity-50 pointer-events-none" : ""}`}
          >
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
        )}
      </div>
    </div>
  );
};

const AccountUploads = ({ data, refreshData }) => {
  const { user } = useGlobalContext();
  
  const userType = (data?.userType || user?.userType || "").toLowerCase();
  const accountType = (data?.accountType || user?.accountType || "").toLowerCase();
  const axiosInstance = useAxiosWithAuth(import.meta.env.VITE_SERVER_URL);

  const [documents, setDocuments] = useState({});
  const [pendingFiles, setPendingFiles] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState([]);
  const [approvalStatus, setApprovalStatus] = useState({});

  
  const defaultFields = {
    customer:
      accountType.toLowerCase() === "individual"
        ? [
            { label: "ID Front", key: "idFrontUrl" },
            { label: "ID Back", key: "idBackUrl" },
            { label: "KRA PIN", key: "krapin" },
          ]
        : [
            { label: "Business Permit", key: "businessPermit" },
            {
              label: "Certificate of Incorporation",
              key: "certificateOfIncorporation",
            },
            { label: "KRA PIN", key: "krapin" },
          ],
    fundi: [
      { label: "ID Front", key: "idFrontUrl" },
      { label: "ID Back", key: "idBackUrl" },
      { label: "Trade Certificate", key: "certificateUrl" },
      { label: "KRA PIN", key: "krapin" },
    ],
    professional: [
      { label: "ID Front", key: "idFrontUrl" },
      { label: "ID Back", key: "idBackUrl" },
      { label: "Academics Certificate", key: "academicCertificateUrl" },
      { label: "CV", key: "cvUrl" },
      { label: "KRA PIN", key: "krapin" },
      
    ],
    hardware: [
      { label: "Business Registration", key: "businessRegistration" },
      { label: "Business Permit", key: "businessPermit" },
      { label: "KRA PIN", key: "krapin" },
      { label: "Owner ID Front", key: "idFrontUrl" },
      { label: "Owner ID Back", key: "idBackUrl" },
    ],
  };

  const generalFields = [
    { label: "Certificate of Incorporation", key: "businessRegistration" },
    { label: "Business Permit", key: "businessPermit" },
    { label: "KRA PIN", key: "krapin" },
    { label: "Company Profile", key: "companyProfile" },
  ];

  
  const baseFields = defaultFields[userType] || [];
  
  
  let fields = [...baseFields];
  if ((userType === "professional" || userType === "fundi") && data?.professionalProjects) {
    const projects = Array.isArray(data.professionalProjects) ? data.professionalProjects : [];
    projects.forEach((project, index) => {
      fields.push({
        label: `Portfolio - ${project.projectName || `Project ${index + 1}`}`,
        key: `portfolio${index + 1}`,
      });
    });
  }
  if (userType === "fundi" && data?.fundiEvaluation) {
    const projects = Array.isArray(data.fundiEvaluation) ? data.fundiEvaluation : [];
    projects.forEach((project, index) => {
      fields.push({
        label: `Portfolio - ${project.projectName || `Project ${index + 1}`}`,
        key: `portfolio${index + 1}`,
      });
    });
  }
  
  const hasPendingFiles = Object.keys(pendingFiles).length > 0;
  const hasAllRequiredDocs = fields.every((f) => !!documents[f.key]);

  const allContractorDocs = [
    ...generalFields,
    ...categories.flatMap((cat) => {
      const k = cat.toUpperCase().replace(/\s+/g, "_");
      return [{ key: `${k}_CERTIFICATE` }, { key: `${k}_LICENSE` }];
    }),
  ];
  const hasAllContractorDocs = allContractorDocs.every((f) => !!documents[f.key]);

  const isReadOnly = !["PENDING", "RESUBMIT", "INCOMPLETE"].includes(
    data?.documentStatus,
  );

  
  const totalUploaded = fields.filter((f) => !!documents[f.key]).length;
  const totalApproved = fields.filter((f) => approvalStatus[f.key] === "approved").length;
  const totalPending = fields.filter((f) => !!documents[f.key] && approvalStatus[f.key] !== "approved").length;

  /* ---------- LOAD FROM PROP ---------- */
  useEffect(() => {
    if (data) {
      const docsMap = { ...data };
      const catNames = [];
      const statusMap = {};

      
      const keyMapping = {
        
        idFrontUrl: "idFront",
        idBackUrl: "idBack",
        
        businessPermit: "businessPermit",
        certificateOfIncorporation: "certificateOfIncorporation",
        
        certificateUrl: "certificate",
        
        academicCertificateUrl: "academicCertificate",
        cvUrl: "cvUrl",
        practiceLicense: "practiceLicense",
        
        
        businessRegistration: "businessRegistration",
        
        companyProfile: "companyProfile",
        
        krapin: "kraPIN",
      };

      
      if (data.documentDetails) {
        Object.keys(data.documentDetails).forEach((backendKey) => {
          const detail = data.documentDetails[backendKey];
          
          
          let actualStatus = detail?.status || detail;
          const status = actualStatus === 'VERIFIED' ? 'approved' : 'pending';
          
          
          const fieldKey = Object.keys(keyMapping).find(
            (k) => keyMapping[k] === backendKey
          ) || backendKey;
          
          statusMap[fieldKey] = status;
        });
      }

      
      const globalStatus = data.documentStatus === 'VERIFIED' ? 'approved' : 'pending';
      const baseFields = defaultFields[userType] || [];
      baseFields.forEach((field) => {
        if (!statusMap[field.key]) {
          statusMap[field.key] = globalStatus;
        }
      });

      if (userType === "contractor") {
        const contractorExperiences = data.contractorExperiences || [];

        if (contractorExperiences.length > 0) {
          contractorExperiences.forEach((exp) => {
            catNames.push(exp.category);
            const categoryKey = exp.category.toUpperCase().replace(/\s+/g, "_");
            const certKey = `${categoryKey}_CERTIFICATE`;
            const licenseKey = `${categoryKey}_LICENSE`;
            if (exp.certificate) docsMap[certKey] = exp.certificate;
            if (exp.license) docsMap[licenseKey] = exp.license;
          });
        } else if (data.contractorTypes) {
          const SLUG_MAP = {
            "building-works": "Building Works",
            "electrical-works": "Electrical Works",
            "mechanical-works": "Mechanical Works",
            "road-works": "Road Works",
            "water-works": "Water Works",
          };
          data.contractorTypes.split(",").forEach((slug) => {
            const name = SLUG_MAP[slug.trim()];
            if (name) catNames.push(name);
          });
        }
      }

      
      if (userType === "professional" && data.professionalProjects) {
        const projects = Array.isArray(data.professionalProjects) ? data.professionalProjects : [];
        projects.forEach((project, index) => {
          const key = `portfolio${index + 1}`;
          docsMap[key] = project.fileUrl;
          
          const portfolioStatus = data.documentStatus === 'VERIFIED' ? 'approved' : 'pending';
          statusMap[key] = portfolioStatus;
        });
      }
      if (userType === "fundi" && data.fundiEvaluation) {
        const projects = Array.isArray(data.fundiEvaluation) ? data.fundiEvaluation : [];
        projects.forEach((project, index) => {
          const key = `portfolio${index + 1}`;
          docsMap[key] = project.fileUrl;
          
          const portfolioStatus = data.documentStatus === 'VERIFIED' ? 'approved' : 'pending';
          statusMap[key] = portfolioStatus;
        });
      }

      setDocuments(docsMap);
      setApprovalStatus(statusMap);
      setCategories(catNames);
    }
  }, [data, userType]);

  const replaceDocument = (file, key) => {
    const previewUrl = URL.createObjectURL(file);
    setDocuments((prev) => ({ ...prev, [key]: previewUrl }));
    setPendingFiles((prev) => ({ ...prev, [key]: file }));
  };

  const handleSaveDocuments = async () => {
    setIsSubmitting(true);
    const uploadToast = toast.loading("Processing your documents...");

    try {
      const updatedUrls = { ...documents };
      const filesToUpload = Object.keys(pendingFiles);

      
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

      
      let response;
      if (userType === "customer") {
        if (accountType === "individual") {
          const payload = {
            idFrontUrl: updatedUrls.idFrontUrl || null,
            idBackUrl: updatedUrls.idBackUrl || null,
            krapin: updatedUrls.krapin || null,
          };
          response = await uploadIndividualCustomerDocuments(axiosInstance, payload);
        } else {
          const payload = {
            businessPermit: updatedUrls.businessPermit || null,
            certificateOfIncorporation: updatedUrls.certificateOfIncorporation || null,
            krapin: updatedUrls.krapin || null,
          };
          response = await uploadOrganizationCustomerDocuments(axiosInstance, payload);
        }
      } else if (userType === "fundi") {
        const payload = {
          idFront: updatedUrls.idFrontUrl || null,
          idBack: updatedUrls.idBackUrl || null,
          certificate: updatedUrls.certificateUrl || null,
          krapin: updatedUrls.krapin || null,
        };
        response = await uploadFundiDocuments(axiosInstance, payload);
      } else if (userType === "professional") {
        const payload = {
          idFront: updatedUrls.idFrontUrl || null,
          idBack: updatedUrls.idBackUrl || null,
          academicCertificate: updatedUrls.academicCertificateUrl || null,
          cvUrl: updatedUrls.cvUrl || null,
          krapin: updatedUrls.krapin || null,
          practiceLicense: updatedUrls.practiceLicense || null,
        };
        response = await uploadProfessionalDocuments(axiosInstance, payload);
      } else if (userType === "contractor") {
        const payload = {
          certificateOfIncorporation: updatedUrls.certificateOfIncorporation  || null,
          businessPermit: updatedUrls.businessPermit || null,
          krapin: updatedUrls.krapin || null,
          companyProfile: updatedUrls.companyProfile || null,
        };
        categories.forEach((cat) => {
          const categoryKey = cat.toUpperCase().replace(/\s+/g, "_");
          const certKey = `${categoryKey}_CERTIFICATE`;
          const licenseKey = `${categoryKey}_LICENSE`;
          payload[certKey] = updatedUrls[certKey] || null;
          payload[licenseKey] = updatedUrls[licenseKey] || null;
        });
        response = await uploadContractorDocuments(axiosInstance, payload);
      } else if (userType === "hardware") {
        const payload = {
          businessRegistration: updatedUrls.businessRegistration || null,
          businessPermit: updatedUrls.businessPermit || null,
          krapin: updatedUrls.krapin || null,
          ownerIdFront: updatedUrls.idFrontUrl || null,
          ownerIdBack: updatedUrls.idBackUrl || null,
        };
        response = await uploadHardwareDocuments(axiosInstance, payload);
        console.log('Hardware payload:', payload);
      }

      toast.success("All documents saved successfully!", { id: uploadToast });
      setPendingFiles({});
      if (refreshData) refreshData();
      window.location.reload();
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(error.message || "An error occurred while saving documents", {
        id: uploadToast,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  
  if (userType !== "contractor") {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">
                Uploaded Documents
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                ID documents, certificates, and business registration files
              </p>
            </div>

            {data?.documentStatusReason && (
              <Alert variant="destructive" className="mb-6">
                <InfoIcon className="h-4 w-4 text-red-600" />
                <AlertTitle>Status Update</AlertTitle>
                <AlertDescription>{data.documentStatusReason}</AlertDescription>
              </Alert>
            )}

            {/* ✅ Approval Status Summary */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Document Status
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {totalUploaded} of {fields.length} documents uploaded
                    {totalApproved > 0 && ` • ${totalApproved} approved`}
                  </p>
                </div>
                <StatusBadge status={data?.documentStatus} />
              </div>

              {/* Progress bar */}
              {fields.length > 0 && (
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-gray-600 mb-2">
                    <span>Approval Progress</span>
                    <span>
                      {totalApproved} / {fields.length} approved
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        totalApproved === fields.length
                          ? "bg-green-500"
                          : totalPending > 0
                            ? "bg-amber-500"
                            : "bg-gray-300"
                      }`}
                      style={{
                        width: `${fields.length > 0 ? (totalApproved / fields.length) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {fields.map((f) => (
                <DocumentCard
                  key={f.key}
                  label={f.label}
                  url={documents[f.key]}
                  status={approvalStatus[f.key]}
                  onReplace={(file) => replaceDocument(file, f.key)}
                  isUploading={isSubmitting && !!pendingFiles[f.key]}
                  disabled={isReadOnly}
                />
              ))}
            </div>

            <div className="flex flex-col items-end gap-2">
              {!hasAllRequiredDocs && hasPendingFiles && (
                <p className="text-xs text-red-500">
                  Please upload all required documents before saving.
                </p>
              )}
              {!isReadOnly && (
                <button
                  onClick={handleSaveDocuments}
                  disabled={isSubmitting || !hasPendingFiles || !hasAllRequiredDocs}
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
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              Contractor Documents
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Company documents, certificates, and licenses
            </p>
          </div>

          {data?.documentStatusReason && (
            <Alert variant={data.documentStatus ==="PENDING" ? "default" : "destructive"} className={data.documentStatus ==="PENDING" ? "mb-6 bg-amber-100" : "mb-6"}>
              <InfoIcon className="h-4 w-4" />
              <AlertTitle>Status Update</AlertTitle>
              <AlertDescription>{data.documentStatusReason}</AlertDescription>
            </Alert>
          )}

          {/* ✅ Approval Status Summary */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Document Status
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {Object.keys(documents).filter((k) => !!documents[k]).length} of{" "}
                  {allContractorDocs.length} documents uploaded
                  {totalApproved > 0 && ` • ${totalApproved} approved`}
                </p>
              </div>
              <StatusBadge status={data?.documentStatus} />
            </div>

            {/* Progress bar */}
            {allContractorDocs.length > 0 && (
              <div className="mt-4">
                <div className="flex justify-between text-xs text-gray-600 mb-2">
                  <span>Approval Progress</span>
                  <span>
                    {totalApproved} / {allContractorDocs.length} approved
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      totalApproved === allContractorDocs.length
                        ? "bg-green-500"
                        : totalPending > 0
                          ? "bg-amber-500"
                          : "bg-gray-300"
                    }`}
                    style={{
                      width: `${allContractorDocs.length > 0 ? (totalApproved / allContractorDocs.length) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-600 mb-4">
              Company Documents
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {generalFields.map((f) => (
                <DocumentCard
                  key={f.key}
                  label={f.label}
                  url={documents[f.key]}
                  status={approvalStatus[f.key]}
                  onReplace={(file) => replaceDocument(file, f.key)}
                  isUploading={isSubmitting && !!pendingFiles[f.key]}
                  disabled={isReadOnly}
                />
              ))}
            </div>
          </div>

          {categories.length > 0 && (
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-gray-600 mb-4">
                Category Specific Documents
              </h3>
              <div className="space-y-6">
                {categories.map((cat, idx) => {
                  const categoryKey = cat.toUpperCase().replace(/\s+/g, "_");
                  const certKey = `${categoryKey}_CERTIFICATE`;
                  const licenseKey = `${categoryKey}_LICENSE`;

                  return (
                    <div
                      key={idx}
                      className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm"
                    >
                      <h4 className="text-md font-bold text-blue-800 mb-4 flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        {cat} Credentials
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <DocumentCard
                          label={`${cat} Certificate`}
                          url={documents[certKey]}
                          status={approvalStatus[certKey]}
                          onReplace={(file) => replaceDocument(file, certKey)}
                          isUploading={isSubmitting && !!pendingFiles[certKey]}
                          disabled={isReadOnly}
                        />
                        <DocumentCard
                          label={`${cat} Practice License`}
                          url={documents[licenseKey]}
                          status={approvalStatus[licenseKey]}
                          onReplace={(file) => replaceDocument(file, licenseKey)}
                          isUploading={isSubmitting && !!pendingFiles[licenseKey]}
                          disabled={isReadOnly}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex flex-col items-end gap-2">
            {!hasAllContractorDocs && hasPendingFiles && (
              <p className="text-xs text-red-500">
                Please upload all required documents before saving.
              </p>
            )}
            {!isReadOnly && (
              <button
                onClick={handleSaveDocuments}
                disabled={isSubmitting || !hasPendingFiles || !hasAllContractorDocs}
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountUploads;