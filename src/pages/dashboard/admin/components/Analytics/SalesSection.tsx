import React, { useState, useEffect } from "react";
import ReactGA from "react-ga4";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Legend,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Users,
  ShoppingCart,
  Briefcase,
  UserPlus,
  Download,
  DollarSign,
  Activity,
  UserCheck,
  Star,
} from "lucide-react";
import { filterDataByTimePeriod } from "@/utils/dateFilter";
import useAxiosWithAuth from "@/utils/axiosInterceptor";
import { getSalesAnalytics } from "@/api/analytics.api";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#82CA9D",
  "#FF6B6B",
  "#4ECDC4",
];
const TimePeriodSelector: React.FC<{
  value: string;
  onChange: (value: string) => void;
}> = ({ value, onChange }) => (
  <Select value={value} onValueChange={onChange}>
    <SelectTrigger className="w-[180px]">
      <SelectValue placeholder="Select period" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="1day">24h</SelectItem>
      <SelectItem value="1week">1w</SelectItem>
      <SelectItem value="1month">1m</SelectItem>
      <SelectItem value="1year">1y</SelectItem>
      <SelectItem value="5years">5y</SelectItem>
      <SelectItem value="All">To Date</SelectItem>
    </SelectContent>
  </Select>
);

interface SalesSectionProps {
  timePeriod: string;
  initialData: any | null;
}
interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: "up" | "down" | "neutral";
  icon: React.ReactNode;
  subtitle?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  trend = "neutral",
  icon,
  subtitle,
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {change && (
        <p
          className={`text-xs flex items-center ${
            trend === "up"
              ? "text-green-600"
              : trend === "down"
                ? "text-red-600"
                : "text-gray-600"
          }`}
        >
          {trend === "up" && <TrendingUp className="h-4 w-4 mr-1" />}
          {trend === "down" && <TrendingDown className="h-4 w-4 mr-1" />}
          {change}
        </p>
      )}
      {subtitle && (
        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
      )}
    </CardContent>
  </Card>
);

export const SalesSection: React.FC<SalesSectionProps> = ({
  timePeriod,
  initialData,
}) => {
  const axiosInstance = useAxiosWithAuth(import.meta.env.VITE_SERVER_URL);
  const [salesData, setSalesData] = useState<any | null>(initialData);
  const [loading, setLoading] = useState<boolean>(!initialData);
  const [error, setError] = useState<string | null>(null);

  // populate when initialData changes
  useEffect(() => {
    if (initialData) {
      setSalesData(initialData);
      setLoading(false);
    }
  }, [initialData]);

  // keep existing effect to fetch once if no initialData
  useEffect(() => {
    if (initialData) return;

    const fetchSalesData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getSalesAnalytics(axiosInstance);
        
        setSalesData(response);
      } catch (error: any) {
        setError(error.message || "Failed to load sales data");
        console.error("Error fetching sales data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSalesData();
  }, [axiosInstance, initialData]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Sales Analytics</h2>
          <TimePeriodSelector value={timePeriod} onChange={() => {}} />
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading sales analytics...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Sales Analytics</h2>
          <TimePeriodSelector value={timePeriod} onChange={() => {}} />
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="text-red-500 text-lg">Error: {error}</div>
        </div>
      </div>
    );
  }

  const summary = salesData?.summary || {};
  const salesPerformance = salesData?.salesPerformance || [];
  const revenueByBuilderType = salesData?.revenueByBuilderType || [];
  const managementDistribution = salesData?.managementDistribution || [];

  const getTrendDirection = (growth: string): "up" | "down" | "neutral" => {
    if (growth.includes("↑")) return "up";
    if (growth.includes("↓")) return "down";
    return "neutral";
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Sales Analytics</h2>
        <TimePeriodSelector value={timePeriod} onChange={() => {}} />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Transaction Value"
          value={summary.totalTransactionValue?.value || "Ksh 0"}
          change={summary.totalTransactionValue?.growth}
          trend={getTrendDirection(summary.totalTransactionValue?.growth || "")}
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
        />
        <MetricCard
          title="Revenue"
          value={summary.revenue?.value || "Ksh 0"}
          change={summary.revenue?.growth}
          trend={getTrendDirection(summary.revenue?.growth || "")}
          icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
        />
        <MetricCard
          title="Commission Rate"
          value={summary.commissionRate?.value || "0%"}
          change={summary.commissionRate?.growth}
          trend={getTrendDirection(summary.commissionRate?.growth || "")}
          icon={<Activity className="h-4 w-4 text-muted-foreground" />}
        />
        <MetricCard
          title="ARR"
          value={summary.arr?.value || "Ksh 0"}
          change={summary.arr?.growth}
          trend={getTrendDirection(summary.arr?.growth || "")}
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      {/* Second Row of Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Revenue Growth (YoY)"
          value={summary.revenueGrowthYoY?.value || "0%"}
          change={summary.revenueGrowthYoY?.growth}
          trend={getTrendDirection(summary.revenueGrowthYoY?.growth || "")}
          icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
        />
        <MetricCard
          title="ARPU"
          value={summary.arpu?.value || "Ksh 0"}
          change={summary.arpu?.growth}
          trend={getTrendDirection(summary.arpu?.growth || "")}
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
        />
        <MetricCard
          title="Retention Rate"
          value={summary.retentionRate?.value || "0%"}
          change={summary.retentionRate?.growth}
          trend={getTrendDirection(summary.retentionRate?.growth || "")}
          icon={<UserCheck className="h-4 w-4 text-muted-foreground" />}
        />
        <MetricCard
          title="CLV"
          value={summary.clv?.value || "Ksh 0"}
          change={summary.clv?.growth}
          trend={getTrendDirection(summary.clv?.growth || "")}
          icon={<Star className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      {/* Sales Performance Chart */}
      {salesPerformance.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Sales Performance</CardTitle>
            <CardDescription>
              Year-over-year performance (JaGedo vs Self-managed)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={salesPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="jaGedo"
                  stroke="#3b82f6"
                  name="Managed by JaGedo"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="self"
                  stroke="#10b981"
                  name="Managed by Self"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Distribution Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {revenueByBuilderType.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Builder Type</CardTitle>
              <CardDescription>
                Distribution across builder categories
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={revenueByBuilderType}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ payload }) =>
                      `${payload?.builderType} (${payload?.percentage}%)`
                    }
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="percentage"
                    nameKey="builderType"
                  >
                    {revenueByBuilderType.map((entry: any, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value}%`, "Percentage"]} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {managementDistribution.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Management Distribution</CardTitle>
              <CardDescription>Jobs managed by JaGedo vs Self</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={managementDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ payload }) =>
                      `${payload?.type} (${payload?.percentage}%)`
                    }
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="percentage"
                    nameKey="type"
                  >
                    {managementDistribution.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index + 2]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value}%`, "Percentage"]} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
