import { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { getAuthHeaders } from '@/utils/auth';
import { getSpecializationMappings, getAllSpecializationMappings } from '@/api/builderSkillsApi.api';
import { BuilderType } from '@/types/builder';

/**
 * Combined cache for all specialization mappings
 * Maps builder type → skill → specialization type code
 */
const specializationCache: Record<string, Record<string, string>> = {};

interface UseSpecializationMappingsOptions {
  /** Optional: Only fetch mappings for specific builder type on mount */
  builderType?: BuilderType;
  /** Optional: Preload all mappings on mount */
  preloadAll?: boolean;
}

export function useSpecializationMappings(options: UseSpecializationMappingsOptions = {}) {
  const { builderType, preloadAll = false } = options;
  
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const axiosInstance = axios.create({
    headers: { Authorization: getAuthHeaders() },
  });

  /**
   * Get specialization code for a specific skill
   * E.g. builderType='FUNDI', skillName='mason' → 'FUNDI_MASON_SPECS'
   * Does case-insensitive lookup
   */
  const getSpecializationCode = useCallback(
    (skillName: string): string | null => {
      // Try exact match first
      if (mappings[skillName]) return mappings[skillName];
      
      // Try lowercase match (case-insensitive)
      const lowerSkillName = skillName.toLowerCase();
      for (const [key, value] of Object.entries(mappings)) {
        if (key.toLowerCase() === lowerSkillName) {
          return value;
        }
      }
      
      return null;
    },
    [mappings]
  );

  /**
   * Get all specializations for a skill (fetch and cache)
   */
  const fetchMappingsForType = useCallback(
    async (type: BuilderType, bustCache = false) => {
      if (!bustCache && specializationCache[type]) {
        setMappings(specializationCache[type]);
        setLoading(false);
        return specializationCache[type];
      }

      setLoading(true);
      setError(null);

      try {
        const data = await getSpecializationMappings(axiosInstance, type);
        specializationCache[type] = data;
        setMappings(data);
        return data;
      } catch (err: any) {
        const message =
          err?.response?.data?.message ??
          `Failed to load specialization mappings for ${type}`;
        setError(message);
        setMappings({});
        return {};
      } finally {
        setLoading(false);
      }
    },
    [axiosInstance]
  );

  /**
   * Preload all specialization mappings
   */
  const preloadAllMappings = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const allMappings = await getAllSpecializationMappings(axiosInstance);
      // Cache each builder type's mappings
      Object.entries(allMappings).forEach(([type, typeMapping]) => {
        specializationCache[type] = typeMapping as Record<string, string>;
      });
      // Set current builder type's mappings if specified
      if (builderType && allMappings[builderType]) {
        setMappings(allMappings[builderType]);
      }
      return allMappings;
    } catch (err: any) {
      const message = err?.response?.data?.message ?? 'Failed to load specialization mappings';
      setError(message);
      return {};
    } finally {
      setLoading(false);
    }
  }, [builderType, axiosInstance]);

  /**
   * Refresh mappings for a specific builder type
   */
  const refreshMappings = useCallback(
    (type?: BuilderType) => {
      const typeToRefresh = type || builderType;
      if (typeToRefresh) {
        return fetchMappingsForType(typeToRefresh, true);
      }
    },
    [builderType, fetchMappingsForType]
  );

  // Load mappings on mount
  useEffect(() => {
    if (preloadAll) {
      preloadAllMappings();
    } else if (builderType) {
      fetchMappingsForType(builderType);
    }
  }, [builderType, preloadAll, fetchMappingsForType, preloadAllMappings]);

  return {
    mappings,
    loading,
    error,
    getSpecializationCode,
    fetchMappingsForType,
    preloadAllMappings,
    refreshMappings,
  };
}
