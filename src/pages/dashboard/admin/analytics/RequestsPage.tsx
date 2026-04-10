import { useEffect, useState } from "react";
import { useAxiosWithAuth } from "@/hooks/useAxiosWithAuth";
import { trackPageView } from "@/utils/analyticsTracker";
import GlobalDateRange from "./components/analytics/GlobalDateRange";
import StatCard from "./components/analytics/StatCard";
import BarChartCard from "./components/analytics/BarChartCard";
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
        <PieChartCard title="Management Distribution" data={mgmtDistribution} />
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

      <BarChartCard
        title="Request Status Breakdown"
        data={statusData}
        bars={[{ key: "value", color: "hsl(var(--chart-purple))" }]}
      />
    </div>
  );
}
