/* eslint-disable @typescript-eslint/no-explicit-any */
// Shared, type-agnostic helpers extracted verbatim from the original Experience.tsx.

export const deepMerge = (target: any, source: any): any => {
  const result = { ...target };
  for (const key in source) {
    if (
      source[key] &&
      typeof source[key] === "object" &&
      !Array.isArray(source[key])
    ) {
      result[key] = deepMerge(result[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
};

export const resolveSpecialization = (user: any) => {
  if (!user) return "";
  if (user.specialization) return user.specialization;
  if (user.fundispecialization) return user.fundispecialization;
  if (user.professionalSpecialization) return user.professionalSpecialization;
  if (user.contractorSpecialization) return user.contractorSpecialization;
  return "";
};

export const PREFILL_STATUSES = ["COMPLETED", "VERIFIED", "PENDING", "RETURNED"];

export const CATEGORY_OPTIONS = [
  "Building Works",
  "Water Works",
  "Electrical Works",
  "Mechanical Works",
];
