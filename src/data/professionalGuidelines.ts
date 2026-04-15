export const PROFESSIONAL_USER = {
  type: "PROFESSIONAL",
  experience: {
    requiredFields: [
      "level",
      "category",
      "specialization",
      "yearsOfExperience",
    ],
    // DYNAMIC: Project fields based on selected level
    projectsByLevel: {
      "Senior": 5, // 5 project file fields
      "Professional": 3, // 3 project file fields
      "Graduate": 1, // 1 project file field
      "Student": 0, // 0 project file fields (no projects)
    },
    levels: [
      "Senior",
      "Professional",
      "Graduate",
      "Student",
    ],
    categories: [
      "Architecture",
      "Engineering",
      "Construction Management",
      "Project Management",
      "Surveying",
      "Other",
    ],
    specializations: {
      "Architecture": [
        "Residential",
        "Commercial",
        "Industrial",
        "Urban",
      ],
      "Engineering": [
        "Civil",
        "Structural",
        "Mechanical",
        "Electrical",
      ],
      "Construction Management": [
        "Residential",
        "Commercial",
        "Infrastructure",
      ],
      "Project Management": [
        "Construction",
        "Infrastructure",
        "Commercial",
      ],
      "Surveying": [
        "Land",
        "Engineering",
        "Hydrographic",
      ],
    },
    yearsOfExperience: [
      "10+ years",
      "5-10 years",
      "3-5 years",
      "1-3 years",
    ],
  },
  // Fixed uploads for all Professionals
  uploads: [
    {
      id: "ID_FRONT",
      label: "ID Front",
      description: "Front side of your ID",
    },
    {
      id: "ID_BACK",
      label: "ID Back",
      description: "Back side of your ID",
    },
    {
      id: "ACADEMICS_CERTIFICATE",
      label: "Academics Certificate",
      description: "Your degree or diploma",
    },
    {
      id: "CV",
      label: "CV",
      description: "Your curriculum vitae",
    },
    {
      id: "KRA_PIN",
      label: "KRA PIN",
      description: "Tax compliance certificate",
    },
  ],
};
