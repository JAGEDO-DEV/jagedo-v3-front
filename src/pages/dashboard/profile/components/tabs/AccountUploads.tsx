/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { FiDownload, FiEye, FiUpload, FiTrash2, FiCheck, FiX, FiRefreshCw, FiChevronDown } from "react-icons/fi";
import { FileText, Image, AlertCircle, CheckCircle, XCircle, Clock } from "lucide-react";
import { toast, Toaster } from "sonner";
import { getMockUploadsForUserType } from "@/pages/data/mockUploads";

const STORAGE_KEY = "uploads_demo";

interface DocumentItem {
  key: string;
  name: string;
  category: "id" | "certification" | "portfolio" | "business";
}

type DocumentStatus = "pending" | "approved" | "rejected" | "reupload_requested";

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

// Helper to update user in localStorage
const updateUserInLocalStorage = (
  userId: string | number,
  updates: Record<string, any>,
) => {
  try {
    // Update in "users" array
    const storedUsers = JSON.parse(localStorage.getItem("users") || "[]");
    const userIdx = storedUsers.findIndex((u: any) => u.id === userId || u.id === Number(userId) || u.id === String(userId));
    if (userIdx !== -1) {
      storedUsers[userIdx] = { ...storedUsers[userIdx], ...updates };
      localStorage.setItem("users", JSON.stringify(storedUsers));
    }

    // Update in "builders" array
    const storedBuilders = JSON.parse(localStorage.getItem("builders") || "[]");
    const builderIdx = storedBuilders.findIndex((b: any) => b.id === userId || b.id === Number(userId) || b.id === String(userId));
    if (builderIdx !== -1) {
      storedBuilders[builderIdx] = { ...storedBuilders[builderIdx], ...updates };
      localStorage.setItem("builders", JSON.stringify(storedBuilders));
    }

    // Update in "customers" array
    const storedCustomers = JSON.parse(localStorage.getItem("customers") || "[]");
    const customerIdx = storedCustomers.findIndex((c: any) => c.id === userId || c.id === Number(userId) || c.id === String(userId));
    if (customerIdx !== -1) {
      storedCustomers[customerIdx] = { ...storedCustomers[customerIdx], ...updates };
      localStorage.setItem("customers", JSON.stringify(storedCustomers));
    }

    // Update single "user" key
    const singleUser = JSON.parse(localStorage.getItem("user") || "null");
    if (singleUser && (singleUser.id === userId || singleUser.id === Number(userId) || singleUser.id === String(userId))) {
      localStorage.setItem("user", JSON.stringify({ ...singleUser, ...updates }));
    }
  } catch (err) {
    console.error("Failed to update user in localStorage:", err);
  }
};

interface AccountUploadsProps {
  userData: any;
  isAdmin?: boolean; // When true, shows admin actions (approve, reject, etc.)
}

