import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { DateRange } from "react-day-picker";
import { 
  Users, UserCheck, Shield, FileText, Download, Calendar as CalendarIcon, ChevronLeft, ChevronRight 
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import reportsApi, { ReportFilters } from "@/api/reports.api";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";

const lifecycleLabel = (key: string) => {
  const map: Record<string, string> = {
    signed_up: "Signed Up",
    incomplete: "Incomplete",
    complete: "Complete",
    pending_verification: "Pending Verification",
    verified: "Verified",
    suspended: "Suspended",
    returned: "Returned",
    deleted: "Deleted",
  };
  return map[key] || key;
};

const sourceLabel: Record<string, string> = {
  SOCIAL_MEDIA: "Social Media",
  ADVERTISEMENT: "Advertisement",
  DIRECT_REFERRAL: "Direct Referral",
  WORD_OF_MOUTH: "Word of Mouth",
  UNKNOWN: "Not Specified",
};

export default function SystemReports() {
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
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [lifecycleFilter, setLifecycleFilter] = useState("ALL");
  const [sourceFilter, setSourceFilter] = useState("ALL");
  const [locationFilter, setLocationFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const limit = 20;

  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line
  }, [dateRange, compareMode]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const filters: any = {
        page: 1,
        limit: 10000,
      };

      if (dateRange?.from) filters.startDate = startOfDay(dateRange.from).toISOString();
      if (dateRange?.to) filters.endDate = endOfDay(dateRange.to).toISOString();
      if (compareMode) filters.compare = 'true';

      const res = await reportsApi.getSystemReport(axiosInstance, filters as ReportFilters);
      setData(res.data);
    } catch (error) {
      console.error("Failed to fetch system report:", error);
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

  const onExportUsers = () => {
    // Only exports the current register page
    if (!data?.register?.data || data.register.data.length === 0) return;
    const isCustomer = activeCard === "CUSTOMERS";
    const headers = [isCustomer ? "#id" : "#", "Name", "Email", "Role", "Location", "Lifecycle", "Signup Source", "Created At"];
    const csvContent = data.register.data.map((u: any) => 
      [u.id, `${u.firstName || ''} ${u.lastName || ''}`.trim(), u.email, u.userType, u.location, u.lifecycle, u.signupSource, format(new Date(u.createdAt), "MMM dd, yyyy")]
        .map((v: any) => `"${String(v || "").replace(/"/g, '""')}"`).join(",")
    );
    const csv = [headers.join(","), ...csvContent].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `users_report_${activeCard || 'total'}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  const onExportLifecycle = () => {
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

  const onRowClick = (row: any) => {
    navigate(`/dashboard/profile/${row.id}/${row.userType || "CUSTOMER"}`, {
      state: {
        userData: row,
        returnTo: `/dashboard/admin/reports`,
        returnLabel: "Back to Reports Register",
      },
    });
  };

  const cards = [
    { key: "TOTAL_USERS", title: "Total Users", value: data?.summary?.totalUsers || 0, icon: Users },
    { key: "CUSTOMERS", title: "Customers", value: data?.summary?.customers || 0, icon: UserCheck },
    { key: "BUILDERS", title: "Builders", value: data?.summary?.builders || 0, icon: Shield },
    { key: "TOTAL_ADMINS", title: "Total Admins", value: data?.summary?.admins || 0, icon: FileText },
  ];

  const buildersByType = {
    FUNDI: data?.summary?.fundi || 0,
    PROFESSIONAL: data?.summary?.professional || 0,
    CONTRACTOR: data?.summary?.contractor || 0,
    HARDWARE: data?.summary?.hardware || 0,
  };

  // We rely on backend for exact counts; if unavailable we show "Filter" instead
  const customersByType = {
    INDIVIDUAL: data?.summary?.individual || 0,
    ORGANIZATION: data?.summary?.organization || 0,
  };

  // Pagination meta and local filtering
  const filteredRegister = useMemo(() => {
    let result = [...(data?.register?.data || [])];

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((u: any) => 
        (u.firstName || '').toLowerCase().includes(q) ||
        (u.lastName || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q)
      );
    }

    // Role filtering & Active Card
    if (activeCard === "TOTAL_ADMINS") {
      result = result.filter((u: any) => u.userType === "ADMIN");
    } else if (activeCard === "BUILDERS") {
      if (roleFilter === "ALL") {
         result = result.filter((u: any) => ["FUNDI", "PROFESSIONAL", "CONTRACTOR", "HARDWARE"].includes(u.userType));
      } else {
         result = result.filter((u: any) => u.userType === roleFilter);
      }
    } else if (activeCard === "CUSTOMERS") {
      result = result.filter((u: any) => u.userType === "CUSTOMER" || !u.userType);
      if (roleFilter === "INDIVIDUAL") {
         result = result.filter((u: any) => u.accountType === "INDIVIDUAL");
      } else if (roleFilter === "ORGANIZATION") {
         result = result.filter((u: any) => u.accountType === "ORGANIZATION");
      }
    } else if (!activeCard) {
      result = []; // none active
    } else {
      if (roleFilter !== "ALL") result = result.filter((u: any) => u.userType === roleFilter);
    }

    // Lifecycle
    if (lifecycleFilter !== "ALL") {
      const lf = lifecycleFilter.replace('_', ' ').toLowerCase();
      result = result.filter((u: any) => {
        const uLf = String(u.lifecycle).toLowerCase();
        return uLf === lf || 
               (lifecycleFilter === "PENDING" && uLf === "pending verification") ||
               (lifecycleFilter === "SIGNED_UP" && uLf === "signed up");
      });
    }

    // Source
    if (sourceFilter !== "ALL") {
      result = result.filter((u: any) => u.signupSource === sourceFilter);
    }

    // Location
    if (locationFilter !== "ALL") {
      result = result.filter((u: any) => u.location === locationFilter);
    }

    return result;
  }, [data?.register?.data, searchQuery, activeCard, roleFilter, lifecycleFilter, sourceFilter, locationFilter]);

  const totalFiltered = filteredRegister.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / limit));
  const isFirstPage = page <= 1;
  const isLastPage = page >= totalPages;

  const currentRegisterPage = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredRegister.slice(start, start + limit);
  }, [filteredRegister, page, limit]);

  const availableLocations = useMemo(() => {
    const arr = data?.register?.data || [];
    return [...new Set(arr.map((u: any) => u.location).filter(Boolean))] as string[];
  }, [data?.register?.data]);

  const availableSources = useMemo(() => {
    const arr = data?.register?.data || [];
    return [...new Set(arr.map((u: any) => u.signupSource).filter(Boolean))] as string[];
  }, [data?.register?.data]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-indigo-800">System Reports</h1>
        <p className="text-sm text-gray-500">Operational + lifecycle reports (auto-refresh every 30 seconds)</p>
      </div>

      <div className="space-y-6">
        {/* Date Range Control (Prototype Match) */}
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

        {/* System Register Snapshot */}
        <div className="bg-white rounded-xl border border-indigo-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[16px] font-semibold text-indigo-700">System Register Snapshot</h2>
            {activeCard && (
              <button
                onClick={onExportUsers}
                className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded text-[13px] font-medium hover:bg-indigo-700 transition"
              >
                <Download size={16} />
                Export Users CSV
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
            {cards.map((card) => (
              <button
                type="button"
                key={card.key}
                onClick={() => {
                  setActiveCard(card.key);
                  setRoleFilter("ALL"); // Reset filters when changing cards
                  setLifecycleFilter("ALL");
                  setPage(1);
                }}
                className={`bg-white border rounded-xl shadow-sm p-5 text-left transition ${
                  activeCard === card.key ? "border-indigo-600 ring-2 ring-indigo-200" : "hover:border-gray-300"
                }`}
              >
                <div className="flex justify-between">
                  <div>
                    <p className="text-[13px] text-gray-500 font-medium">{card.title}</p>
                    <p className="text-2xl font-bold text-indigo-700">
                      {loading ? "..." : card.value}
                    </p>
                  </div>
                  <card.icon className="text-indigo-600 h-5 w-5" />
                </div>
              </button>
            ))}
          </div>

          {!activeCard ? (
            <div className="rounded-lg border border-dashed border-indigo-200 bg-indigo-50/40 p-4 text-sm text-indigo-700 font-medium mt-6">
              Select any card to view the register details.
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-3 mb-4 mt-6">
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

              {activeCard === "TOTAL_ADMINS" ? (
                <div className="rounded-lg border border-indigo-200 bg-indigo-50/40 p-4">
                  <p className="text-sm text-indigo-800">
                    Total admins in selected date range: <span className="font-semibold">{data?.summary?.admins || 0}</span>
                  </p>
                  <p className="text-sm text-indigo-700 mt-1">
                    Open User Management to view and manage admin accounts.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate("/dashboard/admin/user-management")}
                    className="mt-4 inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded text-[13px] font-medium hover:bg-indigo-700"
                  >
                    Go to User Management
                  </button>
                </div>
              ) : (
                <>
                  {/* Category Pills */}
                  {activeCard === "BUILDERS" && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {[
                        { key: "ALL", label: "All Builders", count: data?.summary?.builders || 0 },
                        { key: "FUNDI", label: "Fundis", count: buildersByType.FUNDI },
                        { key: "PROFESSIONAL", label: "Professionals", count: buildersByType.PROFESSIONAL },
                        { key: "CONTRACTOR", label: "Contractors", count: buildersByType.CONTRACTOR },
                        { key: "HARDWARE", label: "Hardware", count: buildersByType.HARDWARE },
                      ].map((item) => (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => { setRoleFilter(item.key); setPage(1); }}
                          className={`px-3 py-1.5 rounded-[5px] border text-[13px] transition-colors ${
                            roleFilter === item.key
                              ? "bg-indigo-50 border-indigo-400 text-indigo-700 font-semibold"
                              : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          {item.label} ({loading ? "-" : item.count})
                        </button>
                      ))}
                    </div>
                  )}

                  {activeCard === "CUSTOMERS" && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {[
                        { key: "ALL", label: "All Customers", count: data?.summary?.customers || 0 },
                        { key: "INDIVIDUAL", label: "Individual Customers", count: customersByType.INDIVIDUAL },
                        { key: "ORGANIZATION", label: "Organization Customers", count: customersByType.ORGANIZATION },
                      ].map((item) => (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => { setRoleFilter(item.key); setPage(1); }}
                          className={`px-3 py-1.5 rounded-[5px] border text-[13px] transition-colors ${
                            roleFilter === item.key
                              ? "bg-indigo-50 border-indigo-400 text-indigo-700 font-semibold"
                              : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Dropdown Filters */}
                  <div className="flex flex-wrap gap-3 mb-5">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(event) => { setSearchQuery(event.target.value); setPage(1); }}
                      placeholder="Search customers/builders..."
                      className="border border-gray-200 focus:border-indigo-400 focus:outline-none rounded-[5px] px-3 h-[36px] text-[13px] bg-white min-w-[220px]"
                    />

                    {activeCard === "TOTAL_USERS" && (
                      <select
                        value={roleFilter}
                        onChange={(event) => { setRoleFilter(event.target.value); setPage(1); }}
                        className="border border-gray-200 focus:border-indigo-400 focus:outline-none rounded-[5px] px-3 h-[36px] text-[13px] bg-white text-gray-700"
                      >
                        <option value="ALL">All Categories</option>
                        <option value="ALL_CUSTOMERS">All Customers</option>
                        <option value="ALL_BUILDERS">All Builders</option>
                        <option value="FUNDI">Fundi</option>
                        <option value="PROFESSIONAL">Professional</option>
                        <option value="CONTRACTOR">Contractor</option>
                        <option value="HARDWARE">Hardware</option>
                      </select>
                    )}

                    <select
                      value={locationFilter}
                      onChange={(event) => { setLocationFilter(event.target.value); setPage(1); }}
                      className="border border-gray-200 focus:border-indigo-400 focus:outline-none rounded-[5px] px-3 h-[36px] text-[13px] bg-white text-gray-700"
                    >
                      <option value="ALL">All Locations</option>
                      {/* Derived from backend data locally for demo purposes, backend filter usually superior */}
                      {availableLocations.map((loc: string) => (
                         <option key={loc} value={loc}>{loc}</option>
                      ))}
                    </select>

                    <select
                      value={lifecycleFilter}
                      onChange={(event) => { setLifecycleFilter(event.target.value); setPage(1); }}
                      className="border border-gray-200 focus:border-indigo-400 focus:outline-none rounded-[5px] px-3 h-[36px] text-[13px] bg-white text-gray-700"
                    >
                      <option value="ALL">All Lifecycle</option>
                      <option value="SIGNED_UP">Signed Up</option>
                      <option value="INCOMPLETE">Incomplete</option>
                      <option value="COMPLETE">Complete</option>
                      <option value="PENDING">Pending Verification</option>
                      <option value="VERIFIED">Verified</option>
                      <option value="SUSPENDED">Suspended</option>
                      <option value="RETURNED">Returned</option>
                      <option value="DELETED">Deleted</option>
                    </select>

                    <select
                      value={sourceFilter}
                      onChange={(event) => { setSourceFilter(event.target.value); setPage(1); }}
                      className="border border-gray-200 focus:border-indigo-400 focus:outline-none rounded-[5px] px-3 h-[36px] text-[13px] bg-white text-gray-700"
                    >
                      <option value="ALL">All Sources</option>
                      {/* Typically backend provided, we can map what we have */}
                      {availableSources.map((src: string) => (
                        <option key={src} value={src}>{src}</option>
                      ))}
                    </select>
                  </div>

                  {/* Register Table */}
                  <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
                    <table className="min-w-full bg-white text-sm">
                      <thead className="bg-[#f8f9fa] border-b text-gray-600">
                        <tr>
                          <th className="px-4 py-3 text-left text-[13px] font-semibold whitespace-nowrap">#</th>
                          <th className="px-4 py-3 text-left text-[13px] font-semibold whitespace-nowrap">Name</th>
                          <th className="px-4 py-3 text-left text-[13px] font-semibold whitespace-nowrap">Email</th>
                          <th className="px-4 py-3 text-left text-[13px] font-semibold whitespace-nowrap">Role</th>
                          <th className="px-4 py-3 text-left text-[13px] font-semibold whitespace-nowrap">Location</th>
                          <th className="px-4 py-3 text-left text-[13px] font-semibold whitespace-nowrap">Lifecycle</th>
                          <th className="px-4 py-3 text-left text-[13px] font-semibold whitespace-nowrap">Signup Source</th>
                          <th className="px-4 py-3 text-left text-[13px] font-semibold whitespace-nowrap">Created At</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {loading ? (
                          <tr>
                            <td colSpan={8} className="text-center py-10 text-gray-400 font-medium">
                              Loading Records...
                            </td>
                          </tr>
                        ) : currentRegisterPage.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="text-center py-10 text-gray-400 font-medium">
                              No users match current filters.
                            </td>
                          </tr>
                        ) : (
                          currentRegisterPage.map((row: any, idx: number) => (
                            <tr
                              key={`${row.id}-${idx}`}
                              className="hover:bg-indigo-50/40 cursor-pointer transition-colors"
                              onClick={() => onRowClick(row)}
                            >
                              <td className="px-4 py-2.5 text-gray-500">{((page - 1) * limit) + idx + 1}</td>
                              <td className="px-4 py-2.5 text-gray-900 font-medium">{[row.firstName, row.lastName].filter(Boolean).join(" ")}</td>
                              <td className="px-4 py-2.5 text-gray-600">{row.email}</td>
                              <td className="px-4 py-2.5 text-gray-600">{row.userType || "N/A"}</td>
                              <td className="px-4 py-2.5 text-gray-600">{row.location || "N/A"}</td>
                              <td className="px-4 py-2.5">
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                  {lifecycleLabel(row.lifecycle)}
                                </span>
                              </td>
                              <td className="px-4 py-2.5 text-gray-600">{sourceLabel[row.signupSource] || row.signupSource || sourceLabel.UNKNOWN}</td>
                              <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap">{format(new Date(row.createdAt), "MMM dd, yyyy")}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {totalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-gray-100 mt-4 pt-4">
                      <p className="text-[13px] text-gray-500">
                        Showing <span className="font-medium text-gray-800">{((page - 1) * limit) + 1}</span> to <span className="font-medium text-gray-800">{Math.min(page * limit, totalFiltered)}</span> of <span className="font-medium text-gray-800">{totalFiltered}</span> records
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
            </>
          )}
        </div>

        {/* Lifecycle Dashboard Block */}
        <div className="bg-white rounded-xl border border-indigo-100 p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-5">
            <div>
              <h2 className="text-[16px] font-semibold text-indigo-700">Lifecycle Dashboard</h2>
              <p className="text-[13px] text-gray-500 mt-1">
                Date-filtered lifecycle counts, lifecycle status reports, aging, and verification performance.
              </p>
            </div>
            <button
              onClick={onExportLifecycle}
              className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 inline-flex items-center gap-2 text-[13px] font-medium transition"
            >
              <Download size={16} />
              Export Lifecycle CSV
            </button>
          </div>

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
              <div key={idx} className="border border-gray-100 rounded-xl p-4 bg-[#fefeff] shadow-sm">
                <p className="text-[12.5px] text-gray-500 font-medium mb-1">{item.label}</p>
                <p className="text-2xl font-bold text-indigo-700">{loading ? "-" : item.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="border border-gray-100 shadow-sm rounded-xl p-5">
              <h3 className="font-semibold text-gray-800 mb-4 text-[14px]">Lifecycle Change Report</h3>
              {data?.comparison ? (
                 <div className="space-y-2 text-[13px]">
                   <p className="text-xs uppercase tracking-wide text-gray-500 mb-3">Vs Previous Period (Totals)</p>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                     <div className="flex items-center justify-between border border-gray-100 rounded-lg p-3 bg-gray-50/50">
                       <span className="text-gray-700 font-medium">Total Users</span>
                       <span className={`${data.comparison.totalUsers?.change >= 0 ? "text-green-600" : "text-red-500"} font-bold`}>
                         {data.comparison.totalUsers?.change >= 0 ? "+" : ""}{data.comparison.totalUsers?.change}%
                       </span>
                     </div>
                     <div className="flex items-center justify-between border border-gray-100 rounded-lg p-3 bg-gray-50/50">
                       <span className="text-gray-700 font-medium">Customers</span>
                       <span className={`${data.comparison.customers?.change >= 0 ? "text-green-600" : "text-red-500"} font-bold`}>
                         {data.comparison.customers?.change >= 0 ? "+" : ""}{data.comparison.customers?.change}%
                       </span>
                     </div>
                     <div className="flex items-center justify-between border border-gray-100 rounded-lg p-3 bg-gray-50/50">
                       <span className="text-gray-700 font-medium">Builders</span>
                       <span className={`${data.comparison.builders?.change >= 0 ? "text-green-600" : "text-red-500"} font-bold`}>
                         {data.comparison.builders?.change >= 0 ? "+" : ""}{data.comparison.builders?.change}%
                       </span>
                     </div>
                   </div>
                 </div>
              ) : (
                <div className="rounded-lg border border-gray-200 p-3 bg-gray-50 text-[13px] text-gray-600 font-medium">
                  Enable date comparison to view lifecycle deltas.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
