/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import toast from 'react-hot-toast';
import {
  PlusIcon,
  TrashIcon,
  XMarkIcon,
  EyeIcon
} from "@heroicons/react/24/outline";
import useAxiosWithAuth from "@/utils/axiosInterceptor";
import { updateContractorExperience } from "@/api/experience.api";
import { uploadFile } from "@/utils/fileUpload";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";

interface ContractorCategory {
  id: string;
  category: string;
  specialization: string;
  categoryClass: string;
  yearsOfExperience: string;
  certificate?: string;
  license?: string;
}

interface ContractorProject {
  id: string;
  categoryId?: string;
  projectName: string;
  // We store either the File object (new upload) or the URL string (existing)
  projectFile: File | string | null;
  referenceLetterFile: File | string | null;
}

const CATEGORIES = [
  "Building Works",
  "Electrical Works",
  "Mechanical Works",
  "Road Works",
  "Water Works",
];

const SPECIALIZATIONS: { [key: string]: string[] } = {
  "Building Works": [
    "Residential Buildings",
    "Commercial Buildings",
    "Industrial Buildings",
    "Renovation & Refurbishment",
  ],
  "Electrical Works": [
    "Power Distribution",
    "Wiring & Installation",
    "Solar Systems",
    "Industrial Electrical",
  ],
  "Mechanical Works": [
    "HVAC Systems",
    "Refrigeration",
    "Industrial Machinery",
  ],
  "Road Works": [
    "Asphalt Paving",
    "Concrete Roads",
    "Road Drainage",
    "Traffic Safety",
  ],
  "Water Works": [
    "Water Supply Systems",
    "Sewerage Systems",
    "Water Treatment",
    "Pipe Installation",
  ],
};

const NCA_CLASSES = ["NCA 1", "NCA 2", "NCA 3", "NCA 4", "NCA 5"];
const YEARS_OF_EXPERIENCE = ["10+ years", "5-10 years", "3-5 years", "1-3 years"];

const SLUG_MAP: { [key: string]: string } = {
  "building-works": "Building Works",
  "electrical-works": "Electrical Works",
  "mechanical-works": "Mechanical Works",
  "road-works": "Road Works",
  "water-works": "Water Works",
};

