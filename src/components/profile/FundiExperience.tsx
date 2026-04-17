/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
//@ts-nocheck
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { XMarkIcon, EyeIcon } from "@heroicons/react/24/outline";
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
}

interface FundiAttachment {
  id: number;
  projectName: string;
  files: FileItem[];
}

const requiredProjectsByGrade: { [key: string]: number } = {
  "G1: Master Fundi":    3,
  "G2: Skilled":         2,
  "G3: Semi-skilled":    1,
  "G4: Unskilled":       0,
};

const prefilledAttachments: FundiAttachment[] = [
  { id: 1, projectName: "", files: [] },
  { id: 2, projectName: "", files: [] },
  { id: 3, projectName: "", files: [] },
];


const FundiExperience = ({ data, refreshData }: any) => {
  const [isSubmitting, setIsSubmitting]     = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [attachments, setAttachments]       = useState<FundiAttachment[]>(prefilledAttachments);
  const [grade, setGrade]                   = useState("G1: Master Fundi");
  const [experience, setExperience]         = useState("10+ years");
  const [specialization, setSpecialization] = useState("");
  const [skill, setSkill]                   = useState((data?.skills || "plumber").toLowerCase());
  
  
  const [fundiSkills, setFundiSkills]       = useState<any[]>([]);
  const [specMappings, setSpecMappings]     = useState<Record<string, string>>({});
  const [specializations, setSpecializations] = useState<any[]>([]);
  const [skillsLoading, setSkillsLoading]   = useState(false);
  const [specsLoading, setSpecsLoading]     = useState(false);

  const axiosInstance = useAxiosWithAuth(import.meta.env.VITE_SERVER_URL);
  const isReadOnly = !['PENDING', 'RESUBMIT', 'INCOMPLETE', 'REJECTED'].includes(data?.experienceStatus);

  
  useEffect(() => {
    const loadSkillsAndMappings = async () => {
      try {
        setSkillsLoading(true);
        const authAxios = axios.create({
          headers: { Authorization: getAuthHeaders() },
        });
        
        
        const skillsRes = await getBuilderSkillsByType(authAxios, 'FUNDI');
        const activeSkills = skillsRes.filter((s: any) => s.isActive !== false);
        setFundiSkills(activeSkills);
        
        
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
        
        // Find the skill in fundiSkills to get its assigned specializations array
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
      REJECTED:  'Your submission was rejected. Please review the feedback and resubmit.',
      RJCT:      'Your submission was rejected. Please review the feedback and resubmit.',
      VERIFIED:  'Your submission has been approved.',
      APRVD:     'Your submission has been approved.',
      PENDING:   'Your submission is pending review.',
      PEND:      'Your submission is pending review.',
      RESUBMIT:  'Please resubmit your experience for review.',
    };
    return statusMap[status] || status;
  };

  /* ---------- LOAD FROM PROP ---------- */
  useEffect(() => {
    if (data) {
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
          } else if (Array.isArray(p.files)) {
            p.files.forEach((f: string) => groupedMap.get(name)?.push({ file: null, previewUrl: f }));
            return;
          }
          if (url) groupedMap.get(name)?.push({ file: null, previewUrl: url });
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
  }, [data]);

  const visibleProjectRows = requiredProjectsByGrade[grade] || 0;

  const handleFileChange = (rowId: number, file: File | null) => {
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setAttachments(prev =>
      prev.map(item =>
        item.id === rowId && item.files.length < 3
          ? { ...item, files: [...item.files, { file, previewUrl: preview }] }
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

  const handleProjectNameChange = (rowId: number, name: string) => {
    setAttachments(prev =>
      prev.map(item => (item.id === rowId ? { ...item, projectName: name } : item))
    );
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
        skills:               skill,
        specialization:       specialization,
        grade:                grade,
        experience:           experience,
        previousJobPhotoUrls: flattenedProjectFiles,
      });

      toast.success("Experience saved successfully!", { id: toastId });
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
          <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Skill */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Skill</label>
                <div className="w-full p-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-600 font-medium">
                  {skill ? skill.charAt(0).toUpperCase() + skill.slice(1) : "N/A"}
                </div>
              </div>

              {/* Specialization */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Specialization</label>
                <select
                  value={specialization}
                  onChange={e => setSpecialization(e.target.value)}
                  disabled={isReadOnly || !skill || specsLoading}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm appearance-none bg-white font-medium"
                >
                  <option value="">
                    {!skill ? "Select a skill first" : specsLoading ? "Loading…" : "Select Specialization"}
                  </option>
                  {specializations.map(s => (
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
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm bg-white font-medium"
                >
                  {Object.keys(requiredProjectsByGrade).map(g => (
                    <option key={g}>{g}</option>
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
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm bg-white font-medium"
                >
                  {["1-3 years", "3-5 years", "5-10 years", "10+ years"].map(exp => (
                    <option key={exp} value={exp}>{exp}</option>
                  ))}
                  <option value="">Select Experience</option>
                </select>
              </div>
            </div>
          </div>

          {/* Project Upload Section */}
          {visibleProjectRows > 0 && (
            <div className="bg-blue-50/50 p-8 rounded-2xl border border-blue-50 space-y-6">
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-blue-900">
                  Add Missing Projects ({visibleProjectRows - attachments.filter(a => a.projectName.trim() && a.files.length > 0).length} remaining)
                </h2>
                <p className="text-blue-700 text-sm">Add projects to complete your experience profile:</p>
              </div>

              <div className="space-y-4">
                {attachments.slice(0, visibleProjectRows).map(row => (
                  <div key={row.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                    <h3 className="text-blue-800 font-bold">Project {row.id}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Project Name */}
                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-gray-700">Project Name</label>
                        <input
                          value={row.projectName}
                          onChange={e => handleProjectNameChange(row.id, e.target.value)}
                          disabled={isReadOnly || isSubmitting}
                          placeholder="Enter project name"
                          className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                      </div>

                      {/* Project Files */}
                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-gray-700">Project Files</label>
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-4">
                            {!isReadOnly && (
                              <label className={`cursor-pointer px-6 py-2 rounded-xl text-sm font-bold transition-all ${!row.projectName.trim() ? 'bg-gray-100 text-gray-400' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}>
                                Choose File
                                <input
                                  type="file"
                                  accept="image/*"
                                  disabled={!row.projectName.trim() || isSubmitting}
                                  onChange={e => handleFileChange(row.id, e.target.files?.[0] || null)}
                                  className="hidden"
                                />
                              </label>
                            )}
                            <span className="text-gray-400 text-sm">
                              {row.files.length > 0 ? `${row.files.length} files selected` : "No file chosen"}
                            </span>
                          </div>
                          
                          {/* File Previews */}
                          {row.files.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {row.files.map((fItem, i) => (
                                <div key={i} className="relative group w-16 h-16">
                                  <img src={fItem.previewUrl} alt="preview" className="w-full h-full object-cover rounded-xl border border-gray-200" />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 rounded-xl">
                                    <a href={fItem.previewUrl} target="_blank" rel="noreferrer" className="text-white hover:text-blue-200">
                                      <EyeIcon className="w-5 h-5" />
                                    </a>
                                    <button type="button" onClick={() => removeFile(row.id, i)} className="text-white hover:text-red-300">
                                      <XMarkIcon className="w-5 h-5" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {!row.projectName.trim() && !isReadOnly && (
                            <p className="text-orange-500 text-xs font-semibold">
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
            <div className="flex justify-end pt-4">
              <button
                disabled={isSubmitting}
                className="bg-blue-800 hover:bg-blue-900 text-white px-10 py-4 rounded-xl font-bold shadow-lg transition-all disabled:opacity-50 flex items-center gap-3"
              >
                {isSubmitting && (
                  <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                )}
                {isSubmitting ? "Saving..." : "Save Experience"}
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