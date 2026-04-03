import { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { getAuthHeaders } from '@/utils/auth';
import { getSkillsTree } from '@/api/builderSkillsApi.api';

/**
 * Represents a complete builder profile with skills and specializations
 */
export interface BuilderProfile {
  builderType: string;
  skills: SkillSelection[];
}

export interface SkillSelection {
  skillCode: string;
  skillName: string;
  specializations: string[]; // specialization codes
}

interface UseBuilderOnboardingOptions {
  /** Optional: Auto-load tree data on mount */
  autoLoad?: boolean;
}

/**
 * Multi-step builder onboarding hook
 * Manages: builder type selection → skill selection → specialization selection
 */
export function useBuilderOnboarding(options: UseBuilderOnboardingOptions = {}) {
  const { autoLoad = true } = options;

  // Tree data
  const [tree, setTree] = useState<Record<string, any> | null>(null);
  const [treeLoading, setTreeLoading] = useState(false);
  const [treeError, setTreeError] = useState<string | null>(null);

  // Form state
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1); // 4 = review/submit
  const [selectedBuilderType, setSelectedBuilderType] = useState<string>('');
  const [selectedSkills, setSelectedSkills] = useState<SkillSelection[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const axiosInstance = axios.create({
    headers: { Authorization: getAuthHeaders() },
  });

  /**
   * Load skills tree from backend
   */
  const loadTree = useCallback(async () => {
    setTreeLoading(true);
    setTreeError(null);

    try {
      const data = await getSkillsTree(axiosInstance);
      setTree(data);
    } catch (err: any) {
      const message = err?.response?.data?.message ?? 'Failed to load skills tree';
      setTreeError(message);
    } finally {
      setTreeLoading(false);
    }
  }, [axiosInstance]);

  /**
   * Auto-load tree on mount
   */
  useEffect(() => {
    if (autoLoad && !tree) {
      loadTree();
    }
  }, [autoLoad, tree, loadTree]);

  /**
   * Get available builder types from tree
   */
  const builderTypes = useMemo(
    () =>
      tree
        ? Object.values(tree).map((node: any) => ({
            code: node.code,
            name: node.name,
            skillCount: node.skills?.length || 0,
          }))
        : [],
    [tree]
  );

  /**
   * Get skills available for selected builder type
   */
  const availableSkills = useMemo(
    () =>
      selectedBuilderType && tree
        ? tree[selectedBuilderType]?.skills || []
        : [],
    [selectedBuilderType, tree]
  );

  /**
   * Get specializations for a specific skill
   */
  const getSpecializations = useCallback(
    (skillCode: string) => {
      if (!selectedBuilderType || !tree) return [];
      const skill = tree[selectedBuilderType]?.skills?.find(
        (s: any) => s.code === skillCode
      );
      return skill?.specializations || [];
    },
    [selectedBuilderType, tree]
  );

  /**
   * Move to next step with validation
   */
  const goToNextStep = useCallback(() => {
    const newErrors: Record<string, string> = {};

    // Validate current step
    if (currentStep === 1) {
      if (!selectedBuilderType) {
        newErrors.builderType = 'Please select a builder type';
      }
    } else if (currentStep === 2) {
      if (selectedSkills.length === 0) {
        newErrors.skills = 'Please select at least one skill';
      }
    } else if (currentStep === 3) {
      // Validate that all skills have at least one specialization
      const skillsWithoutSpecs = selectedSkills.filter(
        (s) => s.specializations.length === 0
      );
      if (skillsWithoutSpecs.length > 0) {
        newErrors.specializations =
          'Please select specializations for all skills';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return false;
    }

    setErrors({});

    if (currentStep < 4) {
      setCurrentStep((prev) => (prev + 1) as 1 | 2 | 3 | 4);
    }

    return true;
  }, [currentStep, selectedBuilderType, selectedSkills]);

  /**
   * Move to previous step
   */
  const goToPreviousStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as 1 | 2 | 3 | 4);
      setErrors({});
    }
  }, [currentStep]);

  /**
   * Add a skill with optional specializations
   */
  const addSkill = useCallback(
    (skillCode: string, specializations: string[] = []) => {
      setSelectedSkills((prev) => {
        // Avoid duplicates
        if (prev.some((s) => s.skillCode === skillCode)) {
          return prev;
        }

        const skill = availableSkills.find((s: any) => s.code === skillCode);
        if (!skill) return prev;

        return [
          ...prev,
          {
            skillCode,
            skillName: skill.name,
            specializations,
          },
        ];
      });
    },
    [availableSkills]
  );

  /**
   * Remove a skill
   */
  const removeSkill = useCallback((skillCode: string) => {
    setSelectedSkills((prev) => prev.filter((s) => s.skillCode !== skillCode));
  }, []);

  /**
   * Update specializations for a skill
   */
  const updateSkillSpecializations = useCallback(
    (skillCode: string, specializations: string[]) => {
      setSelectedSkills((prev) =>
        prev.map((s) =>
          s.skillCode === skillCode
            ? { ...s, specializations }
            : s
        )
      );
    },
    []
  );

  /**
   * Reset the entire form
   */
  const reset = useCallback(() => {
    setCurrentStep(1);
    setSelectedBuilderType('');
    setSelectedSkills([]);
    setErrors({});
  }, []);

  /**
   * Build final profile payload
   */
  const buildProfile = useCallback((): BuilderProfile => {
    return {
      builderType: selectedBuilderType,
      skills: selectedSkills,
    };
  }, [selectedBuilderType, selectedSkills]);

  /**
   * Get progress percentage
   */
  const progressPercent = useMemo(() => {
    const steps = 4;
    return Math.round((currentStep / steps) * 100);
  }, [currentStep]);

  return {
    // Tree state
    tree,
    treeLoading,
    treeError,
    loadTree,

    // Step navigation
    currentStep,
    progressPercent,
    goToNextStep,
    goToPreviousStep,

    // Form data
    selectedBuilderType,
    setSelectedBuilderType,
    selectedSkills,
    errors,

    // Form helpers
    builderTypes,
    availableSkills,
    getSpecializations,

    // Actions
    addSkill,
    removeSkill,
    updateSkillSpecializations,
    reset,
    buildProfile,
  };
}
