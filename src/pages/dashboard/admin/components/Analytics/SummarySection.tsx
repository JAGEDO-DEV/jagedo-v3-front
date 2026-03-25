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
} from "lucide-react";
import { filterDataByTimePeriod } from "@/utils/dateFilter";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FF6B6B', '#4ECDC4'];
// Summary Section
interface SummarySectionProps {
  timePeriod: string;
  initialRequestsData: any | null;
  initialAnalyticsData: any | null;
}
interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: "up" | "down" | "neutral";
  icon: React.ReactNode;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  trend,
  icon,
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <p
        className={`text-xs flex items-center ${trend === "up" ? "text-green-600" : "text-red-600"
          }`}
      >
        {trend === "up" ? (
          <TrendingUp className="h-4 w-4 mr-1" />
        ) : (
          <TrendingDown className="h-4 w-4 mr-1" />
        )}
        {change}
      </p>
    </CardContent>
  </Card>
);
export const SummarySection: React.FC<SummarySectionProps> = ({ timePeriod, initialRequestsData, initialAnalyticsData }) => {
  const [requestsData, setRequestsData] = useState<any | null>(initialRequestsData);
  const [analyticsData, setAnalyticsData] = useState<any | null>(initialAnalyticsData);
  const [rawRequestsData, setRawRequestsData] = useState<any | null>(initialRequestsData);
  const [rawAnalyticsData, setRawAnalyticsData] = useState<any | null>(initialAnalyticsData);

  // Loading states for each API call
  const [loadingRequests, setLoadingRequests] = useState<boolean>(true);
  const [loadingAnalytics, setLoadingAnalytics] = useState<boolean>(true);

  // Error states for each API call
  const [errorRequests, setErrorRequests] = useState<string | null>(null);
  const [errorAnalytics, setErrorAnalytics] = useState<string | null>(null);

  // const [timePeriod, setTimePeriod] = useState("");


  // original fetching removed; parent now provides data
  useEffect(() => {
    // update raw data if props change
    setRawRequestsData(initialRequestsData);
    setRawAnalyticsData(initialAnalyticsData);
    setRequestsData(initialRequestsData);
    setAnalyticsData(initialAnalyticsData);

    if (initialRequestsData) {
      setLoadingRequests(false);
    }
    if (initialAnalyticsData) {
      setLoadingAnalytics(false);
    }
  }, [initialRequestsData, initialAnalyticsData]);

  // Filter data when timePeriod changes
  useEffect(() => {
    if (!rawRequestsData && !rawAnalyticsData) return;

    // Filter requests data
    if (rawRequestsData) {
      const filtered = filterDataByTimePeriod(rawRequestsData, timePeriod);
      setRequestsData(filtered);
    }

    // Filter analytics data
    if (rawAnalyticsData) {
      const filtered = filterDataByTimePeriod(rawAnalyticsData, timePeriod);
      setAnalyticsData(filtered);
      console.log("Filtered Analytics Data:", filtered); // Debug log
    }
  }, [timePeriod, rawRequestsData, rawAnalyticsData]);

  // Transform job status data for visualization
  const jobStatusData = [
    { name: "Active", value: requestsData?.activeAll || 0, color: "#10b981" },
    { name: "New", value: requestsData?.newAll || 0, color: "#3b82f6" },
    { name: "Draft", value: requestsData?.draftAll || 0, color: "#f59e0b" },
    {
      name: "Completed",
      value: requestsData?.completedAll || 0,
      color: "#8b5cf6",
    },
    {
      name: "Under Quotation",
      value: requestsData?.allUnderQuotation || 0,
      color: "#ef4444",
    },
    {
      name: "Reviewed",
      value: requestsData?.reviewedAll || 0,
      color: "#06b6d4",
    },
  ].filter((item) => item.value > 0);

  // Job management distribution
  const managementData = [
    {
      name: "Managed by JaGedo",
      value: requestsData?.managedByJaGedo || 0,
      percentage: requestsData?.managedByJaGedoPercentage || 0,
    },
    {
      name: "Managed by Self",
      value: requestsData?.managedBySelf || 0,
      percentage: requestsData?.managedBySelfPercentage || 0,
    },
  ].filter((item) => item.value > 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard
          title="Total Users"
          value={analyticsData?.totalCustomers + analyticsData?.totalBuilders || "0"}
          change="10%"
          trend="up"
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
        />
        <MetricCard
          title="Total Customers"
          value={analyticsData?.totalCustomers || "0"}
          change="20%"
          trend="up"
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
        />
        <MetricCard
          title="Total Builders"
          value={analyticsData?.totalBuilders || "0"}
          change="10%"
          trend="up"
          icon={<Briefcase className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard
          title="Total Requests"
          value={requestsData?.totalRequests || "0"}
          change="30%"
          trend="up"
          icon={<ShoppingCart className="h-4 w-4 text-muted-foreground" />}
        />
        <MetricCard
          title="Total Jobs"
          value={requestsData?.totalJobs || "0"}
          change="5%"
          trend="up"
          icon={<Briefcase className="h-4 w-4 text-muted-foreground" />}
        />
        <MetricCard
          title="Total Orders"
          value={requestsData?.totalOrders || "0"}
          change="10%"
          trend="up"
          icon={<ShoppingCart className="h-4 w-4 text-muted-foreground" />}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Job Management</CardTitle>
            <CardDescription>
              Jobs managed by JaGedo vs Self-managed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={managementData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Overview Statistics</CardTitle>
            <CardDescription>Key metrics summary</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span>Total Jobs & Orders</span>
              <span className="font-bold text-lg">
                {(requestsData?.totalJobs || 0) +
                  (requestsData?.totalOrders || 0)}
              </span>
            </div>
            <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span>Total Jobs</span>
              <span className="font-bold text-lg">
                {requestsData?.totalJobs || 0}
              </span>
            </div>
            <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span>Total Orders</span>
              <span className="font-bold text-lg">
                {requestsData?.totalOrders || 0}
              </span>
            </div>
            <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
              <span>Jobs %</span>
              <span className="font-bold text-lg text-blue-600">
                {requestsData?.jobsPercentage || 0}%
              </span>
            </div>
            <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span>Orders %</span>
              <span className="font-bold text-lg">
                {requestsData?.ordersPercentage || 0}%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Job Status Distribution</CardTitle>
          <CardDescription>Breakdown of all jobs by status</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={jobStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {jobStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};