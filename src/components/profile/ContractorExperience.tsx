/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import toast from 'react-hot-toast';
import axios from "axios";
import {
  PlusIcon,
  TrashIcon,
  XMarkIcon,
  InformationCircleIcon,
  EyeIcon
} from "@heroicons/react/24/outline";
import useAxiosWithAuth from "@/utils/axiosInterceptor";
import { updateContractorExperience } from "@/api/experience.api";
import { uploadFile } from "@/utils/fileUpload";
import { getBuilderSkillsByType, getSpecializationMappings } from "@/api/builderSkillsApi.api";
import { getMasterDataValues } from "@/api/masterData";
import { normalizeSkillName } from "@/utils/skillNameUtils";
import { getAuthHeaders } from "@/utils/auth";

interface ContractorCategory {
  id: string;
  category: string;
  specialization: string;
  categoryClass: string;
  yearsOfExperience: string;
  certificate?: string;
  license?: string;
  isPersisted?: boolean; 
  isPrePopulated?: boolean; 
}

interface ContractorProject {
  id: string;
  categoryId?: string;
  projectName: string;
  projectFile: File | string | null;
  referenceLetterFile: File | string | null;
  isPersisted?: boolean;
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

const NCA_CLASSES = ["NCA 1", "NCA 2", "NCA 3", "NCA 4", "NCA 5", "NCA 6", "NCA 7", "NCA 8"];
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

  
  const [contractorSkills, setContractorSkills] = useState<any[]>([]);
  const [specMappings, setSpecMappings] = useState<Record<string, string>>({});
  const [categorySpecsMap, setCategorySpecsMap] = useState<{ [key: string]: any[] }>({});
  const [skillsLoading, setSkillsLoading] = useState(false);

  const isReadOnly =
    ['PENDING', 'VERIFIED', 'APPROVED', 'REJECTED'].includes(data?.experienceStatus) ||
    data?.status === "SUSPENDED" ||
    data?.status === "BLACKLISTED" ||
    data?.status === "REJECTED";

  
  const isResubmit = data?.experienceStatus === 'RESUBMIT';

  
  useEffect(() => {
    const loadSkillsAndMappings = async () => {
      try {
        setSkillsLoading(true);
        const authAxios = axios.create({
          headers: { Authorization: getAuthHeaders() },
        });

        const skillsRes = await getBuilderSkillsByType(authAxios, 'CONTRACTOR');
        const activeSkills = skillsRes.filter((s: any) => s.isActive !== false);
        setContractorSkills(activeSkills);

        const mappingsRes = await getSpecializationMappings(authAxios, 'CONTRACTOR');
        setSpecMappings(mappingsRes);
      } catch (error) {
        console.error('Failed to load contractor skills:', error);
      } finally {
        setSkillsLoading(false);
      }
    };

    loadSkillsAndMappings();
  }, []);

