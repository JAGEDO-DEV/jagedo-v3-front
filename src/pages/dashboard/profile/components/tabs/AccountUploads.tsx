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
import { adminDynamicUpdateAccountUploads, adminVerifyDocuments, adminRejectDocuments, adminResubmitDocuments, adminUpdateSingleDocumentStatus } from "@/api/uploads.api";
import { handleVerifyUser } from "@/api/provider.api";
import useAxiosWithAuth from "@/utils/axiosInterceptor";
import { uploadFileWithAxios } from "@/utils/fileUpload";

interface DocumentItem {
  key: string;
  name: string;
  category: "id" | "certification" | "portfolio" | "business";
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
          krapin: updatedDocs.kraPIN?.url || "",
        };
      } else if (type === "professional") {
        payload = {
          idFront: updatedDocs.idFront?.url || "",
          idBack: updatedDocs.idBack?.url || "",
          academicCertificate: updatedDocs.academicCertificate?.url || "",
          cvUrl: updatedDocs.cv?.url || updatedDocs.cvUrl?.url || "",
          krapin: updatedDocs.kraPIN?.url || "",
        };
      } else if (type === "contractor") {
        payload = {
          businessRegistration:
            updatedDocs.certificateOfIncorporation?.url ||
            updatedDocs.businessRegistration?.url ||
            "",
          businessPermit: updatedDocs.businessPermit?.url || "",
          krapin: updatedDocs.kraPIN?.url || "",
          companyProfile: updatedDocs.companyProfile?.url || "",
        };

        const contractorCategories =
          userData?.contractorCategories ||
          userData?.contractorExperiences ||
          [];
        if (Array.isArray(contractorCategories)) {
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
            krapin: updatedDocs.kraPIN?.url || "",
          };
        } else {
          payload = {
            businessPermit: updatedDocs.businessPermit?.url || "",
            certificateOfIncorporation:
              updatedDocs.certificateOfIncorporation?.url || "",
            krapin: updatedDocs.kraPIN?.url || "",
          };
        }
      } else if (type === "hardware") {
        payload = {
          businessRegistration: updatedDocs.businessRegistration?.url || "",
          businessPermit: updatedDocs.businessPermit?.url || "",
          krapin: updatedDocs.kraPIN?.url || updatedDocs.krapin?.url || "",
          ownerIdFront: updatedDocs.ownerIdFront?.url || "",
          ownerIdBack: updatedDocs.ownerIdBack?.url || "",
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

    const globalStatus = userData?.status == 'VERIFIED' ? "approved" : "pending";
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
      // Process standard documents
      if (profile.idFrontUrl) {
        const key = userType === "hardware" ? "ownerIdFront" : "idFront";
        initialDocs[key] = {
          name:
            userType === "hardware" ? "Owner ID - Front" : "National ID Front",
          url: profile.idFrontUrl,
          type: key,
          uploadedAt: "Existing",
          status: getStatus(key),
          statusReason: getReason(key),
        };
      }
      if (profile.idBackUrl) {
        const key = userType === "hardware" ? "ownerIdBack" : "idBack";
        initialDocs[key] = {
          name:
            userType === "hardware" ? "Owner ID - Back" : "National ID Back",
          url: profile.idBackUrl,
          type: key,
          uploadedAt: "Existing",
          status: getStatus(key),
          statusReason: getReason(key),
        };
      }
      if (profile.krapin || profile.kraPIN) {
        const key = userType === "hardware" ? "krapin" : "kraPIN";
        initialDocs[key] = {
          name: "KRA PIN Certificate",
          url: (profile.krapin || profile.kraPIN) as string,
          type: key,
          uploadedAt: "Existing",
          status: getStatus(key),
          statusReason: getReason(key),
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

      if (profile.businessPermit || profile.singleBusinessPermit) {
        initialDocs.businessPermit = {
          name: "Business Permit",
          url: (profile.businessPermit ||
            profile.singleBusinessPermit) as string,
          type: "businessPermit",
          uploadedAt: "Existing",
          status: getStatus("businessPermit"),
          statusReason: getReason("businessPermit"),
        };
      }

      const bizRegUrl =
        profile.businessRegistration ||
        profile.certificateOfIncorporation ||
        profile.registrationCertificateUrl;
      if (bizRegUrl) {
        const key =
          userType === "hardware"
            ? "businessRegistration"
            : "certificateOfIncorporation";
        initialDocs[key] = {
          name:
            userType === "hardware"
              ? "Business Registration"
              : "Registration Document",
          url: bizRegUrl as string,
          type: key,
          uploadedAt: "Existing",
          status: getStatus(key),
          statusReason: getReason(key),
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
      // if (profile.ncaCertificate || profile.ncaRegCardUrl) {
      //   initialDocs.ncaCertificate = {
      //     name: "NCA Certificate",
      //     url: (profile.ncaCertificate || profile.ncaRegCardUrl) as string,
      //     type: "ncaCertificate",
      //     uploadedAt: "Existing",
      //     status: status as DocumentStatus,
      //   };
      // }

      const contractorCategories = profile.contractorExperiences || [];
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

      const projects =
        profile.professionalProjects ||
        profile.contractorProjects ||
        profile.previousJobPhotoUrls;
      if (Array.isArray(projects)) {
        projects.forEach((proj: any, index: number) => {
          const key = `portfolio${index + 1}`;
          initialDocs[key] = {
            name: proj.projectName || `Project ${index + 1}`,
            url: proj.fileUrl || proj.url,
            type: key,
            uploadedAt: "Existing",
            status: getStatus(key),
            statusReason: getReason(key),
          };
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
      { key: "kraPIN", name: "KRA PIN Certificate", category: "certification" },
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
      
      // Add portfolio projects from fundiEvaluation if available
      const fundiProjects = userData?.fundiEvaluation;
      if (Array.isArray(fundiProjects) && fundiProjects.length > 0) {
        fundiProjects.forEach((project: any, index: number) => {
          fundiDocs.push({
            key: `portfolio${index + 1}`,
            name: `Portfolio - ${project.projectName || `Project ${index + 1}`}`,
            category: "portfolio",
          });
        });
      }
      
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
      
      // Add portfolio projects from professionalProjects if available
      const profProjects = userData?.professionalProjects;
      if (Array.isArray(profProjects) && profProjects.length > 0) {
        profProjects.forEach((project: any, index: number) => {
          profDocs.push({
            key: `portfolio${index + 1}`,
            name: `Portfolio - ${project.projectName || `Project ${index + 1}`}`,
            category: "portfolio",
          });
        });
      }
      
      return profDocs;
    }

    const organizationBaseDocs: DocumentItem[] = [
      {
        key: "certificateOfIncorporation",
        name: "Certificate of Incorporation",
        category: "business",
      },
      { key: "businessPermit", name: "Business Permit", category: "business" },
      { key: "kraPIN", name: "KRA PIN Certificate", category: "certification" },
      {
        key: "companyProfile",
        name: "Company Profile",
        category: "certification",
      },
    ];

    if (userType === "customer") {
      return organizationBaseDocs;
    }

    // if (userType === "contractor") {
    //   const baseDocs: DocumentItem[] = [
    //     ...organizationBaseDocs,
    //     { key: "ncaCertificate", name: "NCA Certificate", category: "certification" },
    //   ];

    if (userType === "contractor") {
      const baseDocs: DocumentItem[] = [...organizationBaseDocs];

      const contractorCategories =
        userData?.contractorCategories || userData?.contractorExperiences;
      if (
        Array.isArray(contractorCategories) &&
        contractorCategories.length > 0
      ) {
        contractorCategories.forEach((cat: any, index: number) => {
          const categoryName = cat.category || "";
          if (!categoryName) return;

          const categoryKey = categoryName.toUpperCase().replace(/\s+/g, "_");
          const certKey = `${categoryKey}_CERTIFICATE`;
          const licenseKey = `${categoryKey}_LICENSE`;

          baseDocs.push({
            key: certKey,
            name: `${categoryName} Certificate`,
            category: "certification",
          });
          baseDocs.push({
            key: licenseKey,
            name: `${categoryName} Practice License`,
            category: "certification",
          });
        });
      }

      if (
        !Array.isArray(contractorCategories) ||
        contractorCategories.length === 0
      ) {
        baseDocs.push(
          {
            key: "portfolio1",
            name: "Portfolio - Project 1",
            category: "portfolio",
          },
          {
            key: "portfolio2",
            name: "Portfolio - Project 2",
            category: "portfolio",
          },
          {
            key: "portfolio3",
            name: "Portfolio - Project 3",
            category: "portfolio",
          },
        );
      }

      return baseDocs;
    }

    if (userType === "hardware") {
      return [
        {
          key: "businessRegistration",
          name: "Business Registration",
          category: "business",
        },
        {
          key: "businessPermit",
          name: "Business Permit",
          category: "business",
        },
        {
          key: "krapin",
          name: "KRA PIN Certificate",
          category: "certification",
        },
        { key: "ownerIdFront", name: "Owner ID - Front", category: "id" },
        { key: "ownerIdBack", name: "Owner ID - Back", category: "id" },
      ];
    }

    return [];
  };
  const getIncompleteRequiredDocs = (): string[] => {
    return allDocuments
      .filter((d) => d.category !== "portfolio" && !documents[d.key])
      .map((d) => d.name);
  };
  const allDocuments = getDocumentConfig();

  const idDocuments = allDocuments.filter((d) => d.category === "id");
  const certifications = allDocuments.filter(
    (d) => d.category === "certification",
  );
  const portfolios = allDocuments.filter((d) => d.category === "portfolio");
  const businessDocs = allDocuments.filter((d) => d.category === "business");

  const uploadedCount = allDocuments.filter((d) => documents[d.key]).length;
  const totalRequired = allDocuments.filter(
    (d) => d.category !== "portfolio",
  ).length;
  const requiredUploaded = allDocuments.filter(
    (d) => d.category !== "portfolio" && documents[d.key],
  ).length;
  const approvedCount = allDocuments.filter(
    (d) =>
      d.category !== "portfolio" && (documents[d.key]?.status === "approved" || documents[d.key]?.status === "VERIFIED"),
  ).length;
  const overallStatus = approvedCount >= totalRequired ? "approved" : "pending";

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
      await persistDocuments(updatedDocs);
      toast.success(`${file.name} uploaded successfully`);
    } catch (error: any) {
      toast.error(error.message || "Failed to upload file");
    } finally {
      setUploadingFiles((p) => ({ ...p, [key]: false }));
    }
  };

  const handleDelete = async (key: string) => {
    const updated = { ...documents };
    delete updated[key];
    try {
      await persistDocuments(updated);
      setDocuments(updated);
      toast.success("Document deleted");
    } catch (error: any) {
      toast.error("Failed to delete document");
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
          toast.success("Documents rejected");
        } else if (action === "resubmit") {
          await adminResubmitDocuments(
            axiosInstance,
            userData.id,
            actionReason,
          );
          toast.success("Resubmission requested");
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

    
    // Admin actions for single document
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
          actionReason
        );
        toast.success(`Document ${action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'requested for reupload'}`);
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
        label: "Rejected",
      },
      REJECTED: {
        bg: "bg-red-50",
        text: "text-red-700",
        border: "border-red-200",
        icon: XCircle,
        label: "Rejected",
      },
      reupload_requested: {
        bg: "bg-blue-50",
        text: "text-blue-700",
        border: "border-blue-200",
        icon: FiRefreshCw,
        label: "Re-upload Required",
      },
      RESUBMIT: {
        bg: "bg-blue-50",
        text: "text-blue-700",
        border: "border-blue-200",
        icon: FiRefreshCw,
        label: "Re-upload Required",
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
    const iconBgColor =
      status === "approved"
        ? "bg-green-50"
        : status === "rejected"
          ? "bg-red-50"
          : "bg-amber-50";
    const iconColor =
      status === "approved"
        ? "text-green-600"
        : status === "rejected"
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

        {}
        {uploaded.statusReason && (
          <div
            className={`mb-3 p-2 rounded-lg text-xs ${
              status === "rejected"
                ? "bg-red-50 text-red-700"
                : status === "reupload_requested"
                  ? "bg-blue-50 text-blue-700"
                  : status === "approved"
                    ? "bg-green-50 text-green-700"
                    : "bg-amber-50 text-amber-700"
            }`}
          >
            <span className="font-medium">
              {status === "pending"
                ? "Status: "
                : status === "rejected"
                  ? "Rejection reason: "
                  : status === "reupload_requested"
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

        {}
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
                className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 bg-green-50 text-green-600 rounded-lg text-[10px] font-semibold hover:bg-green-100 transition"
                title="Approve"
              >
                <FiCheck className="w-3 h-3" />
                Approve
              </button>
              <button
                onClick={() => openActionModal(doc.key, "resubmit")}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 bg-amber-50 text-amber-600 rounded-lg text-[10px] font-semibold hover:bg-amber-100 transition"
                title="Resubmit"
              >
                <FiRefreshCw className="w-3 h-3" />
                Resubmit
              </button>
              <button
                onClick={() => openActionModal(doc.key, "reject")}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 bg-red-50 text-red-600 rounded-lg text-[10px] font-semibold hover:bg-red-100 transition"
                title="Reject"
              >
                <XCircle className="w-3 h-3" />
                Reject
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
        title: "Reject Document",
        description: `Please provide a reason for rejecting "${docName}":`,
        buttonText: "Reject",
        buttonColor: "bg-red-600 hover:bg-red-700",
        needsReason: true,
      },
      reupload: {
        title: "Request Re-upload",
        description: `Please specify what needs to be corrected for "${docName}":`,
        buttonText: "Request Re-upload",
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
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-center" />
      {renderActionModal()}

      <div className="p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          {}
          <div className="flex items-start justify-between mb-2">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Uploaded Documents
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                ID documents, certificates, and portfolio items
              </p>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge status={userData?.documentStatus || overallStatus} />

              {}
              {isAdmin && (
                <div className="relative">
                  <button
                    onClick={() => setShowGlobalActions(!showGlobalActions)}
                    className="flex items-center gap-2 py-2 px-4 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                  >
                    Actions
                    <FiChevronDown
                      className={`w-4 h-4 transition-transform ${showGlobalActions ? "rotate-180" : ""}`}
                    />
                  </button>
                  {showGlobalActions && (
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
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
                        disabled={userData.documentStatus === "VERIFIED"}
                        className="disabled:opacity-10 w-full flex items-center gap-2 px-4 py-3 text-sm text-green-700 hover:bg-green-50 transition border-b border-gray-100"
                      >
                        <FiCheck className="w-4 h-4" />
                        Approve
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
                        className="w-full flex items-center gap-2 px-4 py-3 text-sm text-amber-700 hover:bg-amber-50 transition border-b border-gray-100"
                      >
                        <FiRefreshCw className="w-4 h-4" />
                        Resubmit
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
                        className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-700 hover:bg-red-50 transition"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
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
                className={`mb-8 p-4 rounded-xl border flex items-start gap-4 ${
                  userData.documentStatus === "REJECTED"
                    ? "bg-red-50 border-red-200"
                    : "bg-blue-50 border-blue-200"
                }`}
              >
                <div
                  className={`p-2 rounded-lg ${
                    userData.documentStatus === "REJECTED"
                      ? "bg-red-100"
                      : "bg-blue-100"
                  }`}
                >
                  <FiAlertCircle
                    className={`w-5 h-5 ${
                      userData.documentStatus === "REJECTED"
                        ? "text-red-600"
                        : "text-blue-600"
                    }`}
                  />
                </div>
                <div>
                  <h3
                    className={`font-semibold text-sm ${
                      userData.documentStatus === "REJECTED"
                        ? "text-red-900"
                        : "text-blue-900"
                    }`}
                  >
                    {userData.documentStatus === "REJECTED"
                      ? "Documents Rejected"
                      : "Resubmission Required"}
                  </h3>
                  <p
                    className={`text-sm mt-1 ${
                      userData.documentStatus === "REJECTED"
                        ? "text-red-700"
                        : "text-blue-700"
                    }`}
                  >
                    {userData.documentStatusReason}
                  </p>
                </div>
              </div>
            )}

          {}
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
              {}
              <div
                className="absolute h-full bg-amber-500 transition-all duration-500 opacity-60"
                style={{
                  width: `${totalRequired > 0 ? (requiredUploaded / totalRequired) * 100 : 0}%`,
                }}
              />
              {}
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

          {}
          {businessDocs.length > 0 && (
            <DocumentSection title="Business Documents" docs={businessDocs} />
          )}

          {idDocuments.length > 0 && (
            <DocumentSection title="ID Documents" docs={idDocuments} />
          )}

          {certifications.length > 0 && (
            <DocumentSection title="Certifications" docs={certifications} />
          )}

          {portfolios.length > 0 && (
            <DocumentSection title="Portfolios (Optional)" docs={portfolios} />
          )}

          {}
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

          {}
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountUploads;
