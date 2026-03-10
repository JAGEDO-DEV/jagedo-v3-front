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
import useAxiosWithAuth from "@/utils/axiosInterceptor";
import { getCategoryPerformance, getMostViewedProducts, getProductApprovalRejection, getProductUploadTrends, getSupplierActivity } from "@/api/analytics.api";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FF6B6B', '#4ECDC4'];
// product analytics
export const ProductSection: React.FC<{ timePeriod: string }> = ({ timePeriod }) => {
  const axiosInstance = useAxiosWithAuth(import.meta.env.VITE_SERVER_URL);
  const [uploadTrends, setUploadTrends] = useState<any[]>([]);
  const [approvalStats, setApprovalStats] = useState<{ approved: number; rejected: number }>({ approved: 0, rejected: 0 });
  const [categoryPerformance, setCategoryPerformance] = useState<any[]>([]);
  const [supplierActivity, setSupplierActivity] = useState<any[]>([]);
  const [mostViewedProducts, setMostViewedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        setError(null);
        const period = timePeriod !== 'All' ? timePeriod : undefined;
        const [tr, ap, cp, sa, mvp] = await Promise.all([
          getProductUploadTrends(axiosInstance, period),
          getProductApprovalRejection(axiosInstance, period),
          getCategoryPerformance(axiosInstance, period),
          getSupplierActivity(axiosInstance, period),
          getMostViewedProducts(axiosInstance, period),
        ]);
        setUploadTrends(tr.data.trends || []);
        const toNumber = (value: any) => {
          const parsed = Number(value);
          return Number.isFinite(parsed) ? parsed : 0;
        };
        const approved = toNumber(
          ap.data?.approved ?? ap.data?.approvedCount ?? ap.data?.approved_count ?? ap.data?.totalApproved ?? ap.data?.total_approved
        );
        const rejected = toNumber(
          ap.data?.rejected ?? ap.data?.rejectedCount ?? ap.data?.rejected_count ?? ap.data?.totalRejected ?? ap.data?.total_rejected
        );
        setApprovalStats({ approved, rejected });
        setCategoryPerformance(cp.data.categories || []);
        setSupplierActivity(sa.data.suppliers || []);
        setMostViewedProducts(mvp.data.products || []);
      } catch (e: any) {
        console.error('Error loading product analytics', e);
        setError(e.message || 'Failed to load product analytics');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [timePeriod, axiosInstance]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading product analytics...</div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-red-500 text-lg">Error: {error}</div>
      </div>
    );
  }

  const approvalChartData = [
    { label: "Approved", value: approvalStats.approved },
    { label: "Rejected", value: approvalStats.rejected },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Product Analytics</h2>
      <Card>
        <CardHeader>
          <CardTitle>Upload Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={uploadTrends}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#3b82f6" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Approval / Rejection</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={approvalChartData} dataKey="value" nameKey="label" outerRadius={80}>
                {approvalChartData.map((entry, index) => (
                  <Cell key={entry.label} fill={index === 0 ? "#10b981" : "#ef4444"} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Category Performance</CardTitle>
          <CardDescription>Number of products by category</CardDescription>
        </CardHeader>
        <CardContent>
          {categoryPerformance.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center text-gray-500 py-8">No category data available</div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Supplier Activity Performance</CardTitle>
          <CardDescription>Top suppliers by product uploads</CardDescription>
        </CardHeader>
        <CardContent>
          {supplierActivity.length > 0 ? (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b">
                    <tr>
                      <th className="text-left py-2">Supplier ID</th>
                      <th className="text-right py-2">Products</th>
                    </tr>
                  </thead>
                  <tbody>
                    {supplierActivity.slice(0, 10).map((supplier, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-2">{supplier.sellerId}</td>
                        <td className="text-right">{supplier.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">No supplier data available</div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Most Viewed Products</CardTitle>
          <CardDescription>Top 10 products by view count</CardDescription>
        </CardHeader>
        <CardContent>
          {mostViewedProducts.length > 0 ? (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b">
                    <tr>
                      <th className="text-left py-2">Product ID</th>
                      <th className="text-right py-2">Views</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mostViewedProducts.map((product, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-2">{product.productId}</td>
                        <td className="text-right">{product.views}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">No view data available</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
