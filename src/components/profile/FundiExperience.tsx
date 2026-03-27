/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
//@ts-nocheck
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { XMarkIcon, EyeIcon } from "@heroicons/react/24/outline";
import { updateFundiExperience } from "@/api/experience.api";
import { uploadFile } from "@/utils/fileUpload";
import useAxiosWithAuth from "@/utils/axiosInterceptor";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon, CheckCircle } from "lucide-react";

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

const FUNDI_SPECIALIZATIONS = {
  mason: [
    "Block Work & Brick Laying",
    "Plastering & Rendering",
    "Stone Masonry",
    "Concrete Work",
    "Foundation Work",
    "Structural Masonry",
    "Decorative Masonry",
    "Tile Setting",
    "Waterproofing",
    "Restoration & Repair",
  ],
  electrician: [
    "Residential Wiring",
    "Commercial Installations",
    "Industrial Electrical",
    "Solar PV Installation",
    "Backup Power Systems",
    "Lighting Systems",
    "Security & Alarm Systems",
    "Data & Network Cabling",
    "Motor & Pump Installations",
    "Electrical Maintenance & Repair",
  ],
  plumber: [
    "General Plumbing",
    "Water Systems",
    "Drainage & Sewer",
    "Gas Plumbing",
    "Bathroom Installation",
    "Kitchen Installation",
    "Pipe Welding",
    "Solar Water Systems",
  ],
  carpenter: [
    "Furniture Making",
    "Roofing & Trusses",
    "Door & Window Installation",
    "Kitchen Cabinets",
    "Wardrobes & Closets",
    "Flooring Installation",
    "Ceiling Work",
    "Formwork & Shuttering",
    "Finish Carpentry",
    "Renovation & Restoration",
  ],
  painter: [
    "Interior Painting",
    "Exterior Painting",
    "Decorative Finishes",
    "Texture Coating",
    "Spray Painting",
    "Wallpaper Installation",
    "Epoxy Coating",
    "Waterproof Coating",
    "Wood Finishing & Staining",
    "Industrial Painting",
  ],
  welder: [
    "Structural Welding",
    "Pipe Welding",
    "MIG Welding",
    "TIG Welding",
    "Arc Welding",
    "Gate & Grille Fabrication",
    "Tank Fabrication",
    "Aluminum Welding",
    "Stainless Steel Welding",
    "Repair & Maintenance Welding",
  ],
  tiler: [
    "Floor Tiling",
    "Wall Tiling",
    "Bathroom Tiling",
    "Kitchen Backsplash",
    "Swimming Pool Tiling",
    "Outdoor & Patio Tiling",
    "Mosaic Installation",
    "Natural Stone Installation",
    "Tile Repair & Restoration",
    "Waterproofing & Grouting",
  ],
  roofer: [
    "Metal Roofing",
    "Tile Roofing",
    "Flat Roofing",
    "Shingle Installation",
    "Roof Repair & Maintenance",
    "Gutter Installation",
    "Skylight Installation",
    "Waterproofing",
    "Insulation",
    "Green Roof Installation",
  ],
  "glass-aluminium-fitter": [
    "Aluminum Door Installation",
    "Aluminum Window Installation",
    "Glass Cutting & Fitting",
    "Curtain Wall Installation",
    "Glazing Works",
    "Partition Wall Installation",
    "Shopfront Installation",
    "Mirror Installation",
    "Maintenance & Repair (Glass & Aluminum)",
  ],
};

