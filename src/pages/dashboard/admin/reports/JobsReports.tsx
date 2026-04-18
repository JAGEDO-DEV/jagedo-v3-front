import React, { useState, useEffect } from "react";
import axios from "axios";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { DateRange } from "react-day-picker";
import { 
  Briefcase, FileText, ShieldCheck, Gavel, PlayCircle, Download, Calendar as CalendarIcon, ChevronLeft, ChevronRight 
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import reportsApi, { ReportFilters } from "@/api/reports.api";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";

export default function JobsReports() {
  const navigate = useNavigate();
  const axiosInstance = axios;
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  // Date Filters state
  const [period, setPeriod] = useState("90d");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 90),
    to: new Date()
  });
  const [compareMode, setCompareMode] = useState(false);

  // Navigation states
  const [activeCard, setActiveCard] = useState<string | null>(null);

  // Register Filters state
  const [jobTypeFilter, setJobTypeFilter] = useState("ALL");
  const [managedByFilter, setManagedByFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const limit = 20;

  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line
  }, [dateRange, compareMode, activeCard, jobTypeFilter, managedByFilter, page, searchQuery]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const filters: any = {
        page,
        limit,
      };

      if (dateRange?.from) filters.startDate = startOfDay(dateRange.from).toISOString();
      if (dateRange?.to) filters.endDate = endOfDay(dateRange.to).toISOString();
      if (compareMode) filters.compare = 'true';
      if (searchQuery.trim()) filters.search = searchQuery.trim();

      // Bind dynamic filters based on active card and dropdowns
      if (activeCard) {
        if (activeCard === "JOBS_NEW") filters.lifecycleFilter = "new";
        if (activeCard === "JOBS_DRAFT") filters.lifecycleFilter = "draft";
        if (activeCard === "JOBS_BID") filters.lifecycleFilter = "bid";
        if (activeCard === "JOBS_ACTIVE") filters.lifecycleFilter = "active";
        if (activeCard === "JOBS_PAST") filters.lifecycleFilter = "past";
      }

      if (jobTypeFilter !== "ALL") filters.jobTypeFilter = jobTypeFilter;
      if (managedByFilter !== "ALL") filters.managedByFilter = managedByFilter;

      const res = await reportsApi.getJobsReport(axiosInstance, filters as ReportFilters);
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
      case '60d': from = subDays(to, 60); break;
      case '90d': from = subDays(to, 90); break;
      case 'Year': from = subDays(to, 365); break;
      case 'Custom': return; 
    }
    setDateRange({ from, to });
    setPage(1);
  };

  const onExportJobs = () => {
    if (!data?.register?.data || data.register.data.length === 0) return;
    const headers = ["#", "Job ID", "Job Type", "Skill", "Location", "Managed By", "Status", "Stage", "Created At"];
    const csvContent = data.register.data.map((row: any, idx: number) => 
      [
        idx + 1, 
        row.jobId || row.id, 
        row.jobType || row.category || "N/A", 
        row.skill || "N/A", 
        row.location || "N/A", 
        row.managedBy || row.orderType || row.type || "N/A", 
        row.status || "N/A", 
        row.stage || "N/A", 
        format(new Date(row.createdAt || new Date()), "MMM dd, yyyy")
      ]
      .map((v: any) => `"${String(v || "").replace(/"/g, '""')}"`).join(",")
    );
    const csv = [headers.join(","), ...csvContent].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `jobs_report_${activeCard || 'total'}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  const onRowClick = (row: any) => {
    const id = row?.id;
    if (!id) return;
    navigate(`/dashboard/admin/jobs/${id}`, {
      state: {
        returnTo: "/dashboard/admin/reports?section=jobs",
        returnLabel: "Back to Reports Register",
      },
    });
  };

  const cards = [
    { key: "JOBS_TOTAL", title: "Total Jobs", value: data?.summary?.totalJobs || 0, icon: Briefcase },
    { key: "JOBS_NEW", title: "New", value: data?.summary?.new || 0, icon: FileText },
    { key: "JOBS_DRAFT", title: "Drafts", value: data?.summary?.drafts || 0, icon: ShieldCheck },
    { key: "JOBS_BID", title: "Bids", value: data?.summary?.bids || 0, icon: Gavel },
    { key: "JOBS_ACTIVE", title: "Active", value: data?.summary?.active || 0, icon: PlayCircle },
    { key: "JOBS_PAST", title: "Past", value: data?.summary?.past || 0, icon: Briefcase },
  ];

  // We rely on backend summary maps if present, else fallback to 0/empty
  const byJobType = {
    FUNDI: data?.summary?.fundi || 0,
    PROFESSIONAL: data?.summary?.professional || 0,
    CONTRACTOR: data?.summary?.contractor || 0,
    HARDWARE: data?.summary?.hardware || 0,
  };

  const byManagedBy = {
    JAGEDO: data?.summary?.managedByJagedo || 0,
    SELF: data?.summary?.managedBySelf || 0,
    BUILDER: data?.summary?.managedByBuilder || 0,
  };

  // Pagination meta
  const totalPages = data?.register?.pagination?.totalPages || 1;
  const isFirstPage = page <= 1;
  const isLastPage = page >= totalPages;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-indigo-800">Jobs Reports</h1>
        <p className="text-sm text-gray-500">Service requests, professional jobs, and project reports</p>
      </div>

      {/* Date Range Block */}
      <div className="bg-white rounded-xl border border-indigo-100 p-6">
        <div className="flex items-center justify-between gap-4 mb-3">
          <h2 className="text-[16px] font-semibold text-indigo-700">Date Range</h2>
          {compareMode && (
            <span className="text-xs text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-full px-3 py-1">
              Comparison enabled
            </span>
          )}
        </div>
        
        <div className="flex flex-wrap md:flex-nowrap items-center gap-4">
          <div className="flex items-center space-x-2">
            {['Today', '7d', '30d', '60d', '90d', 'Year', 'Custom'].map(p => (
              <Button
                key={p}
                variant="outline"
                size="sm"
                className={`h-9 px-4 text-sm font-normal rounded-md transition-colors ${
                  period === p 
                  ? "border-indigo-400 text-indigo-700 bg-indigo-50/70" 
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
                <div className="flex items-center justify-between border border-gray-200 rounded-md px-3 h-9 w-[130px] cursor-pointer bg-white hover:border-gray-300">
                  <span className="text-sm text-gray-600">{dateRange?.from ? format(dateRange.from, "MM/dd/yyyy") : "Start Date"}</span>
                  <CalendarIcon className="h-4 w-4 text-gray-400" />
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={dateRange?.from} onSelect={(d) => { if(d) { setDateRange(prev => ({...prev, from: d})); setPeriod('Custom'); } }} initialFocus />
              </PopoverContent>
            </Popover>

            <span className="text-sm text-gray-400">to</span>

            <Popover>
              <PopoverTrigger asChild>
                <div className="flex items-center justify-between border border-gray-200 rounded-md px-3 h-9 w-[130px] cursor-pointer bg-white hover:border-gray-300">
                  <span className="text-sm text-gray-600">{dateRange?.to ? format(dateRange.to, "MM/dd/yyyy") : "End Date"}</span>
                  <CalendarIcon className="h-4 w-4 text-gray-400" />
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={dateRange?.to} onSelect={(d) => { if(d) { setDateRange(prev => ({...prev, to: d})); setPeriod('Custom'); } }} initialFocus />
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
            <label htmlFor="compare" className="text-[13px] text-gray-600 font-normal cursor-pointer">
              Compare to previous period
            </label>
          </div>
        </div>
      </div>

      {/* Jobs Register Snapshot */}
      <div className="bg-white rounded-xl border border-indigo-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[16px] font-semibold text-indigo-700">Jobs Register Snapshot</h2>
          {activeCard && (
            <button
              onClick={onExportJobs}
              className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded text-[13px] font-medium hover:bg-indigo-700 transition"
            >
              <Download size={16} />
              Export Register CSV
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-5">
          {cards.map((card) => (
            <button
              type="button"
              key={card.key}
              onClick={() => {
                setActiveCard(card.key);
                setJobTypeFilter("ALL"); // Reset inner filters
                setManagedByFilter("ALL");
                setPage(1);
              }}
              className={`bg-white border rounded-xl shadow-sm p-4 text-left transition ${
                activeCard === card.key ? "border-indigo-600 ring-2 ring-indigo-200" : "hover:border-gray-300"
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <p className="text-[12.5px] text-gray-500 font-medium">{card.title}</p>
                <card.icon className="text-indigo-600 h-[18px] w-[18px]" />
              </div>
              <p className="text-[22px] font-bold text-indigo-700 mt-1">
                {loading ? "..." : card.value}
              </p>
            </button>
          ))}
        </div>

        {!activeCard ? (
          <div className="rounded-lg border border-dashed border-indigo-200 bg-indigo-50/40 p-4 text-sm text-indigo-700 font-medium mt-6">
            Select any card to view job register details.
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3 mb-4 mt-6 border-t border-gray-100 pt-5">
              <p className="text-sm font-medium text-gray-700">
                Viewing: {cards.find((item) => item.key === activeCard)?.title || "Register"}
              </p>
              <button
                type="button"
                onClick={() => setActiveCard(null)}
                className="px-3 py-[6px] rounded border border-gray-200 text-[13px] font-medium text-gray-600 hover:bg-gray-50 transition"
              >
                Close Register
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-4">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <p className="text-xs text-gray-500 mb-1">Job Types (in range)</p>
                <p className="text-[13px] text-gray-700">
                  Fundi: <span className="font-semibold">{loading ? "-" : byJobType.FUNDI}</span> | Professional:{" "}
                  <span className="font-semibold">{loading ? "-" : byJobType.PROFESSIONAL}</span> | Contractor:{" "}
                  <span className="font-semibold">{loading ? "-" : byJobType.CONTRACTOR}</span> | Hardware:{" "}
                  <span className="font-semibold">{loading ? "-" : byJobType.HARDWARE}</span>
                </p>
              </div>

              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <p className="text-xs text-gray-500 mb-1">Managed By (in range)</p>
                <p className="text-[13px] text-gray-700">
                  JaGedo: <span className="font-semibold">{loading ? "-" : byManagedBy.JAGEDO}</span> | Self:{" "}
                  <span className="font-semibold">{loading ? "-" : byManagedBy.SELF}</span> | Builder:{" "}
                  <span className="font-semibold">{loading ? "-" : byManagedBy.BUILDER}</span>
                </p>
              </div>

              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <p className="text-xs text-gray-500 mb-1">Search</p>
                <input
                  value={searchQuery}
                  onChange={(event) => { setSearchQuery(event.target.value); setPage(1); }}
                  placeholder="Search jobId, skill, location..."
                  className="w-full border border-gray-200 rounded px-3 h-[28px] text-[13px] bg-white focus:outline-none focus:border-indigo-400"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-5">
              <select
                value={jobTypeFilter}
                onChange={(event) => { setJobTypeFilter(event.target.value); setPage(1); }}
                className="border border-gray-200 rounded px-3 h-[36px] text-[13px] bg-white text-gray-700 focus:outline-none focus:border-indigo-400"
              >
                <option value="ALL">All Job Types</option>
                <option value="FUNDI">Fundi</option>
                <option value="PROFESSIONAL">Professional</option>
                <option value="CONTRACTOR">Contractor</option>
                <option value="HARDWARE">Hardware</option>
              </select>

              <select
                value={managedByFilter}
                onChange={(event) => { setManagedByFilter(event.target.value); setPage(1); }}
                className="border border-gray-200 rounded px-3 h-[36px] text-[13px] bg-white text-gray-700 focus:outline-none focus:border-indigo-400"
              >
                <option value="ALL">All Managed By</option>
                <option value="JAGEDO">JaGedo</option>
                <option value="SELF">Self</option>
                <option value="BUILDER">Builder</option>
              </select>
            </div>

            {/* Register Table */}
            <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
              <table className="min-w-full bg-white text-sm">
                <thead className="bg-[#f8f9fa] border-b text-gray-600">
                  <tr>
                    <th className="px-4 py-3 text-left text-[13px] font-semibold whitespace-nowrap">#</th>
                    <th className="px-4 py-3 text-left text-[13px] font-semibold whitespace-nowrap">Job ID</th>
                    <th className="px-4 py-3 text-left text-[13px] font-semibold whitespace-nowrap">Job Type</th>
                    <th className="px-4 py-3 text-left text-[13px] font-semibold whitespace-nowrap">Skill</th>
                    <th className="px-4 py-3 text-left text-[13px] font-semibold whitespace-nowrap">Location</th>
                    <th className="px-4 py-3 text-left text-[13px] font-semibold whitespace-nowrap">Managed By</th>
                    <th className="px-4 py-3 text-left text-[13px] font-semibold whitespace-nowrap">Status</th>
                    <th className="px-4 py-3 text-left text-[13px] font-semibold whitespace-nowrap">Stage</th>
                    <th className="px-4 py-3 text-left text-[13px] font-semibold whitespace-nowrap">Created At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="text-center py-10 text-gray-400 font-medium">
                        Loading Records...
                      </td>
                    </tr>
                  ) : data?.register?.data?.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-10 text-gray-400 font-medium">
                        No jobs match current filters.
                      </td>
                    </tr>
                  ) : (
                    data?.register?.data?.map((row: any, idx: number) => (
                      <tr
                        key={`${row.id}-${idx}`}
                        className="hover:bg-indigo-50/40 cursor-pointer transition-colors"
                        onClick={() => onRowClick(row)}
                      >
                        <td className="px-4 py-2.5 text-gray-500">{((page - 1) * limit) + idx + 1}</td>
                        <td className="px-4 py-2.5 text-gray-900 font-medium font-mono text-[12.5px]">{row.jobId || row.id}</td>
                        <td className="px-4 py-2.5 text-gray-600 capitalize">{row.jobType || row.category || "N/A"}</td>
                        <td className="px-4 py-2.5 text-gray-600 capitalize">{row.skill || "N/A"}</td>
                        <td className="px-4 py-2.5 text-gray-600">{row.location || "N/A"}</td>
                        <td className="px-4 py-2.5">
                           <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                             {row.managedBy || row.orderType || row.type || "N/A"}
                           </span>
                        </td>
                        <td className="px-4 py-2.5 text-gray-600 capitalize">{row.status || "N/A"}</td>
                        <td className="px-4 py-2.5 text-gray-600 capitalize">{row.stage || "N/A"}</td>
                        <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap">{format(new Date(row.createdAt || new Date()), "MMM dd, yyyy")}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Wrapper */}
            {data?.register?.pagination && data.register.pagination.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-100 mt-4 pt-4">
                <p className="text-[13px] text-gray-500">
                  Showing <span className="font-medium text-gray-800">{((page - 1) * limit) + 1}</span> to <span className="font-medium text-gray-800">{Math.min(page * limit, data.register.pagination.total)}</span> of <span className="font-medium text-gray-800">{data.register.pagination.total}</span> records
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isFirstPage || loading}
                    onClick={() => setPage(page - 1)}
                    className="h-8 px-3 text-[13px]"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" /> Prev
                  </Button>
                  <span className="text-[13px] text-gray-600 px-2 font-medium">Page {page} of {totalPages}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isLastPage || loading}
                    onClick={() => setPage(page + 1)}
                    className="h-8 px-3 text-[13px]"
                  >
                    Next <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
