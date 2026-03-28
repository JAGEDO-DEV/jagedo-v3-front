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
import {
  UploadCloud,
  FileText,
  CheckCircle,
  XCircle,
  EyeIcon,
  InfoIcon as LucideInfoIcon,
} from "lucide-react";
import {
  FiCheck,
  FiChevronDown,
  FiRefreshCw,
  FiAlertCircle,
  FiInfo,
} from "react-icons/fi";
import { SquarePen, Clock } from "lucide-react";
import { toast, Toaster } from "sonner";
import { updateBuilderLevel, handleVerifyUser } from "@/api/provider.api";
import {
  adminVerifyExperience,
  adminRejectExperience,
  adminResubmitExperience,
  adminUpdateFundiExperience,
  adminUpdateProfessionalExperience,
  adminUpdateContractorExperience,
  getEvaluationQuestions,
  createEvaluationQuestion,
  updateEvaluationQuestion,
  deleteEvaluationQuestion,
  uploadEvaluationAudio,
  updateEvaluation,
} from "@/api/experience.api";
import useAxiosWithAuth from "@/utils/axiosInterceptor";
import { uploadFile } from "@/utils/fileUpload";

const FUNDI_SPECIALIZATIONS = {
  Mason: [
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
  Electrician: [
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
  Plumber: [
    "General Plumbing",
    "Water Systems",
    "Drainage & Sewer",
    "Gas Plumbing",
    "Bathroom Installation",
    "Kitchen Installation",
    "Pipe Welding",
    "Solar Water Systems",
  ],
  Carpenter: [
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
  Painter: [
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
  Welder: [
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
  Tiler: [
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
  Roofer: [
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
};

const PROFESSIONAL_SPECIALIZATIONS = {
  "Project Manager": [
    "Construction Project Management",
    "Infrastructure Projects",
    "Residential Development",
    "Commercial Development",
    "Industrial Projects",
    "Government Projects",
    "Real Estate Development",
    "Renovation & Remodeling",
    "Green Building Projects",
    "Multi-site Management",
  ],
  Architect: [
    "Residential Architecture",
    "Commercial Architecture",
    "Industrial Architecture",
    "Landscape Architecture",
    "Interior Architecture",
    "Urban Planning",
    "Sustainable Design",
    "Historic Preservation",
    "Healthcare Facilities",
    "Educational Facilities",
  ],
  "Water Engineer": [
    "Water Supply Systems",
    "Wastewater Treatment",
    "Stormwater Management",
    "Irrigation Engineering",
    "Hydraulic Structures",
    "Pipeline Engineering",
    "Water Resources Management",
    "Flood Control",
    "Desalination Systems",
    "Environmental Water Solutions",
  ],
  "Roads Engineer": [
    "Highway Design",
    "Urban Road Design",
    "Pavement Engineering",
    "Traffic Engineering",
    "Bridge Engineering",
    "Road Rehabilitation",
    "Drainage Design",
    "Survey & Mapping",
    "Construction Supervision",
    "Road Safety Engineering",
  ],
  "Structural Engineer": [
    "Building Structures",
    "Bridge Structures",
    "Industrial Structures",
    "Concrete Structures",
    "Steel Structures",
    "Foundation Engineering",
    "Seismic Design",
    "Structural Assessment",
    "Retrofit & Rehabilitation",
    "Temporary Structures",
  ],
  "Mechanical Engineer": [
    "HVAC Systems",
    "Plumbing Systems",
    "Fire Protection Systems",
    "Elevator & Escalator Systems",
    "Industrial Machinery",
    "Energy Systems",
    "Building Automation",
    "Refrigeration Systems",
    "Ventilation Design",
    "Mechanical Maintenance",
  ],
  "Electrical Engineer": [
    "Power Distribution",
    "Lighting Design",
    "Building Electrical Systems",
    "Industrial Electrical",
    "Renewable Energy Systems",
    "Control Systems",
    "Telecommunications",
    "Security Systems",
    "Fire Alarm Systems",
    "Energy Management",
  ],
  Surveyor: [
    "Land Surveying",
    "Topographic Surveys",
    "Construction Surveying",
    "Cadastral Surveys",
    "Engineering Surveys",
    "GPS & GIS Mapping",
    "Hydrographic Surveys",
    "Quantity Surveying",
    "Boundary Surveys",
    "As-built Surveys",
  ],
  "Quantity Surveyor": [
    "Cost Estimation",
    "Bill of Quantities",
    "Contract Administration",
    "Value Engineering",
    "Project Cost Control",
    "Procurement Management",
    "Final Account Settlement",
    "Risk Assessment",
    "Feasibility Studies",
    "Life Cycle Costing",
  ],
};

const CONTRACTOR_SPECIALIZATIONS = {
  "Building Works": [
    "Residential Construction",
    "Commercial Construction",
    "Industrial Construction",
    "Institutional Buildings",
    "High-rise Buildings",
    "Housing Estates",
    "Renovation & Remodeling",
    "Prefabricated Construction",
    "Green Building Construction",
    "Mixed-use Developments",
  ],
  "Water Works": [
    "Water Supply Networks",
    "Sewerage Systems",
    "Water Treatment Plants",
    "Irrigation Systems",
    "Borehole Drilling",
    "Dam Construction",
    "Pipeline Installation",
    "Pump Stations",
    "Water Storage Tanks",
    "Flood Control Systems",
  ],
  "Electrical Works": [
    "Power Line Installation",
    "Substation Construction",
    "Building Electrical Works",
    "Street Lighting",
    "Solar Power Installation",
    "Generator Installation",
    "Industrial Electrical",
    "Fire Alarm Systems",
    "Security Systems Installation",
    "Smart Building Systems",
  ],
  "Mechanical Works": [
    "HVAC Installation",
    "Plumbing & Sanitary Works",
    "Fire Fighting Systems",
    "Elevator & Escalator Installation",
    "Industrial Equipment Installation",
    "Refrigeration Systems",
    "Compressed Air Systems",
    "Steam & Boiler Systems",
    "Piping Works",
    "Mechanical Maintenance",
  ],
  "Roads & Infrastructure": [
    "Road Construction",
    "Bridge Construction",
    "Culvert Construction",
    "Drainage Systems",
    "Pavement Works",
    "Highway Construction",
    "Airport Runways",
    "Railway Construction",
    "Port & Marine Works",
    "Urban Infrastructure",
  ],
  "Landscaping & External Works": [
    "Landscape Construction",
    "Paving & Hardscaping",
    "Fencing & Gates",
    "Swimming Pool Construction",
    "Sports Facilities",
    "Playground Construction",
    "Retaining Walls",
    "Outdoor Lighting",
    "Irrigation Installation",
    "Environmental Landscaping",
  ],
};

const deepMerge = (target: any, source: any): any => {
  const result = { ...target };
  for (const key in source) {
    if (
      source[key] &&
      typeof source[key] === "object" &&
      !Array.isArray(source[key])
    ) {
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

const Experience = ({ userData, isAdmin = false, refetch = () => {} }) => {
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
  }>({ isOpen: false, action: null });
  const [actionReason, setActionReason] = useState("");

  const userType = userData?.userType || "FUNDI";
  const status = userData?.experienceStatus;

  const [availableQuestions, setAvailableQuestions] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [isEditingEvaluation, setIsEditingEvaluation] = useState(false);

  useEffect(() => {
    const fetchQuestions = async () => {
      setIsLoadingQuestions(true);
      try {
        const response = await getEvaluationQuestions(axiosInstance, "FUNDI");

        const extractedData = Array.isArray(response)
          ? response
          : response?.data && Array.isArray(response.data)
            ? response.data
            : [];

        setAvailableQuestions(extractedData);
      } catch (error: any) {
        console.error("Failed to fetch questions:", error);
        toast.error("Failed to load evaluation questions");
      } finally {
        setIsLoadingQuestions(false);
      }
    };

    if (userType === "FUNDI") {
      fetchQuestions();
    }
  }, [userType, userData?.id]);

  useEffect(() => {
    if (availableQuestions.length > 0) {
      const evaluation =
        userData?.fundiEvaluation || userData?.userProfile?.fundiEvaluation;
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
        }));
        setQuestions(initial);
      }
    }
  }, [
    availableQuestions,
    userData?.fundiEvaluation,
    userData?.userProfile?.fundiEvaluation,
  ]);

  const prefillQuestionsFromData = () => {
    const evaluation =
      userData?.fundiEvaluation || userData?.userProfile?.fundiEvaluation;
    if (!evaluation || !availableQuestions.length) return;

    const prefilled = availableQuestions.map((q: any, index: number) => {
      let answer = "";
      let score = 0;

      const savedResponse = evaluation.responses?.find(
        (r: any) => r.questionId === q.id || r.text === q.text,
      );

      if (savedResponse) {
        answer = savedResponse.answer;
        score = savedResponse.score;
      } else if (index < 4) {
        const legacyFields = [
          { ans: evaluation.hasMajorWorks, sc: evaluation.majorWorksScore },
          { ans: evaluation.materialsUsed, sc: evaluation.materialsUsedScore },
          {
            ans: evaluation.essentialEquipment,
            sc: evaluation.essentialEquipmentScore,
          },
          {
            ans: evaluation.quotationFormulation,
            sc: evaluation.quotationFormulaScore,
          },
        ];
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

    switch (userType) {
      case "FUNDI":
        projectData = userData?.previousJobPhotoUrls || [];
        break;
      case "PROFESSIONAL":
        projectData = userData?.professionalProjects || [];
        break;
      case "CONTRACTOR":
        projectData = userData?.contractorProjects || [];
        break;
      case "HARDWARE":
        projectData = userData?.hardwareProjects || [];
        break;
      default:
        projectData = userData?.previousJobPhotoUrls || [];
    }

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
        files: [
          {
            name: `${pName}.jpg`,
            url: pUrl,
          },
        ],
      };
    });
  };

  const profileUploaded = (userData) => {
    switch (userData?.userType) {
      case "FUNDI":
        return (
          userData?.previousJobPhotoUrls &&
          userData?.previousJobPhotoUrls.length > 0
        );
      case "PROFESSIONAL":
        return userData?.userProfile?.specialization.professionalLevel;
      case "CONTRACTOR":
        return (
          userData?.contractorProjects &&
          userData?.contractorProjects.length > 0
        );
      case "HARDWARE":
        return (
          userData?.hardwareProjects && userData?.hardwareProjects.length > 0
        );
      default:
        return false;
    }
  };

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

  const getInitialCategories = (): ContractorCategory[] => {
    if (
      userData?.contractorCategories &&
      Array.isArray(userData.contractorCategories)
    ) {
      return userData.contractorCategories.map((cat: any) => ({
        category: cat.category || "",
        specialization: cat.specialization || "",
        class: (cat.class || cat.categoryClass || "").replace(/\s+/g, ""),
        years: cat.years || cat.yearsOfExperience || "",
      }));
    }

    if (
      userData?.contractorExperiences &&
      Array.isArray(userData.contractorExperiences)
    ) {
      return userData.contractorExperiences.map((exp: any) => ({
        category: exp.category || "",
        specialization: exp.specialization || "",
        class: (exp.categoryClass || exp.class || "").replace(/\s+/g, ""),
        years: exp.yearsOfExperience || exp.years || "",
      }));
    }
    return [{ category: "", specialization: "", class: "", years: "" }];
  };

  const [categories, setCategories] = useState<ContractorCategory[]>(
    getInitialCategories(),
  );
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

  const getInitialInfo = () => {
    if (!userData) {
      return getDefaultInfo();
    }

    switch (userType) {
      case "FUNDI":
        const fundiSkill = userData.skill || userData.skills || "";
        const fundiSpecOptions =
          FUNDI_SPECIALIZATIONS[
            fundiSkill as keyof typeof FUNDI_SPECIALIZATIONS
          ] || [];
        const defaultFundiSpec =
          fundiSpecOptions.length > 0 ? fundiSpecOptions[0] : "";
        return {
          skill: fundiSkill,
          specialization:
            userData.specialization ||
            userData.fundispecialization ||
            defaultFundiSpec,
          grade: userData.grade || "",
          experience: userData.experience || "",
        };

      case "PROFESSIONAL":
        const profession = userData.profession || "";
        const profSpecOptions =
          PROFESSIONAL_SPECIALIZATIONS[
            profession as keyof typeof PROFESSIONAL_SPECIALIZATIONS
          ] || [];
        const defaultProfSpec =
          profSpecOptions.length > 0 ? profSpecOptions[0] : "";
        return {
          profession: profession,
          specialization:
            userData.specialization ||
            userData.professionalSpecialization ||
            defaultProfSpec,
          professionalLevel:
            userData.professionalLevel || userData.levelOrClass || "",
          yearsOfExperience: userData.yearsOfExperience || "",
        };

      case "CONTRACTOR":
        const category =
          userData.contractorType || userData.contractorTypes || "";
        const contSpecOptions =
          CONTRACTOR_SPECIALIZATIONS[
            category as keyof typeof CONTRACTOR_SPECIALIZATIONS
          ] || [];
        const defaultContSpec =
          contSpecOptions.length > 0 ? contSpecOptions[0] : "";
        return {
          category: category,
          specialization:
            userData.specialization ||
            userData.contractorSpecialization ||
            defaultContSpec,
          class: userData.licenseLevel || "",
          yearsOfExperience:
            userData.contractorExperiences?.[0]?.yearsOfExperience || "",
        };

      case "HARDWARE":
        const hardwareType =
          userData.hardwareType || userData.hardwareTypes || "";
        return {
          hardwareType: hardwareType,
          specialization:
            userData.specialization || "Cement & Concrete Products",
          businessType: userData.businessType || "",
          experience: userData.experience || "",
        };

      default:
        return getDefaultInfo();
    }
  };

  const getDefaultInfo = () => {
    return {
      skill: "",
      specialization: "",
      grade: "",
      experience: "",
    };
  };

  const [info, setInfo] = useState(getInitialInfo());

  useEffect(() => {
    setInfo(getInitialInfo());
    setAttachments(getInitialAttachments());
    setCategories(getInitialCategories());
  }, [userData]);
  const getFieldsConfig = () => {
    const currentData = isEditingFields ? editingFields : info;

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
              "Welder",
              "Tiler",
              "Roofer",
            ],
          },
          {
            name: "specialization",
            label: "Specialization",
            options: FUNDI_SPECIALIZATIONS[
              currentData.skill as keyof typeof FUNDI_SPECIALIZATIONS
            ] || [
              "Block Work & Brick Laying",
              "Plastering & Rendering",
              "Stone Masonry",
              "Concrete Work",
              "Foundation Work",
            ],
            dependsOn: "skill",
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
            options: ["10+ years", "5-10 years", "3-5 years", "1-3 years"],
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
              "Electrical Engineer",
              "Surveyor",
              "Quantity Surveyor",
            ],
          },
          {
            name: "specialization",
            label: "Specialization",
            options: PROFESSIONAL_SPECIALIZATIONS[
              currentData.profession as keyof typeof PROFESSIONAL_SPECIALIZATIONS
            ] || [
              "Residential Architecture",
              "Commercial Architecture",
              "Industrial Architecture",
              "Landscape Architecture",
              "Interior Architecture",
            ],
            dependsOn: "profession",
          },
          {
            name: "professionalLevel",
            label: "Professional Level",
            options: ["Senior", "Professional", "Graduate", "Student"],
          },
          {
            name: "yearsOfExperience",
            label: "Years of Experience",
            options: [
              "15+ years",
              "10-15 years",
              "5-10 years",
              "3-5 years",
              "1-3 years",
              "Less than 1 year",
            ],
          },
        ];

      case "CONTRACTOR":
        return [
          {
            name: "category",
            label: "Category",
            options: [
              "Building Works",
              "Water Works",
              "Electrical Works",
              "Mechanical Works",
              "Roads & Infrastructure",
              "Landscaping & External Works",
            ],
          },
          {
            name: "specialization",
            label: "Specialization",
            options: CONTRACTOR_SPECIALIZATIONS[
              currentData.category as keyof typeof CONTRACTOR_SPECIALIZATIONS
            ] ||
              CONTRACTOR_SPECIALIZATIONS[
                currentData.contractorType as keyof typeof CONTRACTOR_SPECIALIZATIONS
              ] || [
                "Residential Construction",
                "Commercial Construction",
                "Industrial Construction",
                "Institutional Buildings",
                "High-rise Buildings",
              ],
            dependsOn: "category",
          },
          {
            name: "class",
            label: "NCA Class",
            options: [
              "NCA1",
              "NCA2",
              "NCA3",
              "NCA4",
              "NCA5",
              "NCA6",
              "NCA7",
              "NCA8",
            ],
          },
          {
            name: "yearsOfExperience",
            label: "Years of Experience",
            options: [
              "10+ years",
              "7-10 years",
              "5-7 years",
              "3-5 years",
              "1-3 years",
              "Less than 1 year",
            ],
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
              "Plumbing Supplies",
              "Paint & Finishes",
              "Roofing Materials",
              "Timber & Wood Products",
              "Steel & Metal Products",
            ],
          },
          {
            name: "specialization",
            label: "Specialization",
            options: [
              "Cement & Concrete Products",
              "Bricks & Blocks",
              "Sand & Aggregates",
              "Tiles & Flooring",
              "Doors & Windows",
              "Electrical Fittings",
              "Plumbing Fittings",
              "Paint & Coatings",
              "Hand Tools",
              "Power Tools",
            ],
          },
          {
            name: "businessType",
            label: "Business Type",
            options: [
              "Retail Store",
              "Wholesale Supplier",
              "Manufacturer",
              "Distributor",
            ],
          },
          {
            name: "experience",
            label: "Business Experience",
            options: [
              "10+ years",
              "5-10 years",
              "3-5 years",
              "1-3 years",
              "Less than 1 year",
            ],
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
              "Welder",
              "Tiler",
              "Roofer",
            ],
          },
          {
            name: "specialization",
            label: "Specialization",
            options: [
              "Block Work & Brick Laying",
              "Plastering & Rendering",
              "Stone Masonry",
              "Concrete Work",
              "Foundation Work",
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
            options: ["10+ years", "5-10 years", "3-5 years", "1-3 years"],
          },
        ];
    }
  };

  const fields = getFieldsConfig();

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
          rawFile: file,
        })),
      );
      updatedAttachments = newAttachments;
      return newAttachments;
    });

    toast.success("Files added to project locally.", { id: toastId });
    setFileActionLoading((prev) => ({ ...prev, [loadingKey]: false }));
  };

  const getRequiredProjectCount = () => {
    const currentGrade = isEditingFields ? editingFields.grade : info.grade;
    const currentLevel = isEditingFields
      ? editingFields.professionalLevel
      : info.professionalLevel;

    switch (userType) {
      case "FUNDI":
        if (currentGrade === "G1: Master Fundi") return 3;
        if (currentGrade === "G2: Skilled") return 2;
        if (currentGrade === "G3: Semi-skilled") return 1;
        if (currentGrade === "G4: Unskilled") return 0;
        return 0;
      case "PROFESSIONAL":
        if (currentLevel === "Senior") return 3;
        if (currentLevel === "Professional") return 2;
        if (currentLevel === "Graduate") return 1;
        if (currentLevel === "Student") return 0;
        return 0;
      case "CONTRACTOR":
        return 1;
      case "HARDWARE":
        return 2;
      default:
        return 0;
    }
  };

  const requiredProjectCount = getRequiredProjectCount();
  const missingProjectCount = Math.max(
    0,
    requiredProjectCount - attachments.length,
  );

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
        rawFile: file,
      })),
    };

    setAttachments((prev) => [...prev, newProject]);
    toast.success(`${projectName} added locally!`);
    
    
    setNewProjects((prev) => {
      const updated = { ...prev };
      const currentIndex = parseInt(projectId.replace('new_', ''), 10);
      
      
      for(let i = currentIndex; i < 5; i++) {
         if (updated[`new_${i+1}`]) {
             updated[`new_${i}`] = updated[`new_${i+1}`];
         } else {
             updated[`new_${i}`] = { name: "", files: [] };
         }
      }
      return updated;
    });

    setUploadingProjects((prev) => ({ ...prev, [projectId]: false }));
  };

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
          rawFile: file,
        };
      }
      updatedAttachments = newAttachments;
      return newAttachments;
    });

    e.target.value = "";
    toast.success("File replaced locally.", { id: toastId });
    setFileActionLoading((prev) => ({ ...prev, [loadingKey]: false }));
  };

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

    toast.success("File removed locally.", { id: toastId });
    setFileActionLoading((prev) => ({ ...prev, [loadingKey]: false }));
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
      isDraft: true,
    };

    setQuestions((prev) => [...prev, newQuestion]);
  };

  const handleSaveNewQuestion = async (draft: any) => {
    if (!draft.isDraft) return;

    setIsLoadingQuestions(true);
    try {
      const payload = {
        text: draft.text,
        type: (draft.type || "OPEN").toUpperCase(),
        category: "FUNDI",
        isActive: true,
      };

      const response = await createEvaluationQuestion(axiosInstance, payload);
      const realQuestion = response?.data || response;

      setQuestions((prev) =>
        (Array.isArray(prev) ? prev : []).map((q) =>
          q.id === draft.id
            ? {
                ...q,
                id: realQuestion.id,
                isEditing: false,
                isDraft: false,
              }
            : q,
        ),
      );

      setAvailableQuestions((prev) => [
        ...(Array.isArray(prev) ? prev : []),
        realQuestion,
      ]);

      toast.success("Question created and synced");
    } catch (error: any) {
      toast.error(error.message || "Failed to save question");
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  const handleDeleteQuestion = async (questionId: any) => {
    const q = questions.find((item) => item.id === questionId);
    if (!q) return;

    if (
      !isAdmin ||
      !window.confirm("Are you sure you want to delete this question?")
    )
      return;

    if (q.isDraft) {
      setQuestions((prev) => prev.filter((item) => item.id !== questionId));
      return;
    }

    setIsLoadingQuestions(true);
    try {
      await deleteEvaluationQuestion(axiosInstance, questionId);

      setAvailableQuestions((prev) =>
        (Array.isArray(prev) ? prev : []).filter((q) => q.id !== questionId),
      );
      setQuestions((prev) =>
        (Array.isArray(prev) ? prev : []).filter((q) => q.id !== questionId),
      );
      toast.success("Question deleted");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete question");
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  const handleUpdateTemplate = async (
    questionId: any,
    text: string,
    type: string,
    options?: string[],
  ) => {
    if (!isAdmin) return;

    const q = questions.find((item) => item.id === questionId);
    if (!q || q.isDraft) return;

    try {
      const payload = {
        text,
        type: type.toUpperCase(),
        options,
      };

      const response = await updateEvaluationQuestion(
        axiosInstance,
        questionId,
        payload,
      );
      const updated = response?.data || response;

      setAvailableQuestions((prev) =>
        (Array.isArray(prev) ? prev : []).map((q) =>
          q.id === questionId ? updated : q,
        ),
      );
      toast.success("Question updated successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to update question");
    }
  };



  useEffect(() => {
    setNewProjects((prev) => {
      const updated = { ...prev };
      let changed = false;
      
      const targetCount = Math.min(missingProjectCount, 5);
      for (let i = 0; i < targetCount; i++) {
        const key = `new_${i}`;
        if (!updated[key]) {
          updated[key] = { name: "", files: [] };
          changed = true;
        }
      }
      return changed ? updated : prev;
    });
  }, [missingProjectCount]);

  const handleTextChange = (id, value) => {
    setQuestions((prev) =>
      (Array.isArray(prev) ? prev : []).map((q) =>
        q.id === id ? { ...q, answer: value } : q,
      ),
    );
  };

  const handleScoreChange = (id, value) => {
    const num = parseFloat(value) || 0;
    if (num > 100) return;
    setQuestions((prev) =>
      (Array.isArray(prev) ? prev : []).map((q) =>
        q.id === id ? { ...q, score: num } : q,
      ),
    );
  };

  const handleEditToggle = (id) => {
    setQuestions((prev) =>
      (Array.isArray(prev) ? prev : []).map((q) =>
        q.id === id ? { ...q, isEditing: !q.isEditing } : q,
      ),
    );
  };

  const handleQuestionEdit = async (id, newText) => {
    setQuestions((prev) =>
      (Array.isArray(prev) ? prev : []).map((q) =>
        q.id === id ? { ...q, text: newText, isEditing: false } : q,
      ),
    );

    if (isAdmin) {
      const q = questions.find((item) => item.id === id);
      if (q && !q.isDraft) {
        handleUpdateTemplate(id, newText, q.type, q.options);
      }
    }
  };

  const totalScore =
    questions.length > 0
      ? questions.reduce((sum, q) => sum + q.score, 0) / questions.length
      : 0;

  const closeActionModal = () => {
    setActionModal({ isOpen: false, action: null });
    setActionReason("");
  };

  const submitAction = async () => {
    const { action } = actionModal;
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

    const { action } = actionModal;

    const configs = {
      approve: {
        title: "Approve Experience",
        description: `Are you sure you want to approve this user's experience?`,
        buttonText: "Approve",
        buttonColor: "bg-green-600 hover:bg-green-700",
        needsReason: false,
      },
      reject: {
        title: "Reject Experience",
        description: `Please provide a reason for rejecting this experience submission:`,
        buttonText: "Reject",
        buttonColor: "bg-red-600 hover:bg-red-700",
        needsReason: true,
      },
      resubmit: {
        title: "Request Resubmission",
        description: `Please specify what needs to be corrected in the experience profile:`,
        buttonText: "Request Resubmission",
        buttonColor: "bg-blue-600 hover:bg-blue-700",
        needsReason: true,
      },
    };

    const config = configs[action!];

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
        <div
          className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {config.title}
          </h3>
          <p className="text-sm text-gray-600 mb-4">{config.description}</p>

          {config.needsReason && (
            <textarea
              autoFocus
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              onKeyDown={(e) => e.stopPropagation()}
              placeholder="Enter reason..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              rows={3}
            />
          )}

          <div className="flex gap-3 mt-4">
            <button
              type="button"
              disabled={isPendingAction}
              onClick={submitAction}
              className={`flex-1 py-2 px-4 text-white rounded-lg font-medium transition disabled:opacity-50 ${config.buttonColor}`}
            >
              {isPendingAction ? "Processing..." : config.buttonText}
            </button>
            <button
              type="button"
              disabled={isPendingAction}
              onClick={closeActionModal}
              className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderEvaluationResults = () => {
    const evaluation =
      userData?.fundiEvaluation || userData?.userProfile?.fundiEvaluation;
    if (!evaluation) return null;

    const displayQuestions =
      questions.length > 0 ? questions : evaluation.responses || [];

    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-8">
        <div className="bg-blue-900 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <h3 className="text-lg font-bold text-white">
                Evaluation Results
              </h3>
            </div>
            {isAdmin && !isEditingEvaluation && (
              <button
                type="button"
                onClick={() => {
                  prefillQuestionsFromData();
                  setIsEditingEvaluation(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold transition-colors border border-white/20"
              >
                <SquarePen className="w-3.5 h-3.5 text-blue-300" />
                Edit Evaluation
              </button>
            )}
          </div>
          <div className="bg-white/10 px-4 py-1 rounded-full border border-white/20">
            <span className="text-sm font-semibold text-white">
              Total Score:{" "}
              <span className="text-green-400 text-lg">
                {evaluation.totalScore}%
              </span>
            </span>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {displayQuestions.map((q, idx) => (
              <div
                key={idx}
                className="bg-gray-50 p-4 rounded-lg border border-gray-100"
              >
                <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Question {idx + 1}
                </p>
                <h4 className="text-base font-semibold text-gray-800 mb-3">
                  {q.text}
                </h4>
                <div className="bg-white p-3 rounded border border-gray-200 mb-2">
                  <p className="text-sm text-gray-700 italic">
                    {Array.isArray(q.answer)
                      ? q.answer.join(", ")
                      : q.answer || "N/A"}
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
              </div>
            ))}
          </div>

          {evaluation.audioUrl && (
            <div className="mt-8 border-t pt-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <LucideInfoIcon className="w-4 h-4 text-blue-500" />
                Audio Feedback Reference
              </h4>
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <audio
                  key={evaluation.audioUrl}
                  src={evaluation.audioUrl}
                  controls
                  className="w-full h-10 custom-audio-player"
                >
                  Your browser does not support the audio element.
                </audio>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const [showVerificationMessage, setShowVerificationMessage] = useState(false);

  /* -------------------- Status Badge Component -------------------- */
  const StatusBadge = ({
    status,
    showIcon = true,
  }: {
    status: string;
    showIcon?: boolean;
  }) => {
    const configs: Record<
      string,
      { bg: string; text: string; border: string; icon: any; label: string }
    > = {
      pending: {
        bg: "bg-amber-50",
        text: "text-amber-700",
        border: "border-amber-200",
        icon: Clock,
        label: "Pending Review",
      },
      VERIFIED: {
        bg: "bg-green-50",
        text: "text-green-700",
        border: "border-green-200",
        icon: CheckCircle,
        label: "Approved",
      },
      REJECTED: {
        bg: "bg-red-50",
        text: "text-red-700",
        border: "border-red-200",
        icon: XCircle,
        label: "Rejected",
      },
      RESUBMIT: {
        bg: "bg-blue-50",
        text: "text-blue-700",
        border: "border-blue-200",
        icon: FiRefreshCw,
        label: "Re-upload Required",
      },
    };

    const config = configs[status] || configs.pending;
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text} border ${config.border}`}
      >
        {showIcon && <Icon className="w-3 h-3" />}
        {config.label}
      </span>
    );
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

    const evaluation =
      userData?.fundiEvaluation || userData?.userProfile?.fundiEvaluation;
    const audioUrlFromData =
      evaluation?.audioUrl || userData?.userProfile?.audioUploadUrl;

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

  const handleAudioUpload = async (event) => {
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
      toast.success("Audio uploaded successfully", { id: toastId });
    } catch (error: any) {
      toast.error(error.message || "Audio upload failed", { id: toastId });
    } finally {
      setIsUploadingAudio(false);
    }
  };

  const handleEvaluationSubmit = async (e) => {
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

      responses: questions.map((q) => ({
        questionId: q.id,
        text: q.text,
        answer: q.answer,
        score: q.score,
        type: q.type,
      })),

      totalScore: totalScore,
      audioUrl: audioUrl || null,
    };

    try {
      await updateEvaluation(axiosInstance, profileId, body);
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

      const updatedAttachments = await Promise.all(
        attachments.map(async (project) => {
          const updatedFiles = await Promise.all(
            project.files.map(async (f) => {
              if (f.rawFile) {
                const uploaded = await uploadFile(f.rawFile);
                return { name: f.name, url: uploaded.url };
              }
              return { name: f.name, url: f.url };
            }),
          );
          return { ...project, files: updatedFiles };
        }),
      );

      let response;
      if (userType === "FUNDI") {
        const flattenedProjectFiles = updatedAttachments.flatMap((project) =>
          project.files.map((file) => ({
            projectName: project.projectName,
            fileUrl: file.url,
          })),
        );

        const payload = {
          skill: isEditingFields ? editingFields.skill : info.skill,
          specialization: isEditingFields
            ? editingFields.specialization
            : info.specialization,
          grade: isEditingFields ? editingFields.grade : info.grade,
          experience: isEditingFields
            ? editingFields.experience
            : info.experience,
          previousJobPhotoUrls: flattenedProjectFiles,
        };

        response = await adminUpdateFundiExperience(
          axiosInstance,
          userData.id,
          payload,
        );
      } else if (userType === "PROFESSIONAL") {
        const professionalProjects = updatedAttachments.map((project) => ({
          projectName: project.projectName,
          files: project.files.map((f) => f.url),
        }));

        const payload = {
          profession: isEditingFields
            ? editingFields.profession
            : info.profession,
          level: isEditingFields
            ? editingFields.professionalLevel
            : info.professionalLevel,
          yearsOfExperience: isEditingFields
            ? editingFields.yearsOfExperience
            : info.yearsOfExperience,
          professionalProjects,
        };

        response = await adminUpdateProfessionalExperience(
          axiosInstance,
          userData.id,
          payload,
        );
      } else if (userType === "CONTRACTOR") {
        const contractorProjects = updatedAttachments.map((project) => ({
          projectName: project.projectName,
          files: project.files.map((f) => f.url),
        }));

        const validCategories = categories.filter(
          (c) => c.category && c.class && c.years,
        );
        const contractorExperiences = validCategories.map((c) => ({
          category: c.category,
          specialization: c.specialization,
          categoryClass: c.class,
          yearsOfExperience: c.years,
        }));

        const payload = {
          contractorExperiences,
          contractorProjects,
        };

        response = await adminUpdateContractorExperience(
          axiosInstance,
          userData.id,
          payload,
        );
      } else {
        await updateBuilderLevel(
          axiosInstance,
          userData.id,
          userType,
          isEditingFields ? editingFields : {},
          userData.userProfile || userData,
        );
      }

      toast.success("All changes saved successfully!", { id: toastId });

      if (isEditingFields) {
        setInfo((prevInfo) =>
          deepMerge(prevInfo, isEditingFields ? editingFields : {}),
        );
        setIsEditingFields(false);
      }

      if (refetch) {
        refetch();
      } else {
        window.location.reload();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to save changes", { id: toastId });
      console.error("Save changes error:", error);
    } finally {
      setIsSavingInfo(false);
    }
  };

  
  const isExperienceReadyToApprove = (): boolean => {
    const requiredCount = getRequiredProjectCount(); 

    switch (userType) {
      case "FUNDI": {
        const hasGrade = !!(isEditingFields ? editingFields.grade : info.grade);
        const hasExperience = !!(isEditingFields
          ? editingFields.experience
          : info.experience);
        const hasSkill = !!(isEditingFields ? editingFields.skill : info.skill);
        
        const hasEnoughProjects =
          attachments.length >= requiredCount &&
          requiredCount > 0 &&
          attachments.every((a) => a.files.length > 0);
        return hasGrade && hasExperience && hasSkill && hasEnoughProjects;
      }
      case "PROFESSIONAL": {
        const hasProfession = !!(isEditingFields
          ? editingFields.profession
          : info.profession);
        const hasLevel = !!(isEditingFields
          ? editingFields.professionalLevel
          : info.professionalLevel);
        const hasYears = !!(isEditingFields
          ? editingFields.yearsOfExperience
          : info.yearsOfExperience);
        const hasEnoughProjects =
          attachments.length >= requiredCount &&
          requiredCount > 0 &&
          attachments.every((a) => a.files.length > 0);
        return hasProfession && hasLevel && hasYears && hasEnoughProjects;
      }
      case "CONTRACTOR": {
        const hasValidCategories = categories.some(
          (c) => c.category && c.class && c.years,
        );
        
        const hasEnoughProjects =
          attachments.length >= 1 &&
          attachments.every((a) => a.files.length > 0);
        return hasValidCategories && hasEnoughProjects;
      }
      case "HARDWARE": {
        const hasType = !!(isEditingFields
          ? editingFields.hardwareType
          : info.hardwareType);
        const hasBusinessType = !!(isEditingFields
          ? editingFields.businessType
          : info.businessType);
        const hasExperience = !!(isEditingFields
          ? editingFields.experience
          : info.experience);
        
        const hasEnoughProjects =
          attachments.length >= requiredCount &&
          requiredCount > 0 &&
          attachments.every((a) => a.files.length > 0);
        return hasType && hasBusinessType && hasExperience && hasEnoughProjects;
      }
      default:
        return false;
    }
  };

  const readyToApprove = isExperienceReadyToApprove();
  return (
    <div className="flex">
      <Toaster position="top-center" richColors />
      <div className="bg-gray-50 min-h-screen w-full relative">
        {renderActionModal()}
        <div className="max-w-6xl bg-white rounded-xl shadow-lg p-8">
          {/* Header with Approve Button */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-800">
              {userData?.userType} Experience
            </h1>
            <div className="flex items-center gap-3">
              <StatusBadge status={userData?.experienceStatus || "pending"} />
              {/* Global Actions Dropdown - Admin Only */}
              {isAdmin && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowGlobalActions(!showGlobalActions)}
                    disabled={userData?.experienceStatus === "VERIFIED"}
                    className={`flex items-center gap-2 py-2 px-4 text-white rounded-lg text-sm font-medium transition ${
                      userData?.experienceStatus === "VERIFIED"
                        ? "bg-gray-400 cursor-not-allowed opacity-60"
                        : "bg-blue-600 hover:bg-blue-700"
                    }`}
                  >
                    Actions
                    <FiChevronDown
                      className={`w-4 h-4 transition-transform ${showGlobalActions ? "rotate-180" : ""}`}
                    />
                  </button>
                  {showGlobalActions && (
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                      {/* Approve — only when not already VERIFIED */}
                      {userData?.experienceStatus !== "VERIFIED" && (
                      <button
                        type="button"
                        disabled={!readyToApprove || isPendingAction}
                        title={
                          !readyToApprove
                            ? "All required fields and projects must be filled before approving"
                            : "Approve experience"
                        }
                        onClick={async () => {
                          setShowGlobalActions(false);
                          setIsPendingAction(true);
                          try {
                            await adminVerifyExperience(
                              axiosInstance,
                              userData.id,
                            );
                            toast.success("Experience approved successfully");
                            window.location.reload();
                          } catch (error: any) {
                            toast.error(
                              error.message || "Failed to approve experience",
                            );
                          } finally {
                            setIsPendingAction(false);
                          }
                        }}
                        className={`w-full flex items-center gap-2 px-4 py-3 text-sm transition border-b border-gray-100
    ${
      !readyToApprove
        ? "opacity-40 cursor-not-allowed text-gray-400 bg-gray-50"
        : "text-green-700 hover:bg-gray-50"
    }`}
                      >
                        <FiCheck className="w-4 h-4" />
                        Approve
                        {!readyToApprove && (
                          <span className="ml-auto text-[10px] text-gray-400 font-normal">
                            Incomplete
                          </span>
                        )}
                      </button>
                      )}
                      {/* Resubmit — only when not already VERIFIED */}
                      {userData?.experienceStatus !== "VERIFIED" && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowGlobalActions(false);
                          setActionModal({ isOpen: true, action: "resubmit" });
                        }}
                        className="w-full flex items-center gap-2 px-4 py-3 text-sm text-amber-700 hover:bg-amber-50 transition border-b border-gray-100"
                      >
                        <FiRefreshCw className="w-4 h-4" />
                        Resubmit
                      </button>
                      )}
                      {/* Reject — only when not already VERIFIED or REJECTED */}
                      {userData?.experienceStatus !== "VERIFIED" && userData?.experienceStatus !== "REJECTED" && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowGlobalActions(false);
                          setActionModal({ isOpen: true, action: "reject" });
                        }}
                        className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-700 hover:bg-red-50 transition"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {userType === "FUNDI" && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg text-sm">
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
            </div>
          )}

          {(userData?.experienceStatus === "REJECTED" ||
            userData?.experienceStatus === "RESUBMIT") &&
            userData?.experienceStatusReason && (
              <div
                className={`mb-8 p-4 rounded-xl border flex items-start gap-4 ${
                  userData.experienceStatus === "REJECTED"
                    ? "bg-red-50 border-red-200"
                    : "bg-blue-50 border-blue-200"
                }`}
              >
                <div
                  className={`p-2 rounded-lg ${
                    userData.experienceStatus === "REJECTED"
                      ? "bg-red-100"
                      : "bg-blue-100"
                  }`}
                >
                  <FiAlertCircle
                    className={`w-5 h-5 ${
                      userData.experienceStatus === "REJECTED"
                        ? "text-red-600"
                        : "text-blue-600"
                    }`}
                  />
                </div>
                <div>
                  <h3
                    className={`font-semibold text-sm ${
                      userData.experienceStatus === "REJECTED"
                        ? "text-red-900"
                        : "text-blue-900"
                    }`}
                  >
                    {userData.experienceStatus === "REJECTED"
                      ? "Experience Rejected"
                      : "Resubmission Required"}
                  </h3>
                  <p
                    className={`text-sm mt-1 ${
                      userData.experienceStatus === "REJECTED"
                        ? "text-red-700"
                        : "text-blue-700"
                    }`}
                  >
                    {userData.experienceStatusReason}
                  </p>
                </div>
              </div>
            )}

          <form onSubmit={handleEvaluationSubmit} className="space-y-8">
            {/* Skills Section - Card Based Design */}
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
                <LucideInfoIcon className="w-5 h-5 text-blue-600" />
                {userData?.userType} Information
              </h2>

              {userType.toLowerCase() !== "contractor" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {fields.map((field, index) => {
                    const isGradeField =
                      field.name === "grade" ||
                      field.name === "professionalLevel";
                    const fieldValue =
                      typeof info[field.name] === "string"
                        ? info[field.name]
                        : "";

                    return (
                      <div
                        key={index}
                        className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:border-blue-300 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-3 border-b border-gray-50 pb-2">
                          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            {field.label}
                          </label>
                          {!isEditingFields &&
                            isAdmin &&
                            !(
                              userType === "FUNDI" && field.name === "skill"
                            ) && (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingFields({ ...info });
                                  setIsEditingFields(true);
                                }}
                                className="text-blue-600 hover:text-blue-800 transition"
                              >
                                <PencilIcon className="w-4 h-4" />
                              </button>
                            )}
                        </div>

                        {isEditingFields &&
                        !(userType === "FUNDI" && field.name === "skill") ? (
                          <select
                            value={
                              editingFields[field.name] ?? fieldValue ?? ""
                            }
                            onChange={(e) => {
                              const newValue = e.target.value;
                              setEditingFields((prev) => {
                                const updated = {
                                  ...prev,
                                  [field.name]: newValue,
                                };
                                if (
                                  field.name === "skill" ||
                                  field.name === "profession" ||
                                  field.name === "category"
                                ) {
                                  updated.specialization = "";
                                }
                                return updated;
                              });
                            }}
                            className="w-full p-2 border border-blue-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                          >
                            <option value="" disabled>
                              Select {field.label.toLowerCase()}
                            </option>
                            {field.options.map((opt, i) => (
                              <option key={i} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <p className="text-blue-900 font-bold text-sm truncate">
                            {fieldValue || "N/A"}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {isEditingFields && (
                <div className="mt-6 flex flex-col sm:sm:flex-row justify-end gap-3 border-t pt-4">
                  <button
                    type="button"
                    className="w-full sm:w-auto px-6 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition font-medium text-sm"
                    onClick={() => setIsEditingFields(false)}
                    disabled={isSavingInfo}
                  >
                    Cancel
                  </button>
                  <div className="hidden sm:block text-xs text-gray-400 self-center">
                    Don't forget to save changes at the bottom
                  </div>
                </div>
              )}
            </div>

            {/* Contractor Categories Section */}
            {userType === "CONTRACTOR" && (
              <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-800">
                    Work Categories
                  </h2>
                  <button
                    type="button"
                    onClick={addCategory}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm"
                  >
                    <PlusIcon className="w-4 h-4" />
                    Add Category
                  </button>
                </div>

                <div className="space-y-6">
                  {categories.map((cat, index) => (
                    <div
                      key={index}
                      className="bg-white p-4 rounded-lg border border-gray-200 relative"
                    >
                      {categories.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeCategory(index)}
                          className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                          title="Remove category"
                        >
                          <XMarkIcon className="w-5 h-5" />
                        </button>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Category */}
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Category
                          </label>
                          <select
                            value={cat.category}
                            onChange={(e) => {
                              const newCategory = e.target.value;
                              const updated = [...categories];
                              updated[index].category = newCategory;
                              updated[index].specialization = "";
                              setCategories(updated);

                              if (newCategory) {
                                const projectExists = attachments.some((att) =>
                                  att.projectName
                                    ?.toLowerCase()
                                    .includes(newCategory.toLowerCase()),
                                );
                                if (!projectExists) {
                                  const newProject = {
                                    id: attachments.length + 1,
                                    projectName: `${newCategory} Project`,
                                    files: [],
                                    category: newCategory,
                                  };
                                  setAttachments([...attachments, newProject]);
                                  toast.info(
                                    `Project row added for ${newCategory}`,
                                  );
                                }
                              }
                            }}
                            className="w-full p-2 border border-gray-300 rounded-md text-sm"
                          >
                            <option value="">Select category</option>
                            {Object.keys(CONTRACTOR_SPECIALIZATIONS).map(
                              (cat, i) => (
                                <option key={i} value={cat}>
                                  {cat}
                                </option>
                              ),
                            )}
                          </select>
                        </div>

                        {/* Specialization */}
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Specialization
                          </label>
                          <select
                            value={cat.specialization}
                            onChange={(e) => {
                              const updated = [...categories];
                              updated[index].specialization = e.target.value;
                              setCategories(updated);
                            }}
                            className="w-full p-2 border border-gray-300 rounded-md text-sm"
                            disabled={!cat.category}
                          >
                            <option value="">Select specialization</option>
                            {Array.from(
                              new Set(
                                [
                                  ...(CONTRACTOR_SPECIALIZATIONS[
                                    cat.category as keyof typeof CONTRACTOR_SPECIALIZATIONS
                                  ] || []),
                                  cat.specialization,
                                ].filter(Boolean),
                              ),
                            ).map((spec, i) => (
                              <option key={i} value={spec as string}>
                                {spec as string}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Class */}
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            NCA Class
                          </label>
                          <select
                            value={cat.class}
                            onChange={(e) => {
                              const updated = [...categories];
                              updated[index].class = e.target.value;
                              setCategories(updated);
                            }}
                            className="w-full p-2 border border-gray-300 rounded-md text-sm"
                          >
                            <option value="">Select class</option>
                            {Array.from(
                              new Set(
                                [
                                  "NCA1",
                                  "NCA2",
                                  "NCA3",
                                  "NCA4",
                                  "NCA5",
                                  "NCA6",
                                  "NCA7",
                                  "NCA8",
                                  cat.class,
                                ].filter(Boolean),
                              ),
                            ).map((c, i) => (
                              <option key={i} value={c as string}>
                                {c as string}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Years of Experience */}
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Years of Experience
                          </label>
                          <select
                            value={cat.years}
                            onChange={(e) => {
                              const updated = [...categories];
                              updated[index].years = e.target.value;
                              setCategories(updated);
                            }}
                            className="w-full p-2 border border-gray-300 rounded-md text-sm"
                          >
                            <option value="">Select experience</option>
                            {Array.from(
                              new Set(
                                [
                                  "10+ years",
                                  "7-10 years",
                                  "5-7 years",
                                  "3-5 years",
                                  "1-3 years",
                                  "Less than 1 year",
                                  cat.years,
                                ].filter(Boolean),
                              ),
                            ).map((y, i) => (
                              <option key={i} value={y as string}>
                                {y as string}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Category info hint */}
                      {cat.category && (
                        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm text-blue-700">
                            <span className="font-medium">Note:</span> For{" "}
                            {cat.category}, the following documents will be
                            required in Account Uploads:
                          </p>
                          <ul className="mt-2 text-sm text-blue-600 list-disc list-inside">
                            <li>{cat.category} Certificate</li>
                            <li>{cat.category} Practice License</li>
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Save Categories Button */}
              </div>
            )}

            {/* {userType} Project Attachments */}
            <div className="bg-white shadow-xl rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-bold text-gray-800">
                    {getProjectFieldName()}
                  </h3>
                </div>
                {requiredProjectCount > 0 && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                    {attachments.length} / {requiredProjectCount} Required
                  </span>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-bold tracking-wider border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left">No.</th>
                      <th className="px-6 py-4 text-left">Project Name</th>
                      <th className="px-6 py-4 text-left">Proof of Work</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {attachments.length > 0 ? (
                      attachments.map((row, index) => (
                        <tr
                          key={row.id}
                          className="hover:bg-blue-50/30 transition-colors"
                        >
                          <td className="px-6 py-4 text-gray-400 font-medium whitespace-nowrap">
                            #{index + 1}
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-semibold text-gray-900 block truncate max-w-[200px]">
                              {row.projectName || `Unnamed Project`}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-2">
                              {row.files.length > 0 ? (
                                row.files.map((file, fileIndex) => (
                                  <div
                                    key={fileIndex}
                                    className="relative group w-12 h-12 bg-gray-100 rounded-lg border border-gray-200 overflow-hidden shadow-sm"
                                  >
                                    <img
                                      src={file.url}
                                      alt={file.name}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src =
                                          "https://placehold.co/100x100?text=File";
                                      }}
                                    />
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                                      <a
                                        href={file.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-1 bg-white/20 rounded-md hover:bg-white/40 transition-colors text-white"
                                        title="View File"
                                      >
                                        <EyeIcon className="w-3.5 h-3.5" />
                                      </a>
                                      {isAdmin && (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleRemoveFile(index, fileIndex)
                                          }
                                          className="p-1 bg-red-500/80 rounded-md hover:bg-red-600 transition-colors text-white"
                                          title="Remove File"
                                        >
                                          <XMarkIcon className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <span className="text-gray-400 italic text-xs">
                                  No files uploaded
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {isAdmin && (
                                <div className="relative inline-block">
                                  <input
                                    type="file"
                                    multiple
                                    id={`file-upload-${index}`}
                                    onChange={(e) => handleFileUpload(e, index)}
                                    className="hidden"
                                    disabled={fileActionLoading[`add-${index}`]}
                                  />
                                  <label
                                    htmlFor={`file-upload-${index}`}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-sm ${
                                      fileActionLoading[`add-${index}`]
                                        ? "opacity-50 cursor-not-allowed"
                                        : ""
                                    }`}
                                  >
                                    {fileActionLoading[`add-${index}`] ? (
                                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                      <PlusIcon className="w-3 h-3" />
                                    )}
                                    Add
                                  </label>
                                </div>
                              )}
                              {isAdmin && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveFile(index, 0)}
                                  className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Delete Project Row"
                                >
                                  <XMarkIcon className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-6 py-12 text-center text-gray-500"
                        >
                          <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300 opacity-50" />
                          <p className="text-sm font-semibold">
                            No Projects Recorded
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            Proof of work projects will appear here.
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {isAdmin && (
                <div className="px-6 py-6 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-sm text-gray-500 italic">
                    <FiInfo className="w-4 h-4 text-blue-500" />
                    Saving will update both professional info and projects.
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveChanges}
                    disabled={isSavingInfo}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-blue-800 hover:bg-blue-900 text-white rounded-xl font-bold text-base shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSavingInfo ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <FiCheck className="w-5 h-5" />
                    )}
                    {isSavingInfo ? "Saving Changes..." : "Save All Changes"}
                  </button>
                </div>
              )}
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
            {/* Evaluation Results Summary */}
            {userType.toLowerCase() === "fundi" &&
              (userData?.fundiEvaluation ||
                userData?.userProfile?.fundiEvaluation) &&
              !isEditingEvaluation &&
              renderEvaluationResults()}

            {/* Evaluation Criteria Instructions */}
            {userType.toLowerCase() === "fundi" &&
              (!(
                userData?.fundiEvaluation ||
                userData?.userProfile?.fundiEvaluation
              ) ||
                isEditingEvaluation) && (
                <h2 className="text-xl font-semibold mb-4 text-gray-800">
                  {userType} Evaluation{" "}
                  {isEditingEvaluation ? "Update" : "Guidelines"}
                </h2>
              )}

            {/* Scoring Criteria Description */}
            {userType.toLowerCase() === "fundi" &&
              (!(
                userData?.fundiEvaluation ||
                userData?.userProfile?.fundiEvaluation
              ) ||
                isEditingEvaluation) && (
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
              (!(
                userData?.fundiEvaluation ||
                userData?.userProfile?.fundiEvaluation
              ) ||
                isEditingEvaluation) && (
                <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-800">
                        Evaluation Form {isEditingEvaluation && "(Editing)"}
                      </h2>
                      {(userData?.userProfile?.skill || userData?.skills) && (
                        <p className="text-sm text-gray-500 mt-1">
                          Questions for:{" "}
                          <span className="font-medium text-blue-600">
                            {userData?.userProfile?.skill || userData?.skills}
                          </span>
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={addNewQuestion}
                        className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition"
                      >
                        <PlusIcon className="w-4 h-4" />
                        Add Question
                      </button>
                    </div>
                  </div>

                  {/* Replacing inner <form> with <div> */}
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {questions.map((q) => (
                        <div
                          key={q.id}
                          className="space-y-2 relative bg-white p-4 rounded-lg border border-gray-200"
                        >
                          {q.isEditing ? (
                            <div className="flex items-center gap-2">
                              <input
                                value={q.text}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setQuestions((prev) =>
                                    prev.map((item) =>
                                      item.id === q.id
                                        ? { ...item, text: val }
                                        : item,
                                    ),
                                  );
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleEditToggle(q.id);
                                }}
                                className="flex-1 text-sm p-2 border border-blue-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900"
                                placeholder="Type your question here..."
                                autoFocus
                              />
                              {q.isDraft && (
                                <button
                                  type="button"
                                  onClick={() => handleSaveNewQuestion(q)}
                                  className="px-3 py-2 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition"
                                >
                                  Save
                                </button>
                              )}
                            </div>
                          ) : (
                            <>
                              <label className="block text-sm font-medium text-gray-700 pr-16">
                                {q.text}
                              </label>
                              <div className="absolute top-3 right-3 flex items-center gap-1">
                                <button
                                  type="button"
                                  className="p-1 text-gray-400 hover:text-blue-600 transition"
                                  onClick={() => handleEditToggle(q.id)}
                                  title="Edit question"
                                >
                                  <PencilIcon className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  className="p-1 text-gray-400 hover:text-red-600 transition"
                                  onClick={() => handleDeleteQuestion(q.id)}
                                  title="Delete question"
                                >
                                  <XMarkIcon className="w-4 h-4" />
                                </button>
                              </div>
                            </>
                          )}

                          {/* Question Type — always OPEN */}
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] uppercase font-bold text-gray-400">
                              Type:
                            </span>
                            <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 rounded px-1.5 py-0.5">
                              OPEN
                            </span>
                          </div>

                          {q.type?.toUpperCase() === "RADIO" ||
                          q.type?.toUpperCase() === "SELECT" ? (
                            <div className="space-y-2">
                              <select
                                value={q.answer}
                                onChange={(e) =>
                                  handleTextChange(q.id, e.target.value)
                                }
                                className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-900 focus:border-blue-900"
                              >
                                <option value="" disabled>
                                  Select an option
                                </option>
                                {q.options?.map((opt, i) => (
                                  <option key={i} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                              </select>
                              {isAdmin && (
                                <div className="flex gap-1 items-center">
                                  <input
                                    placeholder="Add option..."
                                    className="text-xs p-1 border rounded flex-1"
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        const val =
                                          e.currentTarget.value.trim();
                                        if (val) {
                                          const newOpts = [
                                            ...(q.options || []),
                                            val,
                                          ];
                                          setQuestions((prev) =>
                                            prev.map((item) =>
                                              item.id === q.id
                                                ? { ...item, options: newOpts }
                                                : item,
                                            ),
                                          );
                                          handleUpdateTemplate(
                                            q.id,
                                            q.text,
                                            q.type?.toUpperCase(),
                                            newOpts,
                                          );
                                          e.currentTarget.value = "";
                                        }
                                      }
                                    }}
                                  />
                                  <span className="text-[10px] text-gray-400">
                                    Press Enter
                                  </span>
                                </div>
                              )}
                            </div>
                          ) : q.type?.toUpperCase() === "CHECKBOX" ? (
                            <div className="space-y-2 bg-gray-50 p-3 rounded-lg border border-dashed border-gray-300">
                              {q.options?.map((opt, i) => (
                                <label
                                  key={i}
                                  className="flex items-center gap-2 cursor-pointer group"
                                >
                                  <input
                                    type="checkbox"
                                    checked={
                                      Array.isArray(q.answer)
                                        ? q.answer.includes(opt)
                                        : q.answer === opt
                                    }
                                    onChange={(e) => {
                                      let newAnswer = Array.isArray(q.answer)
                                        ? [...q.answer]
                                        : q.answer
                                          ? [q.answer]
                                          : [];
                                      if (e.target.checked) {
                                        newAnswer.push(opt);
                                      } else {
                                        newAnswer = newAnswer.filter(
                                          (a) => a !== opt,
                                        );
                                      }
                                      handleTextChange(q.id, newAnswer);
                                    }}
                                    className="rounded border-gray-300 text-blue-900 focus:ring-blue-900"
                                  />
                                  <span className="text-sm text-gray-600 group-hover:text-gray-900">
                                    {opt}
                                  </span>
                                  {isAdmin && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newOpts = q.options.filter(
                                          (_, idx) => idx !== i,
                                        );
                                        setQuestions((prev) =>
                                          prev.map((item) =>
                                            item.id === q.id
                                              ? { ...item, options: newOpts }
                                              : item,
                                          ),
                                        );
                                        handleUpdateTemplate(
                                          q.id,
                                          q.text,
                                          q.type?.toUpperCase(),
                                          newOpts,
                                        );
                                      }}
                                      className="hidden group-hover:block text-red-400 hover:text-red-600"
                                    >
                                      <XMarkIcon className="w-3 h-3" />
                                    </button>
                                  )}
                                </label>
                              ))}
                              {isAdmin && (
                                <input
                                  placeholder="Add option..."
                                  className="text-xs p-1 border rounded w-full bg-white"
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      const val = e.currentTarget.value.trim();
                                      if (val) {
                                        const newOpts = [
                                          ...(q.options || []),
                                          val,
                                        ];
                                        setQuestions((prev) =>
                                          prev.map((item) =>
                                            item.id === q.id
                                              ? { ...item, options: newOpts }
                                              : item,
                                          ),
                                        );
                                        handleUpdateTemplate(
                                          q.id,
                                          q.text,
                                          q.type?.toUpperCase(),
                                          newOpts,
                                        );
                                        e.currentTarget.value = "";
                                      }
                                    }
                                  }}
                                />
                              )}
                            </div>
                          ) : (
                            <textarea
                              value={q.answer}
                              onChange={(e) =>
                                handleTextChange(q.id, e.target.value)
                              }
                              onKeyDown={(e) => e.stopPropagation()}
                              className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-900 focus:border-blue-900 text-sm"
                              placeholder="Enter your response..."
                              rows={3}
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
                          <audio
                            key={audioUrl}
                            src={audioUrl}
                            controls
                            className="w-full h-10 shadow-sm rounded-lg overflow-hidden"
                          >
                            Your browser does not support the audio element.
                          </audio>
                        </div>
                      )}
                    </div>

                    <div className="mt-6 flex flex-col sm:flex-row sm:justify-end items-stretch sm:items-center gap-2">
                      {isEditingEvaluation && (
                        <button
                          type="button"
                          onClick={() => {
                            prefillQuestionsFromData();
                            setIsEditingEvaluation(false);
                          }}
                          className="w-full sm:w-auto px-6 py-3 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition font-medium"
                        >
                          Cancel Edit
                        </button>
                      )}
                      {
                        <button
                          type="submit"
                          className="w-full sm:w-auto bg-blue-800 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-60 font-medium"
                          disabled={isSubmitting}
                        >
                          {isSubmitting
                            ? "Submitting..."
                            : isEditingEvaluation
                              ? "Update Evaluation"
                              : "Submit Evaluation"}
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
          </form>
        </div>
      </div>
    </div>
  );
};

export default Experience;
