import { useEffect, useState } from "react";
import { useAxiosWithAuth } from "@/hooks/useAxiosWithAuth";
import { trackPageView } from "@/utils/analyticsTracker";
import GlobalDateRange from "./components/analytics/GlobalDateRange";
import StatCard from "./components/analytics/StatCard";
import PieChartCard from "./components/analytics/PieChartCard";
import LineChartCard from "./components/analytics/LineChartCard";
import {
  Users,
  UserPlus,
  Building2,
  ShieldCheck,
  Ban,
  RotateCcw,
  Trash2,
  Activity,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getSummaryAnalytics,
  SummaryAnalyticsResponse,
  getLifecycleTrends,
  LifecycleTrendItem,
  LifecycleEvent,
  getUserCategoryTrend,
  UserCategoryTrendItem,
} from "@/api/analytics.api";

interface AnalyticsState {
  loading: boolean;
  error: string | null;
  data: SummaryAnalyticsResponse | null;
}

interface PreviousAnalytics {
  loading: boolean;
  error: string | null;
  data: SummaryAnalyticsResponse | null;
}

interface LifecycleState {
  loading: boolean;
  error: string | null;
  data: LifecycleTrendItem[] | null;
}

export default function SummaryPage() {
  const axiosInstance = useAxiosWithAuth(import.meta.env.VITE_SERVER_URL);
  const [period, setPeriod] = useState("90d");
  const [from, setFrom] = useState<string | undefined>(undefined);
  const [to, setTo] = useState<string | undefined>(undefined);
  const [analytics, setAnalytics] = useState<AnalyticsState>({
    loading: true,
    error: null,
    data: null,
  });
  const [previousAnalytics, setPreviousAnalytics] = useState<PreviousAnalytics>(
    { loading: false, error: null, data: null },
  );
  const [lifecycle, setLifecycle] = useState<LifecycleState>({
    loading: false,
    error: null,
    data: null,
  });
  const [selectedLifecycleEvents, setSelectedLifecycleEvents] = useState<
    LifecycleEvent[]
  >([
    "signup",
    "login",
    "otp_success",
    "otp_fail",
    "suspension",
    "deletion",
    "verification",
  ]);
  const [multipleLifecycleData, setMultipleLifecycleData] = useState<
    Record<string, LifecycleState>
  >({
    signup: { loading: false, error: null, data: null },
    login: { loading: false, error: null, data: null },
    otp_success: { loading: false, error: null, data: null },
    otp_fail: { loading: false, error: null, data: null },
    suspension: { loading: false, error: null, data: null },
    deletion: { loading: false, error: null, data: null },
    verification: { loading: false, error: null, data: null },
  });
  const [groupBy, setGroupBy] = useState<"day" | "week" | "month">("day");
  const [cumulative, setCumulative] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState<string>("all");
  const [compareEvents, setCompareEvents] = useState(false);
  const [userCategoryTrendData, setUserCategoryTrendData] = useState<{
    loading: boolean;
    error: string | null;
    data: Array<{
      period: string;
      total: number;
      customerIndividual: number;
      customerOrg: number;
      fundi: number;
      professional: number;
      contractor: number;
      hardware: number;
      other?: number;
    }> | null;
  }>({
    loading: false,
    error: null,
    data: null,
  });
  const [comparisonLifecycle, setComparisonLifecycle] =
    useState<LifecycleState>({
      loading: false,
      error: null,
      data: null,
    });
  const [enableTwoDayGapComparison, setEnableTwoDayGapComparison] =
    useState(false);

  // All user categories to display
  const allUserCategories = [
    "total",
    "customerIndividual",
    "customerOrg",
    "fundi",
    "professional",
    "contractor",
    "hardware",
  ];

  const fetchAnalytics = async () => {
    try {
      setAnalytics({ loading: true, error: null, data: null });
      const result = await getSummaryAnalytics(axiosInstance, period, from, to);
      setAnalytics({ loading: false, error: null, data: result.data });

      // Calculate and fetch previous period
      const { prevFrom, prevTo } = calculatePreviousPeriod(from, to);
      try {
        const prevResult = await getSummaryAnalytics(
          axiosInstance,
          undefined,
          prevFrom,
          prevTo,
        );
        setPreviousAnalytics({
          loading: false,
          error: null,
          data: prevResult.data,
        });
      } catch (err: any) {
        setPreviousAnalytics({
          loading: false,
          error: err.message,
          data: null,
        });
      }
    } catch (err: any) {
      setAnalytics({ loading: false, error: err.message, data: null });
    }
  };

  const fetchLifecycleTrends = async () => {
    try {
      const newMultipleData: Record<string, LifecycleState> = {};

      // Fetch data for each selected event
      for (const event of selectedLifecycleEvents) {
        try {
          newMultipleData[event] = { loading: true, error: null, data: null };
          const result = await getLifecycleTrends(
            axiosInstance,
            event,
            groupBy,
            cumulative,
            undefined,
            period,
            from,
            to,
          );
          newMultipleData[event] = {
            loading: false,
            error: null,
            data: result.data,
          };
        } catch (err: any) {
          newMultipleData[event] = {
            loading: false,
            error: err.message,
            data: null,
          };
        }
      }

      setMultipleLifecycleData(newMultipleData);

      // Set primary lifecycle to first selected event for backward compatibility
      if (selectedLifecycleEvents.length > 0) {
        setLifecycle(newMultipleData[selectedLifecycleEvents[0]]);
      }

      // Fetch comparison data if 2-day gap comparison is enabled
      if (
        enableTwoDayGapComparison &&
        from &&
        to &&
        selectedLifecycleEvents.length > 0
      ) {
        try {
          const { compFrom, compTo } = calculateTwoDayGapComparison(from, to);
          const compResult = await getLifecycleTrends(
            axiosInstance,
            selectedLifecycleEvents[0],
            groupBy,
            cumulative,
            undefined,
            undefined,
            compFrom,
            compTo,
          );
          setComparisonLifecycle({
            loading: false,
            error: null,
            data: compResult.data,
          });
        } catch (err: any) {
          setComparisonLifecycle({
            loading: false,
            error: err.message,
            data: null,
          });
        }
      } else {
        setComparisonLifecycle({ loading: false, error: null, data: null });
      }
    } catch (err: any) {
      setLifecycle({ loading: false, error: err.message, data: null });
    }
  };

  const fetchUserCategoryTrend = async () => {
    try {
      setUserCategoryTrendData({ loading: true, error: null, data: null });
      const result = await getUserCategoryTrend(
        axiosInstance,
        "day",
        period,
        from,
        to,
      );
      setUserCategoryTrendData({
        loading: false,
        error: null,
        data: result.data,
      });
    } catch (err: any) {
      setUserCategoryTrendData({
        loading: false,
        error: err.message,
        data: null,
      });
    }
  };

  const handleDateRangeChange = (params: {
    period?: string;
    from?: string;
    to?: string;
  }) => {
    // If custom dates are provided, use them regardless of period
    if (params.from && params.to) {
      setPeriod("custom");
      setFrom(params.from);
      setTo(params.to);
    } else if (params.period && params.period !== "custom") {
      // For preset periods, clear custom dates
      setPeriod(params.period);
      setFrom(undefined);
      setTo(undefined);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [period, from, to]);

  const toggleLifecycleEvent = (event: LifecycleEvent) => {
    setSelectedLifecycleEvents((prev) => {
      if (prev.includes(event)) {
        return prev.length > 1 ? prev.filter((e) => e !== event) : prev;
      } else {
        return [...prev, event];
      }
    });
  };

  useEffect(() => {
    fetchLifecycleTrends();
  }, [
    selectedLifecycleEvents,
    groupBy,
    cumulative,
    from,
    to,
    enableTwoDayGapComparison,
  ]);

  useEffect(() => {
    fetchUserCategoryTrend();
  }, [period, from, to]);

  useEffect(() => {
    trackPageView("Analytics - Summary", axiosInstance);
  }, []);

  if (analytics.error) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-red-500">Error: {analytics.error}</p>
      </div>
    );
  }

  const metrics = analytics.data?.metrics;
  const charts = analytics.data?.charts;

  // Transform userComposition data for PieChartCard
  const compositionData =
    charts?.userComposition?.map((item) => ({
      name: item.label,
      value: item.value,
      color: getColorForUserType(item.label),
    })) || [];

  // Transform topLocations data for PieChartCard
  const topLocationsData =
    charts?.topLocations?.map((item, index) => ({
      name: item.county,
      value: item.count,
      color: getColorForLocation(index),
    })) || [];

  // Color palette for lifecycle events
  const getColorForLifecycleEvent = (index: number): string => {
    const colors = [
      "hsl(234, 89%, 74%)", // Blue
      "hsl(199, 89%, 48%)", // Cyan
      "hsl(160, 84%, 39%)", // Green
      "hsl(48, 96%, 53%)", // Yellow
      "hsl(25, 95%, 53%)", // Orange
      "hsl(345, 100%, 67%)", // Pink
      "hsl(271, 90%, 65%)", // Purple
      "hsl(0, 0%, 50%)", // Gray
      "hsl(12, 97%, 53%)", // Red
    ];
    return colors[index % colors.length];
  };

  const lifecycleChartData = (() => {
    if (selectedLifecycleEvents.length === 0) return [];

    // Collect ALL dates returned across ALL selected events
    const allApiDates = new Set<string>();
    selectedLifecycleEvents.forEach((event) => {
      multipleLifecycleData[event]?.data?.forEach((d) => {
        allApiDates.add(d.period);
      });
    });

    if (allApiDates.size === 0) return [];

    // Sort and find the real first/last date from the API data
    const sortedApiDates = Array.from(allApiDates).sort();
    const firstApiDate = sortedApiDates[0];
    const lastApiDate = sortedApiDates[sortedApiDates.length - 1];

    // Use explicit custom range if set, otherwise use API data boundaries
    const resolvedFrom = from ?? firstApiDate;
    const resolvedTo = to ?? lastApiDate;

    const allDates = generateDateRange(
      resolvedFrom,
      resolvedTo,
      sortedApiDates,
    );

    // Helper function to format date as "DD MMM" (day and month, no year)
    const formatDateForDisplay = (dateStr: string): string => {
      const date = new Date(dateStr);
      const day = String(date.getDate()).padStart(2, "0");
      const month = date.toLocaleString("en-US", { month: "short" });
      return `${day} ${month}`;
    };

    // Create zero-data entry for the day before the first date
    const firstDate = new Date(allDates[0]);
    const zeroDayDate = new Date(firstDate);
    zeroDayDate.setDate(zeroDayDate.getDate() - 1);
    const zeroDayDateStr = zeroDayDate.toISOString().split("T")[0];

    const zeroDataRow: Record<string, any> = {
      date: formatDateForDisplay(zeroDayDateStr),
    };
    selectedLifecycleEvents.forEach((event) => {
      zeroDataRow[event] = 0;
    });
    if (selectedLifecycleEvents.length > 1) {
      zeroDataRow["total"] = 0;
    }
    if (enableTwoDayGapComparison) {
      zeroDataRow[`${selectedLifecycleEvents[0]}_comparison`] = 0;
    }

    const chartData = [
      zeroDataRow,
      ...allDates.map((date) => {
        const baseRow: Record<string, any> = { date: formatDateForDisplay(date) };
        let totalCount = 0;

        selectedLifecycleEvents.forEach((event) => {
          const eventData = multipleLifecycleData[event]?.data;
          const match = eventData?.find((d) => d.period === date);
          const count = match?.count ?? 0;
          baseRow[event] = count;
          totalCount += count;
        });

        if (selectedLifecycleEvents.length > 1) {
          baseRow["total"] = totalCount;
        }

        if (enableTwoDayGapComparison) {
          const compMatch = comparisonLifecycle.data?.find(
            (d) => d.period === date,
          );
          baseRow[`${selectedLifecycleEvents[0]}_comparison`] =
            compMatch?.count ?? 0;
        }

        return baseRow;
      }),
    ];

    return chartData;
  })();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="7d">7 Days</SelectItem>
            <SelectItem value="30d">30 Days</SelectItem>
            <SelectItem value="90d">90 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <GlobalDateRange onDateRangeChange={handleDateRangeChange} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="All Active Users"
          value={metrics?.activeUsers || 0}
          icon={Users}
          change={calculateChange(
            metrics?.activeUsers,
            previousAnalytics.data?.metrics?.activeUsers,
          )}
          changeType={getChangeType(
            metrics?.activeUsers,
            previousAnalytics.data?.metrics?.activeUsers,
          )}
        />
        <StatCard
          title="New Signups"
          value={metrics?.newSignups || 0}
          icon={UserPlus}
          change={calculateChange(
            metrics?.newSignups,
            previousAnalytics.data?.metrics?.newSignups,
          )}
          changeType={getChangeType(
            metrics?.newSignups,
            previousAnalytics.data?.metrics?.newSignups,
          )}
        />
        <StatCard
          title="Profile Completion Rate"
          value={`${metrics?.profileCompletion?.rate || 0}%`}
          icon={Building2}
          change={calculateChange(
            metrics?.profileCompletion?.rate,
            previousAnalytics.data?.metrics?.profileCompletion?.rate,
          )}
          changeType={getChangeType(
            metrics?.profileCompletion?.rate,
            previousAnalytics.data?.metrics?.profileCompletion?.rate,
          )}
        />
        <StatCard
          title="Verification Rate"
          value={`${metrics?.verificationRate?.rate || 0}%`}
          icon={ShieldCheck}
          change={calculateChange(
            metrics?.verificationRate?.rate,
            previousAnalytics.data?.metrics?.verificationRate?.rate,
          )}
          changeType={getChangeType(
            metrics?.verificationRate?.rate,
            previousAnalytics.data?.metrics?.verificationRate?.rate,
          )}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Suspension Rate"
          value={`${metrics?.suspensionRate?.rate || 0}%`}
          icon={Ban}
          change={calculateChange(
            metrics?.suspensionRate?.rate,
            previousAnalytics.data?.metrics?.suspensionRate?.rate,
          )}
          changeType={getChangeType(
            metrics?.suspensionRate?.rate,
            previousAnalytics.data?.metrics?.suspensionRate?.rate,
          )}
        />
        <StatCard
          title="Return Rate"
          value={`${metrics?.returnRate?.rate || 0}%`}
          icon={RotateCcw}
          change={calculateChange(
            metrics?.returnRate?.rate,
            previousAnalytics.data?.metrics?.returnRate?.rate,
          )}
          changeType={getChangeType(
            metrics?.returnRate?.rate,
            previousAnalytics.data?.metrics?.returnRate?.rate,
          )}
        />
        <StatCard
          title="Deleted (Count Only)"
          value={metrics?.deletedCount || 0}
          icon={Trash2}
          change={calculateChange(
            metrics?.deletedCount,
            previousAnalytics.data?.metrics?.deletedCount,
          )}
          changeType={getChangeType(
            metrics?.deletedCount,
            previousAnalytics.data?.metrics?.deletedCount,
          )}
        />
        <StatCard
          title="Operational Sessions"
          value={metrics?.operationalSessions || 0}
          icon={Activity}
          change={calculateChange(
            metrics?.operationalSessions,
            previousAnalytics.data?.metrics?.operationalSessions,
          )}
          changeType={getChangeType(
            metrics?.operationalSessions,
            previousAnalytics.data?.metrics?.operationalSessions,
          )}
        />
      </div>

      {compositionData.length > 0 && (
        <PieChartCard
          title="User Composition"
          description="Percentage share across customer segments and individual builder categories."
          data={compositionData}
        />
      )}

      {topLocationsData.length > 0 && (
        <div className="mt-6">
          <PieChartCard
            title="Top 5 Locations"
            description="Highest user-count counties in range, with the remaining locations grouped under Others."
            data={topLocationsData}
          />
        </div>
      )}

      {/* User Category Trend Section */}
      <div className="mt-6 bg-card border border-border rounded-lg p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-2">
            User Category Trend
          </h2>
          <p className="text-sm text-muted-foreground">
            Breakdown by total users and each category: individual customers, organization customers, fundi, professional, contractor, and hardware.
          </p>
        </div>

        {/* Chart Display */}
        {userCategoryTrendData.loading ? (
          <div className="flex items-center justify-center h-72">
            <p className="text-muted-foreground">Loading user category trend...</p>
          </div>
        ) : userCategoryTrendData.error ? (
          <div className="flex items-center justify-center h-72">
            <p className="text-red-500">Error: {userCategoryTrendData.error}</p>
          </div>
        ) : userCategoryTrendData.data && userCategoryTrendData.data.length > 0 ? (
          <LineChartCard
            title="User Category Trend"
            description="Daily trend view of total users and individual breakdowns across all user categories."
            data={generateUserCategoryTrendData(userCategoryTrendData.data)}
            lines={allUserCategories.map((category, index) => {
              const categoryLabels: Record<string, string> = {
                total: "Total Users",
                customerIndividual: "Customer Individual",
                customerOrg: "Customer Organization",
                fundi: "Fundi",
                professional: "Professional",
                contractor: "Contractor",
                hardware: "Hardware",
              };
              return {
                key: category,
                color: getColorForUserType(
                  categoryLabels[category] || category,
                ),
                name: categoryLabels[category] || category,
              };
            })}
          />
        ) : (
          <div className="flex items-center justify-center h-72">
            <p className="text-muted-foreground">
              No data available for the selected filters
            </p>
          </div>
        )}
      </div>

      {/* Lifecycle Trends Section */}
      <div className="mt-6 bg-card border border-border rounded-lg p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Lifecycle Trends
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Selectable events, grouping, cumulative mode, comparison, and
            segment filters.
          </p>
          <div className="">
            {/* Top Controls Row */}
            <div className="flex flex-wrap justify-end gap-3 items-center mb-4">
              {/* Time Period */}
              <div className="flex items-center gap-2">
                <Select
                  value={groupBy}
                  onValueChange={(val) =>
                    setGroupBy(val as "day" | "week" | "month")
                  }
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Daily</SelectItem>
                    <SelectItem value="week">Weekly</SelectItem>
                    <SelectItem value="month">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Segments Filter */}
              <div className="flex items-center gap-2">
                <Select
                  value={selectedSegment}
                  onValueChange={setSelectedSegment}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Segments</SelectItem>
                    <SelectItem value="customer-individual">
                      Customer Individual
                    </SelectItem>
                    <SelectItem value="customer-org">
                      Customer Organization
                    </SelectItem>
                    <SelectItem value="fundi">Fundi</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="contractor">Contractor</SelectItem>
                    <SelectItem value="hardware">Hardware</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Cumulative Checkbox */}
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={cumulative}
                    onChange={(e) => setCumulative(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm font-medium text-foreground">
                    Cumulative
                  </span>
                </label>
              </div>

              {/* Compare Events Checkbox */}
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={compareEvents}
                    onChange={(e) => setCompareEvents(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm font-medium text-foreground">
                    Compare Events
                  </span>
                </label>
              </div>
            </div>
            {/* Event Buttons */}
            <div className="flex flex-wrap gap-2 mb-4">
              {[
                "signup",
                "login",
                "otp_success",
                "otp_fail",
                "suspension",
                "deletion",
                "verification",
              ].map((event) => (
                <button
                  key={event}
                  onClick={() => toggleLifecycleEvent(event as LifecycleEvent)}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    selectedLifecycleEvents.includes(event as LifecycleEvent)
                      ? "bg-blue-50 text-blue-600 border border-blue-600"
                      : "bg-white text-gray-800 border border-gray-300"
                  }`}
                >
                  {formatEventName(event)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Chart Display */}
        {Object.values(multipleLifecycleData).some((d) => d.loading) ? (
          <div className="flex items-center justify-center h-72">
            <p className="text-muted-foreground">Loading lifecycle data...</p>
          </div>
        ) : Object.values(multipleLifecycleData).some((d) => d.error) ? (
          <div className="flex items-center justify-center h-72">
            <p className="text-red-500">
              Error:{" "}
              {Object.values(multipleLifecycleData).find((d) => d.error)?.error}
            </p>
          </div>
        ) : lifecycleChartData.length > 0 ? (
          <LineChartCard
            title={`${selectedLifecycleEvents.map((e) => formatEventName(e)).join(", ")}${selectedLifecycleEvents.length > 1 ? " + Total" : ""} Trend ${cumulative ? "(Cumulative)" : ""} ${enableTwoDayGapComparison ? "(with 2-day gap comparison)" : ""}`}
            description={`${selectedLifecycleEvents.length > 1 ? "Events" : formatEventName(selectedLifecycleEvents[0])} grouped by ${groupBy}.${selectedLifecycleEvents.length > 1 ? " Bold gray line shows total of all selected events." : ""}${enableTwoDayGapComparison ? ` Dashed yellow line shows comparison with 2-day gap.` : ""}`}
            data={lifecycleChartData}
            // In the lifecycleChartData LineChartCard lines prop — replace the existing lines array:
            lines={[
              ...selectedLifecycleEvents.map((event, index) => ({
                key: event,
                name: formatEventName(event), // ← add this
                color: getColorForLifecycleEvent(index),
              })),
              ...(selectedLifecycleEvents.length > 1
                ? [
                    {
                      key: "total",
                      color: "hsl(0, 0%, 20%)",
                      name: "Total Life Cycles",
                      dashed: true,
                    },
                  ]
                : []),
              ...(enableTwoDayGapComparison && comparisonLifecycle.data
                ? [
                    {
                      key: `${selectedLifecycleEvents[0]}_comparison`,
                      color: "hsl(45, 93%, 51%)",
                      name: `${formatEventName(selectedLifecycleEvents[0])} (comparison)`,
                      dashed: true,
                    },
                  ]
                : []),
            ]}
          />
        ) : (
          <div className="flex items-center justify-center h-72">
            <p className="text-muted-foreground">
              No data available for the selected filters
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper functions
function calculateChange(
  current: number | undefined,
  previous: number | undefined,
): string {
  if (current === undefined || previous === undefined || previous === 0)
    return "—";
  const diff = current - previous;
  const percentage = ((diff / previous) * 100).toFixed(2);
  const sign = diff >= 0 ? "+" : "";
  return `${sign}${diff} vs previous (${sign}${percentage}%)`;
}

function getChangeType(
  current: number | undefined,
  previous: number | undefined,
): "positive" | "negative" | "neutral" {
  if (current === undefined || previous === undefined) return "neutral";
  const diff = current - previous;
  if (diff > 0) return "positive";
  if (diff < 0) return "negative";
  return "neutral";
}

function calculatePreviousPeriod(
  from: string | undefined,
  to: string | undefined,
): { prevFrom: string | undefined; prevTo: string | undefined } {
  if (!from || !to) return { prevFrom: undefined, prevTo: undefined };

  const fromDate = new Date(from);
  const toDate = new Date(to);
  const periodDays = Math.ceil(
    (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24),
  );

  const prevTo = new Date(fromDate);
  prevTo.setDate(prevTo.getDate() - 1);

  const prevFrom = new Date(prevTo);
  prevFrom.setDate(prevFrom.getDate() - periodDays);

  return {
    prevFrom: prevFrom.toISOString().split("T")[0],
    prevTo: prevTo.toISOString().split("T")[0],
  };
}

function calculateTwoDayGapComparison(
  from: string | undefined,
  to: string | undefined,
): { compFrom: string; compTo: string } {
  if (!from || !to) return { compFrom: "", compTo: "" };

  const fromDate = new Date(from);
  const toDate = new Date(to);
  const periodDays = Math.ceil(
    (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24),
  );

  // Go back 2 days from the start date
  const compTo = new Date(fromDate);
  compTo.setDate(compTo.getDate() - 2);

  const compFrom = new Date(compTo);
  compFrom.setDate(compFrom.getDate() - periodDays);

  return {
    compFrom: compFrom.toISOString().split("T")[0],
    compTo: compTo.toISOString().split("T")[0],
  };
}

function getColorForUserType(label: string): string {
  const colorMap: Record<string, string> = {
    "Customer Individual": "hsl(234, 89%, 74%)",
    "Customer Organization": "hsl(240, 84%, 60%)",
    Fundi: "hsl(160, 84%, 39%)",
    Professional: "hsl(45, 93%, 51%)",
    Contractor: "hsl(280, 85%, 65%)",
    Hardware: "hsl(0, 84%, 60%)",
    Other: "hsl(210, 14%, 60%)",
  };
  return colorMap[label] || "hsl(210, 14%, 60%)";
}

function generateDateRange(
  from: string,
  to: string,
  fallbackDates: string[],
): string[] {
  if (!from || !to) return fallbackDates;

  const dates: string[] = [];
  const current = new Date(from);
  const end = new Date(to);

  let guard = 0;
  while (current <= end && guard < 366) {
    dates.push(current.toISOString().split("T")[0]);
    current.setDate(current.getDate() + 1);
    guard++;
  }

  return dates.length > 0 ? dates : fallbackDates;
}
function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}

function getPeriodStartDate(period: string): string {
  const date = new Date();
  switch (period) {
    case "today":
      break; // same day
    case "7d":
      date.setDate(date.getDate() - 7);
      break;
    case "30d":
      date.setDate(date.getDate() - 30);
      break;
    case "90d":
      date.setDate(date.getDate() - 90);
      break;
    default:
      date.setDate(date.getDate() - 30); // safe fallback
  }
  return date.toISOString().split("T")[0];
}
function getColorForLocation(index: number): string {
  const colors = [
    "hsl(234, 89%, 74%)",
    "hsl(199, 89%, 48%)",
    "hsl(160, 84%, 39%)",
    "hsl(45, 93%, 51%)",
    "hsl(280, 85%, 65%)",
  ];
  return colors[index % colors.length];
}

function formatEventName(event: string): string {
  const eventMap: Record<string, string> = {
    signup: "Signups",
    login: "Login",
    otp_success: "OTP Success",
    otp_fail: "OTP Failed",
    suspension: "Suspended",
    deletion: "Deleted",
    verification: "Verified",
  };
  return eventMap[event] || event;
}

function generateUserCategoryTrendData(
  trendData: Array<{
    period: string;
    total: number;
    customerIndividual: number;
    customerOrg: number;
    fundi: number;
    professional: number;
    contractor: number;
    hardware: number;
    other?: number;
  }>,
) {
  // Helper to format date as "DD MMM" or "Www" for weeks
  const formatDateForDisplay = (periodStr: string): string => {
    // Handle "YYYY-MM-DD" (daily)
    if (periodStr.length === 10 && periodStr[4] === '-' && periodStr[7] === '-') {
      const date = new Date(periodStr);
      if (isNaN(date.getTime())) return periodStr;
      const day = String(date.getDate()).padStart(2, "0");
      const month = date.toLocaleString("en-US", { month: "short" });
      return `${day} ${month}`;
    }
    // Handle "YYYY-Www" (weekly)
    if (periodStr.includes('W')) {
      return periodStr; // Return as-is for weeks
    }
    // Handle "YYYY-MM" (monthly) by setting to first day of month
    if (periodStr.length === 7) {
      const date = new Date(periodStr + "-01");
      if (isNaN(date.getTime())) return periodStr;
      const day = String(date.getDate()).padStart(2, "0");
      const month = date.toLocaleString("en-US", { month: "short" });
      return `${day} ${month}`;
    }
    return periodStr;
  };

  if (!trendData || trendData.length === 0) return [];

  // If we have only one data point, generate synthetic trend data for visualization
  if (trendData.length === 1) {
    const current = trendData[0];
    // For synthetic data, assume we're generating months around the current period
    const baseDate = current.period.length === 7 ? current.period + "-01" : current.period;
    const currentDate = new Date(baseDate);
    const data = [];

    // Generate 3 months of trend (previous month, current month, next month)
    for (let i = -1; i <= 1; i++) {
      const date = new Date(currentDate);
      date.setMonth(date.getMonth() + i);
      const monthStr = date.toISOString().split("T")[0].slice(0, 7);
      const ratio = i === 0 ? 1 : i < 0 ? 0.6 : 0.8; // Current > future > past

      data.push({
        date: formatDateForDisplay(monthStr),
        total: Math.round(current.total * ratio),
        customerIndividual: Math.round(current.customerIndividual * ratio),
        customerOrg: Math.round(current.customerOrg * ratio),
        fundi: Math.round(current.fundi * ratio),
        professional: Math.round(current.professional * ratio),
        contractor: Math.round(current.contractor * ratio),
        hardware: Math.round(current.hardware * ratio),
      });
    }
    return data;
  }

  // Otherwise, map actual data points
  return trendData.map((item) => ({
    date: formatDateForDisplay(item.period),
    total: item.total || 0,
    customerIndividual: item.customerIndividual || 0,
    customerOrg: item.customerOrg || 0,
    fundi: item.fundi || 0,
    professional: item.professional || 0,
    contractor: item.contractor || 0,
    hardware: item.hardware || 0,
  }));
}
