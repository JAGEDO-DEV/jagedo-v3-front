import React, { useState, useEffect } from "react";
import axios from "axios";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { DateRange } from "react-day-picker";
import { 
  ShoppingCart, FileText, Truck, CheckCircle2, XCircle, 
  Download, Calendar as CalendarIcon, ChevronLeft, ChevronRight 
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import reportsApi, { ReportFilters } from "@/api/reports.api";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";

export default function OrdersReports() {
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

  // Sub-filters for active register
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const limit = 20;

  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line
  }, [dateRange, compareMode, activeCard, statusFilter, page, searchQuery]);

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

      // Setup active card logic for API
      if (activeCard) {
        if (activeCard === "ORDERS_PLACED") filters.lifecycleFilter = "placed";
        if (activeCard === "ORDERS_PROCESSING") filters.lifecycleFilter = "processing";
        if (activeCard === "ORDERS_COMPLETE") filters.lifecycleFilter = "complete";
        if (activeCard === "ORDERS_CANCELLED") filters.lifecycleFilter = "cancelled";
      }

      if (statusFilter !== "ALL") filters.lifecycleFilter = statusFilter.toLowerCase(); // override if explicit dropdown used

      const res = await reportsApi.getOrdersReport(axiosInstance, filters as ReportFilters);
      setData(res.data);
    } catch (error) {
      console.error("Failed to fetch orders report:", error);
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

  const formatKes = (num: number) => {
    return Number(num || 0).toLocaleString();
  };

  const onExport = () => {
    if (!data?.register?.data || data.register.data.length === 0) return;
    const headers = ["#", "Order #", "Customer", "Customer Email", "Status", "Items", "Total (Ksh)", "Delivery Address", "Created At"];
    const csvContent = data.register.data.map((row: any, idx: number) => 
      [
        idx + 1, 
        row.orderNumber || row.orderId || row.id, 
        row.customerName || "N/A", 
        row.customerEmail || row.customer?.email || "N/A",
        row.status || "N/A", 
        row.itemsCount || "0", 
        row.totalAmount || row.total || "0", 
        row.deliveryAddress || "N/A", 
        format(new Date(row.createdAt || new Date()), "MMM dd, yyyy HH:mm")
      ]
      .map(v => `"${String(v || "").replace(/"/g, '""')}"`).join(",")
    );
    const csv = [headers.join(","), ...csvContent].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `orders_report_${activeCard || 'total'}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  const onRowClick = (row: any) => {
    const id = row?.id;
    if (!id) return;
    navigate(`/dashboard/admin/orders/${id}`, {
      state: {
        returnTo: "/dashboard/admin/reports?section=orders",
        returnLabel: "Back to Orders Snapshot Register",
      },
    });
  };

  const cards = [
    { key: "ORDERS_TOTAL", title: "Total Orders", value: data?.summary?.totalOrders || 0, icon: ShoppingCart },
    { key: "ORDERS_PLACED", title: "Placed", value: data?.summary?.placed || 0, icon: FileText },
    { key: "ORDERS_PROCESSING", title: "Processing", value: data?.summary?.processing || 0, icon: Truck },
    { key: "ORDERS_COMPLETE", title: "Complete", value: data?.summary?.complete || 0, icon: CheckCircle2 },
    { key: "ORDERS_CANCELLED", title: "Cancelled", value: data?.summary?.cancelled || 0, icon: XCircle },
  ];

  // Pagination meta
  const totalPages = data?.register?.pagination?.totalPages || 1;
  const isFirstPage = page <= 1;
  const isLastPage = page >= totalPages;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-indigo-800">Orders Reports</h1>
        <p className="text-sm text-gray-500">Cart order placements, tracking, and revenue lifecycle.</p>
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

      {/* Snapshot Cards block */}
      <div className="bg-white rounded-xl border border-indigo-100 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[16px] font-semibold text-indigo-700">Orders Register Snapshot</h2>
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

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-5">
          {cards.map((card) => (
            <button
              type="button"
              key={card.key}
              onClick={() => { setActiveCard(card.key); setStatusFilter("ALL"); setPage(1); }}
              className={`bg-white border rounded-xl shadow-sm p-4 text-left transition ${
                activeCard === card.key ? "border-indigo-600 ring-2 ring-indigo-200" : "hover:border-gray-300"
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <p className="text-[12.5px] text-gray-500 font-medium">{card.title}</p>
                <card.icon className={`${card.key === "ORDERS_COMPLETE" ? "text-green-600" : card.key === "ORDERS_CANCELLED" ? "text-red-600" : "text-indigo-600"} h-[18px] w-[18px]`} />
              </div>
              <p className="text-[22px] font-bold text-indigo-700 mt-1">
                {loading ? "..." : card.value}
              </p>
            </button>
          ))}
        </div>

        {!activeCard ? (
          <div className="rounded-lg border border-dashed border-indigo-200 bg-indigo-50/40 p-4 text-[13.5px] text-indigo-700 font-medium mt-6">
            Select any card to view orders register details.
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4 mt-6 border-t border-gray-100 pt-5">
              <p className="text-[14px] font-medium text-gray-800">
                Viewing: {cards.find((card) => card.key === activeCard)?.title || "Register"}
              </p>
              <button
                type="button"
                onClick={() => setActiveCard(null)}
                className="px-4 py-[6px] rounded border border-gray-200 text-[13px] font-medium text-gray-600 hover:bg-gray-50 transition"
              >
                Close Register
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-4">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <p className="text-xs text-gray-500 mb-1">Revenue (in range)</p>
                <p className="text-[13px] text-gray-700">
                  Subtotal: <span className="font-semibold">{formatKes(data?.breakdowns?.revenue?.subtotal || 0)}</span> | Delivery:{" "}
                  <span className="font-semibold">{formatKes(data?.breakdowns?.revenue?.deliveryFees || 0)}</span> | Total:{" "}
                  <span className="font-semibold">{formatKes(data?.breakdowns?.revenue?.total || 0)}</span>
                </p>
              </div>

              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                 <p className="text-xs text-gray-500 mb-1">Status Filter</p>
                 <select
                   value={statusFilter}
                   onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }}
                   className="w-full border border-gray-200 rounded px-3 h-[28px] text-[13px] bg-white focus:outline-none focus:border-indigo-400"
                 >
                   <option value="ALL">All Statuses</option>
                   <option value="PLACED">Placed</option>
                   <option value="PROCESSING">Processing</option>
                   <option value="COMPLETE">Complete</option>
                   <option value="CANCELLED">Cancelled</option>
                 </select>
              </div>

              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                 <p className="text-xs text-gray-500 mb-1">Search</p>
                 <input
                   value={searchQuery}
                   onChange={(event) => { setSearchQuery(event.target.value); setPage(1); }}
                   placeholder="Search order #, customer, address..."
                   className="w-full border border-gray-200 rounded px-3 h-[28px] text-[13px] bg-white focus:outline-none focus:border-indigo-400"
                 />
              </div>
            </div>

            {/* Register Table */}
            <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm mt-3">
              <table className="min-w-full bg-white text-sm">
                <thead className="bg-[#f8f9fa] border-b text-gray-600">
                   <tr>
                     <th className="px-4 py-3 text-left text-[13px] font-semibold whitespace-nowrap">#</th>
                     <th className="px-4 py-3 text-left text-[13px] font-semibold whitespace-nowrap">Order #</th>
                     <th className="px-4 py-3 text-left text-[13px] font-semibold whitespace-nowrap">Customer</th>
                     <th className="px-4 py-3 text-left text-[13px] font-semibold whitespace-nowrap">Status</th>
                     <th className="px-4 py-3 text-left text-[13px] font-semibold whitespace-nowrap">Items</th>
                     <th className="px-4 py-3 text-left text-[13px] font-semibold whitespace-nowrap">Total Rate</th>
                     <th className="px-4 py-3 text-left text-[13px] font-semibold whitespace-nowrap">Delivery Address</th>
                     <th className="px-4 py-3 text-left text-[13px] font-semibold whitespace-nowrap">Created At</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="text-center py-10 text-gray-400 font-medium">Loading Records...</td>
                    </tr>
                  ) : !data?.register?.data || data.register.data.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-10 text-gray-400 font-medium">No records found.</td>
                    </tr>
                  ) : (
                    data.register.data.map((row: any, idx: number) => {
                       return (
                         <tr key={`${row.id}-${idx}`} className="hover:bg-indigo-50/40 cursor-pointer transition-colors" onClick={() => onRowClick(row)}>
                           <td className="px-4 py-2.5 text-gray-500">{((page - 1) * limit) + idx + 1}</td>
                           <td className="px-4 py-2.5 text-gray-900 font-medium font-mono text-[12.5px]">{row.orderNumber || row.orderId || row.id}</td>
                           <td className="px-4 py-2.5 text-gray-600">
                             <div className="line-clamp-1 font-medium text-gray-800">{row.customerName || "N/A"}</div>
                             <div className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">{row.customerEmail || row.customer?.email}</div>
                           </td>
                           <td className="px-4 py-2.5 text-gray-800 font-medium tracking-wide capitalize">{row.status || "N/A"}</td>
                           <td className="px-4 py-2.5 text-gray-600">{row.itemsCount || "0"}</td>
                           <td className="px-4 py-2.5 text-indigo-700 font-medium">Ksh {formatKes(row.totalAmount || row.total || 0)}</td>
                           <td className="px-4 py-2.5 text-gray-600"><span className="line-clamp-1">{row.deliveryAddress || "N/A"}</span></td>
                           <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap">{format(new Date(row.updatedAt || row.createdAt || new Date()), "MMM dd, yyyy HH:mm")}</td>
                         </tr>
                       );
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

    </div>
  );
}
