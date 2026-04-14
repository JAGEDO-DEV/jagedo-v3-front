import { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";

const presets = ["Today", "7d", "30d", "90d", "Custom"] as const;

interface GlobalDateRangeProps {
  onDateRangeChange?: (params: {
    period?: string;
    from?: string;
    to?: string;
  }) => void;
  initialPeriod?: string;
}

// Helper function to calculate date range dynamically
function getDateRangeForPreset(preset: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const toDate = new Date(today);
  toDate.setDate(toDate.getDate() + 1); // Tomorrow (end of today)
  
  let fromDate = new Date(today);
  
  switch (preset) {
    case "Today":
      fromDate = new Date(today);
      break;
    case "7d":
      // Last 7 days including today
      fromDate.setDate(fromDate.getDate() - 7);
      break;
    case "30d":
      // Last 30 days including today
      fromDate.setDate(fromDate.getDate() - 30);
      break;
    case "90d":
      // Last 90 days including today
      fromDate.setDate(fromDate.getDate() - 90);
      break;
    case "Custom":
      return null; // Keep existing custom dates
    default:
      break;
  }
  
  return {
    from: fromDate.toISOString().split("T")[0],
    to: toDate.toISOString().split("T")[0],
  };
}

export default function GlobalDateRange({ onDateRangeChange, initialPeriod = "90d" }: GlobalDateRangeProps) {
  // Initialize with dynamic date range
  const defaultRange = getDateRangeForPreset(initialPeriod !== "Custom" ? initialPeriod : "90d");
  
  const [selected, setSelected] = useState<string>(initialPeriod);
  const [from, setFrom] = useState(defaultRange?.from || "");
  const [to, setTo] = useState(defaultRange?.to || "");
  const [compare, setCompare] = useState(true);

  // Sync selected state when initialPeriod changes from parent
  useEffect(() => {
    setSelected(initialPeriod);
    if (initialPeriod !== "Custom") {
      const range = getDateRangeForPreset(initialPeriod);
      if (range) {
        setFrom(range.from);
        setTo(range.to);
      }
    }
  }, [initialPeriod]);

  // Convert preset button names to period strings for API
  const getPeriodFromPreset = (preset: string): string => {
    const presetMap: { [key: string]: string } = {
      Today: "today",
      "7d": "7d",
      "30d": "30d",
      "90d": "90d",
      Custom: "custom",
    };
    return presetMap[preset] || preset.toLowerCase();
  };

  // Handle preset button clicks
  const handlePresetClick = (preset: string) => {
    setSelected(preset);
    if (preset !== "Custom") {
      const range = getDateRangeForPreset(preset);
      if (range) {
        setFrom(range.from);
        setTo(range.to);
        const period = getPeriodFromPreset(preset);
        // Send both period and dates for consistency with all endpoints
        onDateRangeChange?.({ period, from: range.from, to: range.to });
      }
    } else {
      // When switching to Custom mode, send current dates with adjusted "to"
      let adjustedTo = to;
      if (to) {
        const toDate = new Date(to);
        toDate.setDate(toDate.getDate() + 1);
        adjustedTo = toDate.toISOString().split("T")[0];
      }
      onDateRangeChange?.({ from, to: adjustedTo });
    }
  };

  // Handle custom date changes - only when in Custom mode
  useEffect(() => {
    if (selected === "Custom") {
      // Add 1 day to the "to" date to include the entire day (same as presets)
      let adjustedTo = to;
      if (to) {
        const toDate = new Date(to);
        toDate.setDate(toDate.getDate() + 1);
        adjustedTo = toDate.toISOString().split("T")[0];
      }
      onDateRangeChange?.({ from, to: adjustedTo });
    }
  }, [from, to, selected, onDateRangeChange]);

  return (
    <div className="rounded-xl border border-border bg-card p-5 mb-6">
      <h3 className="font-semibold text-foreground">Global Date Range</h3>
      <p className="text-sm text-muted-foreground mt-0.5">
        Applies to summary, customers, builders, requests, web, and products analytics.
      </p>
      <div className="flex flex-wrap items-center gap-2 mt-4">
        {presets.map((p) => (
          <button
            key={p}
            onClick={() => handlePresetClick(p)}
            className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
              selected === p
                ? "border-blue-600 bg-blue-50 text-blue-600"
                : "border-border text-foreground hover:bg-muted"
            }`}
          >
            {p}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3 mt-3">
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          disabled={selected !== "Custom"}
          className="border border-border rounded-md px-3 py-1.5 text-sm bg-card text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <span className="text-sm text-muted-foreground">to</span>
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          disabled={selected !== "Custom"}
          className="border border-border rounded-md px-3 py-1.5 text-sm bg-card text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
          <Checkbox
            checked={compare}
            onCheckedChange={(v) => setCompare(!!v)}
            className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
          />
          Compare to previous period
        </label>
      </div>
    </div>
  );
}