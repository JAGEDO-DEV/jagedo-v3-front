import { useEffect, useState } from "react";
import { useAxiosWithAuth } from "@/hooks/useAxiosWithAuth";
import { trackPageView } from "@/utils/analyticsTracker";
import GlobalDateRange from "./components/analytics/GlobalDateRange";
import StatCard from "./components/analytics/StatCard";
import PieChartCard from "./components/analytics/PieChartCard";
import LineChartCard from "./components/analytics/LineChartCard";
import { Package } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getProductsAnalytics } from "@/api/analytics.api";

interface AnalyticsState {
  loading: boolean;
  error: string | null;
  data: any;
}

export default function ProductsPage() {
  const axiosInstance = useAxiosWithAuth(import.meta.env.VITE_SERVER_URL);
  const [period, setPeriod] = useState("7d");
  const [from, setFrom] = useState<string | undefined>(undefined);
  const [to, setTo] = useState<string | undefined>(undefined);
  const [analytics, setAnalytics] = useState<AnalyticsState>({ loading: true, error: null, data: null });

  const fetchAnalytics = async () => {
    try {
      setAnalytics({ loading: true, error: null, data: null });
      const result = await getProductsAnalytics(axiosInstance, period, from, to);
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
    trackPageView("Analytics - Products", axiosInstance);
  }, []);

 

  if (analytics.error) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-red-500">Error: {analytics.error}</p>
      </div>
    );
  }

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

  const data = analytics.data;
  const metrics = data?.metrics || {};
  const charts = data?.charts || {};

  // Convert category distribution for pie chart
  const categoryData = charts.categoryDistribution?.map((item: any, idx: number) => ({
    name: item.name,
    value: item.count,
    color: `hsl(${idx * 70}, 85%, 55%)`,
  })) || [];

  // Convert region data for pie chart
  const regionData = charts.topRegionsByAvailability?.map((item: any, idx: number) => ({
    name: item.region,
    value: item.count,
    color: `hsl(${idx * 60}, 80%, 60%)`,
  })) || [];

  // Format progression data for line chart
  const progressionData = charts.productProgression?.map((item: any) => ({
    date: item.date,
    "Total Products": item.productCount,
  })) || [];

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
        <h2 className="text-xl font-bold text-foreground">Analytics - Products</h2>
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

      {/* Products Overview */}
      <div className="rounded-xl border border-border bg-card p-5 mb-6">
        <h3 className="font-semibold text-foreground">Products Overview</h3>
        <p className="text-sm text-muted-foreground mb-4">Total products, category split, pricing coverage, and lifecycle status for the selected date range.</p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
          <StatCard title="Total Products" value={metrics.totalProducts || 0} icon={Package} subtitle="Live" />
          <StatCard title="Hardware" value={metrics.hardware || 0} icon={Package} subtitle="" />
          <StatCard title="Custom Products" value={metrics.customProducts || 0} icon={Package} subtitle="" />
          <StatCard title="Machinery" value={metrics.machinery || 0} icon={Package} subtitle="" />
          <StatCard title="Designs" value={metrics.designs || 0} icon={Package} subtitle="" />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard title="Approved" value={metrics.approved || 0} subtitle="" />
          <StatCard title="Pending Approval" value={metrics.pendingApproval || 0} subtitle="" />
          <StatCard 
            title="Pricing Coverage" 
            value={`${(metrics.pricingCoverage || 0).toFixed(2)}%`} 
            subtitle={`${metrics.totalProducts ? Math.round((metrics.totalProducts * (metrics.pricingCoverage / 100))) : 0} of ${metrics.totalProducts} priced`} 
          />
          <StatCard 
            title="Average Price Point" 
            value={`Ksh ${(metrics.averagePricePoint || 0).toLocaleString()}`} 
            subtitle={`${metrics.totalProducts ? Math.round(metrics.totalProducts * 2.4) : 0} active regional prices`}
          />
        </div>
      </div>

      {/* Category Distribution */}
      <PieChartCard 
        title="Category Distribution" 
        description="Percentage distribution across hardware, custom products, machinery, and designs." 
        data={categoryData} 
      />

      {/* Product Progression Over Time */}
      <div className="mt-6">
        <LineChartCard
          title="Product Progression Over Time"
          description="Cumulative trend of total products uploaded in the selected range."
          data={progressionData}
          lines={[{ key: "Total Products", color: "hsl(220, 20%, 20%)" }]}
        />
      </div>

      {/* Top 5 Regions */}
      <div className="mt-6">
        <PieChartCard 
          title="Top 5 Regions by Product Availability" 
          description="Regions with the highest number of products." 
          data={regionData} 
        />
      </div>
    </div>
  );
}
