/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import toast from 'react-hot-toast';
import { XMarkIcon, EyeIcon } from "@heroicons/react/24/outline";
import { updateFundiExperience } from "@/api/experience.api";
import { uploadFile } from "@/utils/fileUpload";
import { getProviderProfile } from "@/api/provider.api";
import { useGlobalContext } from "@/context/GlobalProvider";
import useAxiosWithAuth from "@/utils/axiosInterceptor";

interface FundiAttachment {
  id: number;
  projectName: string;
  files: (File | string)[];
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

// Prefilled projects tailored for a Plumber
const prefilledAttachments: FundiAttachment[] = [
  {
    id: 1,
    projectName: "Central Mall Renovation",
    files: [
      "https://example.com/mall1.jpg",
    ],
  },
  {
    id: 2,
    projectName: "River Bridge Construction",
    files: ["https://example.com/bridge1.jpg"],
  },
  {
    id: 3,
    projectName: "School Classroom Setup",
     files: ["https://example.com/mall2.jpg"]
    
  }
];

const FundiExperience = () => {
  const { user } = useGlobalContext();
  const axiosInstance = useAxiosWithAuth(import.meta.env.VITE_SERVER_URL);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [attachments, setAttachments] = useState<FundiAttachment[]>(prefilledAttachments);
  const [grade, setGrade] = useState("G1: Master Fundi");
  const [experience, setExperience] = useState("10+ years");
  const [evaluationResults, setEvaluationResults] = useState<any>(null);
  const [visibleProjectRows, setVisibleProjectRows] = useState(requiredProjectsByGrade[grade]);
  const [specialization, setSpecialization] = useState("");

  const isReadOnly = user?.adminApproved === true;

  useEffect(() => {
    const fetchExperience = async () => {
      try {
        const response = await getProviderProfile(axiosInstance, user.id);
        if (response.success && response.data) {
          const data = response.data.userProfile;
          if (data.grade) setGrade(data.grade);
          if (data.experience) setExperience(data.experience);
          if (data.specialization) setSpecialization(data.specialization);

          if (data.fundiEvaluation) setEvaluationResults(data.fundiEvaluation);
          if (data.previousJobPhotoUrls && data.previousJobPhotoUrls.length > 0) {
            const groupedProjects = data.previousJobPhotoUrls.reduce((acc: any, item: any) => {
              acc[item.projectName] = acc[item.projectName] || [];
              acc[item.projectName].push(item.fileUrl);
              return acc;
            }, {});
            const populatedAttachments = Object.entries(groupedProjects).map(([projectName, files], index) => ({
              id: index + 1,
              projectName,
              files: files as string[],
            }));
            while (populatedAttachments.length < 3) {
              populatedAttachments.push({ id: populatedAttachments.length + 1, projectName: "", files: [] });
            }
            setAttachments(populatedAttachments);
          }
        }
      } catch (error) {
        console.error("Failed to fetch fundi experience:", error);
        toast.error("Could not load your existing experience data.");
      } finally {
        setIsLoadingProfile(false);
      }
    };
    fetchExperience();
  }, [user.id]);

  useEffect(() => {
    setVisibleProjectRows(requiredProjectsByGrade[grade] || 0);
  }, [grade]);

  const handleFileChange = (rowId: number, file: File | null) => {
    if (!file) return;
    setAttachments(prev =>
      prev.map(item =>
        item.id === rowId && item.files.length < 3
          ? { ...item, files: [...item.files, file] }
          : item
      )
    );
  };

  const removeFile = async (rowId: number, fileIndex: number) => {
    const updatedAttachments = attachments.map(item => {
      if (item.id === rowId) {
        const newFiles = [...item.files];
        newFiles.splice(fileIndex, 1);
        return { ...item, files: newFiles };
      }
      return item;
    });

    const deletePromise = async () => {
      const projectsWithData = updatedAttachments.filter(att => att.projectName.trim() !== "" && att.files.length > 0);
      const allFilePromises = projectsWithData.flatMap(project =>
        project.files.map(file =>
          file instanceof File ? uploadFile(file).then(up => ({ projectName: project.projectName, fileUrl: up.url })) : Promise.resolve({ projectName: project.projectName, fileUrl: file })
        )
      );
      const previousJobPhotoUrls = await Promise.all(allFilePromises);
      await updateFundiExperience(axiosInstance, { skill: "Plumber", grade, experience, previousJobPhotoUrls });
    };

    try {
      await toast.promise(deletePromise(), {
        loading: "Deleting file...",
        success: "File deleted successfully!",
        error: (err: any) => err.response?.data?.message || "Failed to delete file.",
      });
      setAttachments(updatedAttachments);
    } catch (error) {
      console.error(error);
    }
  };

  const handleProjectNameChange = (rowId: number, name: string) => {
    setAttachments(prev => prev.map(item => item.id === rowId ? { ...item, projectName: name } : item));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isReadOnly) return toast.error("Your approved profile cannot be modified.");
    if (!grade || !experience) return toast.error("Please select a grade and experience.");

    const requiredProjects = requiredProjectsByGrade[grade] || 0;
    const submittedProjects = attachments.slice(0, requiredProjects).filter(att => att.projectName.trim() !== "" && att.files.length > 0);

    if (submittedProjects.length < requiredProjects) {
      return toast.error(`Please add ${requiredProjects} project(s) for the "${grade.split(':')[1].trim()}" grade.`);
    }

    setIsSubmitting(true);

    const submissionPromise = async () => {
      const allFilePromises = submittedProjects.flatMap(project =>
        project.files.map(file =>
          file instanceof File ? uploadFile(file).then(up => ({ projectName: project.projectName, fileUrl: up.url })) : Promise.resolve({ projectName: project.projectName, fileUrl: file })
        )
      );
      const previousJobPhotoUrls = await Promise.all(allFilePromises);
     await updateFundiExperience(axiosInstance, {
        skill: "Plumber",
        specialization,
        grade,
        experience,
        previousJobPhotoUrls,
      });
    };

    try {
      await toast.promise(submissionPromise(), {
        loading: "Processing your submission...",
        success: "Experience updated successfully!",
        error: (err: any) => err.response?.data?.message || "Failed to update experience.",
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
      
      // ✅ NEW: Trigger sidebar to update completion status
      window.dispatchEvent(new Event('storage'));
    }
  };

  if (isLoadingProfile) return <div className="flex items-center justify-center p-8">Loading...</div>;

  const inputStyles = "w-full p-3 border rounded-lg disabled:bg-gray-100 disabled:cursor-not-allowed";

  return (
    <div className="bg-gray-50 min-h-screen w-full p-4 md:p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-4xl font-bold mb-8 text-gray-800">Fundi Experience</h1>
        <form className="space-y-4" onSubmit={handleSubmit}>
          {isReadOnly && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg text-sm">
              Your profile has been approved and is read-only. Contact support for changes.
            </div>
          )}
          <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
            <h2 className="text-xl font-semibold mb-6 text-gray-800">Fundi Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Skill</label>
                <input type="text" value="Plumber" readOnly className="w-full p-3 bg-gray-200 text-gray-700 border rounded-lg" />
              </div>
              <div>
              <label className="text-sm font-medium">Specializational</label>
              <select
                value={specialization}
                onChange={e => setSpecialization(e.target.value)}
                className={inputStyles}
                disabled={isReadOnly}
              >
                <option value="">Select Specialization</option>
                {fundiSpecializations.map(spec => (
                  <option key={spec} value={spec}>
                    {spec}
                  </option>
                ))}
              </select>
            </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Grade</label>
                <select value={grade} onChange={e => setGrade(e.target.value)} className={inputStyles} disabled={isReadOnly}>
                  <option value="" disabled>Select Grade</option>
                  {Object.keys(requiredProjectsByGrade).map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Experience</label>
                <select value={experience} onChange={e => setExperience(e.target.value)} className={inputStyles} disabled={isReadOnly}>
                  <option value="" disabled>Select Years</option>
                  {["10+ years","5-10 years",  "3-5 years", "1-3 years"].map(exp => <option key={exp} value={exp}>{exp}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto border rounded-xl p-4 bg-gray-50">
            <legend className="text-xl font-semibold mb-4 px-2 text-gray-700">Previous Projects</legend>
            {visibleProjectRows > 0 ? (
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-gray-100 text-left text-sm font-semibold text-gray-600">
                    <th className="px-4 py-3 w-[10%]">No.</th>
                    <th className="px-4 py-3 w-[40%]">Project Name</th>
                    <th className="px-4 py-3 w-[50%]">Photos (Max 3)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-sm">
                  {attachments.slice(0, visibleProjectRows).map(row => (
                    <tr key={row.id} className="hover:bg-gray-100 align-top">
                      <td className="px-4 py-4 font-semibold text-gray-500">{row.id}</td>
                      <td className="px-4 py-4">
                        <input type="text" value={row.projectName} onChange={e => handleProjectNameChange(row.id, e.target.value)} placeholder="Enter project name" className="w-full p-2 border rounded-lg" disabled={isReadOnly} />
                      </td>
                      <td className="px-4 py-4 space-y-2">
                        {row.files.map((file, index) => (
                          <div key={index} className="flex items-center justify-between gap-2 bg-gray-100 p-2 rounded-lg">
                            <span className="text-xs text-gray-700 truncate">{typeof file === 'string' ? new URL(file).pathname.split('/').pop() : file.name}</span>
                            <div className="flex items-center gap-2">
                              {typeof file === 'string' && <a href={file} target="_blank" rel="noopener noreferrer"><EyeIcon className="w-5 h-5 text-blue-600" /></a>}
                              {!isReadOnly && <button type="button" onClick={() => removeFile(row.id, index)}><XMarkIcon className="w-5 h-5 text-red-500" /></button>}
                            </div>
                          </div>
                        ))}
                        {!isReadOnly && row.files.length < 3 && <input type="file" accept="image/*" onChange={e => handleFileChange(row.id, e.target.files?.[0])} className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200" />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-8 text-gray-500">No project uploads required for this grade.</div>
            )}
          </div>

          {!isReadOnly && (
            <div className="mt-6 pt-4 text-right border-t">
              <button type="submit" disabled={isSubmitting} className="bg-blue-800 text-white px-8 py-3 rounded-md hover:bg-blue-900 transition disabled:opacity-50 font-semibold">
                {isSubmitting ? "Submitting..." : "Submit Experience"}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
    
  );
};

export default FundiExperience;








