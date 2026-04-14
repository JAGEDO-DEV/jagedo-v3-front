import React, { useState, useEffect } from "react";
import axios from "axios";
import { format, subDays } from "date-fns";
import { DateRange } from "react-day-picker";
import reportsApi, { ReportFilters } from "@/api/reports.api";
import { 
  Briefcase, FileText, CheckCircle2, Gavel, PlayCircle, Clock,
  Calendar as CalendarIcon, Download 
} from "lucide-react";

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

export default function JobsReports() {
  const axiosInstance = axios;
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  // Filters state
  const [period, setPeriod] = useState("30d");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date()
  });
  const [compareMode, setCompareMode] = useState(false);
  const [activeMetric, setActiveMetric] = useState("total");
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

  const handleMetricClick = (metricId: string) => {
    setActiveMetric(metricId);
    if (metricId === "total") setStatusFilter(null);
    else setStatusFilter(metricId.toUpperCase());
  };

  // Top metrics row
  const metricsRow1 = [
    { id: "total", title: "Total Jobs", icon: <Briefcase className="h-5 w-5" />, value: data?.summary?.totalJobs || 0 },
    { id: "new", title: "New", icon: <FileText className="h-5 w-5" />, value: data?.summary?.new || 0 },
    { id: "drafts", title: "Drafts", icon: <CheckCircle2 className="h-5 w-5" />, value: data?.summary?.drafts || 0 },
    { id: "bids", title: "Bids", icon: <Gavel className="h-5 w-5" />, value: data?.summary?.bids || 0 },
    { id: "active", title: "Active", icon: <PlayCircle className="h-5 w-5" />, value: data?.summary?.active || 0 },
    { id: "past", title: "Past", icon: <Briefcase className="h-5 w-5" />, value: data?.summary?.past || 0 },
  ];

  // Requested Jobs row
  const requestedJobs = [
    { id: "fundi", title: "Fundi Jobs Requested", value: data?.summary?.fundi || 0 },
    { id: "professional", title: "Professional Jobs Requested", value: data?.summary?.professional || 0 },
    { id: "contractor", title: "Contractor Jobs Requested", value: data?.summary?.contractor || 0 },
  ];

  // Most requested services mock
  const servicesFundi = data?.summary?.servicesFundi || [
    { name: "electrician", count: 3 },
    { name: "mason", count: 3 },
    { name: "painter", count: 3 },
    { name: "fitter", count: 1 },
    { name: "foreman", count: 1 }
  ];
  
  const servicesProfessional = data?.summary?.servicesProfessional || [
    { name: "Architect", count: 4 },
    { name: "Electrical Engineer", count: 1 }
  ];

  const servicesContractor = data?.summary?.servicesContractor || [
    { name: "road-works", count: 2 }
  ];

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Header */}
      <div className="mb-2">
        <h2 className="text-2xl font-bold tracking-tight text-[#30336b]">System Reports</h2>
        <p className="text-sm text-gray-500 mt-1">Operational + lifecycle reports (auto-refresh every 30 seconds)</p>
      </div>

      {/* Tab Header Indicator */}
      <div className="flex items-center space-x-3 bg-white px-5 py-4 border border-gray-100 rounded-xl shadow-sm w-full relative">
        <Briefcase className="text-indigo-600 h-5 w-5" />
        <span className="font-semibold text-gray-800 text-[15px]">Jobs Register Snapshot</span>
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
        <h3 className="text-indigo-600 font-medium text-[15px] mb-6">Jobs Register Snapshot</h3>

        {/* Row 1: Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-4">
          {metricsRow1.map((metric) => {
            const isActive = activeMetric === metric.id;
            return (
              <div 
                key={metric.id}
                className={`border rounded-xl p-4 flex flex-col justify-between cursor-pointer transition-all duration-200 ${
                  isActive 
                  ? 'border-indigo-500 ring-1 ring-indigo-500 bg-white shadow-sm' 
                  : 'border-gray-200 bg-white hover:border-indigo-300 hover:shadow-sm'
                }`}
                onClick={() => handleMetricClick(metric.id)}
              >
                <div className="flex justify-between items-start mb-3">
                  <span className={`text-[13px] ${isActive ? 'text-gray-800 font-medium' : 'text-gray-500 font-medium'}`}>
                    {metric.title}
                  </span>
                  <div className={isActive ? "text-indigo-600 flex-shrink-0 ml-1" : "text-indigo-500 flex-shrink-0 ml-1"}>
                    {metric.icon}
                  </div>
                </div>
                <div className={`text-2xl font-bold tracking-tight ${isActive ? 'text-indigo-700' : 'text-[#30336b]'}`}>
                  {loading ? "-" : metric.value}
                </div>
              </div>
            );
          })}
        </div>

        {/* Row 2: Jobs Requested */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          {requestedJobs.map((metric) => (
            <div 
              key={metric.id}
              className="bg-[#f0f2f9] border border-[#e1e5f2] rounded-xl p-4 cursor-pointer hover:bg-[#e8ebf7] transition-colors"
            >
              <div className="text-[13px] text-gray-600 font-medium mb-1">{metric.title}</div>
              <div className="text-[22px] font-bold text-[#30336b] mb-3">{loading ? "-" : metric.value}</div>
              <div className="text-[12px] text-indigo-500 font-medium hover:underline">Click to view register details</div>
            </div>
          ))}
        </div>

        {/* Row 3: Most Requested Services */}
        <div className="border border-gray-100 rounded-xl p-5 mb-8">
          <h4 className="text-[14px] font-medium text-gray-800 mb-4">Most Requested Services by Job Type</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Top Fundi */}
            <div className="border border-gray-200 rounded-xl p-4 bg-white hover:shadow-sm transition-shadow">
              <h5 className="text-[13px] font-medium text-gray-800 mb-3">Top Fundi Services</h5>
              <div className="space-y-2 mb-4">
                {servicesFundi.map((s: any, i: number) => (
                  <div key={i} className="flex justify-between items-center bg-gray-50/50 px-2.5 py-1.5 rounded-md">
                    <span className="text-[13px] text-gray-600 capitalize">{s.name}</span>
                    <span className="text-[13px] font-medium text-gray-800">{s.count}</span>
                  </div>
                ))}
              </div>
              <div className="text-[12px] text-indigo-500 font-medium cursor-pointer hover:underline">Click to view full register details</div>
            </div>

            {/* Top Professional */}
            <div className="border border-gray-200 rounded-xl p-4 bg-white hover:shadow-sm transition-shadow">
              <h5 className="text-[13px] font-medium text-gray-800 mb-3">Top Professional Services</h5>
              <div className="space-y-2 mb-4">
                {servicesProfessional.map((s: any, i: number) => (
                  <div key={i} className="flex justify-between items-center bg-gray-50/50 px-2.5 py-1.5 rounded-md">
                    <span className="text-[13px] text-gray-600 capitalize">{s.name}</span>
                    <span className="text-[13px] font-medium text-gray-800">{s.count}</span>
                  </div>
                ))}
              </div>
              <div className="text-[12px] text-indigo-500 font-medium cursor-pointer hover:underline mt-auto">Click to view full register details</div>
            </div>

            {/* Top Contractor */}
            <div className="border border-gray-200 rounded-xl p-4 bg-white hover:shadow-sm transition-shadow">
              <h5 className="text-[13px] font-medium text-gray-800 mb-3">Top Contractor Services</h5>
              <div className="space-y-2 mb-4">
                {servicesContractor.map((s: any, i: number) => (
                  <div key={i} className="flex justify-between items-center bg-gray-50/50 px-2.5 py-1.5 rounded-md">
                    <span className="text-[13px] text-gray-600 capitalize">{s.name}</span>
                    <span className="text-[13px] font-medium text-gray-800">{s.count}</span>
                  </div>
                ))}
              </div>
              <div className="text-[12px] text-indigo-500 font-medium cursor-pointer hover:underline mt-auto">Click to view full register details</div>
            </div>

          </div>
        </div>
        
        {/* Helper Footer text matching image */}
        <div className="border-t border-[#eaf0f6] pt-4 mt-2">
           <p className="text-[12px] text-indigo-500 font-medium">Select any card to view job register details</p>
        </div>

        {/* Existing table that should display jobs when a user wants to view them */}
        <div className="mt-8 border rounded-xl overflow-hidden">
           <Table>
             <TableHeader className="bg-gray-50/50">
               <TableRow>
                 <TableHead className="text-gray-500 font-medium h-10 w-24">Job ID</TableHead>
                 <TableHead className="text-gray-500 font-medium h-10">Customer</TableHead>
                 <TableHead className="text-gray-500 font-medium h-10">Provider</TableHead>
                 <TableHead className="text-gray-500 font-medium h-10">Type</TableHead>
                 <TableHead className="text-gray-500 font-medium h-10">Sub-Type</TableHead>
                 <TableHead className="text-gray-500 font-medium h-10">Status</TableHead>
                 <TableHead className="text-gray-500 font-medium h-10">Created</TableHead>
               </TableRow>
             </TableHeader>
             <TableBody>
               {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-gray-500">
                      <span className="flex items-center justify-center">Loading Data...</span>
                    </TableCell>
                  </TableRow>
               ) : data?.register?.data?.map((job: any) => (
                 <TableRow key={job.id} className="hover:bg-gray-50/50">
                   <TableCell className="font-mono text-xs text-gray-600">{job.jobId}</TableCell>
                   <TableCell className="text-sm font-medium text-gray-900">
                     {job.usersCustomer ? `${job.usersCustomer.firstName} ${job.usersCustomer.lastName}` : "--"}
                   </TableCell>
                   <TableCell className="text-sm text-gray-700">
                     {job.usersServiceProvider ? (job.usersServiceProvider.organizationName || job.usersServiceProvider.firstName) : <span className="text-gray-400 italic">Unassigned</span>}
                   </TableCell>
                   <TableCell className="text-sm text-gray-600 capitalize">
                     {job.jobType?.toLowerCase()}
                   </TableCell>
                   <TableCell className="text-sm text-gray-600 capitalize">
                     {job.skill?.toLowerCase()}
                   </TableCell>
                   <TableCell>
                     <Badge variant={job.status === "ACTIVE" ? "success" : "secondary"}>
                       {job.status}
                     </Badge>
                   </TableCell>
                   <TableCell className="text-xs text-gray-500">
                     {format(new Date(job.createdAt), "MMM dd, yyyy")}
                   </TableCell>
                 </TableRow>
               ))}
               {(!loading && (!data?.register?.data || data.register.data.length === 0)) && (
                 <TableRow>
                   <TableCell colSpan={7} className="h-32 text-center text-gray-500">
                     No jobs found for the selected period.
                   </TableCell>
                 </TableRow>
               )}
             </TableBody>
           </Table>
        </div>

      </div>
    </div>
  );
}
