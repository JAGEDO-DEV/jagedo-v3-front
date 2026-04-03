import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { getAuthHeaders } from '@/utils/auth';

interface MasterDataValue {
  id: number;
  code: string | null;
  name: string;
  sortOrder: number;
  isActive: boolean;
}

const BASE_URL = `${import.meta.env.VITE_SERVER_URL}/api/master-data`;

const cache: Record<string, MasterDataValue[]> = {};

export function useMasterData(typeCode: string) {
  const [data, setData]       = useState<MasterDataValue[]>(() => cache[typeCode] ?? []);
  const [loading, setLoading] = useState<boolean>(() => !cache[typeCode]);
  const [error, setError]     = useState<string | null>(null);

  const axiosInstance = axios.create({
    headers: { Authorization: getAuthHeaders() },
  });

  const fetchData = useCallback(
    async (bustCache = false) => {
      if (!typeCode) return;

      if (!bustCache && cache[typeCode]) {
        setData(cache[typeCode]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const res = await axiosInstance.get<MasterDataValue[]>(
          `${BASE_URL}/values/${typeCode}`,
        );
        const values = res.data ?? [];
        cache[typeCode] = values;
        setData(values);
      } catch (err: any) {
        const message = err?.response?.data?.message ?? `Failed to load ${typeCode}`;
        setError(message);
        setData([]);
      } finally {
        setLoading(false);
      }
    },
    [typeCode],
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refresh = useCallback(() => {
    delete cache[typeCode];
    fetchData(true);
  }, [typeCode, fetchData]);

  return { data, loading, error, refresh };
}