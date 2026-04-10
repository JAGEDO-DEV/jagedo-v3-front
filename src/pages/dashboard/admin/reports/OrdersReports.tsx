import React, { useState, useEffect } from "react";
import axios from "axios";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import reportsApi, { ReportFilters } from "@/api/reports.api";
import { ReportsLayout, MetricCardConfig } from "./ReportsLayout";
import { ShoppingCart, CheckCircle, Clock, XCircle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function OrdersReports() {
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

      const res = await reportsApi.getOrdersReport(axiosInstance, filters);
      setData(res.data);
    } catch (error) {
      console.error("Failed to fetch orders report:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMetricClick = (metric: MetricCardConfig) => {
    // Map card ID to status logic
    if (metric.id === "total") {
      setStatusFilter(null);
    } else {
      setStatusFilter(metric.id.toUpperCase());
    }
  };

  const metrics: MetricCardConfig[] = data
    ? [
        {
          id: "total",
          title: "Total Orders",
          value: data.summary.totalOrders,
          change: data.comparison?.totalOrders?.change,
          previousValue: data.comparison?.totalOrders?.previous,
          icon: <ShoppingCart size={20} />,
          isActive: statusFilter === null,
        },
        {
          id: "placed",
          title: "Placed Orders",
          value: data.summary.placed,
          change: data.comparison?.placed?.change,
          previousValue: data.comparison?.placed?.previous,
          icon: <Clock size={20} />,
          isActive: statusFilter === "PLACED",
        },
        {
          id: "complete",
          title: "Completed Orders",
          value: data.summary.complete,
          change: data.comparison?.complete?.change,
          previousValue: data.comparison?.complete?.previous,
          icon: <CheckCircle size={20} />,
          isActive: statusFilter === "COMPLETE",
        },
        {
          id: "cancelled",
          title: "Cancelled Orders",
          value: data.summary.cancelled,
          change: data.comparison?.cancelled?.change,
          previousValue: data.comparison?.cancelled?.previous,
          icon: <XCircle size={20} />,
          isActive: statusFilter === "CANCELLED",
        },
      ]
    : [];

  return (
    <ReportsLayout
      title="Orders Snapshot"
      description="Monitor order progression, revenue, and historical comparisons."
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
          Orders Register {statusFilter ? `(${statusFilter})` : ""}
        </h3>
        {data?.breakdowns?.revenue && (
             <div className="mb-6 flex gap-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
                 <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Subtotal</p>
                    <p className="text-lg font-bold text-gray-900">KES {data.breakdowns.revenue.subtotal}</p>
                 </div>
                 <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Delivery Fees</p>
                    <p className="text-lg font-bold text-gray-900">KES {data.breakdowns.revenue.deliveryFees}</p>
                 </div>
                 <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Total Revenue</p>
                    <p className="text-lg text-emerald-600 font-bold">KES {data.breakdowns.revenue.total}</p>
                 </div>
             </div>
        )}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order #</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Items</TableHead>
              <TableHead className="text-right">Total Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.register?.data?.map((order: any) => (
              <TableRow key={order.orderId}>
                <TableCell className="font-medium">{order.orderNumber || `ORD-${order.orderId}`}</TableCell>
                <TableCell>{format(new Date(order.createdAt), "MMM dd, yyyy")}</TableCell>
                <TableCell>
                  <div className="text-sm font-medium">{order.customerName}</div>
                  <div className="text-xs text-gray-500">{order.customerEmail}</div>
                </TableCell>
                <TableCell>
                  <Badge variant={order.status === "COMPLETE" ? "success" : order.status === "CANCELLED" ? "destructive" : "secondary"}>
                    {order.status}
                  </Badge>
                </TableCell>
                <TableCell>{order.itemsCount}</TableCell>
                <TableCell className="text-right font-medium">KES {parseFloat(order.totalAmount || "0").toLocaleString()}</TableCell>
              </TableRow>
            ))}
            {(!data?.register?.data || data.register.data.length === 0) && !loading && (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-gray-500">
                  No orders found for the selected period.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </ReportsLayout>
  );
}
