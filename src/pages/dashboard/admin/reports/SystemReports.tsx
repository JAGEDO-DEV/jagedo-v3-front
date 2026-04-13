import React, { useState, useEffect } from "react";
import axios from "axios";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import reportsApi, { ReportFilters } from "@/api/reports.api";
import { ReportsLayout, MetricCardConfig } from "./ReportsLayout";
import { Users, HardHat, Hammer, Shield } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function SystemReports() {
  const axiosInstance = axios;
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  // Filters state
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [compareMode, setCompareMode] = useState(false);

  useEffect(() => {
    fetchReport();
  }, [dateRange, compareMode]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const filters: ReportFilters = {};
      if (dateRange?.from) filters.startDate = dateRange.from.toISOString();
      if (dateRange?.to) filters.endDate = dateRange.to.toISOString();
      if (compareMode) filters.compare = true;

      const res = await reportsApi.getSystemReport(axiosInstance, filters);
      setData(res.data);
    } catch (error) {
      console.error("Failed to fetch system report:", error);
    } finally {
      setLoading(false);
    }
  };

  const metrics: MetricCardConfig[] = data
    ? [
        {
          id: "total",
          title: "Total Users",
          value: data.summary.totalUsers,
          change: data.comparison?.totalUsers?.change,
          previousValue: data.comparison?.totalUsers?.previous,
          icon: <Users size={20} />,
        },
        {
          id: "customers",
          title: "Customers",
          value: data.summary.customers,
          change: data.comparison?.customers?.change,
          previousValue: data.comparison?.customers?.previous,
          icon: <Users size={20} />,
        },
        {
          id: "builders",
          title: "Builder Accounts",
          value: data.summary.builders,
          change: data.comparison?.builders?.change,
          previousValue: data.comparison?.builders?.previous,
          icon: <HardHat size={20} />,
        },
        {
          id: "hardware",
          title: "Hardware Stores",
          value: data.summary.hardware,
          change: data.comparison?.hardware?.change,
          previousValue: data.comparison?.hardware?.previous,
          icon: <Hammer size={20} />,
        },
      ]
    : [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "VERIFIED":
      case "COMPLETE":
        return "success";
      case "SUSPENDED":
      case "BLACKLISTED":
      case "DELETED":
        return "destructive";
      case "PENDING":
        return "warning";
      default:
        return "secondary";
    }
  };

  return (
    <ReportsLayout
      title="System Snapshot"
      description="Overview of user registrations, accounts distribution, and platform growth."
      dateRange={dateRange}
      onDateRangeChange={setDateRange}
      compareMode={compareMode}
      onCompareModeChange={setCompareMode}
      metrics={metrics}
      loading={loading}
    >
      <div className="p-5 overflow-x-auto">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Registration Register</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Account Status</TableHead>
              <TableHead>Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.register?.data?.map((user: any) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">
                  {user.firstName} {user.lastName}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs uppercase tracking-wider">
                    {user.userType}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="text-sm font-medium">{user.email}</div>
                  <div className="text-xs text-gray-500">{user.phone}</div>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusColor(user.status)}>
                    {user.status || "UNKNOWN"}
                  </Badge>
                </TableCell>
                <TableCell>{format(new Date(user.createdAt), "MMM dd, yyyy")}</TableCell>
              </TableRow>
            ))}
            {(!data?.register?.data || data.register.data.length === 0) && !loading && (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-gray-500">
                  No registrations found for the selected period.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </ReportsLayout>
  );
}