const FUNDI_SKILLS = [
  "mason",
  "electrician",
  "plumber",
  "carpenter",
  "painter",
  "welder",
  "tiler",
  "roofer",
  "glass-aluminium-fitter",
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
  const [skill, setSkill] = useState((data?.skills || "plumber").toLowerCase());
  const axiosInstance = useAxiosWithAuth(import.meta.env.VITE_SERVER_URL);

  const isReadOnly = !['PENDING', 'RESUBMIT', 'INCOMPLETE', 'REJECTED'].includes(data?.experienceStatus);

  // Map status codes to user-friendly messages
  const getStatusMessage = (status: string): string => {
    const statusMap: { [key: string]: string } = {
      'RJCT': 'Your submission was rejected. Please review the feedback and resubmit.',
      'APRVD': 'Your submission has been approved.',
      'PEND': 'Your submission is pending review.',
      'RESUBMIT': 'Please resubmit your experience for review.',
    };
    return statusMap[status] || status;
  };


  /* ---------- LOAD FROM PROP ---------- */
  useEffect(() => {
    if (data) {
      const up = data;
      setGrade(up.grade || "G1: Master Fundi");
      setExperience(up.experience || "10+ years");
      // Ensure specialization is set from data
      setSpecialization(up.specialization?.trim() || "");
      setSkill((up.skills || "plumber").toLowerCase());

      const projectSource = up.previousJobPhotoUrls || up.professionalProjects || [];

      if (projectSource.length > 0) {

        const groupedMap = new Map<string, any[]>();

        projectSource.forEach((p: any) => {
          const name = p.projectName || "Unspecified Project";
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

          if (url) {
            groupedMap.get(name)?.push({ file: null, previewUrl: url });
          }
        });

        const newAttachments = Array.from(groupedMap.entries()).map(([name, files], idx) => ({
          id: idx + 1,
          projectName: name,
          files: files
        }));

        if (newAttachments.length > 0) {
          setAttachments(newAttachments);
        }
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
      const flattenedProjectFiles: { projectName: string; fileUrl: string }[] = [];

      for (const att of valid) {
        for (const fItem of att.files) {
          let url = fItem.previewUrl;
          if (fItem.file) {
            url = await uploadFile(fItem.file);
          }
          flattenedProjectFiles.push({
            projectName: att.projectName,
            fileUrl: url
          });
        }
      }

      const payload = {
        skill: skill,
        specialization: specialization,
        grade: grade,
        experience: experience,
        previousJobPhotoUrls: flattenedProjectFiles
      };

      await updateFundiExperience(axiosInstance, payload);

      toast.success("Experience submitted successfully! Your submission is now pending review.", { id: toastId });
      setIsSubmitting(false);
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
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <h3 className="text-lg font-bold text-white">Evaluation Results</h3>
            </div>
          </div>
          <div className="bg-white/10 px-4 py-1 rounded-full border border-white/20">
            <span className="text-sm font-semibold text-white">
              Total Score: <span className="text-green-400 text-lg">{Math.round(evaluation.totalScore)}%</span>
            </span>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {displayQuestions.map((q, idx) => (
              <div key={idx} className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Question {idx + 1}
                </p>
                <h4 className="text-base font-semibold text-gray-800 mb-3">{q.text}</h4>
                <div className="bg-white p-3 rounded border border-gray-200 mb-2">
                  <p className="text-sm text-gray-700 italic">
                    {Array.isArray(q.answer) ? q.answer.join(", ") : (q.answer || "N/A")}
                  </p>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs font-medium text-gray-400">Score</span>
                  <span className="text-sm font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                    {q.score}/100
                  </span>
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
                <audio key={evaluation.audioUrl} src={evaluation.audioUrl} controls className="w-full h-10 custom-audio-player">
                  Your browser does not support the audio element.
                </audio>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (isLoadingProfile && !data) return <div className="p-8 text-center text-gray-500 font-medium">Loading...</div>;

  const inputStyles = "w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm";

  return (
    <div className="bg-gray-50 min-h-screen w-full p-4 md:p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-4xl font-bold mb-8">Fundi Experience</h1>

        {data?.experienceStatusReason && (
          <Alert variant={data.experienceStatus === "PENDING" ? "default" : "destructive"} className={data.experienceStatus === "PENDING" ? "bg-amber-200 mb-6" : "mb-6"}>
            <InfoIcon className="h-4 w-4" />
            <AlertTitle>Status Update</AlertTitle>
            <AlertDescription>
              {getStatusMessage(data.experienceStatusReason)}
            </AlertDescription>
          </Alert>
        )}

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
                <select
                  value={skill}
                  onChange={e => {
                    setSkill(e.target.value);
                    setSpecialization(""); // Reset specialization when skill changes
                  }}
                  disabled={isReadOnly}
                  className={inputStyles}
                >
                  <option value="">Select Skill</option>
                  {FUNDI_SKILLS.map(s => (
                    <option key={s} value={s}>
                      {s.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </option>
                  ))}
                  {skill && !FUNDI_SKILLS.includes(skill) && (
                    <option key={skill} value={skill}>{skill}</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
                <select
                  value={specialization}
                  onChange={e => setSpecialization(e.target.value)}
                  disabled={isReadOnly || !skill}
                  className={inputStyles}
                >
                  <option value="">Select Specialization</option>
                  {(FUNDI_SPECIALIZATIONS[skill as keyof typeof FUNDI_SPECIALIZATIONS] || []).map(spec => (
                    <option key={spec} value={spec}>{spec}</option>
                  ))}
                  {specialization && !(FUNDI_SPECIALIZATIONS[skill as keyof typeof FUNDI_SPECIALIZATIONS] || []).includes(specialization) && (
                    <option key={specialization} value={specialization}>{specialization}</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
                <select
                  value={grade}
                  onChange={e => setGrade(e.target.value)}
                  disabled={isReadOnly}
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
                  disabled={isReadOnly}
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
                          disabled={isReadOnly || isSubmitting}
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
                        {row.files.length < 3 && !isReadOnly && (
                          <input
                            type="file"
                            accept="image/*"
                            onChange={e => handleFileChange(row.id, e.target.files?.[0] || null)}
                            disabled={isSubmitting}
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

          {!isReadOnly && (
            <div className="flex justify-end">
              <button
                disabled={isSubmitting}
                className="bg-blue-700 hover:bg-blue-800 text-white px-8 py-3 rounded-lg font-bold shadow-md transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
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