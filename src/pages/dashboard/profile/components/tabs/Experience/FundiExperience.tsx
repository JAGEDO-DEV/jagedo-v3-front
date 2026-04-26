/* eslint-disable no-case-declarations */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/ban-ts-comment */
//@ts-nocheck
import { useState, useEffect } from "react";
import { ArrowDownTrayIcon, XMarkIcon, PencilIcon, PlusIcon } from "@heroicons/react/24/outline";
import { UploadCloud, FileText, CheckCircle, XCircle, EyeIcon, InfoIcon as LucideInfoIcon } from "lucide-react";
import { FiCheck, FiChevronDown, FiRefreshCw, FiAlertCircle, FiInfo } from "react-icons/fi";
import { SquarePen, Clock } from "lucide-react";
import { toast, Toaster } from "sonner";
import { updateBuilderLevel, handleVerifyUser, submitEvaluation } from "@/api/provider.api";
import { adminVerifyExperience, adminRejectExperience, adminResubmitExperience, adminUpdateFundiExperience, adminUpdateProfessionalExperience, adminUpdateContractorExperience, getEvaluationQuestions, createEvaluationQuestion, updateEvaluationQuestion, deleteEvaluationQuestion, uploadEvaluationAudio, updateEvaluation } from "@/api/experience.api";
import useAxiosWithAuth from "@/utils/axiosInterceptor";
import { uploadFile } from "@/utils/fileUpload";
import { getBuilderSkillsByType, getSpecializationMappings } from "@/api/builderSkillsApi.api";
import { getMasterDataValues } from "@/api/masterData";
import { normalizeSkillName } from "@/utils/skillNameUtils";
import axios from "axios";
import { getAuthHeaders } from "@/utils/auth";
const deepMerge = (target: any, source: any): any => {
  const result = {
    ...target
  };
  for (const key in source) {
    if (source[key] && typeof source[key] === "object" && !Array.isArray(source[key])) {
      result[key] = deepMerge(result[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
};
const resolveSpecialization = (user: any) => {
  if (!user) return "";
  if (user.specialization) return user.specialization;
  if (user.fundispecialization) return user.fundispecialization;
  if (user.professionalSpecialization) return user.professionalSpecialization;
  if (user.contractorSpecialization) return user.contractorSpecialization;
  return "";
};
const FundiExperience = ({
  userData,
  isAdmin = false,
  refetch = () => { }
}) => {
  const axiosInstance = useAxiosWithAuth(import.meta.env.VITE_SERVER_URL);
  const [isEditingFields, setIsEditingFields] = useState(false);
  const [editingFields, setEditingFields] = useState({});
  const [isSavingInfo, setIsSavingInfo] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [fileActionLoading, setFileActionLoading] = useState({});
  const [isPendingAction, setIsPendingAction] = useState(false);
  const [showGlobalActions, setShowGlobalActions] = useState(false);
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    action: "approve" | "reject" | "resubmit" | null;
  }>({
    isOpen: false,
    action: null
  });
  const [actionReason, setActionReason] = useState("");
  const userType = "FUNDI";
  const status = userData?.experienceStatus;
  const [availableQuestions, setAvailableQuestions] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [isEditingEvaluation, setIsEditingEvaluation] = useState(false);
  const [fundiSkills, setFundiSkills] = useState<any[]>([]);
  const [specMappings, setSpecMappings] = useState<Record<string, string>>({});
  const [specializations, setSpecializations] = useState<any[]>([]);
  const [specializationsByCategory, setSpecializationsByCategory] = useState<Record<string, any[]>>({});
  const [skillsLoading, setSkillsLoading] = useState(false);
  const [specsLoading, setSpecsLoading] = useState(false);
  const totalScore = questions.length > 0 ? questions.reduce((sum, q) => sum + q.score, 0) / questions.length : 0;

  // Helper function to load specializations for a specific category
  const loadSpecializationsForCategory = async (categoryName: string) => {
    if (!categoryName || !specMappings || !fundiSkills) {
      return [];
    }
    try {
      const normalizedField = normalizeSkillName(categoryName);
      const specTypeCode = specMappings[normalizedField];
      if (!specTypeCode) {
        return [];
      }
      const selectedSkill = fundiSkills.find((s: any) => normalizeSkillName(s.skillName) === normalizedField);
      if (!selectedSkill) {
        return [];
      }
      const assignedSpecCodes = Array.isArray(selectedSkill.specializations) ? selectedSkill.specializations : [];
      if (assignedSpecCodes.length === 0) {
        return [];
      }
      const authAxios = axios.create({
        headers: {
          Authorization: getAuthHeaders()
        }
      });
      const specsRes = await getMasterDataValues(authAxios, specTypeCode);
      const allSpecs = Array.isArray(specsRes) ? specsRes : specsRes?.data || specsRes?.values || [];
      const filteredSpecs = allSpecs.filter((spec: any) => {
        const specCode = typeof spec === 'string' ? spec : spec?.code || spec?.name || "";
        return assignedSpecCodes.includes(specCode);
      });
      return filteredSpecs;
    } catch (error) {
      console.error(`Failed to load specializations for ${categoryName}:`, error);
      return [];
    }
  };
  useEffect(() => {
    const fetchQuestions = async () => {
      setIsLoadingQuestions(true);
      try {
        let skillOrProfession = "";
        const sourceData = userData?.userProfile || userData || {};
        console.log("💾 userData keys:", Object.keys(userData || {}));
        console.log("💾 userData?.userProfile keys:", Object.keys(userData?.userProfile || {}));
        console.log("💾 sourceData:", sourceData);
        skillOrProfession = sourceData?.skill || sourceData?.skills || userData?.skill || userData?.skills || editingFields?.skill || "";
        console.log("FUNDI skill sources - sourceData.skill:", sourceData?.skill, "sourceData.skills:", sourceData?.skills, "userData.skill:", userData?.skill, "userData.skills:", userData?.skills);
        console.log("🔍 Fetching questions with filters:", {
          userType: userType,
          skillName: skillOrProfession,
          isActive: true
        });
        const response = await getEvaluationQuestions(axiosInstance, {
          userType: userType,
          skillName: skillOrProfession,
          isActive: true
        });
        console.log("📥 API Response:", response);
        const extractedData = Array.isArray(response) ? response : response?.data && Array.isArray(response.data) ? response.data : Array.isArray(response?.result) ? response.result : [];
        console.log(`✅ Extracted ${extractedData.length} questions for ${skillOrProfession}`);
        setAvailableQuestions(extractedData);
      } catch (error: any) {
        console.error("Failed to fetch questions:", error);
        setAvailableQuestions([]);
      } finally {
        setIsLoadingQuestions(false);
      }
    };
    if (['FUNDI', 'PROFESSIONAL', 'CONTRACTOR', 'HARDWARE'].includes(userType)) {
      fetchQuestions();
    }
  }, [userType, userData?.id, userData?.skill, userData?.profession, userData?.contractorTypes, userData?.hardwareType, editingFields?.skill, editingFields?.profession, editingFields?.category, editingFields?.hardwareType]);
  useEffect(() => {
    if (availableQuestions.length > 0) {
      const evaluation = userData?.fundiEvaluation || userData?.userProfile?.fundiEvaluation;
      if (evaluation) {
        prefillQuestionsFromData();
      } else {
        const initial = availableQuestions.map((q: any) => ({
          id: q.id,
          text: q.text,
          type: q.type,
          options: q.options || [],
          answer: "",
          score: 0,
          isEditing: false,
          isDraft: false,
          isPreset: q.isPreset ?? true
        }));
        setQuestions(initial);
      }
    } else if (availableQuestions.length === 0 && !isLoadingQuestions) {
      setQuestions([]);
    }
  }, [availableQuestions, userData?.fundiEvaluation, userData?.userProfile?.fundiEvaluation, isLoadingQuestions]);
  useEffect(() => {
    if (['FUNDI', 'PROFESSIONAL', 'CONTRACTOR', 'HARDWARE'].includes(userType)) {
      const loadSkillsAndMappings = async () => {
        try {
          setSkillsLoading(true);
          const authAxios = axios.create({
            headers: {
              Authorization: getAuthHeaders()
            }
          });
          const skillsRes = await getBuilderSkillsByType(authAxios, userType);
          const activeSkills = skillsRes.filter((s: any) => s.isActive !== false);
          setFundiSkills(activeSkills);
          const mappingsRes = await getSpecializationMappings(authAxios, userType);
          setSpecMappings(mappingsRes);
        } catch (error) {
          console.error(`Failed to load ${userType} skills:`, error);
        } finally {
          setSkillsLoading(false);
        }
      };
      loadSkillsAndMappings();
    }
  }, [userType]);
  useEffect(() => {
    const sourceData = isEditingFields ? editingFields : userData?.userProfile || userData || {};
    let triggerField: string | undefined;
    triggerField = sourceData?.skill || sourceData?.fundiSpecialization;
    if (!triggerField) {
      setSpecializations([]);
      return;
    }
    if (!['FUNDI', 'PROFESSIONAL', 'CONTRACTOR', 'HARDWARE'].includes(userType)) {
      setSpecializations([]);
      return;
    }
    const loadSpecializations = async () => {
      try {
        setSpecsLoading(true);
        const normalizedField = normalizeSkillName(triggerField);
        const specTypeCode = specMappings[normalizedField];
        if (!specTypeCode) {
          console.warn(`No specialization mapping found for: ${normalizedField}`);
          setSpecializations([]);
          return;
        }
        const selectedSkill = fundiSkills.find((s: any) => normalizeSkillName(s.skillName) === normalizedField);
        if (!selectedSkill) {
          console.warn(`Skill not found for: ${triggerField}, falling back to all master data`);
          const authAxios = axios.create({
            headers: {
              Authorization: getAuthHeaders()
            }
          });
          const specsRes = await getMasterDataValues(authAxios, specTypeCode);
          const specs = Array.isArray(specsRes) ? specsRes : specsRes?.data || specsRes?.values || [];
          setSpecializations(specs);
          return;
        }
        const assignedSpecCodes = Array.isArray(selectedSkill.specializations) ? selectedSkill.specializations : [];
        if (assignedSpecCodes.length === 0) {
          console.info(`No specializations assigned to skill: ${selectedSkill.skillName}`);
          setSpecializations([]);
          return;
        }
        const authAxios = axios.create({
          headers: {
            Authorization: getAuthHeaders()
          }
        });
        const specsRes = await getMasterDataValues(authAxios, specTypeCode);
        const allSpecs = Array.isArray(specsRes) ? specsRes : specsRes?.data || specsRes?.values || [];
        const filteredSpecs = allSpecs.filter((spec: any) => {
          const specCode = typeof spec === 'string' ? spec : spec?.code || spec?.name || "";
          return assignedSpecCodes.includes(specCode);
        });
        setSpecializations(filteredSpecs);
      } catch (error) {
        console.error('Failed to load specializations:', error);
        setSpecializations([]);
      } finally {
        setSpecsLoading(false);
      }
    };
    loadSpecializations();
  }, [editingFields?.skill, editingFields?.profession, editingFields?.category, editingFields?.hardwareType, userData?.skill, userData?.profession, userData?.category, userData?.hardwareType, userData?.fundiSpecialization, userData?.professionalSpecialization, userData?.contractorTypes, userData?.levelOrClass, specMappings, userType, isEditingFields, fundiSkills]);
  const prefillQuestionsFromData = () => {
    const evaluation = userData?.fundiEvaluation || userData?.userProfile?.fundiEvaluation;
    if (!evaluation || !availableQuestions.length) return;
    const prefilled = availableQuestions.map((q: any, index: number) => {
      let answer = "";
      let score = 0;
      const savedResponse = evaluation.responses?.find((r: any) => r.questionId === q.id || r.text === q.text);
      if (savedResponse) {
        answer = savedResponse.answer;
        score = savedResponse.score;
      } else if (index < 4) {
        const legacyFields = [{
          ans: evaluation.hasMajorWorks,
          sc: evaluation.majorWorksScore
        }, {
          ans: evaluation.materialsUsed,
          sc: evaluation.materialsUsedScore
        }, {
          ans: evaluation.essentialEquipment,
          sc: evaluation.essentialEquipmentScore
        }, {
          ans: evaluation.quotationFormulation,
          sc: evaluation.quotationFormulaScore
        }];
        if (legacyFields[index]) {
          answer = legacyFields[index].ans || "";
          score = legacyFields[index].sc || 0;
        }
      }
      return {
        id: q.id,
        text: q.text,
        type: q.type,
        options: q.options || [],
        answer,
        score,
        isEditing: false,
        isDraft: false,
        isPreset: q.isPreset ?? true
      };
    });
    setQuestions(prefilled);
  };
  const PREFILL_STATUSES = ["COMPLETED", "VERIFIED", "PENDING", "RETURNED"];
  const getInitialAttachments = () => {
    if (!userData) {
      return [];
    }
    let projectData = [];
    projectData = userData?.previousJobPhotoUrls || [];
    if (!projectData || projectData.length === 0) {
      return [];
    }
    return projectData.map((project, index) => {
      const pName = project.projectName || `${userType} Project ${index + 1}`;
      let pUrl = "";
      if (typeof project.fileUrl === "object" && project.fileUrl !== null) {
        pUrl = project.fileUrl.url || "";
      } else {
        pUrl = project.fileUrl || project?.projectFile || "";
      }
      return {
        id: index + 1,
        projectName: pName,
        files: [{
          name: `${pName}.jpg`,
          url: pUrl
        }]
      };
    });
  };
  const profileUploaded = userData => {
    switch (userData?.userType) {
      case "FUNDI":
        return userData?.previousJobPhotoUrls && userData?.previousJobPhotoUrls.length > 0;
      case "PROFESSIONAL":
        return userData?.userProfile?.specialization.professionalLevel;
      case "CONTRACTOR":
        return userData?.contractorProjects && userData?.contractorProjects.length > 0;
      case "HARDWARE":
        return userData?.hardwareProjects && userData?.hardwareProjects.length > 0;
      default:
        return false;
    }
  };
  const getProjectFieldName = () => {
    return "Previous Job Photos";
  };
  const getInitialCategories = (): ContractorCategory[] => {
    if (userData?.contractorCategories && Array.isArray(userData.contractorCategories)) {
      return userData.contractorCategories.map((cat: any) => ({
        category: cat.category || "",
        specialization: cat.specialization || "",
        class: (cat.class || cat.categoryClass || "").replace(/\s+/g, ""),
        years: cat.years || cat.yearsOfExperience || ""
      }));
    }
    if (userData?.contractorExperiences && Array.isArray(userData.contractorExperiences)) {
      return userData.contractorExperiences.map((exp: any) => ({
        category: exp.category || "",
        specialization: exp.specialization || "",
        class: (exp.categoryClass || exp.class || "").replace(/\s+/g, ""),
        years: exp.yearsOfExperience || exp.years || ""
      }));
    }
    if (userData?.contractorTypes) {
      const types = userData.contractorTypes.split(",").map(t => t.trim()).filter(Boolean);
      if (types.length > 0) {
        return types.map(t => ({
          category: t,
          specialization: userData.specialization || "",
          class: userData.levelOrClass || "",
          years: userData.yearsOfExperience || ""
        }));
      }
    }
    return [{
      category: "",
      specialization: "",
      class: "",
      years: ""
    }];
  };
  const [categories, setCategories] = useState<ContractorCategory[]>(getInitialCategories());
  useEffect(() => {
    {
      return;
    }
  }, [categories, specMappings, userType, fundiSkills]);
  type ContractorCategory = {
    category: string;
    specialization: string;
    class: string;
    years: string;
    projectFile?: File;
    referenceFile?: File;
  };
  const CATEGORY_OPTIONS = ["Building Works", "Water Works", "Electrical Works", "Mechanical Works"];
  const [attachments, setAttachments] = useState(getInitialAttachments());
  const [uploadingProjects, setUploadingProjects] = useState<{
    [key: string]: boolean;
  }>({});
  const [newProjects, setNewProjects] = useState<{
    [key: string]: any;
  }>({});
  const addCategory = () => {
    setCategories([...categories, {
      category: "",
      specialization: "",
      class: "",
      years: ""
    }]);
  };
  const getInitialInfo = () => {
    if (!userData) {
      return getDefaultInfo();
    }
    return {
      skill: userData.skill || userData.skills || "",
      specialization: userData.specialization || userData.fundispecialization || "",
      grade: userData.grade || "",
      experience: userData.experience || ""
    };
  };
  const getDefaultInfo = () => {
    return {
      skill: "",
      specialization: "",
      grade: "",
      experience: ""
    };
  };
  const [info, setInfo] = useState(getInitialInfo());
  useEffect(() => {
    setInfo(getInitialInfo());
    const initialCategories = getInitialCategories();
    setCategories(initialCategories);
    let initialAttachments = getInitialAttachments();
    setAttachments(initialAttachments);
  }, [userData, userType]);
  const getGradeFromScore = (score: number) => {
    if (score >= 90) return "G1: Master Fundi";
    if (score >= 80) return "G2: Skilled";
    if (score >= 70) return "G3: Semi-skilled";
    return "G4: Unskilled";
  };
  const getValidGradesForScore = (score: number) => {
    const grades = ["G1: Master Fundi", "G2: Skilled", "G3: Semi-skilled", "G4: Unskilled"];
    if (score >= 90) return grades;
    if (score >= 80) return grades.slice(1);
    if (score >= 70) return grades.slice(2);
    return grades.slice(3);
  };
  useEffect(() => {
    if (isAdmin && totalScore > 0) {
      const autoGrade = getGradeFromScore(totalScore);
      const currentGrade = isEditingFields ? editingFields.grade : info.grade;
      if (currentGrade !== autoGrade) {
        if (isEditingFields) {
          setEditingFields(prev => ({
            ...prev,
            grade: autoGrade
          }));
        } else {
          setInfo(prev => ({
            ...prev,
            grade: autoGrade
          }));
        }
      }
    }
  }, [totalScore, userType, isAdmin, isEditingFields, info.grade, editingFields.grade]);
  const getFieldsConfig = () => {
    const currentData = isEditingFields ? editingFields : info;
    return [{
      name: "skill",
      label: "Skill",
      options: fundiSkills.length > 0 ? fundiSkills.map(s => s.skillName) : ["Mason", "Electrician", "Plumber", "Carpenter", "Painter", "Welder", "Tiler", "Roofer"]
    }, {
      name: "specialization",
      label: "Specialization",
      options: specializations.length > 0 ? specializations.map((spec: any) => typeof spec === 'string' ? spec : spec?.label || spec?.name || spec?.code || "") : [],
      dependsOn: "skill"
    }, {
      name: "grade",
      label: "Grade",
      options: totalScore > 0 ? getValidGradesForScore(totalScore) : ["G1: Master Fundi", "G2: Skilled", "G3: Semi-skilled", "G4: Unskilled"]
    }, {
      name: "experience",
      label: "Experience",
      options: ["10+ years", "5-10 years", "3-5 years", "1-3 years"]
    }];
  };
  const fields = getFieldsConfig();
  const handleFileUpload = (e, rowIndex) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length === 0) return;
    const loadingKey = `add-${rowIndex}`;
    setFileActionLoading(prev => ({
      ...prev,
      [loadingKey]: true
    }));
    const toastId = toast.loading("Processing files...");
    setAttachments(prev => {
      const newAttachments = prev.map((a, i) => ({
        ...a,
        files: [...a.files]
      }));
      const existingCount = newAttachments[rowIndex].files.length;
      selectedFiles.forEach((file, i) => {
        const slotIndex = existingCount + i;
        newAttachments[rowIndex].files.push({
          name: file.name,
          url: URL.createObjectURL(file),
          rawFile: file,
          role: slotIndex === 0 ? "projectFile" : "referenceLetterUrl"
        });
      });
      return newAttachments;
    });
    toast.success("Files added to project locally.", {
      id: toastId
    });
    setFileActionLoading(prev => ({
      ...prev,
      [loadingKey]: false
    }));
  };
  const getRequiredProjectCount = () => {
    const currentGrade = isEditingFields ? editingFields.grade : info.grade;
    const currentLevel = isEditingFields ? editingFields.professionalLevel : info.professionalLevel;
    if (currentGrade === "G1: Master Fundi") return 3;
    if (currentGrade === "G2: Skilled") return 2;
    if (currentGrade === "G3: Semi-skilled") return 1;
    if (currentGrade === "G4: Unskilled") return 0;
    return 0;
  };
  const requiredProjectCount = getRequiredProjectCount();
  const missingProjectCount = Math.max(0, requiredProjectCount - attachments.length);
  const handleAddNewProject = (projectId: string, projectName: string, files: File[]) => {
    if (!projectName.trim()) {
      toast.error("Please enter a project name");
      return;
    }
    if (files.length === 0) {
      toast.error("Please select at least one file");
      return;
    }
    setUploadingProjects(prev => ({
      ...prev,
      [projectId]: true
    }));
    const newProject = {
      id: attachments.length + 1,
      projectName: projectName.trim(),
      files: files.map(file => ({
        name: file.name,
        url: URL.createObjectURL(file),
        rawFile: file
      }))
    };
    setAttachments(prev => [...prev, newProject]);
    toast.success(`${projectName} added locally!`);
    setNewProjects(prev => {
      const updated = {
        ...prev
      };
      const currentIndex = parseInt(projectId.replace("new_", ""), 10);
      for (let i = currentIndex; i < 5; i++) {
        if (updated[`new_${i + 1}`]) {
          updated[`new_${i}`] = updated[`new_${i + 1}`];
        } else {
          updated[`new_${i}`] = {
            name: "",
            files: []
          };
        }
      }
      return updated;
    });
    setUploadingProjects(prev => ({
      ...prev,
      [projectId]: false
    }));
  };
  const updateUserProjects = updatedAttachments => {
    try {
      const profile = userData?.userProfile || {};
      const cleanAttachments = updatedAttachments.filter(project => project && project.projectName).map(project => ({
        id: project.id,
        projectName: project.projectName.trim(),
        files: project.files.filter(file => file && file.url && file.url.trim())
      })).filter(project => project.files.length > 0);
      const projectData = cleanAttachments.flatMap(project => project.files.map(file => ({
        projectName: project.projectName,
        fileUrl: file.url,
        projectFile: file.url
      })));
      const profileKey = "previousJobPhotoUrls";
      const updatedProfile = {
        ...profile,
        [profileKey]: projectData
      };
      userData.userProfile = updatedProfile;
    } catch (error) {
      console.error("Update projects error:", error);
      throw error;
    }
  };
  const handleReplaceFile = (e, rowIndex, fileIndex) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const toastId = toast.loading("Replacing file...");
    let updatedAttachments;
    setAttachments(prev => {
      const newAttachments = [...prev];
      if (newAttachments[rowIndex] && newAttachments[rowIndex].files && newAttachments[rowIndex].files[fileIndex]) {
        newAttachments[rowIndex].files[fileIndex] = {
          name: file.name,
          url: URL.createObjectURL(file),
          rawFile: file
        };
      }
      updatedAttachments = newAttachments;
      return newAttachments;
    });
    e.target.value = "";
    toast.success("File replaced locally.", {
      id: toastId
    });
    setFileActionLoading(prev => ({
      ...prev,
      [loadingKey]: false
    }));
  };
  const handleRemoveFile = (rowIndex, fileIndex) => {
    const loadingKey = `remove-${rowIndex}-${fileIndex}`;
    setFileActionLoading(prev => ({
      ...prev,
      [loadingKey]: true
    }));
    const toastId = toast.loading("Removing file...");
    let updatedAttachments;
    setAttachments(prev => {
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
    toast.success("File removed locally.", {
      id: toastId
    });
    setFileActionLoading(prev => ({
      ...prev,
      [loadingKey]: false
    }));
  };
  const addNewQuestion = () => {
    if (!isAdmin) return;
    const tempId = `draft-${Date.now()}`;
    const newQuestion = {
      id: tempId,
      text: "New evaluation question",
      type: "open",
      answer: "",
      score: 0,
      isEditing: true,
      isDraft: true
    };
    setQuestions(prev => [...prev, newQuestion]);
  };
  const handleSaveNewQuestion = async (draft: any) => {
    if (!draft.isDraft) return;
    setIsLoadingQuestions(true);
    try {
      let skillName = "";
      const sourceData = userData?.userProfile || userData || {};
      skillName = sourceData?.skill || sourceData?.skills || userData?.skill || userData?.skills || editingFields?.skill || "";
      const payload = {
        text: draft.text,
        type: (draft.type || "OPEN").toUpperCase(),
        options: draft.options ? Array.isArray(draft.options) ? JSON.stringify(draft.options) : draft.options : null,
        userType: userType,
        skillName: skillName,
        category: userType,
        isActive: true,
        isPreset: false
      };
      const response = await createEvaluationQuestion(axiosInstance, payload);
      const realQuestion = response?.data || response;
      setQuestions(prev => (Array.isArray(prev) ? prev : []).map(q => q.id === draft.id ? {
        ...q,
        id: realQuestion.id,
        isEditing: false,
        isDraft: false
      } : q));
      setAvailableQuestions(prev => [...(Array.isArray(prev) ? prev : []), realQuestion]);
      toast.success("Question created and synced");
    } catch (error: any) {
      toast.error(error.message || "Failed to save question");
    } finally {
      setIsLoadingQuestions(false);
    }
  };
  const handleDeleteQuestion = async (questionId: any) => {
    const q = questions.find(item => item.id === questionId);
    if (!q) return;
    if (!isAdmin || !window.confirm("Are you sure you want to delete this question?")) return;
    if (q.isDraft) {
      setQuestions(prev => prev.filter(item => item.id !== questionId));
      return;
    }
    setIsLoadingQuestions(true);
    try {
      await deleteEvaluationQuestion(axiosInstance, questionId);
      setAvailableQuestions(prev => (Array.isArray(prev) ? prev : []).filter(q => q.id !== questionId));
      setQuestions(prev => (Array.isArray(prev) ? prev : []).filter(q => q.id !== questionId));
      toast.success("Question deleted");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete question");
    } finally {
      setIsLoadingQuestions(false);
    }
  };
  const handleUpdateTemplate = async (questionId: any, text: string, type: string, options?: string[]) => {
    if (!isAdmin) return;
    const q = questions.find(item => item.id === questionId);
    if (!q || q.isDraft) return;
    try {
      const payload = {
        text,
        type: type.toUpperCase(),
        options
      };
      const response = await updateEvaluationQuestion(axiosInstance, questionId, payload);
      const updated = response?.data || response;
      setAvailableQuestions(prev => (Array.isArray(prev) ? prev : []).map(q => q.id === questionId ? updated : q));
      toast.success("Question updated successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to update question");
    }
  };
  useEffect(() => {
    setNewProjects(prev => {
      const updated = {
        ...prev
      };
      let changed = false;
      const targetCount = Math.min(missingProjectCount, 5);
      for (let i = 0; i < targetCount; i++) {
        const key = `new_${i}`;
        if (!updated[key]) {
          updated[key] = {
            name: "",
            files: []
          };
          changed = true;
        }
      }
      return changed ? updated : prev;
    });
  }, [missingProjectCount]);
  const handleTextChange = (id, value) => {
    setQuestions(prev => (Array.isArray(prev) ? prev : []).map(q => q.id === id ? {
      ...q,
      answer: value
    } : q));
  };
  const handleScoreChange = (id, value) => {
    const num = parseFloat(value) || 0;
    if (num > 100) return;
    setQuestions(prev => (Array.isArray(prev) ? prev : []).map(q => q.id === id ? {
      ...q,
      score: num
    } : q));
  };
  const handleEditToggle = id => {
    setQuestions(prev => (Array.isArray(prev) ? prev : []).map(q => q.id === id ? {
      ...q,
      isEditing: !q.isEditing
    } : q));
  };
  const handleQuestionEdit = async (id, newText) => {
    setQuestions(prev => (Array.isArray(prev) ? prev : []).map(q => q.id === id ? {
      ...q,
      text: newText,
      isEditing: false
    } : q));
    if (isAdmin) {
      const q = questions.find(item => item.id === id);
      if (q && !q.isDraft) {
        handleUpdateTemplate(id, newText, q.type, q.options);
      }
    }
  };
  const closeActionModal = () => {
    setActionModal({
      isOpen: false,
      action: null
    });
    setActionReason("");
  };
  const submitAction = async () => {
    const {
      action
    } = actionModal;
    setIsPendingAction(true);
    try {
      if (action === "approve") {
        await adminVerifyExperience(axiosInstance, userData.id);
        toast.success("Experience approved successfully");
      } else if (action === "reject") {
        await adminRejectExperience(axiosInstance, userData.id, actionReason);
        toast.success("Experience rejected");
      } else if (action === "resubmit") {
        await adminResubmitExperience(axiosInstance, userData.id, actionReason);
        toast.success("Resubmission requested");
      }
      if (refetch) {
        refetch();
      } else {
        window.location.reload();
      }
    } catch (error: any) {
      toast.error(error.message || "Action failed");
    } finally {
      setIsPendingAction(false);
      closeActionModal();
    }
  };
  const renderActionModal = () => {
    if (!actionModal.isOpen) return null;
    const {
      action
    } = actionModal;
    const configs = {
      approve: {
        title: "Approve Experience",
        description: `Are you sure you want to approve this user's experience?`,
        buttonText: "Approve",
        buttonColor: "bg-green-600 hover:bg-green-700",
        needsReason: false
      },
      reject: {
        title: "Disapprove Experience",
        description: `Please provide a reason for disapproving this experience submission:`,
        buttonText: "Disapprove all",
        buttonColor: "bg-red-600 hover:bg-red-700",
        needsReason: true
      },
      resubmit: {
        title: "Return Experience",
        description: `Please specify what needs to be corrected in the experience profile:`,
        buttonText: "Return all",
        buttonColor: "bg-blue-600 hover:bg-blue-700",
        needsReason: true
      }
    };
    const config = configs[action!];
    return <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {config.title}
        </h3>
        <p className="text-sm text-gray-600 mb-4">{config.description}</p>

        {config.needsReason && <textarea autoFocus value={actionReason} onChange={e => setActionReason(e.target.value)} onKeyDown={e => e.stopPropagation()} placeholder="Enter reason..." className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" rows={3} />}

        <div className="flex gap-3 mt-4">
          <button type="button" disabled={isPendingAction} onClick={submitAction} className={`flex-1 py-2 px-4 text-white rounded-lg font-medium transition disabled:opacity-50 ${config.buttonColor}`}>
            {isPendingAction ? "Processing..." : config.buttonText}
          </button>
          <button type="button" disabled={isPendingAction} onClick={closeActionModal} className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition">
            Cancel
          </button>
        </div>
      </div>
    </div>;
  };
  const renderEvaluationResults = () => {
    const evaluation = userData?.fundiEvaluation || userData?.userProfile?.fundiEvaluation;
    if (!evaluation && questions.length === 0) return null;
    const displayQuestions = questions.length > 0 ? questions : evaluation?.responses || [];
    return <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-8">
      <div className="bg-blue-900 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <h3 className="text-lg font-bold text-white">
              Evaluation Results
            </h3>
          </div>
          {evaluation?.totalScore && <PerformanceClassificationBadge score={evaluation.totalScore} />}
          {isAdmin && !isEditingEvaluation && <button type="button" onClick={() => {
            prefillQuestionsFromData();
            setIsEditingEvaluation(true);
          }} className="flex items-center gap-1.5 px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold transition-colors border border-white/20">
            <SquarePen className="w-3.5 h-3.5 text-blue-300" />
            Edit Evaluation
          </button>}
        </div>
        <div className="bg-white/10 px-4 py-1 rounded-full border border-white/20">
          <span className="text-sm font-semibold text-white">
            Total Score:{" "}
            <span className="text-green-400 text-lg">
              {evaluation?.totalScore ?? Math.round(totalScore)}%
            </span>
          </span>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {displayQuestions.map((q, idx) => <div key={idx} className="bg-gray-50 p-4 rounded-lg border border-gray-100">
            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">
              Question {idx + 1}
            </p>
            <h4 className="text-base font-semibold text-gray-800 mb-3">
              {q.text}
            </h4>
            <div className="bg-white p-3 rounded border border-gray-200 mb-2">
              <p className="text-sm text-gray-700 italic">
                {Array.isArray(q.answer) ? q.answer.join(", ") : q.answer || "N/A"}
              </p>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs font-medium text-gray-400">
                Score
              </span>
              <span className="text-sm font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                {q.score}/100
              </span>
            </div>
          </div>)}
        </div>

        {evaluation?.audioUrl && <div className="mt-8 border-t pt-6">
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <LucideInfoIcon className="w-4 h-4 text-blue-500" />
            Audio Feedback Reference
          </h4>
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
            <audio key={evaluation.audioUrl} src={evaluation.audioUrl} controls className="w-full h-10 custom-audio-player">
              Your browser does not support the audio element.
            </audio>
          </div>
        </div>}
      </div>
    </div>;
  };
  const [showVerificationMessage, setShowVerificationMessage] = useState(false);

  /* -------------------- Status Badge Component -------------------- */
  const StatusBadge = ({
    status,
    showIcon = true
  }: {
    status: string;
    showIcon?: boolean;
  }) => {
    const configs: Record<string, {
      bg: string;
      text: string;
      border: string;
      icon: any;
      label: string;
    }> = {
      pending: {
        bg: "bg-amber-50",
        text: "text-amber-700",
        border: "border-amber-200",
        icon: Clock,
        label: "Pending Review"
      },
      VERIFIED: {
        bg: "bg-green-50",
        text: "text-green-700",
        border: "border-green-200",
        icon: CheckCircle,
        label: "Approved"
      },
      REJECTED: {
        bg: "bg-red-50",
        text: "text-red-700",
        border: "border-red-200",
        icon: XCircle,
        label: "Rejected"
      },
      RESUBMIT: {
        bg: "bg-blue-50",
        text: "text-blue-700",
        border: "border-blue-200",
        icon: FiRefreshCw,
        label: "Re-upload Required"
      }
    };
    const config = configs[status] || configs.pending;
    const Icon = config.icon;
    return <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text} border ${config.border}`}>
      {showIcon && <Icon className="w-3 h-3" />}
      {config.label}
    </span>;
  };

  /* ────────── Grade Classification By Score Component ────────── */
  const getScoreClassification = (score?: number): {
    label: string;
    stars: string;
    bg: string;
    text: string;
    border: string;
  } => {
    if (score === undefined || score === null) {
      return {
        label: "Not Rated",
        stars: "○",
        bg: "bg-gray-50",
        text: "text-gray-700",
        border: "border-gray-200"
      };
    }
    const classifications = {
      master: {
        label: "G1: Master Fundi",
        stars: "⭐⭐⭐⭐",
        bg: "bg-yellow-50",
        text: "text-yellow-700",
        border: "border-yellow-200"
      },
      skilled: {
        label: "G2: Skilled",
        stars: "⭐⭐⭐",
        bg: "bg-purple-50",
        text: "text-purple-700",
        border: "border-purple-200"
      },
      semiSkilled: {
        label: "G3: Semi-skilled",
        stars: "⭐⭐",
        bg: "bg-blue-50",
        text: "text-blue-700",
        border: "border-blue-200"
      },
      unskilled: {
        label: "G4: Unskilled",
        stars: "⭐",
        bg: "bg-gray-50",
        text: "text-gray-700",
        border: "border-gray-200"
      }
    };
    if (score >= 90) return classifications.master;
    if (score >= 80) return classifications.skilled;
    if (score >= 70) return classifications.semiSkilled;
    return classifications.unskilled;
  };
  const PerformanceClassificationBadge = ({
    score
  }: {
    score?: number;
  }) => {
    const classification = getScoreClassification(score);
    return <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold border ${classification.bg} ${classification.text} ${classification.border}`}>
      <span className="text-sm tracking-wide">{classification.stars}</span>
      <span>{classification.label}</span>
    </div>;
  };
  const [audioUrl, setAudioUrl] = useState("");
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  useEffect(() => {
    const stored = localStorage.getItem("showVerificationMessage");
    if (stored === "true") {
      setShowVerificationMessage(true);
    }
    const isVerified = userData?.userProfile?.fundiEvaluation?.isVerified;
    if (isVerified) {
      setShowVerificationMessage(true);
    }
    const evaluation = userData?.fundiEvaluation || userData?.userProfile?.fundiEvaluation;
    const audioUrlFromData = evaluation?.audioUrl || userData?.userProfile?.audioUploadUrl;
    if (audioUrlFromData) {
      setAudioUrl(audioUrlFromData);
    }
  }, [userData]);
  const handleVerify = async () => {
    setIsVerifying(true);
    const userId = userData.id;
    if (!userId) {
      toast.error("User ID not found.");
      setIsVerifying(false);
      return;
    }
    try {
      await handleVerifyUser(axiosInstance, userId);
      toast.success("User verified successfully!");
      localStorage.setItem("showVerificationMessage", "true");
      setShowVerificationMessage(true);
      window.location.reload();
    } catch (error: any) {
      toast.error(error.message || "Failed to verify user");
    } finally {
      setIsVerifying(false);
    }
  };
  const handleClose = () => {
    localStorage.removeItem("showVerificationMessage");
    setShowVerificationMessage(false);
  };
  const handleAudioUpload = async event => {
    const file = event.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("audio/")) {
      toast.error("Please upload an audio file");
      return;
    }
    const toastId = toast.loading("Uploading audio...");
    setIsUploadingAudio(true);
    try {
      const remoteUrl = await uploadEvaluationAudio(axiosInstance, file);
      setAudioUrl(remoteUrl);
      toast.success("Audio uploaded successfully", {
        id: toastId
      });
    } catch (error: any) {
      toast.error(error.message || "Audio upload failed", {
        id: toastId
      });
    } finally {
      setIsUploadingAudio(false);
    }
  };
  const handleEvaluationSubmit = async e => {
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
      hasMajorWorks: questions[0]?.answer || "",
      materialsUsed: questions[1]?.answer || "",
      essentialEquipment: questions[2]?.answer || "",
      quotationFormulation: questions[3]?.answer || "",
      majorWorksScore: questions[0]?.score || 0,
      materialsUsedScore: questions[1]?.score || 0,
      essentialEquipmentScore: questions[2]?.score || 0,
      quotationFormulaScore: questions[3]?.score || 0,
      responses: questions.map(q => ({
        questionId: q.id,
        text: q.text,
        answer: q.answer,
        score: q.score,
        type: q.type
      })),
      totalScore: totalScore,
      audioUrl: audioUrl || null,
      audioUploadUrl: audioUrl || null
    };
    try {
      if (userData?.fundiEvaluation) {
        await updateEvaluation(axiosInstance, profileId, body);
      } else {
        await submitEvaluation(axiosInstance, profileId, body);
      }
      setSubmitMessage("Evaluation updated successfully!");
      toast.success("Evaluation updated successfully!");
      setIsEditingEvaluation(false);
      if (refetch) {
        refetch();
      } else {
        window.location.reload();
      }
    } catch (error: any) {
      setSubmitMessage(error.message || "Failed to submit evaluation");
      toast.error(error.message || "Failed to submit evaluation");
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleSaveChanges = async () => {
    setIsSavingInfo(true);
    const toastId = toast.loading("Saving all changes...");
    try {
      if (!userData?.id) throw new Error("User ID not found");
      const updatedAttachments = await Promise.all(attachments.map(async project => {
        const updatedFiles = await Promise.all(project.files.map(async f => {
          if (f.rawFile) {
            const uploaded = await uploadFile(f.rawFile);
            return {
              name: f.name,
              url: uploaded.url,
              role: f.role
            };
          }
          return {
            name: f.name,
            url: f.url,
            role: f.role
          };
        }));
        return {
          ...project,
          files: updatedFiles
        };
      }));
      let response;
      {
        const flattenedProjectFiles = updatedAttachments.flatMap(project => project.files.map(file => ({
          projectName: project.projectName,
          fileUrl: file.url
        })));
        const payload = {
          skill: isEditingFields ? editingFields.skill : info.skill,
          specialization: isEditingFields ? editingFields.specialization : info.specialization,
          grade: isEditingFields ? editingFields.grade : info.grade,
          experience: isEditingFields ? editingFields.experience : info.experience,
          status: status,
          experienceStatus: status,
          previousJobPhotoUrls: flattenedProjectFiles,
          audioUploadUrl: audioUrl || null
        };
        response = await adminUpdateFundiExperience(axiosInstance, userData.id, payload);
      }
      toast.success("All changes saved successfully!", {
        id: toastId
      });
      if (isEditingFields) {
        setInfo(prevInfo => deepMerge(prevInfo, isEditingFields ? editingFields : {}));
        setIsEditingFields(false);
      }
      if (refetch) {
        refetch();
      } else {
        window.location.reload();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to save changes", {
        id: toastId
      });
      console.error("Save changes error:", error);
    } finally {
      setIsSavingInfo(false);
    }
  };
  const isExperienceReadyToApprove = (): boolean => {
    const requiredCount = getRequiredProjectCount();
    {
      const hasGrade = !!(isEditingFields ? editingFields.grade : info.grade);
      const hasExperience = !!(isEditingFields ? editingFields.experience : info.experience);
      const hasSkill = !!(isEditingFields ? editingFields.skill : info.skill);
      const hasEnoughProjects = attachments.length >= requiredCount && requiredCount > 0 && attachments.every(a => a.files.length > 0);
      return hasGrade && hasExperience && hasSkill && hasEnoughProjects;
    }
  };
  const readyToApprove = isExperienceReadyToApprove();
  const canSaveChanges = (): boolean => {
    const requiredCount = getRequiredProjectCount();
    {
      const hasGrade = !!(isEditingFields ? editingFields.grade : info.grade);
      const hasExperience = !!(isEditingFields ? editingFields.experience : info.experience);
      const hasSkill = !!(isEditingFields ? editingFields.skill : info.skill);
      const hasSpecialization = !!(isEditingFields ? editingFields.specialization : info.specialization);
      const hasEnoughProjects = attachments.length >= requiredCount && requiredCount > 0 && attachments.every(a => a.files.length > 0);
      return hasGrade && hasExperience && hasSkill && hasSpecialization && hasEnoughProjects;
    }
  };
  return <div className="flex">
    <Toaster position="top-center" richColors />
    <div className="bg-gray-50 min-h-screen w-full relative p-20 rounded-xl shadow-lg">
      {renderActionModal()}
      <div className="max-w-6xl bg-white rounded-xl shadow-lg p-8">
        {/* Header with Approve Button */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            {"Fundi Experience"}
          </h1>
          <div className="flex items-center gap-3">
            <StatusBadge status={userData?.experienceStatus || "pending"} />
            {/* Global Actions Dropdown - Admin Only */}
            {isAdmin && <div className="relative">
              <button type="button" onClick={() => setShowGlobalActions(!showGlobalActions)} disabled={isPendingAction} className="flex items-center gap-2 py-2 px-4 text-white bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition disabled:bg-gray-400 disabled:cursor-not-allowed disabled:opacity-60 min-w-[100px] justify-center">
                {isPendingAction ? <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processing...
                </> : <>
                  Actions
                  <FiChevronDown className={`w-4 h-4 transition-transform ${showGlobalActions ? "rotate-180" : ""}`} />
                </>}
              </button>
              {showGlobalActions && <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20 overflow-hidden">
                {/* Approve Button */}
                <button type="button" disabled={userData?.experienceStatus === "VERIFIED" || !readyToApprove || isPendingAction} title={userData?.experienceStatus === "VERIFIED" ? "Experience is already approved" : !readyToApprove ? "All required fields and projects must be filled" : "Approve experience"} onClick={async () => {
                  setShowGlobalActions(false);
                  setIsPendingAction(true);
                  try {
                    await adminVerifyExperience(axiosInstance, userData.id);
                    toast.success("Experience approved successfully");
                    window.location.reload();
                  } catch (error: any) {
                    toast.error(error.message || "Failed to approve experience");
                  } finally {
                    setIsPendingAction(false);
                  }
                }} className={`w-full flex items-center gap-2 px-4 py-3 text-sm transition border-b border-gray-100
                          ${userData?.experienceStatus === "VERIFIED" || !readyToApprove ? "opacity-40 cursor-not-allowed text-gray-400 bg-gray-50" : "text-green-700 hover:bg-green-50"}`}>
                  <FiCheck className="w-4 h-4" />
                  Approve
                  {userData?.experienceStatus !== "VERIFIED" && !readyToApprove && <span className="ml-auto text-[10px] text-gray-400 font-normal">
                    Incomplete
                  </span>}
                </button>

                {/* Return for Correction */}
                <button type="button" onClick={() => {
                  setShowGlobalActions(false);
                  setActionModal({
                    isOpen: true,
                    action: "resubmit"
                  });
                }} className="w-full flex items-center gap-2 px-4 py-3 text-sm text-blue-700 hover:bg-blue-50 transition border-b border-gray-100">
                  <FiRefreshCw className="w-4 h-4" />
                  Return all
                </button>

                {/* Disapprove Button */}
                <button type="button" disabled={userData?.experienceStatus !== "VERIFIED" || isPendingAction} title={userData?.experienceStatus !== "VERIFIED" ? "Only verified experience can be disapproved" : "Disapprove experience"} onClick={() => {
                  setShowGlobalActions(false);
                  setActionModal({
                    isOpen: true,
                    action: "reject"
                  });
                }} className={`w-full flex items-center gap-2 px-4 py-3 text-sm transition font-medium
                          ${userData?.experienceStatus !== "VERIFIED" ? "opacity-40 cursor-not-allowed text-gray-400 bg-gray-50" : "text-red-700 hover:bg-red-50"}`}>
                  <XCircle className="w-4 h-4" />
                  Disapprove all
                </button>
              </div>}
            </div>}
          </div>
        </div>

        {<div className="mb-6 p-4 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg text-sm">
          <p className="font-semibold mb-1">
            Administrative Review Process
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Review the fundi's skill set and specialization.</li>
            <li>
              Conduct a <strong>15-minute technical interview</strong> if
              required.
            </li>
            <li>Evaluate projects and proof of work provided.</li>
            <li>
              Ensure audio responses and evaluation scores are recorded
              before verification.
            </li>
          </ul>
        </div>}

        {(userData?.experienceStatus === "REJECTED" || userData?.experienceStatus === "RESUBMIT") && userData?.experienceStatusReason && <div className={`mb-8 p-4 rounded-xl border flex items-start gap-4 ${userData.experienceStatus === "REJECTED" ? "bg-red-50 border-red-200" : "bg-blue-50 border-blue-200"}`}>
          <div className={`p-2 rounded-lg ${userData.experienceStatus === "REJECTED" ? "bg-red-100" : "bg-blue-100"}`}>
            <FiAlertCircle className={`w-5 h-5 ${userData.experienceStatus === "REJECTED" ? "text-red-600" : "text-blue-600"}`} />
          </div>
          <div>
            <h3 className={`font-semibold text-sm ${userData.experienceStatus === "REJECTED" ? "text-red-900" : "text-blue-900"}`}>
              {userData.experienceStatus === "REJECTED" ? "Experience Rejected" : "Resubmission Required"}
            </h3>
            <p className={`text-sm mt-1 ${userData.experienceStatus === "REJECTED" ? "text-red-700" : "text-blue-700"}`}>
              {userData.experienceStatusReason}
            </p>
          </div>
        </div>}

        <form onSubmit={handleEvaluationSubmit} className="space-y-8">
          {/* Skills Section - Card Based Design */}
          <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
              <LucideInfoIcon className="w-5 h-5 text-blue-600" />
              {"Fundi Experience"}
            </h2>
            {userType.toLowerCase() !== "contractor" && <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {fields.map((field, index) => {
                const isGradeField = field.name === "grade" || field.name === "professionalLevel";
                const fieldValue = typeof info[field.name] === "string" ? info[field.name] : "";
                return <div key={index} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:border-blue-300 transition-colors">
                  <div className="flex items-center justify-between mb-3 border-b border-gray-50 pb-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {field.label}
                    </label>
                    {!isEditingFields && isAdmin && <button type="button" onClick={() => {
                      setEditingFields({
                        ...info
                      });
                      setIsEditingFields(true);
                    }} className="text-blue-600 hover:text-blue-800 transition">
                      <PencilIcon className="w-4 h-4" />
                    </button>}
                  </div>

                  {isEditingFields ? <>
                    {field.name === "skill" ? <p className="text-blue-900 font-bold text-sm">
                      {fieldValue || "N/A"}
                    </p> : field.name === "specialization" ? <select value={editingFields[field.name] ?? fieldValue ?? ""} onChange={e => {
                      setEditingFields(prev => ({
                        ...prev,
                        [field.name]: e.target.value
                      }));
                    }} disabled={!editingFields.skill || specsLoading} className="w-full p-2 border border-blue-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100">
                      <option value="" disabled>
                        {!editingFields.skill ? "Select a skill first" : specsLoading ? "Loading..." : "Select Specialization"}
                      </option>
                      {specializations.map((s: any) => {
                        const specName = typeof s === 'string' ? s : s?.name || s?.label || s?.code || "";
                        const specId = s?.id || specName;
                        return <option key={specId} value={specName}>
                          {specName}
                        </option>;
                      })}
                    </select> : <select value={editingFields[field.name] ?? fieldValue ?? ""} onChange={e => {
                      const newValue = e.target.value;
                      setEditingFields(prev => {
                        const updated = {
                          ...prev,
                          [field.name]: newValue
                        };
                        if (field.name === "skill" || field.name === "profession" || field.name === "category") {
                          updated.specialization = "";
                        }
                        return updated;
                      });
                    }} className="w-full p-2 border border-blue-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                      <option value="" disabled>
                        Select {field.label.toLowerCase()}
                      </option>
                      {field.options.map((opt, i) => {
                        const optValue = typeof opt === 'string' ? opt : opt?.label || opt?.name || opt?.code || "";
                        return <option key={i} value={optValue}>
                          {optValue}
                        </option>;
                      })}
                    </select>}
                  </> : <p className="text-blue-900 font-bold text-sm truncate">
                    {fieldValue || "N/A"}
                  </p>}
                </div>;
              })}
            </div>}

            {isEditingFields && <div className="mt-6 flex flex-col sm:sm:flex-row justify-end gap-3 border-t pt-4">
              <button type="button" className="w-full sm:w-auto px-6 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition font-medium text-sm" onClick={() => setIsEditingFields(false)} disabled={isSavingInfo}>
                Cancel
              </button>
              <div className="hidden sm:block text-xs text-gray-400 self-center">
                Don't forget to save changes at the bottom
              </div>
            </div>}


          </div>
          {/* Project Attachments Section */}
          {userType.toLowerCase() === "fundi" ? <div className="bg-blue-50 shadow-xl rounded-xl border border-blue-200 overflow-hidden mb-8 transition-all hover:shadow-2xl">
            <div className="px-6 py-6 font-sans">
              <h4 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Projects
              </h4>
              {requiredProjectCount > 0 && <p className="text-sm text-blue-700 mb-6 bg-blue-100/50 p-3 rounded-lg border border-blue-100">
                Add missing projects to complete this experience profile (
                {missingProjectCount} remaining).
              </p>}

              {/* Uploaded Projects Section */}
              {attachments.length > 0 && <div className="mb-8">
                <h5 className="text-sm font-bold text-blue-900 mb-4 flex items-center gap-2">
                  <FiCheck className="w-4 h-4" />
                  Uploaded Projects ({attachments.length})
                </h5>
                <div className="space-y-4">
                  {attachments.map((project, index) => <div key={project.id || index} className="p-4 bg-white rounded-lg border border-blue-200 shadow-sm group hover:border-blue-400 transition-all hover:shadow-md">
                    <div className="flex justify-between items-start mb-3">
                      <div className="text-sm font-bold text-gray-900">
                        {project.projectName || `Project ${index + 1}`}
                      </div>
                      {isAdmin && <button type="button" onClick={() => handleRemoveFile(index, 0)} className="p-1 px-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider" title="Remove project">
                        <XMarkIcon className="w-4 h-4" />
                        Remove
                      </button>}
                    </div>
                    <div className="space-y-2">
                      {project.files.map((file, fileIndex) => <div key={fileIndex} className="flex items-center justify-between bg-gray-50 p-2 rounded-md border border-gray-100 group/file hover:bg-blue-50/50 transition-colors">
                        <span className="text-sm text-gray-700 truncate max-w-[80%] font-medium">
                          {file.name}
                        </span>
                        <div className="flex items-center gap-2">
                          <a href={file.url} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-white border border-gray-200 rounded-lg text-blue-600 hover:text-blue-800 hover:border-blue-300 transition-all shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="h-4 w-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"></path>
                            </svg>
                          </a>
                          {isAdmin && <button type="button" onClick={() => handleRemoveFile(index, fileIndex)} className="p-1 text-red-400 hover:text-red-600 transition-colors">
                            <XMarkIcon className="w-4 h-4" />
                          </button>}
                        </div>
                      </div>)}
                    </div>
                  </div>)}
                </div>
              </div>}

              {/* Add New Projects Forms */}
              {missingProjectCount > 0 && Array.from({
                length: Math.min(missingProjectCount, 3)
              }, (_, index) => {
                const projectId = `new_${index}`;
                const project = newProjects[projectId] || {
                  name: "",
                  files: []
                };
                const isLoading = uploadingProjects[projectId];
                return <div key={projectId} className="mb-8 p-6 bg-white rounded-xl border border-blue-200 shadow-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                        Project Name
                      </label>
                      <input type="text" placeholder="Enter project name" className="w-full p-4 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none bg-gray-50/50 hover:bg-white" value={project.name} onChange={e => setNewProjects(prev => ({
                        ...prev,
                        [projectId]: {
                          ...project,
                          name: e.target.value
                        }
                      }))} />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                        Project Files
                      </label>
                      <div className="space-y-3">
                        <div className="relative">
                          <input type="file" multiple accept="image/*,application/pdf,.pdf" className={`w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-700 transition-all cursor-pointer ${!project.name.trim() ? "opacity-40 cursor-not-allowed pointer-events-none" : ""}`} disabled={!project.name.trim()} onChange={e => {
                            const files = Array.from(e.target.files || []);
                            setNewProjects(prev => ({
                              ...prev,
                              [projectId]: {
                                ...project,
                                files: [...project.files, ...files]
                              }
                            }));
                          }} />
                          {!project.name.trim() && <div className="mt-3 flex items-center gap-2 text-xs text-amber-600 font-bold bg-amber-50 p-2 rounded-lg border border-amber-100 animate-pulse">
                            <FiInfo className="w-3.5 h-3.5" />
                            Enter project name first to unlock file
                            upload.
                          </div>}
                        </div>

                        {project.files.length > 0 && <div className="space-y-2 mt-4 bg-gray-50 p-4 rounded-xl border border-dashed border-gray-300">
                          <h6 className="text-[10px] font-bold text-gray-400 uppercase mb-2">Selected Files</h6>
                          {project.files.map((f: File, i) => <div key={i} className="flex items-center justify-between bg-white p-2 rounded-lg border border-gray-100 shadow-sm">
                            <span className="text-xs text-gray-700 truncate font-medium max-w-[80%]">
                              {f.name}
                            </span>
                            <button type="button" onClick={() => {
                              const updated = [...project.files];
                              updated.splice(i, 1);
                              setNewProjects(prev => ({
                                ...prev,
                                [projectId]: {
                                  ...project,
                                  files: updated
                                }
                              }));
                            }} className="p-1 px-2 text-red-500 hover:bg-red-50 rounded-md transition-colors text-[10px] font-bold">
                              <XMarkIcon className="w-3.5 h-3.5" />
                            </button>
                          </div>)}
                        </div>}
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end">
                    <button type="button" disabled={!project.name.trim() || project.files.length === 0 || isLoading} onClick={() => handleAddNewProject(projectId, project.name, project.files)} className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-xs shadow-md transition-all active:scale-95 ${!project.name.trim() || project.files.length === 0 || isLoading ? "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none" : "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-blue-500/20"}`}>
                      {isLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <PlusIcon className="w-5 h-5" />}
                      {isLoading ? "Processing..." : "Add Project"}
                    </button>
                  </div>
                </div>;
              })}
            </div>
            {isAdmin && <div className="px-6 py-6 border-t border-blue-200 bg-blue-100/30 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-3 text-sm text-blue-800 font-medium">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white shadow-md">
                  <FiInfo className="w-4 h-4" />
                </div>
                <p className="max-w-md italic">
                  {!canSaveChanges() ? "Please fill all required fields and add all required projects before saving." : "Remember to save your changes to persist the updated project list."}
                </p>
              </div>
              <button type="button" onClick={handleSaveChanges} disabled={isSavingInfo || !canSaveChanges()} title={!canSaveChanges() ? "Please fill all required fields: Specialization, Grade/Level, Years of Experience, and add all required projects" : "Save all changes"} className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-800 hover:bg-blue-900 text-white rounded-xl font-bold text-sm shadow-xl transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:shadow-none">
                {isSavingInfo ? <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div> : <FiCheck className="w-6 h-6" />}
                {isSavingInfo ? "Syncing..." : "Save All Changes"}
              </button>
            </div>}
          </div> : <div className="bg-white shadow-xl rounded-xl border border-gray-200 overflow-hidden mb-8">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-bold text-gray-800">
                  {getProjectFieldName()}
                </h3>
              </div>
              {requiredProjectCount > 0 && <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                {attachments.length} / {requiredProjectCount} Required
              </span>}
            </div>

            <div className="p-6">
              {(/* PROFESSIONAL / HARDWARE - Blue card style matching FUNDI */
                <div className="bg-blue-50 -mx-6 -mb-6 px-6 py-4">
                  <h4 className="text-md font-semibold text-blue-900 mb-4">{getProjectFieldName()}</h4>

                  {missingProjectCount > 0 && <p className="text-sm text-blue-700 mb-4">
                    Add missing projects to complete this experience profile ({missingProjectCount} remaining).
                  </p>}

                  {attachments.length > 0 && <div className="mb-6">
                    <h5 className="text-sm font-semibold text-blue-900 mb-3">
                      Uploaded Projects ({attachments.length})
                    </h5>
                    <div className="space-y-4">
                      {attachments.map((project, index) => <div key={project.id || index} className="p-4 bg-white rounded-lg border border-blue-200">
                        <div className="flex justify-between items-start mb-2">
                          <div className="text-sm font-semibold text-gray-900">
                            {project.projectName || `Project ${index + 1}`}
                          </div>
                          {isAdmin && <button type="button" onClick={() => handleRemoveFile(index, 0)} className="p-1 px-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider">
                            <XMarkIcon className="w-4 h-4" />
                            Remove
                          </button>}
                        </div>
                        <div className="space-y-2">
                          {project.files.length > 0 ? project.files.map((file, fileIndex) => <div key={fileIndex} className="flex items-center justify-between bg-gray-100 p-2 rounded-md">
                            <span className="text-sm text-gray-700 truncate">{file.name}</span>
                            <div className="flex items-center gap-2">
                              <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                                <ArrowDownTrayIcon className="h-4 w-4" />
                              </a>
                              {isAdmin && <button type="button" onClick={() => handleRemoveFile(index, fileIndex)} className="p-1 text-red-400 hover:text-red-600 transition-colors">
                                <XMarkIcon className="w-4 h-4" />
                              </button>}
                            </div>
                          </div>) : <span className="text-xs text-gray-400 italic">No files uploaded</span>}
                        </div>
                        {isAdmin && <div className="mt-3 flex justify-end">
                          <div className="relative inline-block">
                            <input type="file" multiple id={`file-upload-${index}`} onChange={e => handleFileUpload(e, index)} className="hidden" disabled={fileActionLoading[`add-${index}`]} />
                            <label htmlFor={`file-upload-${index}`} className={`flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-sm ${fileActionLoading[`add-${index}`] ? "opacity-50 cursor-not-allowed" : ""}`}>
                              {fileActionLoading[`add-${index}`] ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <PlusIcon className="w-3 h-3" />}
                              Add File
                            </label>
                          </div>
                        </div>}
                      </div>)}
                    </div>
                  </div>}

                  {isAdmin && missingProjectCount > 0 && Array.from({
                    length: Math.min(missingProjectCount, 3)
                  }, (_, index) => {
                    const projectId = `new_${index}`;
                    const project = newProjects[projectId] || {
                      name: "",
                      files: []
                    };
                    const isLoading = uploadingProjects[projectId];
                    return <div key={projectId} className="mb-6 p-4 bg-white rounded-lg border border-blue-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Project Name</label>
                          <input type="text" placeholder="Enter project name" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" value={project.name} onChange={e => setNewProjects(prev => ({
                            ...prev,
                            [projectId]: {
                              ...project,
                              name: e.target.value
                            }
                          }))} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Project Files</label>
                          <div className="space-y-2">
                            <input type="file" accept="image/*,application/pdf,.pdf" multiple className={`w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 ${!project.name.trim() ? "opacity-60 cursor-not-allowed" : ""}`} disabled={!project.name.trim()} onChange={e => {
                              const files = Array.from(e.target.files || []);
                              setNewProjects(prev => ({
                                ...prev,
                                [projectId]: {
                                  ...project,
                                  files: [...project.files, ...files]
                                }
                              }));
                            }} />
                            {!project.name.trim() && <p className="text-xs text-amber-700">Enter project name first to unlock file upload.</p>}
                            {project.files.length > 0 && <div className="space-y-1 mt-2">
                              {project.files.map((f: File, i) => <div key={i} className="flex items-center justify-between bg-gray-100 p-2 rounded-md">
                                <span className="text-sm text-gray-700 truncate">{f.name}</span>
                                <button type="button" onClick={() => {
                                  const updated = [...project.files];
                                  updated.splice(i, 1);
                                  setNewProjects(prev => ({
                                    ...prev,
                                    [projectId]: {
                                      ...project,
                                      files: updated
                                    }
                                  }));
                                }} className="p-1 text-red-500 hover:text-red-700 transition-colors">
                                  <XMarkIcon className="w-4 h-4" />
                                </button>
                              </div>)}
                            </div>}
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 flex justify-end">
                        <button type="button" disabled={!project.name.trim() || project.files.length === 0 || isLoading} onClick={() => handleAddNewProject(projectId, project.name, project.files)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                          {isLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <PlusIcon className="w-4 h-4" />}
                          <span className="text-sm font-medium">{isLoading ? "Processing..." : "Add Project"}</span>
                        </button>
                      </div>
                    </div>;
                  })}

                  {attachments.length === 0 && (!isAdmin || missingProjectCount === 0) && <div className="py-12 text-center text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300 opacity-50" />
                    <p className="text-sm font-semibold">No Projects Recorded</p>
                    <p className="text-xs text-gray-400 mt-1">Proof of work projects will appear here.</p>
                  </div>}
                </div>)}
            </div>

            {isAdmin && <div className="px-6 py-6 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-500 italic">
                <FiInfo className="w-4 h-4 text-blue-500" />
                {!canSaveChanges() ? "Please fill all required fields and add all required projects before saving." : "Remember to save your changes to persist the updated project list."}
              </div>
              <button type="button" onClick={handleSaveChanges} disabled={isSavingInfo || !canSaveChanges()} className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-800 hover:bg-blue-900 text-white rounded-xl font-bold text-sm shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100">
                {isSavingInfo ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <FiCheck className="w-5 h-5" />}
                {isSavingInfo ? "Saving Changes..." : "Save All Changes"}
              </button>
            </div>}
          </div>}

          {/* Evaluation Results Summary */}
          {userType.toLowerCase() === "fundi" && (userData?.fundiEvaluation || userData?.userProfile?.fundiEvaluation) && !isEditingEvaluation && renderEvaluationResults()}

          {/* Evaluation Criteria Instructions */}
          {userType.toLowerCase() === "fundi" && questions.length > 0 && (!(userData?.fundiEvaluation || userData?.userProfile?.fundiEvaluation) || isEditingEvaluation) && <h2 className="text-xl font-semibold mb-4 text-gray-800">
            {userType} Evaluation{" "}
            {isEditingEvaluation ? "Update" : "Guidelines"}
          </h2>}

          {/* Scoring Criteria Description */}
          {userType.toLowerCase() === "fundi" && questions.length > 0 && (!(userData?.fundiEvaluation || userData?.userProfile?.fundiEvaluation) || isEditingEvaluation) && <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
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
          </div>}

          {/* Evaluation Form */}
          {userType.toLowerCase() === "fundi" && questions.length > 0 && (!(userData?.fundiEvaluation || userData?.userProfile?.fundiEvaluation) || isEditingEvaluation) && <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">
                  Evaluation Form {isEditingEvaluation && "(Editing)"}
                </h2>
                {(userData?.userProfile?.skill || userData?.skills) && <p className="text-sm text-gray-500 mt-1">
                  Questions for:{" "}
                  <span className="font-medium text-blue-600">
                    {userData?.userProfile?.skill || userData?.skills}
                  </span>
                </p>}
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={addNewQuestion} className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition">
                  <PlusIcon className="w-4 h-4" />
                  Add Question
                </button>
              </div>
            </div>

            {/* Replacing inner <form> with <div> */}
            <div className="space-y-6">
              {/* Questions Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {questions.map((q: any) => <div key={q.id} className="space-y-2 relative bg-white p-4 rounded-lg border border-gray-200">
                  {q.isEditing ? <div className="space-y-3">
                    {/* Question Text Editor */}
                    <div>
                      <label className="text-xs font-semibold text-gray-600 block mb-1">
                        Question Text
                      </label>
                      <input value={q.text} onChange={e => {
                        const val = e.target.value;
                        setQuestions(prev => prev.map(item => item.id === q.id ? {
                          ...item,
                          text: val
                        } : item));
                      }} className="w-full text-sm p-2 border border-blue-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900" placeholder="Type your question here..." autoFocus />
                    </div>

                    {/* Question Type and Options */}
                    <div>
                      <label className="text-xs font-semibold text-gray-600 block mb-1">
                        Question Type
                      </label>
                      <select value={q.type || "OPEN"} onChange={e => {
                        setQuestions(prev => prev.map(item => item.id === q.id ? {
                          ...item,
                          type: e.target.value
                        } : item));
                      }} className="w-full text-sm p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 cursor-pointer">
                        <option value="OPEN">OPEN (Free Text)</option>
                        <option value="RADIO">RADIO (Single Choice)</option>
                        <option value="CHECKBOX">CHECKBOX (Multiple Choice)</option>
                      </select>
                    </div>

                    {(q.type === "RADIO" || q.type === "CHECKBOX") && <div>
                      <label className="text-xs font-semibold text-gray-600 block mb-1">
                        Options (comma-separated)
                      </label>
                      <input value={Array.isArray(q.options) ? q.options.join(", ") : typeof q.options === "string" ? q.options : ""} onChange={e => {
                        const optionsArray = e.target.value.split(",").map(opt => opt.trim()).filter(opt => opt);
                        setQuestions(prev => prev.map(item => item.id === q.id ? {
                          ...item,
                          options: optionsArray
                        } : item));
                      }} className="w-full text-sm p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900" placeholder="e.g., Yes, No, Maybe" />
                    </div>}

                    {q.isDraft ? <button type="button" onClick={() => handleSaveNewQuestion(q)} className="w-full px-3 py-2 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700 transition">
                      Save Question
                    </button> : <button type="button" onClick={() => handleEditToggle(q.id)} className="w-full px-3 py-2 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition">
                      Done Editing
                    </button>}
                  </div> : <>
                    {/* Question Text */}
                    <label className="block text-sm font-medium text-gray-700 pr-16">
                      {q.text}
                    </label>

                    {/* Action Buttons (Edit & Delete) */}
                    {isAdmin && <div className="absolute top-3 right-3 flex items-center gap-1">
                      <button type="button" onClick={() => handleEditToggle(q.id)} className="p-1 text-gray-400 hover:text-blue-600 transition" title="Edit question">
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button type="button" onClick={() => handleDeleteQuestion(q.id)} className="p-1 text-gray-400 hover:text-red-600 transition" title="Delete question">
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    </div>}

                    {/* Input Field (Dynamic based on Question Type) */}
                    {q.type?.toUpperCase() === "RADIO" || q.type?.toUpperCase() === "SELECT" || q.type?.toUpperCase() === "MULTIPLE_CHOICE" ? <select value={q.answer || ""} onChange={e => handleTextChange(q.id, e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-900 focus:border-blue-900">
                      <option value="" disabled>
                        Select an option
                      </option>
                      {(Array.isArray(q.options) ? q.options : ["Yes", "No"]).map((opt: string, i: number) => <option key={i} value={opt}>
                        {opt}
                      </option>)}
                    </select> : q.type?.toUpperCase() === "CHECKBOX" ? <div className="space-y-2 bg-gray-50 p-3 rounded-lg border border-dashed border-gray-300">
                      {(Array.isArray(q.options) ? q.options : ["Yes", "No"]).map((opt: any, i: number) => <label key={i} className="flex items-center gap-2 cursor-pointer group">
                        <input type="checkbox" checked={Array.isArray(q.answer) ? q.answer.includes(opt) : q.answer === opt} onChange={e => {
                          let newAnswer = Array.isArray(q.answer) ? [...q.answer] : q.answer ? [q.answer] : [];
                          if (e.target.checked) {
                            newAnswer.push(opt);
                          } else {
                            newAnswer = newAnswer.filter(a => a !== opt);
                          }
                          handleTextChange(q.id, newAnswer);
                        }} className="rounded border-gray-300 text-blue-900 focus:ring-blue-900" />
                        <span className="text-sm text-gray-600 group-hover:text-gray-900">
                          {opt}
                        </span>
                      </label>)}
                    </div> : <input type="text" value={q.answer || ""} onChange={e => handleTextChange(q.id, e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-900 focus:border-blue-900" placeholder="Enter your response..." />}

                    {/* Score Input */}
                    <div className="flex items-center gap-2 mt-2">
                      <label className="text-sm text-gray-600">
                        Score:
                      </label>
                      <input type="number" min="0" max="100" value={q.score || 0} onChange={e => handleScoreChange(q.id, e.target.value)} className="w-20 p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-900 focus:border-blue-900" />
                    </div>
                  </>}
                </div>)}
              </div>

              {/* Total Score Calculator */}
              <div className="mt-8 border-t pt-4 text-right">
                <label className="text-lg font-semibold text-gray-700 mr-2">
                  Total Score:
                </label>
                <input type="number" disabled value={Math.round(totalScore)} className="w-24 p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-900 focus:border-blue-900 text-blue-700 bg-gray-50 font-bold" />
              </div>

              {/* Audio Upload Section */}
              <div className="bg-gray-50 mt-6 p-6 rounded-xl border border-gray-200">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">
                  Audio Upload
                </h2>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload your audio response or reference (optional)
                </label>
                <input type="file" accept="audio/*" onChange={handleAudioUpload} disabled={isUploadingAudio} className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-900 focus:border-blue-900 bg-white" />
                {isUploadingAudio && <p className="mt-2 text-blue-600 text-sm">
                  Uploading audio...
                </p>}
                {!audioUrl && !isUploadingAudio && <p className="mt-2 text-gray-500 text-sm">
                  You can save the evaluation now and upload audio later.
                </p>}
                {audioUrl && <audio src={audioUrl} controls className="mt-4 w-full h-10 shadow-sm rounded-lg" />}
              </div>

              {/* Submit Button */}
              <div className="mt-6 flex flex-col sm:flex-row sm:justify-end items-stretch sm:items-center gap-2">
                {isEditingEvaluation && <button type="button" onClick={() => setIsEditingEvaluation(false)} className="w-full sm:w-auto px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition">
                  Cancel
                </button>}
                <button type="submit" disabled={isSubmitting || isUploadingAudio} className="w-full sm:w-auto bg-blue-800 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-60 font-medium">
                  {isSubmitting ? "Saving Evaluation..." : isEditingEvaluation ? "Update Evaluation" : "Save Evaluation"}
                </button>
              </div>
              {submitMessage && <div className="mt-2 text-right">
                <span className={submitMessage.includes("success") ? "text-green-600 text-sm" : "text-red-600 text-sm"}>
                  {submitMessage}
                </span>
              </div>}
            </div>
          </div>}
        </form>
      </div>
    </div>
  </div>;
};
export default FundiExperience;