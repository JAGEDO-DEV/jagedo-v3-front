/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useMemo, useEffect } from "react";
import toast from 'react-hot-toast';
import { updateProfessionalExperience } from "@/api/experience.api";
import { XMarkIcon, EyeIcon } from "@heroicons/react/24/outline";
import { uploadFile } from "@/utils/fileUpload";
import useAxiosWithAuth from "@/utils/axiosInterceptor";
import { PROFESSIONAL_USER } from "@/data/professionalGuidelines";
import { getBuilderSkillsByType, getSpecializationMappings } from "@/api/builderSkillsApi.api";
import { getMasterDataValues } from "@/api/masterData";
import { normalizeSkillName } from "@/utils/skillNameUtils";
import axios from "axios";
import { getAuthHeaders } from "@/utils/auth";


interface FileItem {
    file: File | null;
    previewUrl: string;
    fileName: string;
}

interface AttachmentRow {
    id: number;
    projectName: string;
    files: FileItem[];
}

const GUIDELINES = PROFESSIONAL_USER.experience;

const CATEGORIES = ["Architect", "Engineer", "Surveyor", "Project Manager"];
const LEVELS = ["Senior", "Professional", "Graduate", "Student"];
const EXPERIENCE_LEVELS = ["10+ years", "5-10 years", "3-5 years", "1-3 years"];

