import { Download, FileText } from "lucide-react";
import { useGlobalContext } from "@/context/GlobalProvider";
import { MOCK_UPLOADS } from "@/pages/mockUploads";

const DocumentRow = ({ label, url }) => {
  const fileName = url?.split("/").pop();

  return (
    <div className="space-y-2 mb-4">
      <label className="block text-sm font-medium">{label}</label>
      {url ? (
        <div className="p-3 bg-white border border-gray-300 rounded-lg shadow-sm text-sm text-gray-700 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-gray-500" />
            <span className="truncate max-w-xs">{fileName}</span>
          </div>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800"
          >
            <Download size={18} />
          </a>
        </div>
      ) : (
        <div className="p-3 bg-gray-100 border border-gray-300 rounded-lg text-sm text-gray-500">
          Document not provided
        </div>
      )}
    </div>
  );
};

const AccountUploads = () => {
  const { user } = useGlobalContext();
  const userType = user?.userType?.toLowerCase();
  const isIndividualCustomer =
    user?.accountType?.toLowerCase() === "individual" &&
    userType === "customer";

  const getFields = () => {
    if (isIndividualCustomer) {
      return [
        { label: "ID Front", key: "idFrontUrl" },
        { label: "ID Back", key: "idBackUrl" },
        { label: "KRA PIN", key: "kraPIN" },
      ];
    }

    const map = {
      customer: [
        { label: "Business Permit", key: "businessPermit" },
        { label: "Certificate of Incorporation", key: "certificateOfIncorporation" },
        { label: "KRA PIN", key: "kraPIN" },
      ],
      contractor: [
        { label: "Business Registration", key: "businessRegistration" },
        { label: "Business Permit", key: "businessPermit" },
        { label: "KRA PIN", key: "kraPIN" },
        { label: "Company Profile", key: "companyProfile" },
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
        { label: "KRA PIN", key: "kraPIN" },
        { label: "Practice License", key: "practiceLicense" },
      ],
      hardware: [
        { label: "Business Registration", key: "businessRegistration" },
        { label: "KRA PIN", key: "kraPIN" },
        { label: "Single Business Permit", key: "singleBusinessPermit" },
        { label: "Company Profile", key: "companyProfile" },
      ],
    };

    return map[userType] || [];
  };

  const documents = MOCK_UPLOADS[userType] || {};
  const fields = getFields();

  const getTitle = () => {
    if (isIndividualCustomer) return "Individual Customer Documents";
    return userType
      ? `${userType.charAt(0).toUpperCase() + userType.slice(1)} Documents`
      : "Documents";
  };

  return (
    <div className="w-full max-w-4xl bg-white rounded-xl shadow-md p-8">
      <h2 className="text-2xl font-bold mb-2">{getTitle()}</h2>
      <p className="text-gray-600 mb-6">
        These are your submitted documents (read-only).
      </p>

      {fields.map((field) => (
        <DocumentRow
          key={field.key}
          label={field.label}
          url={documents[field.key]}
        />
      ))}
    </div>
  );
};

export default AccountUploads;
