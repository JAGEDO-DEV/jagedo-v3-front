import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useAxiosWithAuth } from "@/hooks/useAxiosWithAuth";
import { trackPageView } from "@/utils/analyticsTracker";
import GlobalDateRange from "./components/analytics/GlobalDateRange";
import StatCard from "./components/analytics/StatCard";
import PieChartCard from "./components/analytics/PieChartCard";
import LineChartCard from "./components/analytics/LineChartCard";
import { Users } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getCustomerAnalytics,
  getBuilderAnalytics,
  CustomerAnalytics,
} from "@/api/analytics.api";

interface UserSegmentPageProps {
  title?: string;
}

interface AnalyticsState {
  loading: boolean;
  error: string | null;
  data: CustomerAnalytics | any;
}

export default function UserSegmentPage({
  title = "Customers",
}: UserSegmentPageProps) {
  const axiosInstance = useAxiosWithAuth(import.meta.env.VITE_SERVER_URL);
  const [period, setPeriod] = useState("90d");
  const [from, setFrom] = useState<string | undefined>(undefined);
  const [to, setTo] = useState<string | undefined>(undefined);
  const [analytics, setAnalytics] = useState<AnalyticsState>({
    loading: true,
    error: null,
    data: null,
  });

  // Safely extract title parts
  const titlePart = title?.split(" - ")?.[0] || "Users";
  const displayTitle = `${titlePart} Overview`;
  const isBuilders = titlePart.toLowerCase().includes("builder");

  const fetchAnalytics = async () => {
    try {
      setAnalytics({ loading: true, error: null, data: null });
      const result = isBuilders
        ? await getBuilderAnalytics(axiosInstance, period, from, to, "day")
        : await getCustomerAnalytics(axiosInstance, period, from, to, "day");
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
  }, [period, from, to, isBuilders]);

  useEffect(() => {
    trackPageView(`Analytics - ${displayTitle}`, axiosInstance);
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
  
  // Build type distribution data for customers
  const typeDistribution = !isBuilders
    ? [
        {
          name: "Individual",
          value: metrics.typeDistribution?.individual?.count || 0,
          color: "hsl(217, 91%, 60%)",
          percentage: metrics.typeDistribution?.individual?.percentage || 0,
        },
        {
          name: "Organization",
          value: metrics.typeDistribution?.organization?.count || 0,
          color: "hsl(160, 84%, 39%)",
          percentage: metrics.typeDistribution?.organization?.percentage || 0,
        },
      ]
    : [
        {
          name: "Fundi",
          value: metrics.typeDistribution?.fundi?.count || 0,
          color: "hsl(217, 91%, 60%)",
          percentage: metrics.typeDistribution?.fundi?.percentage || 0,
        },
        {
          name: "Contractor",
          value: metrics.typeDistribution?.contractor?.count || 0,
          color: "hsl(160, 84%, 39%)",
          percentage: metrics.typeDistribution?.contractor?.percentage || 0,
        },
        {
          name: "Professional",
          value: metrics.typeDistribution?.professional?.count || 0,
          color: "hsl(25, 95%, 53%)",
          percentage: metrics.typeDistribution?.professional?.percentage || 0,
        },
        {
          name: "Hardware",
          value: metrics.typeDistribution?.hardware?.count || 0,
          color: "hsl(199, 89%, 48%)",
          percentage: metrics.typeDistribution?.hardware?.percentage || 0,
        },
      ];

  // Build pie chart data (transform for display) - filter out zero values
  const pieChartData = typeDistribution
    .filter((type) => type.value > 0)
    .map((type) => ({
      name: type.name,
      value: type.value,
      color: type.color,
    }));

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
        <h2 className="text-xl font-bold text-foreground">{displayTitle}</h2>
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Total Customers/Builders */}
        <StatCard
          title={`Total ${titlePart}`}
          value={isBuilders ? metrics.totalBuilders : metrics.totalCustomers}
          icon={Users}
          subtitle="Live"
        />

        {/* Type Distribution Pie Chart (No Legend) */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h4 className="font-semibold text-foreground mb-3">
            {titlePart} Type Distribution
          </h4>
          {pieChartData.length > 0 ? (
            <div className="w-full h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={60}
                    dataKey="value"
                    label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {pieChartData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="w-full h-52 flex items-center justify-center">
              <p className="text-muted-foreground">No distribution data available</p>
            </div>
          )}
        </div>

        {/* Signup Segment Leaders */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h4 className="font-semibold text-foreground mb-3">
            Signup Segment Leaders
          </h4>
          {typeDistribution.map((item) => (
            <div key={item.name} className="mb-3">
              <div className="flex items-center gap-2 text-sm">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-foreground font-medium">{item.name}</span>
                <span className="ml-auto text-muted-foreground">
                  {item.value}
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted mt-1">
                <div
                  className="h-2 rounded-full"
                  style={{
                    backgroundColor: item.color,
                    width: `${(item.percentage / 100) * 100}%`,
                  }}
                />
              </div>
            </div>
          ))}
          <div className="text-xs text-muted-foreground mt-4 space-y-1">
            <p className="pt-2  mt-2">
              Highest:{" "}
              {typeDistribution.find(
                (t) =>
                  t.value === Math.max(...typeDistribution.map((d) => d.value)),
              )?.name || "N/A"}
            </p>
            <p className="border-b border-border mb-4 pt-1 pb-2">
              Lowest:{" "}
              {typeDistribution.find(
                (t) =>
                  t.value === Math.min(...typeDistribution.map((d) => d.value)),
              )?.name || "N/A"}
            </p>
            <p>
              Total signups in period: {metrics.signupStats?.totalSignups || 0}
            </p>
            <p>
              Average per day:{" "}
              {(metrics.signupStats?.averagePerDay || 0).toFixed(2)}
            </p>
            <p>
              Active days: {metrics.signupStats?.activeDays || 0} /{" "}
              {metrics.signupStats?.daysInRange || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Signup Trend Chart */}
      <div className="mt-6">
        {charts.segmentPerformance && charts.segmentPerformance.length > 0 ? (
          <LineChartCard
            title={`${titlePart} Signup Trend`}
            description={`Daily signup progression over the selected period`}
            data={(() => {
              // Transform segment performance data for multi-line chart
              const firstDataPoint = charts.segmentPerformance[0];
              const dateObj = new Date(firstDataPoint.period);
              const prevDate = new Date(dateObj);
              prevDate.setDate(prevDate.getDate() - 1);
              const prevDateStr = prevDate.toISOString().split('T')[0];

              // Create zero-baseline point
              const zeroPoint: any = { date: prevDateStr };
              
              if (isBuilders) {
                zeroPoint.fundi = 0;
                zeroPoint.contractor = 0;
                zeroPoint.professional = 0;
                zeroPoint.hardware = 0;
                zeroPoint.total = 0;
              } else {
                zeroPoint.individual = 0;
                zeroPoint.organization = 0;
                zeroPoint.total = 0;
              }

              // Transform data points
              const transformedData = charts.segmentPerformance.map((item: any) => {
                const dataPoint: any = { date: item.period };
                
                if (isBuilders) {
                  dataPoint.fundi = item.fundi?.count || 0;
                  dataPoint.contractor = item.contractor?.count || 0;
                  dataPoint.professional = item.professional?.count || 0;
                  dataPoint.hardware = item.hardware?.count || 0;
                  dataPoint.total = item.total || 0;
                } else {
                  dataPoint.individual = item.individual?.count || 0;
                  dataPoint.organization = item.organization?.count || 0;
                  dataPoint.total = item.total || 0;
                }
                
                return dataPoint;
              });

              return [zeroPoint, ...transformedData];
            })()}
            lines={
              isBuilders
                ? [
                    { key: "fundi", name: "Fundis", color: "hsl(234, 89%, 74%)" },
                    { key: "contractor", name: "Contractors", color: "hsl(160, 84%, 39%)" },
                    { key: "professional", name: "Professionals", color: "hsl(45, 93%, 51%)" },
                    { key: "hardware", name: "Hardware", color: "hsl(199, 89%, 48%)" },
                    { key: "total", name: "Total Signups", color: "hsl(0, 0%, 20%)", dashed: true },
                  ]
                : [
                    { key: "individual", name: "Individual", color: "hsl(217, 91%, 60%)" },
                    { key: "organization", name: "Organization", color: "hsl(160, 84%, 39%)" },
                    { key: "total", name: "Total Signups", color: "hsl(0, 0%, 20%)", dashed: true },
                  ]
            }
          />
        ) : metrics.signupStats ? (
          <div className="rounded-xl border border-border bg-card p-5">
            <h4 className="font-semibold text-foreground mb-4">{titlePart} Signup Statistics</h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {metrics.signupStats.totalSignups || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Total Signups</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {(metrics.signupStats.averagePerDay || 0).toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Avg/Day</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {metrics.signupStats.activeDays || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Active Days</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {metrics.signupStats.daysInRange || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Days in Range</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {(metrics.signupStats.activeDayPercentage || 0).toFixed(2)}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">Active %</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card p-5">
            <h4 className="font-semibold text-foreground mb-3">{titlePart} Signup Trend</h4>
            <div className="flex items-center justify-center h-72">
              <p className="text-muted-foreground">No signup data available for the selected period</p>
            </div>
          </div>
        )}
      </div>

      {/* Segment Performance Trend - Customers */}
      {!isBuilders && (
        <div className="mt-6 rounded-xl border border-border bg-card p-5">
          <h4 className="font-semibold text-foreground mb-4">
            Customer Segment Signup Performance
          </h4>
          {charts.segmentPerformance && charts.segmentPerformance.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border">
                  <tr className="text-muted-foreground">
                    <th className="text-left py-2 px-4">Segment</th>
                    <th className="text-right py-2 px-4">Signups</th>
                    <th className="text-right py-2 px-4">Avg/day</th>
                    <th className="text-right py-2 px-4">Prev | Recent</th>
                    <th className="text-right py-2 px-4">Growth</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {typeDistribution.map((item) => (
                    <tr key={item.name} className="hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="font-medium text-foreground">
                            {item.name}
                          </span>
                        </div>
                      </td>
                      <td className="text-right py-3 px-4 text-foreground">
                        {item.value} ({item.percentage.toFixed(2)}%)
                      </td>
                      <td className="text-right py-3 px-4 text-muted-foreground">
                        {(metrics.signupStats?.averagePerDay || 0).toFixed(2)}
                      </td>
                      <td className="text-right py-3 px-4 text-muted-foreground">
                        Prev: 0 | Recent: {item.value}
                      </td>
                      <td className="text-right py-3 px-4 text-green-600 font-medium">
                        +{item.value} (100.00%)
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex items-center justify-center h-48">
              <p className="text-muted-foreground">No segment performance data available for the selected period</p>
            </div>
          )}
        </div>
      )}

      {/* Segment Performance Trend - Builders */}
      {isBuilders && (
        <div className="mt-6 rounded-xl border border-border bg-card p-5">
          <h4 className="font-semibold text-foreground mb-4">
            Builder Segment Signup Performance
          </h4>
          {charts.segmentPerformance && charts.segmentPerformance.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border">
                  <tr className="text-muted-foreground">
                    <th className="text-left py-2 px-4">Segment</th>
                    <th className="text-right py-2 px-4">Signups</th>
                    <th className="text-right py-2 px-4">Avg/day</th>
                    <th className="text-right py-2 px-4">Prev | Recent</th>
                    <th className="text-right py-2 px-4">Growth</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {charts.segmentPerformance?.length > 0 && (
                    <>
                      {/* Fundi */}
                      <tr className="hover:bg-muted/50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <span
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: "hsl(217, 91%, 60%)" }}
                            />
                            <span className="font-medium text-foreground">
                              Fundi
                            </span>
                          </div>
                        </td>
                        <td className="text-right py-3 px-4 text-foreground">
                          {charts.segmentPerformance[charts.segmentPerformance.length - 1]?.fundi?.count || 0} ({charts.segmentPerformance[charts.segmentPerformance.length - 1]?.fundi?.percentage.toFixed(2)}%)
                        </td>
                        <td className="text-right py-3 px-4 text-muted-foreground">
                          {(metrics.signupStats?.averagePerDay || 0).toFixed(2)}
                        </td>
                        <td className="text-right py-3 px-4 text-muted-foreground">
                          Prev: {charts.segmentPerformance.length > 1 ? charts.segmentPerformance[charts.segmentPerformance.length - 2]?.fundi?.count || 0 : 0} | Recent: {charts.segmentPerformance[charts.segmentPerformance.length - 1]?.fundi?.count || 0}
                        </td>
                        <td className="text-right py-3 px-4 font-medium" style={{ color: (charts.segmentPerformance[charts.segmentPerformance.length - 1]?.fundi?.changePercentage || 0) >= 0 ? "#22c55e" : "#ef4444" }}>
                          {(charts.segmentPerformance[charts.segmentPerformance.length - 1]?.fundi?.changePercentage || 0) >= 0 ? "+" : ""}{(charts.segmentPerformance[charts.segmentPerformance.length - 1]?.fundi?.changePercentage || 0).toFixed(2)}%
                        </td>
                      </tr>

                      {/* Contractor */}
                      <tr className="hover:bg-muted/50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <span
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: "hsl(160, 84%, 39%)" }}
                            />
                            <span className="font-medium text-foreground">
                              Contractor
                            </span>
                          </div>
                        </td>
                        <td className="text-right py-3 px-4 text-foreground">
                          {charts.segmentPerformance[charts.segmentPerformance.length - 1]?.contractor?.count || 0} ({charts.segmentPerformance[charts.segmentPerformance.length - 1]?.contractor?.percentage.toFixed(2)}%)
                        </td>
                        <td className="text-right py-3 px-4 text-muted-foreground">
                          {(metrics.signupStats?.averagePerDay || 0).toFixed(2)}
                        </td>
                        <td className="text-right py-3 px-4 text-muted-foreground">
                          Prev: {charts.segmentPerformance.length > 1 ? charts.segmentPerformance[charts.segmentPerformance.length - 2]?.contractor?.count || 0 : 0} | Recent: {charts.segmentPerformance[charts.segmentPerformance.length - 1]?.contractor?.count || 0}
                        </td>
                        <td className="text-right py-3 px-4 font-medium" style={{ color: (charts.segmentPerformance[charts.segmentPerformance.length - 1]?.contractor?.changePercentage || 0) >= 0 ? "#22c55e" : "#ef4444" }}>
                          {(charts.segmentPerformance[charts.segmentPerformance.length - 1]?.contractor?.changePercentage || 0) >= 0 ? "+" : ""}{(charts.segmentPerformance[charts.segmentPerformance.length - 1]?.contractor?.changePercentage || 0).toFixed(2)}%
                        </td>
                      </tr>

                      {/* Professional */}
                      <tr className="hover:bg-muted/50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <span
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: "hsl(25, 95%, 53%)" }}
                            />
                            <span className="font-medium text-foreground">
                              Professional
                            </span>
                          </div>
                        </td>
                        <td className="text-right py-3 px-4 text-foreground">
                          {charts.segmentPerformance[charts.segmentPerformance.length - 1]?.professional?.count || 0} ({charts.segmentPerformance[charts.segmentPerformance.length - 1]?.professional?.percentage.toFixed(2)}%)
                        </td>
                        <td className="text-right py-3 px-4 text-muted-foreground">
                          {(metrics.signupStats?.averagePerDay || 0).toFixed(2)}
                        </td>
                        <td className="text-right py-3 px-4 text-muted-foreground">
                          Prev: {charts.segmentPerformance.length > 1 ? charts.segmentPerformance[charts.segmentPerformance.length - 2]?.professional?.count || 0 : 0} | Recent: {charts.segmentPerformance[charts.segmentPerformance.length - 1]?.professional?.count || 0}
                        </td>
                        <td className="text-right py-3 px-4 font-medium" style={{ color: (charts.segmentPerformance[charts.segmentPerformance.length - 1]?.professional?.changePercentage || 0) >= 0 ? "#22c55e" : "#ef4444" }}>
                          {(charts.segmentPerformance[charts.segmentPerformance.length - 1]?.professional?.changePercentage || 0) >= 0 ? "+" : ""}{(charts.segmentPerformance[charts.segmentPerformance.length - 1]?.professional?.changePercentage || 0).toFixed(2)}%
                        </td>
                      </tr>

                      {/* Hardware */}
                      <tr className="hover:bg-muted/50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <span
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: "hsl(199, 89%, 48%)" }}
                            />
                            <span className="font-medium text-foreground">
                              Hardware
                            </span>
                          </div>
                        </td>
                        <td className="text-right py-3 px-4 text-foreground">
                          {charts.segmentPerformance[charts.segmentPerformance.length - 1]?.hardware?.count || 0} ({charts.segmentPerformance[charts.segmentPerformance.length - 1]?.hardware?.percentage.toFixed(2)}%)
                        </td>
                        <td className="text-right py-3 px-4 text-muted-foreground">
                          {(metrics.signupStats?.averagePerDay || 0).toFixed(2)}
                        </td>
                        <td className="text-right py-3 px-4 text-muted-foreground">
                          Prev: {charts.segmentPerformance.length > 1 ? charts.segmentPerformance[charts.segmentPerformance.length - 2]?.hardware?.count || 0 : 0} | Recent: {charts.segmentPerformance[charts.segmentPerformance.length - 1]?.hardware?.count || 0}
                        </td>
                        <td className="text-right py-3 px-4 font-medium" style={{ color: (charts.segmentPerformance[charts.segmentPerformance.length - 1]?.hardware?.changePercentage || 0) >= 0 ? "#22c55e" : "#ef4444" }}>
                          {(charts.segmentPerformance[charts.segmentPerformance.length - 1]?.hardware?.changePercentage || 0) >= 0 ? "+" : ""}{(charts.segmentPerformance[charts.segmentPerformance.length - 1]?.hardware?.changePercentage || 0).toFixed(2)}%
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex items-center justify-center h-48">
              <p className="text-muted-foreground">No segment performance data available for the selected period</p>
            </div>
          )}
        </div>
      )}

      

      {/* Activity Statistics */}
      <div className="mt-6 rounded-xl border border-border bg-card p-5">
        <h4 className="font-semibold text-foreground mb-3">
          Activity Statistics
        </h4>
        <div className="divide-y divide-border">
          {isBuilders ? (
            <>
              <div className="flex items-center justify-between py-3">
                <span className="text-sm font-medium text-foreground">
                  Active Jobs
                </span>
                <span className="text-lg font-bold text-primary">
                  {charts.activityStats?.activities?.activeJobs?.count || 0}
                </span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-sm font-medium text-foreground">
                  Completed Jobs
                </span>
                <span className="text-lg font-bold text-primary">
                  {charts.activityStats?.activities?.completedJobs?.count || 0}
                </span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-sm font-medium text-foreground">
                  Total Bids
                </span>
                <span className="text-lg font-bold text-primary">
                  {charts.activityStats?.activities?.bids?.count || 0}
                </span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-sm font-medium text-foreground">
                  Reviewed
                </span>
                <span className="text-lg font-bold text-primary">
                  {charts.activityStats?.activities?.reviewed?.count || 0}
                </span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-sm font-medium text-foreground">
                  Rated
                </span>
                <span className="text-lg font-bold text-primary">
                  {charts.activityStats?.activities?.rated?.count || 0}
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between py-3">
                <span className="text-sm font-medium text-foreground">
                  Draft Requests
                </span>
                <span className="text-lg font-bold text-primary">
                  {charts.activityStats?.activities?.draftRequests?.count || 0}
                </span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-sm font-medium text-foreground">
                  Total Requests
                </span>
                <span className="text-lg font-bold text-primary">
                  {charts.activityStats?.activities?.requests?.count || 0}
                </span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-sm font-medium text-foreground">
                  Active Jobs
                </span>
                <span className="text-lg font-bold text-primary">
                  {charts.activityStats?.activities?.activeJobs?.count || 0}
                </span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-sm font-medium text-foreground">
                  Completed Jobs
                </span>
                <span className="text-lg font-bold text-primary">
                  {charts.activityStats?.activities?.completedJobs?.count || 0}
                </span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-sm font-medium text-foreground">
                  Reviewed
                </span>
                <span className="text-lg font-bold text-primary">
                  {charts.activityStats?.activities?.reviewed?.count || 0}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
