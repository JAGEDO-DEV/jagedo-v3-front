import { useEffect, useState } from "react";
import { useAxiosWithAuth } from "@/hooks/useAxiosWithAuth";
import { trackPageView } from "@/utils/analyticsTracker";
import GlobalDateRange from "./components/analytics/GlobalDateRange";
import StatCard from "./components/analytics/StatCard";
import PieChartCard from "./components/analytics/PieChartCard";
import LineChartCard from "./components/analytics/LineChartCard";
import { Users, UserPlus, Building2, ShieldCheck, Ban, RotateCcw, Trash2, Activity } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getSummaryAnalytics, SummaryAnalyticsResponse, getLifecycleTrends, LifecycleTrendItem, LifecycleEvent } from "@/api/analytics.api";

interface AnalyticsState {
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
  const [period, setPeriod] = useState("7d");
  const [from, setFrom] = useState<string | undefined>(undefined);
  const [to, setTo] = useState<string | undefined>(undefined);
  const [analytics, setAnalytics] = useState<AnalyticsState>({ loading: true, error: null, data: null });
  const [lifecycle, setLifecycle] = useState<LifecycleState>({ loading: false, error: null, data: null });
  const [lifecycleEvent, setLifecycleEvent] = useState<LifecycleEvent>("signup");
  const [groupBy, setGroupBy] = useState<"day" | "week" | "month">("day");
  const [cumulative, setCumulative] = useState(false);

  const fetchAnalytics = async () => {
    try {
      setAnalytics({ loading: true, error: null, data: null });
      const result = await getSummaryAnalytics(axiosInstance, from, to);
      setAnalytics({ loading: false, error: null, data: result.data });
    } catch (err: any) {
      setAnalytics({ loading: false, error: err.message, data: null });
    }
  };

  const fetchLifecycleTrends = async () => {
    try {
      setLifecycle({ loading: true, error: null, data: null });
      const result = await getLifecycleTrends(
        axiosInstance,
        lifecycleEvent,
        groupBy,
        cumulative,
        undefined,
        from,
        to
      );
      setLifecycle({ loading: false, error: null, data: result.data });
    } catch (err: any) {
      setLifecycle({ loading: false, error: err.message, data: null });
    }
  };

