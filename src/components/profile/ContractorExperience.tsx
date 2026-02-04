import { useState, useEffect } from "react";
import toast from 'react-hot-toast';
import {
  PlusIcon,
  TrashIcon,
  XMarkIcon,
  EyeIcon
} from "@heroicons/react/24/outline";
// import useAxiosWithAuth from "@/utils/axiosInterceptor";
// import { updateContractorExperience } from "@/api/experience.api";
// import { getProviderProfile } from "@/api/provider.api";
// import { uploadFile } from "@/utils/fileUpload";
import { useGlobalContext } from "@/context/GlobalProvider";

type FileOrUrl = File | string | null;

interface ContractorCategory {
 id: string;
  category: string;
  specialization: string;
  categoryClass: string;
  yearsOfExperience: string;
}

interface ContractorProject {
  id: string;
  categoryId?: string;
  projectName: string;
  projectFile: FileOrUrl;
  referenceLetterFile: FileOrUrl;
}
const CATEGORIES = [
  "Electrical Works",
  "Mechanical Works",
  "Road Works",
  "Water Works",
  "Building Works",
];
const BUILDING_WORKS_SPECIALIZATIONS = [
  "Residential Buildings",
  "Commercial Buildings",
  "Industrial Buildings",
  "Renovation & Refurbishment",
  "Road & Pavement Works",
  "Bridges & Culverts",
  "Water & Drainage Works",
  "Steel Structures",
];

const ContractorExperience = () => {
  const { user } = useGlobalContext();
  //const axiosInstance = useAxiosWithAuth(import.meta.env.VITE_SERVER_URL);

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
      isEditing: false,
    },
    
  ];

  const prefilledProjects: ContractorProject[] = [
    {
      id: "1",
      categoryId: "1",
      projectName: "Central Mall Renovation",
      projectFile: "https://example.com/project_file_mall.pdf",
      referenceLetterFile: "https://example.com/reference_letter_mall.pdf",

    },
    
  ];
useEffect(() => {
  const handleProfileUpdate = (e: CustomEvent) => {
    if (e.detail.type === "contractor") {
      setSidebarStatus("complete"); // or whatever your sidebar state updater is
    }
  };

  window.addEventListener("profileUpdated", handleProfileUpdate as EventListener);

  return () => {
    window.removeEventListener("profileUpdated", handleProfileUpdate as EventListener);
  };
}, []);

  useEffect(() => {
    const fetchProfile = async () => {
      const storedData = localStorage.getItem(`contractorExperience_${user.id}`);
      if (storedData) {
        try {
          const { categories: storedCategories, projects: storedProjects } = JSON.parse(storedData);
          setCategories(storedCategories || []);
          setProjects(storedProjects || []);
          setIsLoadingProfile(false);
          return;
        } catch (error) {
          console.error("Error parsing stored data:", error);
        }
      }
      setCategories(prefilledCategories);
      setProjects(prefilledProjects);
      setIsLoadingProfile(false);
      // try {
      //   const response = await getProviderProfile(axiosInstance, user.id);

      //   if (response.success && response.data?.userProfile) {
      //     const profile = response.data.userProfile;

      //     if (profile.contractorExperiences && profile.contractorExperiences.length > 0) {
      //       const populatedCategories = profile.contractorExperiences.map(exp => ({
      //         id: Math.random().toString(),
      //         category: exp.category,
      //           specialization: exp.specialization,
      //         categoryClass: exp.categoryClass,
      //         yearsOfExperience: exp.yearsOfExperience,
              
      //         isEditing: false,
      //       }));
      //       setCategories(populatedCategories);
      //     } else {
      //       setCategories(prefilledCategories);
      //     }

      //     if (profile.contractorProjects && profile.contractorProjects.length > 0) {
      //       const populatedProjects = profile.contractorProjects.map(proj => ({
      //         id: Math.random().toString(),
      //         projectName: proj.projectName,
      //         projectFile: proj.projectFile,
      //         referenceLetterFile: proj.referenceLetterUrl,
      //       }));
      //       setProjects(populatedProjects);
      //     } else {
      //       setProjects(prefilledProjects);
      //     }
      //   } else {
      //     setCategories(prefilledCategories);
      //     setProjects(prefilledProjects);
      //   }
      // } catch (error) {
      //   console.error("Error fetching profile:", error);
      //   toast.error("Failed to load contractor data.");
      //   setCategories(prefilledCategories);
      //   setProjects(prefilledProjects);
      // } finally {
      //   setIsLoadingProfile(false);
      // }
    };
    fetchProfile();
  }, [user.id]);

  // const updateExperienceOnServer = async (
  //   currentCategories: ContractorCategory[],
  //   currentProjects: ContractorProject[]
  // ) => {
  //   const contractorCategories = await Promise.all(
  //     currentCategories.map(async cat => ({
  //       category: cat.category,
  //     specialization: cat.specialization,

  //       categoryClass: cat.categoryClass,
  //       yearsOfExperience: cat.yearsOfExperience,
        
  //     }))
  //   );

  //   const contractorProjects = await Promise.all(
  //     currentProjects.map(async proj => ({
  //       projectName: proj.projectName,
  //       projectFile: proj.projectFile instanceof File ? (await uploadFile(proj.projectFile)).url : proj.projectFile || "",
  //       referenceLetterUrl: proj.referenceLetterFile instanceof File ? (await uploadFile(proj.referenceLetterFile)).url : proj.referenceLetterFile || "",
  //     }))
  //   );

  //   await updateContractorExperience(axiosInstance, {
  //     categories: contractorCategories,
  //     projects: contractorProjects,
  //   });
  // };
  const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

  const updateExperienceOnServer = async (
    currentCategories: ContractorCategory[],
    currentProjects: ContractorProject[]
  ) => {
    const contractorCategories = await Promise.all(currentCategories.map(async cat => ({
      id: cat.id,
      category: cat.category,
      specialization: cat.specialization,
      categoryClass: cat.categoryClass,
      yearsOfExperience: cat.yearsOfExperience,
      certificateFile: cat.certificateFile ? {
        name: cat.certificateFile.name,
        size: cat.certificateFile.size,
        type: cat.certificateFile.type,
        content: await fileToBase64(cat.certificateFile),
      } : null,
      licenseFile: cat.licenseFile ? {
        name: cat.licenseFile.name,
        size: cat.licenseFile.size,
        type: cat.licenseFile.type,
      } : null,
    })));

    const contractorProjects = currentProjects.map(proj => ({
      id: proj.id,
      categoryId: proj.categoryId,
      projectName: proj.projectName,
      projectFile: proj.projectFile instanceof File ? {
        name: proj.projectFile.name,
        size: proj.projectFile.size,
        type: proj.projectFile.type,
      } : proj.projectFile,
      referenceLetterFile: proj.referenceLetterFile instanceof File ? {
        name: proj.referenceLetterFile.name,
        size: proj.referenceLetterFile.size,
        type: proj.referenceLetterFile.type,
      } : proj.referenceLetterFile,
    }));

    const experienceData = {
      categories: contractorCategories,
      projects: contractorProjects,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(`contractorExperience_${user.id}`, JSON.stringify(experienceData));

    // simulate success (no API call)
    return Promise.resolve();
  };

  // const handleCategoryChange = (id: string, field: keyof Omit<ContractorCategory, 'certificateFile' | 'licenseFile'>, value: any) => {
  //   setCategories(prev => prev.map(cat => cat.id === id ? { ...cat, [field]: value } : cat));
  // };

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
          projectName: `${value} Project`,
          projectFile: null,
          referenceLetterFile: null,
        },
      ]);
    }
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

  // const addProjectRow = () => {
  //   setProjects(prev => [...prev, { id: Math.random().toString(), projectName: "", projectFile: null, referenceLetterFile: null }]);
  // };

  const removeProjectRow = (id: string) => {
    if (projects.length <= 1) return toast.error("You must have at least one project.");
    setProjects(prev => prev.filter(proj => proj.id !== id));
  };
