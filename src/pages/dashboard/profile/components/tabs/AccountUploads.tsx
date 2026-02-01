/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { FiDownload, FiUpload, FiTrash2 } from "react-icons/fi";
import { UploadCloud } from "lucide-react";
import { toast, Toaster } from "sonner";
import { getMockUploadsForUserType } from "@/pages/data/mockUploads";

const STORAGE_KEY = "uploads_demo";

// Statuses that should prefill/show existing data
const PREFILL_STATUSES = ["COMPLETED", "VERIFIED", "PENDING", "RETURNED"];

const AccountUploads = ({ userData }: { userData: any }) => {
  const [documents, setDocuments] = useState<any>({});
  const [uploadingFiles, setUploadingFiles] = useState<any>({});

  const userType = userData?.userType?.toLowerCase() || "";
  const accountType = userData?.accountType?.toLowerCase() || "";
  const isContractor = userType === "contractor";
  const status = userData?.status;

  /* -------------------- Load documents based on status -------------------- */
  useEffect(() => {
    if (!userData) return;
    
    // Only prefill documents if status allows prefilling
    if (PREFILL_STATUSES.includes(status)) {
      // First check localStorage for any user-modified documents
      const saved = localStorage.getItem(`${STORAGE_KEY}_${userData.id}`);
      if (saved) {
        const savedDocs = JSON.parse(saved);
        // If there are saved documents, use them
        if (Object.keys(savedDocs).length > 0) {
          setDocuments(savedDocs);
          return;
        }
      }

      // Otherwise, prefill with mock data
      const mockUploads = getMockUploadsForUserType(userType, accountType);
      const prefilledDocs: any = {};

      Object.entries(mockUploads).forEach(([key, url]) => {
        prefilledDocs[key] = {
          name: `${key}.pdf`,
          url: url,
          type: key,
        };
      });

      setDocuments(prefilledDocs);
    } else {
      // For SIGNED_UP or INCOMPLETE, start with empty documents
      setDocuments({});
    }
  }, [userData?.id, status, userType, accountType]);

  /* -------------------- Save to localStorage -------------------- */
  useEffect(() => {
    if (!userData) return;
    // Only save if there are documents to save
    if (Object.keys(documents).length > 0) {
      localStorage.setItem(
        `${STORAGE_KEY}_${userData.id}`,
        JSON.stringify(documents)
      );
    }
  }, [documents, userData?.id]);

  if (!userData) return <div className="p-8">Loading...</div>;

  /* -------------------- Required docs -------------------- */
  const getRequiredDocuments = () => {
    if (accountType === "individual" && userType === "customer") {
      return [
        { key: "idFront", name: "ID Front" },
        { key: "idBack", name: "ID Back" },
        { key: "kraPIN", name: "KRA PIN" },
      ];
    }

    const map: any = {
      customer: [
        { key: "businessPermit", name: "Business Permit" },
        { key: "certificateOfIncorporation", name: "Certificate of Incorporation" },
        { key: "kraPIN", name: "KRA PIN" },
      ],
      fundi: [
        { key: "idFront", name: "ID Front" },
        { key: "idBack", name: "ID Back" },
        { key: "certificate", name: "Certificate" },
        { key: "kraPIN", name: "KRA PIN" },
      ],
      professional: [
        { key: "idFront", name: "ID Front" },
        { key: "idBack", name: "ID Back" },
        { key: "academicCertificate", name: "Academic Certificate" },
        { key: "cv", name: "CV" },
        { key: "kraPIN", name: "KRA PIN" },
        { key: "practiceLicense", name: "Practice License" },
      ],
      contractor: [
        { key: "businessRegistration", name: "Business Registration" },
        { key: "businessPermit", name: "Business Permit" },
        { key: "kraPIN", name: "KRA PIN" },
        { key: "companyProfile", name: "Company Profile" },
      ],
      hardware: [
        { key: "certificateOfIncorporation", name: "Certificate of Incorporation" },
        { key: "kraPIN", name: "KRA PIN" },
        { key: "singleBusinessPermit", name: "Single Business Permit" },
        { key: "companyProfile", name: "Company Profile" },
      ],
    };

    return map[userType] || [];
  };

  const requiredDocuments = getRequiredDocuments();

  /* Contractor extra docs */
  const contractorProfessionalDocs = [
    { key: "contractorPracticeLicense", name: "Practice License" },
    { key: "contractorCertificate", name: "Professional Certificate" },
  ];

  const missingDocuments = requiredDocuments.filter(
    (doc: any) => !documents[doc.key]
  );

  const missingContractorDocs = contractorProfessionalDocs.filter(
    (doc) => !documents[doc.key]
  );

  /* -------------------- Upload -------------------- */
  const handleUpload = (file: File, key: string) => {
    setUploadingFiles((p: any) => ({ ...p, [key]: true }));

    setTimeout(() => {
      const url = URL.createObjectURL(file);

      setDocuments((prev: any) => ({
        ...prev,
        [key]: {
          name: file.name,
          url,
          type: key,
        },
      }));

      toast.success(`${file.name} uploaded`);
      setUploadingFiles((p: any) => ({ ...p, [key]: false }));
    }, 500);
  };

  /* -------------------- Replace -------------------- */
  const handleReplace = (
    e: React.ChangeEvent<HTMLInputElement>,
    key: string
  ) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file, key);
  };

  /* -------------------- Delete -------------------- */
  const handleDelete = (key: string) => {
    const updated = { ...documents };
    delete updated[key];
    setDocuments(updated);
    toast.success("Document deleted");
  };

  /* -------------------- Reusable Upload UI -------------------- */
  const UploadSection = ({ title, missingDocs }: any) => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">{title}</h3>

      {missingDocs.map((doc: any) => (
        <div
          key={doc.key}
          className="border-2 border-dashed border-blue-300 rounded-lg p-6 bg-blue-50 flex justify-between items-center"
        >
          <div>
            <p className="font-semibold text-blue-800">{doc.name}</p>
            <p className="text-sm text-gray-600">Not uploaded yet</p>
          </div>

          {uploadingFiles[doc.key] ? (
            <span className="text-blue-600">Uploading...</span>
          ) : (
            <label className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
              <UploadCloud className="w-4 h-4" />
              Upload
              <input
                type="file"
                className="hidden"
                onChange={(e) =>
                  handleUpload(e.target.files![0], doc.key)
                }
              />
            </label>
          )}
        </div>
      ))}
    </div>
  );

  /* -------------------- UI -------------------- */
  return (
    <div className="flex min-h-screen bg-white">
      <Toaster position="top-center" />

      <div className="flex-grow p-8">
        <div className="max-w-3xl mx-auto bg-white rounded-xl">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            Uploaded Documents
          </h2>

          {/* Uploaded */}
          {Object.keys(documents).length > 0 && (
            <div className="space-y-4 mb-8">
              {Object.entries(documents).map(([key, doc]: any) => (
                <div
                  key={key}
                  className="flex justify-between items-center bg-gray-100 px-6 py-4 rounded-lg border"
                >
                  <div>
                    <p className="font-semibold text-blue-800">
                      {doc.type}
                    </p>
                    <p className="text-sm text-gray-500">{doc.name}</p>
                  </div>

                  <div className="flex gap-3">
                    <a href={doc.url} download target="_blank">
                      <FiDownload className="w-5 h-5 text-blue-700" />
                    </a>

                    <button onClick={() => handleDelete(key)}>
                      <FiTrash2 className="w-5 h-5 text-red-600" />
                    </button>

                    <label className="cursor-pointer">
                      <FiUpload className="w-5 h-5 text-green-600" />
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) => handleReplace(e, key)}
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Main Required Docs */}
          {missingDocuments.length > 0 && (
            <UploadSection
              title="Required Documents"
              missingDocs={missingDocuments}
            />
          )}

          {/* Contractor Only Section */}
          {isContractor && missingContractorDocs.length > 0 && (
            <div className="mt-10">
              <UploadSection
                title="Contractor Professional Documents"
                missingDocs={missingContractorDocs}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountUploads;
