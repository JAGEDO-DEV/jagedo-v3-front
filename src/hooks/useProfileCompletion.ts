/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo, useState, useEffect, useCallback } from "react";

/**
 * useProfileCompletion Hook - SIMPLIFIED VERSION
 *
 * Since users fill Account Info & Address during sign-up, those are ALWAYS complete.
 * This hook only checks:
 * - Account Uploads: Are all required documents uploaded?
 * - Experience: Are grade, experience, and projects filled?
 *
 * Props:
 * - userData: User data object
 * - userType: Type of user (FUNDI, PROFESSIONAL, CONTRACTOR, HARDWARE, CUSTOMER)
 */
export const useProfileCompletion = (
  userData: any,
  userType: string,
): { [key: string]: "complete" | "incomplete" } => {
  // State to force re-computation when localStorage changes
  const [storageVersion, setStorageVersion] = useState(0);

  // Listen for storage events (including custom events from document uploads)
  useEffect(() => {
    const handleStorageChange = () => {
      setStorageVersion((v) => v + 1);
    };

    // Listen for both native storage events and custom events
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const completionStatus = useMemo((): {
    [key: string]: "complete" | "incomplete";
  } => {
    // If no user data, mark everything as incomplete
    const defaultStatus: { [key: string]: "complete" | "incomplete" } = {
      "account-info": "complete", // Always complete (filled at signup)
      address: "incomplete", // Always complete (filled at signup)
      "account-uploads": "incomplete", // Depends on document uploads
      experience: "incomplete", // Depends on experience data
      products: "incomplete", // Not required yet
    };

    if (!userData) {
      return defaultStatus;
    }

    // ============================================
    // ACCOUNT UPLOADS COMPLETION
    // ============================================
    // Get required documents based on user type
    const getRequiredDocuments = () => {
      const accountType = userData?.accountType?.toLowerCase() || "";
      const userTypeLC = userType.toLowerCase();

      // Individual customer needs: ID Front, ID Back, KRA PIN
      if (accountType === "individual" && userTypeLC === "customer") {
        return ["idFront", "idBack", "krapin"];
      }

      // Map of required documents per user type
      const docMap: any = {
        customer: ["businessPermit", "certificateOfIncorporation", "krapin"],
        fundi: ["idFront", "idBack", "certificate", "krapin"],
        professional: [
          "idFront",
          "idBack",
          "academicCertificate",
          "cv",
          "krapin",
          "practiceLicense",
        ],
        contractor: [
          "businessRegistration",
          "businessPermit",
          "krapin",
          "companyProfile",
        ],
        hardware: [
          "certificateOfIncorporation",
          "krapin",
          "singleBusinessPermit",
          "companyProfile",
        ],
      };

      return docMap[userTypeLC] || [];
    };

    // Check if ALL required documents are uploaded in the actual profile data
    const profile = userData || {};
    const requiredDocs = getRequiredDocuments();

    // Mapping of internal document keys to profile property names
    const checkDocument = (key: string): boolean => {
      switch (key) {
        case "idFront":
          return !!profile.idFrontUrl;
        case "idBack":
          return !!profile.idBackUrl;
        case "krapin":
          return !!profile.krapin;
        case "certificate":
          return !!profile.certificateUrl;
        case "academicCertificate":
          return !!profile.academicCertificateUrl;
        case "cv":
          return !!profile.cvUrl;
        case "practiceLicense":
          return !!profile.practiceLicense;
        case "businessPermit":
        case "singleBusinessPermit":
          return !!(profile.businessPermit || profile.singleBusinessPermit);
        case "businessRegistration":
        case "certificateOfIncorporation":
          return !!(
            profile.certificateOfIncorporation ||
            profile.businessRegistration ||
            profile.registrationCertificateUrl
          );
        case "companyProfile":
          return !!profile.companyProfile;
        case "ncaCertificate":
          return !!(profile.ncaCertificate || profile.ncaRegCardUrl);
        default:
          return !!profile[key];
      }
    };

    const uploadsComplete =
      profile.documentStatus === "VERIFIED"
        ? true
        : profile.documentStatus === "PENDING"
          ? true
          : profile.documentStatus === "REJECTED" ||
              profile.documentStatus === "RESUBMIT"
            ? false
            : requiredDocs.length > 0 &&
              requiredDocs.every((doc) => checkDocument(doc));

    // ============================================
    // EXPERIENCE COMPLETION
    // ============================================
    let experienceComplete = false;

    const getExperienceState = () => {
      const userTypeUpper = userType.toUpperCase();

      const getRequiredProjectCount = () => {
        if (userTypeUpper === "FUNDI") {
          const grade = userData?.grade;
          if (grade === "G1: Master Fundi") return 3;
          if (grade === "G2: Skilled") return 2;
          if (grade === "G3: Semi-skilled") return 1;
          return 0;
        }
        if (userTypeUpper === "PROFESSIONAL") {
          const level = userData?.levelOrClass;
          if (level === "Senior") return 3;
          if (level === "Professional") return 2;
          if (level === "Graduate") return 1;
          return 0;
        }
        if (userTypeUpper === "CONTRACTOR") return 1;
        if (userTypeUpper === "HARDWARE") return 2;
        return 0;
      };

      const getProjectsArray = () => {
        switch (userTypeUpper) {
          case "FUNDI":
            return userData?.previousJobPhotoUrls || [];
          case "PROFESSIONAL":
            return userData?.professionalProjects || [];
          case "CONTRACTOR":
            return userData?.contractorProjects || [];
          case "HARDWARE":
            return userData?.hardwareProjects || [];
          default:
            return [];
        }
      };

      const requiredProjects = getRequiredProjectCount();
      const projects = getProjectsArray();
      const hasEnoughProjects = projects.length >= requiredProjects;

      const checkFields = (): boolean => {
        if (userTypeUpper === "CUSTOMER") return true;
        if (userTypeUpper === "HARDWARE") return true;
        if (userTypeUpper === "FUNDI") {
          return (
            !!userData?.grade && !!userData?.experience && hasEnoughProjects
          );
        }
        if (userTypeUpper === "CONTRACTOR") {
          return !!userData?.contractorExperiences && hasEnoughProjects;
        }
        if (userTypeUpper === "PROFESSIONAL") {
          return (
            !!userData?.profession &&
            !!userData?.levelOrClass &&
            !!userData?.yearsOfExperience &&
            hasEnoughProjects
          );
        }
        return false;
      };

      return {
        userTypeUpper,
        hasEnoughProjects,
        fieldsComplete: checkFields(),
      };
    };

    const { userTypeUpper, hasEnoughProjects, fieldsComplete } =
      getExperienceState();

    if (userTypeUpper === "CUSTOMER") {
      experienceComplete = true;
    } else if (userData?.experienceStatus === "VERIFIED") {
      experienceComplete = true;
    } else if (
      userData?.experienceStatus === "RESUBMIT" ||
      userData?.experienceStatus === "REJECTED"
    ) {
      experienceComplete = false;
    } else if (userData?.experienceStatus === "PENDING" && hasEnoughProjects) {
      experienceComplete = true;
    } else {
      experienceComplete = fieldsComplete;
    }

    const logExperienceIssues = () => {
      if (!userData) return;

      const userTypeUpper = userType.toUpperCase();
      const issues: string[] = [];

      if (userTypeUpper === "CUSTOMER") {
        return;
      }

      if (userTypeUpper === "FUNDI") {
        const hasGrade = !!userData?.grade;
        const hasExperience = !!userData?.experience;
        const hasProjects =
          userData?.previousJobPhotoUrls &&
          userData.previousJobPhotoUrls.length > 0;

        if (!hasGrade) issues.push("Missing grade");
        if (!hasExperience) issues.push("Missing experience");
        if (!hasProjects) issues.push("Missing previous projects");
      }

      if (userTypeUpper === "PROFESSIONAL") {
        const hasProfession = !!userData?.profession;
        const hasLevel = !!userData?.levelOrClass;
        const hasExperience = !!userData?.yearsOfExperience;
        const hasProjects =
          userData?.professionalProjects &&
          userData.professionalProjects.length > 0;

        if (!hasProfession) issues.push("Missing profession");
        if (!hasLevel) issues.push("Missing level/class");
        if (!hasExperience) issues.push("Missing years of experience");
        if (!hasProjects) issues.push("Missing professional projects");
      }

      if (userTypeUpper === "CONTRACTOR") {
        const hasType = !!userData?.contractorType;
        const hasLevel = !!userData?.licenseLevel;
        const hasExperience = !!userData?.contractorExperiences;
        const hasProjects =
          userData?.contractorProjects &&
          userData.contractorProjects.length > 0;

        if (!hasType) issues.push("Missing contractor type");
        if (!hasLevel) issues.push("Missing license level");
        if (!hasExperience) issues.push("Missing contractor experience");
        if (!hasProjects) issues.push("Missing contractor projects");

        console.log("🔎 CONTRACTOR EXPERIENCE CHECK:", {
          hasType,
          hasLevel,
          hasExperience,
          hasProjects,
          experienceStatus: userData?.experienceStatus,
          issues,
        });
      }

      if (userTypeUpper === "HARDWARE") {
        const hasType = !!userData?.hardwareType;
        const hasBusinessType = !!userData?.businessType;
        const hasExperience = !!userData?.experience;
        const hasProjects =
          userData?.hardwareProjects && userData.hardwareProjects.length > 0;

        if (!hasType) issues.push("Missing hardware type");
        if (!hasBusinessType) issues.push("Missing business type");
        if (!hasExperience) issues.push("Missing experience");
        if (!hasProjects) issues.push("Missing hardware projects");

        console.log("🔎 HARDWARE EXPERIENCE CHECK:", {
          hasType,
          hasBusinessType,
          hasExperience,
          hasProjects,
          experienceStatus: userData?.experienceStatus,
          issues,
        });
      }

      if (issues.length === 0) {
        console.log("✅ EXPERIENCE COMPLETE — nothing missing");
      } else {
        console.log("❌ EXPERIENCE INCOMPLETE — issues:", issues);
      }
    };
    logExperienceIssues();
    const addressComplete = !!(
      userData?.country &&
      userData?.county &&
      userData?.subCounty &&
      userData?.city &&
      userData?.estate
    );

    const AccountInfoComplte = !!(
      (userData?.firstName &&
        userData?.lastName &&
        userData?.phone &&
        userData?.email) ||
      userData?.organizationName ||
      userData?.contactFullName
    );

    // ============================================
    // RETURN STATUS FOR ALL SECTIONS
    // ============================================
    const statusObject: { [key: string]: "complete" | "incomplete" } = {
      "account-info": AccountInfoComplte ? "complete" : "incomplete",
      address: addressComplete ? "complete" : "incomplete",
      "account-uploads": uploadsComplete ? "complete" : "incomplete",
      experience: experienceComplete ? "complete" : "incomplete",
      products: "incomplete", // Not tracked yet
    };

    return statusObject;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData, userType, storageVersion]);

  return completionStatus;
};

export type CompletionStatus = "complete" | "incomplete";