  /* ---------- LOAD FROM PROP ---------- */
  useEffect(() => {
    if (data) {
      const up = data.userProfile || data;

      const exps = up.contractorExperiences || [];
      let mappedCategories: ContractorCategory[] = [];

      if (exps.length > 0) {
        mappedCategories = exps.map((exp: any) => ({
          id: exp.id || crypto.randomUUID(),
          category: exp.category || "",
          specialization: exp.specialization || "",
          categoryClass: exp.categoryClass || "",
          yearsOfExperience: exp.yearsOfExperience || "",
        }));
        setCategories(mappedCategories);
      } else {
        setCategories([{ id: crypto.randomUUID(), category: "", specialization: "", categoryClass: "", yearsOfExperience: "", isPersisted: false, isPrePopulated: false }]);
      }

      const projs = up.contractorProjects || [];
      if (projs.length > 0) {
        setProjects(projs.map((proj: any, index: number) => ({
          id: proj.id || crypto.randomUUID(),
          // Link to category by index if categoryId is missing in stored data
          categoryId: proj.categoryId || (mappedCategories[index] ? mappedCategories[index].id : null),
          projectName: proj.projectName || "",
          projectFile: proj.projectFile || null,
          referenceLetterFile: proj.referenceLetterUrl || proj.referenceLetterFile || null,
        })));
      }
      setIsLoadingProfile(false);
    }
  }, [data]);

  
  useEffect(() => {
    const loadAllCategorySpecializations = async () => {
      const categorySpecs: { [key: string]: any[] } = {};

      for (const cat of categories) {
        if (!cat.category || !specMappings || !contractorSkills.length) {
          continue;
        }

        const normalizedCategory = normalizeSkillName(cat.category);
        const specTypeCode = specMappings[normalizedCategory];

        if (!specTypeCode) {
          continue;
        }

        try {
          const selectedSkill = contractorSkills.find((s: any) =>
            normalizeSkillName(s.skillName) === normalizedCategory
          );

          if (!selectedSkill) {
            continue;
          }

          const assignedSpecCodes = Array.isArray(selectedSkill.specializations)
            ? selectedSkill.specializations
            : [];

          if (assignedSpecCodes.length === 0) {
            continue;
          }

          const authAxios = axios.create({
            headers: { Authorization: getAuthHeaders() },
          });

          const specsRes = await getMasterDataValues(authAxios, specTypeCode);
          const allSpecs = Array.isArray(specsRes) ? specsRes : (specsRes?.data || specsRes?.values || []);

          const filteredSpecs = allSpecs.filter((spec: any) => {
            const specCode = typeof spec === 'string' ? spec : (spec?.code || spec?.name || "");
            return assignedSpecCodes.includes(specCode);
          });

          categorySpecs[cat.category] = filteredSpecs;
        } catch (error) {
          console.error(`Failed to load specs for ${cat.category}:`, error);
          categorySpecs[cat.category] = [];
        }
      }

      setCategorySpecsMap(categorySpecs);
    };

    loadAllCategorySpecializations();
  }, [categories, specMappings, contractorSkills]);

  const handleCategoryChange = (id: string, value: string) => {
    if (categories.some(c => c.category === value && c.id !== id)) {
      toast.error("You cannot select the same category twice.");
      return;
    }

    setCategories(prev =>
      prev.map(cat =>
        cat.id === id ? { ...cat, category: value, specialization: "" } : cat
      )
    );

    if (!projects.find(p => p.categoryId === id)) {
      setProjects(prev => [
        ...prev,
        {
          id: crypto.randomUUID(),
          categoryId: id,
          projectName: value ? `${value} Project` : "",
          projectFile: null,
          referenceLetterFile: null,
          isPersisted: false,
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
        isPersisted: false,
        isPrePopulated: false, 
      },
    ]);
  };

  const removeCategoryRow = (id: string) => {
    const target = categories.find(c => c.id === id);
    if (target?.isPersisted || target?.isPrePopulated) {
      return toast.error("You cannot remove an initial category.");
    }

    if (categories.length <= 1) return toast.error("You must have at least one category.");

    setCategories(prev => prev.filter(cat => cat.id !== id));
    setProjects(prev => prev.filter(p => p.categoryId !== id));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isReadOnly) return toast.error("Your approved profile cannot be modified.");

    if (categories.some(c => !c.category || !c.categoryClass || !c.yearsOfExperience)) {
      return toast.error("Please fill in all required fields for categories.");
    }

    if (projects.some(p => !p.projectName)) {
      return toast.error("Please ensure all projects have names.");
    }

    setIsSubmitting(true);
    const toastId = toast.loading("Uploading files and saving...");

    try {
      const uploadedProjects = await Promise.all(
        projects.map(async (proj) => {
          let projectFileUrl = "";
          let referenceLetterUrl = "";

          if (proj.projectFile instanceof File) {
            const uploaded = await uploadFile(proj.projectFile);
            projectFileUrl = uploaded.url;
          } else if (typeof proj.projectFile === "string") {
            projectFileUrl = proj.projectFile;
          }

          if (proj.referenceLetterFile instanceof File) {
            const uploaded = await uploadFile(proj.referenceLetterFile);
            referenceLetterUrl = uploaded.url;
          } else if (typeof proj.referenceLetterFile === "string") {
            referenceLetterUrl = proj.referenceLetterFile;
          }

          return {
            projectName: proj.projectName,
            projectFile: projectFileUrl,
            referenceLetterUrl: referenceLetterUrl
          };
        })
      );

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

  const isFormComplete = (): boolean => {
    const filledCategories = categories.filter(c => c.category);
    if (filledCategories.length === 0) return false;

    const allFieldsFilled = filledCategories.every(c => c.categoryClass && c.yearsOfExperience && c.specialization);
    if (!allFieldsFilled) return false;

    if (projects.length < filledCategories.length) return false;

    const requiredProjects = projects.slice(0, filledCategories.length);
    const allFilesUploaded = requiredProjects.every(p => p.projectFile && p.referenceLetterFile);
    if (!allFilesUploaded) return false;

    return true;
  };

  const fileInputStyles = "w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 transition-colors cursor-pointer";

  const renderFileState = (
    file: File | string | null,
    onRemove: () => void,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
    disabled: boolean
  ) => {
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
            {!disabled && <button type="button" onClick={onRemove}><XMarkIcon className="w-5 h-5 text-red-500 hover:text-red-700" /></button>}
          </div>
        </div>
      );
    }
    if (disabled) return <span className="text-xs text-gray-500 p-2">No file provided.</span>;
    return <input type="file" onChange={onChange} className={fileInputStyles} />;
  };

