import { X } from "lucide-react";
import { kenyanLocations } from "@/data/kenyaLocations";
import { STATUS_LABELS } from "@/data/mockBuilders";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FiltersState {
  name: string;
  phone: string;
  county: string;
  verificationStatus: string;
  search: string;
}

interface BuilderFiltersProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FiltersState;
  updateFilter: (key: string, value: string) => void;
}

export function BuilderFilters({ isOpen, onClose, filters, updateFilter }: BuilderFiltersProps) {
  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />
      <div className="fixed top-0 right-0 h-full w-full max-w-xs bg-card shadow-lg z-50 p-6 animate-slide-in-right border-l border-border">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-foreground">Filters</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="filter-name">Name</Label>
            <Input
              id="filter-name"
              type="text"
              value={filters.name}
              onChange={(e) => updateFilter("name", e.target.value)}
              placeholder="Search by name..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="filter-phone">Phone</Label>
            <Input
              id="filter-phone"
              type="text"
              value={filters.phone}
              onChange={(e) => updateFilter("phone", e.target.value)}
              placeholder="Search by phone..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="filter-county">County</Label>
            <Select
              value={filters.county || "all"}
              onValueChange={(value) => updateFilter("county", value === "all" ? "" : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Counties" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Counties</SelectItem>
                {kenyanLocations.map((location) => (
                  <SelectItem key={location.county} value={location.county}>
                    {location.county}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="filter-status">Verification Status</Label>
            <Select
              value={filters.verificationStatus || "all"}
              onValueChange={(value) => updateFilter("verificationStatus", value === "all" ? "" : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {Object.entries(STATUS_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={label}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="outline"
            className="w-full mt-4"
            onClick={() => {
              updateFilter("name", "");
              updateFilter("phone", "");
              updateFilter("county", "");
              updateFilter("verificationStatus", "");
            }}
          >
            Clear Filters
          </Button>
        </div>
      </div>
    </>
  );
}
