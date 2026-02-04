/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { XMarkIcon, EyeIcon } from "@heroicons/react/24/outline";

interface FundiAttachment {
  id: number;
  projectName: string;
  files: string[];
}

const STORAGE_KEY = "fundi_experience";

const saveToStorage = (data: any) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

const loadFromStorage = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};


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
  { id: 1, projectName: "Central Mall Renovation", files: [] },
  { id: 2, projectName: "River Bridge Construction", files: [] },
  { id: 3, projectName: "School Classroom Setup", files: [] },
];

const FundiExperience = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [attachments, setAttachments] = useState<FundiAttachment[]>(prefilledAttachments);
  const [grade, setGrade] = useState("G1: Master Fundi");
  const [experience, setExperience] = useState("10+ years");
  const [visibleProjectRows, setVisibleProjectRows] = useState(requiredProjectsByGrade[grade]);
  const [specialization, setSpecialization] = useState("");

  const isReadOnly = false;

useEffect(() => {
  const saved = loadFromStorage();
  if (saved) {
    setGrade(saved.grade ?? "G1: Master Fundi");
    setExperience(saved.experience ?? "10+ years");
    setSpecialization(saved.specialization ?? "");
    setAttachments(saved.attachments ?? prefilledAttachments);
  }
  setIsLoadingProfile(false);
}, []);


  useEffect(() => {
    setVisibleProjectRows(requiredProjectsByGrade[grade] || 0);
  }, [grade]);

  useEffect(() => {
    saveToStorage({ grade, experience, specialization, attachments });
  }, [grade, experience, specialization, attachments]);

  const handleFileChange = (rowId: number, file: File | null) => {
    if (!file) return;
    const preview = URL.createObjectURL(file);

    setAttachments(prev =>
      prev.map(item =>
        item.id === rowId && item.files.length < 3
          ? { ...item, files: [...item.files, preview] }
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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const required = requiredProjectsByGrade[grade];
    const valid = attachments
      .slice(0, required)
      .filter(a => a.projectName.trim() && a.files.length > 0);

    if (valid.length < required) {
      return toast.error(`Please add ${required} complete project(s).`);
    }

    saveToStorage({ grade, experience, specialization, attachments });
    toast.success("Experience saved locally!");
    setIsSubmitting(false);
  };

  if (isLoadingProfile) return <div className="p-8 text-center">Loading...</div>;

  const inputStyles = "w-full p-3 border rounded-lg";

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


        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="bg-gray-50 p-6 rounded-xl border">
            <div className="grid md:grid-cols-4 gap-6">
              <div>
                <label>Skill</label>
                <input value="Plumber" readOnly className="w-full p-3 bg-gray-200 rounded-lg" />
              </div>

              <div>
                <label>Specialization</label>
                <select value={specialization} onChange={e => setSpecialization(e.target.value)} className={inputStyles}>
                  <option value="">Select</option>
                  {fundiSpecializations.map(spec => (
                    <option key={spec}>{spec}</option>
                  ))}
                </select>
              </div>

              <div>
                <label>Grade</label>
                <select value={grade} onChange={e => setGrade(e.target.value)} className={inputStyles}>
                  {Object.keys(requiredProjectsByGrade).map(g => (
                    <option key={g}>{g}</option>
                  ))}
                </select>
              </div>

              <div>
                <label>Experience</label>
                <select value={experience} onChange={e => setExperience(e.target.value)} className={inputStyles}>
                  {["10+ years", "5-10 years", "3-5 years", "1-3 years"].map(exp => (
                    <option key={exp}>{exp}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <table className="w-full border">
            <tbody>
              {attachments.slice(0, visibleProjectRows).map(row => (
                <tr key={row.id}>
                  <td className="p-2">{row.id}</td>
                  <td className="p-2">
                    <input
                      value={row.projectName}
                      onChange={e => handleProjectNameChange(row.id, e.target.value)}
                      className="w-full p-2 border"
                    />
                  </td>
                  <td className="p-2">
                    {row.files.map((f, i) => (
                      <div key={i} className="flex justify-between">
                        <a href={f} target="_blank"><EyeIcon className="w-4 h-4" /></a>
                        <button type="button" onClick={() => removeFile(row.id, i)}>
                          <XMarkIcon className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    ))}
                    {row.files.length < 3 && (
                      <input type="file" onChange={e => handleFileChange(row.id, e.target.files?.[0] || null)} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <button disabled={isSubmitting} className="bg-blue-700 text-white px-6 py-3 rounded">
            Save Experience
          </button>
        </form>
      </div>
    </div>
  );
};

export default FundiExperience;
