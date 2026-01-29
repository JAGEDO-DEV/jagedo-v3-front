import type { BuilderStatus } from "./mockBuilders";

export interface WorkExperience {
  id: number;
  companyName: string;
  role: string;
  startDate: string;
  endDate: string;
  description: string;
  location: string;
}

export interface Certification {
  id: number;
  name: string;
  issuingBody: string;
  issueDate: string;
  expiryDate?: string;
  certificateNumber?: string;
}

export interface Project {
  id: number;
  projectName: string;
  clientName: string;
  duration: string;
  description: string;
  value?: string;
}

export interface BuilderExperience {
  builderId: number;
  workExperience: WorkExperience[];
  certifications: Certification[];
  projects: Project[];
  education?: string;
  additionalSkills?: string[];
}

// Helper to determine if a status should have pre-filled experience
export const hasPrefilledExperience = (status: BuilderStatus): boolean => {
  return ["VERIFIED", "COMPLETED", "RETURNED", "PENDING"].includes(status);
};

// Mock experience data for builders with specific statuses
export const builderExperienceData: BuilderExperience[] = [
  // ================= FUNDI EXPERIENCE =================
  // Fundi 1 - PENDING (has experience)
  {
    builderId: 1,
    workExperience: [
      {
        id: 1,
        companyName: "Nairobi Plumbing Services",
        role: "Senior Plumber",
        startDate: "2021-03-01",
        endDate: "2026-10-31",
        description: "Led plumbing installations for residential and commercial buildings. Specialized in gas plumbing systems.",
        location: "Nairobi, Kenya"
      },
      {
        id: 2,
        companyName: "Westlands Construction Ltd",
        role: "Plumber",
        startDate: "2018-06-15",
        endDate: "2021-02-28",
        description: "Handled water supply and drainage systems for apartment complexes.",
        location: "Westlands, Nairobi"
      }
    ],
    certifications: [
      {
        id: 1,
        name: "Gas Plumbing Certification",
        issuingBody: "National Construction Authority",
        issueDate: "2020-05-15",
        expiryDate: "2025-05-15",
        certificateNumber: "NCA-GP-2020-1234"
      },
      {
        id: 2,
        name: "Plumbing Trade Test Grade 1",
        issuingBody: "National Industrial Training Authority",
        issueDate: "2018-03-20",
        certificateNumber: "NITA-PT-2018-5678"
      }
    ],
    projects: [
      {
        id: 1,
        projectName: "Two Rivers Mall Plumbing",
        clientName: "Two Rivers Development Ltd",
        duration: "8 months",
        description: "Complete plumbing installation for commercial complex",
        value: "KES 2.5M"
      },
      {
        id: 2,
        projectName: "Residential Estate - 50 Units",
        clientName: "Hass Consult",
        duration: "12 months",
        description: "Water supply and sewerage system for residential estate",
        value: "KES 4.2M"
      }
    ],
    education: "Diploma in Plumbing - Kenya Polytechnic (2017)",
    additionalSkills: ["AutoCAD Plumbing Design", "Solar Water Heating", "Water Treatment Systems"]
  },

  // Fundi 2 - VERIFIED (has experience)
  {
    builderId: 2,
    workExperience: [
      {
        id: 1,
        companyName: "Kenya Power Contractors",
        role: "Lead Electrician",
        startDate: "2020-01-15",
        endDate: "2026-09-30",
        description: "Supervised electrical installations for industrial facilities. Expert in solar panel systems.",
        location: "Kisumu, Kenya"
      },
      {
        id: 2,
        companyName: "SolarTech Kenya",
        role: "Solar Installation Technician",
        startDate: "2017-08-01",
        endDate: "2019-12-31",
        description: "Installed and maintained solar power systems for residential and commercial clients.",
        location: "Kisumu, Kenya"
      }
    ],
    certifications: [
      {
        id: 1,
        name: "Solar PV Installation Certificate",
        issuingBody: "Energy Regulatory Commission",
        issueDate: "2019-11-10",
        expiryDate: "2024-11-10",
        certificateNumber: "ERC-SPV-2019-4567"
      },
      {
        id: 2,
        name: "Electrical Wiring Grade A",
        issuingBody: "National Industrial Training Authority",
        issueDate: "2017-06-25",
        certificateNumber: "NITA-EW-2017-8901"
      }
    ],
    projects: [
      {
        id: 1,
        projectName: "Kisumu International Airport Solar",
        clientName: "Kenya Airports Authority",
        duration: "6 months",
        description: "Installation of 500kW solar power system",
        value: "KES 15M"
      },
      {
        id: 2,
        projectName: "Lake Basin Mall Electrical",
        clientName: "Lake Basin Development Authority",
        duration: "10 months",
        description: "Complete electrical wiring and backup systems",
        value: "KES 8M"
      }
    ],
    education: "Higher Diploma in Electrical Engineering - Kisumu Polytechnic (2016)",
    additionalSkills: ["Solar Inverter Programming", "Electrical Safety Audits", "Smart Home Systems"]
  },

  // Fundi 3 - INCOMPLETE (no experience pre-filled)
  {
    builderId: 3,
    workExperience: [],
    certifications: [],
    projects: [],
  },

  // Fundi 4 - COMPLETED (has experience)
  {
    builderId: 4,
    workExperience: [
      {
        id: 1,
        companyName: "Mombasa Painters Co.",
        role: "Master Painter",
        startDate: "2022-04-01",
        endDate: "2026-08-15",
        description: "Led painting crews for luxury residential projects. Specialized in decorative finishes.",
        location: "Mombasa, Kenya"
      },
      {
        id: 2,
        companyName: "Nyali Interior Designs",
        role: "Interior Painter",
        startDate: "2019-02-10",
        endDate: "2022-03-31",
        description: "Handled high-end interior painting for villas and hotels.",
        location: "Nyali, Mombasa"
      }
    ],
    certifications: [
      {
        id: 1,
        name: "Advanced Decorative Painting",
        issuingBody: "Dulux Professional Training",
        issueDate: "2021-08-20",
        certificateNumber: "DPT-ADP-2021-3456"
      }
    ],
    projects: [
      {
        id: 1,
        projectName: "Serena Beach Hotel Renovation",
        clientName: "Serena Hotels",
        duration: "4 months",
        description: "Complete interior and exterior repainting of 200 rooms",
        value: "KES 6M"
      }
    ],
    education: "Certificate in Painting & Decorating - Mombasa Technical (2018)",
    additionalSkills: ["Faux Finishes", "Texture Painting", "Color Consultation"]
  },

  // Fundi 5 - RETURNED (has experience)
  {
    builderId: 5,
    workExperience: [
      {
        id: 1,
        companyName: "Nakuru Roofing Solutions",
        role: "Senior Roofer",
        startDate: "2019-05-01",
        endDate: "2026-07-10",
        description: "Specialized in tile and metal roofing for commercial buildings.",
        location: "Nakuru, Kenya"
      }
    ],
    certifications: [
      {
        id: 1,
        name: "Roofing Safety Certification",
        issuingBody: "Occupational Safety and Health Administration",
        issueDate: "2020-02-15",
        certificateNumber: "OSHA-RS-2020-7890"
      }
    ],
    projects: [
      {
        id: 1,
        projectName: "Naivasha Resort Roofing",
        clientName: "Lake Naivasha Resort",
        duration: "3 months",
        description: "Complete roof replacement with designer tiles",
        value: "KES 3.5M"
      }
    ],
    education: "Diploma in Building Technology - Naivasha Technical (2018)",
    additionalSkills: ["Waterproofing", "Gutter Installation", "Roof Insulation"]
  },

  // Fundi 6 - SIGNED_UP (no experience pre-filled)
  {
    builderId: 6,
    workExperience: [],
    certifications: [],
    projects: [],
  },

  // ================= PROFESSIONAL EXPERIENCE =================
  // Professional 7 - PENDING (has experience)
  {
    builderId: 7,
    workExperience: [
      {
        id: 1,
        companyName: "DesignSpace Architects",
        role: "Senior Architect",
        startDate: "2020-08-01",
        endDate: "2026-09-15",
        description: "Lead architect for residential and commercial projects. Managed design teams of 5-8 architects.",
        location: "Ruiru, Kiambu"
      },
      {
        id: 2,
        companyName: "Nairobi Urban Planners",
        role: "Associate Architect",
        startDate: "2016-03-15",
        endDate: "2020-07-31",
        description: "Designed sustainable housing projects and green buildings.",
        location: "Nairobi, Kenya"
      }
    ],
    certifications: [
      {
        id: 1,
        name: "Registered Architect",
        issuingBody: "Board of Registration of Architects and Quantity Surveyors",
        issueDate: "2018-06-20",
        certificateNumber: "BORAQS-A-2018-1234"
      },
      {
        id: 2,
        name: "LEED Green Associate",
        issuingBody: "US Green Building Council",
        issueDate: "2019-11-10",
        certificateNumber: "LEED-GA-2019-5678"
      }
    ],
    projects: [
      {
        id: 1,
        projectName: "Garden City Phase 3",
        clientName: "Actis Real Estate",
        duration: "24 months",
        description: "Master planning and design for 200-unit residential complex",
        value: "KES 850M"
      },
      {
        id: 2,
        projectName: "Tatu City Commercial Hub",
        clientName: "Rendeavour",
        duration: "18 months",
        description: "Design of mixed-use commercial center",
        value: "KES 1.2B"
      }
    ],
    education: "Master of Architecture - University of Nairobi (2015)",
    additionalSkills: ["Revit BIM", "AutoCAD", "SketchUp", "Sustainable Design", "Project Management"]
  },

  // Professional 8 - VERIFIED (has experience)
  {
    builderId: 8,
    workExperience: [
      {
        id: 1,
        companyName: "Machakos Quantity Surveyors",
        role: "Senior Quantity Surveyor",
        startDate: "2019-01-10",
        endDate: "2026-08-20",
        description: "Led cost estimation and management for major infrastructure projects.",
        location: "Athi River, Machakos"
      }
    ],
    certifications: [
      {
        id: 1,
        name: "Registered Quantity Surveyor",
        issuingBody: "Board of Registration of Architects and Quantity Surveyors",
        issueDate: "2019-03-15",
        certificateNumber: "BORAQS-QS-2019-2345"
      }
    ],
    projects: [
      {
        id: 1,
        projectName: "SGR Athi River Station",
        clientName: "Kenya Railways Corporation",
        duration: "36 months",
        description: "Cost management for railway station construction",
        value: "KES 5B"
      }
    ],
    education: "BSc Quantity Surveying - JKUAT (2017)",
    additionalSkills: ["Primavera P6", "Microsoft Project", "Cost Estimation Software"]
  },

  // Professional 9 - INCOMPLETE (no experience pre-filled)
  {
    builderId: 9,
    workExperience: [],
    certifications: [],
    projects: [],
  },

  // Professional 10 - COMPLETED (has experience)
  {
    builderId: 10,
    workExperience: [
      {
        id: 1,
        companyName: "Kenya Power and Lighting",
        role: "Chief Electrical Engineer",
        startDate: "2018-04-01",
        endDate: "2026-06-10",
        description: "Oversee power distribution projects across coastal region.",
        location: "Mombasa, Kenya"
      }
    ],
    certifications: [
      {
        id: 1,
        name: "Registered Professional Engineer",
        issuingBody: "Engineers Board of Kenya",
        issueDate: "2018-08-20",
        certificateNumber: "EBK-PE-2018-6789"
      }
    ],
    projects: [
      {
        id: 1,
        projectName: "Mombasa Port Power Upgrade",
        clientName: "Kenya Ports Authority",
        duration: "18 months",
        description: "Complete power infrastructure upgrade for port facilities",
        value: "KES 2.5B"
      }
    ],
    education: "MSc Electrical Engineering - Technical University of Mombasa (2016)",
    additionalSkills: ["Power Systems Analysis", "SCADA Systems", "Grid Management"]
  },

  // Professional 11 - RETURNED (has experience)
  {
    builderId: 11,
    workExperience: [
      {
        id: 1,
        companyName: "Kisumu Survey Associates",
        role: "Land Surveyor",
        startDate: "2020-02-15",
        endDate: "2026-05-15",
        description: "Conducted cadastral and topographic surveys for development projects.",
        location: "Kisumu, Kenya"
      }
    ],
    certifications: [
      {
        id: 1,
        name: "Licensed Land Surveyor",
        issuingBody: "Survey of Kenya",
        issueDate: "2020-04-10",
        certificateNumber: "SOK-LS-2020-4567"
      }
    ],
    projects: [
      {
        id: 1,
        projectName: "Kisumu Bypass Survey",
        clientName: "Kenya National Highways Authority",
        duration: "8 months",
        description: "Topographic survey for 45km bypass road",
        value: "KES 45M"
      }
    ],
    education: "BSc Geomatics Engineering - Technical University of Kenya (2019)",
    additionalSkills: ["GPS/GNSS", "GIS Mapping", "Drone Surveying"]
  },

  // Professional 12 - SIGNED_UP (no experience pre-filled)
  {
    builderId: 12,
    workExperience: [],
    certifications: [],
    projects: [],
  },

  // ================= CONTRACTOR EXPERIENCE =================
  // Contractor 13 - PENDING (has experience)
  {
    builderId: 13,
    workExperience: [
      {
        id: 1,
        companyName: "BuildRight Construction",
        role: "Managing Director",
        startDate: "2018-01-01",
        endDate: "2026-07-08",
        description: "Founded and led residential construction company. Completed over 50 housing projects.",
        location: "Embakasi, Nairobi"
      },
      {
        id: 2,
        companyName: "Nairobi Builders Ltd",
        role: "Project Manager",
        startDate: "2014-06-15",
        endDate: "2017-12-31",
        description: "Managed construction projects for residential estates.",
        location: "Nairobi, Kenya"
      }
    ],
    certifications: [
      {
        id: 1,
        name: "NCA Contractor Registration - Category 4",
        issuingBody: "National Construction Authority",
        issueDate: "2018-03-20",
        expiryDate: "2028-03-20",
        certificateNumber: "NCA-C4-2018-1234"
      },
      {
        id: 2,
        name: "Project Management Professional (PMP)",
        issuingBody: "Project Management Institute",
        issueDate: "2016-09-15",
        certificateNumber: "PMI-PMP-2016-5678"
      }
    ],
    projects: [
      {
        id: 1,
        projectName: "Embakasi Gardens Estate",
        clientName: "Private Client",
        duration: "24 months",
        description: "Construction of 120-unit residential estate",
        value: "KES 450M"
      },
      {
        id: 2,
        projectName: "Utawala Commercial Center",
        clientName: "Utawala Investments",
        duration: "18 months",
        description: "Mixed-use commercial development",
        value: "KES 280M"
      }
    ],
    education: "BSc Civil Engineering - University of Nairobi (2012)",
    additionalSkills: ["Project Planning", "Cost Control", "Contract Management", "FIDIC Contracts"]
  },

  // Contractor 14 - VERIFIED (has experience)
  {
    builderId: 14,
    workExperience: [
      {
        id: 1,
        companyName: "Premier Builders Ltd",
        role: "Chief Executive Officer",
        startDate: "2015-04-01",
        endDate: "2026-06-01",
        description: "Led commercial construction projects across Rift Valley region.",
        location: "Nakuru, Kenya"
      }
    ],
    certifications: [
      {
        id: 1,
        name: "NCA Contractor Registration - Category 3",
        issuingBody: "National Construction Authority",
        issueDate: "2016-07-15",
        expiryDate: "2026-07-15",
        certificateNumber: "NCA-C3-2016-2345"
      }
    ],
    projects: [
      {
        id: 1,
        projectName: "Nakuru CBD Office Block",
        clientName: "County Government of Nakuru",
        duration: "30 months",
        description: "Construction of 15-storey office complex",
        value: "KES 1.8B"
      }
    ],
    education: "BSc Construction Management - JKUAT (2013)",
    additionalSkills: ["Heavy Equipment Management", "Safety Management", "Quality Assurance"]
  },

  // Contractor 15 - INCOMPLETE (no experience pre-filled)
  {
    builderId: 15,
    workExperience: [],
    certifications: [],
    projects: [],
  },

  // Contractor 16 - COMPLETED (has experience)
  {
    builderId: 16,
    workExperience: [
      {
        id: 1,
        companyName: "Lakeside Developers",
        role: "Director",
        startDate: "2017-08-01",
        endDate: "2026-04-10",
        description: "Specialized in residential developments in Kisumu region.",
        location: "Kisumu, Kenya"
      }
    ],
    certifications: [
      {
        id: 1,
        name: "NCA Contractor Registration - Category 5",
        issuingBody: "National Construction Authority",
        issueDate: "2017-10-20",
        expiryDate: "2027-10-20",
        certificateNumber: "NCA-C5-2017-3456"
      }
    ],
    projects: [
      {
        id: 1,
        projectName: "Milimani Residences",
        clientName: "Kisumu Housing Cooperative",
        duration: "20 months",
        description: "Construction of 80-unit apartment complex",
        value: "KES 320M"
      }
    ],
    education: "Diploma in Building Construction - Kisumu Polytechnic (2015)",
    additionalSkills: ["Residential Construction", "Project Scheduling", "Client Relations"]
  },

  // Contractor 17 - RETURNED (has experience)
  {
    builderId: 17,
    workExperience: [
      {
        id: 1,
        companyName: "Highland Projects Ltd",
        role: "Managing Partner",
        startDate: "2019-02-01",
        endDate: "2026-03-05",
        description: "Commercial and industrial construction in Central Kenya.",
        location: "Thika, Kiambu"
      }
    ],
    certifications: [
      {
        id: 1,
        name: "NCA Contractor Registration - Category 4",
        issuingBody: "National Construction Authority",
        issueDate: "2019-05-10",
        expiryDate: "2029-05-10",
        certificateNumber: "NCA-C4-2019-4567"
      }
    ],
    projects: [
      {
        id: 1,
        projectName: "Thika Industrial Park",
        clientName: "EPZ Authority",
        duration: "24 months",
        description: "Construction of warehouse and factory facilities",
        value: "KES 580M"
      }
    ],
    education: "BSc Civil Engineering - JKUAT (2017)",
    additionalSkills: ["Industrial Construction", "Steel Structures", "Environmental Compliance"]
  },

  // Contractor 18 - SIGNED_UP (no experience pre-filled)
  {
    builderId: 18,
    workExperience: [],
    certifications: [],
    projects: [],
  },

  // ================= HARDWARE EXPERIENCE =================
  // Hardware stores don't need work experience - they have business info instead
  {
    builderId: 19,
    workExperience: [],
    certifications: [],
    projects: [],
  },
  {
    builderId: 20,
    workExperience: [],
    certifications: [],
    projects: [],
  },
  {
    builderId: 21,
    workExperience: [],
    certifications: [],
    projects: [],
  },
  {
    builderId: 22,
    workExperience: [],
    certifications: [],
    projects: [],
  },
  {
    builderId: 23,
    workExperience: [],
    certifications: [],
    projects: [],
  },
  {
    builderId: 24,
    workExperience: [],
    certifications: [],
    projects: [],
  },
];

// Helper function to get experience by builder ID
export const getBuilderExperience = (builderId: number): BuilderExperience | undefined => {
  return builderExperienceData.find(exp => exp.builderId === builderId);
};
