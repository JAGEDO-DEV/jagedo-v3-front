import { useEffect, useState } from "react";
import { useAxiosWithAuth } from "@/hooks/useAxiosWithAuth";
import { trackPageView } from "@/utils/analyticsTracker";
import GlobalDateRange from "./components/analytics/GlobalDateRange";
import StatCard from "./components/analytics/StatCard";
import BarChartCard from "./components/analytics/BarChartCard";
import HorizontalBarChartCard from "./components/analytics/HorizontalBarChartCard";
import PieChartCard from "./components/analytics/PieChartCard";
import { Globe } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getWebAnalytics } from "@/api/analytics.api";

interface AnalyticsState {
  loading: boolean;
  error: string | null;
  data: any;
}

export default function WebPage() {
  const axiosInstance = useAxiosWithAuth(import.meta.env.VITE_SERVER_URL);
  const [period, setPeriod] = useState("90d");
  const [from, setFrom] = useState<string | undefined>(undefined);
  const [to, setTo] = useState<string | undefined>(undefined);
  const [analytics, setAnalytics] = useState<AnalyticsState>({ loading: true, error: null, data: null });

  const fetchAnalytics = async () => {
    try {
      setAnalytics({ loading: true, error: null, data: null });
      const result = await getWebAnalytics(axiosInstance, period, from, to);
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
    trackPageView("Analytics - Web", axiosInstance);
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
      thisWeek: "This Week",
      "7d": "7d",
      "30d": "30d",
      "90d": "90d",
    };
    return map[p] || "Custom";
  };

  // Convert charts data for bar and pie charts
  const countryData = charts.topCountries?.map?.((item: any) => ({ 
    name: item.country, 
    visitors: item.count 
  })) || [];

  // deviceUsage is an object with total and devices property
  const deviceData = charts.deviceUsage?.devices
    ? Object.entries(charts.deviceUsage.devices).map(([key, item]: any, idx: number) => ({
        name: key.charAt(0).toUpperCase() + key.slice(1),
        value: item.count,
        color: `hsl(${idx * 45}, 91%, 60%)`,
      }))
    : [];

  // specificDevices is an array with device breakdown
  const specificDevicesData = charts.specificDevices?.devices
    ? charts.specificDevices.devices
        .filter((item: any) => item.count > 0)
        .map((item: any, idx: number) => ({
          name: item.name,
          value: item.count,
          color: `hsl(${idx * 35}, 85%, 55%)`,
        }))
    : [];

  // trafficSources returns an array of sources grouped by referenceInfo
  const trafficData = charts.trafficSources?.sources
    ? charts.trafficSources.sources
        .filter((item: any) => item.count > 0)
        .map((item: any, idx: number) => ({
          name: item.name || 'Unknown',
          value: item.count,
          color: `hsl(${idx * 45}, 91%, 60%)`,
        }))
    : [];

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
        <h2 className="text-xl font-bold text-foreground">Analytics - Web</h2>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="7d">7 Days</SelectItem>
            <SelectItem value="30d">30 Days</SelectItem>
            <SelectItem value="90d">90 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard 
          title="Total Visitors" 
          value={metrics.totalVisitors || 0} 
          subtitle="Live" 
        />
        <StatCard 
          title="Active Users" 
          value={metrics.activeUsers || 0} 
          subtitle="Live" 
        />
        <StatCard 
          title="Conversion Rate" 
          value={`${typeof metrics.conversionRate === 'object' ? (metrics.conversionRate?.rate || 0) : (metrics.conversionRate || 0)}%`} 
          subtitle="Live" 
        />
        <StatCard 
          title="Bounce Rate" 
          value={`${typeof metrics.bounceRate === 'object' ? (metrics.bounceRate?.rate || 0) : (metrics.bounceRate || 0)}%`} 
          subtitle="Live" 
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {countryData.length > 0 && (
          <BarChartCard
            title="Top Countries"
            data={countryData}
            bars={[{ key: "visitors", color: "hsl(var(--chart-indigo))" }]}
          />
        )}
        {deviceData.length > 0 && (
          <PieChartCard title="Device Usage" data={deviceData} showLegend={false} />
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {trafficData.length > 0 && (
          <HorizontalBarChartCard 
            title="Traffic Sources" 
            description="User acquisition channels"
            data={trafficData}
            dataKey="value"
            color="#8884d8"
          />
        )}

        {specificDevicesData.length > 0 && (
          <BarChartCard 
            title="Specific Devices" 
            description="Breakdown by operating system"
            data={specificDevicesData}
            bars={[{ key: "value", color: "#8884d8" }]}
          />
        )}
      </div>
    </div>
  );
}
