import React, { useState, useEffect } from "react";
import axios from "axios";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import reportsApi, { ReportFilters } from "@/api/reports.api";
import { ReportsLayout, MetricCardConfig } from "./ReportsLayout";
import { Briefcase, Activity, FileCheck, CopyPlus } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function JobsReports() {
  const axiosInstance = axios;
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  // Filters state
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [compareMode, setCompareMode] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  useEffect(() => {
    fetchReport();
  }, [dateRange, compareMode, statusFilter]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const filters: ReportFilters = {};
      if (dateRange?.from) filters.startDate = dateRange.from.toISOString();
      if (dateRange?.to) filters.endDate = dateRange.to.toISOString();
      if (compareMode) filters.compare = true;
      if (statusFilter) filters.status = statusFilter;

      const res = await reportsApi.getJobsReport(axiosInstance, filters);
      setData(res.data);
    } catch (error) {
      console.error("Failed to fetch jobs report:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMetricClick = (metric: MetricCardConfig) => {
    if (metric.id === "total") setStatusFilter(null);
    else setStatusFilter(metric.id.toUpperCase());
  };

  const metrics: MetricCardConfig[] = data
    ? [
        {
          id: "total",
          title: "Total Jobs",
          value: data.summary.totalJobs,
          change: data.comparison?.totalJobs?.change,
          previousValue: data.comparison?.totalJobs?.previous,
          icon: <Briefcase size={20} />,
          isActive: statusFilter === null,
        },
        {
          id: "new",
          title: "New Jobs",
          value: data.summary.new,
          change: data.comparison?.new?.change,
          previousValue: data.comparison?.new?.previous,
          icon: <CopyPlus size={20} />,
          isActive: statusFilter === "NEW",
        },
        {
          id: "active",
          title: "Active Jobs",
          value: data.summary.active,
          change: data.comparison?.active?.change,
          previousValue: data.comparison?.active?.previous,
          icon: <Activity size={20} />,
          isActive: statusFilter === "ACTIVE",
        },
        {
          id: "past",
          title: "Past Jobs",
          value: data.summary.past,
          change: data.comparison?.past?.change,
          previousValue: data.comparison?.past?.previous,
          icon: <FileCheck size={20} />,
          isActive: statusFilter === "PAST",
        },
      ]
    : [];

  return (
    <ReportsLayout
      title="Jobs Snapshot"
      description="Track job requests, ongoing service allocations, and historical service fulfillment."
      dateRange={dateRange}
      onDateRangeChange={setDateRange}
      compareMode={compareMode}
      onCompareModeChange={setCompareMode}
      metrics={metrics}
      onMetricClick={handleMetricClick}
      loading={loading}
    >
      <div className="p-5 overflow-x-auto">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">
          Jobs Register {statusFilter ? `(${statusFilter})` : ""}
        </h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Job ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Sub-Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.register?.data?.map((job: any) => (
              <TableRow key={job.id}>
                <TableCell className="font-mono text-sm">{job.jobId}</TableCell>
                <TableCell>
                  {job.usersCustomer ? (
                    <div className="text-sm">
                      {job.usersCustomer.firstName} {job.usersCustomer.lastName}
                    </div>
                  ) : (
                    "--"
                  )}
                </TableCell>
                <TableCell>
                  {job.usersServiceProvider ? (
                    <div className="text-sm">
                      {job.usersServiceProvider.organizationName ||
                        job.usersServiceProvider.firstName}
                    </div>
                  ) : (
                    <span className="text-gray-400">Unassigned</span>
                  )}
                </TableCell>
                <TableCell>
                  <span className="capitalize">{job.jobType?.toLowerCase()}</span>
                </TableCell>
                <TableCell>
                  <span className="capitalize">{job.skill?.toLowerCase()}</span>
                </TableCell>
                <TableCell>
                  <Badge variant={job.status === "ACTIVE" ? "success" : "secondary"}>
                    {job.status}
                  </Badge>
                </TableCell>
                <TableCell>{format(new Date(job.createdAt), "MMM dd, yyyy")}</TableCell>
              </TableRow>
            ))}
            {(!data?.register?.data || data.register.data.length === 0) && !loading && (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-gray-500">
                  No jobs found for the selected period.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </ReportsLayout>
  );
}
