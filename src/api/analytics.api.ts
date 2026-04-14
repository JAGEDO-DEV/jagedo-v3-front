/* eslint-disable @typescript-eslint/no-explicit-any */
import { getAuthHeaders } from "@/utils/auth";

const API_BASE_URL = `${import.meta.env.VITE_SERVER_URL}/api/dashboard/analytics`;

// ============================================================================
// RESPONSE TYPES & INTERFACES
// ============================================================================

export interface DateRange {
  from: string;
  to: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// CUSTOMER ANALYTICS
export interface CustomerMetrics {
  totalCustomers: number;
  typeDistribution: {
    total: number;
    individual: { count: number; percentage: number };
    organization: { count: number; percentage: number };
  };
  signupSegmentStats: {
    totalSignups: number;
    leader: "individual" | "organization";
    segments: {
      individual: { count: number; percentage: number };
      organization: { count: number; percentage: number };
    };
  };
  signupStats: {
    totalSignups: number;
    averagePerDay: number;
    activeDays: number;
    daysInRange: number;
    activeDayPercentage: number;
  };
  highestLowest: {
    highest: number;
    lowest: number;
    firstPeriod: number;
    secondPeriod: number;
  };
}

export interface SignupTrendItem {
  period: string;
  date: string;
  count: number;
}

export interface SegmentPerformanceItem {
  period: string;
  total: number;
  individual: number;
  organization: number;
  individualPct: number;
  organizationPct: number;
}

export interface ActivityStatsItem {
  count: number;
  percentage: number;
}

export interface ActivityStats {
  totalCustomers: number;
  activities: {
    draftRequests: ActivityStatsItem;
    requests: ActivityStatsItem;
    activeJobs: ActivityStatsItem;
    completedJobs: ActivityStatsItem;
    reviewed: ActivityStatsItem;
  };
}

export interface CustomerChart {
  signupTrend: SignupTrendItem[];
  segmentPerformance: SegmentPerformanceItem[];
  activityStats: ActivityStats;
}

export interface CustomerAnalytics {
  period: string;
  dateRange: DateRange;
  metrics: CustomerMetrics;
  charts: CustomerChart;
}

// BUILDER ANALYTICS
export interface BuilderMetrics {
  totalBuilders: number;
  builderTypeDistribution: {
    fundi: { count: number; percentage: number };
    contractor: { count: number; percentage: number };
    professional: { count: number; percentage: number };
    hardware: { count: number; percentage: number };
  };
  signupSegmentStats: {
    totalSignups: number;
    leader: "fundi" | "contractor" | "professional" | "hardware";
    segments: {
      fundi: { count: number; percentage: number };
      contractor: { count: number; percentage: number };
      professional: { count: number; percentage: number };
      hardware: { count: number; percentage: number };
    };
  };
  signupStats: {
    totalSignups: number;
    averagePerDay: number;
    activeDays: number;
    daysInRange: number;
    activeDayPercentage: number;
  };
  highestLowest: {
    highest: number;
    lowest: number;
    firstPeriod: number;
    secondPeriod: number;
  };
}

export interface BuilderActivityStatsItem {
  count: number;
  percentage: number;
}

export interface BuilderActivityStats {
  totalBuilders: number;
  activities: {
    activeJobs: BuilderActivityStatsItem;
    completedJobs: BuilderActivityStatsItem;
    bids: BuilderActivityStatsItem;
    reviewed: BuilderActivityStatsItem;
    rated: BuilderActivityStatsItem;
  };
}

export interface BuilderSignupTrendItem {
  period: string;
  date: string;
  count: number;
}

export interface BuilderSegmentPerformanceItem {
  period: string;
  total: number;
  fundi: number;
  contractor: number;
  professional: number;
  hardware: number;
  fundiPct: number;
  contractorPct: number;
  professionalPct: number;
  hardwarePct: number;
}

export interface BuilderChart {
  signupTrend: BuilderSignupTrendItem[];
  segmentPerformance: BuilderSegmentPerformanceItem[];
  activityStats: BuilderActivityStats;
}

export interface BuilderAnalytics {
  period: string;
  dateRange: DateRange;
  metrics: BuilderMetrics;
  charts: BuilderChart;
}

// REQUEST ANALYTICS
export interface RequestMetrics {
  totalRequests: {
    total: number;
    jobRequests: number;
    orders: number;
  };
  managementDistribution: {
    total: number;
    jobs: { count: number; percentage: number };
    orders: { count: number; percentage: number };
  };
  jobsVsOrders: {
    jobs: number;
    orders: number;
    total: number;
  };
  statusBreakdown: {
    total: number;
    statuses: {
      draft: { count: number; percentage: number };
      new: { count: number; percentage: number };
      quotation: { count: number; percentage: number };
      active: { count: number; percentage: number };
      completed: { count: number; percentage: number };
      reviewed: { count: number; percentage: number };
    };
  };
}

export interface RequestChart {
  statusTrend: Array<{ period: string; total: number; statuses: any }>;
  typeTrend: Array<{ period: string; jobs: number; orders: number }>;
}

export interface RequestAnalytics {
  period: string;
  dateRange: DateRange;
  metrics: RequestMetrics;
  charts: RequestChart;
}

// WEB ANALYTICS
export interface WebMetrics {
  totalVisitors: number;
  activeUsers: number;
  conversionRate: number;
  bounceRate: number;
}

export interface WebChart {
  topCountries: Array<{ country: string; count: number; percentage: number }>;
  deviceUsage: { total: number; devices: Record<string, { count: number; percentage: number }> };
  trafficSources: { total: number; sources: Array<{ name: string; count: number; percentage: number }> };
  specificDevices: { total: number; devices: Array<{ name: string; count: number; percentage: number }> };
  visitorTrend: Array<{ date: string; visitors: number; sessions: number }>;
}

export interface WebAnalytics {
  period: string;
  dateRange: DateRange;
  metrics: WebMetrics;
  charts: WebChart;
}

// PRODUCTS ANALYTICS
export interface ProductMetrics {
  totalProducts: number;
  hardware: number;
  customProducts: number;
  machinery: number;
  designs: number;
  approved: number;
  pendingApproval: number;
  pricingCoverage: number;
  averagePricePoint: number;
}

export interface ProductChart {
  categoryDistribution: Array<{ name: string; count: number; percentage: number }>;
  productProgression: Array<{ date: string; productCount: number }>;
  topRegionsByAvailability: Array<{ region: string; count: number; percentage: number }>;
}

export interface ProductAnalytics {
  period: string;
  dateRange: DateRange;
  metrics: ProductMetrics;
  charts: ProductChart;
}

// ============================================================================
// CUSTOMER ANALYTICS API
// ============================================================================

export const getCustomerAnalytics = async (
  axiosInstance: any,
  period: string = "today",
  from?: string,
  to?: string
): Promise<ApiResponse<CustomerAnalytics>> => {
  try {
    const params = new URLSearchParams();
    params.append("period", period);
    if (from) params.append("from", from);
    if (to) params.append("to", to);

    const response = await axiosInstance.get(`${API_BASE_URL}/customers?${params.toString()}`, {
      headers: {
        Authorization: getAuthHeaders(),
      },
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to fetch customer analytics");
  }
};

// ============================================================================
// BUILDER ANALYTICS API
// ============================================================================

export const getBuilderAnalytics = async (
  axiosInstance: any,
  period: string = "today",
  from?: string,
  to?: string
): Promise<ApiResponse<BuilderAnalytics>> => {
  try {
    const params = new URLSearchParams();
    params.append("period", period);
    if (from) params.append("from", from);
    if (to) params.append("to", to);

    const response = await axiosInstance.get(`${API_BASE_URL}/builders?${params.toString()}`, {
      headers: {
        Authorization: getAuthHeaders(),
      },
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to fetch builder analytics");
  }
};

// ============================================================================
// REQUEST ANALYTICS API
// ============================================================================

export const getRequestAnalytics = async (
  axiosInstance: any,
  period: string = "today",
  from?: string,
  to?: string
): Promise<ApiResponse<RequestAnalytics>> => {
  try {
    const params = new URLSearchParams();
    params.append("period", period);
    if (from) params.append("from", from);
    if (to) params.append("to", to);

    const response = await axiosInstance.get(`${API_BASE_URL}/requests?${params.toString()}`, {
      headers: {
        Authorization: getAuthHeaders(),
      },
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to fetch request analytics");
  }
};

// ============================================================================
// WEB ANALYTICS API
// ============================================================================

export const getWebAnalytics = async (
  axiosInstance: any,
  period: string = "today",
  from?: string,
  to?: string
): Promise<ApiResponse<WebAnalytics>> => {
  try {
    const params = new URLSearchParams();
    params.append("period", period);
    if (from) params.append("from", from);
    if (to) params.append("to", to);

    const response = await axiosInstance.get(`${API_BASE_URL}/web?${params.toString()}`, {
      headers: {
        Authorization: getAuthHeaders(),
      },
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to fetch web analytics");
  }
};

// ============================================================================
// PRODUCTS ANALYTICS API
// ============================================================================

export const getProductsAnalytics = async (
  axiosInstance: any,
  period: string = "today",
  from?: string,
  to?: string
): Promise<ApiResponse<ProductAnalytics>> => {
  try {
    const params = new URLSearchParams();
    params.append("period", period);
    if (from) params.append("from", from);
    if (to) params.append("to", to);

    const response = await axiosInstance.get(`${API_BASE_URL}/products?${params.toString()}`, {
      headers: {
        Authorization: getAuthHeaders(),
      },
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to fetch products analytics");
  }
};

// ============================================================================
// SUMMARY ANALYTICS (Single endpoint)
// ============================================================================

export interface SummaryMetrics {
  activeUsers: number;
  newSignups: number;
  profileCompletion: { total: number; complete: number; rate: number };
  verificationRate: { total: number; verified: number; rate: number };
  suspensionRate: { total: number; suspended: number; rate: number };
  returnRate: { returningCount: number; totalActive: number; rate: number };
  deletedCount: number;
  operationalSessions: number;
}

export interface UserCompositionItem {
  label: string;
  value: number;
}

export interface UserCategoryTrendItem {
  month: string;
  total: number;
  customerIndividual: number;
  customerOrg: number;
  fundi: number;
  professional: number;
  contractor: number;
  hardware: number;
  other: number;
}

export interface TopLocationItem {
  county: string;
  count: number;
}

export interface SummaryCharts {
  userComposition: UserCompositionItem[];
  userCategoryTrend: UserCategoryTrendItem[];
  topLocations: TopLocationItem[];
}

export interface SummaryAnalyticsResponse {
  metrics: SummaryMetrics;
  charts: SummaryCharts;
}

export interface LifecycleTrendItem {
  period: string;
  count: number;
}

export type LifecycleEvent = "signup" | "login" | "otp_success" | "otp_fail" | "suspension" | "deletion" | "verification";
export type GroupBy = "day" | "week" | "month";

export const getSummaryAnalytics = async (
  axiosInstance: any,
  period?: string,
  from?: string,
  to?: string
): Promise<ApiResponse<SummaryAnalyticsResponse>> => {
  try {
    const params = new URLSearchParams();
    if (period) params.append("period", period);
    if (from) params.append("from", from);
    if (to) params.append("to", to);

    const response = await axiosInstance.get(
      `${import.meta.env.VITE_SERVER_URL}/api/dashboard/summary${params.toString() ? "?" + params.toString() : ""}`,
      {
        headers: {
          Authorization: getAuthHeaders(),
        },
      }
    );
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to fetch summary analytics");
  }
};

// ============================================================================
// LIFECYCLE TRENDS API
// ============================================================================

export const getLifecycleTrends = async (
  axiosInstance: any,
  event: LifecycleEvent = "signup",
  groupBy: GroupBy = "month",
  cumulative: boolean = false,
  segment?: string,
  period?: string,
  from?: string,
  to?: string
): Promise<ApiResponse<LifecycleTrendItem[]>> => {
  try {
    const params = new URLSearchParams();
    params.append("event", event);
    params.append("groupBy", groupBy);
    params.append("cumulative", String(cumulative));
    if (segment) params.append("segment", segment);
    if (period) params.append("period", period);
    if (from) params.append("from", from);
    if (to) params.append("to", to);

    const response = await axiosInstance.get(
      `${import.meta.env.VITE_SERVER_URL}/api/dashboard/summary/lifecycle?${params.toString()}`,
      {
        headers: {
          Authorization: getAuthHeaders(),
        },
      }
    );
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to fetch lifecycle trends");
  }
};

// ============================================================================
// BATCH ANALYTICS (All at once)
// ============================================================================

export const getAllAnalytics = async (
  axiosInstance: any,
  period: string = "today",
  from?: string,
  to?: string
): Promise<{
  customers: ApiResponse<CustomerAnalytics>;
  builders: ApiResponse<BuilderAnalytics>;
  requests: ApiResponse<RequestAnalytics>;
  web: ApiResponse<WebAnalytics>;
  products: ApiResponse<ProductAnalytics>;
}> => {
  try {
    const [customers, builders, requests, web, products] = await Promise.all([
      getCustomerAnalytics(axiosInstance, period, from, to),
      getBuilderAnalytics(axiosInstance, period, from, to),
      getRequestAnalytics(axiosInstance, period, from, to),
      getWebAnalytics(axiosInstance, period, from, to),
      getProductsAnalytics(axiosInstance, period, from, to),
    ]);

    return { customers, builders, requests, web, products };
  } catch (error: any) {
    throw new Error(error.message || "Failed to fetch all analytics");
  }
};

// ============================================================================
// PRODUCT VIEW TRACKING
// ============================================================================

export const logProductView = async (
  axiosInstance: any,
  productId: number,
  productName?: string
): Promise<void> => {
  try {
    await axiosInstance.post(
      `${import.meta.env.VITE_SERVER_URL}/api/analytics/event`,
      {
        action: "product_view",
        data: {
          productId,
          productName,
          timestamp: new Date().toISOString(),
        },
      },
      {
        timeout: 5000,
      }
    );
  } catch (err) {
    console.warn('[Analytics] Failed to log product view:', err);
    // Don't throw - analytics failures shouldn't break the app
  }
};
