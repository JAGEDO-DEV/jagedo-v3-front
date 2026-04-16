import React, { useState, useEffect } from "react";
import axios from "axios";
import { format, subDays } from "date-fns";
import { DateRange } from "react-day-picker";
import reportsApi, { ReportFilters } from "@/api/reports.api";
import { Users, HardHat, Shield, Download, Calendar as CalendarIcon, FileText } from "lucide-react";
import { User } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export default function SystemReports() {
  const axiosInstance = axios;
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  // Filters state
  const [period, setPeriod] = useState("90d");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 90),
    to: new Date()
  });
  const [compareMode, setCompareMode] = useState(false);
  const [activeMetric, setActiveMetric] = useState<string | null>(null);

  useEffect(() => {
    fetchReport();
  }, [dateRange, compareMode, activeMetric]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const filters: ReportFilters = {};
      if (dateRange?.from) filters.startDate = dateRange.from.toISOString();
      if (dateRange?.to) filters.endDate = dateRange.to.toISOString();
      if (compareMode) filters.compare = true;

      // Note: backend may not filter users list by "activeMetric" directly if it's summary based, 
      // but in UI "Viewing: Total Users" implies we can filter what is shown below. 
      // Assuming for now the backend gives `data.register.data`.

      const res = await reportsApi.getSystemReport(axiosInstance, filters);
      setData(res.data);
    } catch (error) {
      console.error("Failed to fetch system report:", error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredUsers = () => {
    let filteredData = data?.register?.data || [];
    if (activeMetric === "builders") {
      filteredData = filteredData.filter((u: any) => ["fundi", "hardware", "contractor", "professional"].includes(u.userType?.toLowerCase()));
    } else if (activeMetric === "customers") {
      filteredData = filteredData.filter((u: any) => ["customer"].includes(u.userType?.toLowerCase()));
    } else if (activeMetric === "admins") {
      filteredData = filteredData.filter((u: any) => ["admin", "superadmin"].includes(u.userType?.toLowerCase()));
    }
    return filteredData;
  };

  const downloadUsersCSV = () => {
    const list = getFilteredUsers();
    if (!list || list.length === 0) return;
    const headers = ["ID", "Name", "Email", "Phone", "User Type", "Status", "Joined"];
    const csvContent = list.map((u: any) => 
      [u.id, `${u.firstName} ${u.lastName}`, u.email, u.phone, u.userType, u.status, format(new Date(u.createdAt), "MMM dd, yyyy")]
        .map(v => `"${String(v || "").replace(/"/g, '""')}"`).join(",")
    );
    const csv = [headers.join(","), ...csvContent].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `users_report_${activeMetric || 'total'}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  const downloadLifecycleCSV = () => {
    if (!data?.breakdowns?.byLifecycle) return;
    const lc = data.breakdowns.byLifecycle;
    const headers = ["Metric", "Count"];
    const rows = [
      ["Signed Up", lc.signedUp || 0],
      ["Incomplete", lc.incomplete || 0],
      ["Complete", lc.complete || 0],
      ["Pending Verification", lc.pendingVerification || 0],
      ["Verified", lc.verified || 0],
      ["Suspended", lc.suspended || 0],
      ["Returned", lc.returned || 0],
      ["Deleted", lc.deleted || 0],
    ];
    const csvContent = rows.map(r => `"${r[0]}",${r[1]}`).join("\n");
    const csv = [headers.join(","), csvContent].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `lifecycle_report_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  const handlePeriodChange = (p: string) => {
    setPeriod(p);
    const to = new Date();
    let from = new Date();
    switch (p) {
      case 'Today': from = new Date(); break;
      case '7d': from = subDays(to, 7); break;
      case '30d': from = subDays(to, 30); break;
      case '90d': from = subDays(to, 90); break;
      case 'Custom': return; // Let the picker handle it
    }
    setDateRange({ from, to });
  };

  const metrics = [
    { id: "total", title: "Total Users", icon: <Users className="h-5 w-5" />, value: data?.summary?.totalUsers || 0 },
    { id: "customers", title: "Customers", icon: <User className="h-5 w-5" />, value: data?.summary?.customers || 0 },
    { id: "builders", title: "Builders", icon: <Shield className="h-5 w-5" />, value: data?.summary?.builders || 0 },
    { id: "admins", title: "Total Admins", icon: <FileText className="h-5 w-5" />, value: data?.summary?.admins || 0 },
  ];

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

  const currentMetric = metrics.find(m => m.id === activeMetric);

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="mb-2">
        <h2 className="text-2xl font-bold tracking-tight text-[#30336b]">System Reports</h2>
        <p className="text-sm text-gray-500 mt-1">Operational + lifecycle reports (auto-refresh every 30 seconds)</p>
      </div>

      {/* Tab Header Indicator */}
      <div className="flex items-center space-x-3 bg-white px-5 py-4 border border-gray-100 rounded-xl shadow-sm w-full relative">
        <Users className="text-indigo-600 h-5 w-5" />
        <span className="font-semibold text-gray-800 text-[15px]">System Register Snapshot</span>
      </div>

      {/* Date Range Block */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6 w-full">
        <h3 className="text-indigo-600 font-medium mb-4 text-sm tracking-wide">Date Range</h3>
        <div className="flex flex-wrap md:flex-nowrap items-center gap-4">
          <div className="flex items-center space-x-2">
            {['Today', '7d', '30d', '90d', 'Custom'].map(p => (
              <Button
                key={p}
                variant="outline"
                size="sm"
                className={`h-9 px-4 text-sm font-normal rounded-md transition-colors ${
                  period === p 
                  ? "border-indigo-200 text-indigo-700 bg-indigo-50/50 hover:bg-indigo-50/80 hover:text-indigo-800" 
                  : "text-gray-600 border-gray-200 hover:bg-gray-50"
                }`}
                onClick={() => handlePeriodChange(p)}
              >
                {p}
              </Button>
            ))}
          </div>
          
          <div className="flex items-center space-x-3 ml-2">
            <Popover>
              <PopoverTrigger asChild>
                <div className="flex items-center justify-between border border-gray-200 rounded-md px-3 h-9 w-[150px] cursor-pointer bg-white hover:border-gray-300 transition-colors">
                  <span className="text-sm text-gray-600">{dateRange?.from ? format(dateRange.from, "MM/dd/yyyy") : "Start Date"}</span>
                  <CalendarIcon className="h-4 w-4 text-gray-900" />
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar 
                  mode="single" 
                  selected={dateRange?.from} 
                  onSelect={(d) => { if(d) { setDateRange(prev => ({...prev, from: d})); setPeriod('Custom'); } }} 
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <span className="text-sm text-gray-400 font-medium">to</span>

            <Popover>
              <PopoverTrigger asChild>
                <div className="flex items-center justify-between border border-gray-200 rounded-md px-3 h-9 w-[150px] cursor-pointer bg-white hover:border-gray-300 transition-colors">
                  <span className="text-sm text-gray-600">{dateRange?.to ? format(dateRange.to, "MM/dd/yyyy") : "End Date"}</span>
                  <CalendarIcon className="h-4 w-4 text-gray-900" />
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar 
                  mode="single" 
                  selected={dateRange?.to} 
                  onSelect={(d) => { if(d) { setDateRange(prev => ({...prev, to: d})); setPeriod('Custom'); } }} 
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex items-center space-x-2 ml-4">
            <Checkbox 
              id="compare" 
              checked={compareMode} 
              onCheckedChange={(e) => setCompareMode(e as boolean)} 
              className="border-gray-300 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
            />
            <label htmlFor="compare" className="text-sm text-gray-600 font-normal cursor-pointer select-none">
              Compare to previous period
            </label>
          </div>
        </div>
      </div>

      {/* Snapshot Cards & Data Block */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6 w-full">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-indigo-600 font-medium text-sm tracking-wide">System Register Snapshot</h3>
          <Button onClick={downloadUsersCSV} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm h-9 px-4">
            <Download className="mr-2 h-4 w-4" /> 
            Export Users CSV
          </Button>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {metrics.map((metric) => {
            const isActive = activeMetric === metric.id;
            return (
              <div 
                key={metric.id}
                className={`border rounded-xl p-5 flex flex-col justify-between cursor-pointer transition-all duration-200 ${
                  isActive 
                  ? 'border-indigo-500 ring-1 ring-indigo-500 bg-white shadow-sm' 
                  : 'border-gray-200 bg-white hover:border-indigo-300 hover:shadow-sm'
                }`}
                onClick={() => setActiveMetric(metric.id)}
              >
                <div className="flex justify-between items-center mb-6">
                  <span className={`text-[15px] ${isActive ? 'text-gray-800 font-medium' : 'text-gray-500 font-medium'}`}>
                    {metric.title}
                  </span>
                  <div className={isActive ? "text-indigo-600" : "text-indigo-500"}>
                    {metric.icon}
                  </div>
                </div>
                <div className={`text-3xl font-bold tracking-tight ${isActive ? 'text-indigo-700' : 'text-[#30336b]'}`}>
                  {loading ? "-" : metric.value}
                </div>
              </div>
            );
          })}
        </div>

        {/* Sub-header above table */}
        {activeMetric && (
          <>
            <div className="flex justify-between items-center pt-2 pb-4">
              <span className="font-medium text-[15px] text-gray-800">
                Viewing: {currentMetric?.title || 'Users'}
              </span>
              <Button variant="outline" size="sm" className="text-gray-600 h-8 px-4 font-normal hover:bg-gray-50" onClick={() => setActiveMetric(null)}>
                Close Register
              </Button>
            </div>
            
            {/* Table Content */}
            <div className="overflow-x-auto border rounded-xl rounded-t-none border-t-0 border-gray-100">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow>
                <TableHead className="text-gray-500 font-medium h-10">User</TableHead>
                <TableHead className="text-gray-500 font-medium h-10">Type</TableHead>
                <TableHead className="text-gray-500 font-medium h-10">Contact</TableHead>
                <TableHead className="text-gray-500 font-medium h-10">Account Status</TableHead>
                <TableHead className="text-gray-500 font-medium h-10">Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                 <TableRow>
                   <TableCell colSpan={5} className="h-32 text-center text-gray-500">
                     <span className="flex items-center justify-center">Loading Data...</span>
                   </TableCell>
                 </TableRow>
              ) : (() => {
                const list = getFilteredUsers();
                return list.map((user: any) => (
                <TableRow key={user.id} className="hover:bg-gray-50/50">
                  <TableCell className="font-medium text-gray-900">
                    {user.firstName} {user.lastName}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs font-medium uppercase tracking-wider text-gray-600 border-gray-200">
                      {user.userType}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium text-gray-800">{user.email}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{user.phone}</div>
                  </TableCell>
                  <TableCell>
                    {/* @ts-ignore */}
                    <Badge variant={getStatusColor(user.status)}>
                      {user.status || "UNKNOWN"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-600 text-sm">
                    {format(new Date(user.createdAt), "MMM dd, yyyy")}
                  </TableCell>
                </TableRow>
              ))})()}
              {(!loading && (!data?.register?.data || data.register.data.length === 0)) && (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-gray-500">
                    No registrations found for the selected period.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        </>
        )}
      </div>

      {/* Lifecycle Dashboard Block */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6 w-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h3 className="text-indigo-700 text-[18px] font-semibold tracking-wide">Lifecycle Dashboard</h3>
            <p className="text-gray-500 text-sm mt-1">Date-filtered lifecycle counts, lifecycle status reports, aging, and verification performance.</p>
          </div>
          <Button onClick={downloadLifecycleCSV} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm h-10 px-5">
            <Download className="mr-2 h-4 w-4" /> 
            Export Lifecycle CSV
          </Button>
        </div>

        {/* Lifecycle Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Signed Up", value: data?.breakdowns?.byLifecycle?.signedUp || 0 },
            { label: "Incomplete", value: data?.breakdowns?.byLifecycle?.incomplete || 0 },
            { label: "Complete", value: data?.breakdowns?.byLifecycle?.complete || 0 },
            { label: "Pending Verification", value: data?.breakdowns?.byLifecycle?.pendingVerification || 0 },
            { label: "Verified", value: data?.breakdowns?.byLifecycle?.verified || 0 },
            { label: "Suspended", value: data?.breakdowns?.byLifecycle?.suspended || 0 },
            { label: "Returned", value: data?.breakdowns?.byLifecycle?.returned || 0 },
            { label: "Deleted", value: data?.breakdowns?.byLifecycle?.deleted || 0 },
          ].map((item, idx) => (
            <div key={idx} className="border border-gray-100 bg-[#fefeff] rounded-xl p-5 shadow-sm hover:border-indigo-100 transition-colors">
              <div className="text-[13.5px] text-gray-500 mb-2">{item.label}</div>
              <div className="text-[26px] font-bold tracking-tight text-indigo-700">
                {loading ? "-" : item.value}
              </div>
            </div>
          ))}
        </div>

        {/* Lifecycle Change Report */}
        <div className="border border-gray-100 rounded-xl p-6 shadow-sm">
          <h4 className="text-[15px] font-semibold text-gray-800 mb-4">Lifecycle Change Report</h4>
          <div className="bg-[#f8f9fa] border border-gray-100 rounded-md p-4 text-[13.5px] text-gray-500">
             Enable date comparison to view lifecycle deltas.
          </div>
        </div>
      </div>

    </div>
  );
}
