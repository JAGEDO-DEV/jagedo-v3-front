//@ts-nocheck
import { useEffect, useState } from "react";
import {
  FiDownload,
  FiEye,
  FiUpload,
  FiCheck,
  FiRefreshCw,
  FiChevronDown,
  FiAlertCircle,
} from "react-icons/fi";
import { FileText, Image, CheckCircle, XCircle, Clock } from "lucide-react";
import { toast, Toaster } from "sonner";
import {
  adminDynamicUpdateAccountUploads,
  adminVerifyDocuments,
  adminRejectDocuments,
  adminResubmitDocuments,
  adminUpdateSingleDocumentStatus,
} from "@/api/uploads.api";
import { handleVerifyUser, updateAccountStatus } from "@/api/provider.api";
import useAxiosWithAuth from "@/utils/axiosInterceptor";
import { uploadFileWithAxios } from "@/utils/fileUpload";

interface DocumentItem {
  key: string;
  name: string;
  category:
  | "id"
  | "certification"
  | "business"
  | "category_specific";
}

type DocumentStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "reupload_requested"
  | "VERIFIED"
  | "REJECTED"
  | "RESUBMIT";

interface UploadedDocument {
  name: string;
  url: string;
  type: string;
  uploadedAt: string;
  status: DocumentStatus;
  statusReason?: string;
  statusDate?: string;
  reviewedBy?: string;
}

interface AccountUploadsProps {
  userData: any;
  isAdmin?: boolean;
}

