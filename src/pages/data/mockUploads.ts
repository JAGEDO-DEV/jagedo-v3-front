// Mock upload URLs for prefilling when status is VERIFIED, COMPLETED, PENDING, or RETURNED

export const MOCK_UPLOADS = {
  customer01: {
    idFront: "https://files.mock/jagedo/customer01-id-front.pdf",
    idBack: "https://files.mock/jagedo/customer01-id-back.pdf",
    kraPIN: "https://files.mock/jagedo/customer01-kra.pdf",
  },

  customer02: {
    businessPermit: "https://files.mock/jagedo/customer02-permit.pdf",
    certificateOfIncorporation: "https://files.mock/jagedo/customer02-incorporation.pdf",
    kraPIN: "https://files.mock/jagedo/customer02-kra.pdf",
  },

  fundi01: {
    idFront: "https://files.mock/jagedo/fundi-id-front.pdf",
    idBack: "https://files.mock/jagedo/fundi-id-back.pdf",
    certificate: "https://files.mock/jagedo/fundi-certificate.pdf",
    kraPIN: "https://files.mock/jagedo/fundi-kra.pdf",
  },

  professional01: {
    idFront: "https://files.mock/jagedo/pro-id-front.pdf",
    idBack: "https://files.mock/jagedo/pro-id-back.pdf",
    academicCertificate: "https://files.mock/jagedo/pro-academic.pdf",
    cv: "https://files.mock/jagedo/pro-cv.pdf",
    practiceLicense: "https://files.mock/jagedo/pro-license.pdf",
    kraPIN: "https://files.mock/jagedo/pro-kra.pdf",
  },

  contractor01: {
    businessRegistration: "https://files.mock/jagedo/contractor-reg.pdf",
    businessPermit: "https://files.mock/jagedo/contractor-permit.pdf",
    companyProfile: "https://files.mock/jagedo/contractor-profile.pdf",
    kraPIN: "https://files.mock/jagedo/contractor-kra.pdf",
    contractorPracticeLicense: "https://files.mock/jagedo/contractor-practice-license.pdf",
    contractorCertificate: "https://files.mock/jagedo/contractor-certificate.pdf",
  },

  hardware01: {
    certificateOfIncorporation: "https://files.mock/jagedo/hardware-reg.pdf",
    singleBusinessPermit: "https://files.mock/jagedo/hardware-permit.pdf",
    companyProfile: "https://files.mock/jagedo/hardware-profile.pdf",
    kraPIN: "https://files.mock/jagedo/hardware-kra.pdf",
  },
};

// Helper function to get mock uploads based on user type
export const getMockUploadsForUserType = (userType: string, accountType?: string): Record<string, string> => {
  const type = userType?.toLowerCase() || "";
  const account = accountType?.toLowerCase() || "";

  if (type === "customer") {
    // Individual customers use customer01, business customers use customer02
    return account === "individual" ? MOCK_UPLOADS.customer01 : MOCK_UPLOADS.customer02;
  }

  switch (type) {
    case "fundi":
      return MOCK_UPLOADS.fundi01;
    case "professional":
      return MOCK_UPLOADS.professional01;
    case "contractor":
      return MOCK_UPLOADS.contractor01;
    case "hardware":
      return MOCK_UPLOADS.hardware01;
    default:
      return {};
  }
};
