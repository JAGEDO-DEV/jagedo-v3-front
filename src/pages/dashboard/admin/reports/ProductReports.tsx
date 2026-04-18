import React, { useState, useEffect } from "react";
import axios from "axios";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { DateRange } from "react-day-picker";
import { 
  Package, FileText, Check, X, Shield, UserCheck, 
  Download, Calendar as CalendarIcon, ChevronLeft, ChevronRight 
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import reportsApi, { ReportFilters } from "@/api/reports.api";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";

export default function ProductReports() {
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

  // Register Filters state (Search)
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const limit = 20;

  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line
  }, [dateRange, compareMode, activeCard, page, searchQuery]);

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

      // Ensure backend knows which register we are looking at!
      // By default it might just return Products. If active card is an Attribute or Region,
      // backend needs a parameter like `registerTypeFilter`.
      if (activeCard) {
        if (activeCard === "PRODUCT_SETUP_ATTRIBUTES") {
          filters.registerTypeFilter = "attributes";
        } else if (activeCard === "PRODUCT_SETUP_REGIONS") {
          filters.registerTypeFilter = "regions";
        } else {
           filters.registerTypeFilter = "products";
           if (activeCard.startsWith("PRODUCT_TYPE_")) {
              filters.productTypeFilter = activeCard.replace("PRODUCT_TYPE_", "").toLowerCase();
           } else if (activeCard.startsWith("PRODUCT_STATUS_")) {
              filters.lifecycleFilter = activeCard.replace("PRODUCT_STATUS_", "").toLowerCase();
           }
        }
      }

      const res = await reportsApi.getProductsReport(axiosInstance, filters as ReportFilters);
      setData(res.data);
    } catch (error) {
      console.error("Failed to fetch products report:", error);
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

  const activeRegisterKind = () => {
    if (activeCard === "PRODUCT_SETUP_ATTRIBUTES") return "attributes";
    if (activeCard === "PRODUCT_SETUP_REGIONS") return "regions";
    return "products";
  };

  const getActiveRegisterTitle = () => {
    if (!activeCard) return "";
    const allCards = [...productTypeCards, ...productLifecycleCards, ...productSetupCards];
    const found = allCards.find(c => c.key === activeCard);
    return found ? found.title : "Register";
  };

  const onExport = () => {
    if (!data?.register?.data || data.register.data.length === 0) return;
    const kind = activeRegisterKind();
    let headers: string[] = [];
    let csvContent: string[] = [];

    if (kind === "attributes") {
      headers = ["#", "Attribute", "Type", "Group", "Subgroup", "Required", "Customer Visible", "Status", "Updated At"];
      csvContent = data.register.data.map((r: any, idx: number) => [
        idx + 1, r.name, r.type, r.groupName || "--", r.subgroupName || "--", 
        r.required ? "Yes" : "No", r.customerVisible ? "Yes" : "No", r.status, 
        format(new Date(r.updatedAt || r.createdAt || new Date()), "MMM dd, yyyy")
      ].map(v => `"${String(v || "").replace(/"/g, '""')}"`).join(","));
    } else if (kind === "regions") {
      headers = ["#", "Region", "Active", "Customer View", "Filterable", "Updated At"];
      csvContent = data.register.data.map((r: any, idx: number) => [
        idx + 1, r.name, r.active ? "Yes" : "No", r.customerView ? "Yes" : "No", 
        r.filterable ? "Yes" : "No", 
        format(new Date(r.updatedAt || r.createdAt || new Date()), "MMM dd, yyyy")
      ].map(v => `"${String(v || "").replace(/"/g, '""')}"`).join(","));
    } else {
      headers = ["#", "Product", "SKU / BID", "Type", "Group", "Status", "Active", "Prices", "Updated At"];
      csvContent = data.register.data.map((r: any, idx: number) => [
        idx + 1, r.name, r.sku || r.bId || "--", r.type || "N/A", r.group || r.category || "--", 
        r.status || "N/A", r.active ? "Yes" : "No", r.prices || "N/A", 
        format(new Date(r.updatedAt || r.createdAt || new Date()), "MMM dd, yyyy")
      ].map(v => `"${String(v || "").replace(/"/g, '""')}"`).join(","));
    }

    const csv = [headers.join(","), ...csvContent].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${kind}_report_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  const productTypeCards = [
    { key: "PRODUCT_TOTAL", title: "Total Products", value: data?.summary?.totalProducts || 0, icon: Package },
    { key: "PRODUCT_TYPE_HARDWARE", title: "Hardware", value: data?.summary?.hardware || 0, icon: Package },
    { key: "PRODUCT_TYPE_CUSTOM", title: "Custom Products", value: data?.summary?.custom || 0, icon: Package },
    { key: "PRODUCT_TYPE_DESIGN", title: "Design", value: data?.summary?.design || 0, icon: Package },
    { key: "PRODUCT_TYPE_MACHINERY", title: "Machinery & Equipment", value: data?.summary?.machineryAndEquipment || data?.summary?.machinery || 0, icon: Package },
  ];

  const productLifecycleCards = [
    { key: "PRODUCT_STATUS_PENDING", title: "Pending Approval", value: data?.summary?.pendingApproval || data?.summary?.submitted || 0, icon: FileText },
    { key: "PRODUCT_STATUS_APPROVED", title: "Approved", value: data?.summary?.approved || 0, icon: Check },
    { key: "PRODUCT_STATUS_REJECTED", title: "Rejected", value: data?.summary?.rejected || 0, icon: X },
    { key: "PRODUCT_STATUS_DRAFT", title: "Draft", value: data?.summary?.draft || 0, icon: FileText },
  ];

  const productSetupCards = [
    {
      key: "PRODUCT_SETUP_ATTRIBUTES",
      title: "Attributes",
      value: data?.summary?.attributes || 0,
      description: `Active: ${data?.summary?.activeAttributes || 0} | Required: ${data?.summary?.requiredAttributes || 0}`,
      subDescription: `Customer-visible: ${data?.summary?.visibleAttributes || 0}`,
      icon: Shield,
    },
    {
      key: "PRODUCT_SETUP_REGIONS",
      title: "Regions",
      value: data?.summary?.regions || 0,
      description: `Active: ${data?.summary?.activeRegions || 0} | Customer View: ${data?.summary?.viewRegions || 0}`,
      subDescription: `Filterable: ${data?.summary?.filterableRegions || 0}`,
      icon: UserCheck,
    },
  ];

  // Pagination meta
  const totalPages = data?.register?.pagination?.totalPages || 1;
  const isFirstPage = page <= 1;
  const isLastPage = page >= totalPages;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-indigo-800">Products Reports</h1>
        <p className="text-sm text-gray-500">Product register, lifecycle, and setup reports</p>
      </div>

      {/* Date Range Block */}
      <div className="bg-white rounded-xl border border-indigo-100 p-6 shadow-sm">
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

      {/* Snapshot Cards */}
      <div className="bg-white rounded-xl border border-indigo-100 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[16px] font-semibold text-indigo-700">Product Register Snapshot</h2>
          {activeCard && (
            <button
              onClick={onExport}
              className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded text-[13px] font-medium hover:bg-indigo-700 transition"
            >
              <Download size={16} />
              Export Register CSV
            </button>
          )}
        </div>

        <p className="text-[13.5px] font-semibold text-gray-700 mb-3">Product Register</p>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          {productTypeCards.map((card) => (
            <button
              type="button"
              key={card.key}
              onClick={() => { setActiveCard(card.key); setPage(1); }}
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

        <p className="text-[13.5px] font-semibold text-gray-700 mb-3">Product Lifecycle</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {productLifecycleCards.map((card) => (
            <button
              type="button"
              key={card.key}
              onClick={() => { setActiveCard(card.key); setPage(1); }}
              className={`bg-white border rounded-xl shadow-sm p-4 text-left transition ${
                activeCard === card.key ? "border-indigo-600 ring-2 ring-indigo-200" : "hover:border-gray-300"
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <p className="text-[12.5px] text-gray-500 font-medium">{card.title}</p>
                <card.icon className={`${card.key === "PRODUCT_STATUS_APPROVED" ? "text-green-600" : card.key === "PRODUCT_STATUS_REJECTED" ? "text-red-600" : "text-indigo-600"} h-[18px] w-[18px]`} />
              </div>
              <p className="text-[22px] font-bold text-indigo-700 mt-1">
                {loading ? "..." : card.value}
              </p>
            </button>
          ))}
        </div>

        <p className="text-[13.5px] font-semibold text-gray-700 mb-3">Setup Registers</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {productSetupCards.map((card) => (
            <button
              type="button"
              key={card.key}
              onClick={() => { setActiveCard(card.key); setPage(1); }}
              className={`border rounded-xl p-4 text-left bg-gray-50/50 transition ${
                activeCard === card.key ? "border-indigo-600 ring-2 ring-indigo-200 bg-white shadow-sm" : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[12.5px] text-gray-500 font-medium">{card.title}</p>
                  <p className="text-[22px] font-bold text-indigo-700 mt-1">{loading ? "..." : card.value}</p>
                </div>
                <card.icon className="text-indigo-600 h-[18px] w-[18px] mt-1" />
              </div>
              {card.description && <p className="text-[12px] text-gray-600 mt-2 font-medium">{card.description}</p>}
              {card.subDescription && <p className="text-[12px] text-gray-600 font-medium">{card.subDescription}</p>}
            </button>
          ))}
        </div>

        {!activeCard ? (
          <div className="rounded-lg border border-dashed border-indigo-200 bg-indigo-50/40 p-4 text-[13.5px] text-indigo-700 font-medium mt-6">
            Select any product, lifecycle, or setup card to view register details.
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4 mt-6 border-t border-gray-100 pt-5">
              <p className="text-[14px] font-medium text-gray-800">Viewing: {getActiveRegisterTitle()}</p>
              
              <div className="flex items-center gap-3 w-full lg:w-auto">
                <input
                  value={searchQuery}
                  onChange={(event) => { setSearchQuery(event.target.value); setPage(1); }}
                  placeholder="Search register..."
                  className="border border-gray-200 rounded px-3 h-[32px] text-[13px] bg-white focus:outline-none focus:border-indigo-400 min-w-[200px]"
                />
                <button
                  type="button"
                  onClick={() => setActiveCard(null)}
                  className="px-4 py-[6px] rounded border border-gray-200 text-[13px] font-medium text-gray-600 hover:bg-gray-50 transition whitespace-nowrap"
                >
                  Close Register
                </button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm mt-3">
              <table className="min-w-full bg-white text-sm">
                <thead className="bg-[#f8f9fa] border-b text-gray-600">
                  {activeRegisterKind() === "products" && (
                     <tr>
                      <th className="px-4 py-3 text-left text-[13px] font-semibold whitespace-nowrap">#</th>
                      <th className="px-4 py-3 text-left text-[13px] font-semibold whitespace-nowrap">Product</th>
                      <th className="px-4 py-3 text-left text-[13px] font-semibold whitespace-nowrap">SKU / BID</th>
                      <th className="px-4 py-3 text-left text-[13px] font-semibold whitespace-nowrap">Type</th>
                      <th className="px-4 py-3 text-left text-[13px] font-semibold whitespace-nowrap">Group</th>
                      <th className="px-4 py-3 text-left text-[13px] font-semibold whitespace-nowrap">Status</th>
                      <th className="px-4 py-3 text-left text-[13px] font-semibold whitespace-nowrap">Active</th>
                      <th className="px-4 py-3 text-left text-[13px] font-semibold whitespace-nowrap">Prices</th>
                      <th className="px-4 py-3 text-left text-[13px] font-semibold whitespace-nowrap">Updated At</th>
                    </tr>
                  )}
                  {activeRegisterKind() === "attributes" && (
                    <tr>
                      <th className="px-4 py-3 text-left text-[13px] font-semibold whitespace-nowrap">#</th>
                      <th className="px-4 py-3 text-left text-[13px] font-semibold whitespace-nowrap">Attribute</th>
                      <th className="px-4 py-3 text-left text-[13px] font-semibold whitespace-nowrap">Type</th>
                      <th className="px-4 py-3 text-left text-[13px] font-semibold whitespace-nowrap">Group</th>
                      <th className="px-4 py-3 text-left text-[13px] font-semibold whitespace-nowrap">Subgroup</th>
                      <th className="px-4 py-3 text-left text-[13px] font-semibold whitespace-nowrap">Required</th>
                      <th className="px-4 py-3 text-left text-[13px] font-semibold whitespace-nowrap">Visible</th>
                      <th className="px-4 py-3 text-left text-[13px] font-semibold whitespace-nowrap">Status</th>
                      <th className="px-4 py-3 text-left text-[13px] font-semibold whitespace-nowrap">Updated At</th>
                    </tr>
                  )}
                  {activeRegisterKind() === "regions" && (
                    <tr>
                      <th className="px-4 py-3 text-left text-[13px] font-semibold whitespace-nowrap">#</th>
                      <th className="px-4 py-3 text-left text-[13px] font-semibold whitespace-nowrap">Region</th>
                      <th className="px-4 py-3 text-left text-[13px] font-semibold whitespace-nowrap">Active</th>
                      <th className="px-4 py-3 text-left text-[13px] font-semibold whitespace-nowrap">Customer View</th>
                      <th className="px-4 py-3 text-left text-[13px] font-semibold whitespace-nowrap">Filterable</th>
                      <th className="px-4 py-3 text-left text-[13px] font-semibold whitespace-nowrap">Updated At</th>
                    </tr>
                  )}
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr>
                      <td colSpan={10} className="text-center py-10 text-gray-400 font-medium">Loading Records...</td>
                    </tr>
                  ) : !data?.register?.data || data.register.data.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="text-center py-10 text-gray-400 font-medium">No records found.</td>
                    </tr>
                  ) : (
                    data.register.data.map((row: any, idx: number) => {
                      const kind = activeRegisterKind();
                      if (kind === "attributes") {
                        return (
                          <tr key={`${row.id}-${idx}`} className="hover:bg-indigo-50/40">
                            <td className="px-4 py-2.5 text-gray-500">{((page - 1) * limit) + idx + 1}</td>
                            <td className="px-4 py-2.5 text-gray-900 font-medium">{row.name}</td>
                            <td className="px-4 py-2.5 text-gray-600 capitalize">{row.type || "N/A"}</td>
                            <td className="px-4 py-2.5 text-gray-600">{row.groupName || "--"}</td>
                            <td className="px-4 py-2.5 text-gray-600">{row.subgroupName || "--"}</td>
                            <td className="px-4 py-2.5 text-gray-600">{row.required ? "Yes" : "No"}</td>
                            <td className="px-4 py-2.5 text-gray-600">{row.customerVisible ? "Yes" : "No"}</td>
                            <td className="px-4 py-2.5 text-gray-600 capitalize">{row.status}</td>
                            <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap">{format(new Date(row.updatedAt || row.createdAt || new Date()), "MMM dd, yyyy")}</td>
                          </tr>
                        );
                      } else if (kind === "regions") {
                        return (
                           <tr key={`${row.id}-${idx}`} className="hover:bg-indigo-50/40">
                             <td className="px-4 py-2.5 text-gray-500">{((page - 1) * limit) + idx + 1}</td>
                             <td className="px-4 py-2.5 text-gray-900 font-medium">{row.name}</td>
                             <td className="px-4 py-2.5 text-gray-600">{row.active ? "Yes" : "No"}</td>
                             <td className="px-4 py-2.5 text-gray-600">{row.customerView ? "Yes" : "No"}</td>
                             <td className="px-4 py-2.5 text-gray-600">{row.filterable ? "Yes" : "No"}</td>
                             <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap">{format(new Date(row.updatedAt || row.createdAt || new Date()), "MMM dd, yyyy")}</td>
                           </tr>
                        );
                      } else {
                        return (
                          <tr key={`${row.id}-${idx}`} className="hover:bg-indigo-50/40">
                            <td className="px-4 py-2.5 text-gray-500">{((page - 1) * limit) + idx + 1}</td>
                            <td className="px-4 py-2.5 text-gray-900 font-medium line-clamp-1">{row.name}</td>
                            <td className="px-4 py-2.5 text-gray-600 font-mono text-[12.5px]">{row.sku || row.bId || "N/A"}</td>
                            <td className="px-4 py-2.5 text-gray-600 capitalize">{row.type || "N/A"}</td>
                            <td className="px-4 py-2.5 text-gray-600">
                              <div className="line-clamp-1">{row.group || row.category || "--"}</div>
                              {row.subgroup && <div className="text-[11px] text-gray-400">{row.subgroup}</div>}
                            </td>
                            <td className="px-4 py-2.5 text-gray-600 capitalize">{row.status || "N/A"}</td>
                            <td className="px-4 py-2.5 text-gray-600">{row.active ? "Yes" : "No"}</td>
                            <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap">{row.prices || "N/A"}</td>
                            <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap">{format(new Date(row.updatedAt || row.createdAt || new Date()), "MMM dd, yyyy")}</td>
                          </tr>
                        );
                      }
                    })
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

      {/* Product Status Report Footer */}
      <div className="bg-white rounded-xl border border-indigo-100 p-6 shadow-sm">
        <h2 className="text-[15px] font-semibold text-indigo-700 mb-4">Cumulative Status Report (in range)</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded border border-gray-200 p-3 bg-gray-50 flex items-center justify-between text-[13.5px]">
            <span className="text-gray-600 font-medium">Total Registered</span>
            <span className="font-bold text-indigo-700">{data?.summary?.totalProducts || 0}</span>
          </div>
          <div className="rounded border border-gray-200 p-3 bg-gray-50 flex items-center justify-between text-[13.5px]">
            <span className="text-gray-600 font-medium">Draft</span>
            <span className="font-bold text-indigo-700">{data?.summary?.draft || 0}</span>
          </div>
          <div className="rounded border border-gray-200 p-3 bg-gray-50 flex items-center justify-between text-[13.5px]">
            <span className="text-gray-600 font-medium">Submitted</span>
            <span className="font-bold text-indigo-700">{data?.summary?.pendingApproval || data?.summary?.submitted || 0}</span>
          </div>
          <div className="rounded border border-gray-200 p-3 bg-gray-50 flex items-center justify-between text-[13.5px]">
            <span className="text-gray-600 font-medium">Approved</span>
            <span className="font-bold text-green-600">{data?.summary?.approved || 0}</span>
          </div>
          <div className="rounded border border-gray-200 p-3 bg-gray-50 flex items-center justify-between text-[13.5px]">
            <span className="text-gray-600 font-medium">Rejected</span>
            <span className="font-bold text-red-600">{data?.summary?.rejected || 0}</span>
          </div>
          <div className="rounded border border-gray-200 p-3 bg-gray-50 text-[13px]">
            <p className="text-gray-500 font-medium mb-1">By Product Type</p>
            <p className="text-gray-700">
              Hardware: <span className="font-semibold">{data?.summary?.hardware || 0}</span>, Custom:{" "}
              <span className="font-semibold">{data?.summary?.custom || 0}</span>, Design:{" "}
              <span className="font-semibold">{data?.summary?.design || 0}</span>, Machinery:{" "}
              <span className="font-semibold">{data?.summary?.machineryAndEquipment || data?.summary?.machinery || 0}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
