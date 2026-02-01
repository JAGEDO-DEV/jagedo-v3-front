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
  county: string;
  subCounty: string;
  adminApproved: boolean;
  status: BuilderStatus;
  skills?: string;
  specialization?: string;
  grade?: string;
  experience?: string;
  profession?: string;
  level?: string;
  contractorTypes?: string;
  hardwareTypes?: string;
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
  {
    id: 1,
    userType: "FUNDI",
    firstName: "James",
    lastName: "Ochieng",
    email: "fundi01@jagedo.co.ke",
    phoneNumber: "0712345671",
    county: "Nairobi",
    subCounty: "Westlands",
    adminApproved: false,
    status: "PENDING",
    skills: "Plumber",
    specialization: "Gas Plumbing",
    grade: "G1: Master Fundi",
    experience: "5+ years",
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
  {
    id: 2,
    userType: "FUNDI",
    firstName: "Peter",
    lastName: "Kamau",
    email: "fundi02@jagedo.co.ke",
    phoneNumber: "0712345672",
    county: "Kisumu",
    subCounty: "Kisumu East",
    adminApproved: true,
    status: "VERIFIED",
    skills: "Electrician",
    specialization: "Solar Systems",
    grade: "G2: Skilled",
    experience: "3-5 years",
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
  {
    id: 3,
    userType: "FUNDI",
    firstName: "David",
    lastName: "Mwangi",
    email: "fundi03@jagedo.co.ke",
    phoneNumber: "0712345673",
    county: "Nairobi",
    subCounty: "Kilimani",
    adminApproved: false,
    status: "INCOMPLETE",
    skills: "Carpenter",
    specialization: "Wood Works",
    grade: "G2: Skilled",
    experience: "4 years",
    createdAt: "2026-09-12",
  },
  {
    id: 4,
    userType: "FUNDI",
    firstName: "Michael",
    lastName: "Njoroge",
    email: "fundi04@jagedo.co.ke",
    phoneNumber: "0712345674",
    county: "Mombasa",
    subCounty: "Nyali",
    adminApproved: false,
    status: "COMPLETED",
    skills: "Painter",
    specialization: "Interior Painting",
    grade: "G3: Intermediate",
    experience: "2 years",
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
  {
    id: 5,
    userType: "FUNDI",
    firstName: "Samuel",
    lastName: "Kiprop",
    email: "fundi05@jagedo.co.ke",
    phoneNumber: "0712345675",
    county: "Nakuru",
    subCounty: "Naivasha",
    adminApproved: false,
    status: "RETURNED",
    skills: "Roofer",
    specialization: "Tiles Roofing",
    grade: "G1: Master Fundi",
    experience: "6+ years",
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
    skills: "Welder",
    specialization: "Metal Works",
    grade: "G2: Skilled",
    experience: "4 years",
    createdAt: "2026-06-10",
  },

  // ================= PROFESSIONAL =================
  {
    id: 7,
    userType: "PROFESSIONAL",
    firstName: "Grace",
    lastName: "Wanjiku",
    email: "professional01@jagedo.co.ke",
    phoneNumber: "0722112231",
    county: "Kiambu",
    subCounty: "Ruiru",
    adminApproved: false,
    status: "PENDING",
    profession: "Architect",
    level: "Senior",
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
  {
    id: 8,
    userType: "PROFESSIONAL",
    firstName: "Faith",
    lastName: "Akinyi",
    email: "professional02@jagedo.co.ke",
    phoneNumber: "0722112232",
    county: "Machakos",
    subCounty: "Athi River",
    adminApproved: true,
    status: "VERIFIED",
    profession: "Quantity Surveyor",
    level: "Mid-level",
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
  {
    id: 9,
    userType: "PROFESSIONAL",
    firstName: "Brian",
    lastName: "Kibet",
    email: "professional03@jagedo.co.ke",
    phoneNumber: "0722112233",
    county: "Nairobi",
    subCounty: "Kasarani",
    adminApproved: false,
    status: "INCOMPLETE",
    profession: "Civil Engineer",
    level: "Junior",
    createdAt: "2026-07-15",
  },
  {
    id: 10,
    userType: "PROFESSIONAL",
    firstName: "Sarah",
    lastName: "Chebet",
    email: "professional04@jagedo.co.ke",
    phoneNumber: "0722112234",
    county: "Mombasa",
    subCounty: "Mvita",
    adminApproved: false,
    status: "COMPLETED",
    profession: "Electrical Engineer",
    level: "Senior",
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
  {
    id: 11,
    userType: "PROFESSIONAL",
    firstName: "Kevin",
    lastName: "Omondi",
    email: "professional05@jagedo.co.ke",
    phoneNumber: "0722112235",
    county: "Kisumu",
    subCounty: "Kisumu Central",
    adminApproved: false,
    status: "RETURNED",
    profession: "Surveyor",
    level: "Mid-level",
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
    profession: "Mechanical Engineer",
    level: "Senior",
    createdAt: "2026-04-10",
  },

  // ================= CONTRACTOR =================
  {
    id: 13,
    userType: "CONTRACTOR",
    firstName: "BuildRight",
    lastName: "Construction",
    email: "contractor01@jagedo.co.ke",
    phoneNumber: "0201234561",
    county: "Nairobi",
    subCounty: "Embakasi",
    adminApproved: false,
    status: "PENDING",
    contractorTypes: "Residential",
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
  {
    id: 14,
    userType: "CONTRACTOR",
    firstName: "Premier",
    lastName: "Builders",
    email: "contractor02@jagedo.co.ke",
    phoneNumber: "0201234562",
    county: "Nakuru",
    subCounty: "Naivasha",
    adminApproved: true,
    status: "VERIFIED",
    contractorTypes: "Commercial",
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
  {
    id: 15,
    userType: "CONTRACTOR",
    firstName: "Coast",
    lastName: "Constructors",
    email: "contractor03@jagedo.co.ke",
    phoneNumber: "0201234563",
    county: "Mombasa",
    subCounty: "Nyali",
    adminApproved: false,
    status: "INCOMPLETE",
    contractorTypes: "Industrial",
    createdAt: "2026-05-15",
  },
  {
    id: 16,
    userType: "CONTRACTOR",
    firstName: "Lakeside",
    lastName: "Developers",
    email: "contractor04@jagedo.co.ke",
    phoneNumber: "0201234564",
    county: "Kisumu",
    subCounty: "Kisumu West",
    adminApproved: false,
    status: "COMPLETED",
    contractorTypes: "Residential",
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
  {
    id: 17,
    userType: "CONTRACTOR",
    firstName: "Highland",
    lastName: "Projects",
    email: "contractor05@jagedo.co.ke",
    phoneNumber: "0201234565",
    county: "Kiambu",
    subCounty: "Thika",
    adminApproved: false,
    status: "RETURNED",
    contractorTypes: "Commercial",
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
  {
    id: 18,
    userType: "CONTRACTOR",
    firstName: "Eastern",
    lastName: "Infrastructure",
    email: "contractor06@jagedo.co.ke",
    phoneNumber: "0201234566",
    county: "Machakos",
    subCounty: "Mavoko",
    adminApproved: false,
    status: "SIGNED_UP",
    contractorTypes: "Industrial",
    createdAt: "2026-02-05",
  },

  // ================= HARDWARE =================
  {
    id: 19,
    userType: "HARDWARE",
    organizationName: "Nairobi Building Supplies",
    email: "hardware01@jagedo.co.ke",
    phoneNumber: "0711223341",
    county: "Nairobi",
    subCounty: "CBD",
    adminApproved: false,
    status: "PENDING",
    hardwareTypes: "Building Materials",
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
  {
    id: 20,
    userType: "HARDWARE",
    organizationName: "Eldoret Hardware Hub",
    email: "hardware02@jagedo.co.ke",
    phoneNumber: "0711223342",
    county: "Eldoret",
    subCounty: "Kapsoya",
    adminApproved: true,
    status: "VERIFIED",
    hardwareTypes: "Plumbing & Electrical",
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
  {
    id: 21,
    userType: "HARDWARE",
    organizationName: "Coastal Tools & Paints",
    email: "hardware03@jagedo.co.ke",
    phoneNumber: "0711223343",
    county: "Mombasa",
    subCounty: "Nyali",
    adminApproved: false,
    status: "INCOMPLETE",
    hardwareTypes: "Paint & Tools",
    createdAt: "2026-03-20",
  },
  {
    id: 22,
    userType: "HARDWARE",
    organizationName: "Kisumu Electricals Ltd",
    email: "hardware04@jagedo.co.ke",
    phoneNumber: "0711223344",
    county: "Kisumu",
    subCounty: "Kisumu Central",
    adminApproved: false,
    status: "COMPLETED",
    hardwareTypes: "Electricals",
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
  {
    id: 23,
    userType: "HARDWARE",
    organizationName: "Ruiru Wood & Iron",
    email: "hardware05@jagedo.co.ke",
    phoneNumber: "0711223345",
    county: "Kiambu",
    subCounty: "Ruiru",
    adminApproved: false,
    status: "RETURNED",
    hardwareTypes: "Wood & Iron",
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
    hardwareTypes: "Cement & Bricks",
    createdAt: "2025-12-05",
  },
];
