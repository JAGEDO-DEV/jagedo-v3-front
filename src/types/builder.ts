export type BuilderType = "FUNDI" | "PROFESSIONAL" | "CONTRACTOR" | "HARDWARE";

export interface BuilderSkill {
  id: number;
  skillName: string;
  builderType: BuilderType;
  specializations?: string[];
  createdAt: string;
  createdBy: string;
  approvedBy: string;
  approvedDate: string | null;
  isActive?: boolean;
}

export const BUILDER_TYPES: BuilderType[] = [
  "FUNDI",
  "PROFESSIONAL",
  "CONTRACTOR",
  "HARDWARE",
];

export const BUILDER_TYPE_LABELS: Record<BuilderType, string> = {
  FUNDI: "Fundi",
  PROFESSIONAL: "Professional",
  CONTRACTOR: "Contractor",
  HARDWARE: "Hardware",
};
