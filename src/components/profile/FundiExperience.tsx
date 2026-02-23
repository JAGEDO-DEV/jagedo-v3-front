/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { XMarkIcon, EyeIcon } from "@heroicons/react/24/outline";
import { updateFundiExperience } from "@/api/experience.api";
import { uploadFile } from "@/utils/fileUpload";
import useAxiosWithAuth from "@/utils/axiosInterceptor";

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
  "G1: Master Fundi": 3,
  "G2: Skilled": 2,
  "G3: Semi-skilled": 1,
  "G4: Unskilled": 0,
};

const fundiSpecializations = [
  "General Plumbing",
  "Water Systems",
  "Drainage & Sewer",
  "Gas Plumbing",
  "Bathroom Installation",
  "Kitchen Installation",
  "Pipe Welding",
  "Solar Water Systems",
];

const prefilledAttachments: FundiAttachment[] = [
  { id: 1, projectName: "Project One", files: [] },
  { id: 2, projectName: "Project Two", files: [] },
  { id: 3, projectName: "Project Three", files: [] },
];

const FundiExperience = ({ data, refreshData }: any) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [attachments, setAttachments] = useState<FundiAttachment[]>(prefilledAttachments);
  const [grade, setGrade] = useState("G1: Master Fundi");
  const [experience, setExperience] = useState("10+ years");
  const [specialization, setSpecialization] = useState("");
  const [skill, setSkill] = useState("Plumber");
  const axiosInstance = useAxiosWithAuth(import.meta.env.VITE_SERVER_URL);


  /* ---------- LOAD FROM PROP ---------- */
  useEffect(() => {
    if (data) {
      const up = data.userProfile || data;
      setGrade(up.grade || "G1: Master Fundi");
      setExperience(up.experience || "10+ years");
      setSpecialization(up.specialization || up.profession || "");
      setSkill(up.skills || "Plumber");

      // For Fundis, the projects are in previousJobPhotoUrls
      const rawProjects = up.previousJobPhotoUrls || up.professionalProjects || [];

      if (rawProjects.length > 0) {
        // Group by project name to fit the attachments structure (up to 3 files per project)
        const grouped: { [key: string]: { file: null, previewUrl: string }[] } = {};

        rawProjects.forEach((p: any) => {
          const name = p.projectName || "Unnamed Project";
          if (!grouped[name]) grouped[name] = [];

          let url = "";
          // Check if fileUrl is an object (common in backend responses) or a string
          if (p.fileUrl && typeof p.fileUrl === 'object' && p.fileUrl.url) {
            url = p.fileUrl.url;
          } else if (typeof p.fileUrl === 'string') {
            url = p.fileUrl;
          } else if (p.url) {
            url = p.url;
          } else if (typeof p === 'string') {
            url = p;
          }

          if (url && grouped[name].length < 3) {
            grouped[name].push({ file: null, previewUrl: url });
          }
        });

        const mapped = Object.keys(grouped).map((name, idx) => ({
          id: idx + 1,
          projectName: name,
          files: grouped[name]
        }));

        // Ensure we maintain the 3-row layout for the UI
        const finalAttachments = [...mapped];
        if (finalAttachments.length < 3) {
          for (let i = finalAttachments.length; i < 3; i++) {
            finalAttachments.push({
              id: i + 1,
              projectName: prefilledAttachments[i].projectName,
              files: []
            });
          }
        }

        setAttachments(finalAttachments);
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
          ? { ...item, files: [...item.files, { file: file, previewUrl: preview }] }
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
      // 1. Upload files and collect URLs
      const flattenedProjectFiles: { projectName: string; fileUrl: string }[] = [];

      for (const att of valid) {
        for (const fItem of att.files) {
          let url = fItem.previewUrl;
          if (fItem.file) {
            // It's a new file, upload it
            url = await uploadFile(fItem.file);
          }
          flattenedProjectFiles.push({
            projectName: att.projectName,
            fileUrl: url
          });
        }
      }

      // 2. Build Payload
      const payload = {
        skill: skill,
        specialization: specialization,
        grade: grade,
        experience: experience,
        previousJobPhotoUrls: flattenedProjectFiles
      };

      // 3. API Call
      await updateFundiExperience(axiosInstance, payload);

      toast.success("Experience saved successfully!", { id: toastId });
      if (refreshData) refreshData();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to save experience!", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingProfile && !data) return <div className="p-8 text-center text-gray-500 font-medium">Loading...</div>;

  const inputStyles = "w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm";

  return (
    <div className="bg-gray-50 min-h-screen w-full p-4 md:p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-4xl font-bold mb-8">Fundi Experience</h1>

        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg text-sm">
          <p className="font-semibold mb-1">Next Steps</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>You will attend a <strong>15-minute interview</strong> after submission.</li>
            <li>Verification typically takes between <strong>7 to 14 days</strong> based on your work review.</li>
          </ul>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="bg-gray-50 p-6 rounded-xl border">
            <div className="grid md:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Skill</label>
                <input value={skill} readOnly className="w-full p-3 bg-gray-200 rounded-lg text-sm border-none" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
                <select
                  value={specialization}
                  onChange={e => setSpecialization(e.target.value)}
                  className={inputStyles}
                >
                  <option value="">Select</option>
                  {fundiSpecializations.map(spec => (
                    <option key={spec}>{spec}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
                <select
                  value={grade}
                  onChange={e => setGrade(e.target.value)}
                  className={inputStyles}
                >
                  {Object.keys(requiredProjectsByGrade).map(g => (
                    <option key={g}>{g}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Experience</label>
                <select
                  value={experience}
                  onChange={e => setExperience(e.target.value)}
                  className={inputStyles}
                >
                  {["10+ years", "5-10 years", "3-5 years", "1-3 years"].map(exp => (
                    <option key={exp}>{exp}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {visibleProjectRows > 0 && (
            <div className="overflow-hidden rounded-xl border border-gray-200">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr className="text-left">
                    <th className="p-4 font-semibold text-gray-600">No.</th>
                    <th className="p-4 font-semibold text-gray-600">Project Name</th>
                    <th className="p-4 font-semibold text-gray-600">Proof of Work (Max 3)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {attachments.slice(0, visibleProjectRows).map(row => (
                    <tr key={row.id}>
                      <td className="p-4 font-medium text-gray-500">#{row.id}</td>
                      <td className="p-4">
                        <input
                          value={row.projectName}
                          onChange={e => handleProjectNameChange(row.id, e.target.value)}
                          placeholder="Project name..."
                          className="w-full p-2 border rounded focus:ring-1 focus:ring-blue-500 outline-none"
                        />
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-2 mb-2">
                          {row.files.map((fItem, i) => (
                            <div key={i} className="relative group w-12 h-12">
                              <img src={fItem.previewUrl} alt="preview" className="w-full h-full object-cover rounded border" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 rounded">
                                <a href={fItem.previewUrl} target="_blank" rel="noreferrer" className="text-white hover:text-blue-200">
                                  <EyeIcon className="w-4 h-4" />
                                </a>
                                <button type="button" onClick={() => removeFile(row.id, i)} className="text-white hover:text-red-300">
                                  <XMarkIcon className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                        {row.files.length < 3 && (
                          <input
                            type="file"
                            accept="image/*"
                            onChange={e => handleFileChange(row.id, e.target.files?.[0] || null)}
                            className="text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                          />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex justify-end">
            <button
              disabled={isSubmitting}
              className="bg-blue-700 hover:bg-blue-800 text-white px-8 py-3 rounded-lg font-bold shadow-md transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
              {isSubmitting ? "Saving..." : "Save Experience"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FundiExperience;