const ProffExperience = ({ data, refreshData }: any) => {
    const [category, setCategory] = useState(GUIDELINES.categories[0]);
    const [specialization, setSpecialization] = useState("");
    const [level, setLevel] = useState(GUIDELINES.levels[1]);
    const [experience, setExperience] = useState(GUIDELINES.yearsOfExperience[0]);
    const [attachments, setAttachments] = useState<AttachmentRow[]>([]);
    const axiosInstance = useAxiosWithAuth(import.meta.env.VITE_SERVER_URL);

    const [submitted, setSubmitted] = useState(false);
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    
    const [professionalSkills, setProfessionalSkills] = useState<any[]>([]);
    const [specMappings, setSpecMappings] = useState<Record<string, string>>({});
    const [specializations, setSpecializations] = useState<any[]>([]);
    const [skillsLoading, setSkillsLoading] = useState(false);
    const [specsLoading, setSpecsLoading] = useState(false);

    const isReadOnly = 
        !['RESUBMIT', 'INCOMPLETE', 'REJECTED'].includes(data?.experienceStatus) || 
        data?.status === 'VERIFIED' || data?.accountStatus === 'VERIFIED' ||
        data?.status === "SUSPENDED" || data?.status === "BLACKLISTED";

    /* ---------- LOAD FROM PROP ---------- */
    useEffect(() => {
        if (data) {
            const up = data.userProfile || data;
            setCategory(up.profession || "Architect");
            setSpecialization(up.specialization || up.profession || "Residential");
            setLevel(up.professionalLevel || "Professional");
            setExperience(up.yearsOfExperience || "10+ years");

            const rawProjects = up.previousJobPhotoUrls || up.professionalProjects || [];

            if (rawProjects.length > 0) {
                // Group by project name to fit the attachments structure (up to 3 files per project)
                const grouped: { [key: string]: FileItem[] } = {};

                rawProjects.forEach((p: any) => {
                    const name = p.projectName || "Unnamed Project";
                    if (!grouped[name]) grouped[name] = [];

                    let url = "";
                    let fileName = "Project File";

                    // Handle various backend response structures
                    if (p.fileUrl && typeof p.fileUrl === 'object' && p.fileUrl.url) {
                        url = p.fileUrl.url;
                        fileName = p.fileUrl.displayName || p.fileUrl.originalName || "Project File";
                    } else if (typeof p.fileUrl === 'string') {
                        url = p.fileUrl;
                    } else if (p.url) {
                        url = p.url;
                    } else if (p.projectFile) {
                        url = p.projectFile;
                    } else if (typeof p === 'string') {
                        url = p;
                    }

                    if (url && grouped[name].length < 3) {
                        grouped[name].push({ file: null, previewUrl: url, fileName });
                    }
                });

                const mapped = Object.keys(grouped).map((name, idx) => ({
                    id: idx + 1,
                    projectName: name,
                    files: grouped[name]
                }));

                // Pad with empty rows if needed
                const totalRowsNeeded = Math.max(mapped.length, 5);
                const finalAttachments = [...mapped];
                for (let i = finalAttachments.length; i < totalRowsNeeded; i++) {
                    finalAttachments.push({
                        id: i + 1,
                        projectName: "",
                        files: []
                    });
                }
                setAttachments(finalAttachments);
            } else {
                setAttachments([...Array(5)].map((_, i) => ({ id: i + 1, projectName: "", files: [] })));
            }
            setIsLoadingProfile(false);
        }
    }, [data]);

    
    useEffect(() => {
        const loadSkillsAndMappings = async () => {
            try {
                setSkillsLoading(true);
                const authAxios = axios.create({
                    headers: { Authorization: getAuthHeaders() },
                });
                
                
                const skillsRes = await getBuilderSkillsByType(authAxios, 'PROFESSIONAL');
                const activeSkills = skillsRes.filter((s: any) => s.isActive !== false);
                setProfessionalSkills(activeSkills);
                
                
                const mappingsRes = await getSpecializationMappings(authAxios, 'PROFESSIONAL');
                setSpecMappings(mappingsRes);
            } catch (error) {
                console.error('Failed to load professional skills:', error);
                toast.error('Failed to load specializations');
            } finally {
                setSkillsLoading(false);
            }
        };
        
        loadSkillsAndMappings();
    }, []);

    
    useEffect(() => {
        const loadSpecializations = async () => {
            if (!category) {
                setSpecializations([]);
                return;
            }
            
            const normalizedCategory = normalizeSkillName(category);
            if (!specMappings[normalizedCategory]) {
                setSpecializations([]);
                return;
            }
            
            try {
                setSpecsLoading(true);
                const authAxios = axios.create({
                    headers: { Authorization: getAuthHeaders() },
                });
                
                
                const selectedProfession = professionalSkills.find((s: any) => 
                    normalizeSkillName(s.skillName) === normalizedCategory
                );
                
                const specTypeCode = specMappings[normalizedCategory];
                const specsRes = await getMasterDataValues(authAxios, specTypeCode);
                
                
                const allSpecs = Array.isArray(specsRes) ? specsRes : (specsRes?.data || specsRes?.values || []);
                
                
                if (selectedProfession) {
                    const assignedSpecCodes = Array.isArray(selectedProfession.specializations) 
                        ? selectedProfession.specializations 
                        : [];
                    
                    
                    const filteredSpecs = allSpecs.filter((spec: any) => {
                        const specCode = typeof spec === 'string' ? spec : (spec?.code || spec?.name || "");
                        return assignedSpecCodes.includes(specCode);
                    });
                    
                    setSpecializations(filteredSpecs);
                } else {
                    
                    setSpecializations(allSpecs);
                }
            } catch (error) {
                console.error('Failed to load specializations:', error);
                setSpecializations([]);
            } finally {
                setSpecsLoading(false);
            }
        };
        
        loadSpecializations();
    }, [category, specMappings, professionalSkills]);

    const rowsToShow = useMemo(() => {
        return (GUIDELINES.projectsByLevel as any)[level] ?? 0;
    }, [level]);

    const handleFileChange = (rowId: number, file: File | null) => {
        if (!file) return;
        const preview = URL.createObjectURL(file);
        setAttachments((prev) =>
            prev.map((item) => item.id === rowId && item.files.length < 3
                ? { ...item, files: [...item.files, { file, previewUrl: preview, fileName: file.name }] }
                : item)
        );
    };

    const handleProjectNameChange = (rowId: number, value: string) => {
        setAttachments((prev) => prev.map((item) => item.id === rowId ? { ...item, projectName: value } : item));
    };

    const removeFile = (rowId: number, fileIndex: number) => {
        setAttachments(prev => prev.map(item => {
            if (item.id === rowId) {
                const newFiles = [...item.files];
                newFiles.splice(fileIndex, 1);
                return { ...item, files: newFiles };
            }
            return item;
        }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (isReadOnly) return toast.error("Your approved profile cannot be modified.");

        if (!specialization) return toast.error("Please select a specialization.");
        if (!level) return toast.error("Please select your professional level.");
        if (!experience) return toast.error("Please select your years of experience.");

        const required = rowsToShow;
        const valid = attachments.slice(0, required).filter(p => p.projectName.trim() !== "" && p.files.length > 0);
        if (valid.length < required) return toast.error(`Please provide all ${required} required projects with at least one file each.`);

        setIsSubmitting(true);
        const toastId = toast.loading("Uploading files and saving...");

        try {
            
            const processedProjects = (await Promise.all(valid.map(async (row) => {
                return Promise.all(row.files.map(async (fItem) => {
                    let url = "";
                    if (fItem.file) {
                        const uploaded = await uploadFile(fItem.file);
                        url = uploaded.url;
                    } else {
                        url = fItem.previewUrl;
                    }
                    return {
                        projectName: row.projectName,
                        fileUrl: url
                    };
                }));
            }))).flat();

            
            const payload = {
                profession: category,
                specialization: specialization,
                level: level,
                yearsOfExperience: experience,
                professionalProjects: processedProjects
            };

            
            await updateProfessionalExperience(axiosInstance, payload);

            toast.success('Experience updated successfully!', { id: toastId });
            if (refreshData) refreshData();
            setSubmitted(true);
        } catch (err: any) {
            console.error(err);
            toast.error(err.message || "Failed to update experience!", { id: toastId });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoadingProfile && !data) return <div className="p-8 text-center text-gray-600">Loading professional profile...</div>;

    const inputStyles = "w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm disabled:bg-gray-100 disabled:cursor-not-allowed";

    return (
        <div className="bg-gray-50 min-h-screen w-full p-2 sm:p-4 md:p-8">
            <div className="bg-white rounded-xl shadow-lg p-4 md:p-8 max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Professional Experience</h1>
                    {isReadOnly && (
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border shadow-sm ${data?.status === "BLACKLISTED" ? "bg-red-50 text-red-700 border-red-100" : data?.status === "SUSPENDED" ? "bg-yellow-50 text-yellow-700 border-yellow-100" : "bg-green-50 text-green-700 border-green-100"}`}>
                            {data?.status === "BLACKLISTED" || data?.status === "SUSPENDED" ? (
                                <XMarkIcon className="w-4 h-4" />
                            ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            )}
                            <span className="text-xs font-bold uppercase tracking-wider">
                                {data?.status === "BLACKLISTED" ? "Blacklisted" : data?.status === "SUSPENDED" ? "Suspended" : "Verified"}
                            </span>
                        </div>
                    )}
                </div>

                {isReadOnly && (
                    <div className={`mb-8 p-4 border rounded-xl flex items-start gap-3 ${data?.status === "BLACKLISTED" ? "bg-red-50 border-red-200" : data?.status === "SUSPENDED" ? "bg-yellow-50 border-yellow-200" : "bg-blue-50 border-blue-200"}`}>
                        {data?.status === "BLACKLISTED" || data?.status === "SUSPENDED" ? (
                            <XMarkIcon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${data?.status === "BLACKLISTED" ? "text-red-600" : "text-yellow-600"}`} />
                        ) : (
                            <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        )}
                        <div>
                            <p className={`text-sm font-semibold ${data?.status === "BLACKLISTED" ? "text-red-900" : data?.status === "SUSPENDED" ? "text-yellow-900" : "text-blue-900"}`}>
                                {data?.status === "BLACKLISTED" ? "Account Blacklisted" : data?.status === "SUSPENDED" ? "Account Suspended" : "Experience Verified"}
                            </p>
                            <p className={`text-xs mt-0.5 ${data?.status === "BLACKLISTED" ? "text-red-700" : data?.status === "SUSPENDED" ? "text-yellow-700" : "text-blue-700"}`}>
                                {data?.status === "BLACKLISTED" || data?.status === "SUSPENDED" ? "Your account has been restricted. Profile updates are disabled." : "Your professional experience has been verified. To update these details, please contact JAGEDO Support."}
                            </p>
                        </div>
                    </div>
                )}
                
                {data?.experienceStatus === 'REJECTED' && (
                  <div className="mb-8 p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-sm flex items-start gap-4">
                     <div className="bg-red-100 p-2 rounded-lg flex-shrink-0">
                        <XMarkIcon className="w-6 h-6 text-red-600" />
                     </div>
                    <div>
                      <p className="font-bold mb-1 uppercase text-xs tracking-widest text-red-900">Portfolio Rejected</p>
                      <p className="text-red-700 leading-relaxed">{data.experienceStatusReason || "Your portfolio was rejected. Please address the feedback and resubmit your experience."}</p>
                    </div>
                  </div>
                )}

                {data?.experienceStatus === 'RESUBMIT' && (
                  <div className="mb-8 p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-sm flex items-start gap-4">
                     <div className="bg-amber-100 p-2 rounded-lg flex-shrink-0">
                        <EyeIcon className="w-6 h-6 text-amber-600" />
                     </div>
                    <div>
                      <p className="font-bold mb-1 uppercase text-xs tracking-widest text-amber-900">Resubmission Required</p>
                      <p className="text-amber-700 leading-relaxed">{data.experienceStatusReason || "Admin has requested more details. Please update your portfolio as requested."}</p>
                    </div>
                  </div>
                )}

                {data?.experienceStatus === 'PENDING' && (
                  <div className="mb-8 p-4 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl text-sm flex items-start gap-4">
                     <div className="bg-blue-100 p-2 rounded-lg flex-shrink-0">
                        <EyeIcon className="w-6 h-6 text-blue-600" />
                     </div>
                    <div>
                      <p className="font-bold mb-1 uppercase text-xs tracking-widest text-blue-900">Under Review</p>
                      <p className="text-blue-700 leading-relaxed">Your professional experience has been submitted and is currently under review. You will be notified once the verification process is complete.</p>
                    </div>
                  </div>
                )}

                {!submitted ? (
                    <form className="space-y-8" onSubmit={handleSubmit}>
                        <div className="bg-gray-50 p-4 md:p-6 rounded-xl border border-gray-200">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                    <select
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        disabled={isReadOnly}
                                        className={inputStyles}
                                    >
                                        {CATEGORIES.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Specialization</label>
                                    <select
                                        value={specialization}
                                        onChange={(e) => setSpecialization(e.target.value)}
                                        disabled={isReadOnly || !category || specsLoading}
                                        className="w-full p-3 border rounded-lg disabled:bg-gray-100 disabled:cursor-not-allowed"
                                    >
                                        <option value="">Select Specialty</option>
                                        {(specializations.length > 0
                                            ? specializations.map((spec: any) => {
                                                const specValue = typeof spec === 'string' ? spec : (spec?.value || spec?.name || spec);
                                                const specLabel = typeof spec === 'string' ? spec : (spec?.label || spec?.name || spec);
                                                return (
                                                    <option key={specValue} value={specValue}>
                                                        {specLabel}
                                                    </option>
                                                );
                                            })
                                            : ((GUIDELINES.specializations as any)[category] || []).map((spec: string) => (
                                                <option key={spec} value={spec}>{spec}</option>
                                            ))
                                        )}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
                                    <select
                                        value={level}
                                        onChange={(e) => setLevel(e.target.value)}
                                        disabled={isReadOnly}
                                        className={inputStyles}
                                    >
                                        {LEVELS.map(lvl => (
                                            <option key={lvl} value={lvl}>{lvl}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Years of Experience</label>
                                    <select
                                        value={experience}
                                        onChange={(e) => setExperience(e.target.value)}
                                        disabled={isReadOnly}
                                        className={inputStyles}
                                    >
                                        {EXPERIENCE_LEVELS.map(exp => (
                                            <option key={exp} value={exp}>{exp}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {rowsToShow > 0 && (
                            <div className="bg-white shadow-lg rounded-xl border border-gray-200 overflow-hidden">
                                <div className="bg-blue-50 px-6 py-4">
                                    <h4 className="text-md font-semibold text-blue-900 mb-2">Add Missing Projects ({rowsToShow} remaining)</h4>
                                    <p className="text-sm text-blue-700">Add projects to complete your experience profile:</p>
                                </div>
                                <div className="px-6 py-4 bg-blue-50">
                                    {attachments.slice(0, rowsToShow).map((row) => (
                                        <div key={row.id} className="mb-6 p-4 bg-white rounded-lg border border-blue-200">
                                            <div className="mb-3 text-sm font-medium text-blue-900">Project {row.id}</div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Project Name</label>
                                                    <input
                                                        type="text"
                                                        placeholder="Enter project name"
                                                        value={row.projectName}
                                                        onChange={(e) => handleProjectNameChange(row.id, e.target.value)}
                                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                                        disabled={isSubmitting || isReadOnly}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Project Files</label>
                                                    <div className="space-y-2">
                                                        {row.files.map((fItem, index) => (
                                                            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded border text-xs">
                                                                <span className="truncate flex-1 font-medium">{fItem.fileName}</span>
                                                                <div className="flex gap-2">
                                                                    <a href={fItem.previewUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600"><EyeIcon className="w-4 h-4" /></a>
                                                                    {!isReadOnly && <button type="button" onClick={() => removeFile(row.id, index)} className="text-red-500"><XMarkIcon className="w-4 h-4" /></button>}
                                                                </div>
                                                            </div>
                                                        ))}
                                                        {row.files.length < 3 && !isReadOnly && (
                                                            <>
                                                                <input
                                                                    type="file"
                                                                    accept="image/*,application/pdf"
                                                                    onChange={(e) => handleFileChange(row.id, e.target.files?.[0] || null)}
                                                                    disabled={!row.projectName.trim() || isSubmitting}
                                                                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                                                />
                                                                {!row.projectName.trim() && (
                                                                    <p className="text-xs text-amber-700">Enter project name first to unlock file upload.</p>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {!isReadOnly && (
                            <div className="mt-6 text-center md:text-right">
                                <button
                                    type="submit"
                                    disabled={isSubmitting || data?.experienceStatus === 'PENDING'}
                                    title={data?.experienceStatus === 'PENDING' ? "Your submission is currently under review" : ""}
                                    className="w-full md:w-auto bg-blue-800 text-white px-8 py-3 rounded-md hover:bg-blue-900 transition disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
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
                            <span className="text-3xl">✓</span>
                        </div>
                        <h2 className="text-2xl md:text-3xl font-bold text-green-800">Submission Successful!</h2>
                        <p className="text-gray-600 mt-4 max-w-md mx-auto">Your professional experience has been updated successfully. Our team will review your portfolio and update your status.</p>
                        <button
                            onClick={() => setSubmitted(false)}
                            className="mt-8 text-green-700 font-bold hover:underline"
                        >
                            Back to Profile
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProffExperience;