export type BuilderStatus = "VERIFIED" | "COMPLETED" | "SIGNED_UP" | "PENDING" | "INCOMPLETE" | "RETURNED";

export interface UserProfile {
  // FUNDI fields
  skill?: string;
  grade?: string;
  experience?: string;
  previousJobPhotoUrls?: Array<{ projectName: string; fileUrl: string }>;
  
  // PROFESSIONAL fields
  profession?: string;
  professionalLevel?: string;
  yearsOfExperience?: string;
  professionalProjects?: Array<{ projectName: string; fileUrl: string }>;
  
  // CONTRACTOR fields
  contractorType?: string;
  licenseLevel?: string;
  contractorExperiences?: string;
  contractorProjects?: Array<{ projectName: string; fileUrl: string }>;
  
  // HARDWARE fields
  hardwareType?: string;
  businessType?: string;
  hardwareProjects?: Array<{ projectName: string; fileUrl: string }>;
}

export interface Builder {
  id: number;
  userType: "FUNDI" | "PROFESSIONAL" | "CONTRACTOR" | "HARDWARE";
  firstName?: string;
  lastName?: string;
  organizationName?: string;
  email: string;
  phoneNumber: string;
  // Address fields - empty for SIGNED_UP
  county?: string;
  subCounty?: string;
  ward?: string;
  village?: string;
  // Account type
  accountType?: "individual" | "business";
  adminApproved: boolean;
  status: BuilderStatus;
  // Legacy flat fields for backwards compatibility
  skills?: string;
  specialization?: string;
  grade?: string;
  experience?: string;
  profession?: string;
  level?: string;
  contractorTypes?: string;
  hardwareTypes?: string;
  // Nested profile - null for SIGNED_UP, empty for INCOMPLETE, full for others
  userProfile?: UserProfile | null;
  createdAt: string;
  userProfile?: UserProfile;
}

export const STATUS_LABELS: Record<BuilderStatus, string> = {
  VERIFIED: "Verified",
  COMPLETED: "Completed",
  SIGNED_UP: "Signed Up",
  PENDING: "Pending",
  INCOMPLETE: "Incomplete",
  RETURNED: "Returned",
};

export const STATUS_STYLES: Record<BuilderStatus, string> = {
  VERIFIED: "bg-status-verified/10 text-status-verified border-status-verified/20",
  COMPLETED: "bg-status-completed/10 text-status-completed border-status-completed/20",
  SIGNED_UP: "bg-status-signed-up/10 text-status-signed-up border-status-signed-up/20",
  PENDING: "bg-status-pending/10 text-status-pending border-status-pending/20",
  INCOMPLETE: "bg-status-incomplete/10 text-status-incomplete border-status-incomplete/20",
  RETURNED: "bg-status-returned/10 text-status-returned border-status-returned/20",
};

export const resolveStatus = (builder: Builder): BuilderStatus => {
  if (builder?.status) return builder.status;
  if (builder?.adminApproved === true) return "VERIFIED";
  if (builder?.adminApproved === false) return "PENDING";
  return "INCOMPLETE";
};

export const mockBuilders: Builder[] = [
  // ================= FUNDI =================
  // PENDING - Full profile, awaiting admin review
  {
    id: 1,
    userType: "FUNDI",
    firstName: "James",
    lastName: "Ochieng",
    email: "fundi01@jagedo.co.ke",
    phoneNumber: "0712345671",
    accountType: "individual",
    county: "Nairobi",
    subCounty: "Westlands",
    ward: "Parklands",
    village: "Highridge",
    adminApproved: false,
    status: "PENDING",
    skills: "Plumber",
    specialization: "Gas Plumbing",
    grade: "G1: Master Fundi",
    experience: "5+ years",
    userProfile: {
      skill: "Plumber",
      grade: "G1: Master Fundi",
      experience: "5+ years",
      previousJobPhotoUrls: [
        { projectName: "Kitchen Plumbing Renovation", fileUrl: "/mock/fundi1-project1.jpg" },
        { projectName: "Bathroom Installation", fileUrl: "/mock/fundi1-project2.jpg" },
      ],
      fundiEvaluation: {
        hasMajorWorks: "Yes",
        majorWorksScore: 90,
        materialsUsed: "PVC pipes, copper fittings, sealants",
        materialsUsedScore: 85,
        essentialEquipment: "Pipe wrench, plunger, pipe cutter, soldering kit",
        essentialEquipmentScore: 88,
        quotationFormulation: "Based on materials cost plus labor hours",
        quotationFormulaScore: 82,
        totalScore: 86,
        isVerified: false,
      },
      complete: true,
    },
    createdAt: "2026-11-01",
    userProfile: {
      skill: "Plumber",
      grade: "G1: Master Fundi",
      experience: "5+ years",
      previousJobPhotoUrls: [
        { projectName: "Kitchen Plumbing Installation", fileUrl: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=400" },
        { projectName: "Bathroom Renovation", fileUrl: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=400" },
        { projectName: "Gas Line Installation", fileUrl: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400" },
      ],
    },
  },
  // VERIFIED - Full profile, admin approved
  {
    id: 2,
    userType: "FUNDI",
    firstName: "Peter",
    lastName: "Kamau",
    email: "fundi02@jagedo.co.ke",
    phoneNumber: "0712345672",
    accountType: "individual",
    county: "Kisumu",
    subCounty: "Kisumu East",
    ward: "Kajulu",
    village: "Kondele",
    adminApproved: true,
    status: "VERIFIED",
    skills: "Electrician",
    specialization: "Solar Systems",
    grade: "G2: Skilled",
    experience: "3-5 years",
    userProfile: {
      skill: "Electrician",
      grade: "G2: Skilled",
      experience: "3-5 years",
      previousJobPhotoUrls: [
        { projectName: "Solar Panel Installation", fileUrl: "/mock/fundi2-project1.jpg" },
        { projectName: "House Wiring Project", fileUrl: "/mock/fundi2-project2.jpg" },
      ],
      fundiEvaluation: {
        hasMajorWorks: "Yes",
        majorWorksScore: 92,
        materialsUsed: "Electrical cables, circuit breakers, solar panels",
        materialsUsedScore: 90,
        essentialEquipment: "Multimeter, wire stripper, voltage tester",
        essentialEquipmentScore: 91,
        quotationFormulation: "Material costs plus fixed labor rate per point",
        quotationFormulaScore: 88,
        totalScore: 90,
        isVerified: true,
      },
      complete: true,
    },
    createdAt: "2026-10-05",
    userProfile: {
      skill: "Electrician",
      grade: "G2: Skilled",
      experience: "3-5 years",
      previousJobPhotoUrls: [
        { projectName: "Solar Panel Installation", fileUrl: "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=400" },
        { projectName: "Home Electrical Wiring", fileUrl: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=400" },
      ],
    },
  },
  // INCOMPLETE - Has account info & address, but NO uploads/experience
  {
    id: 3,
    userType: "FUNDI",
    firstName: "David",
    lastName: "Mwangi",
    email: "fundi03@jagedo.co.ke",
    phoneNumber: "0712345673",
    accountType: "individual",
    county: "Nairobi",
    subCounty: "Kilimani",
    ward: "Kileleshwa",
    village: "Lavington",
    adminApproved: false,
    status: "INCOMPLETE",
    // No skills, grade, experience - profile not completed
    userProfile: null,
    createdAt: "2026-09-12",
  },
  // COMPLETED - Full profile, complete but not yet verified
  {
    id: 4,
    userType: "FUNDI",
    firstName: "Michael",
    lastName: "Njoroge",
    email: "fundi04@jagedo.co.ke",
    phoneNumber: "0712345674",
    accountType: "individual",
    county: "Mombasa",
    subCounty: "Nyali",
    adminApproved: false,
    status: "COMPLETED",
    skills: "Painter",
    specialization: "Interior Painting",
    grade: "G3: Semi-skilled",
    experience: "1-3 years",
    userProfile: {
      skill: "Painter",
      grade: "G3: Semi-skilled",
      experience: "1-3 years",
      previousJobPhotoUrls: [
        { projectName: "Living Room Painting", fileUrl: "/mock/fundi4-project1.jpg" },
      ],
      fundiEvaluation: {
        hasMajorWorks: "Yes",
        majorWorksScore: 75,
        materialsUsed: "Emulsion paint, primer, brushes, rollers",
        materialsUsedScore: 70,
        essentialEquipment: "Paint brushes, rollers, masking tape, ladders",
        essentialEquipmentScore: 72,
        quotationFormulation: "Per square meter rate plus materials",
        quotationFormulaScore: 68,
        totalScore: 71,
        isVerified: false,
      },
      complete: true,
    },
    createdAt: "2026-08-20",
    userProfile: {
      skill: "Painter",
      grade: "G3: Intermediate",
      experience: "1-3 years",
      previousJobPhotoUrls: [
        { projectName: "Living Room Painting", fileUrl: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=400" },
      ],
    },
  },
  // RETURNED - Full profile, returned for corrections
  {
    id: 5,
    userType: "FUNDI",
    firstName: "Samuel",
    lastName: "Kiprop",
    email: "fundi05@jagedo.co.ke",
    phoneNumber: "0712345675",
    accountType: "individual",
    county: "Nakuru",
    subCounty: "Naivasha",
    ward: "Hell's Gate",
    village: "Mai Mahiu",
    adminApproved: false,
    status: "RETURNED",
    skills: "Roofer",
    specialization: "Tiles Roofing",
    grade: "G1: Master Fundi",
    experience: "5+ years",
    userProfile: {
      skill: "Roofer",
      grade: "G1: Master Fundi",
      experience: "5+ years",
      previousJobPhotoUrls: [
        { projectName: "Villa Roofing Project", fileUrl: "/mock/fundi5-project1.jpg" },
        { projectName: "Commercial Building Roof", fileUrl: "/mock/fundi5-project2.jpg" },
        { projectName: "Warehouse Roofing", fileUrl: "/mock/fundi5-project3.jpg" },
      ],
      fundiEvaluation: {
        hasMajorWorks: "Yes",
        majorWorksScore: 88,
        materialsUsed: "Roofing tiles, timber, waterproofing membrane",
        materialsUsedScore: 85,
        essentialEquipment: "Nail gun, safety harness, roofing hammer",
        essentialEquipmentScore: 80,
        quotationFormulation: "Per square foot rate based on roof type",
        quotationFormulaScore: 78,
        totalScore: 83,
        isVerified: false,
      },
      complete: true,
    },
    createdAt: "2026-07-15",
    userProfile: {
      skill: "Roofer",
      grade: "G1: Master Fundi",
      experience: "5+ years",
      previousJobPhotoUrls: [
        { projectName: "Tile Roof Installation", fileUrl: "https://images.unsplash.com/photo-1632778149955-e80f8ceca2e8?w=400" },
        { projectName: "Commercial Roofing Project", fileUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400" },
        { projectName: "Residential Roof Repair", fileUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400" },
      ],
    },
  },
  // SIGNED_UP - Just registered, no info filled
  {
    id: 6,
    userType: "FUNDI",
    firstName: "John",
    lastName: "Otieno",
    email: "fundi06@jagedo.co.ke",
    phoneNumber: "0712345676",
    county: "Kiambu",
    subCounty: "Thika",
    adminApproved: false,
    status: "SIGNED_UP",
    // No userProfile at all
    userProfile: null,
    createdAt: "2026-06-10",
  },

  // ================= PROFESSIONAL =================
  // PENDING - Full profile, awaiting admin review
  {
    id: 7,
    userType: "PROFESSIONAL",
    firstName: "Grace",
    lastName: "Wanjiku",
    email: "professional01@jagedo.co.ke",
    phoneNumber: "0722112231",
    accountType: "individual",
    county: "Kiambu",
    subCounty: "Ruiru",
    ward: "Gitothua",
    village: "Ruiru Town",
    adminApproved: false,
    status: "PENDING",
    profession: "Architect",
    level: "Senior",
    userProfile: {
      profession: "Architect",
      professionalLevel: "Senior",
      yearsOfExperience: "5+ years",
      professionalProjects: [
        { projectName: "Residential Complex Design", fileUrl: "/mock/prof1-project1.jpg" },
        { projectName: "Office Building Design", fileUrl: "/mock/prof1-project2.jpg" },
      ],
      complete: true,
    },
    createdAt: "2026-09-18",
    userProfile: {
      profession: "Architect",
      professionalLevel: "Senior",
      yearsOfExperience: "5+ years",
      professionalProjects: [
        { projectName: "Modern Villa Design", fileUrl: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400" },
        { projectName: "Commercial Complex Blueprint", fileUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400" },
        { projectName: "Residential Estate Planning", fileUrl: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400" },
      ],
    },
  },
  // VERIFIED - Full profile, admin approved
  {
    id: 8,
    userType: "PROFESSIONAL",
    firstName: "Faith",
    lastName: "Akinyi",
    email: "professional02@jagedo.co.ke",
    phoneNumber: "0722112232",
    accountType: "individual",
    county: "Machakos",
    subCounty: "Athi River",
    ward: "Kinanie",
    village: "Mlolongo",
    adminApproved: true,
    status: "VERIFIED",
    profession: "Quantity Surveyor",
    level: "Professional",
    userProfile: {
      profession: "Quantity Surveyor",
      professionalLevel: "Professional",
      yearsOfExperience: "3-5 years",
      professionalProjects: [
        { projectName: "Hospital Cost Estimation", fileUrl: "/mock/prof2-project1.jpg" },
        { projectName: "School Construction Costing", fileUrl: "/mock/prof2-project2.jpg" },
      ],
      complete: true,
    },
    createdAt: "2026-08-21",
    userProfile: {
      profession: "Quantity Surveyor",
      professionalLevel: "Professional",
      yearsOfExperience: "3-5 years",
      professionalProjects: [
        { projectName: "Cost Estimation Report", fileUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400" },
        { projectName: "Budget Analysis Document", fileUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400" },
      ],
    },
  },
  // INCOMPLETE - Has account info & address, but NO experience data
  {
    id: 9,
    userType: "PROFESSIONAL",
    firstName: "Brian",
    lastName: "Kibet",
    email: "professional03@jagedo.co.ke",
    phoneNumber: "0722112233",
    accountType: "individual",
    county: "Nairobi",
    subCounty: "Kasarani",
    ward: "Roysambu",
    village: "Zimmerman",
    adminApproved: false,
    status: "INCOMPLETE",
    // No profession/level - profile not completed
    userProfile: null,
    createdAt: "2026-07-15",
  },
  // COMPLETED - Full profile
  {
    id: 10,
    userType: "PROFESSIONAL",
    firstName: "Sarah",
    lastName: "Chebet",
    email: "professional04@jagedo.co.ke",
    phoneNumber: "0722112234",
    accountType: "individual",
    county: "Mombasa",
    subCounty: "Mvita",
    adminApproved: false,
    status: "COMPLETED",
    profession: "Electrical Engineer",
    level: "Senior",
    userProfile: {
      profession: "Electrical Engineer",
      professionalLevel: "Senior",
      yearsOfExperience: "5+ years",
      professionalProjects: [
        { projectName: "Power Grid Design", fileUrl: "/mock/prof4-project1.jpg" },
        { projectName: "Industrial Wiring Plan", fileUrl: "/mock/prof4-project2.jpg" },
      ],
      complete: true,
    },
    createdAt: "2026-06-12",
    userProfile: {
      profession: "Electrical Engineer",
      professionalLevel: "Senior",
      yearsOfExperience: "5+ years",
      professionalProjects: [
        { projectName: "Power Distribution System", fileUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400" },
        { projectName: "Industrial Electrical Layout", fileUrl: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400" },
        { projectName: "Smart Building Wiring", fileUrl: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=400" },
      ],
    },
  },
  // RETURNED - Full profile, returned for corrections
  {
    id: 11,
    userType: "PROFESSIONAL",
    firstName: "Kevin",
    lastName: "Omondi",
    email: "professional05@jagedo.co.ke",
    phoneNumber: "0722112235",
    accountType: "individual",
    county: "Kisumu",
    subCounty: "Kisumu Central",
    ward: "Railways",
    village: "Milimani",
    adminApproved: false,
    status: "RETURNED",
    profession: "Surveyor",
    level: "Professional",
    userProfile: {
      profession: "Surveyor",
      professionalLevel: "Professional",
      yearsOfExperience: "3-5 years",
      professionalProjects: [
        { projectName: "Land Survey Report", fileUrl: "/mock/prof5-project1.jpg" },
      ],
      complete: true,
    },
    createdAt: "2026-05-18",
    userProfile: {
      profession: "Surveyor",
      professionalLevel: "Professional",
      yearsOfExperience: "3-5 years",
      professionalProjects: [
        { projectName: "Land Survey Report", fileUrl: "https://images.unsplash.com/photo-1416339698674-4f118dd3388b?w=400" },
        { projectName: "Topographical Mapping", fileUrl: "https://images.unsplash.com/photo-1524661135-423995f22d0b?w=400" },
      ],
    },
  },
  // SIGNED_UP - Just registered, no info filled
  {
    id: 12,
    userType: "PROFESSIONAL",
    firstName: "Anne",
    lastName: "Nyambura",
    email: "professional06@jagedo.co.ke",
    phoneNumber: "0722112236",
    county: "Nakuru",
    subCounty: "Nakuru East",
    adminApproved: false,
    status: "SIGNED_UP",
    userProfile: null,
    createdAt: "2026-04-10",
  },

  // ================= CONTRACTOR =================
  // PENDING - Full profile, awaiting admin review
  {
    id: 13,
    userType: "CONTRACTOR",
    organizationName: "BuildRight Construction",
    email: "contractor01@jagedo.co.ke",
    phoneNumber: "0201234561",
    accountType: "business",
    county: "Nairobi",
    subCounty: "Embakasi",
    ward: "Embakasi Central",
    village: "Pipeline",
    adminApproved: false,
    status: "PENDING",
    contractorTypes: "Residential",
    userProfile: {
      contractorType: "Residential",
      licenseLevel: "NCA1",
      contractorExperiences: [
        {
          category: "Building Works",
          categoryClass: "NCA1",
          yearsOfExperience: "10+ years",
          certificate: "/mock/contractor1-cert.pdf",
          license: "/mock/contractor1-license.pdf",
        },
      ],
      contractorProjects: [
        { projectName: "Apartment Complex Construction", fileUrl: "/mock/contractor1-project1.jpg" },
      ],
      complete: true,
    },
    createdAt: "2026-07-10",
    userProfile: {
      contractorType: "Residential",
      licenseLevel: "NCA2",
      contractorExperiences: "5+ years",
      contractorProjects: [
        { projectName: "Residential Complex Phase 1", fileUrl: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400" },
      ],
    },
  },
  // VERIFIED - Full profile, admin approved
  {
    id: 14,
    userType: "CONTRACTOR",
    organizationName: "Premier Builders Ltd",
    email: "contractor02@jagedo.co.ke",
    phoneNumber: "0201234562",
    accountType: "business",
    county: "Nakuru",
    subCounty: "Naivasha",
    ward: "Naivasha East",
    village: "Karagita",
    adminApproved: true,
    status: "VERIFIED",
    contractorTypes: "Commercial",
    userProfile: {
      contractorType: "Commercial",
      licenseLevel: "NCA2",
      contractorExperiences: [
        {
          category: "Building Works",
          categoryClass: "NCA2",
          yearsOfExperience: "5+ years",
          certificate: "/mock/contractor2-cert.pdf",
          license: "/mock/contractor2-license.pdf",
        },
        {
          category: "Water Works",
          categoryClass: "NCA3",
          yearsOfExperience: "3-5 years",
          certificate: "/mock/contractor2-cert2.pdf",
        },
      ],
      contractorProjects: [
        { projectName: "Shopping Mall Construction", fileUrl: "/mock/contractor2-project1.jpg" },
        { projectName: "Office Park Development", fileUrl: "/mock/contractor2-project2.jpg" },
      ],
      complete: true,
    },
    createdAt: "2026-06-02",
    userProfile: {
      contractorType: "Commercial",
      licenseLevel: "NCA1",
      contractorExperiences: "10+ years",
      contractorProjects: [
        { projectName: "Shopping Mall Construction", fileUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400" },
      ],
    },
  },
  // INCOMPLETE - Has account info & address, but NO experience data
  {
    id: 15,
    userType: "CONTRACTOR",
    organizationName: "Coast Constructors",
    email: "contractor03@jagedo.co.ke",
    phoneNumber: "0201234563",
    accountType: "business",
    county: "Mombasa",
    subCounty: "Nyali",
    ward: "Frere Town",
    village: "Nyali Bridge",
    adminApproved: false,
    status: "INCOMPLETE",
    userProfile: null,
    createdAt: "2026-05-15",
  },
  // COMPLETED - Full profile
  {
    id: 16,
    userType: "CONTRACTOR",
    organizationName: "Lakeside Developers",
    email: "contractor04@jagedo.co.ke",
    phoneNumber: "0201234564",
    accountType: "business",
    county: "Kisumu",
    subCounty: "Kisumu West",
    adminApproved: false,
    status: "COMPLETED",
    contractorTypes: "Residential",
    userProfile: {
      contractorType: "Residential",
      licenseLevel: "NCA3",
      contractorExperiences: [
        {
          category: "Building Works",
          categoryClass: "NCA3",
          yearsOfExperience: "3-5 years",
          certificate: "/mock/contractor4-cert.pdf",
        },
      ],
      contractorProjects: [
        { projectName: "Residential Estate Development", fileUrl: "/mock/contractor4-project1.jpg" },
      ],
      complete: true,
    },
    createdAt: "2026-04-12",
    userProfile: {
      contractorType: "Residential",
      licenseLevel: "NCA3",
      contractorExperiences: "3-5 years",
      contractorProjects: [
        { projectName: "Lakeside Apartments", fileUrl: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400" },
      ],
    },
  },
  // RETURNED - Full profile, returned for corrections
  {
    id: 17,
    userType: "CONTRACTOR",
    organizationName: "Highland Projects",
    email: "contractor05@jagedo.co.ke",
    phoneNumber: "0201234565",
    accountType: "business",
    county: "Kiambu",
    subCounty: "Thika",
    ward: "Thika Township",
    village: "Makongeni",
    adminApproved: false,
    status: "RETURNED",
    contractorTypes: "Commercial",
    userProfile: {
      contractorType: "Commercial",
      licenseLevel: "NCA2",
      contractorExperiences: [
        {
          category: "Building Works",
          categoryClass: "NCA2",
          yearsOfExperience: "5+ years",
        },
      ],
      contractorProjects: [
        { projectName: "Industrial Warehouse", fileUrl: "/mock/contractor5-project1.jpg" },
      ],
      complete: true,
    },
    createdAt: "2026-03-08",
    userProfile: {
      contractorType: "Commercial",
      licenseLevel: "NCA2",
      contractorExperiences: "5+ years",
      contractorProjects: [
        { projectName: "Office Complex Development", fileUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400" },
      ],
    },
  },
  // SIGNED_UP - Just registered, no info filled
  {
    id: 18,
    userType: "CONTRACTOR",
    organizationName: "Eastern Infrastructure",
    email: "contractor06@jagedo.co.ke",
    phoneNumber: "0201234566",
    county: "Machakos",
    subCounty: "Mavoko",
    adminApproved: false,
    status: "SIGNED_UP",
    userProfile: null,
    createdAt: "2026-02-05",
  },

  // ================= HARDWARE =================
  // PENDING - Full profile, awaiting admin review
  {
    id: 19,
    userType: "HARDWARE",
    organizationName: "Nairobi Building Supplies",
    email: "hardware01@jagedo.co.ke",
    phoneNumber: "0711223341",
    accountType: "business",
    county: "Nairobi",
    subCounty: "CBD",
    ward: "Nairobi Central",
    village: "City Centre",
    adminApproved: false,
    status: "PENDING",
    hardwareTypes: "Building Materials",
    userProfile: {
      hardwareType: "Building Materials",
      businessType: "Wholesale Supplier",
      experience: "10+ years",
      hardwareProjects: [
        { projectName: "Cement & Steel Stock", fileUrl: "/mock/hardware1-project1.jpg" },
      ],
      complete: true,
    },
    createdAt: "2026-05-12",
    userProfile: {
      hardwareType: "Building Materials",
      businessType: "Wholesale Supplier",
      experience: "10+ years",
      hardwareProjects: [
        { projectName: "Cement & Aggregates Catalogue", fileUrl: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400" },
        { projectName: "Steel & Iron Products", fileUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400" },
      ],
    },
  },
  // VERIFIED - Full profile, admin approved
  {
    id: 20,
    userType: "HARDWARE",
    organizationName: "Eldoret Hardware Hub",
    email: "hardware02@jagedo.co.ke",
    phoneNumber: "0711223342",
    accountType: "business",
    county: "Uasin Gishu",
    subCounty: "Eldoret East",
    ward: "Kapsoya",
    village: "Elgon View",
    adminApproved: true,
    status: "VERIFIED",
    hardwareTypes: "Plumbing & Electrical",
    userProfile: {
      hardwareType: "Plumbing & Electrical",
      businessType: "Retail Store",
      experience: "5-10 years",
      hardwareProjects: [
        { projectName: "Electrical Supplies Showroom", fileUrl: "/mock/hardware2-project1.jpg" },
        { projectName: "Plumbing Materials Display", fileUrl: "/mock/hardware2-project2.jpg" },
      ],
      complete: true,
    },
    createdAt: "2026-04-28",
    userProfile: {
      hardwareType: "Electrical Supplies",
      businessType: "Retail Store",
      experience: "5-10 years",
      hardwareProjects: [
        { projectName: "Plumbing Equipment Range", fileUrl: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=400" },
        { projectName: "Electrical Fittings Collection", fileUrl: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=400" },
      ],
    },
  },
  // INCOMPLETE - Has account info & address, but NO experience data
  {
    id: 21,
    userType: "HARDWARE",
    organizationName: "Coastal Tools & Paints",
    email: "hardware03@jagedo.co.ke",
    phoneNumber: "0711223343",
    accountType: "business",
    county: "Mombasa",
    subCounty: "Nyali",
    ward: "Frere Town",
    village: "Links Road",
    adminApproved: false,
    status: "INCOMPLETE",
    userProfile: null,
    createdAt: "2026-03-20",
  },
  // COMPLETED - Full profile
  {
    id: 22,
    userType: "HARDWARE",
    organizationName: "Kisumu Electricals Ltd",
    email: "hardware04@jagedo.co.ke",
    phoneNumber: "0711223344",
    accountType: "business",
    county: "Kisumu",
    subCounty: "Kisumu Central",
    adminApproved: false,
    status: "COMPLETED",
    hardwareTypes: "Electricals",
    userProfile: {
      hardwareType: "Electricals",
      businessType: "Retail Store",
      experience: "3-5 years",
      hardwareProjects: [
        { projectName: "Electrical Shop Setup", fileUrl: "/mock/hardware4-project1.jpg" },
      ],
      complete: true,
    },
    createdAt: "2026-02-15",
    userProfile: {
      hardwareType: "Electrical Supplies",
      businessType: "Wholesale Supplier",
      experience: "10+ years",
      hardwareProjects: [
        { projectName: "Industrial Electrical Supplies", fileUrl: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400" },
        { projectName: "Residential Wiring Products", fileUrl: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=400" },
      ],
    },
  },
  // RETURNED - Full profile, returned for corrections
  {
    id: 23,
    userType: "HARDWARE",
    organizationName: "Ruiru Wood & Iron",
    email: "hardware05@jagedo.co.ke",
    phoneNumber: "0711223345",
    accountType: "business",
    county: "Kiambu",
    subCounty: "Ruiru",
    ward: "Gatongora",
    village: "Kimbo",
    adminApproved: false,
    status: "RETURNED",
    hardwareTypes: "Wood & Iron",
    userProfile: {
      hardwareType: "Wood & Iron",
      businessType: "Wholesale Supplier",
      experience: "5-10 years",
      hardwareProjects: [
        { projectName: "Timber Yard", fileUrl: "/mock/hardware5-project1.jpg" },
        { projectName: "Steel Section Display", fileUrl: "/mock/hardware5-project2.jpg" },
      ],
      complete: true,
    },
    createdAt: "2026-01-10",
    userProfile: {
      hardwareType: "Building Materials",
      businessType: "Retail Store",
      experience: "3-5 years",
      hardwareProjects: [
        { projectName: "Timber Products Range", fileUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400" },
        { projectName: "Metal & Iron Works", fileUrl: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400" },
      ],
    },
  },
  // SIGNED_UP - Just registered, no info filled
  {
    id: 24,
    userType: "HARDWARE",
    organizationName: "Nakuru Cement & Bricks",
    email: "hardware06@jagedo.co.ke",
    phoneNumber: "0711223346",
    county: "Nakuru",
    subCounty: "Nakuru East",
    adminApproved: false,
    status: "SIGNED_UP",
    userProfile: null,
    createdAt: "2025-12-05",
  },
];
