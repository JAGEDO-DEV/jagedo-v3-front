/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
//@ts-nocheck
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { XMarkIcon, EyeIcon, PencilIcon } from "@heroicons/react/24/outline";
import { updateFundiExperience } from "@/api/experience.api";
import { uploadFile } from "@/utils/fileUpload";
import useAxiosWithAuth from "@/utils/axiosInterceptor";
import { InfoIcon, CheckCircle } from "lucide-react";
import { getBuilderSkillsByType, getSpecializationMappings } from "@/api/builderSkillsApi.api";
import { getMasterDataValues } from "@/api/masterData";
import { normalizeSkillName } from "@/utils/skillNameUtils";
import axios from "axios";
import { getAuthHeaders } from "@/utils/auth";

interface FileItem {
  file: File | null;
  previewUrl: string;
  name: string;
}

interface FundiAttachment {
  id: number;
  projectName: string;
  files: FileItem[];
}

const requiredProjectsByGrade: { [key: string]: number } = {
  "G1: Master Fundi": 3,
  "G2: Skilled": 2,
  "G3: Semi-skilled": 1,
  "G4: Unskilled": 0,
};

const prefilledAttachments: FundiAttachment[] = [
  { id: 1, projectName: "", files: [] },
  { id: 2, projectName: "", files: [] },
  { id: 3, projectName: "", files: [] },
];