const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  if (isReadOnly) return toast.error("Your approved profile cannot be modified.");

  // Validation
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

    setSubmitted(true); // Shows the success message
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
             {/* Categories */}
      <div>
        <h2 className="font-semibold mb-2">Trade Categories</h2>
        {categories.map(cat => (
          <div key={cat.id} className="grid grid-cols-5 gap-2 mb-2">
            <select
              value={cat.category}
              onChange={e => handleCategoryChange(cat.id, e.target.value)}
              disabled={isReadOnly}
              className="border p-2"
            >
              <option value="">Select Category</option>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>

            <select
              value={cat.specialization}
              onChange={e =>
                setCategories(prev =>
                  prev.map(x => x.id === cat.id ? { ...x, specialization: e.target.value } : x)
                )
              }
              className="border p-2"
              disabled={isReadOnly}
            >
              <option value="">Specialization</option>
              {BUILDING_WORKS_SPECIALIZATIONS.map(s => <option key={s}>{s}</option>)}
            </select>

            <select
              value={cat.categoryClass}
              onChange={e =>
                setCategories(prev =>
                  prev.map(x => x.id === cat.id ? { ...x, categoryClass: e.target.value } : x)
                )
              }
              className="border p-2"
            >
              <option value="">Class</option>
              {["NCA 1","NCA 2","NCA 3","NCA 4","NCA 5"].map(c => <option key={c}>{c}</option>)}
            </select>

            <select
              value={cat.yearsOfExperience}
              onChange={e =>
                setCategories(prev =>
                  prev.map(x => x.id === cat.id ? { ...x, yearsOfExperience: e.target.value } : x)
                )
              }
              className="border p-2"
            >
              <option value="">Years</option>
              {["10+","5-10","3-5","1-3"].map(y => <option key={y}>{y}</option>)}
            </select>

            {!isReadOnly && (
              <button type="button" onClick={() => removeCategoryRow(cat.id)}>
                <TrashIcon className="w-5 h-5 text-red-500" />
              </button>
            )}
          </div>
        ))}

        {!isReadOnly && (
          <button type="button" onClick={addCategoryRow} className="flex items-center gap-1 text-blue-700">
            <PlusIcon className="w-4 h-4" /> Add Category
          </button>
        )}
      </div>

            {/* Projects */}
           <div>
        <h2 className="font-semibold mb-2">Projects (Auto per Category)</h2>
        {projects.map(proj => (
          <div key={proj.id} className="grid grid-cols-3 gap-2 mb-2">
            <input value={proj.projectName} disabled className="border p-2 bg-gray-100" />
            {renderFileState(
              proj.projectFile,
              () => setProjects(p => p.map(x => x.id === proj.id ? { ...x, projectFile: null } : x)),
              e => setProjects(p => p.map(x => x.id === proj.id ? { ...x, projectFile: e.target.files[0] } : x))
            )}
            {renderFileState(
              proj.referenceLetterFile,
              () => setProjects(p => p.map(x => x.id === proj.id ? { ...x, referenceLetterFile: null } : x)),
              e => setProjects(p => p.map(x => x.id === proj.id ? { ...x, referenceLetterFile: e.target.files[0] } : x))
            )}
          </div>
        ))}
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