const ContractorExperience = ({ data, refreshData }: any) => {
  const [categories, setCategories] = useState<ContractorCategory[]>([]);
  const [projects, setProjects] = useState<ContractorProject[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const axiosInstance = useAxiosWithAuth(import.meta.env.VITE_SERVER_URL);

  const isReadOnly = !['PENDING', 'RESUBMIT', 'INCOMPLETE'].includes(data?.experienceStatus);

  /* ---------- LOAD FROM PROP ---------- */
  useEffect(() => {
    if (data) {
      const up = data;

      const exps = up.contractorExperiences || [];
      const contractorTypes = up.contractorTypes || ""; // comma separated slugs

      if (exps.length > 0) {
        setCategories(exps.map((exp: any) => ({
          id: exp.id || crypto.randomUUID(),
          category: exp.category || "",
          specialization: exp.specialization || "",
          categoryClass: (exp.categoryClass || exp.class || "").replace(/\s+/g, ""),
          yearsOfExperience: exp.yearsOfExperience || exp.years || "",
          certificate: exp.certificate || "",
          license: exp.license || "",
        })));
      } else if (contractorTypes) {
        const slugs = contractorTypes.split(',').map((s: string) => s.trim());
        const prePopulated = slugs
          .map(slug => SLUG_MAP[slug])
          .filter(Boolean)
          .map(name => ({
            id: crypto.randomUUID(),
            category: name,
            specialization: "",
            categoryClass: "",
            yearsOfExperience: "",
          }));

        if (prePopulated.length > 0) {
          setCategories(prePopulated);
          // Also pre-populate projects for these categories
          const prePopProjects = prePopulated.map(cat => ({
            id: crypto.randomUUID(),
            categoryId: cat.id,
            projectName: `${cat.category} Project`,
            projectFile: null,
            referenceLetterFile: null,
          }));
          setProjects(prePopProjects);
        } else {
          setCategories([{ id: crypto.randomUUID(), category: "", specialization: "", categoryClass: "", yearsOfExperience: "" }]);
        }
      } else {
        setCategories([{ id: crypto.randomUUID(), category: "", specialization: "", categoryClass: "", yearsOfExperience: "" }]);
      }

      const projs = up.contractorProjects || [];
      if (projs.length > 0) {
        setProjects(projs.map((proj: any) => ({
          id: proj.id || crypto.randomUUID(),
          categoryId: proj.categoryId,
          projectName: proj.projectName || "",
          projectFile: proj.projectFile || null,
          referenceLetterFile: proj.referenceLetterUrl || null,
        })));
      }
      setIsLoadingProfile(false);
    }
  }, [data]);

  const handleCategoryChange = (id: string, value: string) => {
    if (categories.some(c => c.category === value && c.id !== id)) {
      toast.error("You cannot select the same category twice.");
      return;
    }

    setCategories(prev =>
      prev.map(cat =>
        cat.id === id ? { ...cat, category: value } : cat
      )
    );

    // Auto create linked project
    if (!projects.find(p => p.categoryId === id)) {
      setProjects(prev => [
        ...prev,
        {
          id: crypto.randomUUID(),
          categoryId: id,
          projectName: value ? `${value} Project` : "",
          projectFile: null,
          referenceLetterFile: null,
        },
      ]);
    }
  };

  const addCategoryRow = () => {
    const id = crypto.randomUUID();
    setCategories(prev => [
      ...prev,
      {
        id,
        category: "",
        specialization: "",
        categoryClass: "",
        yearsOfExperience: "",
      },
    ]);
  };

  const removeCategoryRow = (id: string) => {
    if (categories.length <= 1) return toast.error("You must have at least one category.");
    setCategories(prev => prev.filter(cat => cat.id !== id));
    setProjects(prev => prev.filter(p => p.categoryId !== id));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isReadOnly) return toast.error("Your approved profile cannot be modified.");

    // Validation
    if (categories.some(c => !c.category || !c.categoryClass || !c.yearsOfExperience)) {
      return toast.error("Please fill in all required fields for categories.");
    }

    if (projects.some(p => !p.projectName)) {
      return toast.error("Please ensure all projects have names.");
    }

    setIsSubmitting(true);
    const toastId = toast.loading("Uploading files and saving...");

    try {
      // 1. Upload files for projects
      const uploadedProjects = await Promise.all(
        projects.map(async (proj) => {
          let projectFileUrl = "";
          let referenceLetterUrl = "";

          // Handle Project File
          if (proj.projectFile instanceof File) {
            const uploaded = await uploadFile(proj.projectFile);
            projectFileUrl = uploaded.url;
          } else if (typeof proj.projectFile === "string") {
            projectFileUrl = proj.projectFile;
          }

          // Handle Reference Letter
          if (proj.referenceLetterFile instanceof File) {
            const uploaded = await uploadFile(proj.referenceLetterFile);
            referenceLetterUrl = uploaded.url;
          } else if (typeof proj.referenceLetterFile === "string") {
            referenceLetterUrl = proj.referenceLetterFile;
          }

          return {
            projectName: proj.projectName,
            projectFile: projectFileUrl,
            referenceLetterUrl: referenceLetterUrl // Changed from referenceLetterFile to match backend DTO
          };
        })
      );

      // 2. Prepare Payload
      const payload = {
        categories: categories.map(c => ({
          category: c.category,
          specialization: c.specialization,
          categoryClass: c.categoryClass,
          yearsOfExperience: c.yearsOfExperience,
          certificate: c.certificate || null,
          license: c.license || null
        })),
        projects: uploadedProjects
      };

      // 3. Send to API
      await updateContractorExperience(axiosInstance, payload);

      toast.success("Experience updated successfully!", { id: toastId });
      if (refreshData) refreshData();
      setSubmitted(true);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to update experience.", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const fileInputStyles = "w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 transition-colors cursor-pointer";

  const renderFileState = (file: File | string | null, onRemove: () => void, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void) => {
    if (file) {
      const isUrl = typeof file === 'string';
      const fileName = isUrl ? (file.split('/').pop()?.split('?')[0] || 'View File') : file.name;
      return (
        <div className="flex items-center justify-between gap-2 bg-gray-100 p-2 rounded-md">
          <div className="flex-1 min-w-0">
            <span className="block truncate text-gray-700 text-xs" title={fileName}>{fileName}</span>
          </div>
          <div className="flex items-center gap-2">
            {isUrl && <a href={file} target="_blank" rel="noopener noreferrer" className="text-blue-600"><EyeIcon className="w-5 h-5" /></a>}
            {!isReadOnly && <button type="button" onClick={onRemove}><XMarkIcon className="w-5 h-5 text-red-500 hover:text-red-700" /></button>}
          </div>
        </div>
      );
    }
    if (isReadOnly) return <span className="text-xs text-gray-500 p-2">No file provided.</span>;
    return <input type="file" onChange={onChange} className={fileInputStyles} />;
  };

  if (isLoadingProfile && !data) return <div className="p-8 text-center text-gray-600">Loading contractor profile...</div>;

  return (
    <div className="bg-gray-50 min-h-screen w-full p-2 sm:p-4 md:p-8">
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-lg p-4 md:p-8">
        {!submitted ? (
          <form className="space-y-8" onSubmit={handleSubmit}>
            <h1 className="text-2xl md:text-3xl font-bold mb-6 text-gray-800">Contractor Experience</h1>

            {data?.experienceStatusReason && (
              <Alert variant="destructive" className="mb-6">
                <InfoIcon className="h-4 w-4" />
                <AlertTitle>Status Update</AlertTitle>
                <AlertDescription>
                  {data.experienceStatusReason}
                </AlertDescription>
              </Alert>
            )}

            {isReadOnly && (
              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg text-sm">
                Your experience details have been submitted and are under review. Contact support to request changes.
              </div>
            )}

            {/* Categories */}
            <div>
              <h2 className="font-semibold mb-4 text-gray-700">Trade Categories</h2>
              <div className="space-y-3">
                {categories.map(cat => (
                  <div key={cat.id} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center bg-white p-3 md:p-0 rounded-lg border md:border-0">
                    <select
                      value={cat.category}
                      onChange={e => handleCategoryChange(cat.id, e.target.value)}
                      disabled={isReadOnly}
                      className="w-full p-2 border rounded-md text-sm outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">Select Category</option>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>

                    <select
                      value={cat.specialization}
                      onChange={e =>
                        setCategories(prev =>
                          prev.map(x => x.id === cat.id ? { ...x, specialization: e.target.value } : x)
                        )
                      }
                      className="w-full p-2 border rounded-md text-sm outline-none focus:ring-1 focus:ring-blue-500"
                      disabled={isReadOnly}
                    >
                      <option value="">Specialization</option>
                      {(SPECIALIZATIONS[cat.category] || []).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>

                    <select
                      value={cat.categoryClass}
                      onChange={e =>
                        setCategories(prev =>
                          prev.map(x => x.id === cat.id ? { ...x, categoryClass: e.target.value } : x)
                        )
                      }
                      disabled={isReadOnly}
                      className="w-full p-2 border rounded-md text-sm outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">Class</option>
                      {Array.from(new Set([...NCA_CLASSES, cat.categoryClass].filter(Boolean))).map(c => <option key={c as string} value={c as string}>{c as string}</option>)}
                    </select>

                    <select
                      value={cat.yearsOfExperience}
                      onChange={e =>
                        setCategories(prev =>
                          prev.map(x => x.id === cat.id ? { ...x, yearsOfExperience: e.target.value } : x)
                        )
                      }
                      disabled={isReadOnly}
                      className="w-full p-2 border rounded-md text-sm outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">Years</option>
                      {Array.from(new Set([...YEARS_OF_EXPERIENCE, cat.yearsOfExperience].filter(Boolean))).map(y => <option key={y as string} value={y as string}>{y as string}</option>)}
                    </select>

                    <div className="flex justify-end pr-2">
                      {!isReadOnly && (
                        <button type="button" onClick={() => removeCategoryRow(cat.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors">
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {!isReadOnly && (
                <button type="button" onClick={addCategoryRow} className="mt-4 flex items-center gap-1 text-blue-700 text-sm font-semibold hover:text-blue-800 transition-colors">
                  <PlusIcon className="w-4 h-4" /> Add Category
                </button>
              )}
            </div>

            {/* Projects */}
            {projects.length > 0 && (
              <div>
                <h2 className="font-semibold mb-4 text-gray-700">Projects (Auto per Category)</h2>
                <div className="space-y-4">
                  {projects.map(proj => (
                    <div key={proj.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Project Name</label>
                        <input value={proj.projectName} disabled className="w-full p-2 border rounded-md bg-white text-sm font-medium text-gray-700 shadow-sm" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Project / BQ File</label>
                        {renderFileState(
                          proj.projectFile,
                          () => setProjects(p => p.map(x => x.id === proj.id ? { ...x, projectFile: null } : x)),
                          e => setProjects(p => p.map(x => x.id === proj.id ? { ...x, projectFile: e.target.files?.[0] || null } : x))
                        )}
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Completion Letter</label>
                        {renderFileState(
                          proj.referenceLetterFile,
                          () => setProjects(p => p.map(x => x.id === proj.id ? { ...x, referenceLetterFile: null } : x)),
                          e => setProjects(p => p.map(x => x.id === proj.id ? { ...x, referenceLetterFile: e.target.files?.[0] || null } : x))
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!isReadOnly && (
              <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto bg-blue-800 text-white px-10 py-3 rounded-lg hover:bg-blue-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-bold shadow-md shadow-blue-100 flex items-center justify-center gap-2"
                >
                  {isSubmitting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                  {isSubmitting ? "Submitting..." : "Submit Experience"}
                </button>
              </div>
            )}
          </form>
        ) : (
          <div className="text-center py-12 px-6 bg-green-50 rounded-2xl border border-green-100">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <PlusIcon className="w-8 h-8 rotate-45" />
              <span className="text-3xl">✓</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-green-800">Submission Successful!</h2>
            <p className="mt-4 text-gray-600 max-w-md mx-auto">Thank you for submitting your contractor experience. Your profile will be reviewed by our team shortly.</p>
            <button
              onClick={() => setSubmitted(false)}
              className="mt-8 text-green-700 font-bold hover:underline"
            >
              Back to Experience
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContractorExperience;