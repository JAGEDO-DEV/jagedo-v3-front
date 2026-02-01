import { Download, FileText, Upload } from "lucide-react";
import { useGlobalContext } from "@/context/GlobalProvider";
import { MOCK_UPLOADS } from "@/pages/mockUploads";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

const DocumentRow = ({ label, url, onReplace }) => {
  const fileName = url?.split("/").pop();

  return (
    <div className="space-y-2 mb-4">
      <label className="block text-sm font-medium">{label}</label>

      {url ? (
        <div className="p-3 bg-white border border-gray-300 rounded-lg shadow-sm text-sm flex justify-between items-center">
          <div className="flex items-center gap-2">
            <FileText size={18} />
            <span className="truncate max-w-xs">{fileName}</span>
          </div>

          <div className="flex items-center gap-3">
            <a href={url} target="_blank" rel="noopener noreferrer">
              <Download size={18} />
            </a>
            <label className="cursor-pointer text-green-600">
              <Upload size={18} />
              <input type="file" hidden onChange={e => onReplace(e.target.files[0])} />
            </label>
          </div>
        </div>
      ) : (
        <label className="flex items-center gap-3 p-3 bg-gray-100 border rounded-lg cursor-pointer">
          <Upload size={18} />
          Upload document
          <input type="file" hidden onChange={e => onReplace(e.target.files[0])} />
        </label>
      )}
    </div>
  );
};

const AccountUploads = () => {
  const { user } = useGlobalContext();
  const userType = user?.userType?.toLowerCase();

  /* ---------------- NON-CONTRACTORS ---------------- */
  if (userType !== "contractor") {
    const [documents, setDocuments] = useState({});

    useEffect(() => {
      setDocuments(
        JSON.parse(localStorage.getItem(`docs-${userType}`)) ||
        MOCK_UPLOADS[userType] ||
        {}
      );
    }, [userType]);

    const replaceDocument = (file, key) => {
      const url = URL.createObjectURL(file);
      const updated = { ...documents, [key]: url };
      setDocuments(updated);
      localStorage.setItem(`docs-${userType}`, JSON.stringify(updated));
      
      // ✅ NEW: Also save to the expected storage key for completion tracking
      localStorage.setItem(`uploads_demo_${user?.id}`, JSON.stringify(updated));
      
      // ✅ DON'T trigger status update here - wait for Save button click
    };

    const handleSaveDocuments = () => {
      // Save documents to localStorage
      localStorage.setItem(`docs-${userType}`, JSON.stringify(documents));
      localStorage.setItem(`uploads_demo_${user?.id}`, JSON.stringify(documents));
      
      // Trigger completion status update
      window.dispatchEvent(new Event('storage'));
      
      toast.success('Uploads saved successfully');
    };

    const defaultFields = {
      customer: [
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
      <div className="w-full max-w-4xl bg-white rounded-xl shadow-md p-8">
        <h2 className="text-2xl font-bold mb-6">Documents</h2>
        {fields.map(f => (
          <DocumentRow
            key={f.key}
            label={f.label}
            url={documents[f.key]}
            onReplace={file => replaceDocument(file, f.key)}
          />
        ))}
        <div className="flex justify-end mt-8">
          <button
            onClick={handleSaveDocuments}
            className="bg-blue-800 text-white px-8 py-3 rounded-md hover:bg-blue-900 transition font-semibold"
          >
            Save
          </button>
        </div>
      </div>
    );
  }

  /* ---------------- CONTRACTORS ONLY ---------------- */

  const [documents, setDocuments] = useState({});
  const [categoryDocs, setCategoryDocs] = useState({});
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    setDocuments(
      JSON.parse(localStorage.getItem(`docs-contractor`) || "{}")
    );
    setCategories(
      JSON.parse(localStorage.getItem("contractor-categories") || "[]")
    );
    setCategoryDocs(
      JSON.parse(localStorage.getItem("contractor-category-docs") || "{}")
    );
  }, []);

  const replaceDocument = (file, key) => {
    const url = URL.createObjectURL(file);
    const updated = { ...documents, [key]: url };
    setDocuments(updated);
    localStorage.setItem("docs-contractor", JSON.stringify(updated));
    
    // ✅ NEW: Also save to the expected storage key for completion tracking
    localStorage.setItem(`uploads_demo_${user?.id}`, JSON.stringify(updated));
    
    // ✅ DON'T trigger status update here - wait for Save button click
  };

  const replaceCategoryDoc = (category, type, file) => {
    const url = URL.createObjectURL(file);
    const updated = {
      ...categoryDocs,
      [category]: {
        ...categoryDocs[category],
        [type]: url
      }
    };
    setCategoryDocs(updated);
    localStorage.setItem("contractor-category-docs", JSON.stringify(updated));
    
    // ✅ NEW: Also save to the expected storage key for completion tracking
    localStorage.setItem(`uploads_demo_${user?.id}`, JSON.stringify(updated));
    
    // ✅ DON'T trigger status update here - wait for Save button click
  };

  const handleSaveDocuments = () => {
    // Save all documents to localStorage
    localStorage.setItem("docs-contractor", JSON.stringify(documents));
    localStorage.setItem("contractor-category-docs", JSON.stringify(categoryDocs));
    localStorage.setItem(`uploads_demo_${user?.id}`, JSON.stringify({
      ...documents,
      ...categoryDocs
    }));
    
    // Trigger completion status update
    window.dispatchEvent(new Event('storage'));
    
    toast.success('Uploads saved successfully');
  };

  const generalFields = [
    { label: "Business Registration", key: "businessRegistration" },
    { label: "Business Permit", key: "businessPermit" },
    { label: "KRA PIN", key: "kraPIN" },
    { label: "Company Profile", key: "companyProfile" },
  ];

  return (
    <div className="w-full max-w-4xl bg-white rounded-xl shadow-md p-8">
      <h2 className="text-2xl font-bold mb-6">Contractor Documents</h2>

      {/* Section 1 */}
      <h3 className="text-lg font-semibold mb-4">Company Documents</h3>
      {generalFields.map(f => (
        <DocumentRow
          key={f.key}
          label={f.label}
          url={documents[f.key]}
          onReplace={file => replaceDocument(file, f.key)}
        />
      ))}

      {/* Section 2 */}
      <h3 className="text-lg font-semibold mt-10 mb-4">
        Category Licences & Certificates
      </h3>

      {categories.length === 0 && (
        <p className="text-sm text-gray-500">
          Add categories in Experience section to unlock uploads.
        </p>
      )}

      {categories.map(cat => (
        <div key={cat} className="border rounded-lg p-5 mb-6 bg-gray-50">
          <h4 className="font-semibold mb-4">{cat}</h4>

          <DocumentRow
            label={`${cat} Certificate`}
            url={categoryDocs?.[cat]?.certificate}
            onReplace={file =>
              replaceCategoryDoc(cat, "certificate", file)
            }
          />

          <DocumentRow
            label={`${cat} Practice License`}
            url={categoryDocs?.[cat]?.license}
            onReplace={file =>
              replaceCategoryDoc(cat, "license", file)
            }
          />
        </div>
      ))}

      <div className="flex justify-end mt-8">
        <button
          onClick={handleSaveDocuments}
          className="bg-blue-800 text-white px-8 py-3 rounded-md hover:bg-blue-900 transition font-semibold"
        >
          Save
        </button>
      </div>
    </div>
  );
};

export default AccountUploads;
