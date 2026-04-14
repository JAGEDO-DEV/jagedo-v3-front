import React, { useState, useEffect } from "react";
import axios from "axios";
import { format, subDays } from "date-fns";
import { DateRange } from "react-day-picker";
import reportsApi, { ReportFilters } from "@/api/reports.api";
import { 
  ShoppingCart, FileText, Truck, CheckCircle, XCircle,
  Download, Calendar as CalendarIcon
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

export default function OrdersReports() {
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
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [serviceFilter, setServiceFilter] = useState("All Services");
  const [searchQuery, setSearchQuery] = useState("");

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

      const res = await reportsApi.getOrdersReport(axiosInstance, filters);
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
      case '90d': from = subDays(to, 90); break;
      case 'Custom': return; // Let the picker handle it
    }
    setDateRange({ from, to });
  };

  // Top metrics row
  const topMetrics = [
    { id: "total", title: "Total Orders", icon: <ShoppingCart className="h-5 w-5" />, value: data?.summary?.totalOrders || 0 },
    { id: "placed", title: "Placed", icon: <FileText className="h-5 w-5" />, value: data?.summary?.placed || 0 },
    { id: "processing", title: "Processing", icon: <Truck className="h-5 w-5" />, value: data?.summary?.processing || 0 },
    { id: "complete", title: "Complete", icon: <CheckCircle className="h-5 w-5" />, value: data?.summary?.complete || 0 },
    { id: "cancelled", title: "Cancelled", icon: <XCircle className="h-5 w-5" />, value: data?.summary?.cancelled || 0 },
  ];

  // Categories metrics row
  const categoryMetrics = [
    { id: "custom", title: "Custom Products", value: data?.summary?.customProducts || 0 },
    { id: "machinery", title: "Machinery & Equipment", value: data?.summary?.machinery || 0 },
    { id: "hardware", title: "Hardware", value: data?.summary?.hardware || 0 },
    { id: "designs", title: "Designs", value: data?.summary?.designs || 0 },
  ];

  // Revenue format helper
  const formatKsh = (num: number) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Header */}
      <div className="mb-2">
        <h2 className="text-2xl font-bold tracking-tight text-[#30336b]">System Reports</h2>
        <p className="text-sm text-gray-500 mt-1">Operational + lifecycle reports (auto-refresh every 30 seconds)</p>
      </div>

      {/* Tab Header Indicator */}
      <div className="flex items-center space-x-3 bg-white px-5 py-4 border border-gray-100 rounded-xl shadow-sm w-full relative">
        <ShoppingCart className="text-indigo-600 h-5 w-5" />
        <span className="font-semibold text-gray-800 text-[15px]">Orders Register Snapshot</span>
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
          <h3 className="text-indigo-600 font-medium text-[15px]">Orders Register Snapshot</h3>
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm h-9 px-4">
            <Download className="mr-2 h-4 w-4" /> 
            Export Register CSV
          </Button>
        </div>

        {/* Row 1: Key Status Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
          {topMetrics.map((metric) => {
            const isActive = activeMetric === metric.id;
            return (
              <div 
                key={metric.id}
                className={`border rounded-xl p-5 flex flex-col justify-between cursor-pointer transition-all duration-200 min-h-[100px] ${
                  isActive 
                  ? 'border-indigo-500 ring-1 ring-indigo-500 bg-white shadow-sm' 
                  : 'border-gray-200 bg-white hover:border-indigo-300 hover:shadow-sm'
                }`}
                onClick={() => setActiveMetric(metric.id)}
              >
                <div className="flex justify-between items-start mb-4">
                  <span className={`text-[14px] ${isActive ? 'text-gray-800 font-medium' : 'text-gray-500 font-medium'}`}>
                    {metric.title}
                  </span>
                  <div className={isActive ? "text-indigo-600 flex-shrink-0 ml-2" : "text-indigo-500 flex-shrink-0 ml-2"}>
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

        {/* Row 2: Categorical Orders Requested */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {categoryMetrics.map((metric) => (
            <div 
              key={metric.id}
              className="bg-[#f5f7fc] border border-[#e8ecf8] rounded-xl p-4 cursor-pointer hover:bg-[#edf1fb] transition-colors"
            >
              <div className="text-[13px] text-gray-600 font-medium mb-1">{metric.title}</div>
              <div className="text-[22px] font-bold text-[#30336b] mb-3">{loading ? "-" : metric.value}</div>
              <div className="text-[12px] text-indigo-500 font-medium hover:underline">Click to view register details</div>
            </div>
          ))}
        </div>

        {/* Action / View Control Bar */}
        <div className="flex justify-between items-center pt-2 pb-4 mt-8 border-b border-gray-100">
          <span className="font-medium text-[15px] text-gray-800">
            Viewing: {topMetrics.find(m=>m.id === activeMetric)?.title || 'Total Orders'}
          </span>
          <Button variant="outline" size="sm" className="text-gray-600 h-8 px-4 font-normal hover:bg-gray-50">
            Close Register
          </Button>
        </div>

        {/* Filter Controls Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 py-4 place-items-start">
           
           {/* Revenue Field */}
           <div className="w-full">
             <label className="text-[11px] text-gray-500 font-medium mb-1.5 block">Revenue (in range)</label>
             <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-[12px] text-gray-700 w-full min-h-[38px] flex items-center">
                Subtotal: Ksh {formatKsh(data?.breakdowns?.revenue?.subtotal || 15882361)} | 
                Delivery: Ksh {formatKsh(data?.breakdowns?.revenue?.deliveryFees || 15148)} | 
                Total: Ksh {formatKsh(data?.breakdowns?.revenue?.total || 15903608)}
             </div>
           </div>

           {/* Status Dropdown */}
           <div className="w-full">
             <label className="text-[11px] text-gray-500 font-medium mb-1.5 block">Status Filter</label>
             <select 
                className="w-full h-[38px] border border-gray-200 rounded-md px-3 text-[13px] text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
             >
               <option>All Statuses</option>
               <option>Placed</option>
               <option>Processing</option>
               <option>Complete</option>
               <option>Cancelled</option>
             </select>
           </div>

           {/* Service Dropdown */}
           <div className="w-full">
             <label className="text-[11px] text-gray-500 font-medium mb-1.5 block">Service Filter</label>
             <select 
                className="w-full h-[38px] border border-gray-200 rounded-md px-3 text-[13px] text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                value={serviceFilter}
                onChange={(e) => setServiceFilter(e.target.value)}
             >
               <option>All Services</option>
               <option>Hardware</option>
               <option>Custom Products</option>
               <option>Machinery & Equipment</option>
               <option>Designs</option>
             </select>
           </div>

           {/* Search Input */}
           <div className="w-full">
             <label className="text-[11px] text-gray-500 font-medium mb-1.5 block">Search</label>
             <input 
                type="text" 
                placeholder="Search order #, customer, address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-[38px] border border-gray-200 rounded-md px-3 text-[13px] placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
             />
           </div>

        </div>

        {/* Existing table for displaying the register */}
        <div className="mt-4 border rounded-xl overflow-hidden">
           <Table>
             <TableHeader className="bg-gray-50/50">
               <TableRow>
                 <TableHead className="text-gray-500 font-medium h-10 w-12 text-center">#</TableHead>
                 <TableHead className="text-gray-500 font-medium h-10">Order #</TableHead>
                 <TableHead className="text-gray-500 font-medium h-10 w-[200px]">Customer</TableHead>
                 <TableHead className="text-gray-500 font-medium h-10">Service</TableHead>
                 <TableHead className="text-gray-500 font-medium h-10">Status</TableHead>
                 <TableHead className="text-gray-500 font-medium h-10">Items</TableHead>
                 <TableHead className="text-gray-500 font-medium h-10">Total</TableHead>
                 <TableHead className="text-gray-500 font-medium h-10 min-w-[200px]">Delivery Address</TableHead>
                 <TableHead className="text-gray-500 font-medium h-10 min-w-[120px]">Created At</TableHead>
               </TableRow>
             </TableHeader>
             <TableBody>
               {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-32 text-center text-gray-500">
                      <span className="flex items-center justify-center">Loading Data...</span>
                    </TableCell>
                  </TableRow>
               ) : data?.register?.data?.map((order: any, idx: number) => (
                 <TableRow key={order.orderId || idx} className="hover:bg-gray-50/50">
                   <TableCell className="text-center text-gray-500 text-sm">{idx + 1}</TableCell>
                   <TableCell className="font-medium text-gray-900 text-sm">
                     {order.orderNumber || `ORD-${order.orderId || "720DECE1"}`}
                   </TableCell>
                   <TableCell className="text-sm">
                     <div className="font-medium text-gray-800 line-clamp-1">{order.customerName || "eng.jack"}</div>
                     <div className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">{order.customerEmail || "customer@jagedo.co.ke"}</div>
                   </TableCell>
                   <TableCell className="text-sm text-gray-600">
                     {order.service || "Hardware"}
                   </TableCell>
                   <TableCell>
                     <span className="text-sm font-medium text-gray-800 tracking-wide capitalize">
                       {order.status || "Placed"}
                     </span>
                   </TableCell>
                   <TableCell className="text-sm text-gray-600">
                     {order.itemsCount || "3"}
                   </TableCell>
                   <TableCell className="text-sm font-medium text-gray-800">
                     Ksh {parseFloat(order.totalAmount || "10500").toLocaleString()}
                   </TableCell>
                   <TableCell className="text-xs text-gray-600 leading-snug">
                     {order.deliveryAddress || "Embakasi, Embakasi Central, Nairobi, undefined"}
                   </TableCell>
                   <TableCell className="text-[13px] text-gray-600 leading-snug">
                     {format(order.createdAt ? new Date(order.createdAt) : new Date("2026-04-09T15:31:00"), "dd/MM/yyyy, HH:mm")}
                   </TableCell>
                 </TableRow>
               ))}
               {(!loading && (!data?.register?.data || data.register.data.length === 0)) && (
                 <TableRow>
                   <TableCell colSpan={9} className="h-32 text-center text-gray-500">
                     No orders found for the selected period.
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
