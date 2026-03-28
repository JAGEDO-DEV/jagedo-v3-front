/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo, useState, useEffect, useCallback } from "react";


export const useProfileCompletion = (
  userData: any,
  userType: string,
): { [key: string]: "complete" | "incomplete" } => {
  
  const [storageVersion, setStorageVersion] = useState(0);

  
  useEffect(() => {
    const handleStorageChange = () => {
      setStorageVersion((v) => v + 1);
    };

    
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const completionStatus = useMemo((): {
    [key: string]: "complete" | "incomplete";
  } => {
    
    const defaultStatus: { [key: string]: "complete" | "incomplete" } = {
      "account-info": "complete", 
      address: "incomplete", 
      "account-uploads": "incomplete", 
      experience: "incomplete", 
      products: "incomplete", 
    };

    if (!userData) {
      return defaultStatus;
    }

    
    
    
    
    const getRequiredDocuments = () => {
      const accountType = userData?.accountType?.toLowerCase() || "";
      const userTypeLC = userType.toLowerCase();

      
      if (accountType === "individual" && userTypeLC === "customer") {
        return ["idFront", "idBack", "krapin"];
      }

      
      const docMap: any = {
        customer: ["businessPermit", "certificateOfIncorporation", "krapin", "companyProfile"],
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

    
    const profile = userData || {};
    const requiredDocs = getRequiredDocuments();

    
    const checkDocument = (key: string): boolean => {
      const documentDetails = profile?.documentDetails || {};
      
      
      const backendKeyMap: any = {
        idFront: "idFront",
        idBack: "idBack",
        krapin: "krapin",
        certificate: "certificate",
        academicCertificate: "academicCertificate",
        cv: "cv",
        practiceLicense: "practiceLicense",
        businessPermit: "businessPermit",
        singleBusinessPermit: "businessPermit",
        businessRegistration: "businessRegistration",
        certificateOfIncorporation: "businessRegistration",
        companyProfile: "companyProfile"
      };

      const bKey = backendKeyMap[key] || key;
      const detail = documentDetails[bKey];
      const docStatus = (detail?.status || detail) || "";
      
      
      if (docStatus === "REJECTED" || docStatus === "RESUBMIT") {
        return false;
      }

      switch (key) {
        case "idFront":
          return !!profile.idFrontUrl;
        case "idBack":
          return !!profile.idBackUrl;
        case "krapin":
          return !!(profile.krapin || profile.kraPIN);
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
        : profile.documentStatus === "REJECTED" ||
          profile.documentStatus === "RESUBMIT"
        ? false
        : requiredDocs.length > 0 &&
          requiredDocs.every((doc) => checkDocument(doc));

    
    
    
    
    let experienceComplete = false;
    const userTypeUpper = userType.toUpperCase();

    
    const checkExperienceFields = (): boolean => {
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

      const requiredProjects = getRequiredProjectCount();

      
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

      const projects = getProjectsArray();
      const hasEnoughProjects = projects.length >= requiredProjects;

      
      if (userTypeUpper === "CUSTOMER") {
        return true;
      }
      if (userTypeUpper === "FUNDI") {
        const hasGrade = !!userData?.grade;
        const hasExperience = !!userData?.experience;
        return hasGrade && hasExperience && hasEnoughProjects;
      }

      if (userTypeUpper === "CONTRACTOR") {
        
        const hasExperience = !!userData?.contractorExperiences;
        return hasExperience && hasEnoughProjects;
      }
      if (userTypeUpper === "PROFESSIONAL") {
        const hasProfession = !!userData?.profession;
        const hasLevel = !!userData?.levelOrClass; 
        const hasExperience = !!userData?.yearsOfExperience;
        return hasProfession && hasLevel && hasExperience && hasEnoughProjects;
      }
      if (userTypeUpper === "HARDWARE") {
        return  true;
      }
      return false;
    };

    const fieldsComplete = checkExperienceFields();

    if (userTypeUpper === "CUSTOMER") {
      
      experienceComplete = true;
    } else if (
      userData?.experienceStatus === "VERIFIED"
    ) {
      experienceComplete = true;
    } else if (
      userData?.experienceStatus === "PENDING"
    ) {
      experienceComplete = fieldsComplete;
    } else if (
      userData?.experienceStatus === "RESUBMIT" ||
      userData?.experienceStatus === "REJECTED"
    ) {
      
      experienceComplete = false;
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
    // logExperienceIssues();
    const addressComplete = !!(
      userData?.country &&
      userData?.county &&
      userData?.subCounty &&
      userData?.city &&
      userData?.estate
    );
    
    
    
    const statusObject: { [key: string]: "complete" | "incomplete" } = {
      "account-info": "complete", 
      address: addressComplete ? "complete" : "incomplete",
      "account-uploads": uploadsComplete ? "complete" : "incomplete",
      experience: experienceComplete ? "complete" : "incomplete",
      products: "incomplete", 
    };

    return statusObject;
    
  }, [userData, userType, storageVersion]);

  return completionStatus;
};

export type CompletionStatus = "complete" | "incomplete";
