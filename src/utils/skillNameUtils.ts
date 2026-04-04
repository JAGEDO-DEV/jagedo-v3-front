/**
 * Normalize skill names to match the database key format
 * Converts spaces and slashes to hyphens, and lowercases
 * 
 * Examples:
 * "Glass/Aluminium Fitter" → "glass-aluminium-fitter"
 * "Glass Aluminium Fitter" → "glass-aluminium-fitter"
 * "Mason" → "mason"
 * "Interior Skimmer" → "interior-skimmer"
 */
export const normalizeSkillName = (skillName: string): string => {
  return skillName
    .toLowerCase()
    .replace(/\s+/g, '-')    // Replace spaces with hyphens
    .replace(/\//g, '-')     // Replace slashes with hyphens
    .replace(/-+/g, '-')     // Replace multiple hyphens with single hyphen
    .trim();
};

/**
 * Format a normalized skill code for display
 * Converts hyphens to spaces/slash format for UI
 */
export const formatSkillName = (skillCode: string): string => {
  return skillCode
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};