  const handleDateRangeChange = (params: {
    period?: string;
    from?: string;
    to?: string;
  }) => {
    if (params.period) {
      setPeriod(params.period);
      setFrom(undefined);
      setTo(undefined);
    } else if (params.from && params.to) {
      setFrom(params.from);
      setTo(params.to);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [period, from, to]);

  useEffect(() => {
    fetchLifecycleTrends();
  }, [lifecycleEvent, groupBy, cumulative, from, to]);

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
  const compositionData = charts?.userComposition?.map((item) => ({
    name: item.label,
    value: item.value,
    color: getColorForUserType(item.label),
  })) || [];

  // Transform topLocations data for PieChartCard
  const topLocationsData = charts?.topLocations?.map((item, index) => ({
    name: item.county,
    value: item.count,
    color: getColorForLocation(index),
  })) || [];

  // Transform lifecycle data for chart
  const lifecycleChartData = lifecycle.data?.map((item) => ({
    date: item.period,
    count: item.count,
  })) || [];

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
          change="-21 vs previous (-100%)" 
          changeType="negative" 
        />
        <StatCard 
          title="New Signups" 
          value={metrics?.newSignups || 0} 
          icon={UserPlus} 
          change="-3 vs previous (-60%)" 
          changeType="negative" 
        />
        <StatCard 
          title="Profile Completion Rate" 
          value={`${metrics?.profileCompletion?.rate || 0}%`} 
          icon={Building2} 
          change="-2 vs previous (-100%)" 
          changeType="negative" 
        />
        <StatCard 
          title="Verification Rate" 
          value={`${metrics?.verificationRate?.rate || 0}%`} 
          icon={ShieldCheck} 
          change="-21 vs previous (-100%)" 
          changeType="negative" 
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard 
          title="Suspension Rate" 
          value={`${metrics?.suspensionRate?.rate || 0}%`} 
          icon={Ban} 
          change="-2 vs previous (-100%)" 
          changeType="negative" 
        />
        <StatCard 
          title="Return Rate" 
          value={`${metrics?.returnRate?.rate || 0}%`} 
          icon={RotateCcw} 
          change="-2 vs previous (-100%)" 
          changeType="negative" 
        />
        <StatCard 
          title="Deleted (Count Only)" 
          value={metrics?.deletedCount || 0} 
          icon={Trash2} 
          change="-5 vs previous (-83.33%)" 
          changeType="negative" 
        />
        <StatCard 
          title="Operational Sessions" 
          value={metrics?.operationalSessions || 0} 
          icon={Activity} 
          change="—" 
          changeType="neutral" 
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

      {charts?.userCategoryTrend && charts.userCategoryTrend.length > 0 && (
        <div className="mt-6">
          <LineChartCard
            title="User Category Trend"
            description="User signup progression over time by category."
            data={charts.userCategoryTrend.map((item) => ({
              date: item.month,
              total: item.total,
              customerIndividual: item.customerIndividual,
              customerOrg: item.customerOrg,
              fundi: item.fundi,
              professional: item.professional,
              contractor: item.contractor,
              hardware: item.hardware,
            }))}
            lines={[{ key: "total", color: "hsl(215, 16%, 47%)" }]}
          />
        </div>
      )}

      {/* Lifecycle Trends Section */}
      <div className="mt-6 bg-card border border-border rounded-lg p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-2">Lifecycle Trends</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Selectable events, grouping, cumulative mode, comparison, and segment filters.
          </p>

          {/* Event Buttons */}
          <div className="flex flex-wrap gap-2 mb-4">
            {["signup", "login", "otp_success", "otp_fail", "suspension", "deletion", "verification"].map((event) => (
              <button
                key={event}
                onClick={() => setLifecycleEvent(event as LifecycleEvent)}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  lifecycleEvent === event
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {formatEventName(event)}
              </button>
            ))}
          </div>

          {/* Controls Row */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-foreground">Group By:</label>
              <Select value={groupBy} onValueChange={(val) => setGroupBy(val as "day" | "week" | "month")}>
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

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cumulative}
                  onChange={(e) => setCumulative(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm font-medium text-foreground">Cumulative</span>
              </label>
            </div>
          </div>
        </div>

        {/* Chart Display */}
        {lifecycle.loading ? (
          <div className="flex items-center justify-center h-72">
            <p className="text-muted-foreground">Loading lifecycle data...</p>
          </div>
        ) : lifecycle.error ? (
          <div className="flex items-center justify-center h-72">
            <p className="text-red-500">Error: {lifecycle.error}</p>
          </div>
        ) : lifecycleChartData.length > 0 ? (
          <LineChartCard
            title={`${formatEventName(lifecycleEvent)} Trend ${cumulative ? "(Cumulative)" : ""}`}
            description={`${formatEventName(lifecycleEvent)} events grouped by ${groupBy}.`}
            data={lifecycleChartData}
            lines={[{ key: "count", color: "hsl(234, 89%, 74%)" }]}
          />
        ) : (
          <div className="flex items-center justify-center h-72">
            <p className="text-muted-foreground">No data available for the selected filters</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper functions
function getColorForUserType(label: string): string {
  const colorMap: Record<string, string> = {
    "Customer Individual": "hsl(234, 89%, 74%)",
    "Customer Organization": "hsl(240, 84%, 60%)",
    "Fundi": "hsl(160, 84%, 39%)",
    "Professional": "hsl(45, 93%, 51%)",
    "Contractor": "hsl(280, 85%, 65%)",
    "Hardware": "hsl(0, 84%, 60%)",
    "Other": "hsl(210, 14%, 60%)",
  };
  return colorMap[label] || "hsl(210, 14%, 60%)";
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
