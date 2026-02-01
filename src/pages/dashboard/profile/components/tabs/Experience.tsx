/* eslint-disable no-case-declarations */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/ban-ts-comment */
//@ts-nocheck
import { useState, useEffect } from "react";
import {
  ArrowDownTrayIcon,
  XMarkIcon,
  PencilIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { UploadCloud, FileText } from "lucide-react";

import { SquarePen } from "lucide-react";
import { toast, Toaster } from "sonner";

// --- Helper: deep merge objects ---
const deepMerge = (target: any, source: any): any => {
  const result = { ...target };
  for (const key in source) {
    if (source[key] && typeof source[key] === "object" && !Array.isArray(source[key])) {
      result[key] = deepMerge(result[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
};

// --- Helper: update a user in all localStorage arrays ---
const updateUserInLocalStorage = (
  userId: string,
  updates: Record<string, any>,
) => {
  try {
    // Update "users" array
    const storedUsers = JSON.parse(localStorage.getItem("users") || "[]");
    const userIdx = storedUsers.findIndex((u: any) => u.id === userId);
    if (userIdx !== -1) {
      storedUsers[userIdx] = deepMerge(storedUsers[userIdx], updates);
      localStorage.setItem("users", JSON.stringify(storedUsers));
    }

    // Update "builders" array
    const storedBuilders = JSON.parse(localStorage.getItem("builders") || "[]");
    const builderIdx = storedBuilders.findIndex((u: any) => u.id === userId);
    if (builderIdx !== -1) {
      storedBuilders[builderIdx] = deepMerge(storedBuilders[builderIdx], updates);
      localStorage.setItem("builders", JSON.stringify(storedBuilders));
    }

    // Update "customers" array
    const storedCustomers = JSON.parse(localStorage.getItem("customers") || "[]");
    const customerIdx = storedCustomers.findIndex((u: any) => u.id === userId);
    if (customerIdx !== -1) {
      storedCustomers[customerIdx] = deepMerge(storedCustomers[customerIdx], updates);
      localStorage.setItem("customers", JSON.stringify(storedCustomers));
    }

    // Update "user" single object
    const singleUser = JSON.parse(localStorage.getItem("user") || "null");
    if (singleUser && singleUser.id === userId) {
      const updatedUser = deepMerge(singleUser, updates);
      localStorage.setItem("user", JSON.stringify(updatedUser));
    }

    // Update "profile" single object
    const profileUser = JSON.parse(localStorage.getItem("profile") || "null");
    if (profileUser && profileUser.id === userId) {
      const updatedProfile = deepMerge(profileUser, updates);
      localStorage.setItem("profile", JSON.stringify(updatedProfile));
    }
  } catch (err) {
    console.error("Failed to update user in localStorage:", err);
    throw err;
  }
};

const Experience = ({ userData }) => {
  console.log("User Data: ", userData);
  // const axiosInstance = useAxiosWithAuth(import.meta.env.VITE_SERVER_URL)
  const [isEditingFields, setIsEditingFields] = useState(false);
  const [editingFields, setEditingFields] = useState({});

  // Loading States
  const [isSavingInfo, setIsSavingInfo] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [fileActionLoading, setFileActionLoading] = useState({});

  // Get user type from userData
  const userType = userData?.userType || "FUNDI";
  const status = userData?.status;

  // Statuses that should prefill/show existing data
  const PREFILL_STATUSES = ["COMPLETED", "VERIFIED", "PENDING", "RETURNED"];

  // Initialize attachments based on user type
  const getInitialAttachments = () => {
    // For SIGNED_UP or INCOMPLETE, return empty attachments
    if (!PREFILL_STATUSES.includes(status)) {
      return [];
    }

    let projectData = [];

    switch (userType) {
      case "FUNDI":
        projectData = userData?.userProfile?.previousJobPhotoUrls || [];
        break;
      case "PROFESSIONAL":
        projectData = userData?.userProfile?.professionalProjects || [];
        break;
      case "CONTRACTOR":
        projectData = userData?.userProfile?.contractorProjects || [];
        break;
      case "HARDWARE":
        projectData = userData?.userProfile?.hardwareProjects || [];
        break;
      default:
        projectData = userData?.userProfile?.previousJobPhotoUrls || [];
    }

    if (!projectData || projectData.length === 0) {
      return [];
    }

    return projectData.map((project, index) => ({
      id: index + 1,
      projectName: project.projectName || `${userType} Project ${index + 1}`,
      files: [
        {
          name: `${project.projectName || `${userType} Project ${index + 1}`}.jpg`,
          url: project.fileUrl || project?.projectFile,
        },
      ],
    }));
  };

  const profileUploaded = (userData) => {
    switch (userData?.userType) {
      case "FUNDI":
        return (
          userData?.userProfile?.previousJobPhotoUrls &&
          userData?.userProfile?.previousJobPhotoUrls.length > 0
        );
      case "PROFESSIONAL":
        return userData?.userProfile?.professionalLevel;
      case "CONTRACTOR":
        return (
          userData?.userProfile?.contractorProjects &&
          userData?.userProfile?.contractorProjects.length > 0
        );
      case "HARDWARE":
        return (
          userData?.userProfile?.hardwareProjects &&
          userData?.userProfile?.hardwareProjects.length > 0
        );
      default:
        return false;
    }
  };

  // Get project field name based on user type
  const getProjectFieldName = () => {
    switch (userType) {
      case "FUNDI":
        return "Previous Job Photos";
      case "PROFESSIONAL":
        return "Professional Projects";
      case "CONTRACTOR":
        return "Contractor Projects";
      case "HARDWARE":
        return "Hardware Projects";
      default:
        return "Projects";
    }
  };
  type ContractorCategory = {
  category: string;
  specialization: string;
  class: string;
  years: string;
  projectFile?: File;
  referenceFile?: File;
};

const CATEGORY_OPTIONS = [
  "Building Works",
  "Water Works",
  "Electrical Works",
  "Mechanical Works",
];

  const [attachments, setAttachments] = useState(getInitialAttachments());
  const [uploadingProjects, setUploadingProjects] = useState<{
    [key: string]: boolean;
  }>({});
  const [newProjects, setNewProjects] = useState<{ [key: string]: any }>({});
const [categories, setCategories] = useState<ContractorCategory[]>([
  {
    category: "",
    specialization: "",
    class: "",
    years: "",
  },
]);
const addCategory = () => {
  setCategories([
    ...categories,
    {
      category: "",
      specialization: "",
      class: "",
      years: "",
    },
  ]);
};

const removeCategory = (index: number) => {
  setCategories(categories.filter((_, i) => i !== index));
};

  // Initialize info from userData.userProfile based on user type
  const getInitialInfo = () => {
    // For SIGNED_UP or INCOMPLETE, return default empty values
    if (!PREFILL_STATUSES.includes(status)) {
      return getDefaultInfo();
    }

    if (!userData?.userProfile) {
      return getDefaultInfo();
    }

    switch (userType) {
      case "FUNDI":
        return {
          skill:
            userData.userProfile.skill || userData.skills || "Not Provided",
          grade: userData.userProfile.grade || "Not Provided",
          experience: userData.userProfile.experience || "Not Provided",
        };

      case "PROFESSIONAL":
        return {
          profession:
            userData.userProfile.profession ||
            userData.profession ||
            "Not Provided",
          professionalLevel:
            userData.userProfile.professionalLevel || "Not Provided",
          yearsOfExperience:
            userData.userProfile.yearsOfExperience || "Not Provided",
        };

      case "CONTRACTOR":
        return {
          contractorType:
            userData.userProfile.contractorType ||
            userData.contractorTypes ||
            "Not Provided",
          licenseLevel: userData.userProfile.licenseLevel || "Not Provided",
          experience:
            userData.userProfile.contractorExperiences ||
            userData?.contractorExperiences ||
            "Not Provided",
        };

      case "HARDWARE":
        return {
          hardwareType:
            userData.userProfile.hardwareType ||
            userData.hardwareTypes ||
            "Not Provided",
          businessType: userData.userProfile.businessType || "Not Provided",
          experience: userData.userProfile.experience || "Not Provided",
        };

      default:
        return getDefaultInfo();
    }
  };

  const getDefaultInfo = () => {
    return {
      skill: "Not Provided",
      grade: "Not Provided",
      experience: "Not Provided",
    };
  };

  const [info, setInfo] = useState(getInitialInfo());

  // Dynamic field configurations based on user type
  const getFieldsConfig = () => {
    switch (userType) {
      case "FUNDI":
        return [
          {
            name: "skill",
            label: "Skill",
            options: [
              "Mason",
              "Electrician",
              "Plumber",
              "Carpenter",
              "Painter",
            ],
          },
          {
            name: "grade",
            label: "Grade",
            options: [
              "G1: Master Fundi",
              "G2: Skilled",
              "G3: Semi-skilled",
              "G4: Unskilled",
            ],
          },
          {
            name: "experience",
            label: "Experience",
            options: ["5+ years", "3-5 years", "1-3 years"],
          },
        ];

      case "PROFESSIONAL":
        return [
          {
            name: "profession",
            label: "Profession",
            options: [
              "Project Manager",
              "Architect",
              "Water Engineer",
              "Roads Engineer",
              "Structural Engineer",
              "Mechanical Engineer",
            ],
            
          },
            {
            name: "Specialization",
            label: "Specialization",
            options: [
              "Architect",
              "Residential",
              "Commercial",
              "Industrial",
            ],
            },
          {
            name: "professionalLevel",
            label: "Professional Level",
            options: ["Graduate", "Student", "Senior", "Professional"],
          },
          {
            name: "yearsOfExperience",
            label: "Years of Experience",
            options: ["5+ years", "3-5 years", "1-3 years"],
          },
        ];

      case "CONTRACTOR":
        return [
          {
            name: "category",
            label: "category",
            options: [
              "Building Works",
              "Water Engineer",
              "Roads Engineer",
              "Mechanical Engineer",
            ],
            
          },
            {
            name: "Specialization",
            label: "Specialization",
            options: [
              "Sanitation",
              "drainage",
              "hydrological",
            ],
            },
          {
            name: "class",
            label: "class",
            options: ["NCA1", "NCA2", "NCA3", "NCA4"],
          },
          {
            name: "yearsOfExperience",
            label: "Years of Experience",
            options: ["10+ years", "5+ years", "3-5 years", "1-3 years"],
          },
        ];

      case "HARDWARE":
        return [
          {
            name: "hardwareType",
            label: "Hardware Type",
            options: [
              "Building Materials",
              "Tools & Equipment",
              "Electrical Supplies",
            ],
          },
          {
            name: "businessType",
            label: "Business Type",
            options: ["Retail Store", "Wholesale Supplier"],
          },
          {
            name: "experience",
            label: "Business Experience",
            options: ["10+ years", "5-10 years", "3-5 years", "1-3 years"],
          },
        ];

      default:
        return [
          {
            name: "skill",
            label: "Skill",
            options: [
              "Mason",
              "Electrician",
              "Plumber",
              "Carpenter",
              "Painter",
            ],
          },
          {
            name: "grade",
            label: "Grade",
            options: [
              "G1: Master Fundi",
              "G2: Skilled",
              "G3: Semi-skilled",
              "G4: Unskilled",
            ],
          },
          {
            name: "experience",
            label: "Experience",
            options: ["5+ years", "3-5 years", "1-3 years"],
          },
        ];
    }
  };

  const fields = getFieldsConfig();

  // --- END ORIGINAL ---

  // --- localStorage-based file upload (using local object URLs) ---
  const handleFileUpload = (e, rowIndex) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length === 0) return;

    const loadingKey = `add-${rowIndex}`;
    setFileActionLoading((prev) => ({ ...prev, [loadingKey]: true }));

    const toastId = toast.loading("Processing files...");

    let updatedAttachments;
    setAttachments((prev) => {
      const newAttachments = [...prev];
      newAttachments[rowIndex].files.push(
        ...selectedFiles.map((file) => ({
          name: file.name,
          url: URL.createObjectURL(file),
        })),
      );
      updatedAttachments = newAttachments;
      return newAttachments;
    });

    // Persist to localStorage
    updateUserProjects(updatedAttachments);
    toast.success("Files added successfully!", { id: toastId });
    setFileActionLoading((prev) => ({ ...prev, [loadingKey]: false }));
  };

  // Get required project count based on user type and level
  const getRequiredProjectCount = () => {
    switch (userType) {
      case "FUNDI":
        const grade = userData?.userProfile?.grade || "";
        if (grade === "G1: Master Fundi") return 3;
        if (grade === "G2: Skilled") return 2;
        if (grade === "G3: Semi-skilled") return 1;
        if (grade === "G4: Unskilled") return 0;
        return 0; // default for unknown grades
      case "PROFESSIONAL":
        const level =
          userData?.userProfile?.professionalLevel ||
          userData?.userProfile?.level ||
          "";
        if (level === "Senior") return 3;
        if (level === "Professional") return 2;
        if (level === "Graduate") return 1;
        if (level === "Student") return 0;
        return 0; // default for unknown levels
      case "CONTRACTOR":
        return 1; // Standard for contractors
      case "HARDWARE":
        return 2; // Standard for hardware
      default:
        return 0;
    }
  };

  const requiredProjectCount = getRequiredProjectCount();
  const missingProjectCount = Math.max(
    0,
    requiredProjectCount - attachments.length,
  );

  // --- localStorage-based add new project ---
  const handleAddNewProject = (
    projectId: string,
    projectName: string,
    files: File[],
  ) => {
    if (!projectName.trim()) {
      toast.error("Please enter a project name");
      return;
    }
    if (files.length === 0) {
      toast.error("Please select at least one file");
      return;
    }

    setUploadingProjects((prev) => ({ ...prev, [projectId]: true }));

    const newProject = {
      id: attachments.length + 1,
      projectName: projectName.trim(),
      files: files.map((file) => ({
        name: file.name,
        url: URL.createObjectURL(file),
      })),
    };

    setAttachments((prev) => [...prev, newProject]);
    updateUserProjects([...attachments, newProject]);
    toast.success(`${projectName} added successfully!`);
    setNewProjects((prev) => ({
      ...prev,
      [projectId]: { name: "", files: [] },
    }));
    setUploadingProjects((prev) => ({ ...prev, [projectId]: false }));
  };

  // --- END ORIGINAL ---

  // --- localStorage-based updateUserProjects ---
  const updateUserProjects = (updatedAttachments) => {
    try {
      const profile = userData?.userProfile || {};
      const cleanAttachments = updatedAttachments
        .filter((project) => project && project.projectName)
        .map((project) => ({
          id: project.id,
          projectName: project.projectName.trim(),
          files: project.files.filter(
            (file) => file && file.url && file.url.trim(),
          ),
        }))
        .filter((project) => project.files.length > 0);

      console.log(
        "Saving clean attachments to localStorage:",
        cleanAttachments,
      );

      const projectData = cleanAttachments.flatMap((project) =>
        project.files.map((file) => ({
          projectName: project.projectName,
          fileUrl: file.url,
          projectFile: file.url,
        })),
      );

      const profileKey =
        userType === "FUNDI"
          ? "previousJobPhotoUrls"
          : userType === "PROFESSIONAL"
            ? "professionalProjects"
            : userType === "CONTRACTOR"
              ? "contractorProjects"
              : "hardwareProjects";

      const updatedProfile = { ...profile, [profileKey]: projectData };
      userData.userProfile = updatedProfile;
      updateUserInLocalStorage(userData.id, { userProfile: updatedProfile });
    } catch (error) {
      console.error("Update projects error:", error);
      throw error;
    }
  };

  // --- localStorage-based replace file ---
  const handleReplaceFile = (e, rowIndex, fileIndex) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const toastId = toast.loading("Replacing file...");

    let updatedAttachments;
    setAttachments((prev) => {
      const newAttachments = [...prev];
      if (
        newAttachments[rowIndex] &&
        newAttachments[rowIndex].files &&
        newAttachments[rowIndex].files[fileIndex]
      ) {
        newAttachments[rowIndex].files[fileIndex] = {
          name: file.name,
          url: URL.createObjectURL(file),
        };
      }
      updatedAttachments = newAttachments;
      return newAttachments;
    });

    e.target.value = "";
    updateUserProjects(updatedAttachments);
    toast.success("File replaced successfully!", { id: toastId });
  };

  // --- localStorage-based remove file ---
  const handleRemoveFile = (rowIndex, fileIndex) => {
    const loadingKey = `remove-${rowIndex}-${fileIndex}`;
    setFileActionLoading((prev) => ({ ...prev, [loadingKey]: true }));
    const toastId = toast.loading("Removing file...");

    let updatedAttachments;
    setAttachments((prev) => {
      const newAttachments = [...prev];
      if (newAttachments[rowIndex] && newAttachments[rowIndex].files) {
        newAttachments[rowIndex].files.splice(fileIndex, 1);
        if (newAttachments[rowIndex].files.length === 0) {
          newAttachments.splice(rowIndex, 1);
        }
      }
      updatedAttachments = newAttachments;
      return newAttachments;
    });

    updateUserProjects(updatedAttachments);
    toast.success("File removed successfully!", { id: toastId });
    setFileActionLoading((prev) => ({ ...prev, [loadingKey]: false }));
  };

  // Same evaluation questions for all user types
  const getEvaluationQuestions = () => {
    return [
      {
        id: 1,
        text: "Have you done any major works in the construction industry?",
        type: "select",
        options: ["Yes", "No"],
        answer: "",
        score: 0,
        isEditing: false,
      },
      {
        id: 2,
        text: "State the materials that you have been using mostly for your jobs",
        type: "text",
        answer: "",
        score: 0,
        isEditing: false,
      },
      {
        id: 3,
        text: "Name essential equipment that you have been using for your job",
        type: "text",
        answer: "",
        score: 0,
        isEditing: false,
      },
      {
        id: 4,
        text: "How do you always formulate your quotations?",
        type: "text",
        answer: "",
        score: 0,
        isEditing: false,
      },
    ];
  };

  const initialQuestions = getEvaluationQuestions();

  // Pre-populate questions with existing evaluation data (same structure for all user types)
  const getInitialQuestions = () => {
  const evaluation = userData?.userProfile?.fundiEvaluation;

  // If status should NOT prefill → return empty form
  if (!PREFILL_STATUSES.includes(status)) {
    return initialQuestions;
  }

  // If no evaluation exists → still return empty
  if (!evaluation) {
    return initialQuestions;
  }

  // Otherwise → prefill from evaluation
  return [
    {
      id: 1,
      text: "Have you done any major works in the construction industry?",
      type: "select",
      options: ["Yes", "No"],
      answer: evaluation.hasMajorWorks || "",
      score: evaluation.majorWorksScore || 0,
      isEditing: false,
    },
    {
      id: 2,
      text: "If yes, briefly describe them",
      type: "text",
      answer: evaluation.majorWorksDescription || "",
      score: evaluation.majorWorksDescScore || 0,
      isEditing: false,
    },
    {
      id: 3,
      text: "Do you always complete your projects on time?",
      type: "select",
      options: ["Yes", "No"],
      answer: evaluation.completesOnTime || "",
      score: evaluation.onTimeScore || 0,
      isEditing: false,
    },
    {
      id: 4,
      text: "How do you always formulate your quotations?",
      type: "text",
      answer: evaluation.quotationFormulation || "",
      score: evaluation.quotationFormulaScore || 0,
      isEditing: false,
    },
  ];
};


  const [questions, setQuestions] = useState(getInitialQuestions());

  // Initialize new projects state
  useEffect(() => {
    const initialNewProjects: { [key: string]: any } = {};
    for (let i = 0; i < Math.min(missingProjectCount, 3); i++) {
      initialNewProjects[`new_${i}`] = { name: "", files: [] };
    }
    setNewProjects(initialNewProjects);
  }, [missingProjectCount]);

  const handleTextChange = (id, value) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, answer: value } : q)),
    );
  };

  const handleScoreChange = (id, value) => {
    const num = parseFloat(value) || 0;
    if (num > 100) return;
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, score: num } : q)),
    );
  };

  const handleEditToggle = (id) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, isEditing: !q.isEditing } : q)),
    );
  };

  const handleQuestionEdit = (id, newText) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === id ? { ...q, text: newText, isEditing: false } : q,
      ),
    );
  };

  const totalScore =
    questions.length > 0
      ? questions.reduce((sum, q) => sum + q.score, 0) / questions.length
      : 0;

  const [showVerificationMessage, setShowVerificationMessage] = useState(false);
  const [audioUrl, setAudioUrl] = useState("");
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");

  // Load initial values from localStorage and userData
  useEffect(() => {
    // Check localStorage for verification message
    const stored = localStorage.getItem("showVerificationMessage");
    if (stored === "true") {
      setShowVerificationMessage(true);
    }

    // Check if user is already verified from userData (same source for all user types)
    const isVerified = userData?.userProfile?.fundiEvaluation?.isVerified;

    if (isVerified) {
      setShowVerificationMessage(true);
    }

    // Set audio URL if it exists in evaluation data (same source for all user types)
    const audioUrlFromData =
      userData?.userProfile?.fundiEvaluation?.audioUrl ||
      userData?.userProfile?.audioUploadUrl;

    if (audioUrlFromData) {
      setAudioUrl(audioUrlFromData);
      console.log("Existing audio file found:", audioUrlFromData);
    }
  }, [userData]);

  // --- localStorage-based verify ---
  const handleVerify = () => {
    setIsVerifying(true);
    const userId = userData.id;
    if (!userId) {
      alert("User ID not found.");
      setIsVerifying(false);
      return;
    }
    updateUserInLocalStorage(userId, { adminApproved: true, approved: true });
    Object.assign(userData, { adminApproved: true, approved: true });
    localStorage.setItem("showVerificationMessage", "true");
    setShowVerificationMessage(true);
    setIsVerifying(false);
  };

  // When close is clicked
  const handleClose = () => {
    localStorage.removeItem("showVerificationMessage");
    setShowVerificationMessage(false);
  };

  // --- localStorage-based audio upload (using local object URL) ---
  const handleAudioUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("audio/")) {
      alert("Please upload an audio file");
      return;
    }
    setIsUploadingAudio(true);
    const localUrl = URL.createObjectURL(file);
    setAudioUrl(localUrl);
    console.log("Audio stored locally:", localUrl);
    setIsUploadingAudio(false);
  };

  // --- localStorage-based evaluation submit ---
  const handleEvaluationSubmit = (e) => {
    console.log("handleEvaluationSubmit");
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage("");

    const profileId = userData?.id;
    if (!profileId) {
      setSubmitMessage("Profile ID not found.");
      setIsSubmitting(false);
      return;
    }

    const body = {
      hasMajorWorks: questions[0]?.answer || "Yes",
      materialsUsed: questions[1]?.answer || "",
      essentialEquipment: questions[2]?.answer || "",
      quotationFormulation: questions[3]?.answer || "",
      majorWorksScore: questions[0]?.score || 0,
      materialsUsedScore: questions[1]?.score || 0,
      essentialEquipmentScore: questions[2]?.score || 0,
      quotationFormulaScore: questions[3]?.score || 0,
      totalScore: totalScore,
      audioUrl: audioUrl || null,
    };

    // Persist evaluation to localStorage
    const profile = userData?.userProfile || {};
    const updatedProfile = {
      ...profile,
      fundiEvaluation: { ...body, isVerified: true },
    };
    userData.userProfile = updatedProfile;
    updateUserInLocalStorage(profileId, { userProfile: updatedProfile });

    setSubmitMessage("Evaluation submitted successfully!");
    setIsSubmitting(false);
  };

  // --- localStorage-based edit skill ---
  const handleEditSkill = (updatedFields) => {
    setIsSavingInfo(true);
    try {
      if (!userData?.id) {
        throw new Error("User ID not found");
      }
      const profile = userData?.userProfile || {};
      const updatedProfile = deepMerge(profile, updatedFields);
      userData.userProfile = updatedProfile;
      updateUserInLocalStorage(userData.id, { userProfile: updatedProfile });
      toast.success("Information updated successfully");
      setInfo((prevInfo) => deepMerge(prevInfo, updatedFields));
      setIsEditingFields(false);
    } catch (error) {
      toast.error("Failed to update information");
      console.error("Edit skill error:", error);
    } finally {
      setIsSavingInfo(false);
      
      // ✅ Trigger sidebar to update status (dispatch event so parent component recalculates)
      window.dispatchEvent(new Event('storage'));
    }
  };

  return (
    <div className="flex">
      <Toaster position="top-center" richColors />
      <div className="bg-gray-50 min-h-screen w-full">
        <div className="max-w-6xl bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-8 text-gray-800">
            {userData?.userType} Experience
          </h1>

          <form onSubmit={handleEvaluationSubmit} className="space-y-8">
            {/* Skills Section */}
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-800">
                  {userData?.userType} Information
                </h2>
                <button
                  type="button"
                  onClick={() => setIsEditingFields((prev) => !prev)}
                  className="focus:outline-none"
                  disabled={isSavingInfo}
                >
                  <SquarePen className="h-6 w-6 text-blue-700" />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                {fields.map((field, index) => (
                  <div key={index} className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      {field.label}
                    </label>
                    <div className="p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
                      {userType.toLowerCase() === "contractor" &&
                      field.name == "experience" ? (
                        <div className="overflow-x-auto">
                          <table className="w-full table-auto border-collapse text-xs">
                            <thead>
                              <tr className="bg-gray-100 text-left text-xs font-semibold text-gray-600">
                                <th className="px-2 py-2 border">Category</th>
                                <th className="px-2 py-2 border">Class</th>
                                <th className="px-2 py-2 border">Years</th>
                                <th className="px-2 py-2 border">
                                  Certificate
                                </th>
                                <th className="px-2 py-2 border">License</th>
                              </tr>
                            </thead>
                            <tbody>
                              {userData?.userProfile?.contractorExperiences?.map(
                                (exp, idx) => (
                                  <tr
                                    key={idx}
                                    className="border-b hover:bg-gray-50"
                                  >
                                    <td className="px-2 py-2 border text-xs">
                                      {typeof exp === "object"
                                        ? exp.category
                                        : exp}
                                    </td>
                                    <td className="px-2 py-2 border text-xs">
                                      {typeof exp === "object"
                                        ? exp.categoryClass
                                        : "N/A"}
                                    </td>
                                    <td className="px-2 py-2 border text-xs">
                                      {typeof exp === "object"
                                        ? exp.yearsOfExperience
                                        : "N/A"}
                                    </td>
                                    <td className="px-2 py-2 border text-xs">
                                      {typeof exp === "object" &&
                                      exp.certificate ? (
                                        <a
                                          href={exp.certificate}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-blue-600 hover:text-blue-800 underline"
                                        >
                                          View
                                        </a>
                                      ) : (
                                        "None"
                                      )}
                                    </td>
                                    <td className="px-2 py-2 border text-xs">
                                      {typeof exp === "object" &&
                                      exp.license ? (
                                        <a
                                          href={exp.license}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-blue-600 hover:text-blue-800 underline"
                                        >
                                          View
                                        </a>
                                      ) : (
                                        "None"
                                      )}
                                    </td>
                                  </tr>
                                ),
                              )}
                            </tbody>
                          </table>
                        </div>
                      ) : isEditingFields ? (
                        <select
                          value={editingFields[field.name] || info[field.name]}
                          onChange={(e) => {
                            setEditingFields((prev) => ({
                              ...prev,
                              [field.name]: e.target.value,
                            }));
                          }}
                          className="w-full p-2 border border-blue-300 rounded-md text-sm"
                        >
                          {field.options.map((opt, i) => (
                            <option key={i} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : (
                        info[field.name]
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {isEditingFields && (
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    className="bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => {
                      handleEditSkill(editingFields);
                    }}
                    disabled={isSavingInfo}
                  >
                    {isSavingInfo ? "Saving..." : "Save"}
                  </button>
                  <button
                    type="button"
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => setIsEditingFields(false)}
                    disabled={isSavingInfo}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {/* {userType} Project Attachments */}
            <div className="bg-white shadow-lg rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-800">
                    {getProjectFieldName()}
                  </h3>
                  {requiredProjectCount > 0 && (
                    <span className="text-sm text-gray-600">
                      {attachments.length} of {requiredProjectCount} required
                      projects
                    </span>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-gray-700">
                  <thead className="bg-gray-50 text-left">
                    <tr>
                      <th className="px-6 py-4 font-semibold">No.</th>
                      <th className="px-6 py-4 font-semibold">Project Name</th>
                      <th className="px-6 py-4 font-semibold">
                        Uploaded Files
                      </th>
                      <th className="px-6 py-4 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {/* Existing Projects */}
                    {attachments.length > 0 ? (
                      attachments.map((row, index) => (
                        <tr
                          key={row.id}
                          className="hover:bg-gray-50 transition"
                        >
                          <td className="px-6 py-4 text-gray-500">
                            {index + 1}
                          </td>
                          <td className="px-6 py-4 font-medium">
                            {row.projectName || `Unnamed ${userType} Project`}
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-2">
                              {row.files.length > 0 ? (
                                row.files.map((file, fileIndex) => {
                                  const isRemoving =
                                    fileActionLoading[
                                      `remove-${index}-${fileIndex}`
                                    ];
                                  return (
                                    <div
                                      key={fileIndex}
                                      className="flex items-center justify-between bg-gray-100 p-2 rounded-md shadow-sm"
                                    >
                                      <span className="truncate text-sm">
                                        {file.name}
                                      </span>
                                      <div className="flex space-x-2 items-center">
                                        <a
                                          href={file.url}
                                          download={file.name}
                                          className="text-blue-600 hover:text-blue-800"
                                          target="_blank"
                                          rel="noopener noreferrer"
                                        >
                                          <ArrowDownTrayIcon className="h-5 w-5" />
                                        </a>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleRemoveFile(index, fileIndex)
                                          }
                                          className="text-red-500 hover:text-red-700 disabled:opacity-50"
                                          disabled={isRemoving}
                                        >
                                          {isRemoving ? (
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                                          ) : (
                                            <XMarkIcon className="h-5 w-5" />
                                          )}
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })
                              ) : (
                                <span className="text-gray-400 text-sm">
                                  No files uploaded
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <input
                              type="file"
                              multiple
                              onChange={(e) => handleFileUpload(e, index)}
                              className="block w-full text-sm text-gray-500
                            file:mr-4 file:py-2 file:px-3
                            file:rounded-md file:border-0
                            file:bg-blue-600 file:text-white
                            hover:file:bg-blue-700
                            cursor-pointer disabled:opacity-50"
                              disabled={fileActionLoading[`add-${index}`]}
                            />
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center">
                          <div className="text-gray-500">
                            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            <p className="text-lg font-medium">
                              No projects added yet
                            </p>
                            <p className="text-sm">
                              Add projects below to showcase the user's
                              experience
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Add New Projects Section */}
              {missingProjectCount > 0 && (
                <div className="border-t border-gray-200 bg-blue-50">
                  <div className="px-6 py-4">
                    <h4 className="text-md font-semibold text-blue-900 mb-4">
                      Add Missing Projects ({missingProjectCount} remaining)
                    </h4>
                    <p className="text-sm text-blue-700 mb-4">
                      Add projects on behalf of the user to complete their
                      experience profile:
                    </p>

                    {Array.from(
                      { length: Math.min(missingProjectCount, 3) },
                      (_, index) => {
                        const projectId = `new_${index}`;
                        const project = newProjects[projectId] || {
                          name: "",
                          files: [],
                        };
                        const isLoading = uploadingProjects[projectId];

                        return (
                          <div
                            key={projectId}
                            className="mb-6 p-4 bg-white rounded-lg border border-blue-200"
                          >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Project Name
                                </label>
                                <input
                                  type="text"
                                  placeholder="Enter project name"
                                  value={project.name}
                                  onChange={(e) =>
                                    setNewProjects((prev) => ({
                                      ...prev,
                                      [projectId]: {
                                        ...project,
                                        name: e.target.value,
                                      },
                                    }))
                                  }
                                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Project Files
                                </label>
                                <div className="space-y-2">
                                  {project.files.map(
                                    (file: File, fileIndex: number) => (
                                      <div
                                        key={fileIndex}
                                        className="flex items-center justify-between bg-gray-100 p-2 rounded-md"
                                      >
                                        <span className="text-sm text-gray-700 truncate">
                                          {file.name}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const updatedFiles = [
                                              ...project.files,
                                            ];
                                            updatedFiles.splice(fileIndex, 1);
                                            setNewProjects((prev) => ({
                                              ...prev,
                                              [projectId]: {
                                                ...project,
                                                files: updatedFiles,
                                              },
                                            }));
                                          }}
                                          className="text-red-500 hover:text-red-700"
                                        >
                                          <XMarkIcon className="w-4 h-4" />
                                        </button>
                                      </div>
                                    ),
                                  )}
                                  <input
                                    type="file"
                                    multiple
                                    onChange={(e) => {
                                      const files = Array.from(
                                        e.target.files || [],
                                      );
                                      setNewProjects((prev) => ({
                                        ...prev,
                                        [projectId]: {
                                          ...project,
                                          files: [...project.files, ...files],
                                        },
                                      }));
                                    }}
                                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200"
                                  />
                                </div>
                              </div>
                            </div>
                            <div className="mt-4 flex justify-end">
                              {isLoading ? (
                                <div className="flex items-center gap-2 text-blue-600">
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                  <span className="text-sm">
                                    Adding project...
                                  </span>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleAddNewProject(
                                      projectId,
                                      project.name,
                                      project.files,
                                    )
                                  }
                                  disabled={
                                    !project.name.trim() ||
                                    project.files.length === 0 ||
                                    isLoading
                                  }
                                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <PlusIcon className="w-4 h-4" />
                                  <span className="text-sm font-medium">
                                    Add Project
                                  </span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      },
                    )}
                  </div>
                </div>
              )}
            </div>
            {/* Evaluation Criteria Instructions */}
            {userType.toLowerCase() === "fundi" &&
              !userData?.userProfile?.fundiEvaluation && (
                <h2 className="text-xl font-semibold mb-4 text-gray-800">
                  {userType} Evaluation Guidelines
                </h2>
              )}

            {/* Scoring Criteria Description */}
            {userType.toLowerCase() === "fundi" &&
              !userData?.userProfile?.fundiEvaluation && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
                  <h3 className="font-semibold text-blue-900 text-sm mb-2">
                    Scoring Criteria:
                  </h3>
                  <ul className="text-sm text-blue-800 list-disc list-inside space-y-1">
                    <li>
                      <strong>90–100%:</strong> Expert Level
                    </li>
                    <li>
                      <strong>80–89%:</strong> Advanced Level
                    </li>
                    <li>
                      <strong>70–79%:</strong> Intermediate Level
                    </li>
                    <li>
                      <strong>Below 70%:</strong> Beginner Level
                    </li>
                  </ul>
                </div>
              )}

            {/* Evaluation Criteria Instructions */}
            {userType.toLowerCase() === "fundi" &&
              !userData?.userProfile?.fundiEvaluation && (
                <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 shadow-sm">
                  <h2 className="text-xl font-semibold mb-6 text-gray-800">
                    Evaluation Form
                  </h2>

                  {/* Replacing inner <form> with <div> */}
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {questions.map((q) => (
                        <div key={q.id} className="space-y-2 relative">
                          {q.isEditing ? (
                            <input
                              value={q.text}
                              onChange={(e) =>
                                handleQuestionEdit(q.id, e.target.value)
                              }
                              onBlur={(e) =>
                                handleQuestionEdit(q.id, e.target.value)
                              }
                              className="w-full text-sm p-2 border border-blue-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900"
                            />
                          ) : (
                            <>
                              <label className="block text-sm font-medium text-gray-700 pr-8">
                                {q.text}
                              </label>
                              <button
                                type="button"
                                className="absolute top-1 right-1 text-gray-400 hover:text-gray-600"
                                onClick={() => handleEditToggle(q.id)}
                              >
                                <PencilIcon className="w-4 h-4" />
                              </button>
                            </>
                          )}

                          {q.type === "select" ? (
                            <select
                              value={q.answer}
                              onChange={(e) =>
                                handleTextChange(q.id, e.target.value)
                              }
                              className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-900 focus:border-blue-900"
                            >
                              {q.options.map((opt, i) => (
                                <option key={i} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type="text"
                              value={q.answer}
                              onChange={(e) =>
                                handleTextChange(q.id, e.target.value)
                              }
                              className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-900 focus:border-blue-900"
                              placeholder="Enter your response..."
                            />
                          )}

                          <div className="flex items-center gap-2">
                            <label className="text-sm text-gray-600">
                              Score:
                            </label>
                            <input
                              type="number"
                              min="0"
                              max={100}
                              value={q.score}
                              onChange={(e) =>
                                handleScoreChange(q.id, e.target.value)
                              }
                              className="w-20 p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-900 focus:border-blue-900"
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Total Score Section */}
                    <div className="mt-8 border-t pt-4 text-right">
                      <label className="text-lg font-semibold text-gray-700 mr-2">
                        Total Score:
                      </label>
                      <input
                        type="number"
                        value={totalScore}
                        onChange={(e) =>
                          setQuestions((prev) => {
                            const newTotal = parseFloat(e.target.value) || 0;
                            const updated = [...prev];
                            const diff =
                              newTotal -
                              prev.reduce((sum, q) => sum + q.score, 0);
                            if (updated.length > 0) {
                              // Distribute difference to the last question (or first if you prefer)
                              updated[updated.length - 1].score += diff;
                            }
                            return [...updated];
                          })
                        }
                        className="w-24 p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-900 focus:border-blue-900 text-blue-700"
                      />
                    </div>

                    {/* Audio Upload Section */}
                    <div className="bg-gray-50 mt-6 p-6 rounded-xl border border-gray-200">
                      <h2 className="text-xl font-semibold mb-4 text-gray-800">
                        Audio Upload
                      </h2>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Upload your audio response or reference (optional)
                      </label>
                      <input
                        type="file"
                        accept="audio/*"
                        className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-900 focus:border-blue-900"
                        onChange={handleAudioUpload}
                        disabled={isUploadingAudio}
                      />
                      {isUploadingAudio && (
                        <p className="mt-2 text-blue-600 text-sm">
                          Uploading audio...
                        </p>
                      )}
                      {audioUrl && (
                        <div className="mt-4">
                          <p className="text-green-600 text-sm mb-2">
                            Audio uploaded successfully!
                          </p>
                          <audio controls src={audioUrl} className="w-full" />
                        </div>
                      )}
                    </div>

                    <div className="mt-6 text-right flex flex-col items-end gap-2">
                      {
                        <button
                          type="submit"
                          className="bg-blue-800 text-white px-6 py-2 rounded hover:bg-blue-700 transition disabled:opacity-60"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? "Submitting..." : "Submit Evaluation"}
                        </button>
                      }
                      {submitMessage && (
                        <span
                          className={
                            submitMessage.includes("success")
                              ? "text-green-600"
                              : "text-red-600"
                          }
                        >
                          {submitMessage}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

            {/* Evaluation Results Display */}
            {userData?.userProfile?.fundiEvaluation && (
              <div className="bg-white shadow-lg rounded-xl border border-gray-200 p-6 mt-8">
                <h2 className="text-xl font-semibold mb-6 text-gray-800">
                  Evaluation Results
                </h2>

                {/* Total Score Display */}
                <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-800">
                      Overall Score
                    </h3>
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-2xl font-bold ${
                          userData.userProfile.fundiEvaluation.totalScore >= 90
                            ? "text-green-600"
                            : userData.userProfile.fundiEvaluation.totalScore >=
                                80
                              ? "text-blue-600"
                              : userData.userProfile.fundiEvaluation
                                    .totalScore >= 70
                                ? "text-yellow-600"
                                : "text-red-600"
                        }`}
                      >
                        {userData.userProfile.fundiEvaluation.totalScore}%
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          userData.userProfile.fundiEvaluation.totalScore >= 90
                            ? "bg-green-100 text-green-800"
                            : userData.userProfile.fundiEvaluation.totalScore >=
                                80
                              ? "bg-blue-100 text-blue-800"
                              : userData.userProfile.fundiEvaluation
                                    .totalScore >= 70
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                        }`}
                      >
                        {userData.userProfile.fundiEvaluation.totalScore >= 90
                          ? "Expert Level"
                          : userData.userProfile.fundiEvaluation.totalScore >=
                              80
                            ? "Advanced Level"
                            : userData.userProfile.fundiEvaluation.totalScore >=
                                70
                              ? "Intermediate Level"
                              : "Beginner Level"}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all duration-500 ${
                          userData.userProfile.fundiEvaluation.totalScore >= 90
                            ? "bg-green-500"
                            : userData.userProfile.fundiEvaluation.totalScore >=
                                80
                              ? "bg-blue-500"
                              : userData.userProfile.fundiEvaluation
                                    .totalScore >= 70
                                ? "bg-yellow-500"
                                : "bg-red-500"
                        }`}
                        style={{
                          width: `${userData.userProfile.fundiEvaluation.totalScore}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Individual Question Scores */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {/* Question 1: Major Works */}
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h4 className="font-medium text-gray-800 mb-2">
                      Major Works Experience
                    </h4>
                    <p className="text-sm text-gray-600 mb-2">
                      "Have you done any major works in the construction
                      industry?"
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">
                        {userData.userProfile.fundiEvaluation.hasMajorWorks ||
                          "Not provided"}
                      </span>
                      <span
                        className={`px-2 py-1 rounded text-sm font-medium ${
                          userData.userProfile.fundiEvaluation
                            .majorWorksScore >= 80
                            ? "bg-green-100 text-green-800"
                            : userData.userProfile.fundiEvaluation
                                  .majorWorksScore >= 60
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                        }`}
                      >
                        {userData.userProfile.fundiEvaluation.majorWorksScore}%
                      </span>
                    </div>
                  </div>

                  {/* Question 2: Materials Used */}
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h4 className="font-medium text-gray-800 mb-2">
                      Materials Knowledge
                    </h4>
                    <p className="text-sm text-gray-600 mb-2">
                      "State the materials that you have been using mostly for
                      your jobs"
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700 truncate">
                        {userData.userProfile.fundiEvaluation.materialsUsed ||
                          "Not provided"}
                      </span>
                      <span
                        className={`px-2 py-1 rounded text-sm font-medium ${
                          userData.userProfile.fundiEvaluation
                            .materialsUsedScore >= 80
                            ? "bg-green-100 text-green-800"
                            : userData.userProfile.fundiEvaluation
                                  .materialsUsedScore >= 60
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                        }`}
                      >
                        {
                          userData.userProfile.fundiEvaluation
                            .materialsUsedScore
                        }
                        %
                      </span>
                    </div>
                  </div>

                  {/* Question 3: Essential Equipment */}
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h4 className="font-medium text-gray-800 mb-2">
                      Equipment Knowledge
                    </h4>
                    <p className="text-sm text-gray-600 mb-2">
                      "Name essential equipment that you have been using for
                      your job"
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700 truncate">
                        {userData.userProfile.fundiEvaluation
                          .essentialEquipment || "Not provided"}
                      </span>
                      <span
                        className={`px-2 py-1 rounded text-sm font-medium ${
                          userData.userProfile.fundiEvaluation
                            .essentialEquipmentScore >= 80
                            ? "bg-green-100 text-green-800"
                            : userData.userProfile.fundiEvaluation
                                  .essentialEquipmentScore >= 60
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                        }`}
                      >
                        {
                          userData.userProfile.fundiEvaluation
                            .essentialEquipmentScore
                        }
                        %
                      </span>
                    </div>
                  </div>

                  {/* Question 4: Quotation Formulation */}
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h4 className="font-medium text-gray-800 mb-2">
                      Quotation Skills
                    </h4>
                    <p className="text-sm text-gray-600 mb-2">
                      "How do you always formulate your quotations?"
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700 truncate">
                        {userData.userProfile.fundiEvaluation
                          .quotationFormulation || "Not provided"}
                      </span>
                      <span
                        className={`px-2 py-1 rounded text-sm font-medium ${
                          userData.userProfile.fundiEvaluation
                            .quotationFormulaScore >= 80
                            ? "bg-green-100 text-green-800"
                            : userData.userProfile.fundiEvaluation
                                  .quotationFormulaScore >= 60
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                        }`}
                      >
                        {
                          userData.userProfile.fundiEvaluation
                            .quotationFormulaScore
                        }
                        %
                      </span>
                    </div>
                  </div>
                </div>

                {/* Audio Section */}
                {userData.userProfile.fundiEvaluation.audioUrl && (
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-gray-800 mb-3">
                      Audio Response
                    </h4>
                    <audio
                      controls
                      src={userData.userProfile.fundiEvaluation.audioUrl}
                      className="w-full"
                    >
                      Your browser does not support the audio element.
                    </audio>
                  </div>
                )}

                {/* Evaluation Date/Status */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>
                      Evaluation Status:
                      <span className="ml-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                        Completed
                      </span>
                    </span>
                    {userData.userProfile.fundiEvaluation.evaluatedAt && (
                      <span>
                        Evaluated on:{" "}
                        {new Date(
                          userData.userProfile.fundiEvaluation.evaluatedAt,
                        ).toLocaleDateString("en-GB")}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 text-right">
              <div className="relative inline-block">
                {/* Show Verify Button only if not admin approved, profile is complete, and status allows verification */}
                {!userData?.adminApproved &&
                  !userData?.approved &&
                  userData?.userProfile?.complete &&
                  PREFILL_STATUSES.includes(status) && (
                    <button
                      type="button"
                      onClick={handleVerify}
                      className="bg-blue-800 text-white px-6 py-2 rounded hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isVerifying}
                    >
                      {isVerifying ? "Verifying..." : "Verify"}
                    </button>
                  )}

                {/* Show message for incomplete accounts */}
                {(status === "SIGNED_UP" || status === "INCOMPLETE") && (
                  <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                    Account incomplete - Cannot verify
                  </span>
                )}

                {/* Show Verified Badge if admin approved */}
                {userData?.adminApproved && (
                  <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-200">
                    ✅ Verified
                  </span>
                )}

                {/* Legacy verification status (keep for backward compatibility) */}
                {!userData?.adminApproved && userData?.approved && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 ml-4">
                    Verified
                  </span>
                )}

                {/* Verified Message */}
                {showVerificationMessage && (
                  <div className="absolute top-full right-0 mt-2 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50 flex items-center justify-between gap-4 min-w-[200px]">
                    <span>Verified</span>
                    <button
                      type="button"
                      onClick={handleClose}
                      className="text-sm underline hover:text-gray-100"
                    >
                      Close
                    </button>
                  </div>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Experience;
