import { getAuthHeaders } from "@/utils/auth";
import { BuilderType } from "@/types/builder";

const BASE_URL = `${import.meta.env.VITE_SERVER_URL}/api/builder-skills`;

interface CreateSkillDto {
  skillName: string;
  builderType: BuilderType;
  createdBy: string;
  specializations?: string[];
}

interface UpdateSkillDto {
  skillName: string;
  builderType: BuilderType;
  approvedBy?: string;
  specializations?: string[];
}

interface SpecializationMapping {
  id?: number;
  builderType: string;
  skillCode: string;
  specializationTypeCode: string;
  isActive?: boolean;
}

export const getAllBuilderSkills = async (axiosInstance: any, includeInactive = true) => {
  const response = await axiosInstance.get(BASE_URL, {
    headers: { Authorization: getAuthHeaders() },
    params: { includeInactive },
  });
  return response.data;
};

export const getBuilderSkillsByType = async (axiosInstance: any, builderType: BuilderType) => {
  const response = await axiosInstance.get(`${BASE_URL}/type/${builderType}`, {
    headers: { Authorization: getAuthHeaders() },
  });
  return response.data;
};

export const createBuilderSkill = async (axiosInstance: any, skillData: CreateSkillDto) => {
  const response = await axiosInstance.post(BASE_URL, skillData, {
    headers: { Authorization: getAuthHeaders() },
  });
  return response.data;
};

export const approveBuilderSkill = async (axiosInstance: any, id: number, approvedBy: string) => {
  const response = await axiosInstance.post(`${BASE_URL}/${id}/approve`, null, {
    headers: { Authorization: getAuthHeaders() },
    params: { approvedBy },
  });
  return response.data;
};

export const deleteBuilderSkill = async (axiosInstance: any, id: number) => {
  const response = await axiosInstance.delete(`${BASE_URL}/${id}`, {
    headers: { Authorization: getAuthHeaders() },
  });
  return response.data;
};

// Add to your existing builder-skills API file

export const updateBuilderSkill = async (axiosInstance: any, id: number, skillData: UpdateSkillDto) => {
  const response = await axiosInstance.put(`${BASE_URL}/${id}`, skillData, {
    headers: { Authorization: getAuthHeaders() },
  });
  return response.data;
};

export const getBuilderSkillFormOptions = async (axiosInstance: any) => {
  const response = await axiosInstance.get(`${BASE_URL}/form-options`, {
    headers: { Authorization: getAuthHeaders() },
  });
  return response.data;
};

/**
 * Get specialization type codes for a specific builder type
 * E.g. FUNDI → { mason: 'FUNDI_MASON_SPECS', electrician: 'FUNDI_ELECTRICIAN_SPECS', ... }
 */
export const getSpecializationMappings = async (axiosInstance: any, builderType: BuilderType) => {
  const response = await axiosInstance.get(`${BASE_URL}/specializations/${builderType}`, {
    headers: { Authorization: getAuthHeaders() },
  });
  return response.data;
};

/**
 * Get all specialization mappings for all builder types
 * Used to cache all specialization data upfront
 */
export const getAllSpecializationMappings = async (axiosInstance: any) => {
  const response = await axiosInstance.get(`${BASE_URL}/specializations`, {
    headers: { Authorization: getAuthHeaders() },
  });
  return response.data;
};

/**
 * Get complete builder skills hierarchy tree
 * Returns: BUILDER_TYPE → SKILLS → SPECIALIZATIONS
 * Used by admin dashboard (tree table) and onboarding
 */
export const getSkillsTree = async (axiosInstance: any) => {
  const response = await axiosInstance.get(`${BASE_URL}/tree`, {
    headers: { Authorization: getAuthHeaders() },
  });
  return response.data;
};

// Specialization Mappings Management
export const getAllMappings = async (axiosInstance: any) => {
  const response = await axiosInstance.get(`${BASE_URL}/mappings`, {
    headers: { Authorization: getAuthHeaders() },
  });
  return response.data;
};

export const createSpecializationMapping = async (
  axiosInstance: any,
  mapping: SpecializationMapping
) => {
  const response = await axiosInstance.post(`${BASE_URL}/mapping`, mapping, {
    headers: { Authorization: getAuthHeaders() },
  });
  return response.data;
};

export const updateSpecializationMapping = async (
  axiosInstance: any,
  id: number,
  mapping: Partial<SpecializationMapping>
) => {
  const response = await axiosInstance.put(`${BASE_URL}/mapping/${id}`, mapping, {
    headers: { Authorization: getAuthHeaders() },
  });
  return response.data;
};

export const deleteSpecializationMapping = async (axiosInstance: any, id: number) => {
  const response = await axiosInstance.delete(`${BASE_URL}/mapping/${id}`, {
    headers: { Authorization: getAuthHeaders() },
  });
  return response.data;
};

// ────────────────────────────────────────────────────────────────────────────
// Granular Specialization Management
// ────────────────────────────────────────────────────────────────────────────

/**
 * Add a single specialization to an existing skill
 */
export const addSpecializationToSkill = async (axiosInstance: any, skillId: number, specializationCode: string) => {
  const response = await axiosInstance.post(`${BASE_URL}/${skillId}/specialization`, { specializationCode }, {
    headers: { Authorization: getAuthHeaders() },
  });
  return response.data;
};

/**
 * Remove a single specialization from a skill
 */
export const removeSpecializationFromSkill = async (axiosInstance: any, skillId: number, specializationCode: string) => {
  const response = await axiosInstance.delete(`${BASE_URL}/${skillId}/specialization`, {
    headers: { Authorization: getAuthHeaders() },
    data: { specializationCode },
  });
  return response.data;
};

/**
 * Delete all skills for a specific builder type
 */
export const deleteSkillsByType = async (axiosInstance: any, builderType: BuilderType) => {
  const response = await axiosInstance.delete(`${BASE_URL}/type/${builderType}`, {
    headers: { Authorization: getAuthHeaders() },
  });
  return response.data;
};

/**
 * Delete a specific skill by builder type and skill name
 */
export const deleteSkillByTypeAndName = async (axiosInstance: any, builderType: BuilderType, skillName: string) => {
  const response = await axiosInstance.delete(`${BASE_URL}/${builderType}/${skillName}`, {
    headers: { Authorization: getAuthHeaders() },
  });
  return response.data;
};

// ────────────────────────────────────────────────────────────────────────────
// Skill Visibility Management (isActive Toggle)
// ────────────────────────────────────────────────────────────────────────────

/**
 * Toggle skill visibility on/off without deleting it
 */
export const toggleSkillActive = async (axiosInstance: any, id: number, isActive: boolean) => {
  const response = await axiosInstance.patch(`${BASE_URL}/${id}/toggle-active`, { isActive }, {
    headers: { Authorization: getAuthHeaders() },
  });
  return response.data;
};

/**
 * Deactivate (hide) a skill
 */
export const deactivateSkill = async (axiosInstance: any, id: number) => {
  const response = await axiosInstance.patch(`${BASE_URL}/${id}/deactivate`, {}, {
    headers: { Authorization: getAuthHeaders() },
  });
  return response.data;
};

/**
 * Activate (show) a skill
 */
export const activateSkill = async (axiosInstance: any, id: number) => {
  const response = await axiosInstance.patch(`${BASE_URL}/${id}/activate`, {}, {
    headers: { Authorization: getAuthHeaders() },
  });
  return response.data;
};