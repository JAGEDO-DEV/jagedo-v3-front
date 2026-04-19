/* eslint-disable @typescript-eslint/no-explicit-any */
import { getAuthHeaders } from "@/utils/auth";

const serverUrl = import.meta.env.VITE_SERVER_URL;

const REPORTS_BASE = `${serverUrl}/api/reports`;

export const getCycleOneSummary = async (axiosInstance: any) => {
  const response = await axiosInstance.get(`${REPORTS_BASE}/cycle-one-summary/`, {
    headers: { Authorization: getAuthHeaders() },
  });
  return response.data;
};

export const getCycleOneActivity = async (axiosInstance: any) => {
  const response = await axiosInstance.get(`${REPORTS_BASE}/cycle-one-activity/`, {
    headers: { Authorization: getAuthHeaders() },
  });
  return response.data;
};

type LifecycleQuery = {
  start?: string;
  end?: string;
  compare?: boolean;
};

const toLifecycleParams = (query: LifecycleQuery = {}) => {
  const params: Record<string, string | number> = {};
  if (query.start) params.start = query.start;
  if (query.end) params.end = query.end;
  if (query.compare) params.compare = 1;
  return params;
};

export const getLifecycleReport = async (axiosInstance: any, query: LifecycleQuery = {}) => {
  const response = await axiosInstance.get(`${REPORTS_BASE}/lifecycle/`, {
    headers: { Authorization: getAuthHeaders() },
    params: toLifecycleParams(query),
  });
  return response.data;
};

export const getLifecycleAnalytics = async (axiosInstance: any, query: LifecycleQuery = {}) => {
  const response = await axiosInstance.get(`${REPORTS_BASE}/analytics/lifecycle/`, {
    headers: { Authorization: getAuthHeaders() },
    params: toLifecycleParams(query),
  });
  return response.data;
};

type WebAnalyticsQuery = {
  start?: string;
  end?: string;
  activeWindowMinutes?: number;
};

export const getWebAnalyticsSummary = async (axiosInstance: any, query: WebAnalyticsQuery = {}) => {
  const response = await axiosInstance.get(`${REPORTS_BASE}/web/summary/`, {
    headers: { Authorization: getAuthHeaders() },
    params: {
      ...(query.start ? { start: query.start } : {}),
      ...(query.end ? { end: query.end } : {}),
      ...(typeof query.activeWindowMinutes === "number" ? { activeWindowMinutes: query.activeWindowMinutes } : {}),
    },
  });
  return response.data;
};

export const postWebAnalyticsEvent = async (axiosInstance: any, payload: any) => {
  const response = await axiosInstance.post(`${REPORTS_BASE}/web/events/`, payload, {
    headers: { Authorization: getAuthHeaders() },
  });
  return response.data;
};

export const getLifecycleReportExportUrl = (query: LifecycleQuery = {}) => {
  const url = new URL(`${REPORTS_BASE}/lifecycle/export/`, window.location.origin);
  Object.entries(toLifecycleParams(query)).forEach(([key, value]) => {
    url.searchParams.set(key, String(value));
  });
  return url.toString();
};

export interface ReportFilters {
    startDate?: string | null;
    endDate?: string | null;
    compare?: boolean | string;
    page?: number;
    limit?: number;
    search?: string;
    status?: string | null;
    
    // Dynamic New Filters
    roleFilter?: string | null;
    lifecycleFilter?: string | null;
    sourceFilter?: string | null;
    locationFilter?: string | null;
    jobTypeFilter?: string | null;
    managedByFilter?: string | null;
    registerTypeFilter?: string | null;
    productTypeFilter?: string | null;
    accountTypeFilter?: string | null;
    [key: string]: any;
}

const buildQueryString = (filters: ReportFilters): string => {
    const params = new URLSearchParams();
    if (filters.startDate) params.append("startDate", filters.startDate);
    if (filters.endDate) params.append("endDate", filters.endDate);
    if (filters.compare !== undefined) params.append("compare", filters.compare.toString());
    if (filters.page) params.append("page", filters.page.toString());
    if (filters.limit) params.append("limit", filters.limit.toString());
    if (filters.search) params.append("search", filters.search);
    if (filters.status) params.append("status", filters.status);
    
    // Appending dynamic UI Filters
    if (filters.roleFilter) params.append("roleFilter", filters.roleFilter);
    if (filters.lifecycleFilter) params.append("lifecycleFilter", filters.lifecycleFilter);
    if (filters.sourceFilter) params.append("sourceFilter", filters.sourceFilter);
    if (filters.locationFilter) params.append("locationFilter", filters.locationFilter);
    if (filters.jobTypeFilter) params.append("jobTypeFilter", filters.jobTypeFilter);
    if (filters.managedByFilter) params.append("managedByFilter", filters.managedByFilter);
    if (filters.registerTypeFilter) params.append("registerTypeFilter", filters.registerTypeFilter);
    if (filters.productTypeFilter) params.append("productTypeFilter", filters.productTypeFilter);
    if (filters.accountTypeFilter) params.append("accountTypeFilter", filters.accountTypeFilter);
    
    const queryString = params.toString();
    return queryString ? `?${queryString}` : "";
};

export const getSystemReport = async (axiosInstance: any, filters: ReportFilters = {}): Promise<any> => {
    try {
        const url = `${serverUrl}/api/reports/system${buildQueryString(filters)}`;
        const response = await axiosInstance.get(url, { headers: { Authorization: getAuthHeaders() } });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "Failed to get system report");
    }
};

export const getProductsReport = async (axiosInstance: any, filters: ReportFilters = {}): Promise<any> => {
    try {
        const url = `${serverUrl}/api/reports/products${buildQueryString(filters)}`;
        const response = await axiosInstance.get(url, { headers: { Authorization: getAuthHeaders() } });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "Failed to get products report");
    }
};

export const getJobsReport = async (axiosInstance: any, filters: ReportFilters = {}): Promise<any> => {
    try {
        const url = `${serverUrl}/api/reports/jobs${buildQueryString(filters)}`;
        const response = await axiosInstance.get(url, { headers: { Authorization: getAuthHeaders() } });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "Failed to get jobs report");
    }
};

export const getOrdersReport = async (axiosInstance: any, filters: ReportFilters = {}): Promise<any> => {
    try {
        const url = `${serverUrl}/api/reports/orders${buildQueryString(filters)}`;
        const response = await axiosInstance.get(url, { headers: { Authorization: getAuthHeaders() } });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "Failed to get orders report");
    }
};

const reportsApi = {
    getSystemReport,
    getProductsReport,
    getJobsReport,
    getOrdersReport,
    getCycleOneSummary,
    getCycleOneActivity,
    getLifecycleReport,
    getLifecycleAnalytics,
    getWebAnalyticsSummary,
    postWebAnalyticsEvent,
    getLifecycleReportExportUrl
};

export default reportsApi;
