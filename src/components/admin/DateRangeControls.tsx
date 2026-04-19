//@ts-nocheck
import React from "react";
import type { DatePreset, DateRangeState } from "@/utils/adminDateRange";
import { computePresetRange } from "@/utils/adminDateRange";

type Props = {
  value: DateRangeState;
  onChange: (next: DateRangeState) => void;
  className?: string;
};

export default function DateRangeControls({ value, onChange, className = "" }: Props) {
  const presets: { key: Exclude<DatePreset, "custom">; label: string }[] = [
    { key: "today", label: "Today" },
    { key: "7d", label: "7d" },
    { key: "30d", label: "30d" },
    { key: "90d", label: "90d" },
  ];

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <div className="flex flex-wrap items-center gap-2">
        {presets.map((preset) => (
          <button
            key={preset.key}
            type="button"
            onClick={() => onChange({ ...value, preset: preset.key, ...computePresetRange(preset.key) })}
            className={`px-3 py-2 rounded border text-sm ${
              value.preset === preset.key
                ? "bg-indigo-50 border-indigo-500 text-indigo-700 font-semibold"
                : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
            }`}
          >
            {preset.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onChange({ ...value, preset: "custom" })}
          className={`px-3 py-2 rounded border text-sm ${
            value.preset === "custom"
              ? "bg-indigo-50 border-indigo-500 text-indigo-700 font-semibold"
              : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
          }`}
        >
          Custom
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="date"
          value={value.start}
          onChange={(e) => onChange({ ...value, preset: "custom", start: e.target.value })}
          className="border rounded px-3 py-2 text-sm bg-white text-gray-700"
        />
        <span className="text-sm text-gray-500">to</span>
        <input
          type="date"
          value={value.end}
          onChange={(e) => onChange({ ...value, preset: "custom", end: e.target.value })}
          className="border rounded px-3 py-2 text-sm bg-white text-gray-700"
        />
        <label className="inline-flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={value.compare}
            onChange={(e) => onChange({ ...value, compare: e.target.checked })}
          />
          Compare to previous period
        </label>
      </div>
    </div>
  );
}