const FundiExperience = ({ data, refreshData }: any) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [attachments, setAttachments] = useState<FundiAttachment[]>(prefilledAttachments);
  const [grade, setGrade] = useState("G1: Master Fundi");
  const [experience, setExperience] = useState("10+ years");
  const [specialization, setSpecialization] = useState("");
  const [skill, setSkill] = useState((data?.skills || "plumber").toLowerCase());


  const [fundiSkills, setFundiSkills] = useState<any[]>([]);
  const [specMappings, setSpecMappings] = useState<Record<string, string>>({});
  const [specializations, setSpecializations] = useState<any[]>([]);
  const [skillsLoading, setSkillsLoading] = useState(false);
  const [specsLoading, setSpecsLoading] = useState(false);

  const axiosInstance = useAxiosWithAuth(import.meta.env.VITE_SERVER_URL);
  const isReadOnly =
    ['PENDING', 'VERIFIED', 'APPROVED', 'DISAPPROVED', 'REJECTED'].includes(data?.experienceStatus) ||
    data?.status === "SUSPENDED" ||
    data?.status === "BLACKLISTED" ||
    data?.status === "REJECTED";
    



  useEffect(() => {
    const loadSkillsAndMappings = async () => {
      try {
        setSkillsLoading(true);
        const authAxios = axios.create({
          headers: { Authorization: getAuthHeaders() },
        });


        const skillsRes = await getBuilderSkillsByType(authAxios, 'FUNDI');
        const activeSkills = (skillsRes || []).filter((s: any) => s.isActive !== false);
        const sortedSkills = activeSkills.sort((a: any, b: any) => (a.skillName || "").localeCompare(b.skillName || ""));
        setFundiSkills(sortedSkills);


        const mappingsRes = await getSpecializationMappings(authAxios, 'FUNDI');
        setSpecMappings(mappingsRes);
      } catch (error) {
        console.error('Failed to load Fundi skills:', error);
        toast.error('Failed to load skills');
      } finally {
        setSkillsLoading(false);
      }
    };

    loadSkillsAndMappings();
  }, []);


  useEffect(() => {
    const loadSpecializations = async () => {
      if (!skill) {
        setSpecializations([]);
        return;
      }

      const normalizedSkill = normalizeSkillName(skill);
      if (!specMappings[normalizedSkill]) {
        setSpecializations([]);
        return;
      }

      try {
        setSpecsLoading(true);
        const authAxios = axios.create({
          headers: { Authorization: getAuthHeaders() },
        });

        
        const selectedSkill = fundiSkills.find((s: any) =>
          normalizeSkillName(s.skillName) === normalizedSkill
        );

        const specTypeCode = specMappings[normalizedSkill];
        const specsRes = await getMasterDataValues(authAxios, specTypeCode);


        const specs = Array.isArray(specsRes) ? specsRes : (specsRes?.data || specsRes?.values || []);
        setSpecializations(specs);
      } catch (error) {
        console.error('Failed to load specializations:', error);
        setSpecializations([]);
      } finally {
        setSpecsLoading(false);
      }
    };

    loadSpecializations();
  }, [skill, specMappings, fundiSkills]);



  const getStatusMessage = (status: string): string => {
    const statusMap: { [key: string]: string } = {
      REJECTED: 'Your submission was rejected. Please review the feedback and resubmit.',
      RJCT: 'Your submission was rejected. Please review the feedback and resubmit.',
      VERIFIED: 'Your submission has been approved.',
      APRVD: 'Your submission has been approved.',
      PENDING: 'Your submission is pending review.',
      PEND: 'Your submission is pending review.',
      RESUBMIT: 'Please resubmit your experience for review.',
    };
    return statusMap[status] || status;
  };

  /* ---------- LOAD FROM PROP ---------- */
  useEffect(() => {
    if (data && isLoadingProfile) {
      setGrade(data.grade || "G1: Master Fundi");
      setExperience(data.experience || "10+ years");

      const currentSkill = (data.skills || "plumber").toLowerCase();
      setSkill(currentSkill);
      setSpecialization(data.specialization?.trim() || "");

      const projectSource = data.previousJobPhotoUrls || data.professionalProjects || [];
      if (projectSource.length > 0) {
        const groupedMap = new Map<string, any[]>();
        projectSource.forEach((p: any) => {
          const name = p.projectName || "";
          if (!groupedMap.has(name)) groupedMap.set(name, []);
          let url = "";
          if (typeof p.fileUrl === 'object' && p.fileUrl !== null) {
            url = p.fileUrl.url || "";
          } else if (typeof p.fileUrl === 'string') {
            url = p.fileUrl;
          } else if (p.url) {
            url = p.url;
          }
          if (Array.isArray(p.files)) {
            p.files.forEach((f: string) => {
              const fileName = f.split('/').pop()?.split('_').slice(1).join('_') || "File";
              groupedMap.get(name)?.push({ file: null, previewUrl: f, name: fileName });
            });
            return;
          }
          if (url) {
            const fileName = url.split('/').pop()?.split('_').slice(1).join('_') || "File";
            groupedMap.get(name)?.push({ file: null, previewUrl: url, name: fileName });
          }
        });

        const newAttachments = Array.from(groupedMap.entries()).map(([name, files], idx) => ({
          id: idx + 1,
          projectName: name,
          files,
        }));
        if (newAttachments.length > 0) setAttachments(newAttachments);
      }
      setIsLoadingProfile(false);
    }
  }, [data, isLoadingProfile]);

  const visibleProjectRows = requiredProjectsByGrade[grade] || 0;

  const handleFileChange = (rowId: number, file: File | null) => {
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setAttachments(prev =>
      prev.map(item =>
        item.id === rowId && item.files.length < 3
          ? { ...item, files: [...item.files, { file, previewUrl: preview, name: file.name }] }
          : item
      )
    );
  };

  const removeFile = (rowId: number, fileIndex: number) => {
    setAttachments(prev =>
      prev.map(item =>
        item.id === rowId
          ? { ...item, files: item.files.filter((_, i) => i !== fileIndex) }
          : item
      )
    );
  };

  const replaceFile = (rowId: number, fileIndex: number, file: File | null) => {
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setAttachments(prev =>
      prev.map(item =>
        item.id === rowId
          ? {
              ...item,
              files: item.files.map((f, i) =>
                i === fileIndex ? { file, previewUrl: preview, name: file.name } : f
              )
            }
          : item
      )
    );
  };

  const handleProjectNameChange = (rowId: number, name: string) => {
    setAttachments(prev =>
      prev.map(item => (item.id === rowId ? { ...item, projectName: name } : item))
    );
  };

  const hasChanges = () => {
    if (!data) return false;
    
    const isGradeChanged = grade !== (data.grade || "G1: Master Fundi");
    const isExpChanged = experience !== (data.experience || "10+ years");
    const isSpecChanged = specialization !== (data.specialization?.trim() || "");
    
    const hasNewFiles = attachments.some(att => att.files.some(f => f.file !== null));
    
    return isGradeChanged || isExpChanged || isSpecChanged || hasNewFiles;
  };

  const handleCancel = () => {
    window.location.reload();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const required = requiredProjectsByGrade[grade];
    const valid = attachments
      .slice(0, required)
      .filter(a => a.projectName.trim() && a.files.length > 0);

    if (valid.length < required) {
      setIsSubmitting(false);
      return toast.error(`Please add ${required} complete project(s).`);
    }

    const toastId = toast.loading("Uploading photos and saving...");
    try {
      const flattenedProjectFiles: { projectName: string; fileUrl: string }[] = [];
      for (const att of valid) {
        for (const fItem of att.files) {
          const url = fItem.file ? await uploadFile(fItem.file) : fItem.previewUrl;
          flattenedProjectFiles.push({ projectName: att.projectName, fileUrl: url });
        }
      }

      await updateFundiExperience(axiosInstance, {
        skills: skill,
        specialization: specialization,
        grade: grade,
        experience: experience,
        previousJobPhotoUrls: flattenedProjectFiles,
      });

      toast.success("Experience saved successfully!", { id: toastId });
      setIsLoadingProfile(true);
      if (refreshData) refreshData();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to save experience!", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderEvaluationResults = () => {
    const evaluation = data?.fundiEvaluation;
    if (!evaluation) return null;
    const displayQuestions = evaluation.responses || [];
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mt-8">
        <div className="bg-blue-900 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <h3 className="text-lg font-bold text-white">Evaluation Results</h3>
          </div>
          <div className="bg-white/10 px-4 py-1 rounded-full border border-white/20">
            <span className="text-sm font-semibold text-white">
              Total Score: <span className="text-green-400 text-lg">{Math.round(evaluation.totalScore)}%</span>
            </span>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {displayQuestions.map((q: any, idx: number) => (
              <div key={idx} className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Question {idx + 1}</p>
                <h4 className="text-base font-semibold text-gray-800 mb-3">{q.text}</h4>
                <div className="bg-white p-3 rounded border border-gray-200 mb-2">
                  <p className="text-sm text-gray-700 italic">
                    {Array.isArray(q.answer) ? q.answer.join(", ") : (q.answer || "N/A")}
                  </p>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs font-medium text-gray-400">Score</span>
                  <span className="text-sm font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{q.score}/100</span>
                </div>
              </div>
            ))}
          </div>
          {evaluation.audioUrl && (
            <div className="mt-8 border-t pt-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <InfoIcon className="w-4 h-4 text-blue-500" />
                Audio Feedback Reference
              </h4>
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <audio key={evaluation.audioUrl} src={evaluation.audioUrl} controls className="w-full h-10">
                  Your browser does not support the audio element.
                </audio>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (isLoadingProfile && !data) return (
    <div className="p-8 text-center text-gray-500 font-medium">Loading...</div>
  );

  const inputStyles = "w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm";

  return (
    <div className="bg-gray-50 min-h-screen w-full p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-4xl font-bold text-gray-900">Fundi Experience</h1>

        {isReadOnly && (data?.status === 'BLACKLISTED' || data?.status === 'SUSPENDED') && (
          <div className={`p-4 border rounded-xl flex items-start gap-4 ${data?.status === 'BLACKLISTED' ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'}`}>
            <div className={`p-2 rounded-lg flex-shrink-0 ${data?.status === 'BLACKLISTED' ? 'bg-red-100' : 'bg-yellow-100'}`}>
              <InfoIcon className={`w-5 h-5 ${data?.status === 'BLACKLISTED' ? 'text-red-600' : 'text-yellow-600'}`} />
            </div>
            <div>
              <p className={`font-bold mb-1 uppercase text-xs tracking-wider ${data?.status === 'BLACKLISTED' ? 'text-red-900' : 'text-yellow-900'}`}>
                {data?.status === 'BLACKLISTED' ? 'Account Blacklisted' : 'Account Suspended'}
              </p>
              <p className={data?.status === 'BLACKLISTED' ? 'text-red-700 text-sm' : 'text-yellow-700 text-sm'}>
                Your account has been restricted. Profile updates are disabled.
              </p>
            </div>
          </div>
        )}


        {/* Next Steps Section */}
        <div className="bg-blue-50 border border-blue-100 p-6 rounded-xl shadow-sm">
          <h2 className="text-blue-700 font-bold mb-3">Next Steps</h2>
          <ul className="space-y-2">
            <li className="flex items-start gap-2 text-blue-800 text-sm">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-600 flex-shrink-0" />
              <span>You will attend a <strong className="text-blue-900">15-minute interview</strong> after submission.</span>
            </li>
            <li className="flex items-start gap-2 text-blue-800 text-sm">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-600 flex-shrink-0" />
              <span>Verification typically takes between <strong className="text-blue-900">7 to 14 days</strong> based on your work review.</span>
            </li>
          </ul>
        </div>

        {data?.experienceStatus === 'REJECTED' && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm flex items-start gap-3">
            <div className="bg-red-100 p-2 rounded-lg">
              <InfoIcon className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="font-bold mb-1 uppercase text-xs tracking-wider">Experience Rejected</p>
              <p className="text-red-700">{data.experienceStatusReason || "Your submission was rejected. Please review your details and re-submit."}</p>
            </div>
          </div>
        )}

        {data?.experienceStatus === 'RESUBMIT' && (
          <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-sm flex items-start gap-3">
            <div className="bg-amber-100 p-2 rounded-lg">
              <InfoIcon className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="font-bold mb-1 uppercase text-xs tracking-wider">Resubmission Required</p>
              <p className="text-amber-700">{data.experienceStatusReason || "Admin has requested a resubmission. Please check your details."}</p>
            </div>
          </div>
        )}

        <form className="space-y-8" onSubmit={handleSubmit}>
          {/* Main Experience Selection Card */}
          <div className="bg-gray-50 p-6 rounded-xl border">
            <div className="grid md:grid-cols-4 gap-6">
              {/* Skill */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Skill</label>
                <input
                  readOnly
                  className="w-full p-3 bg-gray-200 rounded-lg font-medium text-gray-600 outline-none"
                  value={skill ? skill.charAt(0).toUpperCase() + skill.slice(1) : "N/A"}
                />
              </div>

              {/* Specialization */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Specialization</label>
                <select
                  value={specialization}
                  onChange={e => setSpecialization(e.target.value)}
                  disabled={isReadOnly || !skill || specsLoading}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm bg-white font-medium"
                >
                  <option value="">
                    {!skill ? "Select a skill first" : specsLoading ? "Loading…" : "Select"}
                  </option>
                  {[...specializations].sort((a, b) => (a.name || "").localeCompare(b.name || "")).map(s => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                  {specialization && !specializations.find(s => s.name === specialization) && (
                    <option value={specialization}>{specialization}</option>
                  )}
                </select>
              </div>

              {/* Grade */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Grade</label>
                <select
                  value={grade}
                  onChange={e => setGrade(e.target.value)}
                  disabled={isReadOnly}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm bg-white font-medium"
                >
                  <option value="">Select Grade</option>
                  {["G1: Master Fundi", "G2: Skilled", "G3: Semi-skilled", "G4: Unskilled"].map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              {/* Experience */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Experience</label>
                <select
                  value={experience}
                  onChange={e => setExperience(e.target.value)}
                  disabled={isReadOnly}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm bg-white font-medium"
                >
                  <option value="">Select Experience</option>
                  {["1-3 years", "3-5 years", "5-10 years", "10+ years"].map(exp => (
                    <option key={exp} value={exp}>{exp}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Project Upload Section */}
          {visibleProjectRows > 0 && (
            <div className="bg-white shadow-lg rounded-xl border border-gray-200 overflow-hidden">
              <div className="bg-blue-50 px-6 py-4">
                <h4 className="text-md font-semibold text-blue-900 mb-2">
                  Add Missing Projects ({visibleProjectRows - attachments.filter(a => a.projectName.trim() && a.files.length > 0).length} remaining)
                </h4>
                <p className="text-sm text-blue-700">Add projects to complete your experience profile:</p>
              </div>

              <div className="px-6 py-4 bg-blue-50">
                {attachments.slice(0, visibleProjectRows).map(row => (
                  <div key={row.id} className="mb-6 p-4 bg-white rounded-lg border border-blue-200">
                    <div className="mb-3 text-sm font-medium text-blue-900">Project {row.id}</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Project Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Project Name</label>
                        <input
                          value={row.projectName}
                          onChange={e => handleProjectNameChange(row.id, e.target.value)}
                          disabled={isReadOnly || isSubmitting}
                          placeholder="Enter project name"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        />
                      </div>

                      {/* Project Files */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Project Files</label>
                        <div className="space-y-2">
                          <input
                            type="file"
                            accept="image/*,application/pdf,.pdf"
                            disabled={!row.projectName.trim() || isSubmitting || isReadOnly}
                            onChange={e => handleFileChange(row.id, e.target.files?.[0] || null)}
                            className={`w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 transition-all ${(!row.projectName.trim() || isReadOnly) ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                          />

                          {/* File Previews */}
                          {row.files.length > 0 && (
                            <div className="space-y-2 mt-3">
                              {row.files.map((fItem, i) => (
                                <div key={i} className="flex items-center justify-between gap-2 bg-gray-100 p-2 rounded-md">
                                  <span className="text-sm text-gray-700 truncate font-medium" title={fItem.name}>
                                    {fItem.name}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <a
                                      href={fItem.previewUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:text-blue-800 transition-colors"
                                    >
                                      <EyeIcon className="w-4 h-4" />
                                    </a>
                                    {!isReadOnly && (
                                      <label className="cursor-pointer text-blue-600 hover:text-blue-800 transition-colors">
                                        <PencilIcon className="w-4 h-4" />
                                        <input
                                          type="file"
                                          accept="image/*,application/pdf,.pdf"
                                          className="hidden"
                                          onChange={(e) => replaceFile(row.id, i, e.target.files?.[0] || null)}
                                        />
                                      </label>
                                    )}
                                    {!isReadOnly && (
                                      <button
                                        type="button"
                                        onClick={() => removeFile(row.id, i)}
                                        className="text-red-500 hover:text-red-700 transition-colors"
                                      >
                                        <XMarkIcon className="w-4 h-4" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {!row.projectName.trim() && !isReadOnly && (
                            <p className="text-xs text-amber-700">
                              Enter project name first to unlock file upload.
                            </p>
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
            <div className="flex justify-end items-center gap-4 pt-4">
              {hasChanges() && (
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                  className="px-6 py-3 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-100 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
              )}
              <button
                disabled={isSubmitting || !hasChanges()}
                className="bg-blue-700 hover:bg-blue-800 text-white px-6 py-3 rounded-lg font-semibold shadow-md transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                {isSubmitting ? "Saving..." : "Save"}
              </button>
            </div>
          )}
        </form>


        {renderEvaluationResults()}
      </div>
    </div>
  );
};

export default FundiExperience;
