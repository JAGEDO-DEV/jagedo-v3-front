/* eslint-disable @typescript-eslint/no-explicit-any */

export type BuilderType = "FUNDI" | "PROFESSIONAL" | "CONTRACTOR" | "HARDWARE";

export type ContractorCategory = {
  category: string;
  specialization: string;
  class: string;
  years: string;
  projectFile?: File;
  referenceFile?: File;
};

export interface ExperienceProps {
  userData?: any;
  isAdmin?: boolean;
  refetch?: () => void;
}

export interface ActionModalState {
  isOpen: boolean;
  action: "approve" | "reject" | "resubmit" | null;
}

export interface FieldConfig {
  name: string;
  label: string;
  options: string[];
  dependsOn?: string;
}
