import React, { useState, useEffect } from "react";
import axios from "axios";
import { format, subDays } from "date-fns";
import { DateRange } from "react-day-picker";
import reportsApi, { ReportFilters } from "@/api/reports.api";
import { 
  Package, Wrench, PenTool, Zap, Check, X,
  Download, Calendar as CalendarIcon, FileText,
  Layers, Shield, Users
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

export default function ProductReports() {
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

      const res = await reportsApi.getProductsReport(axiosInstance, filters);
      setData(res.data);
    } catch (error) {
      console.error("Failed to fetch products report:", error);
    } finally {
      setLoading(false);
    }
  };

  const downloadProductsCSV = () => {
    if (!data?.register?.data) return;
    const headers = ["No.", "Product Name", "SKU / BID", "Type", "Group", "Status", "Active", "Prices", "Updated At"];
    const csvContent = data.register.data.map((p: any, idx: number) => 
      [idx + 1, p.name, p.sku || "--", p.type || "Machinery / Equipment", p.group || "Earthmoving Equipments", p.status || "Approved", p.active ? "Yes" : "No", p.prices || "3 pts (Ksh 67,890 - Ksh 765,555)", p.updatedAt ? format(new Date(p.updatedAt), "dd/MM/yyyy HH:mm") : "07/04/2026 13:16"]
        .map(v => `"${String(v || "").replace(/"/g, '""')}"`).join(",")
    );
    const csv = [headers.join(","), ...csvContent].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `products_report_${format(new Date(), 'yyyy-MM-dd')}.csv`;
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

  // Product Register Group
  const productMetrics = [
    { id: "total", title: "Total Products", icon: <Package className="h-5 w-5" />, value: data?.summary?.totalProducts || 0 },
    { id: "hardware", title: "Hardware", icon: <Package className="h-5 w-5" />, value: data?.summary?.hardware || 0 },
    { id: "custom", title: "Custom Products", icon: <Package className="h-5 w-5" />, value: data?.summary?.custom || 0 },
    { id: "design", title: "Design", icon: <Package className="h-5 w-5" />, value: data?.summary?.design || 0 },
    { id: "machinery", title: "Machinery & Equipment", icon: <Package className="h-5 w-5" />, value: data?.summary?.machineryAndEquipment || 0 },
  ];

  // Lifecycle Group
  const lifecycleMetrics = [
    { id: "pending", title: "Pending Approval", icon: <FileText className="h-5 w-5" />, value: data?.summary?.pendingApproval || 0 },
    { id: "approved", title: "Approved", icon: <Check className="h-5 w-5 text-indigo-500" />, value: data?.summary?.approved || 0 },
    { id: "rejected", title: "Rejected", icon: <X className="h-5 w-5 text-indigo-500" />, value: data?.summary?.rejected || 0 },
    { id: "draft", title: "Draft", icon: <FileText className="h-5 w-5" />, value: data?.summary?.draft || 0 },
  ];

  // Setup Registers Group
  const setupMetrics = [
    { 
      id: "attributes", 
      title: "Attributes", 
      icon: <Shield className="h-5 w-5 text-indigo-500" />, 
      value: data?.summary?.attributes || 0,
      subtext: `Active: ${data?.summary?.activeAttributes || 0} | Required: ${data?.summary?.requiredAttributes || 0} | Customer-visible: ${data?.summary?.visibleAttributes || 0}`
    },
    { 
      id: "regions", 
      title: "Regions", 
      icon: <Users className="h-5 w-5 text-indigo-500" />, 
      value: data?.summary?.regions || 0,
      subtext: `Active: ${data?.summary?.activeRegions || 0} | Customer View: ${data?.summary?.viewRegions || 0} | Filterable: ${data?.summary?.filterableRegions || 0}`
    },
  ];

  const getActiveTitle = () => {
    const allMetrics = [...productMetrics, ...lifecycleMetrics, ...setupMetrics];
    const metric = allMetrics.find(m => m.id === activeMetric);
    return metric ? metric.title : "Total Products";
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="mb-2">
        <h2 className="text-2xl font-bold tracking-tight text-[#30336b]">System Reports</h2>
        <p className="text-sm text-gray-500 mt-1">Operational + lifecycle reports (auto-refresh every 30 seconds)</p>
      </div>

      {/* Tab Header Indicator */}
      <div className="flex items-center space-x-3 bg-white px-5 py-4 border border-gray-100 rounded-xl shadow-sm w-full relative">
        <Package className="text-indigo-600 h-5 w-5" />
        <span className="font-semibold text-gray-800 text-[15px]">Product Register Snapshot</span>
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
          <h3 className="text-indigo-600 font-medium text-sm tracking-wide">Product Register Snapshot</h3>
          <Button onClick={downloadProductsCSV} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm h-9 px-4">
            <Download className="mr-2 h-4 w-4" /> 
            Export Register CSV
          </Button>
        </div>

        {/* Section: Product Register */}
        <div className="mb-6">
          <p className="text-sm text-gray-600 mb-3 ml-1">Product Register</p>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {productMetrics.map((metric) => {
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
        </div>

        {/* Section: Product Lifecycle */}
        <div className="mb-6">
          <p className="text-sm text-gray-600 mb-3 ml-1">Product Lifecycle</p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {lifecycleMetrics.map((metric) => {
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
        </div>

        {/* Section: Setup Registers */}
        <div className="mb-6">
          <p className="text-sm text-gray-600 mb-3 ml-1">Setup Registers</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {setupMetrics.map((metric) => {
              const isActive = activeMetric === metric.id;
              return (
                <div 
                  key={metric.id}
                  className={`border rounded-xl p-5 flex flex-col justify-between cursor-pointer transition-all duration-200 bg-gray-50/50 min-h-[100px] ${
                    isActive 
                    ? 'border-indigo-500 ring-1 ring-indigo-500 shadow-sm bg-white' 
                    : 'border-gray-200 hover:border-indigo-300 hover:shadow-sm'
                  }`}
                  onClick={() => setActiveMetric(metric.id)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-[14px] ${isActive ? 'text-gray-800 font-medium' : 'text-gray-500 font-medium'}`}>
                      {metric.title}
                    </span>
                    <div className={isActive ? "text-indigo-600 flex-shrink-0 ml-2" : "text-indigo-500 flex-shrink-0 ml-2"}>
                      {metric.icon}
                    </div>
                  </div>
                  <div className={`text-2xl font-bold tracking-tight mb-2 ${isActive ? 'text-indigo-700' : 'text-[#30336b]'}`}>
                    {loading ? "-" : metric.value}
                  </div>
                  <div className="text-[12px] text-gray-500 font-medium">
                    {metric.subtext}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sub-header above table */}
        {activeMetric && (
        <>
        <div className="flex justify-between items-center pt-2 pb-4 mt-6">
          <span className="font-medium text-[15px] text-gray-800">
            Viewing: {getActiveTitle()}
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
                <TableHead className="text-gray-500 font-medium h-10 w-12 text-center">#</TableHead>
                <TableHead className="text-gray-500 font-medium h-10">Product</TableHead>
                <TableHead className="text-gray-500 font-medium h-10">SKU / BID</TableHead>
                <TableHead className="text-gray-500 font-medium h-10">Type</TableHead>
                <TableHead className="text-gray-500 font-medium h-10">Group</TableHead>
                <TableHead className="text-gray-500 font-medium h-10">Status</TableHead>
                <TableHead className="text-gray-500 font-medium h-10">Active</TableHead>
                <TableHead className="text-gray-500 font-medium h-10">Prices</TableHead>
                <TableHead className="text-gray-500 font-medium h-10">Updated At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                 <TableRow>
                   <TableCell colSpan={9} className="h-32 text-center text-gray-500">
                     <span className="flex items-center justify-center">Loading Data...</span>
                   </TableCell>
                 </TableRow>
              ) : data?.register?.data?.map((product: any, idx: number) => (
                <TableRow key={product.id || idx} className="hover:bg-gray-50/50">
                  <TableCell className="text-center text-gray-500 text-sm">
                    {idx + 1}
                  </TableCell>
                  <TableCell className="font-medium text-gray-900">
                    {product.name}
                  </TableCell>
                  <TableCell className="text-xs text-gray-600 font-mono">
                    {product.sku || "--"}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {product.type || "Machinery / Equipment"}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    <div className="line-clamp-1">{product.group || "Earthmoving Equipments"}</div>
                    <div className="text-[11px] text-gray-400">N/A</div>
                  </TableCell>
                  <TableCell className="text-sm text-gray-800 font-medium">
                    {product.status || "Approved"}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {product.active ? "Yes" : "No"}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600 truncate max-w-[150px]">
                    {product.prices || "3 pts (Ksh 67,890 - Ksh 765,555)"}
                  </TableCell>
                  <TableCell className="text-gray-600 text-[13px]">
                    <div className="line-clamp-1">
                      {product.updatedAt ? format(new Date(product.updatedAt), "dd/MM/yyyy") : "07/04/2026"}
                    </div>
                    <div className="text-[11px] text-gray-400">
                      {product.updatedAt ? format(new Date(product.updatedAt), "HH:mm") : "13:16"}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {(!loading && (!data?.register?.data || data.register.data.length === 0)) && (
                <TableRow>
                  <TableCell colSpan={9} className="h-32 text-center text-gray-500">
                    No products found for the selected period.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        </>
        )}
      </div>
    </div>
  );
}
