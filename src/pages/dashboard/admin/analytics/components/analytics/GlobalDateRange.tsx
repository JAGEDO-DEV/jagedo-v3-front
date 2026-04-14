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

export default function GlobalDateRange({ onDateRangeChange, initialPeriod = "30d" }: GlobalDateRangeProps) {
  const [selected, setSelected] = useState<string>(initialPeriod);
  const [from, setFrom] = useState("2026-01-11");
  const [to, setTo] = useState("2026-04-10");
  const [compare, setCompare] = useState(true);

  // Sync selected state when initialPeriod changes from parent
  useEffect(() => {
    setSelected(initialPeriod);
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
      const period = getPeriodFromPreset(preset);
      onDateRangeChange?.({ period });
    } else {
      // When switching to Custom mode, send current dates
      onDateRangeChange?.({ from, to });
    }
  };

  // Handle custom date changes - only when in Custom mode
  useEffect(() => {
    if (selected === "Custom") {
      onDateRangeChange?.({ from, to });
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