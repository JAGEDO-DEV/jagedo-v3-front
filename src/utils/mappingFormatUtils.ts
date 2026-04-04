/**
 * Utility functions to ensure clean, consistent formatting for specialization mappings
 */

/**
 * Format skill code to lowercase with hyphens
 * Examples: "mason", "glass-aluminium-fitter", "interior-skimmer"
 */
export const formatSkillCode = (input: string): string => {
  return input
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')        // Replace spaces with hyphens
    .replace(/\//g, '-')         // Replace slashes with hyphens
    .replace(/[^\w-]/g, '')      // Remove special characters except hyphens
    .replace(/-+/g, '-')         // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, '');    // Remove leading/trailing hyphens
};

/**
 * Format specialization type code to uppercase with underscores
 * Examples: "FUNDI_MASON_SPECS", "FUNDI_GLASS_ALUMINIUM_SPECS"
 */
export const formatSpecTypeCode = (input: string): string => {
  return input
    .toUpperCase()
    .trim()
    .replace(/\s+/g, '_')        // Replace spaces with underscores
    .replace(/\//g, '_')         // Replace slashes with underscores
    .replace(/[^\w]/g, '')       // Remove special characters except underscores (via \w)
    .replace(/_+/g, '_')         // Replace multiple underscores with single underscore
    .replace(/^_+|_+$/g, '');    // Remove leading/trailing underscores
};

/**
 * Validate skill code format
 */
export const isValidSkillCode = (code: string): boolean => {
  if (!code.trim()) return false;
  // Should be lowercase letters, numbers, and hyphens only
  return /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(code);
};

/**
 * Validate specialization type code format
 */
export const isValidSpecTypeCode = (code: string): boolean => {
  if (!code.trim()) return false;
  // Should be uppercase letters, numbers, and underscores
  return /^[A-Z0-9]([A-Z0-9_]*[A-Z0-9])?$/.test(code);
};

/**
 * Get format hint for skill code
 */
export const getSkillCodeHint = (value: string): string => {
  if (!value) return "Format: lowercase with hyphens (e.g., glass-aluminium-fitter)";
  const formatted = formatSkillCode(value);
  if (value === formatted) return "✓ Format is correct";
  return `Will be formatted as: ${formatted}`;
};

/**
 * Get format hint for specialization type code
 */
export const getSpecTypeCodeHint = (value: string): string => {
  if (!value) return "Format: uppercase with underscores (e.g., FUNDI_GLASS_ALUMINIUM_SPECS)";
  const formatted = formatSpecTypeCode(value);
  if (value === formatted) return "✓ Format is correct";
  return `Will be formatted as: ${formatted}`;
};

/**
 * Get validation error message if any
 */
export const getValidationError = (
  builderType: string,
  skillCode: string,
  specTypeCode: string
): string | null => {
  if (!builderType) return "Builder Type is required";
  if (!skillCode.trim()) return "Skill Code is required";
  if (!specTypeCode.trim()) return "Specialization Type Code is required";
  
  if (!isValidSkillCode(skillCode)) {
    return `Invalid Skill Code format. Use: ${formatSkillCode(skillCode)}`;
  }
  
  if (!isValidSpecTypeCode(specTypeCode)) {
    return `Invalid Spec Type Code format. Use: ${formatSpecTypeCode(specTypeCode)}`;
  }
  
  return null;
};