const AccountUploads = ({ userData, isAdmin = true }: AccountUploadsProps) => {
  if (!userData) return <div className="p-8">Loading...</div>;

  const [documents, setDocuments] = useState<Record<string, UploadedDocument>>({});
  const [uploadingFiles, setUploadingFiles] = useState<Record<string, boolean>>({});
  const [isLoaded, setIsLoaded] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // Action modal state
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    docKey: string;
    action: "approve" | "reject" | "reupload" | null;
  }>({ isOpen: false, docKey: "", action: null });
  const [actionReason, setActionReason] = useState("");

  const userType = userData?.userType?.toLowerCase() || "";
  const accountType = userData?.accountType?.toLowerCase() || "";

  /* -------------------- Load documents based on status -------------------- */
  useEffect(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_${userData.id}`);
    if (saved) {
      setDocuments(JSON.parse(saved));
    }
    setIsLoaded(true);
  }, [userData.id]);

  /* -------------------- Save to localStorage -------------------- */
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(
        `${STORAGE_KEY}_${userData.id}`,
        JSON.stringify(documents)
      );
      window.dispatchEvent(new Event("storage"));
    }
  }, [documents, userData.id, isLoaded]);

  /* -------------------- Document Configuration by User Type -------------------- */
  const getDocumentConfig = (): DocumentItem[] => {
    // ===== INDIVIDUAL ACCOUNTS =====
    // Customer (Individual), Fundi, Professional - same base requirements
    const individualBaseDocs: DocumentItem[] = [
      { key: "idFront", name: "National ID - Front", category: "id" },
      { key: "idBack", name: "National ID - Back", category: "id" },
      { key: "kraPIN", name: "KRA PIN Certificate", category: "certification" },
    ];

    // Individual Customer
    if (accountType === "individual" && userType === "customer") {
      return individualBaseDocs;
    }

    // Fundi (Individual builder)
    if (userType === "fundi") {
      return [
        ...individualBaseDocs,
        { key: "certificate", name: "Trade Certificate", category: "certification" },
        { key: "portfolio1", name: "Portfolio - Project 1", category: "portfolio" },
        { key: "portfolio2", name: "Portfolio - Project 2", category: "portfolio" },
        { key: "portfolio3", name: "Portfolio - Project 3", category: "portfolio" },
      ];
    }

    // Professional (Individual builder)
    if (userType === "professional") {
      return [
        ...individualBaseDocs,
        { key: "academicCertificate", name: "Academic Certificate", category: "certification" },
        { key: "practiceLicense", name: "Practice License", category: "certification" },
        { key: "cv", name: "Curriculum Vitae (CV)", category: "certification" },
        { key: "portfolio1", name: "Portfolio - Project 1", category: "portfolio" },
        { key: "portfolio2", name: "Portfolio - Project 2", category: "portfolio" },
        { key: "portfolio3", name: "Portfolio - Project 3", category: "portfolio" },
      ];
    }

    // ===== ORGANIZATION ACCOUNTS =====
    // Customer (Organization), Contractor, Hardware - same base requirements
    const organizationBaseDocs: DocumentItem[] = [
      { key: "certificateOfIncorporation", name: "Certificate of Incorporation", category: "business" },
      { key: "businessPermit", name: "Business Permit", category: "business" },
      { key: "kraPIN", name: "KRA PIN Certificate", category: "certification" },
      { key: "companyProfile", name: "Company Profile", category: "certification" },
    ];

    // Organization Customer
    if (userType === "customer") {
      return organizationBaseDocs;
    }

    // Contractor (Organization builder)
    if (userType === "contractor") {
      const baseDocs: DocumentItem[] = [
        ...organizationBaseDocs,
        { key: "ncaCertificate", name: "NCA Certificate", category: "certification" },
      ];

      // Add category-based documents from contractor categories
      const contractorCategories = userData?.userProfile?.contractorCategories || userData?.userProfile?.contractorExperiences;
      if (Array.isArray(contractorCategories) && contractorCategories.length > 0) {
        contractorCategories.forEach((cat: any, index: number) => {
          const categoryName = cat.category || `Category ${index + 1}`;
          // Create a safe key from the category name
          const safeKey = categoryName.toLowerCase().replace(/[^a-z0-9]/g, '_');

          // Add certificate and license for each category
          baseDocs.push({
            key: `${safeKey}_certificate_${index}`,
            name: `${categoryName} Certificate`,
            category: "certification",
          });
          baseDocs.push({
            key: `${safeKey}_license_${index}`,
            name: `${categoryName} Practice License`,
            category: "certification",
          });
        });
      }

      // Add portfolio items
      baseDocs.push(
        { key: "portfolio1", name: "Portfolio - Project 1", category: "portfolio" },
        { key: "portfolio2", name: "Portfolio - Project 2", category: "portfolio" },
        { key: "portfolio3", name: "Portfolio - Project 3", category: "portfolio" }
      );

      return baseDocs;
    }

    // Hardware (Organization builder)
    if (userType === "hardware") {
      return organizationBaseDocs;
    }

    return [];
  };

  const allDocuments = getDocumentConfig();

  // Group documents by category
  const idDocuments = allDocuments.filter((d) => d.category === "id");
  const certifications = allDocuments.filter((d) => d.category === "certification");
  const portfolios = allDocuments.filter((d) => d.category === "portfolio");
  const businessDocs = allDocuments.filter((d) => d.category === "business");

  // Calculate overall status
  const uploadedCount = allDocuments.filter((d) => documents[d.key]).length;
  const totalRequired = allDocuments.filter((d) => d.category !== "portfolio").length;
  const requiredUploaded = allDocuments.filter(
    (d) => d.category !== "portfolio" && documents[d.key]
  ).length;
  const approvedCount = allDocuments.filter(
    (d) => d.category !== "portfolio" && documents[d.key]?.status === "approved"
  ).length;
  const overallStatus = approvedCount >= totalRequired ? "approved" : "pending";

  /* -------------------- Upload Handler -------------------- */
  const handleUpload = (file: File, key: string) => {
    setUploadingFiles((p) => ({ ...p, [key]: true }));

    setTimeout(() => {
      const url = URL.createObjectURL(file);
      const now = new Date();
      const dateStr = `${now.getMonth() + 1}/${now.getDate()}/${now.getFullYear()}`;

      setDocuments((prev) => ({
        ...prev,
        [key]: {
          name: file.name,
          url,
          type: key,
          uploadedAt: dateStr,
          status: "pending",
          statusReason: "Awaiting admin verification",
        },
      }));

      toast.success(`${file.name} uploaded successfully`);
      setUploadingFiles((p) => ({ ...p, [key]: false }));
    }, 500);
  };

  /* -------------------- Delete Handler -------------------- */
  const handleDelete = (key: string) => {
    const updated = { ...documents };
    delete updated[key];
    setDocuments(updated);
    toast.success("Document deleted");
  };

  /* -------------------- Admin Action Handlers -------------------- */
  const handleApprove = (key: string) => {
    const now = new Date().toISOString();
    setDocuments((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        status: "approved",
        statusReason: "Document verified and approved",
        statusDate: now,
        reviewedBy: "Admin",
      },
    }));
    toast.success("Document approved");
    closeActionModal();
  };

  const handleReject = (key: string, reason: string) => {
    if (!reason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }
    const now = new Date().toISOString();
    setDocuments((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        status: "rejected",
        statusReason: reason,
        statusDate: now,
        reviewedBy: "Admin",
      },
    }));
    toast.success("Document rejected");
    closeActionModal();
  };

  const handleRequestReupload = (key: string, reason: string) => {
    if (!reason.trim()) {
      toast.error("Please provide a reason for re-upload request");
      return;
    }
    const now = new Date().toISOString();
    setDocuments((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        status: "reupload_requested",
        statusReason: reason,
        statusDate: now,
        reviewedBy: "Admin",
      },
    }));
    toast.success("Re-upload requested");
    closeActionModal();
  };

  const openActionModal = (docKey: string, action: "approve" | "reject" | "reupload") => {
    setActionModal({ isOpen: true, docKey, action });
    setActionReason("");
  };

  const closeActionModal = () => {
    setActionModal({ isOpen: false, docKey: "", action: null });
    setActionReason("");
  };

  const submitAction = () => {
    const { docKey, action } = actionModal;
    if (action === "approve") {
      handleApprove(docKey);
    } else if (action === "reject") {
      handleReject(docKey, actionReason);
    } else if (action === "reupload") {
      handleRequestReupload(docKey, actionReason);
    }
  };

  /* -------------------- Status Badge Component -------------------- */
  const StatusBadge = ({ status, showIcon = true }: { status: DocumentStatus; showIcon?: boolean }) => {
    const configs: Record<DocumentStatus, { bg: string; text: string; border: string; icon: any; label: string }> = {
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
      rejected: {
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
    };

    const config = configs[status] || configs.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text} border ${config.border}`}>
        {showIcon && <Icon className="w-3 h-3" />}
        {config.label}
      </span>
    );
  };

  /* -------------------- Document Card Component -------------------- */
  const DocumentCard = ({ doc }: { doc: DocumentItem }) => {
    const uploaded = documents[doc.key];
    const isUploading = uploadingFiles[doc.key];
    const [showActions, setShowActions] = useState(false);

    if (!uploaded) {
      // Empty state - needs upload
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

    // Uploaded state
    const status = uploaded.status || "pending";
    const iconBgColor = status === "approved" ? "bg-green-50" : status === "rejected" ? "bg-red-50" : "bg-amber-50";
    const iconColor = status === "approved" ? "text-green-600" : status === "rejected" ? "text-red-600" : "text-amber-600";

    return (
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div className="flex items-start gap-3 mb-3">
          <div className={`w-10 h-10 rounded-lg ${iconBgColor} flex items-center justify-center`}>
            <FileText className={`w-5 h-5 ${iconColor}`} />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-gray-900 text-sm truncate">{doc.name}</h4>
            <p className="text-xs text-gray-500">Uploaded: {uploaded.uploadedAt}</p>
            <div className="mt-1">
              <StatusBadge status={status} />
            </div>
          </div>
        </div>

        {/* Status Reason / Context */}
        {uploaded.statusReason && (
          <div className={`mb-3 p-2 rounded-lg text-xs ${
            status === "rejected" ? "bg-red-50 text-red-700" :
            status === "reupload_requested" ? "bg-blue-50 text-blue-700" :
            status === "approved" ? "bg-green-50 text-green-700" :
            "bg-amber-50 text-amber-700"
          }`}>
            <span className="font-medium">
              {status === "pending" ? "Status: " :
               status === "rejected" ? "Rejection reason: " :
               status === "reupload_requested" ? "Re-upload reason: " :
               "Note: "}
            </span>
            {uploaded.statusReason}
            {uploaded.statusDate && (
              <span className="block mt-1 text-gray-500">
                {new Date(uploaded.statusDate).toLocaleDateString()}
              </span>
            )}
          </div>
        )}

        {/* Action buttons */}
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

          {/* Admin Actions Dropdown - Only show for admins */}
          {isAdmin && (
          <div className="relative">
            <button
              onClick={() => setShowActions(!showActions)}
              className="flex items-center gap-1 py-2 px-3 border border-blue-200 rounded-lg text-blue-600 text-xs font-medium hover:bg-blue-50 transition"
            >
              Actions
              <FiChevronDown className={`w-3.5 h-3.5 transition-transform ${showActions ? "rotate-180" : ""}`} />
            </button>
            {showActions && (
              <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                {status !== "approved" && (
                  <button
                    onClick={() => {
                      setShowActions(false);
                      openActionModal(doc.key, "approve");
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-green-700 hover:bg-green-50 transition"
                  >
                    <FiCheck className="w-3.5 h-3.5" />
                    Approve
                  </button>
                )}
                {status !== "rejected" && (
                  <button
                    onClick={() => {
                      setShowActions(false);
                      openActionModal(doc.key, "reject");
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-700 hover:bg-red-50 transition"
                  >
                    <FiX className="w-3.5 h-3.5" />
                    Reject
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowActions(false);
                    openActionModal(doc.key, "reupload");
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-blue-700 hover:bg-blue-50 transition"
                >
                  <FiRefreshCw className="w-3.5 h-3.5" />
                  Request Re-upload
                </button>
                <button
                  onClick={() => {
                    setShowActions(false);
                    handleDelete(doc.key);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 transition border-t border-gray-100"
                >
                  <FiTrash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            )}
          </div>
          )}
        </div>

        {/* Re-upload option for rejected/reupload_requested documents */}
        {(status === "rejected" || status === "reupload_requested") && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <label className="cursor-pointer">
              <div className="flex items-center justify-center gap-2 py-2 px-4 border border-dashed border-blue-300 rounded-lg bg-blue-50 text-blue-600 text-sm font-medium hover:bg-blue-100 transition">
                <FiUpload className="w-4 h-4" />
                Upload New Document
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
          </div>
        )}
      </div>
    );
  };

  /* -------------------- Section Component -------------------- */
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

  /* -------------------- Action Modal -------------------- */
  const renderActionModal = () => {
    if (!actionModal.isOpen) return null;

    const { action, docKey } = actionModal;
    const docName = allDocuments.find(d => d.key === docKey)?.name || "Document";

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

    const config = configs[action!];

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{config.title}</h3>
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
              onClick={submitAction}
              className={`flex-1 py-2 px-4 text-white rounded-lg font-medium transition ${config.buttonColor}`}
            >
              {config.buttonText}
            </button>
            <button
              type="button"
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

  /* -------------------- Main UI -------------------- */
  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-center" />
      {renderActionModal()}

      <div className="p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-start justify-between mb-2">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Uploaded Documents</h1>
              <p className="text-sm text-gray-500 mt-1">
                ID documents, certificates, and portfolio items
              </p>
            </div>
            <StatusBadge status={overallStatus as DocumentStatus} />
          </div>

          {/* Progress indicator */}
          <div className="mb-8">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>
                {approvedCount} of {totalRequired} required documents approved
              </span>
              {uploadedCount > requiredUploaded && (
                <span className="text-gray-400">
                  (+{uploadedCount - requiredUploaded} optional)
                </span>
              )}
            </div>
            <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  overallStatus === "approved" ? "bg-green-500" : "bg-amber-500"
                }`}
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
          </div>

          {/* Document Sections */}
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

          {/* Empty state */}
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

          {/* Verify User Button - Show only for admins when ALL required documents are approved */}
          {isAdmin && allDocuments.length > 0 && (
            <div className="mt-8 border-t pt-6">
              {approvedCount >= totalRequired ? (
                // All documents approved - show verify button
                !userData?.adminApproved ? (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-green-800">
                          All Documents Approved
                        </h3>
                        <p className="text-sm text-green-600 mt-1">
                          All required documents have been verified. You can now verify this user's profile.
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setIsVerifying(true);
                          updateUserInLocalStorage(userData.id, {
                            adminApproved: true,
                            approved: true,
                            status: "VERIFIED",
                          });
                          Object.assign(userData, {
                            adminApproved: true,
                            approved: true,
                            status: "VERIFIED",
                          });
                          toast.success("User profile has been verified successfully!");
                          setIsVerifying(false);
                        }}
                        disabled={isVerifying}
                        className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {isVerifying ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Verifying...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-5 h-5" />
                            Verify User
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-8 h-8 text-green-600" />
                      <div>
                        <h3 className="text-lg font-semibold text-green-800">
                          User Verified
                        </h3>
                        <p className="text-sm text-green-600">
                          This user's profile has been verified.
                        </p>
                      </div>
                    </div>
                  </div>
                )
              ) : (
                // Not all documents approved - show status
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                  <div className="flex items-center gap-3">
                    <Clock className="w-8 h-8 text-amber-600" />
                    <div>
                      <h3 className="text-lg font-semibold text-amber-800">
                        Documents Pending Review
                      </h3>
                      <p className="text-sm text-amber-600">
                        {totalRequired - approvedCount} of {totalRequired} required documents still need to be approved before the user can be verified.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Status indicator for non-admin users */}
          {!isAdmin && allDocuments.length > 0 && (
            <div className="mt-8 border-t pt-6">
              {userData?.adminApproved ? (
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
                        {approvedCount} of {totalRequired} required documents have been approved. Please ensure all documents are uploaded for verification.
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
