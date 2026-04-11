import { useEffect, useState } from "react";
import { useAxiosWithAuth } from "@/hooks/useAxiosWithAuth";
import { trackPageView } from "@/utils/analyticsTracker";
import GlobalDateRange from "./components/analytics/GlobalDateRange";
import StatCard from "./components/analytics/StatCard";
import BarChartCard from "./components/analytics/BarChartCard";
import HorizontalBarChartCard from "./components/analytics/HorizontalBarChartCard";
import LineChartCard from "./components/analytics/LineChartCard";
import PieChartCard from "./components/analytics/PieChartCard";
import { ShoppingCart } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getRequestAnalytics } from "@/api/analytics.api";

interface AnalyticsState {
  loading: boolean;
  error: string | null;
  data: any;
}

export default function RequestsPage() {
  const axiosInstance = useAxiosWithAuth(import.meta.env.VITE_SERVER_URL);
  const [period, setPeriod] = useState("7d");
  const [from, setFrom] = useState<string | undefined>(undefined);
  const [to, setTo] = useState<string | undefined>(undefined);
  const [analytics, setAnalytics] = useState<AnalyticsState>({ loading: true, error: null, data: null });

  const fetchAnalytics = async () => {
    try {
      setAnalytics({ loading: true, error: null, data: null });
      const result = await getRequestAnalytics(axiosInstance, period, from, to);
      setAnalytics({ loading: false, error: null, data: result.data });
    } catch (err: any) {
      setAnalytics({ loading: false, error: err.message, data: null });
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
    trackPageView("Analytics - Requests", axiosInstance);
  }, []);

  if (analytics.error) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-red-500">Error: {analytics.error}</p>
      </div>
    );
  }

  const data = analytics.data;
  const metrics = data?.metrics || {};
  const charts = data?.charts || {};

  // Convert API period format to preset format for GlobalDateRange
  const getPeriodDisplayName = (p: string): string => {
    const map: { [key: string]: string } = {
      today: "Today",
      "7d": "7d",
      "30d": "30d",
      "90d": "90d",
    };
    return map[p] || "Custom";
  };

  // Build status data for bar chart
  const statusData = [
    { name: "Draft", value: metrics.statusBreakdown?.statuses?.draft?.count || 0 },
    { name: "New", value: metrics.statusBreakdown?.statuses?.new?.count || 0 },
    { name: "Quotation", value: metrics.statusBreakdown?.statuses?.quotation?.count || 0 },
    { name: "Active", value: metrics.statusBreakdown?.statuses?.active?.count || 0 },
    { name: "Completed", value: metrics.statusBreakdown?.statuses?.completed?.count || 0 },
    { name: "Reviewed", value: metrics.statusBreakdown?.statuses?.reviewed?.count || 0 },
  ];

  // Management distribution for pie chart
  const mgmtDistribution = [
    { name: "Jobs", value: metrics.managementDistribution?.jobs?.count || 0, color: "hsl(217, 91%, 60%)" },
    { name: "Orders", value: metrics.managementDistribution?.orders?.count || 0, color: "hsl(160, 84%, 39%)" },
  ];

  // Job type breakdown data
  const jobTypeData = (charts.jobTypeBreakdown || []).filter((item: any) => item.count > 0);

  // Order category breakdown data
  const orderCategoryData = (charts.orderCategoryBreakdown || []).filter((item: any) => item.count > 0);

  // Requests trend data
  const requestsTrendData = charts.requestsTrend || [];

  // Top services by job type
  const topServices = charts.topServicesByJobType || {};

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
      </div>
      <GlobalDateRange 
        onDateRangeChange={handleDateRangeChange}
        initialPeriod={getPeriodDisplayName(period)}
      />

      <div className="flex items-center justify-between mb-4 mt-2">
        <h2 className="text-xl font-bold text-foreground">Analytics - All Requests</h2>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="7d">7 Days</SelectItem>
            <SelectItem value="30d">30 Days</SelectItem>
            <SelectItem value="90d">90 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard 
          title="Total Requests" 
          value={metrics.totalRequests?.total || 0} 
          icon={ShoppingCart} 
          subtitle="Live" 
        />
        <PieChartCard title="Management Distribution" data={mgmtDistribution} showLegend={false} />
        <div className="rounded-xl border border-border bg-card p-5">
          <h4 className="font-semibold text-foreground">Jobs vs Orders</h4>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Jobs</span>
              <span className="font-bold">{metrics.jobsVsOrders?.jobs || 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Orders</span>
              <span className="font-bold">{metrics.jobsVsOrders?.orders || 0}</span>
            </div>
            <div className="flex justify-between text-sm border-t pt-2">
              <span className="text-muted-foreground">Total</span>
              <span className="font-bold">{metrics.jobsVsOrders?.total || 0}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <h3 className="text-lg font-bold text-foreground mb-4">Jobs Requested by Type</h3>
          <div className="grid grid-cols-3 gap-3 mb-6">
            {jobTypeData.map((item: any) => (
              <div key={item.name} className="rounded-lg border border-border bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 text-center shadow-sm hover:shadow-md transition-shadow">
                <p className="text-sm font-medium text-foreground">{item.name}</p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">{item.count}</p>
              </div>
            ))}
          </div>
          <BarChartCard
            title=""
            data={jobTypeData}
            bars={[{ key: "count", color: "#8884d8" }]}
          />
        </div>

        <div>
          <h3 className="text-lg font-bold text-foreground mb-4">Order Services Requested</h3>
          <div className="grid grid-cols-4 gap-3 mb-6">
            {orderCategoryData.map((item: any) => (
              <div key={item.name} className="rounded-lg border border-border bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-900/20 dark:to-cyan-800/20 p-4 text-center shadow-sm hover:shadow-md transition-shadow">
                <p className="text-sm font-medium text-foreground">{item.name}</p>
                <p className="text-3xl font-bold text-cyan-600 dark:text-cyan-400 mt-2">{item.count}</p>
              </div>
            ))}
          </div>
          <BarChartCard
            title=""
            data={orderCategoryData}
            bars={[{ key: "count", color: "#0ea5e9" }]}
          />
        </div>
      </div>

      <BarChartCard
        title="Request Status Breakdown"
        data={statusData}
        bars={[{ key: "value", color: "hsl(var(--chart-purple))" }]}
      />

      <div className="mt-6">
        <h3 className="text-lg font-bold text-foreground mb-4">Most Requested Services by Job Type</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(topServices).map(([jobType, services]: any) => (
            <div key={jobType} className="rounded-xl border border-border bg-card p-4">
              <h4 className="font-semibold text-foreground mb-3">Top {jobType} Services</h4>
              <div className="space-y-2">
                {services.map((service: any) => (
                  <div key={service.name} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{service.name}</span>
                    <span className="font-bold text-foreground">{service.count}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <LineChartCard
          title="Requests Trend on Platform"
          data={requestsTrendData}
          lines={[
            { key: "jobs", name: "Jobs", color: "#8884d8" },
            { key: "orders", name: "Orders", color: "#0ea5e9" },
          ]}
          xAxisKey="period"
        />
      </div>
    </div>
  );
}
