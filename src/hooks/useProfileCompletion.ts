/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo } from 'react';

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
        return ['idFront', 'idBack', 'kraPIN'];
      }

      // Map of required documents per user type
      const docMap: any = {
        customer: ['businessPermit', 'certificateOfIncorporation', 'kraPIN'],
        fundi: ['idFront', 'idBack', 'certificate', 'kraPIN'],
        professional: ['idFront', 'idBack', 'academicCertificate', 'cv', 'kraPIN', 'practiceLicense'],
        contractor: ['businessRegistration', 'businessPermit', 'kraPIN', 'companyProfile'],
        hardware: ['certificateOfIncorporation', 'kraPIN', 'singleBusinessPermit', 'companyProfile'],
      };

      return docMap[userTypeLC] || [];
    };

    // Get documents uploaded from localStorage
    // Storage key format: uploads_demo_[userId]
    const uploadedDocs = JSON.parse(
      localStorage.getItem(`uploads_demo_${userData.id}`) || '{}'
    );

    // Check if ALL required documents are uploaded
    const requiredDocs = getRequiredDocuments();
    // If no docs required (edge case), mark as complete
    // Otherwise, check if every required document exists in localStorage
    const uploadsComplete = requiredDocs.length === 0 || 
      requiredDocs.every(doc => uploadedDocs[doc]);

    // ============================================
    // EXPERIENCE COMPLETION
    // ============================================
    // Only check experience for non-customer users (FUNDI, PROFESSIONAL, CONTRACTOR)
    let experienceComplete = false;

    if (userType !== 'CUSTOMER' && userType !== 'HARDWARE') {
      // Experience is complete if ALL of these exist:
      // 1. Grade selected (e.g., "G1: Master Fundi")
      // 2. Experience level selected (e.g., "10+ years")
      // 3. At least one project with photos uploaded
      
      const hasGrade = userData?.userProfile?.grade;
      const hasExperience = userData?.userProfile?.experience;
      const hasProjects = userData?.userProfile?.previousJobPhotoUrls && 
                          userData.userProfile.previousJobPhotoUrls.length > 0;
      
      experienceComplete = hasGrade && hasExperience && hasProjects;
    } else {
      // For CUSTOMER and HARDWARE, mark experience as complete (not applicable)
      experienceComplete = true;
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
  }, [userData, userType]);

  return completionStatus;
};

export type CompletionStatus = 'complete' | 'incomplete';