const AccountUploads = ({ userData, isAdmin = false }: AccountUploadsProps) => {
  const axiosInstance = useAxiosWithAuth(import.meta.env.VITE_SERVER_URL);
  if (!userData) return <div className="p-8">Loading...</div>;

  const [documents, setDocuments] = useState<Record<string, UploadedDocument>>(
    {},
  );
  const [uploadingFiles, setUploadingFiles] = useState<Record<string, boolean>>(
    {},
  );
  const [isLoaded, setIsLoaded] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isPendingAction, setIsPendingAction] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [showGlobalActions, setShowGlobalActions] = useState(false);

  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    docKey?: string;
    action: "approve" | "reject" | "resubmit" | null;
    isGlobal?: boolean;
  }>({ isOpen: false, action: null });
  const [actionReason, setActionReason] = useState("");

  const userType = userData?.userType?.toLowerCase() || "";
  const accountType = userData?.accountType?.toLowerCase() || "";

  const persistDocuments = async (
    updatedDocs: Record<string, UploadedDocument>,
  ) => {
    try {
      let payload: any = {};
      const type = userType.toLowerCase();

      if (type === "fundi") {
        payload = {
          idFront: updatedDocs.idFront?.url || "",
          idBack: updatedDocs.idBack?.url || "",
          certificate: updatedDocs.certificate?.url || "",
          krapin: updatedDocs.krapin?.url || "",
        };
      } else if (type === "professional") {
        payload = {
          idFront: updatedDocs.idFront?.url || "",
          idBack: updatedDocs.idBack?.url || "",
          academicCertificate: updatedDocs.academicCertificate?.url || "",
          cvUrl: updatedDocs.cv?.url || updatedDocs.cvUrl?.url || "",
          krapin: updatedDocs.krapin?.url || "",
        };
      } else if (type === "contractor") {
        payload = {
          certificateOfIncorporation:
            updatedDocs.certificateOfIncorporation?.url ||
            updatedDocs.businessRegistration?.url ||
            "",
          businessPermit: updatedDocs.businessPermit?.url || "",
          krapin: updatedDocs.krapin?.url || "",
          companyProfile: updatedDocs.companyProfile?.url || "",
        };

        let contractorCategories = [];
        if (userData?.contractorTypes) {
          contractorCategories = userData.contractorTypes.split(",").map(t => ({ category: t.trim() })).filter(c => c.category);
        } else if (userData?.contractorCategories && Array.isArray(userData.contractorCategories) && userData.contractorCategories.length > 0) {
          contractorCategories = userData.contractorCategories;
        } else if (userData?.contractorExperiences && Array.isArray(userData.contractorExperiences) && userData.contractorExperiences.length > 0) {
          contractorCategories = userData.contractorExperiences;
        }

        if (Array.isArray(contractorCategories) && contractorCategories.length > 0) {
          contractorCategories.forEach((cat: any) => {
            const categoryName = cat.category || "";
            const categoryKey = categoryName.toUpperCase().replace(/\s+/g, "_");
            const certKey = `${categoryKey}_CERTIFICATE`;
            const licenseKey = `${categoryKey}_LICENSE`;

            payload[certKey] = updatedDocs[certKey]?.url || "";
            payload[licenseKey] = updatedDocs[licenseKey]?.url || "";
          });
        }
      } else if (type === "customer") {
        if (accountType === "individual") {
          payload = {
            idFrontUrl: updatedDocs.idFront?.url || "",
            idBackUrl: updatedDocs.idBack?.url || "",
            krapin: updatedDocs.krapin?.url || "",
          };
        } else {
          payload = {
            businessPermit: updatedDocs.businessPermit?.url || "",
            certificateOfIncorporation:
              updatedDocs.certificateOfIncorporation?.url || "",
            krapin: updatedDocs.krapin?.url || "",
            companyProfile: updatedDocs.companyProfile?.url || "",
          };
        }
      } else if (type === "hardware") {
        payload = {
          certificateOfIncorporation: updatedDocs.certificateOfIncorporation?.url || "",
          krapin: updatedDocs.krapin?.url || updatedDocs.krapin?.url || "",
          singleBusinessPermit: updatedDocs.singleBusinessPermit?.url || "",
          companyProfile: updatedDocs.companyProfile?.url || "",
        };
      }

      await adminDynamicUpdateAccountUploads(
        axiosInstance,
        payload,
        userType,
        userData.id,
        accountType,
      );
    } catch (error: any) {
      console.error("Persist error:", error);
      throw error;
    }
  };

  useEffect(() => {
    const initialDocs: Record<string, UploadedDocument> = {};
    const profile = userData;

    const globalStatus = userData?.status;
    const documentDetails = userData?.documentDetails || {};

    const getStatus = (key: string): DocumentStatus => {
      if (documentDetails[key]) {
        return documentDetails[key].status as DocumentStatus;
      }
      return globalStatus as DocumentStatus;
    };

    const getReason = (key: string): string | undefined => {
      if (documentDetails[key]) {
        return documentDetails[key].reason;
      }
      return undefined;
    };

    if (profile) {
      if (profile.idFrontUrl && userType !== "hardware") {
        initialDocs.idFront = {
          name: "National ID Front",
          url: profile.idFrontUrl,
          type: "idFront",
          uploadedAt: "Existing",
          status: getStatus("idFront"),
          statusReason: getReason("idFront"),
        };
      }
      if (profile.idBackUrl && userType !== "hardware") {
        initialDocs.idBack = {
          name: "National ID Back",
          url: profile.idBackUrl,
          type: "idBack",
          uploadedAt: "Existing",
          status: getStatus("idBack"),
          statusReason: getReason("idBack"),
        };
      }
      if (profile.krapin || profile.krapin) {
        initialDocs.krapin = {
          name: "KRA PIN Certificate",
          url: (profile.krapin || profile.krapin) as string,
          type: "krapin",
          uploadedAt: "Existing",
          status: getStatus("krapin"),
          statusReason: getReason("krapin"),
        };
      }

      if (profile.certificateUrl) {
        initialDocs.certificate = {
          name: "Trade Certificate",
          url: profile.certificateUrl,
          type: "certificate",
          uploadedAt: "Existing",
          status: getStatus("certificate"),
          statusReason: getReason("certificate"),
        };
      }

      if (profile.academicCertificateUrl) {
        initialDocs.academicCertificate = {
          name: "Academic Certificate",
          url: profile.academicCertificateUrl,
          type: "academicCertificate",
          uploadedAt: "Existing",
          status: getStatus("academicCertificate"),
          statusReason: getReason("academicCertificate"),
        };
      }
      if (profile.cvUrl) {
        initialDocs.cv = {
          name: "Curriculum Vitae (CV)",
          url: profile.cvUrl,
          type: "cv",
          uploadedAt: "Existing",
          status: getStatus("cv"),
          statusReason: getReason("cv"),
        };
      }
      if (profile.practiceLicense) {
        initialDocs.practiceLicense = {
          name: "Practice License",
          url: profile.practiceLicense,
          type: "practiceLicense",
          uploadedAt: "Existing",
          status: getStatus("practiceLicense"),
          statusReason: getReason("practiceLicense"),
        };
      }

      if (profile.businessPermit && userType !== "hardware") {
        initialDocs.businessPermit = {
          name: "Business Permit",
          url: profile.businessPermit as string,
          type: "businessPermit",
          uploadedAt: "Existing",
          status: getStatus("businessPermit"),
          statusReason: getReason("businessPermit"),
        };
      }

      if (profile.singleBusinessPermit && userType === "hardware") {
        initialDocs.singleBusinessPermit = {
          name: "Single Business Permit",
          url: profile.singleBusinessPermit as string,
          type: "singleBusinessPermit",
          uploadedAt: "Existing",
          status: getStatus("singleBusinessPermit"),
          statusReason: getReason("singleBusinessPermit"),
        };
      }

      const bizRegUrl =
        profile.businessRegistration ||
        profile.certificateOfIncorporation ||
        profile.registrationCertificateUrl;
      if (bizRegUrl) {
        initialDocs.certificateOfIncorporation = {
          name: "Certificate of Incorporation",
          url: bizRegUrl as string,
          type: "certificateOfIncorporation",
          uploadedAt: "Existing",
          status: getStatus("certificateOfIncorporation"),
          statusReason: getReason("certificateOfIncorporation"),
        };
      }
      if (profile.companyProfile) {
        initialDocs.companyProfile = {
          name: "Company Profile",
          url: profile.companyProfile,
          type: "companyProfile",
          uploadedAt: "Existing",
          status: getStatus("companyProfile"),
          statusReason: getReason("companyProfile"),
        };
      }

      let contractorCategories = profile.contractorExperiences || [];
      if ((!contractorCategories || contractorCategories.length === 0) && profile.contractorTypes) {
        contractorCategories = profile.contractorTypes.split(",").map(t => ({ category: t.trim() })).filter(c => c.category);
      }

      if (Array.isArray(contractorCategories)) {
        contractorCategories.forEach((cat: any, index: number) => {
          const categoryName = cat.category || "";
          if (!categoryName) return;

          const categoryKey = categoryName.toUpperCase().replace(/\s+/g, "_");
          const certKey = `${categoryKey}_CERTIFICATE`;
          const licenseKey = `${categoryKey}_LICENSE`;

          if (cat.certificate) {
            initialDocs[certKey] = {
              name: `${categoryName} Certificate`,
              url: cat.certificate,
              type: certKey,
              uploadedAt: "Existing",
              status: getStatus(certKey),
              statusReason: getReason(certKey),
            };
          }
          if (cat.license) {
            initialDocs[licenseKey] = {
              name: `${categoryName} Practice License`,
              url: cat.license,
              type: licenseKey,
              uploadedAt: "Existing",
              status: getStatus(licenseKey),
              statusReason: getReason(licenseKey),
            };
          }
        });
      }


    }
    setDocuments(initialDocs);
    setIsLoaded(true);
  }, [userData]);

  const getDocumentConfig = (): DocumentItem[] => {
    const individualBaseDocs: DocumentItem[] = [
      { key: "idFront", name: "National ID - Front", category: "id" },
      { key: "idBack", name: "National ID - Back", category: "id" },
      { key: "krapin", name: "KRA PIN Certificate", category: "certification" },
    ];

    if (accountType === "individual" && userType === "customer") {
      return individualBaseDocs;
    }

    if (userType === "fundi") {
      const fundiDocs: DocumentItem[] = [
        ...individualBaseDocs,
        {
          key: "certificate",
          name: "Trade Certificate",
          category: "certification",
        },
      ];



      return fundiDocs;
    }

    if (userType === "professional") {
      const profDocs: DocumentItem[] = [
        ...individualBaseDocs,
        {
          key: "academicCertificate",
          name: "Academic Certificate",
          category: "certification",
        },
        { key: "cv", name: "Curriculum Vitae (CV)", category: "certification" },
      ];



      return profDocs;
    }

    const organizationBaseDocs: DocumentItem[] = [
      {
        key: "certificateOfIncorporation",
        name: "Certificate of Incorporation",
        category: "business",
      },
      { key: "businessPermit", name: "Business Permit", category: "business" },
      { key: "krapin", name: "KRA PIN Certificate", category: "business" },
      {
        key: "companyProfile",
        name: "Company Profile",
        category: "business",
      },
    ];

    if (userType === "customer") {
      return organizationBaseDocs;
    }

    if (userType === "contractor") {
      const baseDocs: DocumentItem[] = [
        {
          key: "certificateOfIncorporation",
          name: "Certificate of Incorporation",
          category: "business",
        },
        {
          key: "businessPermit",
          name: "Business Permit",
          category: "business",
        },
        { key: "krapin", name: "KRA PIN Certificate", category: "business" },
        {
          key: "companyProfile",
          name: "Company Profile",
          category: "business",
        },
      ];

      let contractorCategories = [];

      if (userData?.contractorTypes) {
        contractorCategories = userData.contractorTypes.split(",").map(t => ({ category: t.trim() })).filter(c => c.category);
      } else if (userData?.contractorCategories && Array.isArray(userData.contractorCategories) && userData.contractorCategories.length > 0) {
        contractorCategories = userData.contractorCategories;
      } else if (userData?.contractorExperiences && Array.isArray(userData.contractorExperiences) && userData.contractorExperiences.length > 0) {
        contractorCategories = userData.contractorExperiences;
      }

      if (
        Array.isArray(contractorCategories) &&
        contractorCategories.length > 0
      ) {
        contractorCategories.forEach((cat: any) => {
          const categoryName = cat.category || "";
          if (!categoryName) return;

          const categoryKey = categoryName.toUpperCase().replace(/\s+/g, "_");
          baseDocs.push({
            key: `${categoryKey}_CERTIFICATE`,
            name: `${categoryName} Certificate`,
            category: "category_specific",
          });
          baseDocs.push({
            key: `${categoryKey}_LICENSE`,
            name: `${categoryName} Practice License`,
            category: "category_specific",
          });
        });
      }
      return baseDocs;
    }

    if (userType === "hardware") {
      return [
        {
          key: "certificateOfIncorporation",
          name: "Certificate of Incorporation",
          category: "business",
        },
        {
          key: "krapin",
          name: "KRA PIN Certificate",
          category: "business",
        },
        {
          key: "singleBusinessPermit",
          name: "Single Business Permit",
          category: "business",
        },
        {
          key: "companyProfile",
          name: "Company Profile",
          category: "business",
        },
      ];
    }

    return [];
  };
  const allDocuments = getDocumentConfig();

  const getIncompleteRequiredDocs = (): string[] => {
    return allDocuments
      .filter((d) => !documents[d.key])
      .map((d) => d.name);
  };

  const idDocuments = allDocuments.filter((d) => d.category === "id");
  const certifications = allDocuments.filter(
    (d) => d.category === "certification",
  );

  const businessDocs = allDocuments.filter((d) => d.category === "business");
  const categorySpecificDocs = allDocuments.filter(
    (d) => d.category === "category_specific",
  );

  const uploadedCount = allDocuments.filter((d) => documents[d.key]).length;
  const totalRequired = allDocuments.length;
  const requiredUploaded = allDocuments.filter(
    (d) => documents[d.key],
  ).length;

  const approvedCount = allDocuments.filter(
    (d) =>
    (documents[d.key]?.status === "approved" ||
      documents[d.key]?.status === "VERIFIED"),
  ).length;

  const rejectedCount = allDocuments.filter(
    (d) =>
    (documents[d.key]?.status === "rejected" ||
      documents[d.key]?.status === "REJECTED" ||
      documents[d.key]?.status === "RESUBMIT"),
  ).length;

  const overallStatus =
    approvedCount >= totalRequired
      ? "approved"
      : rejectedCount > 0
        ? "reupload_requested"
        : "pending";

  const handleUpload = async (file: File, key: string) => {
    setUploadingFiles((p) => ({ ...p, [key]: true }));

    try {
      const uploadedFile = await uploadFileWithAxios(axiosInstance, file);
      const now = new Date();
      const dateStr = `${now.getMonth() + 1}/${now.getDate()}/${now.getFullYear()}`;

      const updatedDocs = {
        ...documents,
        [key]: {
          name: uploadedFile.originalName,
          url: uploadedFile.url,
          type: key,
          uploadedAt: dateStr,
          status: "pending" as DocumentStatus,
          statusReason: "Awaiting admin verification",
        },
      };

      setDocuments(updatedDocs);
      setHasChanges(true);
      toast.success(`${file.name} uploaded. Click 'Save' to apply changes.`);
    } catch (error: any) {
      toast.error(error.message || "Failed to upload file");
    } finally {
      setUploadingFiles((p) => ({ ...p, [key]: false }));
    }
  };

  const handleDelete = async (key: string) => {
    const updated = { ...documents };
    delete updated[key];
    setDocuments(updated);
    setHasChanges(true);
    toast.success("Document removed. Click 'Save' to apply changes.");
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      await persistDocuments(documents);
      toast.success("All documents saved successfully");
      setHasChanges(false);
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error: any) {
      toast.error(error.message || "Failed to save documents");
    } finally {
      setIsSaving(false);
    }
  };

  const handleApprove = async (key: string) => {
    const now = new Date().toISOString();
    const updatedDocs = {
      ...documents,
      [key]: {
        ...documents[key],
        status: "approved" as DocumentStatus,
        statusReason: "Document verified and approved",
        statusDate: now,
        reviewedBy: "Admin",
      },
    };
    try {
      await persistDocuments(updatedDocs);
      setDocuments(updatedDocs);
      toast.success("Document approved");
      closeActionModal();
    } catch (error: any) {
      toast.error("Failed to approve document");
    }
  };

  const handleReject = async (key: string, reason: string) => {
    if (!reason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }
    const now = new Date().toISOString();
    const updatedDocs = {
      ...documents,
      [key]: {
        ...documents[key],
        status: "rejected" as DocumentStatus,
        statusReason: reason,
        statusDate: now,
        reviewedBy: "Admin",
      },
    };
    try {
      await persistDocuments(updatedDocs);
      setDocuments(updatedDocs);
      toast.success("Document rejected");
      closeActionModal();
    } catch (error: any) {
      toast.error("Failed to reject document");
    }
  };

  const handleRequestReupload = async (key: string, reason: string) => {
    if (!reason.trim()) {
      toast.error("Please provide a reason for re-upload request");
      return;
    }
    const now = new Date().toISOString();
    const updatedDocs = {
      ...documents,
      [key]: {
        ...documents[key],
        status: "reupload_requested" as DocumentStatus,
        statusReason: reason,
        statusDate: now,
        reviewedBy: "Admin",
      },
    };
    try {
      await persistDocuments(updatedDocs);
      setDocuments(updatedDocs);
      toast.success("Re-upload requested");
      closeActionModal();
    } catch (error: any) {
      toast.error("Failed to request re-upload");
    }
  };

  const openActionModal = (
    docKey: string,
    action: "approve" | "reject" | "resubmit",
  ) => {
    setActionModal({ isOpen: true, docKey, action });
    setActionReason("");
  };

  const closeActionModal = () => {
    setActionModal({ isOpen: false, docKey: "", action: null });
    setActionReason("");
  };

  const submitAction = async () => {
    const { docKey, action, isGlobal } = actionModal;

    if (isGlobal) {
      if (action === "approve") {
        const missing = getIncompleteRequiredDocs();
        if (missing.length > 0) {
          toast.error(
            `Cannot approve: ${missing.length} required document(s) not uploaded: ${missing.slice(0, 3).join(", ")}${missing.length > 3 ? "…" : ""}`,
            { duration: 5000 },
          );
          closeActionModal();
          return;
        }
      }

      setIsPendingAction(true);
      try {
        if (action === "approve") {
          await adminVerifyDocuments(axiosInstance, userData.id);
          toast.success("Documents approved successfully");
        } else if (action === "reject") {
          await adminRejectDocuments(axiosInstance, userData.id, actionReason);
          toast.success("Documents disapproved");
        } else if (action === "resubmit") {
          await adminResubmitDocuments(
            axiosInstance,
            userData.id,
            actionReason,
          );
          toast.success("All documents returned for correction");
        }

        // If user is currently VERIFIED, change overall status to PENDING (UNVERIFY)
        if (userData.status === "VERIFIED" && (action === "reject" || action === "resubmit")) {
          await updateAccountStatus(axiosInstance, userData.id, "UNVERIFY", actionReason);
        }
        window.location.reload();
      } catch (error: any) {
        toast.error(error.message || "Action failed");
      } finally {
        setIsPendingAction(false);
        closeActionModal();
      }
      return;
    }

    if (docKey) {
      setIsPendingAction(true);
      const statusMap = {
        approve: "VERIFIED",
        reject: "REJECTED",
        resubmit: "RESUBMIT",
      };

      try {
        await adminUpdateSingleDocumentStatus(
          axiosInstance,
          userData.id,
          docKey,
          statusMap[action as keyof typeof statusMap],
          actionReason,
        );
        toast.success(
          `Document ${action === "approve" ? "approved" : action === "reject" ? "disapproved" : "returned for correction"}`,
        );

        // If user is currently VERIFIED and a document is rejected or returned, change overall status to PENDING (UNVERIFY)
        if (userData.status === "VERIFIED" && (action === "reject" || action === "resubmit")) {
          await updateAccountStatus(axiosInstance, userData.id, "UNVERIFY", actionReason);
        }
        window.location.reload();
      } catch (error: any) {
        toast.error(error.message || "Action failed");
      } finally {
        setIsPendingAction(false);
        closeActionModal();
      }
    }
  };

  const StatusBadge = ({
    status,
    showIcon = true,
  }: {
    status: string;
    showIcon?: boolean;
  }) => {
    const configs: Record<
      string,
      { bg: string; text: string; border: string; icon: any; label: string }
    > = {
      pending: {
        bg: "bg-amber-50",
        text: "text-amber-700",
        border: "border-amber-200",
        icon: Clock,
        label: "Pending Review",
      },
      approved: {
        bg: "bg-green-50",
        text: "text-green-700",
        border: "border-green-200",
        icon: CheckCircle,
        label: "Approved",
      },
      verified: {
        bg: "bg-green-50",
        text: "text-green-700",
        border: "border-green-200",
        icon: CheckCircle,
        label: "Approved",
      },
      VERIFIED: {
        bg: "bg-green-50",
        text: "text-green-700",
        border: "border-green-200",
        icon: CheckCircle,
        label: "Approved",
      },
      rejected: {
        bg: "bg-red-50",
        text: "text-red-700",
        border: "border-red-200",
        icon: XCircle,
        label: "Disapproved",
      },
      REJECTED: {
        bg: "bg-red-50",
        text: "text-red-700",
        border: "border-red-200",
        icon: XCircle,
        label: "Disapproved",
      },
      reupload_requested: {
        bg: "bg-blue-50",
        text: "text-blue-700",
        border: "border-blue-200",
        icon: FiRefreshCw,
        label: "Returned for Correction",
      },
      RESUBMIT: {
        bg: "bg-blue-50",
        text: "text-blue-700",
        border: "border-blue-200",
        icon: FiRefreshCw,
        label: "Returned for Correction",
      },
    };

    const config = configs[status] || configs.pending;
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text} border ${config.border}`}
      >
        {showIcon && <Icon className="w-3 h-3" />}
        {config.label}
      </span>
    );
  };

  const DocumentCard = ({ doc }: { doc: DocumentItem }) => {
    const uploaded = documents[doc.key];
    const isUploading = uploadingFiles[doc.key];

    if (!uploaded) {
      return (
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
              <Image className="w-5 h-5 text-gray-400" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 text-sm">{doc.name}</h4>
              <p className="text-xs text-gray-500">Not uploaded</p>
            </div>
          </div>
          <div className="flex gap-2">
            {isUploading ? (
              <div className="flex-1 flex items-center justify-center py-2 text-blue-600 text-sm">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                Uploading...
              </div>
            ) : (
              <label className="flex-1 cursor-pointer">
                <div className="flex items-center justify-center gap-2 py-2 px-4 border border-dashed border-blue-300 rounded-lg bg-blue-50 text-blue-600 text-sm font-medium hover:bg-blue-100 transition">
                  <FiUpload className="w-4 h-4" />
                  Upload
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*,.pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUpload(file, doc.key);
                  }}
                />
              </label>
            )}
          </div>
        </div>
      );
    }

    const status = uploaded.status || "pending";
    const statusLower = (status || "").toLowerCase();
    const isApproved = statusLower === "approved" || statusLower === "verified";
    const isDisapproved = statusLower === "rejected" || statusLower === "reupload_requested" || statusLower === "resubmit";
    const iconBgColor =
      isApproved
        ? "bg-green-50"
        : status === "rejected" || status === "REJECTED"
          ? "bg-red-50"
          : "bg-amber-50";
    const iconColor =
      isApproved
        ? "text-green-600"
        : status === "rejected" || status === "REJECTED"
          ? "text-red-600"
          : "text-amber-600";

    return (
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div className="flex items-start gap-3 mb-3">
          <div
            className={`w-10 h-10 rounded-lg ${iconBgColor} flex items-center justify-center`}
          >
            <FileText className={`w-5 h-5 ${iconColor}`} />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-gray-900 text-sm truncate">
              {doc.name}
            </h4>
            <p className="text-xs text-gray-500">
              Uploaded: {uploaded.uploadedAt}
            </p>
            <div className="mt-1">
              <StatusBadge status={status} />
            </div>
          </div>
        </div>

        { }
        {uploaded.statusReason && (
          <div
            className={`mb-3 p-2 rounded-lg text-xs ${status === "rejected" || status === "REJECTED"
              ? "bg-red-50 text-red-700"
              : status === "reupload_requested" || status === "RESUBMIT"
                ? "bg-blue-50 text-blue-700"
                : isApproved
                  ? "bg-green-50 text-green-700"
                  : "bg-amber-50 text-amber-700"
              }`}
          >
            <span className="font-medium">
              {status === "pending" || status === "PENDING"
                ? "Status: "
                : status === "rejected" || status === "REJECTED"
                  ? "Rejection reason: "
                  : status === "reupload_requested" || status === "RESUBMIT"
                    ? "Re-upload reason: "
                    : "Note: "}
            </span>
            {uploaded.statusReason}
            {uploaded.statusDate && (
              <span className="block mt-1 text-gray-500">
                {new Date(uploaded.statusDate).toLocaleDateString()}
              </span>
            )}
          </div>
        )}

        { }
        <div className="flex gap-2 flex-wrap">
          <a
            href={uploaded.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1 py-2 px-2 border border-gray-200 rounded-lg text-gray-700 text-xs font-medium hover:bg-gray-50 transition"
          >
            <FiEye className="w-3.5 h-3.5" />
            View
          </a>
          <a
            href={uploaded.url}
            download={uploaded.name}
            className="flex-1 flex items-center justify-center gap-1 py-2 px-2 border border-gray-200 rounded-lg text-gray-700 text-xs font-medium hover:bg-gray-50 transition"
          >
            <FiDownload className="w-3.5 h-3.5" />
            Download
          </a>
          <label className="flex-1 cursor-pointer">
            <div className="flex items-center justify-center gap-1 py-2 px-2 border border-blue-200 rounded-lg text-blue-600 text-xs font-medium hover:bg-blue-50 transition">
              <FiUpload className="w-3.5 h-3.5" />
              Replace
            </div>
            <input
              type="file"
              className="hidden"
              accept="image/*,.pdf"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUpload(file, doc.key);
              }}
            />
          </label>
          {isAdmin && (
            <div className="flex gap-2 w-full mt-2 border-t pt-2">
              <button
                onClick={() => openActionModal(doc.key, "approve")}
                disabled={isApproved || isDisapproved || hasChanges}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 bg-green-50 text-green-600 rounded-lg text-[10px] font-semibold hover:bg-green-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
                title={hasChanges ? "Save changes first" : isApproved ? "Already approved" : isDisapproved ? "Wait for user to resubmit" : "Approve"}
              >
                <FiCheck className="w-3 h-3" />
                Approve
              </button>
              <button
                onClick={() => openActionModal(doc.key, "resubmit")}
                disabled={isDisapproved || hasChanges}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 bg-amber-50 text-amber-600 rounded-lg text-[10px] font-semibold hover:bg-amber-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
                title={hasChanges ? "Save changes first" : isDisapproved ? "Wait for user to resubmit" : "Return for correction"}
              >
                <FiRefreshCw className="w-3 h-3" />
                Return
              </button>
              <button
                onClick={() => openActionModal(doc.key, "reject")}
                disabled={!(status === "approved" || status === "VERIFIED") || hasChanges}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 bg-red-50 text-red-600 rounded-lg text-[10px] font-semibold hover:bg-red-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
                title={hasChanges ? "Save changes first" : !(status === "approved" || status === "VERIFIED") ? "Only approved documents can be disapproved" : "Disapprove"}
              >
                <XCircle className="w-3 h-3" />
                Disapprove
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const DocumentSection = ({
    title,
    docs,
  }: {
    title: string;
    docs: DocumentItem[];
  }) => {
    if (docs.length === 0) return null;

    return (
      <div className="mb-8">
        <h3 className="text-sm font-semibold text-gray-600 mb-4">{title}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {docs.map((doc) => (
            <DocumentCard key={doc.key} doc={doc} />
          ))}
        </div>
      </div>
    );
  };

  const renderActionModal = () => {
    if (!actionModal.isOpen) return null;

    const { action, docKey } = actionModal;
    const docName =
      allDocuments.find((d) => d.key === docKey)?.name || "Document";

    const configs = {
      approve: {
        title: "Approve Document",
        description: `Are you sure you want to approve "${docName}"?`,
        buttonText: "Approve",
        buttonColor: "bg-green-600 hover:bg-green-700",
        needsReason: false,
      },
      reject: {
        title: "Disapprove Document",
        description: actionModal.isGlobal ? "Please provide a reason for disapproving all documents:" : `Please provide a reason for disapproving "${docName}":`,
        buttonText: "Disapprove",
        buttonColor: "bg-red-600 hover:bg-red-700",
        needsReason: true,
      },
      reupload: {
        title: actionModal.isGlobal ? "Return All Documents" : "Return for Correction",
        description: actionModal.isGlobal ? "Please specify why documents are being returned for correction:" : `Please specify what needs to be corrected for "${docName}":`,
        buttonText: actionModal.isGlobal ? "Return All" : "Return",
        buttonColor: "bg-blue-600 hover:bg-blue-700",
        needsReason: true,
      },
    };

    const config = configs[action === "resubmit" ? "reupload" : action!];

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
        <div
          className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {config.title}
          </h3>
          <p className="text-sm text-gray-600 mb-4">{config.description}</p>

          {config.needsReason && (
            <textarea
              autoFocus
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              onKeyDown={(e) => e.stopPropagation()}
              placeholder="Enter reason..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              rows={3}
            />
          )}

          <div className="flex gap-3 mt-4">
            <button
              type="button"
              disabled={isPendingAction}
              onClick={submitAction}
              className={`flex-1 py-2 px-4 text-white rounded-lg font-medium transition disabled:opacity-50 ${config.buttonColor}`}
            >
              {isPendingAction ? "Processing..." : config.buttonText}
            </button>
            <button
              type="button"
              disabled={isPendingAction}
              onClick={closeActionModal}
              className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 rounded-xl">
      <Toaster position="top-center" />
      {renderActionModal()}

      <div className="p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          { }
          <div className="flex items-start justify-between mb-2">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Uploaded Documents
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                ID documents, certificates, and business credentials
              </p>
            </div>
            <div className="flex items-center gap-3">
              {hasChanges && (
                <button
                  onClick={handleSaveAll}
                  disabled={isSaving}
                  className="flex items-center gap-2 py-2 px-4 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition shadow-sm"
                >
                  {isSaving ? (
                    <FiRefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <FiCheck className="w-4 h-4" />
                  )}
                  Save All Changes
                </button>
              )}

              <StatusBadge
                status={
                  userData?.documentStatus === "VERIFIED" &&
                    approvedCount < totalRequired
                    ? overallStatus
                    : userData?.documentStatus || overallStatus
                }
              />

              { }

              {/* Global Actions Dropdown - Admin Only */}
              {isAdmin && (
                <div className="relative">
                  <button
                    disabled={isPendingAction || hasChanges}
                    onClick={() => setShowGlobalActions(!showGlobalActions)}
                    className="flex items-center gap-2 py-2 px-4 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    title={hasChanges ? "Save changes first" : ""}
                  >
                    {isPendingAction ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        Actions
                        <FiChevronDown
                          className={`w-4 h-4 transition-transform ${showGlobalActions ? "rotate-180" : ""}`}
                        />
                      </>
                    )}
                  </button>
                  {showGlobalActions && (
                    <div className="absolute right-0 mt-2 w-52 bg-white border border-gray-200 rounded-xl shadow-xl z-[90] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                      <button
                        onClick={async () => {
                          setShowGlobalActions(false);
                          const missing = getIncompleteRequiredDocs();
                          if (missing.length > 0) {
                            toast.error(
                              `Cannot approve: ${missing.length} required document(s) missing: ${missing.slice(0, 3).join(", ")}${missing.length > 3 ? "…" : ""}`,
                              { duration: 5000 },
                            );
                            return;
                          }
                          setIsPendingAction(true);
                          try {
                            await adminVerifyDocuments(
                              axiosInstance,
                              userData.id,
                            );
                            toast.success("Documents approved successfully");
                            window.location.reload();
                          } catch (error: any) {
                            toast.error(
                              error.message || "Failed to approve documents",
                            );
                          } finally {
                            setIsPendingAction(false);
                          }
                        }}
                        disabled={uploadedCount === 0 || userData.documentStatus === "VERIFIED" || userData.documentStatus === "REJECTED" || userData.documentStatus === "RESUBMIT" || hasChanges}
                        className="w-full flex items-center gap-2 px-4 py-3 text-sm text-green-700 hover:bg-green-50 transition border-b border-gray-100 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                        title={hasChanges ? "Save changes first" : uploadedCount === 0 ? "No documents uploaded" : (userData.documentStatus === "REJECTED" || userData.documentStatus === "RESUBMIT" ? "Wait for user to resubmit" : "")}
                      >
                        <FiCheck className="w-4 h-4" />
                        Approve All
                      </button>
                      <button
                        onClick={() => {
                          setShowGlobalActions(false);
                          setActionModal({
                            isOpen: true,
                            action: "resubmit",
                            isGlobal: true,
                          });
                        }}
                        disabled={uploadedCount === 0 || userData.documentStatus === "REJECTED" || userData.documentStatus === "RESUBMIT" || hasChanges}
                        className="w-full flex items-center gap-2 px-4 py-3 text-sm text-amber-700 hover:bg-amber-50 transition border-b border-gray-100 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                        title={hasChanges ? "Save changes first" : uploadedCount === 0 ? "No documents uploaded" : (userData.documentStatus === "REJECTED" || userData.documentStatus === "RESUBMIT" ? "Wait for user to resubmit" : "")}
                      >
                        <FiRefreshCw className="w-4 h-4" />
                        Return All
                      </button>
                      <button
                        onClick={() => {
                          setShowGlobalActions(false);
                          setActionModal({
                            isOpen: true,
                            action: "reject",
                            isGlobal: true,
                          });
                        }}
                        disabled={uploadedCount === 0 || userData.documentStatus !== "VERIFIED" || hasChanges}
                        className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-700 hover:bg-red-50 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        title={hasChanges ? "Save changes first" : uploadedCount === 0 ? "No documents uploaded" : (userData.documentStatus !== "VERIFIED" ? "Only verified status can be disapproved" : "Disapprove All")}
                      >
                        <XCircle className="w-4 h-4" />
                        Disapprove All
                      </button>
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>

          {(userData?.documentStatus === "REJECTED" ||
            userData?.documentStatus === "RESUBMIT") &&
            userData?.documentStatusReason && (
              <div
                className={`mb-8 p-4 rounded-xl border flex items-start gap-4 ${userData.documentStatus === "REJECTED"
                  ? "bg-red-50 border-red-200"
                  : "bg-blue-50 border-blue-200"
                  }`}
              >
                <div
                  className={`p-2 rounded-lg ${userData.documentStatus === "REJECTED"
                    ? "bg-red-100"
                    : "bg-blue-100"
                    }`}
                >
                  <FiAlertCircle
                    className={`w-5 h-5 ${userData.documentStatus === "REJECTED"
                      ? "text-red-600"
                      : "text-blue-600"
                      }`}
                  />
                </div>
                <div className="flex-1">
                  <h3
                    className={`font-semibold text-sm ${userData.documentStatus === "REJECTED"
                      ? "text-red-900"
                      : "text-blue-900"
                      }`}
                  >
                    {userData.documentStatus === "REJECTED"
                      ? "Documents Disapproved"
                      : "Return for Correction"}
                  </h3>
                  <p
                    className={`text-sm mt-1 mb-3 ${userData.documentStatus === "REJECTED"
                      ? "text-red-700"
                      : "text-blue-700"
                      }`}
                  >
                    {userData.documentStatusReason}
                  </p>
                  {allDocuments.filter(
                    (d) =>
                    (documents[d.key]?.status === "rejected" ||
                      documents[d.key]?.status === "REJECTED" ||
                      documents[d.key]?.status === "resubmit" ||
                      documents[d.key]?.status === "RESUBMIT"),
                  ).length > 0 && (
                      <div
                        className={`p-3 rounded-lg border ${userData.documentStatus === "REJECTED"
                          ? "bg-red-100/50 border-red-200"
                          : "bg-blue-100/50 border-blue-200"
                          }`}
                      >
                        <p
                          className={`text-[10px] font-bold uppercase mb-2 ${userData.documentStatus === "REJECTED"
                            ? "text-red-800"
                            : "text-blue-800"
                            }`}
                        >
                          Action Required for:
                        </p>
                        <ul className="list-disc list-inside space-y-1">
                          {allDocuments
                            .filter(
                              (d) =>
                              (documents[d.key]?.status === "rejected" ||
                                documents[d.key]?.status === "REJECTED" ||
                                documents[d.key]?.status === "resubmit" ||
                                documents[d.key]?.status === "RESUBMIT"),
                            )
                            .map((doc, idx) => (
                              <li
                                key={idx}
                                className={`text-sm font-medium ${userData.documentStatus === "REJECTED"
                                  ? "text-red-700"
                                  : "text-blue-700"
                                  }`}
                              >
                                {doc.name}
                              </li>
                            ))}
                        </ul>
                      </div>
                    )}
                </div>
              </div>
            )}

          { }
          <div className="mb-8">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="font-medium text-gray-900">
                {requiredUploaded} of {totalRequired} documents uploaded
              </span>
              <span className="text-gray-300">|</span>
              <span
                className={
                  approvedCount === totalRequired
                    ? "text-green-600 font-medium"
                    : "text-amber-600"
                }
              >
                {approvedCount} approved
              </span>
              {uploadedCount > requiredUploaded && (
                <span className="text-gray-400">
                  (+{uploadedCount - requiredUploaded} optional)
                </span>
              )}
            </div>
            <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden relative">
              { }
              <div
                className="absolute h-full bg-amber-500 transition-all duration-500 opacity-60"
                style={{
                  width: `${totalRequired > 0 ? (requiredUploaded / totalRequired) * 100 : 0}%`,
                }}
              />
              { }
              <div
                className="absolute h-full bg-green-500 transition-all duration-500"
                style={{
                  width: `${totalRequired > 0 ? (approvedCount / totalRequired) * 100 : 0}%`,
                }}
              />
            </div>
            {requiredUploaded > approvedCount && (
              <p className="text-xs text-amber-600 mt-1">
                {requiredUploaded - approvedCount} document(s) pending review
              </p>
            )}
            {approvedCount === totalRequired && (
              <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> All required documents
                verified
              </p>
            )}
          </div>

          { }
          {businessDocs.length > 0 && (
            <DocumentSection
              title={
                userType === "contractor"
                  ? "Company Documents"
                  : "Business Documents"
              }
              docs={businessDocs}
            />
          )}

          {idDocuments.length > 0 && (
            <DocumentSection title="ID Documents" docs={idDocuments} />
          )}

          {certifications.length > 0 && (
            <DocumentSection title="Certifications" docs={certifications} />
          )}

          {userType === "contractor" && categorySpecificDocs.length > 0 && (
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-gray-600 mb-4">
                Category Specific Documents
              </h3>
              <div className="space-y-6">
                {(userData?.contractorTypes
                  ? userData.contractorTypes
                    .split(",")
                    .map((t: string) => ({ category: t.trim() }))
                  : userData?.contractorCategories ||
                  userData?.contractorExperiences ||
                  []
                ).map((cat: any, idx: number) => {
                  const categoryName = cat.category || "";
                  if (!categoryName) return null;

                  const categoryKey = categoryName
                    .toUpperCase()
                    .replace(/\s+/g, "_");
                  const certKey = `${categoryKey}_CERTIFICATE`;
                  const licenseKey = `${categoryKey}_LICENSE`;

                  const catDocs = categorySpecificDocs.filter(
                    (d) => d.key === certKey || d.key === licenseKey,
                  );

                  if (catDocs.length === 0) return null;

                  return (
                    <div
                      key={idx}
                      className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm"
                    >
                      <h4 className="text-md font-bold text-blue-800 mb-4 flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        {categoryName} Credentials
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                        {catDocs.map((doc) => (
                          <DocumentCard key={doc.key} doc={doc} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}


          { }
          {allDocuments.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No documents required
              </h3>
              <p className="text-gray-500">
                There are no document requirements for this user type.
              </p>
            </div>
          )}

          { }
          {!isAdmin && allDocuments.length > 0 && (
            <div className="mt-8 border-t pt-6">
              {userData?.status == "VERIFIED" ? (
                <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                    <div>
                      <h3 className="text-lg font-semibold text-green-800">
                        Profile Verified
                      </h3>
                      <p className="text-sm text-green-600">
                        Your profile has been verified by an administrator.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                  <div className="flex items-center gap-3">
                    <Clock className="w-8 h-8 text-blue-600" />
                    <div>
                      <h3 className="text-lg font-semibold text-blue-800">
                        Verification In Progress
                      </h3>
                      <p className="text-sm text-blue-600">
                        {approvedCount} of {totalRequired} required documents
                        have been approved. Please ensure all documents are
                        uploaded for verification.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {userType === "professional" && (
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={handleSaveAll}
                    disabled={isSaving}
                    className="flex-1 flex items-center justify-center gap-2 py-3 px-6 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition shadow-md disabled:opacity-50"
                  >
                    {isSaving ? (
                      <>
                        <FiRefreshCw className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <FiCheck className="w-4 h-4" />
                        Save Documents
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountUploads;
