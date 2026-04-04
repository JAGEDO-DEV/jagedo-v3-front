import { useState, useEffect } from "react";
import axios from "axios";
import {
  getAllBuilderSkills,
  createBuilderSkill,
  approveBuilderSkill,
  deleteBuilderSkill,
  updateBuilderSkill,
  addSpecializationToSkill,
  removeSpecializationFromSkill,
  deleteSkillsByType,
  deleteSkillByTypeAndName,
} from "@/api/builderSkillsApi.api";
import { BuilderSkill, BuilderType } from "@/types/builder";
import { getAuthHeaders } from "@/utils/auth";

export function useBuilderSkills() {
  const [skills, setSkills] = useState<BuilderSkill[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const axiosInstance = axios.create({ headers: { Authorization: getAuthHeaders() } });

  useEffect(() => {
    fetchSkills();
  }, []);

  const fetchSkills = async () => {
    setLoading(true);
    try {
      const data = await getAllBuilderSkills(axiosInstance, true);
      setSkills(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addSkill = async (
    skillName: string,
    builderType: BuilderType,
    createdBy: string,
    specializations: string[] = [],
  ) => {
    try {
      const skill = await createBuilderSkill(axiosInstance, {
        skillName,
        builderType,
        createdBy,
        specializations,
      });
      setSkills((prev) => [...prev, skill]);
      setError(null);
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || "Failed to add skill";
      setError(message);
      throw err;
    }
  };

  const updateSkill = async (
    id: number,
    skillName: string,
    builderType: BuilderType,
    approvedBy?: string,
    specializations: string[] = [],
  ) => {
    try {
      if (approvedBy) {
        await approveBuilderSkill(axiosInstance, id, approvedBy);
      }
      if (specializations.length > 0 || skillName || builderType) {
        await updateBuilderSkill(axiosInstance, id, {
          skillName,
          builderType,
          approvedBy,
          specializations,
        });
      }
      setSkills((prev) =>
        prev.map((s) =>
          s.id === id
            ? {
                ...s,
                skillName,
                builderType,
                approvedBy: approvedBy || s.approvedBy,
                specializations,
              }
            : s
        )
      );
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || "Failed to update skill";
      setError(message);
      throw err;
    }
  };

  const deleteSkillFn = async (id: number) => {
    await deleteBuilderSkill(axiosInstance, id);
    setSkills((prev) => prev.filter((s) => s.id !== id));
  };

  const addSpecToSkill = async (skillId: number, specializationCode: string) => {
    try {
      const updated = await addSpecializationToSkill(axiosInstance, skillId, specializationCode);
      setSkills((prev) =>
        prev.map((s) => (s.id === skillId ? updated : s))
      );
      setError(null);
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || "Failed to add specialization";
      setError(message);
      throw err;
    }
  };

  const removeSpecFromSkill = async (skillId: number, specializationCode: string) => {
    try {
      const updated = await removeSpecializationFromSkill(axiosInstance, skillId, specializationCode);
      setSkills((prev) =>
        prev.map((s) => (s.id === skillId ? updated : s))
      );
      setError(null);
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || "Failed to remove specialization";
      setError(message);
      throw err;
    }
  };

  const deleteSkillsByTypeFn = async (builderType: BuilderType) => {
    try {
      await deleteSkillsByType(axiosInstance, builderType);
      setSkills((prev) => prev.filter((s) => s.builderType !== builderType));
      setError(null);
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || "Failed to delete skills";
      setError(message);
      throw err;
    }
  };

  const deleteSkillByTypeAndNameFn = async (builderType: BuilderType, skillName: string) => {
    try {
      await deleteSkillByTypeAndName(axiosInstance, builderType, skillName);
      setSkills((prev) =>
        prev.filter((s) => !(s.builderType === builderType && s.skillName === skillName))
      );
      setError(null);
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || "Failed to delete skill";
      setError(message);
      throw err;
    }
  };

  return {
    skills,
    loading,
    error,
    fetchSkills,
    addSkill,
    updateSkill,
    deleteSkill: deleteSkillFn,
    addSpecToSkill,
    removeSpecFromSkill,
    deleteSkillsByType: deleteSkillsByTypeFn,
    deleteSkillByTypeAndName: deleteSkillByTypeAndNameFn,
  };
}
