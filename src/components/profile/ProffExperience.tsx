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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";

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

    const isReadOnly = !['PENDING', 'RESUBMIT', 'INCOMPLETE'].includes(data?.experienceStatus);

    /* ---------- LOAD FROM PROP ---------- */
    useEffect(() => {
        if (data) {
            const up = data;
            setCategory(up.profession || GUIDELINES.categories[0]);
            setSpecialization(up.specialization || "");
            setLevel(up.levelOrClass || GUIDELINES.levels[1]);
            setExperience(up.yearsOfExperience || GUIDELINES.yearsOfExperience[0]);

            const existingProjects = up.professionalProjects || [];
            if (existingProjects.length > 0) {
                setAttachments(existingProjects.map((p: any, idx: number) => {
                    // Reconstruct file list from response
                    // ProfessionalProject has { projectFile: string, referenceLetterFile: string } usually
                    // OR files array if generic. Adapting to receive specific fields or array.
                    const files: FileItem[] = [];
                    if (p.fileUrl) files.push({ file: null, previewUrl: p.fileUrl, fileName: "Project File" });
                    if (p.projectFile) files.push({ file: null, previewUrl: p.projectFile, fileName: "Project File" });
                    if (p.referenceLetterFile) files.push({ file: null, previewUrl: p.referenceLetterFile, fileName: "Reference Letter" });

                    // Fallback if 'files' array exists
                    if (p.files && Array.isArray(p.files)) {
                        p.files.forEach((f: string) => files.push({ file: null, previewUrl: f, fileName: f.split('/').pop() || 'File' }));
                    }

                    return {
                        id: idx + 1,
                        projectName: p.projectName || `Project ${idx + 1}`,
                        files: files
                    };
                }));
            } else {
                setAttachments([...Array(5)].map((_, i) => ({ id: i + 1, projectName: "", files: [] })));
            }
            setIsLoadingProfile(false);
        }
    }, [data]);

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
            // 1. Process Files for Upload
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

            // 2. Build Payload
            const payload = {
                profession: category,
                specialization: specialization,
                level: level,
                yearsOfExperience: experience,
                professionalProjects: processedProjects
            };

            // 3. Send API
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
                <h1 className="text-2xl md:text-3xl font-bold mb-8 text-gray-800">Professional Experience</h1>

                {data?.experienceStatusReason && (
                    <Alert variant="destructive" className="mb-6">
                        <InfoIcon className="h-4 w-4" />
                        <AlertTitle>Status Update</AlertTitle>
                        <AlertDescription>
                            {data.experienceStatusReason}
                        </AlertDescription>
                    </Alert>
                )}

                {!submitted ? (
                    <form className="space-y-8" onSubmit={handleSubmit}>
                        <div className="bg-gray-50 p-4 md:p-6 rounded-xl border border-gray-200 space-y-4 shadow-inner">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                    <select
                                        value={category}
                                        onChange={(e) => {
                                            setCategory(e.target.value);
                                            setSpecialization(""); // Reset specialization when category changes
                                        }}
                                        disabled={isReadOnly}
                                        className={inputStyles}
                                    >
                                        <option value="">Select Category</option>
                                        {GUIDELINES.categories.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
                                    <select
                                        value={specialization}
                                        onChange={(e) => setSpecialization(e.target.value)}
                                        disabled={isReadOnly || !category}
                                        className={inputStyles}
                                    >
                                        <option value="">Select Specialty</option>
                                        {((GUIDELINES.specializations as any)[category] || []).map((spec: string) => (
                                            <option key={spec} value={spec}>{spec}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
                                    <select
                                        value={level}
                                        onChange={(e) => setLevel(e.target.value)}
                                        disabled={isReadOnly}
                                        className={inputStyles}
                                    >
                                        <option value="">Select Level</option>
                                        {GUIDELINES.levels.map(lvl => (
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
                                        <option value="">Select Years</option>
                                        {GUIDELINES.yearsOfExperience.map(yr => (
                                            <option key={yr} value={yr}>{yr}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {rowsToShow > 0 && (
                            <div className="bg-gray-50 p-4 md:p-6 rounded-xl border border-gray-200">
                                <div className="hidden md:block overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="bg-gray-100 border-b border-gray-200">
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase w-1/12">No.</th>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase w-4/12">Project Name</th>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase w-7/12">Project Files</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {attachments.slice(0, rowsToShow).map((row) => (
                                                <tr key={row.id} className="hover:bg-gray-100/50 transition-colors">
                                                    <td className="px-6 py-4 text-sm font-bold text-gray-500">#{row.id}</td>
                                                    <td className="px-6 py-4">
                                                        <input
                                                            type="text"
                                                            placeholder="Enter project name"
                                                            value={row.projectName}
                                                            onChange={(e) => handleProjectNameChange(row.id, e.target.value)}
                                                            className="w-full p-2 border rounded text-sm outline-none focus:ring-1 focus:ring-blue-500"
                                                            disabled={isSubmitting || isReadOnly}
                                                        />
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="space-y-2">
                                                            {row.files.map((fItem, index) => (
                                                                <div key={index} className="flex items-center justify-between gap-2 bg-white p-2 rounded border shadow-sm">
                                                                    <span className="text-xs text-gray-700 truncate font-medium" title={fItem.fileName}>{fItem.fileName}</span>
                                                                    <div className="flex items-center gap-1">
                                                                        <a href={fItem.previewUrl} target="_blank" rel="noopener noreferrer" className="p-1 hover:bg-blue-50 rounded text-blue-600 transition-colors"><EyeIcon className="w-4 h-4" /></a>
                                                                        {!isReadOnly && <button type="button" onClick={() => removeFile(row.id, index)} className="p-1 hover:bg-red-50 rounded text-red-500 transition-colors" disabled={isSubmitting}><XMarkIcon className="w-4 h-4" /></button>}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                            {row.files.length < 3 && !isReadOnly && (
                                                                <input
                                                                    type="file"
                                                                    accept="image/*,application/pdf"
                                                                    onChange={(e) => handleFileChange(row.id, e.target.files?.[0] || null)}
                                                                    className="text-[10px] text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                                                                />
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile View for Projects */}
                                <div className="md:hidden space-y-4">
                                    {attachments.slice(0, rowsToShow).map((row) => (
                                        <div key={row.id} className="bg-white p-4 rounded-lg border shadow-sm space-y-3">
                                            <div className="flex justify-between items-center border-b pb-2">
                                                <span className="font-bold text-gray-500 text-sm">Project #{row.id}</span>
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="Project Name"
                                                value={row.projectName}
                                                onChange={(e) => handleProjectNameChange(row.id, e.target.value)}
                                                className="w-full p-2 border rounded text-sm"
                                                disabled={isSubmitting || isReadOnly}
                                            />
                                            <div className="space-y-2">
                                                {row.files.map((fItem, index) => (
                                                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded border text-xs">
                                                        <span className="truncate flex-1">{fItem.fileName}</span>
                                                        <div className="flex gap-2">
                                                            <a href={fItem.previewUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600"><EyeIcon className="w-4 h-4" /></a>
                                                            {!isReadOnly && <button type="button" onClick={() => removeFile(row.id, index)} className="text-red-500"><XMarkIcon className="w-4 h-4" /></button>}
                                                        </div>
                                                    </div>
                                                ))}
                                                {row.files.length < 3 && !isReadOnly && (
                                                    <input type="file" onChange={(e) => handleFileChange(row.id, e.target.files?.[0] || null)} className="text-[10px] w-full" />
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {!isReadOnly && (
                            <div className="flex justify-end pt-4">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full sm:w-auto bg-blue-800 text-white px-10 py-3 rounded-lg hover:bg-blue-900 transition-all shadow-md shadow-blue-100 disabled:opacity-50 font-bold flex items-center justify-center gap-2"
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