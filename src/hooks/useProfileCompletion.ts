/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo, useState, useEffect, useCallback } from 'react';

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
export const useProfileCompletion = (userData: any, userType: string): { [key: string]: 'complete' | 'incomplete' } => {
  // State to force re-computation when localStorage changes
  const [storageVersion, setStorageVersion] = useState(0);

  // Listen for storage events (including custom events from document uploads)
  useEffect(() => {
    const handleStorageChange = () => {
      setStorageVersion(v => v + 1);
    };

    // Listen for both native storage events and custom events
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const completionStatus = useMemo((): { [key: string]: 'complete' | 'incomplete' } => {
    // If no user data, mark everything as incomplete
    const defaultStatus: { [key: string]: 'complete' | 'incomplete' } = {
      'account-info': 'complete',      // Always complete (filled at signup)
      'address': 'complete',           // Always complete (filled at signup)
      'account-uploads': 'incomplete', // Depends on document uploads
      'experience': 'incomplete',       // Depends on experience data
      'products': 'incomplete',         // Not required yet
    };

    if (!userData) {
      return defaultStatus;
    }

    // ============================================
    // ACCOUNT UPLOADS COMPLETION
    // ============================================
    // Get required documents based on user type
    const getRequiredDocuments = () => {
      const accountType = userData?.accountType?.toLowerCase() || '';
      const userTypeLC = userType.toLowerCase();

      // Individual customer needs: ID Front, ID Back, KRA PIN
      if (accountType === 'individual' && userTypeLC === 'customer') {
        return ['idFront', 'idBack', 'krapin'];
      }

      // Map of required documents per user type
      const docMap: any = {
        customer: ['businessPermit', 'certificateOfIncorporation', 'krapin'],
        fundi: ['idFront', 'idBack', 'certificate', 'krapin'],
        professional: ['idFront', 'idBack', 'academicCertificate', 'cv', 'krapin', 'practiceLicense'],
        contractor: ['businessRegistration', 'businessPermit', 'krapin', 'companyProfile'],
        hardware: ['certificateOfIncorporation', 'krapin', 'singleBusinessPermit', 'companyProfile'],
      };

      return docMap[userTypeLC] || [];
    };

    // Check if ALL required documents are uploaded in the actual profile data
    const profile = userData || {};
    const requiredDocs = getRequiredDocuments();

    // Mapping of internal document keys to profile property names
    const checkDocument = (key: string): boolean => {
      switch (key) {
        case 'idFront': return !!profile.idFrontUrl;
        case 'idBack': return !!profile.idBackUrl;
        case 'krapin': return !!profile.krapin;
        case 'certificate': return !!profile.certificateUrl;
        case 'academicCertificate': return !!profile.academicCertificateUrl;
        case 'cv': return !!profile.cvUrl;
        case 'practiceLicense': return !!profile.practiceLicense;
        case 'businessPermit':
        case 'singleBusinessPermit':
          return !!(profile.businessPermit || profile.singleBusinessPermit);
        case 'businessRegistration':
        case 'certificateOfIncorporation':
          return !!(profile.certificateOfIncorporation || profile.businessRegistration || profile.registrationCertificateUrl);
        case 'companyProfile': return !!profile.companyProfile;
        case 'ncaCertificate': return !!(profile.ncaCertificate || profile.ncaRegCardUrl);
        default: return !!profile[key];
      }
    };

    const uploadsComplete =
      (profile.documentStatus === 'PENDING' || profile.documentStatus === 'VERIFIED') ||
      (requiredDocs.length === 0 || requiredDocs.every(doc => checkDocument(doc)));

    // ============================================
    // EXPERIENCE COMPLETION
    // ============================================
    // Check experience based on user type
    let experienceComplete = false;
    const userTypeUpper = userType.toUpperCase();

    if (userData?.experienceStatus === 'PENDING' || userData?.experienceStatus === 'VERIFIED') {
      experienceComplete = true;
    } else if (userTypeUpper === 'CUSTOMER') {
      // CUSTOMER doesn't have experience section
      experienceComplete = true;
    } else if (userTypeUpper === 'FUNDI') {
      // FUNDI: needs grade, experience, and previousJobPhotoUrls
      const hasGrade = userData?.grade;
      const hasExperience = userData?.experience;
      const hasProjects = userData?.previousJobPhotoUrls &&
        userData.previousJobPhotoUrls.length > 0;
      experienceComplete = !!(hasGrade && hasExperience && hasProjects);
    } else if (userTypeUpper === 'PROFESSIONAL') {
      // PROFESSIONAL: needs profession, professionalLevel, yearsOfExperience, and professionalProjects
      const hasProfession = userData?.profession;
      const hasLevel = userData?.levelOrClass;
      const hasExperience = userData?.yearsOfExperience;
      const hasProjects = userData?.professionalProjects &&
        userData.professionalProjects.length > 0;
      experienceComplete = !!(hasProfession && hasLevel && hasExperience && hasProjects);
    } else if (userTypeUpper === 'CONTRACTOR') {
      // CONTRACTOR: needs contractorType, licenseLevel, contractorExperiences, and contractorProjects
      const hasType = userData?.contractorType;
      const hasLevel = userData?.licenseLevel;
      const hasExperience = userData?.contractorExperiences;
      const hasProjects = userData?.contractorProjects &&
        userData.contractorProjects.length > 0;
      experienceComplete = !!(hasType && hasLevel && hasExperience && hasProjects);
    } else if (userTypeUpper === 'HARDWARE') {
      // HARDWARE: needs hardwareType, businessType, experience, and hardwareProjects
      const hasType = userData?.hardwareType;
      const hasBusinessType = userData?.businessType;
      const hasExperience = userData?.experience;
      const hasProjects = userData?.hardwareProjects &&
        userData.hardwareProjects.length > 0;
      experienceComplete = !!(hasType && hasBusinessType && hasExperience && hasProjects);
    }

    // ============================================
    // RETURN STATUS FOR ALL SECTIONS
    // ============================================
    const statusObject: { [key: string]: 'complete' | 'incomplete' } = {
      'account-info': 'complete',      // Always complete (filled during signup)
      'address': 'complete',           // Always complete (filled during signup)
      'account-uploads': uploadsComplete ? 'complete' : 'incomplete',
      'experience': experienceComplete ? 'complete' : 'incomplete',
      'products': 'incomplete',         // Not tracked yet
    };

    return statusObject;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData, userType, storageVersion]);

  return completionStatus;
};

export type CompletionStatus = 'complete' | 'incomplete';