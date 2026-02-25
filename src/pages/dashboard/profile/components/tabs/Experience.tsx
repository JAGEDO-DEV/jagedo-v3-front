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
import { UploadCloud, FileText, CheckCircle, XCircle } from "lucide-react";
import { FiCheck, FiChevronDown, FiRefreshCw, FiAlertCircle } from "react-icons/fi";
import { SquarePen, Clock } from "lucide-react";
import { toast, Toaster } from "sonner";
import { updateBuilderLevel, handleVerifyUser, submitEvaluation } from "@/api/provider.api";
import { adminVerifyExperience, adminRejectExperience, adminResubmitExperience } from "@/api/experience.api";
import useAxiosWithAuth from "@/utils/axiosInterceptor";


// Specialization options by user type
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

const resolveSpecialization = (user: any) => {
  if (!user) return "";

  // 1. New unified field
  if (user.specialization) return user.specialization;

  // 2. Backward compatibility
  if (user.fundispecialization) return user.fundispecialization;
  if (user.professionalSpecialization) return user.professionalSpecialization;
  if (user.contractorSpecialization) return user.contractorSpecialization;

  return "";
};

// Local storage sync omitted as per requirements.


const Experience = ({ userData, isAdmin = false }) => {

  console.log("User Data: ", userData);
  const axiosInstance = useAxiosWithAuth(import.meta.env.VITE_SERVER_URL)
  const [isEditingFields, setIsEditingFields] = useState(false);
  const [editingFields, setEditingFields] = useState({});

  // Loading States
  const [isSavingInfo, setIsSavingInfo] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [fileActionLoading, setFileActionLoading] = useState({});
  const [isPendingAction, setIsPendingAction] = useState(false);
  const [showGlobalActions, setShowGlobalActions] = useState(false);

  // Action modal state
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    action: "approve" | "reject" | "resubmit" | null;
  }>({ isOpen: false, action: null });
  const [actionReason, setActionReason] = useState("");

  // Get user type from userData
  const userType = userData?.userType || "FUNDI";
  const status = userData?.experienceStatus;

  // Statuses that should prefill/show existing data
  const PREFILL_STATUSES = ["COMPLETED", "VERIFIED", "PENDING", "RETURNED"];

  const getInitialAttachments = () => {
    // If no profile, return empty
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

      if (typeof project.fileUrl === 'object' && project.fileUrl !== null) {
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
          userData?.hardwareProjects &&
          userData?.hardwareProjects.length > 0
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
  // Initialize categories from userData or defaults
  const getInitialCategories = (): ContractorCategory[] => {
    if (userData?.contractorCategories && Array.isArray(userData.contractorCategories)) {
      return userData.contractorCategories.map((cat: any) => ({
        category: cat.category || "",
        specialization: cat.specialization || "",
        class: cat.class || cat.categoryClass || "",
        years: cat.years || cat.yearsOfExperience || "",
      }));
    }
    // Fallback: try contractorExperiences if it's an array
    if (userData?.contractorExperiences && Array.isArray(userData.contractorExperiences)) {
      return userData.contractorExperiences.map((exp: any) => ({
        category: exp.category || "",
        specialization: exp.specialization || "",
        class: exp.categoryClass || exp.class || "",
        years: exp.yearsOfExperience || exp.years || "",
      }));
    }
    return [{ category: "", specialization: "", class: "", years: "" }];
  };

  const [categories, setCategories] = useState<ContractorCategory[]>(getInitialCategories());
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

  // Initialize info from userData based on user type
  const getInitialInfo = () => {
    if (!userData) {
      return getDefaultInfo();
    }

    switch (userType) {
      case "FUNDI":
        const fundiSkill = userData.skill || userData.skills || "";
        const fundiSpecOptions = FUNDI_SPECIALIZATIONS[fundiSkill as keyof typeof FUNDI_SPECIALIZATIONS] || [];
        const defaultFundiSpec = fundiSpecOptions.length > 0 ? fundiSpecOptions[0] : "";
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
        const profSpecOptions = PROFESSIONAL_SPECIALIZATIONS[profession as keyof typeof PROFESSIONAL_SPECIALIZATIONS] || [];
        const defaultProfSpec = profSpecOptions.length > 0 ? profSpecOptions[0] : "";
        return {
          profession: profession,
          specialization:
            userData.specialization ||
            userData.professionalSpecialization ||
            defaultProfSpec,
          professionalLevel:
            userData.professionalLevel || userData.levelOrClass || "",
          yearsOfExperience:
            userData.yearsOfExperience || "",
        };

      case "CONTRACTOR":
        const category = userData.contractorType || userData.contractorTypes || "";
        const contSpecOptions = CONTRACTOR_SPECIALIZATIONS[category as keyof typeof CONTRACTOR_SPECIALIZATIONS] || [];
        const defaultContSpec = contSpecOptions.length > 0 ? contSpecOptions[0] : "";
        return {
          category: category,
          specialization:
            userData.specialization ||
            userData.contractorSpecialization ||
            defaultContSpec,
          class: userData.licenseLevel || "",
          yearsOfExperience:
            userData.contractorExperiences?.[0]?.yearsOfExperience ||
            "",

        };

      case "HARDWARE":
        const hardwareType = userData.hardwareType || userData.hardwareTypes || "";
        return {
          hardwareType: hardwareType,
          specialization:
            userData.specialization ||
            "Cement & Concrete Products",
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
            options: FUNDI_SPECIALIZATIONS[currentData.skill as keyof typeof FUNDI_SPECIALIZATIONS] || [
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
            options: PROFESSIONAL_SPECIALIZATIONS[currentData.profession as keyof typeof PROFESSIONAL_SPECIALIZATIONS] || [
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
            options: ["15+ years", "10-15 years", "5-10 years", "3-5 years", "1-3 years", "Less than 1 year"],
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
            options: CONTRACTOR_SPECIALIZATIONS[currentData.category as keyof typeof CONTRACTOR_SPECIALIZATIONS] ||
              CONTRACTOR_SPECIALIZATIONS[currentData.contractorType as keyof typeof CONTRACTOR_SPECIALIZATIONS] || [
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
            options: ["NCA1", "NCA2", "NCA3", "NCA4", "NCA5", "NCA6", "NCA7", "NCA8"],
          },
          {
            name: "yearsOfExperience",
            label: "Years of Experience",
            options: ["10+ years", "7-10 years", "5-7 years", "3-5 years", "1-3 years", "Less than 1 year"],
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
            options: ["Retail Store", "Wholesale Supplier", "Manufacturer", "Distributor"],
          },
          {
            name: "experience",
            label: "Business Experience",
            options: ["10+ years", "5-10 years", "3-5 years", "1-3 years", "Less than 1 year"],
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
    const currentGrade = isEditingFields ? editingFields.grade : info.grade;
    const currentLevel = isEditingFields ? editingFields.professionalLevel : info.professionalLevel;

    switch (userType) {
      case "FUNDI":
        if (currentGrade === "G1: Master Fundi") return 3;
        if (currentGrade === "G2: Skilled") return 2;
        if (currentGrade === "G3: Semi-skilled") return 1;
        if (currentGrade === "G4: Unskilled") return 0;
        return 0; // default for unknown grades
      case "PROFESSIONAL":
        if (currentLevel === "Senior") return 3;
        if (currentLevel === "Professional") return 2;
        if (currentLevel === "Graduate") return 1;
        if (currentLevel === "Student") return 0;
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
        "Updating local project state:",
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

  // Default evaluation questions template
  const DEFAULT_EVALUATION_QUESTIONS = [
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

  // Get skill-specific questions from localStorage or use defaults
  const getEvaluationQuestions = () => {
    const skill = userData?.userProfile?.skill || userData?.skills || info?.skill || "";

    if (userType === "FUNDI" && skill) {
      // Try to load skill-specific questions from localStorage
      const storageKey = `evaluation_questions_${skill.toLowerCase()}`;
      const storedQuestions = localStorage.getItem(storageKey);

      if (storedQuestions) {
        try {
          const parsed = JSON.parse(storedQuestions);
          // Reset answers and scores for new evaluation
          return parsed.map((q: any) => ({
            ...q,
            answer: "",
            score: 0,
            isEditing: false,
          }));
        } catch (e) {
          console.error("Failed to parse stored questions:", e);
        }
      }
    }

    return DEFAULT_EVALUATION_QUESTIONS;
  };

  // Save questions template for a skill type
  const saveQuestionsTemplate = (skill: string, questionsToSave: any[]) => {
    const storageKey = `evaluation_questions_${skill.toLowerCase()}`;
    // Save only the question structure, not answers
    const template = questionsToSave.map(q => ({
      id: q.id,
      text: q.text,
      type: q.type,
      options: q.options,
    }));
    localStorage.setItem(storageKey, JSON.stringify(template));
    toast.success(`Evaluation questions saved for ${skill}`);
  };

  // Add a new question to the current skill
  const addNewQuestion = () => {
    const newId = questions.length > 0 ? Math.max(...questions.map(q => q.id)) + 1 : 1;
    setQuestions(prev => [
      ...prev,
      {
        id: newId,
        text: "New evaluation question",
        type: "text",
        answer: "",
        score: 0,
        isEditing: true, // Start in edit mode so user can type the question
      }
    ]);
  };

  // Delete a question
  const deleteQuestion = (questionId: number) => {
    setQuestions(prev => prev.filter(q => q.id !== questionId));
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
      window.location.reload();
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
        <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{config.title}</h3>
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

  const [showVerificationMessage, setShowVerificationMessage] = useState(false);

  /* -------------------- Status Badge Component -------------------- */
  const StatusBadge = ({ status, showIcon = true }: { status: string; showIcon?: boolean }) => {
    const configs: Record<string, { bg: string; text: string; border: string; icon: any; label: string }> = {
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
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text} border ${config.border}`}>
        {showIcon && <Icon className="w-3 h-3" />}
        {config.label}
      </span>
    );
  };
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
  const handleVerify = async () => {
    setIsVerifying(true);
    const userId = userData.id;
    if (!userId) {
      toast.error("User ID not found.");
      setIsVerifying(false);
      return;
    }
    try {
      await handleVerifyUser(axiosInstance, userId)
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
  const handleEvaluationSubmit = async (e) => {
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
      audioUrl: audioUrl || null
    };

    try {
      await submitEvaluation(axiosInstance, profileId, body);
      setSubmitMessage("Evaluation submitted successfully!");
      toast.success("Evaluation submitted successfully!");
      window.location.reload();
    } catch (error: any) {
      setSubmitMessage(error.message || "Failed to submit evaluation");
      toast.error(error.message || "Failed to submit evaluation");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- localStorage-based edit skill ---
  const handleEditSkill = async (updatedFields) => {
    setIsSavingInfo(true);
    try {
      if (!userData?.id) {
        throw new Error("User ID not found");
      }

      await updateBuilderLevel(
        axiosInstance,
        userData.id,
        userType,
        updatedFields,
        (userData.userProfile || userData)
      );

      toast.success("Information updated successfully");
      setInfo((prevInfo) => deepMerge(prevInfo, updatedFields));
      setIsEditingFields(false);
      window.location.reload();
    } catch (error: any) {
      toast.error(error.message || "Failed to update information");
      console.error("Edit skill error:", error);
    } finally {
      setIsSavingInfo(false);
    }
  };

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
                    className="flex items-center gap-2 py-2 px-4 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                  >
                    Actions
                    <FiChevronDown className={`w-4 h-4 transition-transform ${showGlobalActions ? "rotate-180" : ""}`} />
                  </button>
                  {showGlobalActions && (
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                      <button
                        type="button"
                        onClick={async () => {
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
                        }}
                        className="w-full flex items-center gap-2 px-4 py-3 text-sm text-green-700 hover:bg-gray-50 transition border-b border-gray-100"
                      >
                        <FiCheck className="w-4 h-4" />
                        Approve
                      </button>
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
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>

          {(userData?.experienceStatus === "REJECTED" || userData?.experienceStatus === "RESUBMIT") && userData?.experienceStatusReason && (
            <div className={`mb-8 p-4 rounded-xl border flex items-start gap-4 ${userData.experienceStatus === "REJECTED" ? "bg-red-50 border-red-200" : "bg-blue-50 border-blue-200"
              }`}>
              <div className={`p-2 rounded-lg ${userData.experienceStatus === "REJECTED" ? "bg-red-100" : "bg-blue-100"
                }`}>
                <FiAlertCircle className={`w-5 h-5 ${userData.experienceStatus === "REJECTED" ? "text-red-600" : "text-blue-600"
                  }`} />
              </div>
              <div>
                <h3 className={`font-semibold text-sm ${userData.experienceStatus === "REJECTED" ? "text-red-900" : "text-blue-900"
                  }`}>
                  {userData.experienceStatus === "REJECTED" ? "Experience Rejected" : "Resubmission Required"}
                </h3>
                <p className={`text-sm mt-1 ${userData.experienceStatus === "REJECTED" ? "text-red-700" : "text-blue-700"
                  }`}>
                  {userData.experienceStatusReason}
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleEvaluationSubmit} className="space-y-8">
            {/* Skills Section - Card Based Design */}
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">
                {userData?.userType} Information
              </h2>

              {userType.toLowerCase() !== "contractor" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {fields.map((field, index) => {
                    const isGradeField =
                      field.name === "grade" || field.name === "professionalLevel";
                    const fieldValue =
                      typeof info[field.name] === "string" ? info[field.name] : "";

                    return (
                      <div
                        key={index}
                        className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <label className="text-sm font-medium text-gray-600">
                            {field.label}
                          </label>
                          {!isEditingFields && (
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

                        {isGradeField ||
                          field.name === "experience" ||
                          field.name === "yearsOfExperience" ? (
                          isEditingFields ? (
                            <select
                              value={editingFields[field.name] ?? fieldValue ?? ""}
                              onChange={(e) =>
                                setEditingFields((prev) => ({
                                  ...prev,
                                  [field.name]: e.target.value,
                                }))
                              }
                              className="w-full p-3 border border-gray-300 rounded-lg text-sm"
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
                            <p className="text-gray-900 font-medium">
                              {fieldValue || "Not Provided"}
                            </p>
                          )
                        ) : (
                          isEditingFields ? (
                            <select
                              value={editingFields[field.name] ?? fieldValue ?? ""}
                              onChange={(e) => {
                                const newValue = e.target.value;
                                setEditingFields((prev) => {
                                  const updated = { ...prev, [field.name]: newValue };
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
                              className="w-full p-3 border border-gray-300 rounded-lg text-sm"
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
                            <p className="text-gray-900 font-medium">
                              {fieldValue || "Not Provided"}
                            </p>
                          )
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {isEditingFields && (
                <div className="mt-6 flex flex-col sm:flex-row justify-end gap-3">
                  <button
                    type="button"
                    className="w-full sm:w-auto px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium disabled:opacity-50"
                    onClick={() => setIsEditingFields(false)}
                    disabled={isSavingInfo}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => {
                      handleEditSkill(editingFields);
                    }}
                    disabled={isSavingInfo}
                  >
                    {isSavingInfo ? "Saving..." : "Save Changes"}
                  </button>
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
                    <div key={index} className="bg-white p-4 rounded-lg border border-gray-200 relative">
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
                              updated[index].specialization = ""; // Reset specialization when category changes
                              setCategories(updated);

                              // Auto-add a project row for this category if not already exists
                              if (newCategory) {
                                const projectExists = attachments.some(
                                  (att) => att.projectName?.toLowerCase().includes(newCategory.toLowerCase())
                                );
                                if (!projectExists) {
                                  const newProject = {
                                    id: attachments.length + 1,
                                    projectName: `${newCategory} Project`,
                                    files: [],
                                    category: newCategory,
                                  };
                                  setAttachments([...attachments, newProject]);
                                  toast.info(`Project row added for ${newCategory}`);
                                }
                              }
                            }}
                            className="w-full p-2 border border-gray-300 rounded-md text-sm"
                          >
                            <option value="">Select category</option>
                            {Object.keys(CONTRACTOR_SPECIALIZATIONS).map((cat, i) => (
                              <option key={i} value={cat}>{cat}</option>
                            ))}
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
                            {(CONTRACTOR_SPECIALIZATIONS[cat.category as keyof typeof CONTRACTOR_SPECIALIZATIONS] || []).map((spec, i) => (
                              <option key={i} value={spec}>{spec}</option>
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
                            {["NCA1", "NCA2", "NCA3", "NCA4", "NCA5", "NCA6", "NCA7", "NCA8"].map((c, i) => (
                              <option key={i} value={c}>{c}</option>
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
                            {["10+ years", "7-10 years", "5-7 years", "3-5 years", "1-3 years", "Less than 1 year"].map((y, i) => (
                              <option key={i} value={y}>{y}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Category info hint */}
                      {cat.category && (
                        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm text-blue-700">
                            <span className="font-medium">Note:</span> For {cat.category}, the following documents will be required in Account Uploads:
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
                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={async () => {
                      const validCategories = categories.filter(c => c.category && c.class && c.years);
                      if (validCategories.length === 0) {
                        toast.error("Please fill in at least one category with all required fields");
                        return;
                      }

                      setIsSavingInfo(true);
                      try {
                        const contractorExperiences = validCategories.map(c => ({
                          category: c.category,
                          specialization: c.specialization,
                          categoryClass: c.class,
                          yearsOfExperience: c.years,
                        }));

                        const profile = userData?.userProfile || {};
                        const updatedProfile = {
                          ...profile,
                          contractorExperiences,
                          contractorCategories: validCategories,
                        };

                        await updateBuilderLevel(
                          axiosInstance,
                          userData.id,
                          userType,
                          {},
                          updatedProfile
                        );

                        toast.success("Categories saved successfully!");
                        window.location.reload();
                      } catch (error: any) {
                        toast.error(error.message || "Failed to save categories");
                      } finally {
                        setIsSavingInfo(false);
                      }
                    }}
                    disabled={isSavingInfo}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                  >
                    {isSavingInfo ? "Saving..." : "Save Categories"}
                  </button>
                </div>
              </div>
            )}

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

              <div className="p-4 border-t border-gray-100 flex justify-end">
                <button
                  type="button"
                  onClick={async () => {
                    setIsSavingInfo(true);
                    try {
                      await updateBuilderLevel(
                        axiosInstance,
                        userData.id,
                        userType,
                        {},
                        userData.userProfile
                      );
                      toast.success("Projects saved successfully!");
                      window.location.reload();
                    } catch (error: any) {
                      toast.error(error.message || "Failed to save projects");
                    } finally {
                      setIsSavingInfo(false);
                    }
                  }}
                  disabled={isSavingInfo}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-medium text-sm disabled:opacity-50"
                >
                  {isSavingInfo ? "Saving..." : "Save Projects"}
                </button>
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
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-800">
                        Evaluation Form
                      </h2>
                      {(userData?.userProfile?.skill || userData?.skills) && (
                        <p className="text-sm text-gray-500 mt-1">
                          Questions for: <span className="font-medium text-blue-600">{userData?.userProfile?.skill || userData?.skills}</span>
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
                      {(userData?.userProfile?.skill || userData?.skills) && (
                        <button
                          type="button"
                          onClick={() => saveQuestionsTemplate(userData?.userProfile?.skill || userData?.skills, questions)}
                          className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition"
                        >
                          Save as Template
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Replacing inner <form> with <div> */}
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {questions.map((q) => (
                        <div key={q.id} className="space-y-2 relative bg-white p-4 rounded-lg border border-gray-200">
                          {q.isEditing ? (
                            <div className="flex items-center gap-2">
                              <input
                                value={q.text}
                                onChange={(e) =>
                                  handleQuestionEdit(q.id, e.target.value)
                                }
                                onBlur={(e) =>
                                  handleQuestionEdit(q.id, e.target.value)
                                }
                                onKeyDown={(e) => e.stopPropagation()}
                                className="flex-1 text-sm p-2 border border-blue-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900"
                                placeholder="Type your question here..."
                                autoFocus
                              />
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
                                  onClick={() => deleteQuestion(q.id)}
                                  title="Delete question"
                                >
                                  <XMarkIcon className="w-4 h-4" />
                                </button>
                              </div>
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
                              <option value="" disabled>Select an option</option>
                              {q.options?.map((opt, i) => (
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
                              onKeyDown={(e) => e.stopPropagation()}
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

                    <div className="mt-6 flex flex-col sm:flex-row sm:justify-end items-stretch sm:items-center gap-2">
                      {
                        <button
                          type="submit"
                          className="w-full sm:w-auto bg-blue-800 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-60 font-medium"
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
                        className={`text-2xl font-bold ${userData.userProfile.fundiEvaluation.totalScore >= 90
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
                        className={`px-3 py-1 rounded-full text-sm font-medium ${userData.userProfile.fundiEvaluation.totalScore >= 90
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
                        className={`h-3 rounded-full transition-all duration-500 ${userData.userProfile.fundiEvaluation.totalScore >= 90
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
                        className={`px-2 py-1 rounded text-sm font-medium ${userData.userProfile.fundiEvaluation
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
                        className={`px-2 py-1 rounded text-sm font-medium ${userData.userProfile.fundiEvaluation
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
                        className={`px-2 py-1 rounded text-sm font-medium ${userData.userProfile.fundiEvaluation
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
                        className={`px-2 py-1 rounded text-sm font-medium ${userData.userProfile.fundiEvaluation
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

          </form>
        </div>
      </div>
    </div>
  );
};

export default Experience;
