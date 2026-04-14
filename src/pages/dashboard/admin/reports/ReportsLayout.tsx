import React, { ReactNode } from "react";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, TrendingUp } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export interface MetricCardConfig {
  id: string;
  title: string;
  value: string | number;
  change?: number; // percentage
  previousValue?: string | number;
  icon?: ReactNode;
  isActive?: boolean;
}

interface ReportsLayoutProps {
  title: string;
  description: string;
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  compareMode: boolean;
  onCompareModeChange: (compare: boolean) => void;
  metrics: MetricCardConfig[];
  onMetricClick?: (item: MetricCardConfig) => void;
  children: ReactNode;
  loading?: boolean;
}

export function ReportsLayout({
  title,
  description,
  dateRange,
  onDateRangeChange,
  compareMode,
  onCompareModeChange,
  metrics,
  onMetricClick,
  children,
  loading = false,
}: ReportsLayoutProps) {
  return (
    <div className="w-full space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">{title}</h2>
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2 bg-gray-50 px-3 py-2 rounded-xl border border-gray-100">
            <Switch
              id="compare-mode"
              checked={compareMode}
              onCheckedChange={onCompareModeChange}
            />
            <Label htmlFor="compare-mode" className="text-sm font-medium cursor-pointer">
              Compare to previous
            </Label>
          </div>
          <DatePickerWithRange date={dateRange} setDate={onDateRangeChange} />
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="rounded-2xl border border-gray-100 shadow-sm animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-100 rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))
          : metrics.map((metric) => {
              const isPositive = metric.change !== undefined && metric.change >= 0;
              return (
                <Card
                  key={metric.id}
                  onClick={() => onMetricClick?.(metric)}
                  className={`rounded-2xl border transition-all duration-200 shadow-sm overflow-hidden group ${
                    onMetricClick ? "cursor-pointer hover:shadow-md hover:border-indigo-200" : ""
                  } ${metric.isActive ? "ring-2 ring-indigo-500 border-indigo-500" : "border-gray-100"}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between border-b border-gray-50 pb-4 mb-4">
                      <p className="text-sm font-medium text-gray-500">
                        {metric.title}
                      </p>
                      {metric.icon && (
                        <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                          {metric.icon}
                        </div>
                      )}
                      {!metric.icon && (
                        <div className="p-2 bg-gray-50 rounded-lg text-gray-400">
                          <TrendingUp size={18} />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-baseline gap-2">
                        <h3 className="text-3xl font-bold text-gray-900 tracking-tight">
                        {metric.value}
                        </h3>
                    </div>

                    {compareMode && metric.change !== undefined && (
                      <div className="mt-3 flex items-center space-x-2 text-sm">
                        <span
                          className={`flex items-center font-medium ${
                            isPositive ? "text-emerald-600" : "text-rose-600"
                          } bg-${isPositive ? "emerald" : "rose"}-50 px-2 py-0.5 rounded-md`}
                        >
                          {isPositive ? (
                            <ArrowUpRight className="mr-1 h-3.5 w-3.5" />
                          ) : (
                            <ArrowDownRight className="mr-1 h-3.5 w-3.5" />
                          )}
                          {Math.abs(metric.change)}%
                        </span>
                        <span className="text-gray-400 text-xs truncate">
                          vs prev ({metric.previousValue})
                        </span>
                      </div>
                    )}
                  </CardContent>
                  {onMetricClick && (
                      <div className={`h-1 w-full transition-colors ${metric.isActive ? "bg-indigo-500" : "bg-transparent group-hover:bg-indigo-100"}`} />
                  )}
                </Card>
              );
            })}
      </div>

      {/* Main Content Area (e.g. Register Table) */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
         {children}
      </div>
    </div>
  );
}
