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
        !['PENDING', 'RESUBMIT', 'INCOMPLETE', 'REJECTED'].includes(data?.experienceStatus) || 
        data?.status === 'VERIFIED' || data?.accountStatus === 'VERIFIED';

    /* ---------- LOAD FROM PROP ---------- */
    useEffect(() => {
        if (data) {
            const up = data;
            setCategory(up.profession || GUIDELINES.categories[0]);
            setSpecialization(up.specialization || "");
            setLevel(up.levelOrClass || GUIDELINES.levels[1]);
            setExperience(up.yearsOfExperience || GUIDELINES.yearsOfExperience[0]);

            const rawProjects = up.previousJobPhotoUrls || up.professionalProjects || [];

            if (rawProjects.length > 0) {
                
                const grouped: { [key: string]: FileItem[] } = {};

                rawProjects.forEach((p: any) => {
                    const name = p.projectName || "Unnamed Project";
                    if (!grouped[name]) grouped[name] = [];

                    const addFile = (url: string, fileName: string = "Project File") => {
                        if (url && grouped[name].length < 3) {
                            grouped[name].push({ file: null, previewUrl: url, fileName });
                        }
                    };

                    
                    if (Array.isArray(p.files)) {
                        p.files.forEach((f: any) => {
                            if (typeof f === 'string') addFile(f);
                            else if (f?.url) addFile(f.url, f.displayName || f.originalName);
                        });
                    } else if (p.fileUrl && typeof p.fileUrl === 'object' && p.fileUrl.url) {
                        addFile(p.fileUrl.url, p.fileUrl.displayName || p.fileUrl.originalName);
                    } else if (typeof p.fileUrl === 'string') {
                        addFile(p.fileUrl);
                    } else if (p.url) {
                        addFile(p.url);
                    } else if (p.projectFile) {
                        addFile(p.projectFile);
                    } else if (typeof p === 'string') {
                        addFile(p);
                    }
                });

                const mapped = Object.keys(grouped).map((name, idx) => ({
                    id: idx + 1,
                    projectName: name,
                    files: grouped[name]
                }));

                
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

        const required = rowsToShow;
        const valid = attachments.slice(0, required).filter(p => p.projectName.trim() !== "" && p.files.length > 0);
        if (valid.length < required) return toast.error(`Please provide all ${required} required projects with at least one file each.`);

        setIsSubmitting(true);
        const toastId = toast.loading("Uploading files and saving...");

        try {
            
            const processedProjects = await Promise.all(valid.map(async (row) => {
                const uploadedUrls: string[] = [];

                for (const fItem of row.files) {
                    if (fItem.file) {
                        const uploaded = await uploadFile(fItem.file);
                        uploadedUrls.push(uploaded.url);
                    } else {
                        uploadedUrls.push(fItem.previewUrl);
                    }
                }

                return {
                    projectName: row.projectName,
                    fileUrl: uploadedUrls[0] || ""
                };
            }));

            
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
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-full border border-green-100 shadow-sm">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            <span className="text-xs font-bold uppercase tracking-wider">Verified</span>
                        </div>
                    )}
                </div>

                {isReadOnly && (
                    <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3">
                        <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                            <p className="text-sm font-semibold text-blue-900">Experience Verified</p>
                            <p className="text-xs text-blue-700 mt-0.5">Your professional experience has been verified. To update these details, please contact JAGEDO Support.</p>
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

                {!submitted ? (
                    <form className="space-y-8" onSubmit={handleSubmit}>
                        <div className="bg-gray-50 p-4 md:p-6 rounded-xl border border-gray-200">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                                    <input
                                        type="text"
                                        readOnly
                                        className="w-full p-3 bg-gray-200 border rounded-lg"
                                        value={category || ""}
                                        title={category || "Not Selected"}
                                    />
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
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Level</label>
                                    <select
                                        value={level}
                                        onChange={(e) => setLevel(e.target.value)}
                                        disabled={isReadOnly}
                                        className="w-full p-3 border rounded-lg disabled:bg-gray-100 disabled:cursor-not-allowed"
                                    >
                                        <option value="">Select Level</option>
                                        {GUIDELINES.levels.map(lvl => (
                                            <option key={lvl} value={lvl}>{lvl}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Years of Experience</label>
                                    <select
                                        value={experience}
                                        onChange={(e) => setExperience(e.target.value)}
                                        disabled={isReadOnly}
                                        className="w-full p-3 border rounded-lg disabled:bg-gray-100 disabled:cursor-not-allowed"
                                    >
                                        <option value="">Select Years</option>
                                        {GUIDELINES.yearsOfExperience.map(yr => (
                                            <option key={yr} value={yr}>{yr}</option>
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
                                    disabled={isSubmitting}
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