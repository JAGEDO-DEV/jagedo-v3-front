import React, { useState, useEffect } from "react";
import axios from "axios";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import reportsApi, { ReportFilters } from "@/api/reports.api";
import { ReportsLayout, MetricCardConfig } from "./ReportsLayout";
import { Package, Wrench, PenTool, Zap } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function ProductReports() {
  const axiosInstance = axios;
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  // Filters state
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [compareMode, setCompareMode] = useState(false);

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

      const res = await reportsApi.getProductsReport(axiosInstance, filters);
      setData(res.data);
    } catch (error) {
      console.error("Failed to fetch products report:", error);
    } finally {
      setLoading(false);
    }
  };

  const metrics: MetricCardConfig[] = data
    ? [
        {
          id: "total",
          title: "Total Products",
          value: data.summary.totalProducts,
          change: data.comparison?.totalProducts?.change,
          previousValue: data.comparison?.totalProducts?.previous,
          icon: <Package size={20} />,
        },
        {
          id: "hardware",
          title: "Hardware",
          value: data.summary.hardware,
          change: data.comparison?.hardware?.change,
          previousValue: data.comparison?.hardware?.previous,
          icon: <Wrench size={20} />,
        },
        {
          id: "custom",
          title: "Custom Products",
          value: data.summary.custom,
          change: data.comparison?.custom?.change,
          previousValue: data.comparison?.custom?.previous,
          icon: <PenTool size={20} />,
        },
        {
          id: "machinery",
          title: "Machinery",
          value: data.summary.machineryAndEquipment,
          change: data.comparison?.machineryAndEquipment?.change,
          previousValue: data.comparison?.machineryAndEquipment?.previous,
          icon: <Zap size={20} />,
        },
      ]
    : [];

  return (
    <ReportsLayout
      title="Product Snapshot"
      description="Monitor product catalog inventory, variations, and approval lifecycles."
      dateRange={dateRange}
      onDateRangeChange={setDateRange}
      compareMode={compareMode}
      onCompareModeChange={setCompareMode}
      metrics={metrics}
      loading={loading}
    >
      <div className="p-5 overflow-x-auto">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Products Register</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date Added</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.register?.data?.map((product: any) => (
              <TableRow key={product.id}>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {product.type}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-gray-500 font-mono">
                  {product.sku || "--"}
                </TableCell>
                <TableCell>
                  {product.users ? (
                    <div className="text-sm">
                      {product.users.organizationName ||
                        `${product.users.firstName} ${product.users.lastName}`}
                    </div>
                  ) : (
                    <span className="text-gray-400">System</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={product.active ? "success" : "secondary"}>
                    {product.active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell>{format(new Date(product.createdAt), "MMM dd, yyyy")}</TableCell>
              </TableRow>
            ))}
            {(!data?.register?.data || data.register.data.length === 0) && !loading && (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-gray-500">
                  No products found for the selected period.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </ReportsLayout>
  );
}
