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
import { getProviderProfile } from "@/api/provider.api";
import { uploadFile } from "@/utils/fileUpload";
import { useGlobalContext } from "@/context/GlobalProvider";

type FileOrUrl = File | string | null;

interface ContractorCategory {
  id: string;
  category: string;
  categoryClass: string;
  yearsOfExperience: string;
  certificateFile: FileOrUrl;
  licenseFile: FileOrUrl;
  isEditing: boolean;
}

interface ContractorProject {
  id: string;
  projectName: string;
  projectFile: FileOrUrl;
  referenceLetterFile: FileOrUrl;
}

const ContractorExperience = () => {
  const { user } = useGlobalContext();
  const axiosInstance = useAxiosWithAuth(import.meta.env.VITE_SERVER_URL);

  const [categories, setCategories] = useState<ContractorCategory[]>([]);
  const [projects, setProjects] = useState<ContractorProject[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  const isReadOnly = user?.adminApproved === true;

  // Prefilled contractor info (example data)
  const prefilledCategories: ContractorCategory[] = [
    {
      id: "1",
      category: "Building Works",
      categoryClass: "NCA 3",
      yearsOfExperience: "5-10 years",
      certificateFile: "https://example.com/certificate_building.pdf",
      licenseFile: "https://example.com/license_building.pdf",
      isEditing: false,
    },
    {
      id: "2",
      category: "Electrical Works",
      categoryClass: "NCA 2",
      yearsOfExperience: "3-5 years",
      certificateFile: "https://example.com/certificate_electrical.pdf",
      licenseFile: "https://example.com/license_electrical.pdf",
      isEditing: false,
    }
  ];

  const prefilledProjects: ContractorProject[] = [
    {
      id: "1",
      projectName: "Central Mall Renovation",
      projectFile: "https://example.com/project_file_mall.pdf",
      referenceLetterFile: "https://example.com/reference_letter_mall.pdf",
    },
    {
      id: "2",
      projectName: "River Bridge Construction",
      projectFile: "https://example.com/project_file_bridge.pdf",
      referenceLetterFile: "https://example.com/reference_letter_bridge.pdf",
    }
  ];

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await getProviderProfile(axiosInstance, user.id);

        if (response.success && response.data?.userProfile) {
          const profile = response.data.userProfile;

          if (profile.contractorExperiences && profile.contractorExperiences.length > 0) {
            const populatedCategories = profile.contractorExperiences.map(exp => ({
              id: Math.random().toString(),
              category: exp.category,
              categoryClass: exp.categoryClass,
              yearsOfExperience: exp.yearsOfExperience,
              certificateFile: exp.certificate,
              licenseFile: exp.license,
              isEditing: false,
            }));
            setCategories(populatedCategories);
          } else {
            setCategories(prefilledCategories);
          }

          if (profile.contractorProjects && profile.contractorProjects.length > 0) {
            const populatedProjects = profile.contractorProjects.map(proj => ({
              id: Math.random().toString(),
              projectName: proj.projectName,
              projectFile: proj.projectFile,
              referenceLetterFile: proj.referenceLetterUrl,
            }));
            setProjects(populatedProjects);
          } else {
            setProjects(prefilledProjects);
          }
        } else {
          setCategories(prefilledCategories);
          setProjects(prefilledProjects);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast.error("Failed to load contractor data.");
        setCategories(prefilledCategories);
        setProjects(prefilledProjects);
      } finally {
        setIsLoadingProfile(false);
      }
    };
    fetchProfile();
  }, [user.id]);

  const updateExperienceOnServer = async (
    currentCategories: ContractorCategory[],
    currentProjects: ContractorProject[]
  ) => {
    const contractorCategories = await Promise.all(
      currentCategories.map(async cat => ({
        category: cat.category,
        categoryClass: cat.categoryClass,
        yearsOfExperience: cat.yearsOfExperience,
        certificate: cat.certificateFile instanceof File ? (await uploadFile(cat.certificateFile)).url : cat.certificateFile || "",
        license: cat.licenseFile instanceof File ? (await uploadFile(cat.licenseFile)).url : cat.licenseFile || "",
      }))
    );

    const contractorProjects = await Promise.all(
      currentProjects.map(async proj => ({
        projectName: proj.projectName,
        projectFile: proj.projectFile instanceof File ? (await uploadFile(proj.projectFile)).url : proj.projectFile || "",
        referenceLetterUrl: proj.referenceLetterFile instanceof File ? (await uploadFile(proj.referenceLetterFile)).url : proj.referenceLetterFile || "",
      }))
    );

    await updateContractorExperience(axiosInstance, {
      categories: contractorCategories,
      projects: contractorProjects,
    });
  };

  const handleCategoryChange = (id: string, field: keyof Omit<ContractorCategory, 'certificateFile' | 'licenseFile'>, value: any) => {
    setCategories(prev => prev.map(cat => cat.id === id ? { ...cat, [field]: value } : cat));
  };

  const handleCategoryFileChange = (id: string, field: 'certificateFile' | 'licenseFile', file: File | null) => {
    if (!file) return;
    setCategories(prev => prev.map(cat => cat.id === id ? { ...cat, [field]: file } : cat));
  };

  const removeCategoryFile = async (id: string, field: 'certificateFile' | 'licenseFile') => {
    const updatedCategories = categories.map(cat => (cat.id === id ? { ...cat, [field]: null } : cat));

    try {
      await toast.promise(
        updateExperienceOnServer(updatedCategories, projects),
        {
          loading: "Deleting file...",
          success: "File deleted successfully!",
          error: (err: any) => err.response?.data?.message || "Failed to delete file."
        }
      );
      setCategories(updatedCategories);
    } catch (err) {
      console.error(err);
    }
  };

  const addCategoryRow = () => {
    setCategories(prev => [...prev, { id: Math.random().toString(), category: "", categoryClass: "", yearsOfExperience: "", certificateFile: null, licenseFile: null, isEditing: true }]);
  };

  const removeCategoryRow = (id: string) => {
    if (categories.length <= 1) return toast.error("You must have at least one category.");
    setCategories(prev => prev.filter(cat => cat.id !== id));
  };

  const handleProjectChange = (id: string, field: keyof ContractorProject, value: any) => {
    setProjects(prev => prev.map(proj => proj.id === id ? { ...proj, [field]: value } : proj));
  };

  const handleProjectFileChange = (id: string, field: 'projectFile' | 'referenceLetterFile', file: File | null) => {
    if (file) handleProjectChange(id, field, file);
  };

  const removeProjectFile = async (id: string, field: 'projectFile' | 'referenceLetterFile') => {
    const updatedProjects = projects.map(proj => proj.id === id ? { ...proj, [field]: null } : proj);
    try {
      await toast.promise(updateExperienceOnServer(categories, updatedProjects), {
        loading: "Deleting file...",
        success: "File deleted successfully!",
        error: (err: any) => err.response?.data?.message || "Failed to delete file."
      });
      setProjects(updatedProjects);
    } catch (err) {
      console.error(err);
    }
  };

  const addProjectRow = () => {
    setProjects(prev => [...prev, { id: Math.random().toString(), projectName: "", projectFile: null, referenceLetterFile: null }]);
  };

  const removeProjectRow = (id: string) => {
    if (projects.length <= 1) return toast.error("You must have at least one project.");
    setProjects(prev => prev.filter(proj => proj.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isReadOnly) return toast.error("Your approved profile cannot be modified.");

    if (categories.some(c => !c.category || !c.categoryClass || !c.yearsOfExperience) || projects.some(p => !p.projectName)) {
      return toast.error("Please fill in all required fields.");
    }

    setIsSubmitting(true);
    try {
      await toast.promise(updateExperienceOnServer(categories, projects), {
        loading: "Processing submission...",
        success: "Experience updated successfully!",
        error: (err: any) => err.response?.data?.message || "Failed to update experience."
      });
      setSubmitted(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const fileInputStyles = "w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 transition-colors cursor-pointer";
  const inputStyles = "w-full p-2 border rounded-md mt-1 md:mt-0 disabled:bg-gray-100 disabled:cursor-not-allowed";

  const renderFileState = (file: FileOrUrl, onRemove: () => void, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void) => {
    if (file) {
      const isUrl = typeof file === 'string';
      const fileName = isUrl ? new URL(file).pathname.split('/').pop() : file.name;
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

  if (isLoadingProfile) return <div className="p-8 text-center text-gray-600">Loading contractor profile...</div>;

  return (
    <div className="bg-gray-50 min-h-screen w-full p-2 sm:p-4 md:p-8">
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-lg p-4 md:p-8">
        {!submitted ? (
          <form className="space-y-8" onSubmit={handleSubmit}>
            <h1 className="text-2xl md:text-3xl font-bold mb-6 text-gray-800">Contractor Experience</h1>

            {isReadOnly && (
              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg text-sm">
                Your profile has been approved and is read-only. Contact support to request changes.
              </div>
            )}

            {/* Categories */}
            <div className="border rounded-xl p-4 bg-gray-50">
              <legend className="text-xl font-semibold mb-4 px-2 text-gray-700">Trade Categories</legend>
              <div className="overflow-x-auto">
                <table className="w-full table-fixed border-collapse">
                  <thead className="hidden md:table-header-group">
                    <tr className="bg-gray-100 text-left text-sm font-semibold text-gray-600">
                      <th className="px-3 py-3 w-[20%]">Category</th>
                      <th className="px-3 py-3 w-[15%]">Class</th>
                      <th className="px-3 py-3 w-[15%]">Years of Exp.</th>
                      <th className="px-3 py-3 w-[22%]">Certificate</th>
                      <th className="px-3 py-3 w-[22%]">License</th>
                      <th className="px-3 py-3 w-[5%] text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {categories.map(cat => (
                      <tr key={cat.id} className="block md:table-row border-b-2 md:border-b last:border-b-0 border-gray-200 md:hover:bg-gray-100 p-4 md:p-0 mb-4 md:mb-0 rounded-lg md:rounded-none bg-white md:bg-transparent shadow-md md:shadow-none relative">
                        <td className="block md:table-cell py-2 md:py-3 md:px-3 align-top">
                          <span className="font-semibold text-gray-600 md:hidden">Category: </span>
                          <input type="text" value={cat.category} onChange={e => handleCategoryChange(cat.id, 'category', e.target.value)} className={inputStyles} required disabled={isReadOnly} />
                        </td>
                        <td className="block md:table-cell py-2 md:py-3 md:px-3 align-top">
                          <span className="font-semibold text-gray-600 md:hidden">Class: </span>
                          <select value={cat.categoryClass} onChange={e => handleCategoryChange(cat.id, 'categoryClass', e.target.value)} className={inputStyles} required disabled={isReadOnly}>
                            <option value="">Select Class</option>
                            {["NCA 1","NCA 2","NCA 3","NCA 4","NCA 5","NCA 6","NCA 7","NCA 8"].map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </td>
                        <td className="block md:table-cell py-2 md:py-3 md:px-3 align-top">
                          <span className="font-semibold text-gray-600 md:hidden">Years of Exp.: </span>
                          <select value={cat.yearsOfExperience} onChange={e => handleCategoryChange(cat.id, 'yearsOfExperience', e.target.value)} className={inputStyles} required disabled={isReadOnly}>
                            <option value="">Select Years</option>
                            {["10+ years","5-10 years","3-5 years","1-3 years"].map(y => <option key={y} value={y}>{y}</option>)}
                          </select>
                        </td>
                        <td className="block md:table-cell py-2 md:py-3 md:px-3 align-top">
                          {renderFileState(cat.certificateFile, () => removeCategoryFile(cat.id, 'certificateFile'), e => handleCategoryFileChange(cat.id, 'certificateFile', e.target.files?.[0] || null))}
                        </td>
                        <td className="block md:table-cell py-2 md:py-3 md:px-3 align-top">
                          {renderFileState(cat.licenseFile, () => removeCategoryFile(cat.id, 'licenseFile'), e => handleCategoryFileChange(cat.id, 'licenseFile', e.target.files?.[0] || null))}
                        </td>
                        <td className="block md:table-cell py-2 md:py-3 md:px-3 md:text-center align-top absolute top-2 right-2 md:relative md:top-auto md:right-auto">
                          {!isReadOnly && <button type="button" onClick={() => removeCategoryRow(cat.id)} className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-100"><TrashIcon className="w-5 h-5" /></button>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!isReadOnly && <button type="button" onClick={addCategoryRow} className="mt-4 flex items-center gap-2 text-sm text-blue-700 font-semibold hover:text-blue-900"><PlusIcon className="w-5 h-5" />Add Category</button>}
              </div>
            </div>

            {/* Projects */}
            <div className="border rounded-xl p-4 bg-gray-50">
              <legend className="text-xl font-semibold mb-4 px-2 text-gray-700">Completed Projects</legend>
              <div className="overflow-x-auto">
                <table className="w-full table-fixed border-collapse">
                  <thead className="hidden md:table-header-group">
                    <tr className="bg-gray-100 text-left text-sm font-semibold text-gray-600">
                      <th className="px-3 py-3 w-[40%]">Project Name</th>
                      <th className="px-3 py-3 w-[27%]">Project File</th>
                      <th className="px-3 py-3 w-[27%]">Reference Letter</th>
                      <th className="px-3 py-3 w-[5%] text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {projects.map(proj => (
                      <tr key={proj.id} className="block md:table-row border-b-2 md:border-b last:border-b-0 border-gray-200 md:hover:bg-gray-100 p-4 md:p-0 mb-4 md:mb-0 rounded-lg md:rounded-none bg-white md:bg-transparent shadow-md md:shadow-none relative">
                        <td className="block md:table-cell py-2 md:py-3 md:px-3 align-top">
                          <span className="font-semibold text-gray-600 md:hidden">Project Name: </span>
                          <input type="text" value={proj.projectName} onChange={e => handleProjectChange(proj.id, 'projectName', e.target.value)} className={inputStyles} required disabled={isReadOnly} />
                        </td>
                        <td className="block md:table-cell py-2 md:py-3 md:px-3 align-top">
                          {renderFileState(proj.projectFile, () => removeProjectFile(proj.id, 'projectFile'), e => handleProjectFileChange(proj.id, 'projectFile', e.target.files?.[0] || null))}
                        </td>
                        <td className="block md:table-cell py-2 md:py-3 md:px-3 align-top">
                          {renderFileState(proj.referenceLetterFile, () => removeProjectFile(proj.id, 'referenceLetterFile'), e => handleProjectFileChange(proj.id, 'referenceLetterFile', e.target.files?.[0] || null))}
                        </td>
                        <td className="block md:table-cell py-2 md:py-3 md:px-3 md:text-center align-top absolute top-2 right-2 md:relative md:top-auto md:right-auto">
                          {!isReadOnly && <button type="button" onClick={() => removeProjectRow(proj.id)} className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-100"><TrashIcon className="w-5 h-5" /></button>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!isReadOnly && <button type="button" onClick={addProjectRow} className="mt-4 flex items-center gap-2 text-sm text-blue-700 font-semibold hover:text-blue-900"><PlusIcon className="w-5 h-5" />Add Project</button>}
              </div>
            </div>

            {!isReadOnly && (
              <div className="mt-6 pt-4 text-center md:text-right border-t">
                <button type="submit" disabled={isSubmitting} className="w-full md:w-auto bg-blue-800 text-white px-8 py-3 rounded-md hover:bg-blue-900 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold">
                  {isSubmitting ? "Submitting..." : "Submit Experience"}
                </button>
              </div>
            )}
          </form>
        ) : (
          <div className="text-center p-6 md:p-10 bg-green-50 rounded-lg">
            <h2 className="text-xl md:text-2xl font-bold text-green-800">Submission Successful!</h2>
            <p className="mt-4 text-gray-700">Thank you for submitting your contractor experience. Your profile will be updated shortly.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContractorExperience;