  if (isLoadingProfile && !data) return <div className="p-8 text-center text-gray-600">Loading contractor profile...</div>;

  return (
    <div className="bg-gray-50 min-h-screen w-full p-2 sm:p-4 md:p-8">
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-lg p-4 md:p-8">
        {!submitted ? (
          <form className="space-y-8" onSubmit={handleSubmit}>
            <h1 className="text-2xl md:text-3xl font-bold mb-6 text-gray-800">Contractor Experience</h1>

            {isReadOnly && (data?.status === 'BLACKLISTED' || data?.status === 'SUSPENDED') && (
              <div className={`mb-6 p-4 border rounded-xl flex items-start gap-4 ${data?.status === 'BLACKLISTED' ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'}`}>
                <div className={`p-2 rounded-lg shrink-0 ${data?.status === 'BLACKLISTED' ? 'bg-red-100' : 'bg-yellow-100'}`}>
                  <InformationCircleIcon className={`w-6 h-6 ${data?.status === 'BLACKLISTED' ? 'text-red-600' : 'text-yellow-600'}`} />
                </div>
                <div>
                  <p className={`font-bold mb-1 uppercase text-xs tracking-widest ${data?.status === 'BLACKLISTED' ? 'text-red-900' : 'text-yellow-900'}`}>
                    {data?.status === 'BLACKLISTED' ? 'Account Blacklisted' : 'Account Suspended'}
                  </p>
                  <p className={`leading-relaxed text-sm ${data?.status === 'BLACKLISTED' ? 'text-red-700' : 'text-yellow-700'}`}>
                    Your account has been restricted. Profile updates are disabled.
                  </p>
                </div>
              </div>
            )}

            {data?.experienceStatus === 'REJECTED' && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-sm flex items-start gap-4">
                <div className="bg-red-100 p-2 rounded-lg shrink-0">
                  <XMarkIcon className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <p className="font-bold mb-1 uppercase text-xs tracking-widest text-red-900">Experience Rejected</p>
                  <p className="text-red-700 leading-relaxed">{data.experienceStatusReason || "Your submission was rejected. Please review your details and re-submit."}</p>
                </div>
              </div>
            )}

            {data?.experienceStatus === 'RESUBMIT' && (
              <div className="mb-6 p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-sm flex items-start gap-4">
                <div className="bg-amber-100 p-2 rounded-lg shrink-0">
                  <EyeIcon className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <p className="font-bold mb-1 uppercase text-xs tracking-widest text-amber-900">Resubmission Requested</p>
                  <p className="text-amber-700 leading-relaxed">{data.experienceStatusReason || "Admin has requested corrections or more details for your submission."}</p>
                </div>
              </div>
            )}

            {data?.experienceStatus === 'PENDING' && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl text-sm flex items-start gap-4">
                <div className="bg-blue-100 p-2 rounded-lg shrink-0">
                  <EyeIcon className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-bold mb-1 uppercase text-xs tracking-widest text-blue-900">Under Review</p>
                  <p className="text-blue-700 leading-relaxed">Your experience details have been submitted and are under review. Our team will contact you once verified.</p>
                </div>
              </div>
            )}

            {/* Categories */}
            <div>
              <h2 className="font-semibold mb-4 text-gray-700">Trade Categories</h2>
              <div className="space-y-3">
                {categories.map((cat, index) => (
                  <div key={cat.id} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center bg-white p-3 md:p-0 rounded-lg border md:border-0">
                    <select
                      value={cat.category}
                      onChange={e => handleCategoryChange(cat.id, e.target.value)}
                      
                      disabled={isReadOnly || cat.isPersisted || cat.isPrePopulated}
                      className="w-full p-2 border rounded-md text-sm outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                    >
                      <option value="">Select Category</option>
                      {contractorSkills.length > 0
                        ? contractorSkills.map(skill => (
                          <option key={skill.skillName} value={skill.skillName}>
                            {skill.skillName}
                          </option>
                        ))
                        : CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)
                      }
                    </select>

                    <select
                      value={cat.specialization}
                      onChange={e =>
                        setCategories(prev =>
                          prev.map(x => x.id === cat.id ? { ...x, specialization: e.target.value } : x)
                        )
                      }
                      
                      className="w-full p-2 border rounded-md text-sm outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                      disabled={isReadOnly || (cat.isPersisted && !isResubmit) || !cat.category}
                    >
                      <option value="">Specialization</option>
                      {(categorySpecsMap[cat.category] || []).map((s: any) => {
                        const specName = typeof s === 'string' ? s : (s?.label || s?.name || s?.code || "");
                        return <option key={specName} value={specName}>{specName}</option>;
                      })}
                      {cat.specialization && !(categorySpecsMap[cat.category] || []).some((s: any) => (typeof s === 'string' ? s : (s?.label || s?.name || s?.code || "")) === cat.specialization) && (
                        <option value={cat.specialization}>{cat.specialization}</option>
                      )}
                    </select>

                    <select
                      value={cat.categoryClass}
                      onChange={e =>
                        setCategories(prev =>
                          prev.map(x => x.id === cat.id ? { ...x, categoryClass: e.target.value } : x)
                        )
                      }
                      
                      disabled={isReadOnly || (cat.isPersisted && !isResubmit)}
                      className="w-full p-2 border rounded-md text-sm outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
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
                      
                      disabled={isReadOnly || (cat.isPersisted && !isResubmit)}
                      className="w-full p-2 border rounded-md text-sm outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                    >
                      <option value="">Years</option>
                      {Array.from(new Set([...YEARS_OF_EXPERIENCE, cat.yearsOfExperience].filter(Boolean))).map(y => <option key={y as string} value={y as string}>{y as string}</option>)}
                    </select>



                    <div className="flex justify-end pr-2">
                      {/* Hide trash icon if it's persisted OR pre-populated from sign-up */}
                      {!isReadOnly && !cat.isPersisted && !cat.isPrePopulated && (
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
                          e => setProjects(p => p.map(x => x.id === proj.id ? { ...x, projectFile: e.target.files?.[0] || null } : x)),
                          isReadOnly || (!!proj.isPersisted && !isResubmit) 
                        )}
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Reference Letter</label>
                        {renderFileState(
                          proj.referenceLetterFile,
                          () => setProjects(p => p.map(x => x.id === proj.id ? { ...x, referenceLetterFile: null } : x)),
                          e => setProjects(p => p.map(x => x.id === proj.id ? { ...x, referenceLetterFile: e.target.files?.[0] || null } : x)),
                          isReadOnly || (!!proj.isPersisted && !isResubmit) 
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
                  disabled={isSubmitting || !isFormComplete() || data?.experienceStatus === 'PENDING'}
                  title={
                    data?.experienceStatus === 'PENDING'
                      ? "This submission is under review and cannot be modified"
                      : !isFormComplete()
                        ? "Please fill all required fields: Category, Specialization, Class, Years of Experience, and upload all project files"
                        : "Submit contractor experience"
                  }
                  className="w-full sm:w-auto bg-blue-800 text-white px-10 py-3 rounded-lg hover:bg-blue-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-800 font-bold shadow-md shadow-blue-100 flex items-center justify-center gap-2"
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